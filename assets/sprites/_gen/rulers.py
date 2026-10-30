# -*- coding: utf-8 -*-
"""Боссы 64x64, часть 2: Эшборн, Архитектор, Статуя Бога, Камышовый шаман."""
from . import png, pixelart

put, rect, hx = png.put, png.rect, png.hx
shade, mix = pixelart.shade, pixelart.mix
line, ellipse, poly = pixelart.line, pixelart.ellipse, pixelart.poly


def ashborn():
    """Монарх Теней: капюшон, корона, теневой плащ, фиолетовое свечение и клинок."""
    body, dark, dark2 = hx('#241a3e'), hx('#0c0716'), hx('#170f26')
    robe = hx('#1d1430')
    glow, glow_l = hx('#a06cff'), hx('#e8d4ff')
    gold, gold_l = hx('#d8b45a'), hx('#fff0b0')
    r = png.blank(64, 64)

    # теневые крылья за спиной
    for side in (-1, 1):
        base = 32
        poly(r, [(base, 24), (base + side * 26, 8), (base + side * 24, 26), (base + side * 14, 38), (base, 32)], (40, 24, 70, 150))
        line(r, base, 26, base + side * 22, 11, shade(glow, -0.2))
        line(r, base, 28, base + side * 16, 30, shade(glow, -0.35))

    # плащ-тень
    poly(r, [(17, 22), (47, 22), (54, 44), (58, 62), (45, 58), (38, 63), (32, 58), (25, 63), (18, 58), (6, 62), (11, 42)], dark2)
    poly(r, [(18, 24), (32, 24), (27, 58), (12, 52)], robe)
    poly(r, [(32, 24), (46, 24), (52, 52), (37, 58)], shade(robe, -0.15))
    for x in range(10, 57, 5):
        put(r, x, 59 + (x % 3), dark)
        put(r, x + 1, 60 + (x % 2), shade(robe, 0.1))
    # рваный низ и тени
    for (x, y) in ((14, 57), (22, 60), (30, 56), (40, 61), (48, 56)):
        line(r, x, y, x + 2, 63, dark)

    # ноги в тени
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(24, 44, 30, 57, dark)
    box(34, 44, 40, 57, dark)
    box(22, 56, 31, 62, dark2)
    box(33, 56, 42, 62, dark2)
    put(r, 25, 60, glow); put(r, 39, 60, glow)

    # торс
    poly(r, [(20, 25), (44, 25), (45, 35), (42, 45), (22, 45), (19, 35)], body)
    poly(r, [(21, 26), (32, 26), (30, 44), (20, 34)], shade(body, 0.16))
    poly(r, [(32, 26), (43, 26), (44, 35), (31, 44)], shade(body, -0.2))
    # наплечники-шипы с фаской
    poly(r, [(10, 26), (21, 21), (25, 28), (22, 36), (11, 35)], body)
    poly(r, [(43, 21), (54, 26), (53, 35), (42, 36), (39, 28)], body)
    poly(r, [(12, 26), (20, 23), (22, 28), (20, 31), (12, 31)], shade(body, 0.2))
    poly(r, [(44, 23), (52, 27), (50, 31), (44, 31), (42, 28)], dark)
    line(r, 11, 34, 21, 35, dark)
    line(r, 43, 35, 53, 34, dark)
    for (x, y) in ((16, 24), (48, 24)):
        line(r, x, y, x + (-3 if x < 32 else 3), y - 5, glow)
        put(r, x + (-3 if x < 32 else 3), y - 5, glow_l)
    # нагрудные пластины и руна
    poly(r, [(22, 28), (31, 28), (30, 38), (23, 36)], shade(body, 0.1))
    poly(r, [(33, 28), (42, 28), (41, 36), (33, 38)], shade(body, -0.14))
    line(r, 22, 29, 30, 29, shade(glow, -0.45))
    line(r, 34, 29, 41, 29, shade(glow, -0.45))
    poly(r, [(32, 29), (37, 34), (32, 42), (27, 34)], dark)
    poly(r, [(32, 31), (35, 34), (32, 39), (29, 34)], glow)
    line(r, 32, 31, 32, 39, glow_l)
    poly(r, [(23, 40), (41, 40), (40, 45), (24, 45)], dark)
    line(r, 25, 42, 39, 42, gold)
    put(r, 32, 42, glow_l)

    # руки
    poly(r, [(20, 27), (13, 30), (11, 41), (17, 45), (22, 36)], dark2)
    poly(r, [(44, 27), (51, 30), (53, 41), (47, 45), (42, 36)], dark2)
    box(12, 40, 18, 45, body)
    box(46, 40, 52, 45, body)
    for i in range(3):
        line(r, 12 + i * 3, 44, 9 + i * 3, 50, glow)
        line(r, 52 - i * 3, 44, 55 - i * 3, 50, glow)
        put(r, 9 + i * 3, 50, glow_l)
        put(r, 55 - i * 3, 50, glow_l)

    # капюшон и лицо-тень
    poly(r, [(21, 25), (21, 15), (26, 9), (38, 9), (43, 15), (43, 25), (38, 28), (32, 24), (26, 28)], robe)
    poly(r, [(24, 23), (24, 16), (28, 12), (36, 12), (40, 16), (40, 23), (36, 26), (32, 23), (28, 26)], dark)
    # глаза
    poly(r, [(27, 16), (31, 15), (31, 18), (28, 18)], glow)
    poly(r, [(38, 16), (34, 15), (34, 18), (37, 18)], glow)
    put(r, 28, 16, glow_l); put(r, 36, 16, glow_l)
    # корона
    for i, x in enumerate((23, 28, 32, 37, 41)):
        line(r, x, 9, x, 4 - (i % 2), gold)
        put(r, x, 3 - (i % 2), glow_l)
    poly(r, [(22, 8), (42, 8), (41, 10), (23, 10)], gold)
    put(r, 27, 9, glow); put(r, 37, 9, glow)
    # фиолетовые пряди/дым
    line(r, 22, 12, 19, 22, shade(glow, -0.3))
    line(r, 42, 12, 45, 22, shade(glow, -0.3))

    # клинок
    box(53, 7, 56, 47, shade(glow, -0.4))
    box(54, 7, 55, 47, glow)
    line(r, 55, 8, 55, 46, glow_l)
    line(r, 53, 8, 53, 46, shade(glow, -0.55))
    poly(r, [(49, 46), (59, 46), (60, 49), (48, 49)], gold)
    line(r, 50, 47, 58, 47, gold_l)
    box(52, 49, 57, 55, dark)
    line(r, 54, 50, 54, 54, shade(glow, -0.2))
    put(r, 54, 56, glow_l)
    # тени у ног
    for (x, y) in ((12, 60), (18, 61), (46, 60), (52, 61)):
        line(r, x, y, x + 2, y - 3, shade(glow, -0.25))
    # блики
    for (x, y) in ((18, 33), (46, 34), (22, 50), (42, 52), (13, 23), (51, 20)):
        put(r, x, y, glow if (x + y) % 2 else glow_l)
    return r


def architect():
    """Архитектор: парящий каменный судья с красным ядром, нимбом и жезлом-молотом."""
    st, sd, stl = hx('#8a92a2'), hx('#4a505e'), hx('#bcc4d0')
    stll = hx('#e0e6ee')
    red, red_l = hx('#e8443c'), hx('#ffc8c0')
    gold, gold_l = hx('#d8b45a'), hx('#fff0b0')
    r = png.blank(64, 64)

    # ореол из обломков
    for (x, y, w) in ((20, 2, 5), (27, 0, 6), (35, 1, 5), (42, 3, 4)):
        rect(r, x, y, x + w, y + 1, gold)
        put(r, x + 1, y - 1, gold_l)
    line(r, 18, 4, 22, 3, gold); line(r, 46, 4, 42, 3, gold)

    # мантия
    poly(r, [(20, 25), (44, 25), (47, 44), (49, 61), (15, 61), (17, 44)], sd)
    poly(r, [(21, 26), (32, 26), (31, 59), (17, 59)], st)
    poly(r, [(32, 26), (43, 26), (46, 59), (32, 59)], shade(st, -0.12))
    for x in (23, 28, 33, 38, 43):
        line(r, x, 31, x - 1 + (x % 2), 58, sd)
    line(r, 18, 47, 46, 47, gold)
    line(r, 17, 56, 47, 56, stl)
    # скруглённый парящий подол
    poly(r, [(16, 56), (48, 56), (45, 61), (32, 63), (19, 61)], sd)
    for x in (20, 26, 33, 40, 46):
        put(r, x, 59, st)
        put(r, x - 1, 61, stl)
    ellipse(r, 32, 62, 14, 2, (20, 18, 30, 120))
    # парящие обломки
    for (x, y, w) in ((8, 30, 2), (55, 36, 2), (6, 48, 3), (57, 52, 2)):
        rect(r, x, y, x + w, y + 1, st)
        put(r, x, y, stl)

    # наплечники-блоки
    poly(r, [(11, 25), (21, 22), (24, 29), (21, 35), (12, 34)], st)
    poly(r, [(43, 22), (53, 25), (52, 34), (43, 35), (40, 29)], st)
    poly(r, [(13, 25), (20, 23), (22, 28), (20, 30), (13, 30)], stl)
    poly(r, [(44, 23), (51, 26), (50, 30), (44, 30), (42, 28)], sd)
    line(r, 11, 33, 21, 34, sd)
    line(r, 43, 34, 53, 33, sd)
    put(r, 16, 27, red); put(r, 48, 27, red)

    # руки
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(12, 33, 19, 45, st)
    box(44, 33, 51, 45, st)
    box(12, 33, 13, 44, stl)
    box(50, 33, 51, 44, sd)
    box(13, 44, 19, 48, sd)
    box(44, 44, 50, 48, sd)
    put(r, 16, 46, stl); put(r, 47, 46, stl)

    # голова-маска
    ellipse(r, 32, 16, 9, 9, st)
    ellipse(r, 32, 16, 7, 7, sd)
    poly(r, [(24, 13), (27, 9), (37, 9), (40, 13), (39, 21), (32, 25), (25, 21)], st)
    poly(r, [(25, 14), (28, 10), (36, 10), (39, 14), (38, 17), (26, 17)], sd)
    rect(r, 26, 14, 30, 16, red)
    rect(r, 34, 14, 38, 16, red)
    put(r, 28, 14, red_l); put(r, 36, 14, red_l)
    line(r, 30, 17, 34, 17, sd)
    line(r, 31, 20, 33, 20, stl)
    # трещины на лице
    line(r, 26, 12, 28, 15, stl)
    line(r, 37, 18, 39, 21, stl)
    # золотые вставки
    box(29, 7, 35, 8, gold)
    put(r, 32, 7, red)

    # ядро в груди
    poly(r, [(32, 28), (38, 34), (32, 42), (26, 34)], sd)
    poly(r, [(32, 30), (36, 34), (32, 40), (28, 34)], red)
    poly(r, [(32, 31), (34, 34), (32, 38), (30, 34)], red_l)
    line(r, 32, 30, 32, 40, gold)
    for y in (30, 38):
        line(r, 24, y, 40, y, stl)

    # молот-жезл
    box(53, 7, 55, 58, hx('#4a4f5c'))
    line(r, 54, 8, 54, 57, stl)
    poly(r, [(49, 3), (59, 3), (61, 10), (49, 12), (47, 8)], st)
    poly(r, [(50, 4), (58, 4), (59, 8), (50, 10), (48, 8)], stl)
    rect(r, 49, 9, 59, 11, sd)
    put(r, 54, 1, red); put(r, 54, 2, red_l)
    line(r, 50, 6, 58, 6, gold)
    # искры
    for (x, y) in ((18, 32), (46, 36), (22, 50), (41, 49), (15, 23)):
        put(r, x, y, red if (x + y) % 2 else gold)
    return r


def statue_of_god():
    """Статуя Бога: каменный идол с короной, тогой, постаментом и красными глазами."""
    st, sd, stl = hx('#b8bcc8'), hx('#767c88'), hx('#e2e6ee')
    stll = hx('#f4f6fa')
    red, red_l = hx('#ff2e2e'), hx('#ffb0b0')
    gold, gold_l = hx('#d8b45a'), hx('#fff0b0')
    r = png.blank(64, 64)
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)

    # нимб из лучей
    for (x, y) in ((17, 5), (22, 2), (32, 0), (42, 2), (47, 5), (13, 10), (51, 10)):
        line(r, x, y, 32, 12, gold)
        put(r, x, y, gold_l)

    # голова
    ellipse(r, 32, 17, 11, 11, st)
    ellipse(r, 32, 17, 9, 9, sd)
    poly(r, [(22, 15), (25, 8), (39, 8), (42, 15), (41, 23), (32, 27), (23, 23)], st)
    poly(r, [(24, 15), (27, 10), (37, 10), (40, 15), (39, 20), (32, 24), (25, 20)], sd)
    # глаза
    rect(r, 26, 14, 30, 17, red)
    rect(r, 34, 14, 38, 17, red)
    put(r, 28, 14, red_l); put(r, 36, 14, red_l)
    # нос и рот
    box(31, 17, 33, 18, stl)
    put(r, 31, 19, sd); put(r, 33, 19, sd)
    line(r, 29, 21, 35, 21, hx('#5a5a66'))
    put(r, 28, 20, sd); put(r, 36, 20, sd)
    # каменная борода по краям челюсти
    for x in (25, 26, 27, 37, 38, 39):
        line(r, x, 19, x + (1 if x < 32 else -1), 25, st)
        put(r, x, 24, sd)
    poly(r, [(29, 22), (35, 22), (35, 25), (32, 27), (29, 25)], st)
    line(r, 32, 23, 32, 26, sd)
    # золотая диадема и зубцы короны
    box(23, 10, 41, 12, gold)
    for x in (24, 28, 32, 36, 40):
        line(r, x, 10, x, 6, gold)
        put(r, x, 5, gold_l)
    line(r, 23, 9, 41, 9, gold_l)
    for x in (26, 30, 34, 38):
        put(r, x, 8, gold_l)
    # трещины
    line(r, 25, 12, 27, 17, stl)
    line(r, 38, 16, 36, 21, stl)
    line(r, 23, 20, 27, 23, sd)

    # плечи и тога
    poly(r, [(12, 22), (24, 20), (24, 28), (14, 30)], st)
    poly(r, [(40, 20), (52, 22), (50, 30), (40, 28)], st)
    line(r, 13, 23, 23, 21, stl)
    line(r, 51, 23, 41, 21, stl)
    poly(r, [(19, 27), (45, 27), (47, 39), (45, 53), (19, 53), (17, 39)], st)
    poly(r, [(20, 28), (32, 28), (30, 52), (19, 52)], stl)
    poly(r, [(32, 28), (44, 28), (45, 52), (32, 52)], sd)
    # складки тоги
    for x in (22, 27, 32, 37, 42):
        line(r, x, 34, x - 1 + (x % 3), 51, sd)
    line(r, 19, 51, 45, 51, sd)
    # драпировка через плечо (камень, не ремень)
    poly(r, [(22, 29), (27, 29), (43, 46), (40, 49), (24, 33)], stl)
    line(r, 23, 30, 42, 47, sd)
    line(r, 30, 31, 33, 31, gold)
    line(r, 32, 47, 32, 51, gold)
    # руки и кисти
    box(11, 30, 19, 44, st)
    box(45, 30, 53, 44, st)
    box(11, 30, 12, 43, stl)
    box(52, 30, 53, 43, sd)
    box(12, 43, 20, 48, st)
    box(44, 43, 52, 48, st)
    for x in (14, 17, 46, 49):
        line(r, x, 44, x, 47, sd)
    # разломы
    line(r, 15, 35, 18, 40, sd)
    line(r, 47, 32, 49, 37, stl)
    line(r, 27, 33, 30, 37, sd)
    line(r, 36, 42, 39, 46, sd)

    # постамент
    box(18, 52, 46, 56, sd)
    box(14, 56, 50, 60, st)
    box(14, 56, 50, 57, stl)
    box(12, 60, 52, 63, sd)
    line(r, 16, 61, 31, 61, st)
    line(r, 33, 61, 48, 61, st)
    # высеченные символы
    for (x, y) in ((25, 54), (31, 54), (37, 54)):
        put(r, x, y, gold)
    # трещины и мох
    line(r, 20, 57, 24, 60, stl)
    line(r, 43, 56, 40, 60, sd)
    for (x, y) in ((17, 29), (48, 31), (22, 47), (42, 46)):
        put(r, x, y, hx('#7a8a6a'))
    # аура
    for (x, y) in ((15, 38), (49, 40), (21, 50), (43, 51)):
        put(r, x, y, red_l if (x + y) % 2 else gold)
    return r


def reed_boss():
    """Камышовый шаман: маска, тростниковая корона, лозы, мох и стяг."""
    body, dark, light = hx('#4f6b3a'), hx('#2a3c1e'), hx('#7fa054')
    moss = hx('#8fbf5a')
    reed, reed_d = hx('#c8b45a'), hx('#7a6a2a')
    cloth, cloth_d = hx('#3a5a4a'), hx('#22382e')
    wood = hx('#5b3f22')
    eye, eye_l = hx('#ffd23c'), hx('#fff2a0')
    r = png.blank(64, 64)

    # стяг
    box = lambda x0, y0, x1, y1, c: rect(r, x0, y0, x1, y1, c)
    box(56, 8, 58, 60, wood)
    line(r, 57, 9, 57, 59, hx('#7a5a30'))
    poly(r, [(47, 10), (55, 10), (55, 26), (51, 23), (47, 27)], cloth)
    poly(r, [(48, 11), (54, 11), (54, 23), (51, 21), (48, 24)], cloth_d)
    box(50, 14, 53, 19, reed)
    put(r, 51, 15, eye); put(r, 52, 17, reed_d)

    # ноги-корни
    box(23, 46, 30, 57, body)
    box(34, 46, 41, 57, body)
    box(23, 46, 24, 56, light)
    box(40, 46, 41, 56, dark)
    box(21, 56, 31, 60, dark)
    box(33, 56, 43, 60, dark)
    for x in (22, 27, 34, 39, 43):
        line(r, x, 59, x + (-3 if x < 32 else 3), 63, wood)
    # мох
    for (x, y) in ((24, 58), (36, 59), (41, 57)):
        put(r, x, y, moss)

    # торс из стеблей
    poly(r, [(20, 26), (44, 26), (45, 39), (42, 48), (22, 48), (19, 39)], body)
    poly(r, [(21, 27), (32, 27), (30, 47), (20, 38)], light)
    poly(r, [(32, 27), (43, 27), (44, 39), (31, 47)], shade(body, -0.15))
    for x in (25, 30, 35, 40):
        line(r, x, 29, x - 1 + (x % 2), 46, dark)
    # накидка из листьев
    poly(r, [(20, 30), (44, 30), (43, 36), (21, 36)], cloth)
    poly(r, [(22, 31), (32, 31), (31, 35), (21, 35)], shade(cloth, 0.16))
    box(29, 30, 35, 36, reed)
    box(31, 31, 33, 35, reed_d)
    # амулет
    poly(r, [(32, 37), (36, 40), (32, 45), (28, 40)], moss)
    put(r, 32, 39, eye)

    # руки-лозы
    poly(r, [(20, 28), (13, 31), (11, 42), (16, 46), (21, 37)], body)
    poly(r, [(44, 28), (51, 31), (53, 42), (48, 46), (43, 37)], body)
    for i in range(5):
        line(r, 12 - i, 41 + i, 8 - i, 48 + i, dark)
        line(r, 52 + i, 41 + i, 56 + i, 48 + i, dark)
        put(r, 9 - i, 47 + i, moss)
        put(r, 55 + i, 47 + i, moss)
    # шипы на лозах
    put(r, 16, 35, reed); put(r, 48, 35, reed)
    put(r, 14, 39, reed_d); put(r, 50, 39, reed_d)

    # голова и маска
    ellipse(r, 32, 17, 11, 10, body)
    poly(r, [(21, 14), (24, 8), (40, 8), (43, 14), (42, 23), (32, 27), (22, 23)], dark)
    poly(r, [(23, 13), (26, 9), (38, 9), (41, 13), (40, 21), (32, 24), (24, 21)], hx('#3a3018'))
    # глаза маски
    poly(r, [(25, 13), (30, 12), (30, 16), (26, 17)], eye)
    poly(r, [(39, 13), (34, 12), (34, 16), (38, 17)], eye)
    put(r, 27, 13, eye_l); put(r, 37, 13, eye_l)
    box(28, 15, 29, 16, hx('#2a1a08'))
    box(35, 15, 36, 16, hx('#2a1a08'))
    # резной рот и узоры
    for x in (27, 30, 33, 36):
        put(r, x, 19, reed)
        put(r, x + 1, 20, reed_d)
    line(r, 24, 11, 26, 14, reed_d)
    line(r, 40, 11, 38, 14, reed_d)
    # корона из тростника
    for x in range(21, 44, 3):
        line(r, x, 9, x - 2, 1, reed)
        line(r, x + 1, 9, x - 1, 2, reed_d)
        put(r, x - 2, 0, moss)
    # мох на плечах
    for (x, y) in ((18, 27), (46, 29), (23, 33), (41, 34)):
        put(r, x, y, moss)
        put(r, x + 1, y + 1, dark)
    return r


BOSSES2 = {
    'ashborn': ashborn,
    'architect': architect,
    'statue-of-god': statue_of_god,
    'reed-boss': reed_boss,
}


def generate(out_dir):
    import os
    made = []
    for cid, fn in BOSSES2.items():
        path = os.path.join(out_dir, cid + '.png')
        png.save_png(path, 64, 64, fn())
        made.append(path)
    return made
