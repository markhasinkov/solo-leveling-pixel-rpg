# -*- coding: utf-8 -*-
"""Импорт новых спрайтов Сон Джин-Ву из листов, предоставленных художником.

Запуск (из корня проекта):
    python tools/import_jinwoo.py

Требует Pillow (только для импорта; сама игра и generate.py работают без него).
Исходники: assets/sprites/_gen/refs/jinwoo/{labelled,actions}.jpeg с шахматным
фоном. Скрипт вырезает фон, собирает лист 384x576 (4 кадра x 6 состояний,
кадр 96x96), статичный спрайт и портрет 64x64, а также QA-превью.

Результат:
  assets/sprites/_gen/custom/sung-jin-woo-sheet.png
  assets/sprites/_gen/custom/sung-jin-woo.png
  assets/sprites/_gen/custom/sung-jin-woo-portrait.png
  docs/qa/screens/170-jinwoo-sprites.png
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REFS = ROOT / 'assets' / 'sprites' / '_gen' / 'refs' / 'jinwoo'
OUT = ROOT / 'assets' / 'sprites' / '_gen' / 'custom'
SHOT = ROOT / 'docs' / 'qa' / 'screens' / '170-jinwoo-sprites.png'
FRAME = 96

# Границы кадров на исходных листах (ручная разметка сетки).
IDLE_BOXES = [(180, 0, 336, 300), (406, 0, 553, 300), (611, 0, 764, 300), (811, 0, 958, 300)]
ATTACK_BOXES = [(294, 300, 493, 550), (522, 300, 756, 550), (780, 300, 1012, 550), (1036, 300, 1260, 550)]
JUMP_RISE = (556, 540, 747, 805)
JUMP_FALL = (820, 540, 969, 805)
CROUCH_BOXES = [(379, 900, 492, 1024), (593, 900, 713, 1024), (804, 900, 921, 1024), (1040, 900, 1149, 1024)]


def is_background(pixel):
    r, g, b = pixel[0], pixel[1], pixel[2]
    return max(r, g, b) - min(r, g, b) <= 16 and min(r, g, b) >= 200


def cut_background(image):
    """Удаляет шахматный фон заливкой от краёв, сохраняя внутренние блики."""
    image = image.convert('RGB')
    w, h = image.size
    px = image.load()
    alpha = bytearray(b'\xff') * (w * h)
    seen = bytearray(w * h)
    queue = deque()

    def push(x, y):
        i = y * w + x
        if seen[i]:
            return
        seen[i] = 1
        if is_background(px[x, y]):
            queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while queue:
        x, y = queue.popleft()
        alpha[y * w + x] = 0
        if x > 0:
            push(x - 1, y)
        if x + 1 < w:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y + 1 < h:
            push(x, y + 1)
    out = image.convert('RGBA')
    out.putalpha(Image.frombytes('L', (w, h), bytes(alpha)))
    return out


def dark_bbox(crop):
    w, h = crop.size
    px = crop.load()
    cols = [0] * w
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 100 and (0.299 * r + 0.587 * g + 0.114 * b) < 70:
                cols[x] += 1
    win = max(18, int(w * 0.30))
    best, best_x = -1, 0
    for x in range(0, max(1, w - win) + 1):
        score = sum(cols[x:x + win])
        if score > best:
            best, best_x = score, x
    xs = [x for x in range(best_x, min(w, best_x + win)) if cols[x] > 0]
    cx = (min(xs) + max(xs)) // 2 if xs else w // 2
    band = max(20, int(w * 0.22))
    ys, xr = [], []
    for y in range(h):
        for x in range(max(0, cx - band), min(w, cx + band)):
            r, g, b, a = px[x, y]
            if a > 100 and (0.299 * r + 0.587 * g + 0.114 * b) < 70:
                ys.append(y)
                xr.append(x)
    if not ys:
        return (0, 0, w, h)
    ys.sort()
    return (min(xr), ys[int(len(ys) * 0.02)], max(xr), ys[int(len(ys) * 0.98)])


def normalize(source, box, body_h, bottom=FRAME - 3):
    crop = source.crop(box)
    bx0, by0, bx1, by1 = dark_bbox(crop)
    scale = body_h / max(1, by1 - by0)
    scaled = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
    bcx = round((bx0 + bx1) / 2 * scale)
    bby = round(by1 * scale)
    dx = FRAME // 2 - bcx
    dy = bottom - bby
    out = Image.new('RGBA', (FRAME, FRAME), (0, 0, 0, 0))
    sx, sy = max(0, -dx), max(0, -dy)
    part = scaled.crop((sx, sy, min(scaled.width, sx + FRAME), min(scaled.height, sy + FRAME)))
    out.alpha_composite(part, (max(0, dx), max(0, dy)))
    return out


def with_legs(base, split_y, dx_left, dx_right):
    out = Image.new('RGBA', (FRAME, FRAME), (0, 0, 0, 0))
    px = base.load()
    op = out.load()
    for y in range(FRAME):
        for x in range(FRAME):
            color = px[x, y]
            if not color[3]:
                continue
            dx = (dx_left if x < FRAME // 2 else dx_right) if y >= split_y else 0
            if 0 <= x + dx < FRAME:
                op[x + dx, y] = color
    return out


def build():
    labelled = cut_background(Image.open(REFS / 'labelled.jpeg'))
    actions = cut_background(Image.open(REFS / 'actions.jpeg'))

    idle = [normalize(labelled, b, 78) for b in IDLE_BOXES]
    attack = [normalize(labelled, b, 69) for b in ATTACK_BOXES]
    jump_rise = normalize(labelled, JUMP_RISE, 69)
    jump_fall = normalize(labelled, JUMP_FALL, 69)
    base = idle[0]
    walk = [
        with_legs(base, 63, 6, -6),
        with_legs(base, 63, 4, -4),
        with_legs(base, 63, -6, 6),
        with_legs(base, 63, -4, 4)
    ]
    crouch = [normalize(actions, b, 57) for b in CROUCH_BOXES]
    rows = [
        ('idle', idle),
        ('walk', walk),
        ('attack', attack),
        ('jump', [jump_fall, jump_rise, jump_fall, jump_rise]),
        ('hurt', [crouch[1], crouch[2], crouch[1], crouch[2]]),
        ('death', [crouch[3], crouch[2], crouch[1], crouch[0]])
    ]

    sheet = Image.new('RGBA', (FRAME * 4, FRAME * 6), (0, 0, 0, 0))
    for row, (_, frames) in enumerate(rows):
        for col, frame in enumerate(frames):
            sheet.alpha_composite(frame, (col * FRAME, row * FRAME))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / 'sung-jin-woo-sheet.png')

    static = idle[0].resize((64, 64), Image.LANCZOS)
    static.save(OUT / 'sung-jin-woo.png')

    portrait_crop = labelled.crop((225, 3, 325, 103))
    portrait = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    fitted = portrait_crop.copy()
    fitted.thumbnail((64, 64), Image.LANCZOS)
    portrait.alpha_composite(fitted, ((64 - fitted.width) // 2, (64 - fitted.height) // 2))
    portrait.save(OUT / 'sung-jin-woo-portrait.png')

    # QA-превью 4x6: каждый кадр на тёмной подложке.
    cell = FRAME * 2
    preview = Image.new('RGB', (cell * 4 + 24, cell * 6 + 24), (18, 14, 26))
    for row, (_, frames) in enumerate(rows):
        for col, frame in enumerate(frames):
            tile = Image.new('RGBA', (FRAME, FRAME), (18, 14, 26, 255))
            tile.alpha_composite(frame)
            preview.paste(tile.resize((cell, cell), Image.NEAREST).convert('RGB'), (12 + col * cell, 12 + row * cell))
    preview.save(SHOT)
    print('sheet      :', OUT / 'sung-jin-woo-sheet.png', sheet.size)
    print('static     :', OUT / 'sung-jin-woo.png', static.size)
    print('portrait   :', OUT / 'sung-jin-woo-portrait.png', portrait.size)
    print('preview    :', SHOT, preview.size)


if __name__ == '__main__':
    if not REFS.exists():
        sys.exit('Нет исходников: ' + str(REFS))
    build()
