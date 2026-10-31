# -*- coding: utf-8 -*-
"""Иконки 32x32 для умений и предметов (без внешних зависимостей).

Читает src/data/skills.json и src/data/loot.json, рисует пиксельные иконки
в assets/sprites/icons/ с рамкой по редкости.
"""
import io
import json
import os

from . import png

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ICON_DIR = os.path.join(ROOT, "assets", "sprites", "icons")

RARITY = {
    "common": "#8b90b8",
    "uncommon": "#4ce87a",
    "rare": "#4aa8ff",
    "epic": "#b06cff",
    "legendary": "#e8c76a",
}

put, rect, hx = png.put, png.rect, png.hx


def circle(rows, cx, cy, r, color):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r:
                put(rows, x, y, color)


def line(rows, x0, y0, x1, y1, color):
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(steps + 1):
        x = round(x0 + (x1 - x0) * i / steps)
        y = round(y0 + (y1 - y0) * i / steps)
        put(rows, x, y, color)


def panel(rarity):
    rows = png.blank(32, 32)
    edge = hx(RARITY.get(rarity, "#8b90b8"))
    dark = hx("#101322")
    inner = hx("#1b1f33")
    rect(rows, 0, 0, 31, 31, dark)
    rect(rows, 1, 1, 30, 30, edge)
    rect(rows, 2, 2, 29, 29, inner)
    # уголки
    for (x, y) in ((1, 1), (30, 1), (1, 30), (30, 30)):
        put(rows, x, y, hx("#0a0b12"))
    return rows


def potion(rarity, liquid, big=False):
    rows = panel(rarity)
    glass = hx("#cfe6ff")
    shine = hx("#ffffff")
    cork = hx("#8a6b2f")
    if big:
        rect(rows, 12, 6, 19, 8, glass)
        rect(rows, 14, 4, 17, 6, cork)
        rect(rows, 11, 9, 20, 11, glass)
        circle(rows, 15, 19, 7, glass)
        circle(rows, 15, 20, 6, hx(liquid))
        put(rows, 12, 16, shine); put(rows, 12, 17, shine)
    else:
        rect(rows, 13, 7, 18, 9, glass)
        rect(rows, 14, 5, 17, 7, cork)
        rect(rows, 12, 10, 19, 12, glass)
        circle(rows, 15, 18, 6, glass)
        circle(rows, 15, 19, 5, hx(liquid))
        put(rows, 12, 15, shine); put(rows, 12, 16, shine)
    return rows


def fang(rarity, color="#e8e4d8", curve=1):
    rows = panel(rarity)
    c = hx(color)
    d = hx("#b9b4a4")
    rect(rows, 15, 6, 17, 8, c)
    for i in range(9):
        w = max(0, 3 - i // 3)
        if curve:
            rect(rows, 14 - i // 4, 8 + i, 17 + i // 4, 8 + i, c)
        else:
            rect(rows, 12 + i, 8 + i, 19 - i, 8 + i, c)
    put(rows, 15, 10, d)
    return rows


def tusk(rarity):
    rows = panel(rarity)
    c = hx("#f0e8d0")
    d = hx("#c8b98f")
    for i in range(13):
        x = 10 + i
        y = 24 - i
        put(rows, x, y, c)
        put(rows, x + 1, y, c)
        if i % 3 == 0:
            put(rows, x, y + 1, d)
    rect(rows, 8, 23, 13, 25, c)
    return rows


def fur(rarity):
    rows = panel(rarity)
    c = hx("#d8e8f4")
    d = hx("#9fc4de")
    circle(rows, 16, 17, 8, c)
    for i in range(7):
        x = 10 + i * 2
        put(rows, x, 9 + (i % 2), c)
        put(rows, x, 24 + (i % 2), c)
    circle(rows, 14, 16, 2, d)
    circle(rows, 20, 19, 2, d)
    return rows


def carapace(rarity):
    rows = panel(rarity)
    c = hx("#8a4a20")
    l = hx("#c2723a")
    d = hx("#5a2e12")
    rect(rows, 10, 8, 21, 24, c)
    for y in range(9, 24, 4):
        rect(rows, 10, y, 21, y + 1, l)
        put(rows, 15, y + 2, d); put(rows, 18, y + 2, d)
    line(rows, 16, 8, 16, 24, l)
    return rows


def crystal(rarity):
    rows = panel(rarity)
    c = hx("#9fe6ff")
    l = hx("#e0faff")
    d = hx("#4a9ac8")
    for i in range(8):
        rect(rows, 16 - i, 10 + i, 16 + i, 10 + i, c)
    for i in range(8, 14):
        rect(rows, 16 - (14 - i), 10 + i, 16 + (14 - i), 10 + i, c)
    line(rows, 13, 12, 16, 23, l)
    line(rows, 19, 12, 16, 23, d)
    return rows


def horn(rarity):
    rows = panel(rarity)
    c = hx("#9a3030")
    l = hx("#d05a4a")
    d = hx("#5d1420")
    for i in range(14):
        x = 12 + i
        y = 25 - i
        rect(rows, x, y, x + 2, y + 1, c)
        if i % 4 == 0:
            put(rows, x + 1, y, l)
    rect(rows, 10, 24, 16, 26, d)
    return rows


def essence(rarity):
    rows = panel(rarity)
    c = hx("#a06cff")
    l = hx("#d6bcff")
    d = hx("#4a2a9e")
    circle(rows, 16, 16, 7, d)
    circle(rows, 16, 16, 5, c)
    circle(rows, 14, 14, 2, l)
    for i in range(5):
        put(rows, 8 + i, 20 - i * 2, c)
        put(rows, 23 - i, 12 + i * 2, c)
    return rows


def scale(rarity):
    rows = panel(rarity)
    c = hx("#e8c76a")
    d = hx("#a8812e")
    l = hx("#fff0b0")
    for y in range(8, 25, 3):
        for x in range(10, 23, 3):
            rect(rows, x, y, x + 2, y + 2, c)
            put(rows, x, y, l)
            put(rows, x + 2, y + 2, d)
    return rows


def shard(rarity):
    rows = panel(rarity)
    c = hx("#3a2a4e")
    l = hx("#8a6cff")
    d = hx("#1a1024")
    pts = [(16, 5), (24, 13), (21, 26), (11, 23), (8, 12)]
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        line(rows, x0, y0, x1, y1, d)
    for y in range(10, 23):
        for x in range(11, 22):
            if abs(x - 16) + abs(y - 16) < 8:
                put(rows, x, y, c)
    line(rows, 13, 13, 17, 10, l)
    return rows


def relic(rarity):
    rows = panel(rarity)
    c = hx("#e8c76a")
    l = hx("#fff0b0")
    d = hx("#8a6b2f")
    circle(rows, 16, 16, 8, d)
    circle(rows, 16, 16, 7, c)
    circle(rows, 16, 16, 4, hx("#2a2340"))
    line(rows, 16, 12, 16, 20, l)
    line(rows, 12, 16, 20, 16, l)
    put(rows, 13, 13, l); put(rows, 19, 19, l)
    return rows


def weapon(rarity, kind="dagger"):
    rows = panel(rarity)
    steel = {"common": "#b8c0cc", "uncommon": "#d0e0e8", "rare": "#a8d8ff",
             "epic": "#c8a0ff", "legendary": "#ffd76a"}[rarity]
    edge = hx(steel)
    edge_l = hx("#f0f7ff")
    grip = hx("#5b4322")
    guard = hx("#c8a040")
    if kind == "blade":
        for i in range(14):
            put(rows, 12 + i, 22 - i, edge)
            put(rows, 13 + i, 22 - i, edge_l)
        line(rows, 11, 22, 14, 24, guard)
        line(rows, 9, 24, 12, 25, grip)
    else:
        for i in range(10):
            put(rows, 14 + i, 20 - i, edge)
            put(rows, 15 + i, 20 - i, edge_l)
        line(rows, 12, 20, 16, 21, guard)
        rect(rows, 10, 21, 12, 24, grip)
    return rows


def armor(rarity):
    rows = panel(rarity)
    tone = {"common": "#8b90b8", "uncommon": "#7aa08a", "rare": "#6a9ac8",
            "epic": "#8a5ab8", "legendary": "#c8a850"}[rarity]
    c = hx(tone)
    l = hx("#e0e6f0")
    d = hx("#30364e")
    rect(rows, 10, 9, 21, 23, c)
    rect(rows, 7, 10, 10, 15, c); rect(rows, 21, 10, 24, 15, c)
    rect(rows, 12, 11, 19, 15, d)
    line(rows, 16, 9, 16, 23, l)
    rect(rows, 11, 23, 20, 24, l)
    put(rows, 13, 17, l); put(rows, 18, 17, l)
    return rows


def accessory(rarity, kind="ring"):
    rows = panel(rarity)
    c = hx({"common": "#b8bcc8", "uncommon": "#7ae8c8", "rare": "#6ab8ff",
            "epic": "#c08cff", "legendary": "#ffd76a"}[rarity])
    l = hx("#f0f7ff")
    if kind == "amulet":
        circle(rows, 16, 19, 6, c)
        circle(rows, 16, 19, 4, hx("#141a2a"))
        rect(rows, 13, 7, 18, 9, c)
        put(rows, 16, 9, c); put(rows, 16, 10, c)
        put(rows, 13, 17, l)
    else:
        circle(rows, 16, 18, 8, c)
        circle(rows, 16, 18, 5, hx("#141a2a"))
        put(rows, 16, 7, l); put(rows, 15, 8, l)
    return rows


def material_icon(item_id, rarity):
    if "fang" in item_id:
        return fang(rarity)
    if "tusk" in item_id:
        return tusk(rarity)
    if "fur" in item_id:
        return fur(rarity)
    if "carapace" in item_id:
        return carapace(rarity)
    if "crystal" in item_id:
        return crystal(rarity)
    if "horn" in item_id:
        return horn(rarity)
    if "essence" in item_id:
        return essence(rarity)
    if "scale" in item_id:
        return scale(rarity)
    if "shard" in item_id:
        return shard(rarity)
    return relic(rarity)


def item_icon(item):
    iid = item["id"]
    rarity = item.get("rarity", "common")
    typ = item.get("type", "material")
    if typ == "consumable":
        if "mp" in iid:
            return potion(rarity, "#5ab8ff")
        if "large" in iid:
            return potion(rarity, "#ff4a5a", big=True)
        return potion(rarity, "#ff4a5a")
    if typ == "elixir":
        rows = potion(rarity, "#ffd76a", big=True)
        l = hx("#ffffff")
        put(rows, 15, 14, l); put(rows, 16, 13, l); put(rows, 17, 15, l)
        put(rows, 13, 16, l); put(rows, 19, 16, l)
        return rows
    if typ == "material":
        return material_icon(iid, rarity)
    if typ == "weapon":
        return weapon(rarity, "blade" if "blade" in iid or "kamish" in iid else "dagger")
    if typ == "armor":
        return armor(rarity)
    if typ == "accessory":
        return accessory(rarity, "amulet" if "amulet" in iid else "ring")
    return relic(rarity)


def skill_icon(sid, rarity="epic"):
    rows = panel(rarity)
    if sid == "shadow-slash":
        for i in range(18):
            x = 8 + i
            y = 24 - i
            put(rows, x, y, hx("#a06cff"))
            put(rows, x + 1, y, hx("#d6bcff"))
            if 4 < i < 14:
                put(rows, x, y + 1, hx("#5d3a9e"))
        line(rows, 9, 24, 11, 25, hx("#7a4ad0"))
    elif sid == "dagger-throw":
        for i in range(11):
            put(rows, 10 + i, 22 - i, hx("#7ad7ff"))
            put(rows, 11 + i, 22 - i, hx("#e0faff"))
        for i in range(3):
            line(rows, 7, 20 + i * 3, 13, 18 + i * 3, hx("#3a7a9e"))
        rect(rows, 8, 23, 11, 25, hx("#5b4322"))
    elif sid == "shadow-step":
        for k, alpha in ((0, "#3a2a5e"), (1, "#6a4aae"), (2, "#b08cff")):
            ox = 6 + k * 5
            rect(rows, ox, 9, ox + 5, 23, hx(alpha))
            circle(rows, ox + 2, 8, 2, hx(alpha))
            line(rows, ox, 24, ox - 2, 27, hx(alpha))
            line(rows, ox + 5, 24, ox + 7, 27, hx(alpha))
    elif sid == "rulers-authority":
        for i in range(5):
            put(rows, 8 + i * 4, 10, hx("#e8c76a"))
            put(rows, 8 + i * 4, 11, hx("#e8c76a"))
        rect(rows, 7, 11, 25, 14, hx("#e8c76a"))
        rect(rows, 10, 14, 22, 16, hx("#8a6b2f"))
        for i in range(3):
            circle(rows, 16, 20 + i * 2, 5 + i * 2, hx(["#a06cff", "#7a4ad0", "#4a2a9e"][i]))
        put(rows, 16, 22, hx("#f0e8ff"))
    elif sid == "shadow-army":
        for k, ox in enumerate((6, 13, 20)):
            c = hx(["#3a2a5e", "#6a4aae", "#a06cff"][k])
            circle(rows, ox + 3, 9 + (k % 2), 3, c)
            rect(rows, ox, 13, ox + 6, 24, c)
            line(rows, ox, 24, ox - 1, 27, c)
            line(rows, ox + 6, 24, ox + 7, 27, c)
        put(rows, 15, 7, hx("#d6bcff")); put(rows, 14, 8, hx("#d6bcff"))
    elif sid == "blood-blade":
        for i in range(16):
            put(rows, 8 + i, 24 - i, hx("#ff4a5a"))
            put(rows, 9 + i, 24 - i, hx("#ffd0d0"))
            if 4 < i < 13:
                put(rows, 8 + i, 25 - i, hx("#8a1a28"))
        rect(rows, 6, 24, 10, 26, hx("#5b4322"))
        circle(rows, 23, 21, 2, hx("#ff4a5a"))
        circle(rows, 20, 25, 1, hx("#ff8a9a"))
        put(rows, 24, 20, hx("#ffd0d0"))
    elif sid == "shadow-volley":
        for k in range(5):
            dx = (k - 2) * 4
            for i in range(10):
                x = 16 + dx * (i / 10) + dx
                y = 24 - i
                put(rows, int(round(x)), y, hx(["#5d3bff", "#8fdcff", "#d8f4ff"][k % 3]))
        line(rows, 12, 25, 20, 25, hx("#3a2a5e"))
        put(rows, 16, 22, hx("#ffffff"))
    elif sid == "shadow-cage":
        for x in (8, 12, 16, 20, 24):
            line(rows, x, 8, x, 25, hx("#6a4aae"))
            put(rows, x, 9, hx("#c8a6ff"))
        for y in (9, 16, 23):
            line(rows, 7, y, 25, y, hx("#4a2a9e"))
        circle(rows, 16, 17, 5, hx("#2a1640"))
        circle(rows, 16, 17, 3, hx("#a06cff"))
        put(rows, 16, 17, hx("#f0e8ff"))
    else:
        circle(rows, 16, 16, 8, hx("#a06cff"))
    return rows


def generate(out_dir=None):
    target = out_dir or ICON_DIR
    os.makedirs(target, exist_ok=True)
    made = []
    with io.open(os.path.join(ROOT, "src", "data", "skills.json"), encoding="utf-8") as f:
        skills = json.load(f)
    with io.open(os.path.join(ROOT, "src", "data", "loot.json"), encoding="utf-8") as f:
        loot = json.load(f)
    for skill in skills:
        path = os.path.join(target, "skill-" + skill["id"] + ".png")
        png.save_png(path, 32, 32, skill_icon(skill["id"]))
        made.append(path)
    for item in loot["items"]:
        path = os.path.join(target, "item-" + item["id"] + ".png")
        png.save_png(path, 32, 32, item_icon(item))
        made.append(path)
    return made


if __name__ == "__main__":
    for p in generate():
        print(os.path.basename(p))
