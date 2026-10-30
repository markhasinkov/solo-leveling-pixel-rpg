# -*- coding: utf-8 -*-
"""Минимальный writer PNG (RGB, без внешних библиотек): только struct + zlib.

Формат данных: кадр из строк RGBA, каждая строка list[(r,g,b,a)]."""
import struct, zlib


def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))


def save_png(path, w, h, rows_rgba):
    """rows_rgba: list длиной h; каждая строка — последовательность
    пикселей (r,g,b,a) длиной w. Сохраняем как RGBA PNG."""
    assert len(rows_rgba) == h, (len(rows_rgba), h)
    raw = bytearray()
    for y in range(h):
        row = rows_rgba[y]
        assert len(row) == w, ('row', y, len(row), w)
        raw.append(0)  # фильтр None
        for (r, g, b, a) in row:
            raw += bytes((r & 255, g & 255, b & 255, a & 255))
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    return len(png)


def blank(w, h, fill=(0, 0, 0, 0)):
    return [[fill for _ in range(w)] for _ in range(h)]


def _color(c):
    if isinstance(c, str):
        s = c.lstrip('#')
        return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)
    return c


def put(rows, x, y, c):
    if 0 <= y < len(rows) and 0 <= x < len(rows[0]):
        rows[y][x] = _color(c)


def rect(rows, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(rows, x, y, c)


def hx(s, a=255):
    """'#rrggbb' -> (r,g,b,a)."""
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)


def draw(rows, x0, y0, art, pal):
    """art: список строк; символ ' ' или '.' — пропуск, иначе ключ из pal."""
    for dy, line in enumerate(art):
        for dx, ch in enumerate(line):
            if ch in (' ', '.'):
                continue
            put(rows, x0 + dx, y0 + dy, pal[ch])
