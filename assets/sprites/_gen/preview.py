# -*- coding: utf-8 -*-
"""Служебная проверка спрайтов: непрозрачные пиксели + ASCII-превью.

Запуск: python assets/sprites/_gen/preview.py sung-jin-woo beru
Без аргументов печатает только статистику всех PNG в assets/sprites.
"""
import os
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)


def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    off = 8
    w = h = None
    idat = b''
    while off < len(data):
        (ln,) = struct.unpack('>I', data[off:off + 4])
        tag = data[off + 4:off + 8]
        body = data[off + 8:off + 8 + ln]
        if tag == b'IHDR':
            w, h = struct.unpack('>II', body[:8])
            assert body[8:13] == bytes((8, 6, 0, 0, 0)), 'не RGBA'
        elif tag == b'IDAT':
            idat += body
        off += 12 + ln
    raw = zlib.decompress(idat)
    stride = w * 4 + 1
    px = [[(0, 0, 0, 0)] * w for _ in range(h)]
    prev = bytearray(w * 4)
    for y in range(h):
        ftype = raw[y * stride]
        line = bytearray(raw[y * stride + 1:(y + 1) * stride])
        bpp = 4
        if ftype == 0:
            pass
        elif ftype == 1:  # Sub
            for i in range(bpp, len(line)):
                line[i] = (line[i] + line[i - bpp]) & 255
        elif ftype == 2:  # Up
            for i in range(len(line)):
                line[i] = (line[i] + prev[i]) & 255
        elif ftype == 3:  # Average
            for i in range(len(line)):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + (a + prev[i]) // 2) & 255
        elif ftype == 4:  # Paeth
            for i in range(len(line)):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        prev = line
        for x in range(w):
            px[y][x] = tuple(line[x * 4:x * 4 + 4])
    return w, h, px


def luminance(c):
    r, g, b, a = c
    if a == 0:
        return -1
    return (r * 299 + g * 587 + b * 114) // 1000


RAMP = ' .:-=+*#%@'


def stats(path):
    w, h, px = read_png(path)
    n = sum(1 for row in px for c in row if c[3] > 0)
    colors = len(set(c for row in px for c in row if c[3] > 0))
    return w, h, n, n * 100 // (w * h), colors


def main():
    args = [a for a in sys.argv[1:] if not a.endswith('.png')]
    if not args:
        for name in sorted(os.listdir(OUT)):
            if not name.endswith('.png'):
                continue
            w, h, n, pct, colors = stats(os.path.join(OUT, name))
            print('%-28s %dx%-4d opaque=%5d (%3d%%) colors=%3d'
                  % (name, w, h, n, pct, colors))
        return
    for cid in args:
        path = os.path.join(OUT, cid + '.png')
        w, h, px = read_png(path)
        print('== %s (%dx%d) ==' % (cid, w, h))
        for y in range(0, h, 2):
            line = ''
            for x in range(w):
                l = luminance(px[y][x])
                line += ' ' if l < 0 else RAMP[min(9, (255 - l) * 10 // 256)]
            print(line)


if __name__ == '__main__':
    main()
