"""soch-server.mjs bilan gaplashish (11-o'tish). Bir xil kod: film.mjs kadrSVG."""
import subprocess, json, os
W = '/home/claude/work/personaj'


class Server:
    def __init__(self):
        self.p = subprocess.Popen(['node', 'test/soch-server.mjs'], cwd=W, stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, text=True, bufsize=1)
        l = self.p.stdout.readline().strip()
        assert l == 'tayyor', l

    def render(self, i, ust, chiq, qaynash=False):
        self.p.stdin.write(json.dumps({'i': i, 'ust': ust, 'chiq': chiq, 'qaynash': qaynash}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return chiq

    def geo(self, i, prm):
        self.p.stdin.write(json.dumps({'cmd': 'geo', 'i': i, 'prm': prm}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return json.loads(l[3:])

    def kapgeo(self, i, ust):
        self.p.stdin.write(json.dumps({'cmd': 'kapgeo', 'i': i, 'ust': ust}) + '\n')
        self.p.stdin.flush()
        l = self.p.stdout.readline().strip()
        if not l.startswith('ok '):
            raise RuntimeError(l)
        return json.loads(l[3:])

    def yop(self):
        try:
            self.p.stdin.close(); self.p.wait(timeout=20)
        except Exception:
            self.p.kill()
