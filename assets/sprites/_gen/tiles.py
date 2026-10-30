# -*- coding: utf-8 -*-
"""Тайлы 16x16: пол, стена, дверь, лестница, портал.

Имена файлов: tile_floor.png, tile_wall.png, tile_door.png,
tile_stairs.png, tile_portal.png."""
from . import png

put, rect, hx = png.put, png.rect, png.hx


def tile_floor():
    r = png.blank(16, 16)
    base, seam, speck = hx('#3a3442'), hx('#2a2532'), hx('#443e50')
    rect(r, 0, 0, 15, 15, base)
    for y in (3, 7, 11, 15):
        rect(r, 0, y, 15, y, seam)
    rect(r, 5, 0, 5, 3, seam); rect(r, 10, 4, 10, 7, seam)
    rect(r, 4, 8, 4, 11, seam); rect(r, 11, 12, 11, 15, seam)
    put(r, 2, 1, speck); put(r, 13, 5, speck); put(r, 7, 9, speck); put(r, 3, 13, speck)
    return r


def tile_wall():
    r = png.blank(16, 16)
    brick, mortar, light = hx('#4a4152'), hx('#2e2836'), hx('#584e62')
    rect(r, 0, 0, 15, 15, brick)
    for y in (0, 5, 10, 15):
        rect(r, 0, y, 15, y, mortar)
    rect(r, 0, 5, 2, 5, mortar); rect(r, 8, 5, 10, 5, mortar)
    rect(r, 5, 10, 7, 10, mortar); rect(r, 12, 10, 14, 10, mortar)
    rect(r, 0, 0, 15, 0, light)
    put(r, 3, 2, light); put(r, 12, 7, light); put(r, 6, 12, light)
    return r


def tile_door():
    r = png.blank(16, 16)
    frame, wood, dark, knob = hx('#3a2f24'), hx('#6b4a2b'), hx('#4a3520'), hx('#d8b45a')
    rect(r, 0, 0, 15, 15, frame)
    rect(r, 2, 1, 13, 15, wood)
    rect(r, 2, 1, 13, 2, dark)
    rect(r, 4, 4, 11, 4, dark); rect(r, 4, 9, 11, 9, dark)  # панели
    put(r, 11, 8, knob); put(r, 11, 7, hx('#f0d68a'))
    rect(r, 2, 15, 13, 15, dark)
    return r


def tile_stairs():
    r = png.blank(16, 16)
    step, face, dark = hx('#5a5262'), hx('#3e3746'), hx('#2c2632')
    for i in range(4):
        y0 = 12 - i * 4
        rect(r, 0, y0, 15, y0 + 1, step)          # проступь
        rect(r, 0, y0 + 2, 15, y0 + 3, face)      # подступёнок
        rect(r, 0, y0 + 1, 15, y0 + 1, dark)
        rect(r, 15 - i * 4, y0, 15 - i * 4, y0 + 1, dark)
    return r


def tile_portal():
    r = png.blank(16, 16)
    stone, dark = hx('#4a4152'), hx('#2e2836')
    glow1, glow2, core = hx('#3cc8ff'), hx('#1e78d8'), hx('#c8f4ff')
    # каменная арка
    rect(r, 0, 0, 2, 15, stone); rect(r, 13, 0, 15, 15, stone)
    rect(r, 0, 0, 16, 2, stone)
    rect(r, 0, 0, 2, 2, dark)
    # завихрение
    rect(r, 3, 3, 12, 13, dark)
    rect(r, 4, 4, 11, 12, glow2)
    rect(r, 5, 5, 10, 11, glow1)
    rect(r, 6, 6, 9, 10, core)
    put(r, 7, 7, hx('#ffffff')); put(r, 8, 8, hx('#ffffff'))
    return r


TILES = {
    'tile_floor': tile_floor,
    'tile_wall': tile_wall,
    'tile_door': tile_door,
    'tile_stairs': tile_stairs,
    'tile_portal': tile_portal,
}


def generate(out_dir):
    import os
    made = []
    for name, fn in TILES.items():
        path = os.path.join(out_dir, name + '.png')
        png.save_png(path, 16, 16, fn())
        made.append(path)
    return made
