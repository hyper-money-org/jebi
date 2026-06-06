#!/usr/bin/env python3
"""jebi rotating cube — /logo"""
import sys, time, math, signal

COLS, ROWS = 60, 30
PX, PY = COLS, ROWS * 2  # half-block pixel grid (~square pixels)

fg   = lambda r,g,b: f"\033[38;2;{r};{g};{b}m"
bgc  = lambda r,g,b: f"\033[48;2;{r};{g};{b}m"
RST  = "\033[0m"

BLUE  = (59,  130, 246)   # top / left faces
DBLUE = (29,  78,  216)   # right / bottom faces
DARK  = (6,   10,  18)    # front / back faces (terminal screen)
BG    = (13,  13,  20)    # background

S = 0.75  # cube half-size

# 8 vertices
V = [(-S,-S,-S),(S,-S,-S),(S,S,-S),(-S,S,-S),
     (-S,-S, S),(S,-S, S),(S,S, S),(-S,S, S)]

# (vertex indices, color, outward normal)
FACES = [
    ([4,5,6,7], DARK,  ( 0, 0, 1)),
    ([5,1,2,6], DBLUE, ( 1, 0, 0)),
    ([7,6,2,3], BLUE,  ( 0, 1, 0)),
    ([0,4,7,3], BLUE,  (-1, 0, 0)),
    ([0,1,5,4], DBLUE, ( 0,-1, 0)),
    ([1,0,3,2], DARK,  ( 0, 0,-1)),
]

def roty(v, a):
    c,s = math.cos(a), math.sin(a)
    return (v[0]*c+v[2]*s, v[1], -v[0]*s+v[2]*c)

def rotx(v, a):
    c,s = math.cos(a), math.sin(a)
    return (v[0], v[1]*c-v[2]*s, v[1]*s+v[2]*c)

def proj(v):
    x,y,z = v
    f = 3.5 / (3.5 + z)
    return (int((x*f*0.5 + 0.5) * (PX-1)),
            int((-y*f*0.5 + 0.5) * (PY-1)))

def fill_tri(p0, p1, p2, z, color, zbuf, cbuf):
    pts = sorted([p0,p1,p2], key=lambda p: p[1])
    (x0,y0),(x1,y1),(x2,y2) = pts
    def lerp(ya,yb,xa,xb,y):
        return xa if yb==ya else xa + (xb-xa)*(y-ya)/(yb-ya)
    for y in range(max(0,y0), min(PY, y2+1)):
        xl = lerp(y0,y2,x0,x2,y)
        xr = lerp(y0,y1,x0,x1,y) if y < y1 else lerp(y1,y2,x1,x2,y)
        for x in range(max(0,int(min(xl,xr))), min(PX, int(max(xl,xr))+1)):
            if z < zbuf[y][x]:
                zbuf[y][x] = z
                cbuf[y][x] = color

def render(ay, ax):
    zbuf = [[1e9]*PX for _ in range(PY)]
    cbuf = [[ BG  ]*PX for _ in range(PY)]
    verts = [rotx(roty(v, ay), ax) for v in V]

    def depth(f): return -sum(verts[i][2] for i in f[0]) / 4

    for idxs, color, nrm in sorted(FACES, key=depth):
        rn = rotx(roty(nrm, ay), ax)
        if rn[2] <= 0: continue              # backface cull
        z = sum(verts[i][2] for i in idxs) / 4
        ps = [proj(verts[i]) for i in idxs]
        fill_tri(ps[0],ps[1],ps[2], z, color, zbuf, cbuf)
        fill_tri(ps[0],ps[2],ps[3], z, color, zbuf, cbuf)

    lines = []
    for row in range(0, PY-1, 2):
        line = ""
        for col in range(PX):
            t, b = cbuf[row][col], cbuf[row+1][col]
            if t == BG and b == BG:
                line += " "
            else:
                line += fg(*t) + bgc(*b) + "▀" + RST
        lines.append(line)
    return lines

_running = True
def stop(sig=None, frm=None):
    global _running; _running = False

signal.signal(signal.SIGINT,  stop)
signal.signal(signal.SIGTERM, stop)

sys.stdout.write("\033[?25l\033[2J\033[H"); sys.stdout.flush()

ay, ax = 0.55, 0.38

try:
    while _running:
        lines = render(ay, ax)
        pad = max(0, (ROWS - len(lines)) // 2)
        buf = "\033[H"
        for _ in range(pad): buf += "\n"
        for ln in lines: buf += "    " + ln + "\n"
        buf += f"\n{RST}    \033[2mjebi  ·  ctrl+c to exit\033[0m"
        sys.stdout.write(buf); sys.stdout.flush()
        ay += 0.03
        time.sleep(0.05)
finally:
    sys.stdout.write(f"\033[?25h{RST}\033[2J\033[H"); sys.stdout.flush()
