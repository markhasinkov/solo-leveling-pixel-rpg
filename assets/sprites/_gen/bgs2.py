# -*- coding: utf-8 -*-
"""Фоны локаций 320x180, часть 2: красные ворота, остров Чеджу, гильдия Ахджин."""
from . import png
from .bgs1 import W, H, vgrad, floor_line, hd_upscale, HD_SCALE

rect, put, hx = png.rect, png.put, png.hx


def bg_red_gate():
    """Красные ворота: заснеженный лес под багровым небом."""
    r = png.blank(W, H, (60, 16, 20, 255))
    vgrad(r, 0, 100, hx('#5a1620'), hx('#8a2a2c'))
    rect(r, 0, 100, W - 1, 179, hx('#c8d4e0'))         # снег
    rect(r, 0, 96, W - 1, 100, hx('#7a3438'))
    # луна
    rect(r, 250, 18, 274, 42, hx('#e8d8c0'))
    rect(r, 254, 22, 270, 38, hx('#f4e8d4'))
    # мёртвые деревья
    for (tx, th) in [(20, 70), (60, 88), (105, 60), (210, 76), (285, 62), (310, 84)]:
        rect(r, tx, 100 - th, tx + 4, 100, hx('#241a1e'))
        rect(r, tx - 8, 100 - th + 10, tx + 2, 100 - th + 12, hx('#241a1e'))
        rect(r, tx + 6, 100 - th + 18, tx + 16, 100 - th + 20, hx('#241a1e'))
        rect(r, tx - 6, 100 - th - 8, tx + 14, 100 - th - 6, hx('#241a1e'))
    # портал-ворота справа
    rect(r, 130, 40, 138, 104, hx('#3a2226'))
    rect(r, 178, 40, 186, 104, hx('#3a2226'))
    rect(r, 130, 36, 186, 44, hx('#3a2226'))
    rect(r, 139, 44, 177, 104, hx('#8a1f28'))
    vgrad(r, 44, 103, hx('#a02830'), hx('#5d1018'))
    for dy in range(0, 56, 8):
        rect(r, 139, 44 + dy, 177, 45 + dy, hx('#c04848'))
    # сугробы
    rect(r, 0, 104, W - 1, 108, hx('#dde8f2'))
    rect(r, 30, 130, 90, 134, hx('#dde8f2'))
    rect(r, 200, 142, 290, 146, hx('#dde8f2'))
    # снежинки
    for (x, y) in [(30, 30), (80, 60), (140, 24), (190, 50), (240, 70), (300, 36)]:
        put(r, x, y, hx('#ffffff'))
    floor_line(r, 150, hx('#b8c4d2'), step=10, w=4)
    return r


def bg_jeju_island():
    """Остров Чеджу: море, скалы, муравейник, тёмное небо."""
    r = png.blank(W, H, (26, 30, 52, 255))
    vgrad(r, 0, 70, hx('#2a3454'), hx('#6a7a9c'))      # небо к горизонту
    rect(r, 0, 70, W - 1, 110, hx('#2c5a78'))          # море
    # солнце в дымке
    rect(r, 220, 24, 246, 50, hx('#c8b088'))
    rect(r, 224, 28, 242, 46, hx('#e0caa0'))
    # волны
    for y in range(76, 108, 6):
        for x in range(0, W, 20):
            rect(r, x + (y % 12), y, x + 8, y, hx('#3c6e8c'))
    # дальний остров (вулкан Халла)
    rect(r, 60, 62, 130, 70, hx('#3a4258'))
    rect(r, 84, 48, 110, 62, hx('#46506a'))
    rect(r, 94, 44, 102, 48, hx('#4c5872'))
    # берег
    rect(r, 0, 110, W - 1, 179, hx('#5d5348'))
    vgrad(r, 110, 179, hx('#6e6252'), hx('#4a4238'))
    # чёрный песок
    rect(r, 0, 110, W - 1, 118, hx('#3a342e'))
    # муравейник-купол
    rect(r, 200, 76, 280, 110, hx('#3c2c22'))
    rect(r, 214, 62, 266, 76, hx('#443228'))
    rect(r, 230, 54, 250, 62, hx('#4a382c'))
    rect(r, 236, 70, 244, 110, hx('#2a1e16'))          # вход
    rect(r, 238, 72, 242, 108, hx('#160f0a'))
    # силуэты муравьёв
    for (x, y) in [(50, 124), (120, 132), (170, 120), (300, 138)]:
        rect(r, x, y, x + 6, y + 3, hx('#20140c'))
        put(r, x + 7, y + 1, hx('#20140c')); put(r, x - 1, y + 1, hx('#20140c'))
        put(r, x + 2, y - 2, hx('#20140c')); put(r, x + 4, y - 3, hx('#20140c'))
    # прибой
    rect(r, 0, 118, W - 1, 120, hx('#a8c8d8'))
    return r


def bg_ahjin_guild():
    """Офис гильдии Ахджин: кабинет с окном на город."""
    r = png.blank(W, H, (56, 48, 44, 255))
    vgrad(r, 0, 120, hx('#4a3e38'), hx('#3a302c'))
    rect(r, 0, 120, W - 1, 179, hx('#5d4a3a'))         # пол
    # паркет
    for y in range(124, 180, 8):
        for x in range(0, W, 24):
            rect(r, x + ((y // 8) % 2) * 12, y, x + 20, y + 1, hx('#6e5844'))
    # панорамное окно
    rect(r, 40, 16, 200, 90, hx('#8fc4e8'))
    vgrad(r, 17, 89, hx('#a8d8f0'), hx('#78a8c8'))
    # ночной город за окном
    for bx in range(46, 196, 16):
        bh = 20 + (bx * 13) % 34
        rect(r, bx, 90 - bh, bx + 12, 90, hx('#2a3648'))
        for wy in range(90 - bh + 3, 88, 6):
            for wx in range(bx + 2, bx + 11, 4):
                if (wx + wy) % 3:
                    put(r, wx, wy, hx('#ffd88a'))
    # рама окна
    rect(r, 40, 16, 200, 18, hx('#2e241e')); rect(r, 40, 88, 200, 92, hx('#2e241e'))
    rect(r, 118, 16, 122, 90, hx('#2e241e'))
    rect(r, 40, 50, 200, 52, hx('#2e241e'))
    # письменный стол
    rect(r, 220, 70, 300, 74, hx('#6e4a2c'))
    rect(r, 224, 74, 296, 100, hx('#5a3a22'))
    # документ и лампа на столе
    rect(r, 240, 66, 254, 70, hx('#e8e4d8'))
    rect(r, 268, 58, 272, 70, hx('#8a8f9c'))
    rect(r, 264, 54, 278, 58, hx('#c8b45a'))
    # кресло
    rect(r, 226, 76, 244, 84, hx('#3a2c24'))
    # книжный шкаф справа
    rect(r, 228, 110, 300, 130, hx('#4a3424'))
    for sx in range(232, 297, 12):
        rect(r, sx, 112, sx + 8, 128, hx('#6e4a2c') if sx % 24 else hx('#5a8a4a'))
    # ковёр
    rect(r, 90, 140, 190, 172, hx('#7a2a30'))
    rect(r, 100, 146, 180, 166, hx('#8a3a3c'))
    rect(r, 120, 154, 160, 158, hx('#a8885a'))
    return r


BGS2 = {
    'bg_red-gate': bg_red_gate,
    'bg_jeju-island': bg_jeju_island,
    'bg_ahjin-guild': bg_ahjin_guild,
}


def generate(out_dir):
    import os
    made = []
    for name, fn in BGS2.items():
        path = os.path.join(out_dir, name + '.png')
        png.save_png(path, W * HD_SCALE, H * HD_SCALE, hd_upscale(fn()))
        made.append(path)
    return made
