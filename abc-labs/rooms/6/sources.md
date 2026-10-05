# Room 6 · Dithered koi shader — its sources

What the room was given and went and got, as it registered them (`labs room source`); a claim in for.md or verdict.md cites one as [s…]. sha256 is of what was fetched when it was registered; `checked` says whether the web still had the same bytes.

| id | kind | where | title | from | added | fetched sha256 | note |
|---|---|---|---|---|---|---|---|
| s1 | post | https://x.com/cyze_dev/status/2104722854310711648?s=52 |  | alonur | 2026-09-30 15:13 | fa4a4a0fc929 |  |
| s2 | video | https://video.twimg.com/amplify_video/2104720003299745793/vid/avc1/1080x1138/_Sdm6t6G1ciQsvpY.mp4 | The post's video: dithered koi, 14.38 s, 1080x1138 | agent:researcher | 2026-09-30 15:24 | 41885bfcf8fb | tweet.media.videos[0].url in the mirror JSON of s1 |
| s3 | post | https://x.com/cyze_dev/status/2104722890516296049 | cyze_dev reply: Demo: cyze.dev/snippets/koi-dither-pond | agent:researcher | 2026-09-30 15:24 | 2009ccf084d0 | the author's reply under s1, 9 s after it; read in sources/s1/conversation.json (api.fxtwitter.com/2/conversation) |
| s4 | post | https://x.com/cyze_dev/status/2105295957826970035 | cyze_dev reply: source code with a demo in a gist | agent:researcher | 2026-09-30 15:24 | 777512bc80b4 | the author's reply under s1; read in sources/s1/conversation.json |
| s5 | post | https://x.com/cyze_dev/status/2105297121507230090 | cyze_dev reply: steering agent, two sines, turn cap, 10 spine segments, dither on top | agent:researcher | 2026-09-30 15:24 | 8f930959007c | the author's reply under s1; read in sources/s1/conversation.json |
| s6 | post | https://x.com/cyze_dev/status/2104960448605172093 | cyze_dev reply: GLSL on the GPU, JS boots WebGL and handles the mouse | agent:researcher | 2026-09-30 15:24 | 8fd0f14ddd9f | the author's reply under s1; read in sources/s1/conversation.json |
| s7 | post | https://x.com/cyze_dev/status/2104961610943004750 | cyze_dev reply: movement in JS, drawing in a shader | agent:researcher | 2026-09-30 15:25 | 6ab62581c6ef | the author's reply under s1; read in sources/s1/conversation.json |
| s8 | post | https://x.com/cyze_dev/status/2104952573140598902 | cyze_dev reply: the coming tool gives every shader's code openly and free | agent:researcher | 2026-09-30 15:25 | dab29b668da3 | the author's reply under s1; read in sources/s1/conversation.json |
| s9 | post | https://x.com/cyze_dev/status/2104968335482065115 | cyze_dev reply with a 1280x656 video | agent:researcher | 2026-09-30 15:25 | 924e83580136 | the author's reply under s1; read in sources/s1/conversation.json |
| s10 | post | https://x.com/cyze_dev/status/2104768515865784802 | cyze_dev reply: tired of relearning shaders per project, hence the site | agent:researcher | 2026-09-30 15:25 | 07bc659a457f | the author's reply under s1; read in sources/s1/conversation.json |
| s11 | post | https://x.com/cyze_dev/status/2104960086011756761 | cyze_dev reply: most shaders are horribly optimised | agent:researcher | 2026-09-30 15:25 | 882ecca809f5 | the author's reply under s1; read in sources/s1/conversation.json |
| s12 | repo | https://gist.github.com/blakecyze/fb5a6ce12207d06c82ea0b3a488244d4 | blakecyze gist: koi dither pond source + demo | agent:researcher | 2026-09-30 15:25 | 142ac63c8915 | linked by the author in s4 |
| s13 | page | https://www.cyze.dev/snippets/koi-dither-pond | cyze.dev/snippets/koi-dither-pond: the live demo | agent:researcher | 2026-09-30 15:25 | c81f87c62284 | linked by the author in s3 |
| s14 | page | https://ittybitty.dev/ | ittybitty.dev: the shader site the gist's files name | agent:researcher | 2026-09-30 15:26 |  | named in every file header of s12 (e.g. koi.js:11 https://ittybitty.dev/shaders/koi) |
| s15 | page | https://surma.dev/things/ditherpunk/ | Surma, Ditherpunk: monochrome image dithering | agent:researcher | 2026-09-30 15:33 | 9508ed0eb784 | what already exists: ordered/Bayer, blue noise, error diffusion explained |
| s16 | page | https://dukope.com/devlogs/obra-dinn/tig-32/ | Lucas Pope, Obra Dinn devlog Nov 2017: dither stability under camera motion | agent:researcher | 2026-09-30 15:33 | 29d97323e94e | what already exists: screen-space dither swims when the view moves |
| s17 | repo | https://github.com/paper-design/shaders | paper-design/shaders: WebGL shader library with dithering | agent:researcher | 2026-09-30 15:33 | 43cd68db79fa | what already exists: a published web shader library with a dither |
| s18 | repo | https://github.com/adoin/Fish-Pool | adoin/Fish-Pool: WebGL2 koi pond, no dependencies | agent:researcher | 2026-09-30 15:33 | 4b39024386f2 | what already exists: koi pond demos |
| s19 | repo | https://github.com/msk1039/nagomi | msk1039/nagomi: procedurally animated koi pond in the browser | agent:researcher | 2026-09-30 15:33 | 01e93a410c0a | what already exists: koi pond demos |
