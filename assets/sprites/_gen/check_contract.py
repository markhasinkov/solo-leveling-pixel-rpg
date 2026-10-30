# -*- coding: utf-8 -*-
"""Сверка assets/sprites/ с контрактом: точный список ожидаемых файлов.

Запуск: python assets/sprites/_gen/check_contract.py
"""
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

# 31 id персонажей из characters.json
CHARACTERS = [
    'sung-jin-woo', 'yoo-jinho', 'cha-hae-in', 'go-gun-hee', 'song-chi-yul',
    'lee-joo-hee', 'ahn-sang-min', 'woo-jin-chul', 'baek-yoon-ho', 'kim-chul',
    'choi-jong-in', 'min-byung-gu', 'ashborn', 'architect', 'antares', 'beru',
    'igris', 'baruka', 'statue-of-god', 'reed-boss', 'goblin', 'orc',
    'knight-ant', 'ice-bear', 'demon-knight', 'hellhound',
    'goblin-shaman', 'cave-spider', 'orc-berserker', 'ice-elf-ranger', 'frost-wolf',
]
TILES = ['tile_floor', 'tile_wall', 'tile_door', 'tile_stairs', 'tile_portal']
BGS = ['bg_double-dungeon', 'bg_e-rank-dungeon', 'bg_hospital', 'bg_red-gate',
       'bg_jeju-island', 'bg_ahjin-guild', 'bg_theme_castle', 'bg_theme_throne']
ARENAS = ['arena_cartenon', 'arena_baruka', 'arena_igris', 'arena_beru', 'arena_antares',
          'arena_trial_hospital', 'arena_mine_guardian', 'arena_reed_throne',
          'arena_measure_hall', 'arena_ahjin_sparring', 'arena_ashborn_relicary',
          'arena_war_monarchs']
CUTINS = ['cutin_jinwoo', 'cutin_statue', 'cutin_baruka', 'cutin_igris', 'cutin_beru', 'cutin_antares',
          'cutin_trial_examiner', 'cutin_mine_guardian', 'cutin_reed_shaman',
          'cutin_measurement_golem', 'cutin_shadow_duelist', 'cutin_ashborn',
          'cutin_war_herald']

EXPECTED = {c + '.png': (64, 64) for c in CHARACTERS}
EXPECTED.update({t + '.png': (16, 16) for t in TILES})
EXPECTED.update({b + '.png': (640, 360) for b in BGS})

SUBDIRS = {
    'arenas': {a + '.jpg': (960, 540) for a in ARENAS},
    'cutins': {c + '.jpg': (512, 640) for c in CUTINS},
}


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(33)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    (w, h) = struct.unpack('>II', head[16:24])
    return (w, h)


def jpg_size(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:2] != b'\xff\xd8':
        return None
    i = 2
    while i + 9 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0xD9):
            i += 2
            continue
        (ln,) = struct.unpack('>H', data[i + 2:i + 4])
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            (h, w) = struct.unpack('>HH', data[i + 5:i + 9])
            return (w, h)
        i += 2 + ln
    return None


def main():
    actual = {n for n in os.listdir(OUT) if n.endswith('.png')}
    missing = sorted(set(EXPECTED) - actual)
    extra = sorted(actual - set(EXPECTED))
    bad_size, bad_png = [], []

    for name, (ew, eh) in sorted(EXPECTED.items()):
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            continue
        sz = png_size(path)
        if sz is None:
            bad_png.append(name)
        elif sz != (ew, eh):
            bad_size.append('%s: %dx%d != %dx%d' % (name, sz[0], sz[1], ew, eh))

    for folder, manifest in sorted(SUBDIRS.items()):
        d = os.path.join(OUT, folder)
        sub_actual = {n for n in os.listdir(d) if n.lower().endswith('.jpg')} if os.path.isdir(d) else set()
        missing += sorted('%s/%s' % (folder, n) for n in (set(manifest) - sub_actual))
        extra += sorted('%s/%s' % (folder, n) for n in (sub_actual - set(manifest)))
        for name, (ew, eh) in sorted(manifest.items()):
            path = os.path.join(d, name)
            if not os.path.exists(path):
                continue
            sz = jpg_size(path)
            if sz is None:
                bad_png.append(folder + '/' + name)
            elif sz != (ew, eh):
                bad_size.append('%s/%s: %dx%d != %dx%d' % (folder, name, sz[0], sz[1], ew, eh))

    # декодирование IDAT (полная валидность, а не только заголовок)
    decode_errors = []
    for name in sorted(EXPECTED):
        p = os.path.join(OUT, name)
        if not os.path.exists(p):
            continue
        try:
            with open(p, 'rb') as f:
                data = f.read()
            off, idat, w = 8, b'', None
            while off < len(data):
                (ln,) = struct.unpack('>I', data[off:off + 4])
                tag = data[off + 4:off + 8]
                body = data[off + 8:off + 8 + ln]
                (crc,) = struct.unpack('>I', data[off + 8 + ln:off + 12 + ln])
                assert crc == (zlib.crc32(tag + body) & 0xffffffff), 'CRC'
                if tag == b'IHDR':
                    w = struct.unpack('>II', body[:8])[0]
                elif tag == b'IDAT':
                    idat += body
                off += 12 + ln
            raw = zlib.decompress(idat)
            (ew, eh) = EXPECTED[name]
            # RGBA: 1 байт фильтра + w*4 байт пикселей в каждой строке
            assert len(raw) == (w * 4 + 1) * eh, 'raw len %d != %d' % (
                len(raw), (w * 4 + 1) * eh)
        except Exception as e:
            decode_errors.append('%s: %s' % (name, e))
    print('decode errors  : %s' % (decode_errors or 'none'))

    total_expected = len(EXPECTED) + sum(len(m) for m in SUBDIRS.values())
    print('expected files : %d (sprites %d + arenas/cutins %d)' % (
        total_expected, len(EXPECTED), total_expected - len(EXPECTED)))
    print('missing        : %s' % (missing or 'none'))
    print('unexpected     : %s' % (extra or 'none'))
    print('bad signature  : %s' % (bad_png or 'none'))
    print('bad size       : %s' % (bad_size or 'none'))
    ok = not (missing or extra or bad_png or bad_size or decode_errors)
    print('CONTRACT CHECK : %s' % ('PASS' if ok else 'FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
