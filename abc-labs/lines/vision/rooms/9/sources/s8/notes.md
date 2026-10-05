# s8 — Marigold V2 paper, arXiv 2609.08084v1

Fetched: `curl -sL https://arxiv.org/html/2609.08084v1 -o sources/s8/paper.html` in the container; text by
`python3 work/grep_html.py sources/s8/paper.html sources/s8/paper.txt <words>` (86,792 characters).

- Abstract (abs page): submitted 8 Sep 2026; comments "SIGGRAPH Asia 2026"; "a 2-stage fine-tuning protocol
  built around a novel Sinkhorn-based loss"; "16-26% improvement in AbsRel over the previous best on KITTI and
  ETH3D"; "resolves fur, foliage, and hair-thin edges".
- §3.4 "Stage-2 Refinement with SinkLoss": "we tile the image into non-overlapping K × K blocks and, within each
  block, use Sinkhorn–Knopp matching between the K² predicted depths and the K² ground-truth depths"; it
  "requires the network to produce the same set of depth values as the ground truth within each block (up to
  permutation), without strict spatial alignment."
- Introduction: "We introduce a novel Sinkhorn matching-based objective, coined SinkLoss, to improve edge
  sharpness while preserving semantic details – including fur, hair, and thin structures".
- §4.1: "All training experiments are performed on a single 32GB GPU."
- Table 6 ("Latency and memory benchmarks … on a single 32GB GPU"): "Marigold V2 (depth, ours) 1.9 16.9 9.6
  29.3" — 1.9 s and 16.9 GB at 1024×1024, 9.6 s and 29.3 GB at 2048×2048, per image.
- Video: `grep -i video` finds 7 hits, all in related work and references (Video Depth Anything; Video
  Depth Propagation); `temporal` 0 hits, `flicker` 0 hits. The paper is about single images.
