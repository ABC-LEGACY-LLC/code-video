# s11 — "CountQA: How Well Do MLLMs Count in the Wild?" (arXiv 2508.06585v2)

Read 2026-09-30. Near-verbatim through a summarising fetch.

- Best model, Gemini 2.5 Pro: "an Exact Match (EM) accuracy of only 42.9%"
- By object count, best model: 1–5 objects "60.3% EM"; 6–10 "falls to 44.0%"; 11–20 "39.3%";
  above 50 objects "the top model's accuracy falls to just 13.9%"

Bearing: a general vision-language model asked "how many cattle" over a frame of hundreds of animals is
the wrong tool; a detector/counter [s6] is the right one. GPT-6.1 Sol [s12] is not in this benchmark —
the room did not test it (no keys, no paid calls).
