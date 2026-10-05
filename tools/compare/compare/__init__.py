"""compare -- the sample (the target clip) and ours (the frames drawn with code) measured
with THE SAME code, in every frame, feature by feature.

The ground rule: every measurement carries its own deliberately broken case
(compare/calibrate.py). A measurement that cannot tell the broken case apart -- UNPROVEN.

Modules:
  project     -- the JSON config: paths, size, groups, anchor, probes
  image       -- load a frame brought to the working size (L or RGB)
  probe       -- named measurements in every frame (component, edge, area, count, tip)
  sheet       -- sheets for checking by eye (frame by frame, tied to the anchor,
                 magenta/green overlay, gridded zoom)
  motion      -- pair-by-pair block shift: motion (median) and boil (scatter)
  diff        -- difference maps between images, rhythm (cuts, trend)
  occlusion   -- where particles (snow, rain) are hidden -> the figure map
  unwarp      -- unwarp into the subject's space (centre, roll, scale are undone)
  silhouette  -- the edge of the figure mask row by row: IoU, area, the rows that differ
  calibrate   -- the broken-case test of every measurement

Manual: README.md (commands, config); the method and what was learned: METHOD.md.
"""
__version__ = "2.0.0"
