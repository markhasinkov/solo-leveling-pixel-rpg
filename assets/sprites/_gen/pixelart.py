# -*- coding: utf-8 -*-
"""Простые пиксельные примитивы: эллипсы, полигоны, заливка, обводка."""
from . import png

put, rect, hx = png.put, png.rect, png.hx


def shade(c, amount):
    r, g, b, a = c
    if amount >= 0:
        return (min(255, int(r + (255 - r) * amount)), min(255, int(g + (255 - g) * amount)),
                min(255, int(b + (255 - b) * amount)), a)
    k = 1 + amount
    return (max(0, int(r * k)), max(0, int(g * k)), max(0, int(b * k)), a)


def mix(a, b, t):
    return (int(a[0] + (b[0] - a[0]) * t), int(a[1] + (b[1] - a[1]) * t),
            int(a[2] + (b[2] - a[2]) * t), int(a[3] + (b[3] - a[3]) * t))


def line(rows, x0, y0, x1, y1, c):
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(steps + 1):
        put(rows, round(x0 + (x1 - x0) * i / steps), round(y0 + (y1 - y0) * i / steps), c)


def ellipse(rows, cx, cy, rx, ry, c):
    if rx < 0.5 or ry < 0.5:
        put(rows, int(cx), int(cy), c)
        return
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        dy = (y + 0.5 - cy) / ry
        if abs(dy) > 1:
            continue
        span = rx * (1 - dy * dy) ** 0.5
        for x in range(int(cx - span) - 1, int(cx + span) + 2):
            dx = (x + 0.5 - cx) / rx
            if dx * dx + dy * dy <= 1.02:
                put(rows, x, y, c)


def circle(rows, cx, cy, r, c):
    ellipse(rows, cx, cy, r, r, c)


def poly(rows, pts, c):
    if len(pts) < 3:
        return
    ys = [p[1] for p in pts]
    for y in range(int(min(ys)), int(max(ys)) + 1):
        xs = []
        for i in range(len(pts)):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % len(pts)]
            if y0 == y1:
                continue
            if (y0 <= y < y1) or (y1 <= y < y0):
                xs.append(x0 + (x1 - x0) * (y - y0) / (y1 - y0))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(int(round(xs[i])), int(round(xs[i + 1])) + 1):
                put(rows, x, y, c)


def cut(rows, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(rows, x, y, (0, 0, 0, 0))


def outline(rows, color=(9, 7, 15, 255), diagonal=True):
    """Обводка по внешнему контуру непрозрачных пикселей (in place)."""
    h, w = len(rows), len(rows[0])
    src = [list(r) for r in rows]
    offs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    if diagonal:
        offs += [(-1, -1), (1, -1), (-1, 1), (1, 1)]
    for y in range(h):
        for x in range(w):
            if src[y][x][3]:
                continue
            for dx, dy in offs:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[ny][nx][3] > 40:
                    rows[y][x] = color
                    break
