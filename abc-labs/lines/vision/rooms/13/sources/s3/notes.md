# [s3] the replies under the post — notes

Fetched 2026-10-01 in the room's container (`get.sh`: the mirror's `/2/conversation/<id>` and
`/2/thread/<id>`; `/2/status/<id>/quotes` answered 404) and printed as text by `conv.py`:
`replies.txt` (31 posts, 12 by the author), `thread.txt` (the post alone: **the author wrote no thread**).
The author's timeline, from `/2/profile/mirrash7/statuses`, is registered apart as [s4]
(`sources/s4/statuses.txt`).

The author's replies the verdict rests on, verbatim, with their line in `replies.txt`:

| line | asked | the author answered |
|---|---|---|
| 13–17 | "If Astra and Sam3 can already detect these things, what is the point of annotation and dataset gathering?" | "Running them in production would be too slow and expensive. Label with Astra/Sam3 then train a lightweight model" |
| 19–23 | "Why the need for all the slight variations in the angles, then?" | "This is just an example of how fast labelling can happen. Ideally I would have hundreds of images of different poles/environments/lighting to train a more generalized model" |
| 31–33 | "how many of the 1000 did you end up fixing by hand?" | "For this demo none!" |
| 35–37 | "Is that running on a 3DGS model?!" | "Nope, RF-DETR!" |
| 39–41 | "is the original scene built from photos or LiDAR?" | "It's a regular drone shot. Did turn out very clean!" |
| 55–64 | "Can you share how was this achieved?" | "This was all done in Roboflow with its agent! 1. Open agent in your workspace 2. Upload video(s) and ask it to run Astra detections then SAM 3 masks on the classes you want to find 3. Approve the labels and make changes if needed 4. Train a model. Can make a walkthrough video" |
| 76–78 | "astra can 1 shot this and do the segmentation too." | "It can but it is much more expensive" |
| 51–53 | "why are you doing this in the first place?" | "A lot of $ and manpower goes into inspecting our utilities. We can now do it faster and safer than ever before" |

Not used: thanks and praise (lines 8–11, 24–29, 44–49, 73–74), one question the author did not answer
("Sam is an affordable model ?", line 72), two replies with nothing in them (67–70).

No link to code, a notebook, a Workflow or a dataset in any reply. Counters move: the post showed 16
replies; the conversation returned 30 posts under it.
