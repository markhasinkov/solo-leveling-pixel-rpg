# -*- coding: utf-8 -*-
"""Боссы 64x64: Бер, Антарас, Игрис, Барука.

Крупные силуэты с крыльями, рогами, плащами и свечением — читаются
на фоне арены и не распадаются на прямоугольники.
"""
from . import png, pixelart

put, rect, hx = png.put, png.rect, png.hx
shade, mix = pixelart.shade, pixelart.mix
line, ellipse, poly = pixelart.line, pixelart.ellipse, pixelart.poly


def beru():
    """Король муравьёв: четыре крыла, фасеточные глаза, когти, хитиновый панцирь."""
    body, car, carl = hx('#2a1a44'), hx('#4a2d74'), hx('#7a56b0')
    dark = hx('#100a1c')
    glow, glow_l = hx('#c08cff'), hx('#f2e4ff')
    r = png.blank(64, 64)

    # крылья (полупрозрачные перепонки)
    wing = (86, 52, 138, 225)
    wing_d = (50, 28, 84, 205)
    for side in (-1, 1):
        base = 32 + side * 2
        tipx = 4 if side < 0 else 60
        poly(r, [(base, 25), (tipx, 3), (base + side * 8, 17), (base + side * 7, 33), (base, 32)], wing)
        poly(r, [(base, 29), (tipx + side * 2, 10), (base + side * 5, 24), (base, 34)], wing_d)
        for (x1, y1) in ((base + side * 5, 17), (base + side * 8, 26), (base + side * 4, 31)):
            line(r, base, 28, x1, y1, glow)
        put(r, tipx, 3, glow_l)
        # нижнее крыло
        poly(r, [(base, 33), (base + side * 18, 40), (base + side * 12, 52), (base + side * 2, 42)], (48, 26, 82, 180))
        line(r, base, 34, base + side * 16, 42, glow)
        line(r, base + side * 4, 36, base + side * 10, 49, carl)

    # брюшко
    ellipse(r, 32, 45, 10, 8, dark)
    ellipse(r, 32, 44, 8, 6, car)
    for y in (41, 45, 49):
        line(r, 24, y, 40, y, carl)
    put(r, 28, 42, carl); put(r, 36, 44, carl)

    # ноги
    for (x, y) in ((25, 53), (31, 54), (36, 54), (41, 53)):
        line(r, x, 51, x + (-4 if x < 32 else 4), 61, dark)
        line(r, x + 1, 51, x + (3 if x < 32 else 5), 61, car)
        put(r, x + (-4 if x < 32 else 4), 62, glow)
        put(r, x + (-3 if x < 32 else 5), 62, glow)

    # торс: сегментированный хитин
    poly(r, [(20, 25), (45, 25), (44, 34), (40, 44), (24, 44), (20, 34)], body)
    poly(r, [(21, 26), (32, 26), (30, 43), (21, 33)], car)
    poly(r, [(32, 26), (44, 26), (43, 34), (32, 44)], shade(body, 0.1))
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    # грудные пластины
    poly(r, [(23, 28), (31, 27), (31, 34), (24, 35)], carl)
    poly(r, [(33, 27), (41, 28), (40, 35), (33, 34)], shade(carl, -0.2))
    line(r, 23, 31, 31, 31, body)
    line(r, 33, 31, 41, 31, body)
    poly(r, [(24, 36), (31, 35), (31, 41), (25, 42)], shade(car, 0.18))
    poly(r, [(33, 35), (40, 36), (39, 42), (33, 41)], shade(car, -0.1))
    # ядро
    poly(r, [(30, 31), (35, 34), (35, 39), (30, 42), (28, 38)], dark)
    box(31, 33, 33, 39, glow)
    box(32, 34, 32, 38, glow_l)
    # шипы на плечах
    for (x, y) in ((20, 27), (44, 27), (20, 33), (44, 33)):
        line(r, x, y, x + (-4 if x < 32 else 4), y - 4, carl)
        put(r, x + (-4 if x < 32 else 4), y - 4, glow)

    # руки с когтями
    poly(r, [(20, 27), (14, 30), (12, 40), (18, 42), (22, 35)], body)
    poly(r, [(44, 27), (50, 30), (52, 40), (46, 42), (42, 35)], body)
    box(13, 39, 19, 44, car)
    box(45, 39, 51, 44, car)
    for i in range(3):
        line(r, 13 + i * 3, 43, 9 + i * 3, 49, glow)
        line(r, 51 - i * 3, 43, 55 - i * 3, 49, glow)
        put(r, 9 + i * 3, 49, glow_l)
        put(r, 55 - i * 3, 49, glow_l)

    # голова
    ellipse(r, 32, 16, 10, 9, body)
    ellipse(r, 32, 16, 8, 7, car)
    poly(r, [(23, 12), (32, 7), (41, 12), (41, 19), (32, 23), (23, 19)], body)
    # фасеточные глаза
    poly(r, [(23, 13), (29, 11), (30, 18), (24, 19)], glow)
    poly(r, [(41, 13), (35, 11), (34, 18), (40, 19)], glow)
    for (x, y) in ((25, 14), (27, 16), (37, 16), (39, 14)):
        put(r, x, y, dark)
    put(r, 26, 13, glow_l); put(r, 38, 13, glow_l)
    # мандибулы
    poly(r, [(23, 21), (28, 21), (29, 27), (25, 30), (21, 27)], dark)
    poly(r, [(41, 21), (36, 21), (35, 27), (39, 30), (43, 27)], dark)
    line(r, 24, 25, 27, 28, carl)
    line(r, 40, 25, 37, 28, carl)
    put(r, 25, 29, glow); put(r, 39, 29, glow)
    # усики и корона
    line(r, 27, 8, 21, 1, carl); line(r, 37, 8, 43, 1, carl)
    put(r, 20, 0, glow); put(r, 44, 0, glow)
    for x in (25, 30, 34, 39):
        line(r, x, 8, x, 4, carl)
        put(r, x, 3, glow_l)
    # блики
    for (x, y) in ((24, 11), (40, 11), (23, 31), (40, 33)):
        put(r, x, y, carl)
    return r


def antares():
    """Монарх Разрушения: драконьи крылья, рога, золотые глаза, чешуя и хвост."""
    body, dark, scale = hx('#8a1c26'), hx('#360a10'), hx('#c03a34')
    scale_d = hx('#5a1018')
    gold, gold_l = hx('#e8c76a'), hx('#fff0b0')
    fire = hx('#ff7a2a')
    r = png.blank(64, 64)

    # крылья
    for side in (-1, 1):
        base = 30
        tip = base + side * 27
        poly(r, [(base, 25), (tip, 1), (tip + side * 2, 13), (base + side * 12, 25), (base + side * 9, 36), (base, 31)], (74, 16, 22, 225))
        poly(r, [(base, 27), (base + side * 18, 12), (base + side * 22, 22), (base + side * 12, 32), (base + side * 5, 34)], (100, 24, 30, 190))
        # кости
        for (x1, y1) in ((tip, 2), (base + side * 16, 15), (base + side * 10, 28), (base + side * 22, 23)):
            line(r, base, 28, x1, y1, gold)
        for (x, y) in ((base + side * 14, 14), (base + side * 20, 23), (base + side * 8, 30)):
            put(r, x, y, gold_l)
        # когти на сгибе
        line(r, base, 25, base + side * 5, 19, scale)
        put(r, base + side * 5, 18, gold_l)

    # хвост
    poly(r, [(24, 44), (13, 52), (4, 51), (2, 45), (9, 44), (17, 43)], body)
    line(r, 14, 48, 5, 47, scale)
    line(r, 22, 45, 12, 51, dark)
    poly(r, [(2, 45), (0, 42), (3, 41), (5, 44)], gold)

    # ноги
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(23, 46, 32, 60, body)
    box(34, 46, 43, 60, body)
    box(23, 46, 25, 59, scale)
    box(41, 46, 43, 59, dark)
    box(20, 59, 33, 63, dark)
    box(33, 59, 46, 63, dark)
    for x in (21, 26, 31, 36, 42, 46):
        put(r, x, 63, gold)
    line(r, 24, 52, 30, 52, scale_d)
    line(r, 35, 52, 41, 52, scale_d)

    # торс
    poly(r, [(20, 26), (45, 26), (47, 38), (43, 48), (22, 48), (18, 37)], body)
    poly(r, [(21, 27), (32, 27), (30, 46), (20, 36)], scale)
    poly(r, [(31, 27), (43, 27), (44, 38), (30, 47)], scale_d)
    # нагрудные пластины и ядро
    poly(r, [(25, 31), (40, 31), (39, 39), (32, 43), (25, 39)], dark)
    poly(r, [(29, 32), (36, 32), (36, 38), (32, 41), (28, 38)], gold)
    poly(r, [(30, 33), (35, 33), (35, 37), (32, 39), (29, 37)], fire)
    line(r, 32, 34, 32, 38, gold_l)
    for y in (34, 38, 42):
        line(r, 22, y, 43, y, gold)
        put(r, 26, y + 1, scale)
        put(r, 39, y + 1, scale)
    # шипы
    for (x, y) in ((18, 28), (47, 28), (25, 27), (40, 27)):
        line(r, x, y, x + (-3 if x < 32 else 3), y - 4, gold)

    # руки
    poly(r, [(20, 27), (12, 31), (10, 42), (16, 46), (21, 38)], body)
    poly(r, [(45, 27), (53, 31), (55, 42), (49, 46), (44, 38)], body)
    box(11, 41, 17, 46, scale)
    box(48, 41, 54, 46, scale)
    for i in range(3):
        line(r, 11 + i * 3, 45, 8 + i * 3, 51, gold)
        line(r, 54 - i * 3, 45, 57 - i * 3, 51, gold)
        put(r, 8 + i * 3, 51, gold_l)
        put(r, 57 - i * 3, 51, gold_l)

    # голова дракона: узкий череп, вытянутая морда
    ellipse(r, 32, 15, 9, 8, body)
    ellipse(r, 32, 14, 7, 6, scale)
    poly(r, [(25, 12), (32, 8), (39, 12), (40, 19), (32, 23), (24, 19)], body)
    poly(r, [(26, 13), (32, 9), (38, 13), (38, 17), (32, 20), (26, 17)], scale)
    # морда и челюсть
    poly(r, [(27, 17), (37, 17), (39, 23), (34, 27), (28, 26), (25, 22)], body)
    poly(r, [(28, 18), (36, 18), (37, 22), (33, 25), (29, 24), (27, 21)], scale)
    box(29, 23, 35, 25, dark)
    for x in (30, 33, 36):
        put(r, x, 22, gold_l)
    put(r, 30, 19, dark); put(r, 34, 19, dark)  # ноздри
    # рога, уходящие назад
    poly(r, [(24, 10), (17, 2), (13, 4), (21, 14)], gold)
    poly(r, [(40, 10), (47, 2), (51, 4), (43, 14)], gold)
    line(r, 22, 9, 18, 4, gold_l)
    line(r, 42, 9, 46, 4, gold_l)
    put(r, 14, 3, gold_l); put(r, 50, 3, gold_l)
    # глаза-щели
    poly(r, [(24, 13), (30, 12), (30, 15), (25, 16)], gold)
    poly(r, [(40, 13), (34, 12), (34, 15), (39, 16)], gold)
    line(r, 25, 14, 29, 14, hx('#2a1208'))
    line(r, 35, 14, 39, 14, hx('#2a1208'))
    put(r, 26, 13, gold_l); put(r, 38, 13, gold_l)
    # надбровные гребни
    line(r, 23, 11, 29, 9, scale)
    line(r, 41, 11, 35, 9, scale)
    line(r, 23, 19, 26, 21, scale_d)
    line(r, 41, 19, 38, 21, scale_d)
    # шея
    poly(r, [(28, 22), (36, 22), (37, 27), (27, 27)], dark)
    for (x, y) in ((26, 18), (38, 18)):
        put(r, x, y, scale_d)
    # искры
    for (x, y) in ((17, 27), (48, 34), (14, 47), (53, 24), (7, 39)):
        put(r, x, y, fire)
        put(r, x, y - 1, gold_l)
    return r


def igris():
    """Рыцарь крови: багровые латы, рогатый шлем, плюмаж, плащ и багровый меч."""
    ar, ad, arl = hx('#8a2230'), hx('#4a0e18'), hx('#c84a52')
    gold, gold_l = hx('#e8c76a'), hx('#fff0b0')
    steel, steel_l = hx('#c9d3dd'), hx('#f4faff')
    r = png.blank(64, 64)

    # плащ с золотой каймой
    poly(r, [(15, 26), (49, 26), (56, 54), (49, 59), (39, 55), (28, 61), (18, 55), (7, 58)], ad)
    poly(r, [(16, 27), (31, 27), (29, 57), (11, 56)], shade(ar, 0.06))
    poly(r, [(33, 27), (48, 27), (53, 53), (37, 58)], shade(ad, -0.2))
    line(r, 12, 32, 9, 56, gold)
    line(r, 50, 32, 56, 53, gold_l)
    for x in range(11, 55, 4):
        put(r, x, 57 + (x % 2), gold if x % 3 else ad)
    # плюмаж, спадающий назад
    poly(r, [(31, 9), (28, 3), (22, 0), (18, 3), (24, 6), (27, 10)], arl)
    poly(r, [(34, 9), (38, 2), (45, 0), (50, 2), (43, 6), (37, 10)], ar)
    for x in range(22, 40, 3):
        line(r, x, 6, x - 2 + (x % 4), 1, gold if x % 2 else arl)
    put(r, 33, 1, gold_l)

    # ноги
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(23, 44, 31, 51, ar)
    box(33, 44, 41, 51, ar)
    box(21, 50, 32, 58, ar)
    box(32, 50, 43, 58, ar)
    box(21, 50, 32, 51, arl)
    box(32, 50, 43, 51, arl)
    box(19, 57, 31, 63, steel)
    box(33, 57, 45, 63, steel)
    box(19, 57, 31, 58, steel_l)
    box(33, 57, 45, 58, steel_l)
    box(19, 62, 31, 63, hx('#6a7480'))
    box(33, 62, 45, 63, hx('#6a7480'))
    put(r, 26, 60, gold); put(r, 38, 60, gold)

    # торс
    poly(r, [(21, 25), (43, 25), (44, 34), (41, 44), (23, 44), (20, 34)], ar)
    poly(r, [(22, 26), (32, 26), (30, 43), (21, 33)], arl)
    poly(r, [(32, 26), (42, 26), (43, 34), (31, 43)], ad)
    poly(r, [(27, 27), (37, 27), (36, 33), (32, 36), (28, 33)], ad)
    # золотой герб
    poly(r, [(30, 30), (34, 30), (34, 36), (32, 39), (30, 36)], gold)
    box(31, 31, 33, 36, hx('#7a1a24'))
    # фаски кирасы
    line(r, 22, 30, 30, 30, gold)
    line(r, 34, 30, 42, 30, gold)
    line(r, 22, 39, 31, 39, shade(ar, -0.4))
    line(r, 33, 39, 41, 39, shade(ar, -0.4))

    # наплечники
    poly(r, [(10, 26), (20, 22), (24, 28), (21, 34), (11, 33)], ar)
    poly(r, [(43, 22), (54, 26), (53, 33), (42, 34), (40, 28)], ar)
    poly(r, [(12, 26), (19, 23), (21, 27), (19, 29), (12, 30)], arl)
    poly(r, [(44, 23), (51, 27), (49, 29), (44, 30), (42, 27)], arl)
    line(r, 10, 32, 21, 33, ad)
    line(r, 43, 33, 54, 32, ad)
    put(r, 17, 29, gold); put(r, 46, 29, gold)
    # шипы наплечников
    line(r, 12, 25, 7, 18, gold); line(r, 52, 25, 57, 18, gold)
    put(r, 7, 17, gold_l); put(r, 57, 17, gold_l)

    # руки
    box(13, 33, 20, 43, ar)
    box(43, 33, 50, 43, ar)
    box(13, 33, 14, 42, arl)
    box(49, 33, 50, 42, ad)
    box(13, 42, 20, 46, steel)
    box(43, 42, 50, 46, steel)
    box(14, 45, 19, 48, steel_l)
    box(44, 45, 49, 48, steel_l)

    # шлем
    ellipse(r, 32, 15, 10, 10, ar)
    ellipse(r, 32, 15, 8, 8, arl)
    poly(r, [(23, 10), (26, 6), (38, 6), (41, 10), (41, 20), (32, 24), (23, 20)], ar)
    poly(r, [(24, 10), (27, 7), (37, 7), (40, 10), (39, 12), (25, 12)], arl)
    # визор
    poly(r, [(24, 13), (40, 13), (38, 18), (26, 18)], hx('#1a0c10'))
    box(27, 14, 30, 16, hx('#ffd23c'))
    box(34, 14, 37, 16, hx('#ffd23c'))
    put(r, 28, 14, gold_l); put(r, 35, 14, gold_l)
    # носовая пластина и рога
    poly(r, [(30, 13), (34, 13), (33, 22), (31, 22)], ad)
    line(r, 22, 9, 16, 3, gold)
    line(r, 42, 9, 48, 3, gold)
    put(r, 16, 2, gold_l); put(r, 48, 2, gold_l)
    line(r, 23, 20, 27, 22, gold)
    line(r, 41, 20, 37, 22, gold)
    # гребень
    for y in range(7, 13):
        put(r, 32, y, gold if y % 2 else gold_l)
    # блики
    for (x, y) in ((25, 15), (39, 15), (24, 24), (40, 24)):
        put(r, x, y, arl)

    # меч
    box(52, 7, 54, 47, arl)
    box(54, 7, 55, 47, steel)
    box(53, 7, 53, 47, steel_l)
    line(r, 55, 8, 55, 46, hx('#8a94a0'))
    poly(r, [(49, 46), (57, 46), (58, 49), (48, 49)], gold)
    box(51, 49, 55, 56, hx('#3a2216'))
    line(r, 52, 50, 52, 55, hx('#6a4a26'))
    put(r, 53, 57, gold_l)
    # свечение клинка
    for y in range(8, 46, 4):
        put(r, 56, y, arl)
    return r


def baruka():
    """Вождь ледяных эльфов: белые волосы, тёмно-синие доспехи, парные клинки."""
    hair, hair_d, hair_l = hx('#e8ecf2'), hx('#a8b4c8'), hx('#ffffff')
    skin, skin_d = hx('#d8c4b4'), hx('#a88878')
    armor, armor_d, armor_l = hx('#263650'), hx('#101a2a'), hx('#4a6a90')
    ice, ice_l, ice_d = hx('#8fe0f8'), hx('#e0faff'), hx('#3a7a9a')
    eye = hx('#5ad8ff')
    r = png.blank(64, 64)

    # длинные волосы за спиной
    poly(r, [(20, 6), (44, 6), (47, 20), (44, 34), (38, 38), (32, 34), (26, 38), (18, 33), (15, 20)], hair)
    poly(r, [(19, 8), (29, 8), (25, 36), (18, 30)], hair_d)
    line(r, 21, 12, 17, 31, hair_l)
    line(r, 43, 12, 46, 31, hair_d)
    for x in range(24, 41, 5):
        line(r, x, 24, x - 1, 36, hair_d)

    # ноги
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(24, 44, 30, 57, armor_d)
    box(34, 44, 40, 57, armor_d)
    box(22, 56, 31, 62, armor)
    box(33, 56, 42, 62, armor)
    box(22, 56, 31, 57, armor_l)
    box(33, 56, 42, 57, armor_l)
    box(21, 62, 31, 63, hx('#0a0f18'))
    box(33, 62, 43, 63, hx('#0a0f18'))
    line(r, 25, 46, 25, 55, armor_l)
    line(r, 35, 46, 35, 55, armor_l)
    put(r, 27, 59, ice); put(r, 37, 59, ice)

    # торс
    poly(r, [(21, 25), (43, 25), (44, 36), (41, 45), (23, 45), (20, 36)], armor)
    poly(r, [(22, 26), (32, 26), (30, 44), (21, 35)], armor_l)
    poly(r, [(32, 26), (42, 26), (43, 36), (31, 44)], armor_d)
    # ледяное ядро на груди
    poly(r, [(32, 29), (37, 34), (32, 41), (27, 34)], ice)
    poly(r, [(32, 31), (35, 34), (32, 39), (29, 34)], ice_l)
    line(r, 32, 31, 32, 39, hx('#ffffff'))
    line(r, 22, 31, 30, 31, ice_d)
    line(r, 34, 31, 42, 31, ice_d)
    # наплечники
    poly(r, [(11, 26), (21, 22), (24, 29), (21, 35), (12, 34)], armor)
    poly(r, [(43, 22), (53, 26), (52, 34), (43, 35), (40, 29)], armor)
    poly(r, [(13, 26), (20, 23), (22, 28), (20, 31), (13, 31)], armor_l)
    poly(r, [(44, 23), (51, 27), (50, 30), (44, 31), (42, 28)], armor_d)
    for (x, y) in ((16, 24), (48, 24)):
        line(r, x, y, x + (-2 if x < 32 else 2), y - 4, ice_l)
    # руки
    box(13, 32, 20, 43, armor)
    box(43, 32, 50, 43, armor)
    box(13, 39, 20, 43, armor_l)
    box(43, 39, 50, 43, armor_d)
    box(15, 43, 19, 47, skin)
    box(44, 43, 48, 47, skin)

    # голова
    ellipse(r, 32, 16, 9, 9, skin)
    poly(r, [(25, 13), (27, 9), (37, 9), (39, 13), (38, 21), (32, 24), (26, 21)], skin)
    line(r, 26, 13, 26, 19, skin_d)
    line(r, 38, 13, 38, 19, skin_d)
    # острые уши
    poly(r, [(25, 14), (18, 9), (21, 17)], skin)
    poly(r, [(39, 14), (46, 9), (43, 17)], skin)
    line(r, 20, 12, 23, 15, skin_d)
    line(r, 44, 12, 41, 15, skin_d)
    # глаза
    poly(r, [(26, 14), (30, 13), (30, 16), (27, 17)], eye)
    poly(r, [(38, 14), (34, 13), (34, 16), (37, 17)], eye)
    put(r, 28, 14, hx('#ffffff')); put(r, 36, 14, hx('#ffffff'))
    line(r, 26, 12, 30, 11, hair_d)
    line(r, 38, 12, 34, 11, hair_d)
    put(r, 32, 17, skin_d); put(r, 32, 18, skin_d)
    line(r, 30, 20, 34, 20, hx('#8a4a5a'))
    # чёлка и пряди
    poly(r, [(24, 9), (30, 6), (32, 12), (26, 13)], hair)
    poly(r, [(40, 9), (34, 6), (32, 12), (38, 13)], hair)
    box(23, 10, 25, 23, hair)
    box(39, 10, 41, 23, hair)
    line(r, 24, 11, 23, 22, hair_l)
    line(r, 40, 12, 40, 22, hair_d)
    put(r, 28, 8, hair_l); put(r, 36, 7, hair_l)

    # парные клинки
    for side in (-1, 1):
        hx0 = 50 if side > 0 else 13
        for i in range(12):
            x = hx0 + side * (i // 4)
            put(r, x, 40 - i, ice_l if i % 3 else ice)
            put(r, x + side, 40 - i, ice_d if i % 2 else ice)
        line(r, hx0 - 3, 40, hx0 + 3, 40, ice)
        box(hx0 - 1, 41, hx0 + 1, 46, hx('#d8e0e8'))
        put(r, hx0, 47, ice_l)
    # ледяные искры
    for (x, y) in ((12, 20), (51, 18), (9, 38), (56, 40), (20, 51), (45, 53)):
        put(r, x, y, ice_l)
    return r


BOSSES1 = {
    'beru': beru,
    'antares': antares,
    'igris': igris,
    'baruka': baruka,
}


def generate(out_dir):
    import os
    made = []
    for cid, fn in BOSSES1.items():
        path = os.path.join(out_dir, cid + '.png')
        png.save_png(path, 64, 64, fn())
        made.append(path)
    return made
