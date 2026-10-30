# -*- coding: utf-8 -*-
"""Фоны локаций 320x180, часть 1: двойное подземелье, E-ранг, больница."""
from . import png

W, H = 320, 180
HD_SCALE = 2


def hd_upscale(rows, factor=HD_SCALE):
    """Плавный 2x-апскейл с микросветотенью, чтобы фон не выглядел растянутым."""
    out = png.blank(W * factor, H * factor)
    for y in range(H):
        for x in range(W):
            c = rows[y][x]
            for oy in range(factor):
                for ox in range(factor):
                    n = (x * 17 + y * 29 + ox * 5 + oy * 11) % 9 - 4
                    k = 1 + n / 100.0
                    r, g, b, a = c
                    out[y * factor + oy][x * factor + ox] = (
                        min(255, max(0, int(r * k))),
                        min(255, max(0, int(g * k))),
                        min(255, max(0, int(b * k))),
                        a
                    )
    return out


def vgrad(r, y0, y1, c0, c1):
    """Вертикальный градиент от c0 до c1 между строками y0..y1."""
    (r0, g0, b0, _) = c0; (r1, g1, b1, _) = c1
    n = max(1, y1 - y0)
    for i in range(n + 1):
        t = i / n
        c = (int(r0 + (r1 - r0) * t), int(g0 + (g1 - g0) * t),
             int(b0 + (b1 - b0) * t), 255)
        y = y0 + i
        if 0 <= y < H:
            rect(r, 0, y, W - 1, y, c)


def floor_line(r, y, c, step=8, w=3):
    for x in range(0, W, step):
        rect(r, x, y, x + w, y, c)


rect, put, hx = png.rect, png.put, png.hx


def bg_double_dungeon():
    """Огромный храм-подземелье: статуи по бокам, фиолетовое свечение."""
    r = png.blank(W, H, (10, 8, 18, 255))
    vgrad(r, 0, 120, hx('#171226'), hx('#241a3a'))
    rect(r, 0, 120, W - 1, 179, hx('#1c1628'))          # пол
    # дальняя колоннада
    for x in range(10, W - 10, 44):
        rect(r, x, 40, x + 10, 120, hx('#241e33'))
        rect(r, x, 36, x + 12, 40, hx('#2e2640'))
    # статуя-бог слева (большая)
    rect(r, 24, 30, 78, 34, hx('#5a5c6e'))
    rect(r, 30, 12, 72, 30, hx('#54566a'))
    rect(r, 36, 16, 42, 22, hx('#7a2030'))              # красный глаз
    rect(r, 60, 16, 66, 22, hx('#7a2030'))
    rect(r, 40, 26, 62, 28, hx('#443a55'))
    rect(r, 20, 34, 82, 40, hx('#4a4458'))              # пьедестал
    rect(r, 16, 40, 86, 44, hx('#3c3648'))
    # статуя-судья справа
    rect(r, 240, 34, 296, 38, hx('#5a5c6e'))
    rect(r, 248, 18, 288, 34, hx('#54566a'))
    rect(r, 254, 22, 260, 27, hx('#8a2a34'))
    rect(r, 276, 22, 282, 27, hx('#8a2a34'))
    rect(r, 236, 38, 300, 44, hx('#4a4458'))
    # алтарь и свечение в центре
    rect(r, 148, 92, 172, 120, hx('#2c2440'))
    rect(r, 144, 116, 176, 124, hx('#241e33'))
    for dy in range(46):
        t = dy / 46
        rad = int(4 + 18 * t)
        y = 46 + dy
        c = (int(0x9a - 60 * t), int(0x6c - 40 * t), int(0xff - 30 * t), 255)
        rect(r, 160 - rad, y, 160 + rad, y, c)
    # частицы
    for (x, y) in [(60, 60), (120, 40), (200, 55), (260, 70), (290, 30), (90, 90)]:
        put(r, x, y, hx('#c8b4ff')); put(r, x + 1, y, hx('#8a6cff'))
    floor_line(r, 126, hx('#2a2340')); floor_line(r, 150, hx('#252038'))
    return r


def bg_e_rank_dungeon():
    """Пещера E-ранга: серо-синие сталактиты, кристаллы."""
    r = png.blank(W, H, (18, 22, 32, 255))
    vgrad(r, 0, 130, hx('#232a3a'), hx('#2e3548'))
    rect(r, 0, 130, W - 1, 179, hx('#252b3a'))          # пол
    # сталактиты сверху
    for x in range(0, W, 24):
        h = 14 + (x * 7) % 22
        for i in range(h):
            wdt = max(1, (h - i) // 3)
            rect(r, x + 6 - wdt, i, x + 6 + wdt, i, hx('#2c3244'))
    # сталагмиты снизу
    for x in range(12, W, 40):
        h = 10 + (x * 5) % 16
        for i in range(h):
            wdt = max(1, (h - i) // 3)
            rect(r, x - wdt, 130 + h - i, x + wdt, 130 + h - i, hx('#282e40'))
    # кристаллы
    for (x, y, c) in [(40, 120, '#59d6c8'), (150, 60, '#59a8d6'),
                      (250, 118, '#8a6cff'), (300, 70, '#59d6c8')]:
        rect(r, x, y, x + 4, y + 6, hx(c))
        put(r, x + 1, y + 1, hx('#e8fffc'))
    # вход-арка слева
    rect(r, 6, 90, 10, 130, hx('#1e2330')); rect(r, 26, 90, 30, 130, hx('#1e2330'))
    rect(r, 6, 86, 30, 90, hx('#1e2330'))
    rect(r, 11, 92, 25, 130, hx('#12151f'))
    floor_line(r, 138, hx('#2c3244')); floor_line(r, 160, hx('#292f42'))
    return r


def bg_hospital():
    """Больничная палата: окна, койка, монитор."""
    r = png.blank(W, H, (222, 228, 236, 255))
    vgrad(r, 0, 120, hx('#e6ecf4'), hx('#d4dbe6'))
    rect(r, 0, 120, W - 1, 179, hx('#b8c2d0'))         # пол
    rect(r, 0, 116, W - 1, 119, hx('#9aa6b8'))         # плинтус
    # окна
    for wx in (40, 140, 240):
        rect(r, wx, 20, wx + 40, 70, hx('#8fc4e8'))
        vgrad(r, 21, 69, hx('#a8d8f0'), hx('#c8e8f8'))
        rect(r, wx, 20, wx + 40, 22, hx('#c8d2de'))
        rect(r, wx + 19, 20, wx + 21, 70, hx('#c8d2de'))
        rect(r, wx, 44, wx + 40, 46, hx('#c8d2de'))
        # солнечный блик
        rect(r, wx + 6, 28, wx + 12, 40, hx('#e8f6ff'))
    # койка
    rect(r, 60, 130, 150, 134, hx('#8a94a4'))
    rect(r, 62, 122, 148, 130, hx('#eef2f8'))          # матрас
    rect(r, 64, 118, 84, 122, hx('#ffffff'))           # подушка
    rect(r, 58, 134, 62, 150, hx('#6e7888'))
    rect(r, 148, 134, 152, 150, hx('#6e7888'))
    # капельница
    rect(r, 170, 100, 172, 150, hx('#9aa6b8'))
    rect(r, 166, 92, 176, 102, hx('#d8e4f0'))
    rect(r, 170, 102, 171, 122, hx('#8fc4e8'))
    # монитор с пульсом
    rect(r, 220, 110, 280, 140, hx('#2a3038'))
    rect(r, 224, 114, 276, 136, hx('#0e1a14'))
    pts = [(228, 128), (236, 128), (240, 118), (244, 132), (248, 126), (262, 126), (270, 122)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        for xx in range(x0, x1 + 1):
            yy = y0 + (y1 - y0) * (xx - x0) // max(1, x1 - x0)
            put(r, xx, yy, hx('#4ce87a'))
    # дверь
    rect(r, 300, 60, 318, 119, hx('#b09884'))
    rect(r, 304, 64, 314, 116, hx('#c4b0a0'))
    put(r, 312, 92, hx('#5d4a52'))
    return r


BGS1 = {
    'bg_double-dungeon': bg_double_dungeon,
    'bg_e-rank-dungeon': bg_e_rank_dungeon,
    'bg_hospital': bg_hospital,
}


def generate(out_dir):
    import os
    made = []
    for name, fn in BGS1.items():
        path = os.path.join(out_dir, name + '.png')
        png.save_png(path, W * HD_SCALE, H * HD_SCALE, hd_upscale(fn()))
        made.append(path)
    return made
