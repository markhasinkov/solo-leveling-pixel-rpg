# -*- coding: utf-8 -*-
"""Анимационные листы 256x384 (4 кадра x 6 состояний, кадр 64x64).

Базовая детализированная графика строится в humans/monsters/bosses/rulers.
Кадры ходьбы/атаки/прыжка/урона/смерти собираются сдвигами частей тела.
"""
from . import png, pixelart, humans, monsters, bosses, rulers

COLS = 4
STATES = ["idle", "walk", "attack", "jump", "hurt", "death"]
FRAME = 64
SHEET_W = FRAME * COLS
SHEET_H = FRAME * len(STATES)

LEG_Y = {
    "human": 44,
    "monster": 44,
    "knight-ant": 40,
    "demon-knight": 48,
    "hellhound": 42,
    "goblin-shaman": 46,
    "cave-spider": 38,
    "orc-berserker": 48,
    "ice-elf-ranger": 44,
    "frost-wolf": 42,
    "boss": 46,
}


def base_sprite(cid):
    if cid in humans.HUMANS:
        return humans.build_human(humans.HUMANS[cid]), LEG_Y["human"]
    if cid in monsters.SMALL:
        return monsters.SMALL[cid](), LEG_Y.get(cid, LEG_Y["monster"])
    if cid in bosses.BOSSES1:
        return bosses.BOSSES1[cid](), LEG_Y["boss"]
    if cid in rulers.BOSSES2:
        return rulers.BOSSES2[cid](), LEG_Y["boss"]
    raise KeyError("unknown sprite id: " + cid)


def blank():
    return png.blank(FRAME, FRAME)


def copy_rows(rows):
    return [list(r) for r in rows]


def with_legs(rows, split_y, dxl, dxr):
    out = blank()
    for y in range(FRAME):
        for x in range(FRAME):
            c = rows[y][x]
            if not c[3]:
                continue
            dx = 0
            if y >= split_y:
                dx = dxl if x < FRAME // 2 else dxr
            nx = x + dx
            if 0 <= nx < FRAME:
                out[y][nx] = c
    return out


def with_upper_shift(rows, split_y, dx=0, dy=0):
    out = blank()
    for y in range(FRAME):
        for x in range(FRAME):
            c = rows[y][x]
            if not c[3]:
                continue
            if y < split_y:
                nx, ny = x + dx, y + dy
            else:
                nx, ny = x, y
            if 0 <= nx < FRAME and 0 <= ny < FRAME:
                out[ny][nx] = c
    return out


def shift_pixels(rows, dy=0, dx=0, y_from=0, y_to=FRAME - 1, x_from=0, x_to=FRAME - 1):
    out = blank()
    for y in range(y_from, y_to + 1):
        ny = y + dy
        if ny < 0 or ny >= FRAME:
            continue
        for x in range(x_from, x_to + 1):
            nx = x + dx
            if nx < 0 or nx >= FRAME:
                continue
            c = rows[y][x]
            if c[3]:
                out[ny][nx] = c
    return out


def tint(rows, color=(255, 255, 255), amount=0.5, alpha=None):
    out = blank()
    for y in range(FRAME):
        for x in range(FRAME):
            r, g, b, a = rows[y][x]
            if not a:
                continue
            nr = int(r + (color[0] - r) * amount)
            ng = int(g + (color[1] - g) * amount)
            nb = int(b + (color[2] - b) * amount)
            na = a if alpha is None else min(a, alpha)
            out[y][x] = (nr, ng, nb, na)
    return out


def darken(rows, amount=0.35, alpha=None):
    out = blank()
    for y in range(FRAME):
        for x in range(FRAME):
            r, g, b, a = rows[y][x]
            if not a:
                continue
            na = a if alpha is None else min(a, alpha)
            out[y][x] = (int(r * (1 - amount)), int(g * (1 - amount)), int(b * (1 - amount)), na)
    return out


def polish_frame(rows):
    """Чистая обводка кадра 64x64. Светотень уже заложена в базовом спрайте."""
    out = [list(r) for r in rows]
    pixelart.outline(out, (9, 7, 15, 245), diagonal=True)
    return out


def idle_frames(base, split_y):
    return [
        copy_rows(base),
        with_upper_shift(base, split_y, dy=1),
        copy_rows(base),
        with_upper_shift(base, split_y, dy=1)
    ]


def walk_frames(base, split_y):
    return [
        with_legs(base, split_y, 3, -3),
        with_legs(base, split_y, 2, -2),
        with_legs(base, split_y, -3, 3),
        with_legs(base, split_y, -2, 2)
    ]


def attack_frames(base, split_y):
    return [
        with_upper_shift(base, split_y, dx=2),
        with_upper_shift(base, split_y, dx=4, dy=-1),
        with_upper_shift(base, split_y, dx=2),
        copy_rows(base)
    ]


def jump_frames(base, split_y):
    return [
        with_upper_shift(base, split_y, dy=1),
        with_upper_shift(base, split_y, dy=-2),
        copy_rows(base),
        copy_rows(base)
    ]


def hurt_frames(base):
    return [
        tint(shift_pixels(base, dx=-3), amount=0.65),
        tint(shift_pixels(base, dx=-1), amount=0.3),
        copy_rows(base),
        copy_rows(base)
    ]


def death_frames(base, split_y):
    frames = []
    for i in range(4):
        alpha = [255, 210, 155, 95][i]
        f = shift_pixels(base, dy=i)
        f = darken(f, amount=0.14 + i * 0.12, alpha=alpha)
        if i >= 2:
            f = with_upper_shift(f, split_y, dy=1)
        frames.append(f)
    return frames


def build_sheet(cid):
    base, split_y = base_sprite(cid)
    frames = {
        "idle": idle_frames(base, split_y),
        "walk": walk_frames(base, split_y),
        "attack": attack_frames(base, split_y),
        "jump": jump_frames(base, split_y),
        "hurt": hurt_frames(base),
        "death": death_frames(base, split_y),
    }
    rows = png.blank(SHEET_W, SHEET_H)
    for r, state in enumerate(STATES):
        for c, frame in enumerate(frames[state]):
            polished = polish_frame(frame)
            for y in range(FRAME):
                for x in range(FRAME):
                    px = polished[y][x]
                    if px[3]:
                        rows[r * FRAME + y][c * FRAME + x] = px
    return rows


def generate(out_dir):
    import os
    anim_dir = os.path.join(out_dir, "anim")
    os.makedirs(anim_dir, exist_ok=True)
    made = []
    ids = list(humans.HUMANS.keys())
    ids += list(monsters.SMALL.keys())
    ids += list(bosses.BOSSES1.keys())
    ids += list(rulers.BOSSES2.keys())
    for cid in ids:
        path = os.path.join(anim_dir, cid + ".png")
        png.save_png(path, SHEET_W, SHEET_H, build_sheet(cid))
        made.append(path)
    return made
