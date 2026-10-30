# -*- coding: utf-8 -*-
"""HD-текстуры поверхностей 32x32 для восьми тематических локаций.

Пол и стена каждой локации имеют собственный рисунок: плиты храма, панели
больницы, лёд, кирпич замка, дёрн джунглей, паркет гильдии и обсидиан трона.
Текстуры бесшовны по сетке 32x32 и используются в тайловом рендере уровня.
"""
import os

from . import png

W = H = 32
put, rect, hx = png.put, png.rect, png.hx


def clamp(v):
    return 0 if v < 0 else (255 if v > 255 else v)


def shade(c, amount):
    r, g, b = c[0], c[1], c[2]
    if amount >= 0:
        return (clamp(int(r + (255 - r) * amount)), clamp(int(g + (255 - g) * amount)),
                clamp(int(b + (255 - b) * amount)), c[3])
    k = 1 + amount
    return (clamp(int(r * k)), clamp(int(g * k)), clamp(int(b * k)), c[3])


def h32(x, y, seed):
    n = (x * 374761393 + y * 668265263 + seed * 1442695040) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 255


def base_floor(pal, seed):
    rows = png.blank(W, H)
    base, light, dark, seam = pal['base'], pal['light'], pal['dark'], pal['seam']
    rect(rows, 0, 0, W - 1, H - 1, base)
    # четыре плиты 16x16 с вариацией тона
    for by in range(2):
        for bx in range(2):
            x0, y0 = bx * 16, by * 16
            tone = shade(base, (h32(bx, by, seed) % 13 - 6) / 100.0)
            rect(rows, x0 + 1, y0 + 1, x0 + 14, y0 + 14, tone)
            # фаска
            rect(rows, x0 + 1, y0 + 1, x0 + 14, y0 + 1, shade(tone, 0.16))
            rect(rows, x0 + 1, y0 + 1, x0 + 1, y0 + 14, shade(tone, 0.10))
            rect(rows, x0 + 1, y0 + 14, x0 + 14, y0 + 14, shade(tone, -0.30))
            rect(rows, x0 + 14, y0 + 1, x0 + 14, y0 + 14, shade(tone, -0.20))
            # зерно
            for k in range(5):
                px = x0 + 3 + h32(bx * 3 + k, by * 5 + k, seed + 3) % 11
                py = y0 + 3 + h32(bx * 7 + k, by * 2 + k, seed + 9) % 10
                put(rows, px, py, shade(tone, 0.08 if (k % 2) else -0.12))
    # швы
    for i in (0, 16, 31):
        rect(rows, i, 0, i, 31, seam)
        rect(rows, 0, i, 31, i, seam)
    return rows


def base_wall(pal, seed):
    rows = png.blank(W, H)
    base, light, dark, mortar = pal['base'], pal['light'], pal['dark'], pal['mortar']
    rect(rows, 0, 0, W - 1, H - 1, mortar)
    for row in range(4):
        y0 = row * 8
        offset = 0 if row % 2 == 0 else 8
        for bx in range(-1, 3):
            x0 = bx * 16 + offset
            tone = shade(base, (h32(bx, row, seed) % 15 - 7) / 100.0)
            rect(rows, x0 + 1, y0 + 1, x0 + 14, y0 + 6, tone)
            rect(rows, x0 + 1, y0 + 1, x0 + 14, y0 + 1, shade(tone, 0.18))
            rect(rows, x0 + 1, y0 + 6, x0 + 14, y0 + 6, shade(tone, -0.28))
            put(rows, x0 + 3, y0 + 3, shade(tone, 0.08))
            put(rows, x0 + 11, y0 + 4, shade(tone, -0.12))
    return rows


def themed_floor(theme, pal, seed):
    r = base_floor(pal, seed)
    accent = hx(pal['accent'])
    if theme == 'temple':
        # рунические трещины и золотые вкрапления
        for (x0, y0, x1, y1) in [(7, 5, 11, 12), (21, 18, 18, 26), (5, 25, 10, 29)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, shade(pal['dark'], -0.05))
        for (x, y) in [(3, 19), (24, 6), (28, 23), (15, 28)]:
            put(r, x, y, hx('#c8a040'))
        for i in range(4):
            put(r, 24 + i, 10 + i, accent)
    elif theme == 'cave':
        for (x0, y0, x1, y1) in [(3, 9, 9, 16), (19, 2, 15, 9), (24, 20, 29, 27)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#141b28'))
        for (x, y) in [(6, 22), (26, 14), (12, 5), (20, 28)]:
            put(r, x, y, hx('#4a566e')); put(r, x + 1, y, hx('#3a4458'))
        put(r, 25, 7, accent); put(r, 26, 7, accent); put(r, 25, 8, shade(accent, 0.3))
    elif theme == 'hospital':
        for y in (4, 12, 20, 28):
            rect(r, 2, y, 29, y, hx('#37474f'))
        rect(r, 2, 2, 14, 2, accent)
        for (x, y) in [(6, 17), (23, 9), (17, 24)]:
            put(r, x, y, shade(accent, 0.4)); put(r, x + 1, y + 1, shade(accent, 0.2))
        rect(r, 18, 2, 29, 3, shade(accent, 0.15))
    elif theme == 'ice':
        for (x0, y0, x1, y1) in [(4, 6, 12, 12), (20, 4, 15, 10), (8, 26, 22, 18)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#bfe6f7'))
        for (x, y) in [(5, 20), (26, 26), (17, 5), (28, 11)]:
            put(r, x, y, hx('#e8f7ff')); put(r, x, y + 1, accent)
        rect(r, 0, 31, 31, 31, hx('#1a3242'))
    elif theme == 'castle':
        for (x0, y0, x1, y1) in [(3, 12, 10, 18), (18, 4, 24, 10), (14, 24, 27, 19)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#6a1c26'))
        for (x, y) in [(5, 5), (23, 26), (15, 9), (27, 14)]:
            put(r, x, y, hx('#ff8a3c'))
    elif theme == 'jungle':
        for (x, y) in [(4, 6), (7, 7), (5, 8), (23, 4), (24, 5), (25, 6), (12, 23), (13, 24)]:
            put(r, x, y, hx('#5a8a4a'))
        for (x0, y0, x1, y1) in [(2, 18, 13, 26), (19, 26, 29, 20)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#16210f'))
        put(r, 26, 9, hx('#8fbf5a'))
    elif theme == 'guild':
        # паркет: длинные доски и золотая инкрустация
        rect(r, 0, 0, 31, 31, hx('#4a3828'))
        for y in (0, 8, 16, 24, 31):
            rect(r, 0, y, 31, y, hx('#2e2116'))
        for y0 in (1, 9, 17, 25):
            for x in range(0, 32, 16):
                tone = hx('#5e4834') if h32(x, y0, seed) % 2 else hx('#55402e')
                rect(r, x + 1, y0, x + 14, y0 + 6, tone)
                rect(r, x + 1, y0, x + 14, y0, shade(tone, 0.14))
                rect(r, x + 1, y0 + 6, x + 14, y0 + 6, shade(tone, -0.25))
                rect(r, x + 4, y0 + 3, x + 10, y0 + 3, shade(tone, -0.1))
        rect(r, 15, 0, 16, 31, accent)
    elif theme == 'throne':
        for (x0, y0, x1, y1) in [(5, 3, 13, 14), (22, 6, 15, 17), (7, 23, 21, 29), (27, 18, 20, 27)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, accent)
        for (x, y) in [(3, 10), (25, 22), (12, 27), (29, 4)]:
            put(r, x, y, hx('#e8c76a'))
    return r


def themed_wall(theme, pal, seed):
    r = base_wall(pal, seed)
    accent = hx(pal['accent'])
    if theme == 'temple':
        for (x, y) in [(4, 4), (20, 12), (9, 21), (25, 27)]:
            put(r, x, y, hx('#c8a040'))
        for i in range(5):
            put(r, 24 + i, 20 + (i % 2), accent)
        rect(r, 0, 30, 31, 31, hx('#1b1430'))
    elif theme == 'cave':
        for (x, y) in [(5, 3), (17, 11), (24, 18), (9, 26)]:
            put(r, x, y, accent); put(r, x + 1, y, shade(accent, -0.2))
        for (x0, y0, x1, y1) in [(2, 14, 8, 22), (21, 2, 28, 8)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#121a26'))
    elif theme == 'hospital':
        rect(r, 0, 0, 31, 3, hx('#5b727e'))
        rect(r, 1, 4, 30, 6, hx('#34454e'))
        for x in range(4, 29, 8):
            rect(r, x, 12, x + 3, 22, hx('#4f6772'))
            rect(r, x, 13, x, 21, shade(accent, -0.2))
        rect(r, 0, 27, 31, 28, hx('#2c3a42'))
        rect(r, 4, 29, 27, 30, shade(accent, -0.3))
    elif theme == 'ice':
        for (x0, y0, x1, y1) in [(3, 4, 9, 12), (20, 8, 26, 2), (14, 22, 28, 28)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#d8f4ff'))
        rect(r, 0, 0, 31, 2, hx('#9fe6ff'))
    elif theme == 'castle':
        for (x, y) in [(6, 4), (21, 6), (12, 14), (26, 22), (4, 22)]:
            put(r, x, y, hx('#ff8a3c')); put(r, x, y + 1, hx('#9a3030'))
        rect(r, 0, 0, 31, 1, hx('#6b2028'))
    elif theme == 'jungle':
        for (x, y) in [(4, 2), (5, 5), (4, 8), (22, 4), (23, 7), (27, 13), (11, 24)]:
            put(r, x, y, hx('#5a8a4a'))
        for (x0, y0, x1, y1) in [(7, 0, 3, 12), (25, 0, 29, 15), (16, 10, 13, 24)]:
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(steps + 1):
                put(r, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, hx('#3f6b33'))
    elif theme == 'guild':
        rect(r, 0, 0, 31, 2, hx('#6a5a82'))
        rect(r, 0, 3, 31, 4, hx('#2a2338'))
        for x in (5, 15, 25):
            rect(r, x, 8, x + 1, 25, hx('#2a2338'))
        rect(r, 0, 28, 31, 31, hx('#2a2338'))
        put(r, 15, 15, hx('#c8a040')); put(r, 16, 15, hx('#c8a040'))
    elif theme == 'throne':
        for i in range(6):
            put(r, 6 + i, 5 + i, accent)
            put(r, 22 - i, 24 - i, accent)
        for (x, y) in [(4, 18), (26, 9), (17, 27)]:
            put(r, x, y, hx('#e8c76a'))
        rect(r, 0, 30, 31, 31, hx('#0b0712'))
    return r


PALETTES = {
    'temple': dict(base=hx('#332a4e'), light=hx('#453a68'), dark=hx('#241c3a'), seam=hx('#161126'),
                   mortar=hx('#141024'), accent='#a06cff', seed=11),
    'cave': dict(base=hx('#2c3548'), light=hx('#3a455c'), dark=hx('#1e2636'), seam=hx('#111820'),
                 mortar=hx('#111824'), accent='#6ad7ff', seed=23),
    'hospital': dict(base=hx('#4c5f6a'), light=hx('#617987'), dark=hx('#37474f'), seam=hx('#26343b'),
                      mortar=hx('#2c3a42'), accent='#9fe6ff', seed=31),
    'ice': dict(base=hx('#2a4658'), light=hx('#3a5c72'), dark=hx('#1c3342'), seam=hx('#122836'),
                mortar=hx('#18303e'), accent='#bfe6f7', seed=41),
    'castle': dict(base=hx('#3a2028'), light=hx('#4c2a34'), dark=hx('#251216'), seam=hx('#150a0d'),
                   mortar=hx('#170b0f'), accent='#ff6a6a', seed=53),
    'jungle': dict(base=hx('#2a3a26'), light=hx('#354a2e'), dark=hx('#1b2818'), seam=hx('#111a0e'),
                   mortar=hx('#14200f'), accent='#7ec850', seed=61),
    'guild': dict(base=hx('#4a3828'), light=hx('#5e4834'), dark=hx('#2e2116'), seam=hx('#1f160e'),
                  mortar=hx('#241a10'), accent='#e8c76a', seed=71),
    'throne': dict(base=hx('#1e1830'), light=hx('#2b2348'), dark=hx('#100c1a'), seam=hx('#09060f'),
                   mortar=hx('#0b0812'), accent='#d66cff', seed=83),
}

THEMES = list(PALETTES.keys())


def generate(out_dir):
    tex_dir = os.path.join(out_dir, 'tex')
    os.makedirs(tex_dir, exist_ok=True)
    made = []
    for theme in THEMES:
        pal = PALETTES[theme]
        floor = themed_floor(theme, pal, pal['seed'])
        wall = themed_wall(theme, pal, pal['seed'] + 7)
        for kind, rows in (('floor', floor), ('wall', wall)):
            path = os.path.join(tex_dir, theme + '_' + kind + '.png')
            png.save_png(path, W, H, rows)
            made.append(path)
    return made
