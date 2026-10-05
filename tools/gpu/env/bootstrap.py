"""bootstrap.py -- Code-Video shared environment, ONE time (env\\setup_env.bat, or Code-Video\\setup.ps1). Every project
(Projects\\<name>\\run.bat) uses it. In this folder: venv\\ (PyTorch CUDA 12.4; CPU if no GPU), sam2_repo\\ (Meta SAM 2 code,
GitHub zip -- no git needed), ckpt\\ (sam2.1_hiera_small.pt; --large adds large), ct_repo\\ (CoTracker3 code) +
ckpt\\scaled_offline.pth (its weights, Hugging Face). Safe to run again: finished steps are skipped. Log: bootstrap_log.txt.
If an older environment exists (Documents\\tungi-sam2): MOVE its venv\\, sam2_repo\\, ckpt\\ here first, then run this --
nothing is downloaded again, only sam2's editable install path is repaired (pip install -e, seconds)."""
import os, sys, subprocess, pathlib, zipfile, urllib.request, shutil, venv

HERE = pathlib.Path(__file__).resolve().parent
os.chdir(HERE)
VENV = HERE / 'venv'
PY = VENV / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
LOG = HERE / 'bootstrap_log.txt'
log = open(LOG, 'a', encoding='utf-8')


def say(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); log.write(s + '\n'); log.flush()


def run(cmd, **kw):
    say('>', ' '.join(str(c) for c in cmd))
    r = subprocess.run([str(c) for c in cmd], **kw)
    if r.returncode != 0:
        say('!! command failed with code', r.returncode); sys.exit(r.returncode)


def have(mod):
    return subprocess.run([str(PY), '-c', 'import ' + mod], capture_output=True).returncode == 0


def download(url, dst):
    if dst.exists(): return
    say('-- download', url.split('/')[-1]); dst.parent.mkdir(exist_ok=True)
    urllib.request.urlretrieve(url, dst)


say('=== bootstrap', sys.version.split()[0], 'in', HERE)
if sys.version_info < (3, 10):
    say('!! Python 3.10+ required (you have %s).' % sys.version.split()[0]); sys.exit(1)

if not PY.exists():
    say('-- virtual environment'); venv.create(VENV, with_pip=True)
run([PY, '-m', 'pip', 'install', '-q', '-U', 'pip', 'setuptools', 'wheel'])

if not have('torch'):
    say('-- PyTorch (CUDA 12.4 build, ~2.5 GB; a few minutes)')
    run([PY, '-m', 'pip', 'install', 'torch', 'torchvision', '--index-url', 'https://download.pytorch.org/whl/cu124'])

REPO = HERE / 'sam2_repo'
if not (REPO / 'setup.py').exists():
    say('-- SAM 2 code (GitHub zip)')
    z = HERE / 'sam2_main.zip'
    urllib.request.urlretrieve('https://codeload.github.com/facebookresearch/sam2/zip/refs/heads/main', z)
    with zipfile.ZipFile(z) as zf: zf.extractall(HERE)
    shutil.move(str(HERE / 'sam2-main'), str(REPO)); z.unlink()
# in a moved venv the editable install of sam2 points at the old folder -- if it does not import, reinstall (no download)
if not have('sam2'):
    env = dict(os.environ, SAM2_BUILD_CUDA='0', SAM2_BUILD_ALLOW_ERRORS='1')
    run([PY, '-m', 'pip', 'install', '--no-build-isolation', '-e', str(REPO)], env=env)
for mod, pkg in (('numpy', 'numpy'), ('PIL', 'pillow')):
    if not have(mod): run([PY, '-m', 'pip', 'install', pkg])

CK = HERE / 'ckpt'
download('https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_small.pt', CK / 'sam2.1_hiera_small.pt')
if '--large' in sys.argv: download('https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_large.pt', CK / 'sam2.1_hiera_large.pt')

CT = HERE / 'ct_repo'
if not (CT / 'cotracker' / 'predictor.py').exists():
    say('-- CoTracker3 code (GitHub zip)')
    z = HERE / 'ct_main.zip'
    urllib.request.urlretrieve('https://codeload.github.com/facebookresearch/co-tracker/zip/refs/heads/main', z)
    with zipfile.ZipFile(z) as zf: zf.extractall(HERE)
    if CT.exists(): shutil.rmtree(CT)
    shutil.move(str(HERE / 'co-tracker-main'), str(CT)); z.unlink()
download('https://huggingface.co/facebook/cotracker3/resolve/main/scaled_offline.pth', CK / 'scaled_offline.pth')

r = subprocess.run([str(PY), '-c', 'import torch, sam2; print("torch", torch.__version__, "cuda", torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else "")'], capture_output=True, text=True)
say(r.stdout.strip() or r.stderr.strip())
say('=== ready: environment', HERE)
