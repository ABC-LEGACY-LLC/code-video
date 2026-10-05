# s1 — the post, and what hangs off it

Fetched in the container, 2026-09-30 ~16:00 UTC, from the no-login mirror (x.com serves nothing to an agent):

- `post.json` — `https://api.fxtwitter.com/breakdown_art/status/2105192577850806751`: text (verbatim in
  `idea.md`), created Wed Sep 30 07:06:37 +0000 2026, at fetch 7 replies, 3 quotes, 118 likes, 9,971 views,
  95 bookmarks; four videos, each with an m3u8 and mp4s at 480x270 … 1920x1080 (printed by `work/post.py`).
- `conversation.json` — `https://api.fxtwitter.com/2/conversation/2105192577850806751`: 11 replies (printed by
  `work/conv.py`). The ones cited are registered on their own: the author's four-video self-reply [s2],
  Obukhov's question [s3], the author's answers [s4] [s5] [s6].
- `thread.json` — `/2/thread/…`: the post and the self-reply; the author wrote no thread.
- `quotes.json` — `https://api.fxtwitter.com/2/status/2105192577850806751/quotes`: 3 quotes (`work/quotes.py`):
  @MattiaMerenda2 "Bignnews for compositing"; @cerspense "Very excited to see some progress on temporally
  stable depth estimation. Can't wait to make it real time"; @AntonObukhov1 "Love seeing Marigold V2 adoption
  by the community!" [s7].

Replies not registered (no claim rests on them): @ATOM_VISUAL "Crazy !!", @CitizenPlain "Very cool. Look
forward to testing!", @Melison48436887 "bravo!", @Leophieudieu asking for a Hugging Face demo or open source
(answered in [s5]), @ziziran2's question and thanks (the question is quoted in `s6/post.md`).
