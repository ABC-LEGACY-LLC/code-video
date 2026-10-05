"""The project config. No path, size or frame count is hard-coded --
everything comes from this JSON. Relative paths are relative to the folder the config file is in.

Minimal config:
{
  "name": "...",
  "sample": "/path/k%02d.png",  "sample_first": 1,     # the index that holds frame 1
  "ours":   "/path/ff/%02d.png", "ours_first": 0,
  "size": [320, 180],                                    # BOTH sides are measured at this size
  "frames": 22,
  "groups": {"shot-1": [1, 11]},                         # from 1, both ends included
  "before": "/path/ff-before/%02d.png",                  # optional: the previous state (before/after)
  "transform": "transform.json",                         # optional: for unwarp
  "anchor": {...}, "probes": [...],                      # see probe.py
  "silhouettes": [...]                                   # see silhouette.py
}
"""
import json, os


class Project:
    def __init__(self, path):
        self.path = os.path.abspath(path)
        self.folder = os.path.dirname(self.path)
        with open(path, encoding='utf-8') as f:
            self.d = json.load(f)
        d = self.d
        for k in ('sample', 'ours', 'frames'):
            if k not in d:
                raise ValueError(f"the config has no '{k}': {path}")
        self.name = d.get('name', os.path.basename(path))
        self.size = tuple(d.get('size', [320, 180]))
        self.n = int(d['frames'])
        self.groups = {k: tuple(v) for k, v in d.get('groups', {}).items()}
        self.anchor = d.get('anchor')
        self.probes = d.get('probes', [])
        self.silhouettes = d.get('silhouettes', [])
        self.settings = d.get('settings', {})

    def _p(self, p):
        return p if (p is None or os.path.isabs(p)) else os.path.join(self.folder, p)

    def file(self, side, k):
        """k -- the frame number, from 1. side: sample | ours | before"""
        pattern = self._p(self.d[side])
        first = self.d.get(side + '_first', 1 if side == 'sample' else 0)
        return pattern % (k - 1 + first)

    def has(self, side):
        return side in self.d

    def transform_path(self):
        return self._p(self.d.get('transform'))

    def group(self, name_or_range):
        """'shot-1' or '1-11' or '3' -> [frame numbers]"""
        s = str(name_or_range)
        if s in self.groups:
            a, b = self.groups[s]
            return list(range(a, b + 1))
        return parse_range(s)


def parse_range(s):
    """'1-11' -> [1..11]; '1,3,5-7' -> [1,3,5,6,7]"""
    out = []
    for q in str(s).split(','):
        q = q.strip()
        if not q:
            continue
        if '-' in q:
            a, b = q.split('-')
            out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(q))
    return out
