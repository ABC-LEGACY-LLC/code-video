"""Talking to hair-server.mjs (pass 11). The same code: film.mjs frameSVG."""
import os
_HERE = os.path.dirname(os.path.abspath(__file__))
PERSONAJ_DIR = os.path.normpath(os.path.join(_HERE, '..'))         # the personaj folder (the 2D work)
import subprocess, json, os
W = (PERSONAJ_DIR)


class Server:
    def __init__(self):
        self.p = subprocess.Popen(['node', 'test/hair-server.mjs'], cwd=W, stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, text=True, bufsize=1)
        l = self.p.stdout.readline().strip()
        assert l == 'ready', l

    def render(self, i, over, out, boil=False):
        self.p.stdin.write(json.dumps({'i': i, 'over': over, 'out': out, 'boil': boil}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return out

    def geo(self, i, prm):
        self.p.stdin.write(json.dumps({'cmd': 'geo', 'i': i, 'prm': prm}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return json.loads(l[3:])

    def hoodgeo(self, i, over):
        self.p.stdin.write(json.dumps({'cmd': 'hoodgeo', 'i': i, 'over': over}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return json.loads(l[3:])

    def close(self):
        try:
            self.p.stdin.close(); self.p.wait(timeout=20)
        except Exception:
            self.p.kill()
