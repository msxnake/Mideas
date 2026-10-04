"""Pixel-exact check of the SCREEN 5 transition engine (screen5TransitionEngine.ts).

Generates the engine + one entry per case (engine_cases.json), assembles it with
server/glass.jar and runs it on a Z80 emulator with a small V9938 model (HMMV,
palette, status registers). Every step of every fill effect is compared with
the plan from utils/msx2TransitionPatterns.ts, every palette step with the
expected interpolation, in both interrupt modes (DI runtime / EI runtime).

    pip install z80
    python test/msx2-transitions/check_tfx_engine.py
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from tfx_harness import Harness

def build(mode):
    subprocess.check_call(['node', os.path.join(HERE, 'gen_engine_test.mjs'), mode], cwd=ROOT)
    out = os.path.join(HERE, 'out')
    subprocess.check_call(['java', '-jar', os.path.join(ROOT, 'server', 'glass.jar'), os.path.join(out, 'engine_test.asm'), os.path.join(out, 'engine_test.bin')], cwd=ROOT, stdout=subprocess.DEVNULL)
    return (open(os.path.join(out, 'engine_test.bin'), 'rb').read(),
            json.load(open(os.path.join(HERE, 'engine_cases.json'))),
            json.load(open(os.path.join(out, 'engine_expected.json'))))


PAL_FROM = [0x70,0x00, 0x07,0x00, 0x00,0x07, 0x77,0x07, 0x34,0x05, 0x11,0x01, 0x60,0x03, 0x05,0x02, 0x70,0x07, 0x22,0x02, 0x43,0x01, 0x00,0x00, 0x16,0x04, 0x52,0x06, 0x25,0x03, 0x77,0x00]
PAL_TO = [0x00,0x07, 0x70,0x00, 0x07,0x07, 0x00,0x00, 0x43,0x02, 0x66,0x06, 0x01,0x01, 0x20,0x05, 0x07,0x00, 0x55,0x05, 0x34,0x06, 0x77,0x07, 0x61,0x02, 0x25,0x01, 0x52,0x04, 0x00,0x07]


def rgb(pal, i):
    return [(pal[i*2] >> 4) & 7, pal[i*2+1] & 7, pal[i*2] & 7]


def lerp(a, b, k):
    d = b - a
    if d >= 0:
        return a + ((d * k + 4) >> 3)
    return a - (((-d) * k + 4) >> 3)


def expected_step_pixels(plan, step_index, H=212):
    pix = set()
    for r in plan['steps'][step_index]:
        for ty in range(plan['tilesY']):
            for tx in range(plan['tilesX']):
                X = tx * plan['tileW'] + r['x']
                Y = ty * plan['tileH'] + r['y']
                for y in range(Y, min(Y + r['h'], H)):
                    for x in range(X, X + r['w']):
                        pix.add((x, y))
    return pix

total_failures = 0
for MODE in ('di', 'ei'):
  print(f'--- interrupts {MODE} ---')
  code, cases, expected = build(MODE)
  failures = 0
  for i, (case, exp) in enumerate(zip(cases, expected)):
      h = Harness(code)
      entry = code[i*2] | (code[i*2+1] << 8)
      spec = exp['spec']
      yoff = case.get('yoff', 0)
      # Pre-fill VRAM page with a marker colour so we can see what got painted.
      for n in range(len(h.vdp.vram)):
          h.vdp.vram[n] = 0xFF
      snapshots = []
      pal_snaps = []
      def hook(hh):
          if spec['kind'] == 'fill':
              snapshots.append(bytes(hh.vdp.vram[yoff*128:(yoff+212)*128]))
          else:
              pal_snaps.append([list(p) for p in hh.vdp.palette])
      h.frame_hook = hook
      ticks = h.call(entry)
      name = f"{i:2d} {case['node']['effect']} {case['node'].get('direction') or case['node'].get('patternId') or case['node'].get('irisShape') or ''}"
      ok = True
      msg = ''
      if spec['kind'] == 'fill':
          plan = exp['plan']
          fps = spec['framesPerStep']
          nsteps = len(plan['steps'])
          if len(snapshots) != nsteps * fps:
              ok = False; msg = f'frames {len(snapshots)} != {nsteps*fps}'
          else:
              color = spec['fillColorIndex']
              painted = set()
              for s in range(nsteps):
                  painted |= expected_step_pixels(plan, s)
                  snap = snapshots[s * fps]
                  # compare
                  for y in range(212):
                      row = snap[y*128:(y+1)*128]
                      for x in range(256):
                          b = row[x >> 1]
                          v = (b >> 4) if (x & 1) == 0 else (b & 15)
                          want = color if (x, y) in painted else 15
                          if v != want:
                              ok = False; msg = f'step {s} pixel ({x},{y}) = {v} want {want}'
                              break
                      if not ok: break
                  if not ok: break
              # nothing outside the page touched
              other = h.vdp.vram[:yoff*128] + h.vdp.vram[(yoff+212)*128:]
              if ok and any(b != 0xFF for b in other):
                  ok = False; msg = 'wrote outside the target page'
              if ok and len(painted) != 256*212:
                  ok = False; msg = f'coverage {len(painted)}'
          msg = msg or f'{nsteps} steps, {h.vdp.commands} HMMV, {ticks} T ({ticks//max(1,h.vdp.commands)} T/fill, cpu~{ticks/59736:.0f} frames)'
      else:
          eff = spec['effect']
          solid = [spec['color']['r'], spec['color']['g'], spec['color']['b']]
          fps = spec['framesPerStep']
          def seq(frm, to):
              out = []
              for k in range(1, 9):
                  out.append([[lerp(frm(i)[c], to(i)[c], k) for c in range(3)] for i in range(16)])
              return out
          frm = lambda idx: rgb(PAL_FROM, idx)
          tov = lambda idx: rgb(PAL_TO, idx)
          sol = lambda idx: solid
          if eff == 'palette_fade_out':
              want = seq(frm, sol)
          elif eff == 'palette_crossfade':
              want = seq(frm, tov)
          elif eff == 'palette_flash':
              want = []
              for _ in range(spec['flashCount']):
                  want += seq(frm, sol) + seq(sol, frm)
          got = pal_snaps[::fps]
          if len(pal_snaps) != len(want) * fps:
              ok = False; msg = f'frames {len(pal_snaps)} != {len(want)*fps}'
          else:
              for k, (g, w) in enumerate(zip(got, want)):
                  if g != w:
                      ok = False; msg = f'step {k} palette mismatch {g[:3]} vs {w[:3]}'
                      break
          msg = msg or f'{len(want)} palette steps ok'
      print(('PASS' if ok else 'FAIL'), name, '-', msg)
      failures += 0 if ok else 1
      # R#15 must be back to 0, R#17 sane
      if h.vdp.regs[15] != 0:
          print('   WARN R#15 =', h.vdp.regs[15]); failures += 1
      if h.m.sp != 0xF000:
          print('   FAIL stack imbalance sp=%04x' % h.m.sp); failures += 1
  print('failures:', failures)
  total_failures += failures
sys.exit(1 if total_failures else 0)
