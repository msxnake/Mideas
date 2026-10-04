"""Minimal MSX2 harness: Z80 (z80 package) + V9938 subset (regs, status, HMMV,
palette) to verify the SCREEN 5 transition engine output.

Usage from Python:
    h = Harness(bin_bytes, org=0x8000)
    h.run(entry_label_addr)
Debug port #FE: every OUT marks a frame (harness snapshots state).
"""
import z80


class Vdp:
    def __init__(self):
        self.regs = [0] * 64
        self.latch = None
        self.vram = bytearray(0x20000)  # 128KB, SCREEN5 4bpp, 128 bytes/line
        self.palette = [[0, 0, 0] for _ in range(16)]  # r,g,b
        self.pal_latch = None
        self.commands = 0
        self.log = []

    # port #99
    def write_ctrl(self, value):
        if self.latch is None:
            self.latch = value
            return
        first = self.latch
        self.latch = None
        if value & 0x80:
            reg = value & 0x3F
            self.write_reg(reg, first)
        # else: VRAM address setup, ignored

    def write_reg(self, reg, value):
        self.regs[reg] = value
        if reg == 16:
            self.pal_latch = None
        if reg == 46:
            self.execute(value)

    def read_status(self):
        self.latch = None
        s = self.regs[15] & 0x0F
        if s == 2:
            return 0x00  # CE = 0 always (commands are instantaneous here)
        if s == 0:
            return 0x80  # frame flag set
        return 0

    # port #9B
    def write_indirect(self, value):
        reg = self.regs[17] & 0x3F
        self.write_reg(reg, value)
        if not (self.regs[17] & 0x80):
            self.regs[17] = (self.regs[17] & 0x80) | ((reg + 1) & 0x3F)

    # port #9A
    def write_palette(self, value):
        if self.pal_latch is None:
            self.pal_latch = value
            return
        first = self.pal_latch
        self.pal_latch = None
        index = self.regs[16] & 0x0F
        self.palette[index] = [(first >> 4) & 7, value & 7, first & 7]
        self.regs[16] = (index + 1) & 0x0F

    def word(self, reg):
        return self.regs[reg] | (self.regs[reg + 1] << 8)

    def execute(self, cmd):
        op = cmd & 0xF0
        self.commands += 1
        if op == 0xC0:  # HMMV
            dx = self.word(36) & 0x1FF
            dy = self.word(38) & 0x3FF
            nx = self.word(40) & 0x1FF
            ny = self.word(42) & 0x3FF
            clr = self.regs[44]
            if nx == 0:
                nx = 512
            if ny == 0:
                ny = 1024
            self.log.append(('HMMV', dx, dy, nx, ny, clr))
            bx = dx >> 1
            bn = nx >> 1
            for y in range(dy, dy + ny):
                for b in range(bx, bx + bn):
                    if b >= 128:
                        raise AssertionError(f'HMMV x overflow dx={dx} nx={nx}')
                    self.vram[(y & 0x3FF) * 128 + b] = clr
        else:
            raise AssertionError(f'unexpected VDP command {cmd:#x}')

    def pixel(self, x, y):
        byte = self.vram[y * 128 + (x >> 1)]
        return (byte >> 4) if (x & 1) == 0 else (byte & 0x0F)


class Harness:
    def __init__(self, code: bytes, org=0x8000):
        self.m = z80.Z80Machine()
        self.m.set_memory_block(org, code)
        self.vdp = Vdp()
        self.frames = []
        self.frame_hook = None
        self.m.set_output_callback(self._out)
        self.m.set_input_callback(self._in)
        self.done = False

    def _out(self, port, value):
        p = port & 0xFF
        if p == 0x99:
            self.vdp.write_ctrl(value)
        elif p == 0x9A:
            self.vdp.write_palette(value)
        elif p == 0x9B:
            self.vdp.write_indirect(value)
        elif p == 0xFE:
            if self.frame_hook:
                self.frame_hook(self)
            self.frames.append(1)
        elif p == 0xFF:
            self.done = True
        else:
            raise AssertionError(f'unexpected OUT {p:#x}')

    def _in(self, port):
        p = port & 0xFF
        if p == 0x99:
            return self.vdp.read_status()
        raise AssertionError(f'unexpected IN {p:#x}')

    def call(self, addr, sp=0xF000, regs=None, max_ticks=500_000_000):
        m = self.m
        # push return address = stop stub at 0x0000 (OUT (#FF),A ; HALT)
        m.set_memory_block(0x0000, bytes([0xD3, 0xFF, 0x76]))
        m.sp = sp - 2
        m.set_memory_block(sp - 2, bytes([0x00, 0x00]))
        m.pc = addr
        for k, v in (regs or {}).items():
            setattr(m, k, v)
        self.done = False
        ticks = 0
        while not self.done:
            m.ticks_to_stop = 1_000_000
            m.run()
            ticks += 1_000_000 - m.ticks_to_stop
            if m.halted and not self.done:
                raise AssertionError(f'HALT outside stub at pc={m.pc:#x}')
            if ticks > max_ticks:
                raise AssertionError('timeout')
        return ticks
