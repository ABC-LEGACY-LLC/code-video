# s8 — youtu.be/xbndC-dEuVw (the authors' video)

Used only to answer one question: is the post's video [s2] the authors' own? Linked from the model card ([s5]
`model-card.md:22`) and embedded on the project page ([s7] `project.html:269`).

- `yt-dlp --skip-download --print …` (image `docker.io/jauderho/yt-dlp:latest`) was refused: "Sign in to confirm
  you're not a bot". This room signs in nowhere, so the video's length and file were not obtained.
- The public oEmbed record (`oembed.json`, gitignored): title "[SIGGRAPH Asia 2026] UniMate: One Unified Model to
  Animate Diverse Skeletons", author "Linzhan Mou" (`youtube.com/@LinzhanMou`).
- The thumbnail (`hqdefault.jpg`, gitignored) is a title card: "UniMate — One Unified Model to Animate Diverse
  Skeletons — linzhanmou.com/unimate", with the SIGGRAPH Asia 2026 Kuala Lumpur logo, a Princeton shield, and
  characters that also appear in [s2] (the satellite dish, the flower, the Spot-like robot, the Gundam-like mech).
  The post's 31 s contain no such card.
