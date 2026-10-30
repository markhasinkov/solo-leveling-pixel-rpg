# -*- coding: utf-8 -*-
"""Дополнительные HD-фоны: демонический замок и тронный зал Монарха."""
from . import png
from .bgs1 import W, H, vgrad, floor_line, hd_upscale, HD_SCALE

rect, put, hx = png.rect, png.put, png.hx


def bg_theme_castle():
    """Демонический замок: багровые окна, колонны, канделябры, трон."""
    r = png.blank(W, H, (20, 8, 12, 255))
    vgrad(r, 0, 118, hx('#1c0a10'), hx('#3a1018'))
    rect(r, 0, 118, W - 1, 179, hx('#241218'))
    # дальние окна с багровым светом
    for wx in (26, 130, 234):
        rect(r, wx, 22, wx + 58, 96, hx('#15070c'))
        rect(r, wx + 4, 26, wx + 54, 88, hx('#7a1824'))
        vgrad(r, 27, 87, hx('#c03a34'), hx('#5a0e18'))
        rect(r, wx + 28, 26, wx + 30, 88, hx('#2a0c12'))
        rect(r, wx + 4, 56, wx + 54, 58, hx('#2a0c12'))
        # витражный ромб
        for i in range(12):
            put(r, wx + 29 - i // 2, 30 + i, hx('#ff8a3c'))
            put(r, wx + 29 + i // 2, 30 + i, hx('#ff8a3c'))
    # колонны
    for x in (6, 88, 196, 286):
        rect(r, x, 30, x + 14, 118, hx('#2a1118'))
        rect(r, x + 2, 30, x + 4, 118, hx('#4a1c24'))
        rect(r, x - 3, 26, x + 17, 31, hx('#3a1620'))
        rect(r, x - 3, 114, x + 17, 119, hx('#3a1620'))
        # золотые капители
        rect(r, x + 4, 32, x + 10, 34, hx('#c8a040'))
        rect(r, x + 4, 112, x + 10, 114, hx('#c8a040'))
    # трон в глубине
    rect(r, 136, 58, 184, 118, hx('#1a0a10'))
    rect(r, 140, 52, 180, 60, hx('#2a0f18'))
    rect(r, 146, 46, 150, 58, hx('#c8a040'))
    rect(r, 170, 46, 174, 58, hx('#c8a040'))
    rect(r, 158, 38, 162, 50, hx('#c8a040'))
    rect(r, 144, 62, 176, 66, hx('#5a1420'))
    # знамёна
    for x in (20, 264):
        rect(r, x, 26, x + 2, 96, hx('#3a2a1a'))
        rect(r, x + 3, 28, x + 22, 70, hx('#6a101c'))
        rect(r, x + 3, 34, x + 22, 36, hx('#c8a040'))
        rect(r, x + 9, 44, x + 16, 52, hx('#2a0a10'))
    # канделябры / огни
    for x in (112, 208):
        rect(r, x, 66, x + 2, 96, hx('#3a2a1a'))
        for dx in (-5, 0, 5):
            rect(r, x + dx, 62, x + dx + 1, 66, hx('#ffb36a'))
            put(r, x + dx, 60, hx('#fff0b0'))
    # пол
    rect(r, 0, 118, W - 1, 119, hx('#4a1c24'))
    for y in range(122, 180, 7):
        for x in range(0, W, 26):
            rect(r, x + ((y // 7) % 2) * 13, y, x + 22, y, hx('#2a1218'))
    rect(r, 120, 128, 200, 132, hx('#6a2028'))
    rect(r, 126, 134, 194, 136, hx('#4a161e'))
    # багровые искры
    for (x, y) in [(60, 40), (100, 70), (230, 50), (270, 84), (40, 100)]:
        put(r, x, y, hx('#ff8a3c')); put(r, x + 1, y, hx('#ffd24a'))
    return r


def bg_theme_throne():
    """Тронный зал Монарха Теней: обсидиан, фиолетовая бездна, золотой трон."""
    r = png.blank(W, H, (8, 6, 16, 255))
    vgrad(r, 0, 110, hx('#0e0a1a'), hx('#241638'))
    rect(r, 0, 110, W - 1, 179, hx('#100a1a'))
    # бездна за троном
    for i in range(60):
        t = i / 60
        w = int(30 + 52 * t)
        y = 26 + i
        c = (int(30 + 40 * t), int(10 + 14 * t), int(56 + 70 * t), 255)
        rect(r, 160 - w, y, 160 + w, y, c)
    # парящие обсидиановые колонны
    for x in (24, 78, 214, 268):
        rect(r, x, 28, x + 18, 112, hx('#171024'))
        rect(r, x + 2, 28, x + 4, 112, hx('#33204e'))
        rect(r, x - 4, 24, x + 22, 29, hx('#241638'))
        rect(r, x - 4, 108, x + 22, 113, hx('#241638'))
        # фиолетовые прожилки
        line = [(x + 9, 34), (x + 13, 50), (x + 7, 66), (x + 12, 82), (x + 8, 100)]
        for i in range(len(line) - 1):
            (x0, y0), (x1, y1) = line[i], line[i + 1]
            steps = max(abs(x1 - x0), abs(y1 - y0))
            for k in range(steps + 1):
                put(r, x0 + (x1 - x0) * k // steps, y0 + (y1 - y0) * k // steps, hx('#a06cff'))
    # трон
    rect(r, 132, 48, 188, 112, hx('#0e0818'))
    rect(r, 138, 40, 182, 50, hx('#1c1230'))
    rect(r, 142, 30, 178, 40, hx('#2a1a44'))
    for x in (140, 156, 172):
        rect(r, x, 20, x + 4, 32, hx('#e8c76a'))
        put(r, x + 1, 18, hx('#fff0b0'))
    rect(r, 138, 56, 182, 60, hx('#c8a040'))
    rect(r, 150, 64, 170, 100, hx('#3a2460'))
    rect(r, 156, 72, 164, 96, hx('#a06cff'))
    put(r, 160, 80, hx('#ffffff'))
    rect(r, 124, 112, 196, 118, hx('#1a1028'))
    # золотая дорожка
    rect(r, 150, 118, 170, 180, hx('#2a1c3e'))
    rect(r, 156, 118, 164, 180, hx('#3a2a52'))
    for y in range(122, 178, 10):
        rect(r, 154, y, 166, y + 1, hx('#c8a040'))
    # магические огни
    for (x, y, c) in [(52, 52, '#a06cff'), (110, 84, '#d66cff'), (210, 60, '#a06cff'), (250, 90, '#d66cff')]:
        rect(r, x, y, x + 4, y + 4, hx(c))
        put(r, x + 1, y + 1, hx('#ffffff'))
        rect(r, x - 2, y + 2, x + 6, y + 3, hx('#3a2460'))
    # блуждающие огоньки
    for (x, y) in [(70, 30), (96, 100), (190, 28), (230, 100), (296, 46), (40, 76)]:
        put(r, x, y, hx('#d6bcff'))
    floor_line(r, 140, hx('#241638'))
    floor_line(r, 162, hx('#1e1230'))
    return r


BGS3 = {
    'bg_theme_castle': bg_theme_castle,
    'bg_theme_throne': bg_theme_throne,
}


def generate(out_dir):
    import os
    made = []
    for name, fn in BGS3.items():
        path = os.path.join(out_dir, name + '.png')
        png.save_png(path, W * HD_SCALE, H * HD_SCALE, hd_upscale(fn()))
        made.append(path)
    return made
