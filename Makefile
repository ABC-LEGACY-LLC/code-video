# code-video — convenience targets
# ─────────────────────────────────────────
#
# One long-running service: the studio (studio/server.mjs, Node only, no
# dependencies).  Everything else here is a one-shot job: building a film,
# running a suite of checks, generating the catalog page.
#
# The studio runs one of two ways, and every target below picks the right one:
#   * as a user-level systemd unit, once `make install` has been run —
#     restarts on a crash, starts on boot (this account has linger on);
#   * otherwise as a background process with a PID file in build/run/.

STUDIO_PORT ?= 4321
STUDIO_HOST ?= code-video.abclegacyllc.com
STUDIO_UNIT  = code-video-studio
UNIT_FILE    = $(HOME)/.config/systemd/user/$(STUDIO_UNIT).service
RUN_DIR      = build/run
PID_FILE     = $(RUN_DIR)/studio.pid
LOG_FILE     = $(RUN_DIR)/studio.log
STUDIO_URL   = http://127.0.0.1:$(STUDIO_PORT)/
SERVER       = $(CURDIR)/studio/server.mjs
NODE        := $(shell command -v node)
USERCTL      = XDG_RUNTIME_DIR=/run/user/$$(id -u) systemctl --user
OQ           = studio/projects/oq-kocha
ZARRA        = studio/projects/zarra

# Bare `make` shows help.  `install` changes the system (a systemd unit), so
# it must never be what an accidental `make` runs.
.DEFAULT_GOAL := help

.PHONY: help start stop restart status logs install uninstall ports expose expose-dry unexpose \
        build build-if-needed deps deps-if-needed audio \
        audit audit-fast audit-studio audit-oq-kocha audit-catalog audit-zarra \
        cards catalog notes labs clean

# ── help ─────────────────────────────────────────────

## List the common commands, then every target with its description.
help:
	@echo "code-video — common tasks"
	@echo ""
	@echo "  make start        start the studio ($(STUDIO_URL))"
	@echo "  make stop         stop the studio"
	@echo "  make restart      stop, then start"
	@echo "  make status       is the studio up, and does it answer?"
	@echo "  make logs         follow the studio log"
	@echo "  make install      run the studio as a systemd user service (survives reboots)"
	@echo "  make expose       put it on https://$(STUDIO_HOST), login through the Telegram bot (sudo)"
	@echo ""
	@echo "  make audit-fast   the quick checks (seconds)"
	@echo "  make notes        open notes a person left in the studio"
	@echo ""
	@echo "All targets:"
	@awk ' \
		/^##/ { if (doc == "" && length($$0) > 3) doc = substr($$0, 4); next } \
		/^[a-zA-Z0-9_.-]+:/ { \
			if (doc != "") { split($$0, part, ":"); printf "  %-18s %s\n", part[1], doc; doc = ""; } \
			next; \
		} \
		{ doc = "" } \
	' $(MAKEFILE_LIST)

# ── the studio ───────────────────────────────────────

## Start the studio: build the film page if needed, then the server, then wait until it answers.
start: build-if-needed
	@echo "🚀 Starting the studio..."
	@mkdir -p $(RUN_DIR)
	@if $(USERCTL) is-enabled $(STUDIO_UNIT) >/dev/null 2>&1; then \
		$(USERCTL) start $(STUDIO_UNIT); \
		echo "   ✅ $(STUDIO_UNIT) started (systemd user unit)"; \
	elif [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "   ·  already running (PID $$(cat $(PID_FILE)))"; \
	elif ss -tln 2>/dev/null | grep -q ":$(STUDIO_PORT) "; then \
		echo "   ❌ port $(STUDIO_PORT) is held by another process:"; \
		ss -tlnp 2>/dev/null | grep ":$(STUDIO_PORT) "; \
		echo "      stop it, or run on another port: make start STUDIO_PORT=4322"; \
		exit 1; \
	else \
		STUDIO_PORT=$(STUDIO_PORT) nohup $(NODE) $(SERVER) >> $(LOG_FILE) 2>&1 < /dev/null & echo $$! > $(PID_FILE); \
		echo "   ✅ started (PID $$(cat $(PID_FILE))) — log: $(LOG_FILE)"; \
	fi
	@# The server answers within a second; wait up to 15 s so a slow box does
	@# not print a false warning, and say WHAT answered.
	@ok=0; for i in $$(seq 1 30); do \
		if curl -sf --max-time 2 $(STUDIO_URL)api/works >/dev/null 2>&1; then ok=1; break; fi; \
		sleep 0.5; \
	done; \
	if [ $$ok -eq 1 ]; then \
		echo "   ✅ answering: $$(curl -s $(STUDIO_URL)api/works | grep -o '"id"' | wc -l) works listed"; \
		echo ""; \
		echo "   Open: $(STUDIO_URL)"; \
		echo "   In VS Code (browser or tunnel): Ports panel → Forward a Port → $(STUDIO_PORT),"; \
		echo "   or click the link above in the terminal and choose 'Open in Browser'."; \
	else \
		echo "   ⚠️  no answer after 15 s — see: make logs"; \
		exit 1; \
	fi

## Stop the studio (systemd unit or background process).
stop:
	@echo "🛑 Stopping the studio..."
	@if $(USERCTL) is-enabled $(STUDIO_UNIT) >/dev/null 2>&1; then \
		$(USERCTL) stop $(STUDIO_UNIT); \
		echo "   🛑 $(STUDIO_UNIT) stopped (systemd user unit)"; \
	elif [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		kill $$(cat $(PID_FILE)); \
		echo "   🛑 stopped (PID $$(cat $(PID_FILE)))"; \
	else \
		echo "   ·  it was not running"; \
	fi
	@rm -f $(PID_FILE)
	@# A server started by hand from this tree (node studio/server.mjs) has no
	@# PID file.  Only a process whose working directory or command line is THIS
	@# tree is stopped, so a studio of another checkout is never touched.
	@# Only a process whose executable is node: this recipe's own shell carries
	@# the same path in its command line and must never match.
	@for p in $$(pgrep -f '[s]erver\.mjs' 2>/dev/null); do \
		[ "$$(cat /proc/$$p/comm 2>/dev/null)" = node ] || continue; \
		cwd=$$(readlink /proc/$$p/cwd 2>/dev/null); cmd=$$(tr '\0' ' ' < /proc/$$p/cmdline 2>/dev/null); \
		if echo "$$cmd" | grep -q "$(SERVER)" || { [ "$$cwd" = "$(CURDIR)" ] && echo "$$cmd" | grep -q 'studio/server\.mjs'; } \
		   || { [ "$$cwd" = "$(CURDIR)/studio" ] && echo "$$cmd" | grep -q ' server\.mjs'; }; then \
			kill $$p && echo "   🧹 stopped a server started by hand (PID $$p)"; \
		fi; \
	done
	@sleep 0.5; if ss -tln 2>/dev/null | grep -q ":$(STUDIO_PORT) "; then \
		echo "   ⚠️  port $(STUDIO_PORT) is still held:"; ss -tlnp 2>/dev/null | grep ":$(STUDIO_PORT) "; \
	else \
		echo "   ✅ port $(STUDIO_PORT) is free"; \
	fi

## Stop, then start.
restart:
	@if $(USERCTL) is-enabled $(STUDIO_UNIT) >/dev/null 2>&1; then \
		$(MAKE) --no-print-directory build-if-needed; \
		$(USERCTL) restart $(STUDIO_UNIT); \
		echo "🔄 $(STUDIO_UNIT) restarted (systemd user unit) — $(STUDIO_URL)"; \
	else \
		$(MAKE) --no-print-directory stop; \
		$(MAKE) --no-print-directory start; \
	fi

## Is the studio up, does it answer, and how many notes are open?
status:
	@echo "📋 code-video studio"
	@if $(USERCTL) is-enabled $(STUDIO_UNIT) >/dev/null 2>&1; then \
		if $(USERCTL) is-active $(STUDIO_UNIT) >/dev/null 2>&1; then \
			echo "   ✅ $(STUDIO_UNIT): running (systemd user unit)"; \
		else \
			echo "   ❌ $(STUDIO_UNIT): stopped (systemd user unit) — make start"; \
		fi; \
	elif [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "   ✅ running (PID $$(cat $(PID_FILE)), background process)"; \
	else \
		echo "   ❌ not running — make start"; \
	fi
	@if curl -sf --max-time 2 $(STUDIO_URL)api/works >/dev/null 2>&1; then \
		echo "   ✅ answering at $(STUDIO_URL)"; \
	else \
		echo "   ⚠️  nothing answers at $(STUDIO_URL)"; \
	fi
	@code=$$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://$(STUDIO_HOST)/ 2>/dev/null); \
	case "$$code" in \
		302|401) echo "   🌐 public at https://$(STUDIO_HOST)/ (login through the Telegram bot)";; \
		200) echo "   ⚠️  public at https://$(STUDIO_HOST)/ WITHOUT a login";; \
		*)   echo "   ·  not public (make expose)";; \
	esac
	@n=$$(cat studio/notes/*.md 2>/dev/null | grep -c '^- \[ \]'); echo "   📝 open notes: $$n"

## Follow the studio log.
logs:
	@if $(USERCTL) is-enabled $(STUDIO_UNIT) >/dev/null 2>&1; then \
		journalctl --user -u $(STUDIO_UNIT) -f; \
	else \
		mkdir -p $(RUN_DIR); touch $(LOG_FILE); tail -n 50 -f $(LOG_FILE); \
	fi

## Run the studio as a systemd user unit: comes back if it dies, starts on boot. No sudo.
install:
	@test -n "$(NODE)" || { echo "❌ node not found"; exit 1; }
	@# A background copy would hold the port and make the unit fail to bind.
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		kill $$(cat $(PID_FILE)); rm -f $(PID_FILE); echo "   🛑 stopped the background copy first"; sleep 0.5; \
	fi
	@mkdir -p $(dir $(UNIT_FILE))
	@printf '%s\n' \
		'[Unit]' \
		'Description=code-video studio ($(CURDIR))' \
		'' \
		'[Service]' \
		'WorkingDirectory=$(CURDIR)' \
		'Environment=STUDIO_PORT=$(STUDIO_PORT)' \
		'ExecStart=$(NODE) $(SERVER)' \
		'Restart=always' \
		'RestartSec=2' \
		'' \
		'[Install]' \
		'WantedBy=default.target' > $(UNIT_FILE)
	@$(USERCTL) daemon-reload
	@$(USERCTL) enable --now $(STUDIO_UNIT) >/dev/null 2>&1
	@echo "✅ $(STUDIO_UNIT) installed and started — $(UNIT_FILE)"
	@echo "   make start / stop / restart / status / logs now drive the unit."

## Remove the systemd user unit; `make start` falls back to a background process.
uninstall:
	@$(USERCTL) disable --now $(STUDIO_UNIT) >/dev/null 2>&1 || true
	@rm -f $(UNIT_FILE)
	@$(USERCTL) daemon-reload
	@echo "✅ $(STUDIO_UNIT) removed"

## Put the studio on https://$(STUDIO_HOST) through Caddy; the studio asks for the bot login (sudo).
expose:
	@STUDIO_HOST=$(STUDIO_HOST) STUDIO_PORT=$(STUDIO_PORT) bash studio/deploy/expose.sh

## Check DNS and the studio, and print what `make expose` would write. Changes nothing.
expose-dry:
	@STUDIO_HOST=$(STUDIO_HOST) STUDIO_PORT=$(STUDIO_PORT) bash studio/deploy/expose.sh --dry-run

## Take the studio off its public name (asks for sudo). It keeps running locally.
unexpose:
	@STUDIO_HOST=$(STUDIO_HOST) STUDIO_PORT=$(STUDIO_PORT) bash studio/deploy/expose.sh --remove

## What is listening on the studio's port.
ports:
	@echo "   $(STUDIO_PORT)  studio (127.0.0.1 only)"
	@ss -tlnp 2>/dev/null | grep ":$(STUDIO_PORT) " || echo "   (nothing listening)"

# ── films ────────────────────────────────────────────

## Build Oq Ko'cha's film page (always).
build:
	@cd $(OQ) && npm run --silent build

## Build Oq Ko'cha's film page only when a source is newer than the built page.
build-if-needed:
	@PAGE=$(OQ)/build/oq-kocha.html; \
	if [ ! -f "$$PAGE" ]; then \
		echo "   📦 film page missing — building"; $(MAKE) --no-print-directory build; \
	elif find $(OQ)/src $(OQ)/tools -newer "$$PAGE" -print -quit 2>/dev/null | grep -q .; then \
		echo "   📦 film sources changed — rebuilding"; $(MAKE) --no-print-directory build; \
	else \
		echo "   📦 film page up to date"; \
	fi

## Render Oq Ko'cha's soundtrack offline to build/film.pcm.
audio: build-if-needed deps-if-needed
	@cd $(OQ) && npm run --silent audio

## Install the browser the checks use (Playwright), in every suite that needs it.
deps:
	@for d in $(OQ) catalog $(ZARRA) studio; do \
		echo "   📦 $$d"; (cd $$d && npm install --silent && npx playwright install chromium) || exit 1; \
	done

## Install dependencies only where node_modules is missing.
deps-if-needed:
	@missing=0; for d in $(OQ) catalog $(ZARRA) studio; do [ -d $$d/node_modules/playwright ] || missing=1; done; \
	if [ $$missing -eq 1 ]; then $(MAKE) --no-print-directory deps; else echo "   📦 dependencies present"; fi

# ── checks ───────────────────────────────────────────

## Every suite. Oq Ko'cha's renders take 45–75 minutes on a CPU-only machine.
audit: audit-studio audit-catalog audit-zarra audit-oq-kocha

## The quick checks: studio, the cards against their sources, Oq Ko'cha without a browser.
audit-fast:
	@cd studio && node test/run.mjs
	@cd catalog && node tools/card.mjs
	@cd $(OQ) && node test/run.mjs --no-browser

## The studio's own checks: the server in seconds, then the page in a browser (a few minutes).
audit-studio: deps-if-needed
	@cd studio && node test/run.mjs && node test/ui.mjs

## Oq Ko'cha: every check, renders included (long).
audit-oq-kocha: build deps-if-needed
	@cd $(OQ) && node test/run.mjs

## The catalog: cards, the measuring tool, the claims (~10 minutes).
audit-catalog: deps-if-needed
	@cd catalog && node test/run.mjs

## Zarra's particle layer (a minute or two).
audit-zarra: deps-if-needed
	@cd $(ZARRA) && node test/run.mjs

## Do the cards still agree with their sources?
cards: deps-if-needed
	@cd catalog && node tools/card.mjs

## Write the catalog page to catalog/build/style-catalog.html.
catalog: deps-if-needed
	@cd catalog && node tools/catalog.mjs

# ── people and the workshop ─────────────────────────

## The open notes a person left in the studio, per work.
notes:
	@found=0; for f in studio/notes/*.md; do \
		[ -f "$$f" ] || continue; \
		n=$$(grep -c '^- \[ \]' "$$f"); \
		if [ "$$n" -gt 0 ]; then found=1; echo "📝 $$(basename $$f .md) — $$n open"; grep '^- \[ \]' "$$f" | sed 's/^/   /'; fi; \
	done; [ $$found -eq 1 ] || echo "📝 no open notes"

## Did anything new come from the Labs workshop?
labs:
	@node abc-labs/labs.mjs rooms status

## Remove generated output (built pages, audit results, catalog page, logs). Never notes or source.
clean:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "❌ the studio is running and logs to build/ — make stop first"; exit 1; fi
	@rm -rf build $(OQ)/build catalog/build
	@echo "✅ generated output removed (source, notes and node_modules untouched)"
