# s1 — the post, and the conversation under it

Read 2026-09-30 through the no-login mirror, inside the room's container:

- `post.json` — `curl https://api.fxtwitter.com/cyze_dev/status/2104722854310711648`
- `conversation.json` — `curl https://api.fxtwitter.com/2/conversation/2104722854310711648`
  (40 replies including the nested ones; a second page by `?cursor=` answered 404, so replies
  beyond these 40, if any, were not read)

## The post, verbatim (data)

> Continuing my shader streak, here are some dithered koi.
>
> - 14.5 KB
> - 0.1 ms of JS time per frame
>
> Built using my lil' shader site that will be releasing soon.

Blake (@cyze_dev, "Lead Product Engineer @PlayAvatone", website cyze.dev, Ontario), created
`Tue Sep 29 00:00:06 +0000 2026`. At fetch: 23 replies, 1 quote, 798 likes, 22 reposts, 431
bookmarks, 20,225 views. Not a reply, quotes nothing. One video (s2).

**The claims the verdict answers:** (1) 14.5 KB; (2) 0.1 ms of JS per frame; (3) made with a
shader site of the author's, not yet released.

## The author's own replies, cited separately (each registered)

| src | status id | time (UTC) | text, verbatim |
|---|---|---|---|
| s3 | 2104722890516296049 | 09-29 00:00:15 | "Demo: https://www.cyze.dev/snippets/koi-dither-pond" |
| s4 | 2105295957826970035 | 09-30 13:57 | "Sadly I don't have enough spare time for a tutorial but you can find the source code with a demo here: https://gist.github.com/blakecyze/fb5a6ce12207d06c82ea0b3a488244d4" |
| s5 | 2105297121507230090 | 09-30 14:02 | "Each fish has its own tiny steering agent, with two slow sine waves impacting them the most. I put a cap on their turn rate so it's more organic. Its head leaves a trail of positions and we walk along that to place its 10 spine segments so the body follows the same path. The shader receives these points and builds the body, then applies the dither overtop 👌" |
| s6 | 2104960448605172093 | 09-29 15:44 | "Haha the shader itself is still GLSL running on the GPU, JS is just the delivery driver, booting it up through WebGL and handling the mouse positioning." |
| s7 | 2104961610943004750 | 09-29 15:48 | "Love that! Movement in JS, drawing in a shader. Give each swan a little steering sim, then draw it as simple shapes: an oval body and a curved neck. …" |
| s8 | 2104952573140598902 | 09-29 15:12 | "Do anything you like with them! I'm building a tool that can make things like this and it'll provide the code for any of the shaders openly and for free so I'm not planning on gatekeeping anything 😁" |
| s9 | 2104968335482065115 | 09-29 16:15 | "It is ADDICTING honestly... you can do SO much" + a 38 s video (see s9/frames.md) |
| s10 | 2104768515865784802 | 09-29 03:01 | "Haha yeah I got tired of relearning them for every project so that's why I've been working on this behind the scenes 😭" |
| s11 | 2104960086011756761 | 09-29 15:42 | "They are SO fun to tinker with- go for it! I've found them to largely be hype from the perspective of design, however. Most of the time they are HORRIBLY optimised. …" |

Others in the thread (not registered, not cited as facts): one replier notes a "fish pond trend
all over my tl" (2105300684665196827); another links their own IK-based fish animation
(2105308830112608743).

**The quote post** (count 1) was not found: the mirror does not list quoting posts and x.com
gives an agent nothing. Not pursued further — nothing in the thread suggests it matters.
