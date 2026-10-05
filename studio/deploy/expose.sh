#!/usr/bin/env bash
# Put the studio on a public name through this server's Caddy. The studio itself asks
# for the login (a Telegram bot, see studio/auth.mjs); this script refuses to expose a
# studio whose login is not on.
#
#   make expose        # https://code-video.abclegacyllc.com  (asks for sudo)
#   make expose-dry    # check everything and print what would be written; changes nothing
#   make unexpose      # take it off the public name again
#
# What it changes -- all of it outside this repository, which is why it needs sudo:
#   /etc/caddy/code-video.caddy   the site block (root:caddy 0640)
#   /etc/caddy/Caddyfile          one line: import /etc/caddy/code-video.caddy
# The Labs file (/home/abcdev/labs/var/Caddyfile) is never touched: `labs render`
# rewrites it, and a block written there would vanish on the next render.
#
# Caddy is reloaded only after `caddy validate` accepts the whole configuration.
# If it does not, both files are put back exactly as they were.
set -euo pipefail

HOST="${STUDIO_HOST:-code-video.abclegacyllc.com}"
PORT="${STUDIO_PORT:-4321}"
SITE=/etc/caddy/code-video.caddy
MAIN=/etc/caddy/Caddyfile
LINE="import $SITE"
MODE="${1:-}"
STAMP=$(date +%Y%m%d-%H%M%S)

say(){ printf '%s\n' "$*"; }
die(){ printf '   ❌ %s\n' "$*" >&2; exit 1; }

command -v caddy >/dev/null || die "caddy is not installed on this machine"

# ── the site block ───────────────────────────────────
# `encode` is kept off the event stream: the studio's live updates are one small
# message at a time, and a compressor may hold them back until its buffer fills.
# X-Frame-Options is SAMEORIGIN, not DENY: the studio shows each work in an iframe
# of its own origin, and DENY would blank the stage.
block(){
	printf '%s\n' \
		"# Written by code-video (studio/deploy/expose.sh) on $STAMP — 'make unexpose' removes it." \
		"# The login is the studio's own (Telegram bot); Caddy only carries the traffic." \
		"$HOST {" \
		"	@compressible not path /api/events" \
		"	encode @compressible zstd gzip" \
		"	reverse_proxy 127.0.0.1:$PORT" \
		"	header {" \
		"		X-Content-Type-Options nosniff" \
		"		Referrer-Policy no-referrer" \
		"		X-Frame-Options SAMEORIGIN" \
		"		Strict-Transport-Security \"max-age=31536000\"" \
		"		-Server" \
		"	}" \
		"}"
}

validate_or_restore(){ # restores both files from the backups if the whole config is rejected
	local err; err=$(mktemp)
	if sudo caddy validate --config "$MAIN" --adapter caddyfile >"$err" 2>&1; then rm -f "$err"; return 0; fi
	say "   ❌ caddy validate rejected the configuration — putting both files back"
	tail -5 "$err" | sed 's/^/      /'; rm -f "$err"
	sudo cp -p "$MAIN.bak-$STAMP" "$MAIN"
	if [ -f "$SITE.bak-$STAMP" ]; then sudo cp -p "$SITE.bak-$STAMP" "$SITE"; else sudo rm -f "$SITE"; fi
	exit 1
}

backup(){
	sudo cp -p "$MAIN" "$MAIN.bak-$STAMP"
	if sudo test -f "$SITE"; then sudo cp -p "$SITE" "$SITE.bak-$STAMP"; fi
	say "   🗂  backed up: $MAIN.bak-$STAMP"
}

wait_public(){ # $1 = the status code that means "done"
	say "   🔍 waiting for https://$HOST/ (a first certificate can take a minute)"
	for i in $(seq 1 60); do
		code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "https://$HOST/" || true)
		if [ "$code" = "$1" ]; then say "      → $code after ${i}s"; return 0; fi
		sleep 2
	done
	say "   ⚠️  no $1 from https://$HOST/ yet (last: $code) — see: journalctl -u caddy -n 50"
	return 1
}

# ── unexpose ─────────────────────────────────────────
if [ "$MODE" = "--remove" ]; then
	say "🌐 Taking the studio off https://$HOST/"
	grep -qxF "$LINE" "$MAIN" || [ -e "$SITE" ] || { say "   ·  it was not exposed"; exit 0; }
	sudo -v || die "sudo was not granted — nothing changed"
	backup
	sudo sed -i "\|^${LINE}\$|d" "$MAIN"
	sudo rm -f "$SITE"
	validate_or_restore
	sudo systemctl reload caddy
	say "   ✅ removed; Caddy reloaded. The studio still runs on 127.0.0.1:$PORT."
	exit 0
fi

# ── expose: check first, change nothing yet ──────────
say "🌐 Exposing the studio at https://$HOST/"
PUBLIC_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="src") print $(i+1)}')
DNS_IP=$(getent hosts "$HOST" | awk '{print $1; exit}')
[ -n "$DNS_IP" ] || die "$HOST does not resolve yet — add an A record pointing to $PUBLIC_IP"
[ "$DNS_IP" = "$PUBLIC_IP" ] || die "$HOST points to $DNS_IP, but this server is $PUBLIC_IP — Caddy could not get a certificate"
say "   ✅ DNS: $HOST → $DNS_IP (this server)"
curl -sf --max-time 3 "http://127.0.0.1:$PORT/api/works" >/dev/null \
	|| die "the studio does not answer on 127.0.0.1:$PORT — run: make install"
say "   ✅ the studio answers on 127.0.0.1:$PORT"
# The request Caddy will send, without a session: it has to be refused. 200 would mean
# an open studio on the internet; 503 means the bot token or the owners are missing.
gate=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -H 'X-Forwarded-For: 203.0.113.9' -H "Host: $HOST" "http://127.0.0.1:$PORT/api/works")
case "$gate" in
	401) say "   ✅ login is on: an outside request without a session is refused";;
	503) die "login is not set up: TELEGRAM_BOT_TOKEN and TELEGRAM_OWNER_IDS in .env, then: make restart";;
	*)   die "an outside request got $gate, not 401 — the studio would be open to everyone. Not exposing.";;
esac

if [ "$MODE" = "--dry-run" ]; then
	say ""
	say "   Would write $SITE (root:caddy 0640):"
	block | sed 's/^/      /'
	if grep -qxF "$LINE" "$MAIN"; then say "   $MAIN already imports it."; else say "   Would append to $MAIN:  $LINE"; fi
	say "   Then: caddy validate, and only then systemctl reload caddy. Nothing was changed."
	exit 0
fi

# ── write, validate, reload ──────────────────────────
sudo -v || die "sudo was not granted — nothing changed"
backup
TMP=$(mktemp); block > "$TMP"
sudo install -m 0640 -o root -g caddy "$TMP" "$SITE"; rm -f "$TMP"
say "   ✅ wrote $SITE"
if grep -qxF "$LINE" "$MAIN"; then
	say "   ·  $MAIN already imports it"
else
	printf '%s\n' "$LINE" | sudo tee -a "$MAIN" >/dev/null
	say "   ✅ added to $MAIN: $LINE"
fi
validate_or_restore
say "   ✅ caddy validate: the whole configuration is valid"
sudo systemctl reload caddy
say "   ✅ Caddy reloaded"
if wait_public 302; then
	say ""
	say "   🎉 https://$HOST/ — send /login to the studio's Telegram bot, then tap the link"
	say "   To take it off again: make unexpose"
fi
