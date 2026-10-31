# -*- coding: utf-8 -*-
"""Генерация всех PNG-ассетов Solo Leveling RPG.

Запуск (из корня проекта):
    python assets/sprites/_gen/generate.py

Создаёт:
  - 24 спрайта персонажей 32x32 (assets/sprites/<id>.png)
  - 5 тайлов 16x16 (tile_*.png)
  - 6 фонов локаций 320x180 (bg_<location>.png)

Затем проверяет каждый файл: подпись PNG, CRC, размеры из IHDR.
"""
import os
import shutil
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)  # assets/sprites/
sys.path.insert(0, os.path.dirname(HERE))  # чтобы работал "import _gen"

from _gen import humans, monsters, bosses, rulers, tiles, bgs1, bgs2, bgs3, anims, icons, textures, portraits  # noqa: E402


def check_png(path, w, h):
    with open(path, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'signature: ' + path
    off = 8
    while off < len(data):
        (ln,) = struct.unpack('>I', data[off:off + 4])
        tag = data[off + 4:off + 8]
        body = data[off + 8:off + 8 + ln]
        (crc,) = struct.unpack('>I', data[off + 8 + ln:off + 12 + ln])
        assert crc == (zlib.crc32(tag + body) & 0xffffffff), 'crc: ' + path
        if tag == b'IHDR':
            pw, ph = struct.unpack('>II', body[:8])
            assert (pw, ph) == (w, h), 'size %s: %dx%d != %dx%d' % (path, pw, ph, w, h)
        off += 12 + ln
    return True


def main():
    made = []
    made += humans.generate(OUT)
    made += monsters.generate(OUT)
    made += bosses.generate(OUT)
    made += rulers.generate(OUT)
    made += tiles.generate(OUT)
    made += bgs1.generate(OUT)
    made += bgs2.generate(OUT)
    made += bgs3.generate(OUT)
    made += anims.generate(OUT)
    made += portraits.generate(OUT)
    made += icons.generate()
    made += textures.generate(OUT)

    # Новый арт Сон Джин-Ву импортируется отдельно и перекрывает
    # сгенерированный лист 64x64: 4x6 кадров по 96x96.
    custom_dir = os.path.join(HERE, 'custom')
    custom = [
        ('sung-jin-woo-sheet.png', os.path.join(OUT, 'anim', 'sung-jin-woo.png')),
        ('sung-jin-woo.png', os.path.join(OUT, 'sung-jin-woo.png')),
        ('sung-jin-woo-portrait.png', os.path.join(OUT, 'portraits', 'sung-jin-woo.png')),
    ]
    for src, dst in custom:
        shutil.copyfile(os.path.join(custom_dir, src), dst)
        made.append(dst)

    ok = 0
    for p in made:
        name = os.path.basename(p)
        parent = os.path.basename(os.path.dirname(p))
        if name.startswith('bg_'):
            w, h = 640, 360
        elif name.startswith('tile_'):
            w, h = 16, 16
        elif parent == 'anim':
            w, h = (384, 576) if name == 'sung-jin-woo.png' else (anims.SHEET_W, anims.SHEET_H)
        elif parent == 'portraits':
            w, h = 64, 64
        elif parent in ('icons', 'tex'):
            w, h = 32, 32
        else:
            w, h = 64, 64
        check_png(p, w, h)
        ok += 1
        print('OK %-34s %3dx%-3d' % (name, w, h))
    print('---')
    print('generated and verified: %d files' % ok)


if __name__ == '__main__':
    main()
