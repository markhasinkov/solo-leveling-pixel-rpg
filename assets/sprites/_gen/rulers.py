# -*- coding: utf-8 -*-
"""Боссы 64x64, часть 2: Осборн, Архитектор, Статуя Бога, Баран."""
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


def baran():
    """Король демонов: рога, корона, багровый плащ, чёрная броня и молниевый клинок."""
    skin, skin_d = hx('#bcaeb0'), hx('#6e5558')
    armor, armor_d, armor_l = hx('#2a1724'), hx('#0d070d'), hx('#51344a')
    cape, cape_d = hx('#6a101c'), hx('#320810')
    gold, gold_l = hx('#d8b45a'), hx('#fff0b0')
    glow, glow_l = hx('#ff3a2a'), hx('#ffd0a0')
    steel, steel_l = hx('#9aa6ba'), hx('#edf4ff')
    r = png.blank(64, 64)

    # рваный багровый плащ
    poly(r, [(16, 22), (48, 22), (59, 46), (56, 62), (45, 57), (38, 63),
             (32, 58), (25, 63), (18, 57), (7, 62), (5, 45)], cape_d)
    poly(r, [(18, 24), (32, 24), (29, 60), (13, 56), (9, 44)], cape)
    poly(r, [(32, 24), (46, 24), (55, 44), (52, 58), (36, 57)], shade(cape, -0.18))
    for (x, y) in ((12, 55), (21, 59), (28, 55), (40, 60), (49, 55)):
        line(r, x, y, x + 2, 62, cape_d)
        put(r, x + 2, 62, shade(cape, -0.35))

    # ноги в чёрных латах
    rect(r, 24, 45, 30, 58, armor_d)
    rect(r, 34, 45, 40, 58, armor_d)
    rect(r, 22, 56, 31, 63, armor)
    rect(r, 33, 56, 42, 63, armor)
    line(r, 24, 62, 30, 62, gold)
    line(r, 34, 62, 40, 62, gold)
    put(r, 25, 60, glow); put(r, 39, 60, glow)

    # торс и нагрудник
    poly(r, [(20, 25), (44, 25), (46, 35), (42, 46), (22, 46), (18, 35)], armor)
    poly(r, [(21, 26), (32, 26), (30, 45), (20, 34)], armor_l)
    poly(r, [(32, 26), (43, 26), (44, 35), (31, 45)], shade(armor, -0.2))
    line(r, 22, 30, 42, 30, gold)
    line(r, 23, 39, 41, 39, shade(gold, -0.3))
    poly(r, [(32, 28), (37, 34), (32, 43), (27, 34)], armor_d)
    poly(r, [(32, 30), (35, 34), (32, 40), (29, 34)], glow)
    line(r, 32, 30, 32, 40, glow_l)

    # наплечники с шипами
    poly(r, [(9, 26), (21, 21), (25, 28), (22, 36), (11, 35)], armor_l)
    poly(r, [(43, 21), (55, 26), (53, 35), (42, 36), (39, 28)], armor_l)
    poly(r, [(12, 26), (20, 23), (22, 28), (20, 31), (12, 31)], armor)
    poly(r, [(44, 23), (52, 27), (50, 31), (44, 31), (42, 28)], armor_d)
    for side in (-1, 1):
        bx = 16 if side < 0 else 48
        line(r, bx, 24, bx + side * 6, 16, gold)
        put(r, bx + side * 6, 16, gold_l)
        line(r, bx, 30, bx + side * 7, 25, shade(gold, -0.25))

    # руки и когтистые латы
    poly(r, [(20, 27), (13, 31), (11, 42), (18, 46), (22, 36)], armor_d)
    poly(r, [(44, 27), (51, 31), (53, 42), (46, 46), (42, 36)], armor_d)
    rect(r, 12, 41, 19, 46, armor)
    rect(r, 45, 41, 52, 46, armor)
    for i in range(3):
        line(r, 12 + i * 3, 45, 9 + i * 3, 51, glow)
        line(r, 52 - i * 3, 45, 55 - i * 3, 51, glow)
        put(r, 9 + i * 3, 51, glow_l)
        put(r, 55 - i * 3, 51, glow_l)

    # голова, рога и корона
    ellipse(r, 32, 16, 10, 10, skin_d)
    ellipse(r, 32, 16, 8, 8, skin)
    poly(r, [(24, 13), (27, 9), (37, 9), (40, 13), (39, 21), (32, 25), (25, 21)], skin)
    poly(r, [(26, 14), (28, 11), (36, 11), (38, 14), (37, 18), (27, 18)], skin_d)
    rect(r, 26, 15, 30, 17, glow)
    rect(r, 34, 15, 38, 17, glow)
    put(r, 28, 15, glow_l); put(r, 36, 15, glow_l)
    line(r, 29, 21, 35, 21, skin_d)
    # рога
    for side in (-1, 1):
        bx = 24 if side < 0 else 40
        line(r, bx, 10, bx + side * 7, 4, hx('#d8c8b0'))
        line(r, bx + side * 2, 9, bx + side * 8, 3, hx('#8a7a62'))
        line(r, bx + side * 7, 4, bx + side * 10, 8, hx('#d8c8b0'))
    # корона
    for i, x in enumerate((23, 27, 32, 37, 41)):
        line(r, x, 8, x, 2 - (i % 2), gold)
        put(r, x, 1 - (i % 2), glow_l)
    poly(r, [(22, 8), (42, 8), (41, 10), (23, 10)], gold)
    put(r, 27, 9, glow); put(r, 37, 9, glow)
    # белые пряди
    line(r, 21, 13, 17, 23, hx('#e8e0d8'))
    line(r, 43, 13, 47, 23, hx('#e8e0d8'))

    # молниевый клинок справа
    line(r, 48, 49, 62, 11, steel)
    line(r, 49, 49, 63, 12, steel_l)
    line(r, 47, 48, 61, 10, shade(steel, -0.35))
    poly(r, [(45, 47), (53, 48), (51, 53), (43, 52)], gold)
    line(r, 46, 49, 52, 50, gold_l)
    rect(r, 48, 52, 53, 58, armor_d)
    line(r, 50, 53, 51, 57, glow)
    for (x, y, x2, y2) in ((54, 22, 61, 18), (57, 34, 63, 29), (52, 40, 59, 43),
                            (44, 20, 49, 15), (46, 34, 52, 30)):
        line(r, x, y, x2, y2, glow_l)
        put(r, x2, y2, glow)
    return r


BOSSES2 = {
    'baran': baran,
    'ashborn': ashborn,
    'architect': architect,
    'statue-of-god': statue_of_god,
}


def generate(out_dir):
    import os
    made = []
    for cid, fn in BOSSES2.items():
        path = os.path.join(out_dir, cid + '.png')
        png.save_png(path, 64, 64, fn())
        made.append(path)
    return made
