# -*- coding: utf-8 -*-
"""Пиксель-арт людей 64x64: лица, причёски, костюмы и оружие по ранобэ.

Пропорции: голова 15x15, плечи 30, рост 60. Светотень в три тона,
отдельные детали лица (белки, радужка, брови, нос, губы) читаются в игре.
"""
from . import png, pixelart

put, rect, hx = png.put, png.rect, png.hx
shade, mix = pixelart.shade, pixelart.mix
line, ellipse, poly = pixelart.line, pixelart.ellipse, pixelart.poly


def build_human(spec):
    r = png.blank(64, 64)
    hair = hx(spec.get('hair', '#1a1a22'))
    skin = hx(spec.get('skin', '#f0c8a0'))
    eye = hx(spec.get('eye', '#3a2a24'))
    top = hx(spec.get('top', '#23232e'))
    dark = hx(spec.get('dark', '#12121a'))
    legs = hx(spec.get('legs', '#2c2c3a'))
    boots = hx(spec.get('boots', '#101016'))
    accent = hx(spec.get('accent', '#9a6cff'))
    metal = hx(spec.get('metal', '#9aa2b8'))
    outfit = spec.get('outfit', 'hunter')
    hair_style = spec.get('hairStyle', 'short')
    weapon = spec.get('weapon')
    special = spec.get('special')
    eye_glow = hx(spec.get('glowEye')) if spec.get('glowEye') else None
    cape = hx(spec.get('cape')) if spec.get('cape') else None

    skin_d = shade(skin, -0.18)
    skin_dd = shade(skin, -0.34)
    skin_l = shade(skin, 0.12)
    hair_d = shade(hair, -0.32)
    hair_l = shade(hair, 0.16)
    top_d = shade(top, -0.24)
    top_l = shade(top, 0.12)
    dark_l = shade(dark, 0.16)
    leg_l = shade(legs, 0.14)
    boot_l = shade(boots, 0.22)
    metal_d = shade(metal, -0.28)
    metal_l = shade(metal, 0.22)
    accent_d = shade(accent, -0.3)
    accent_l = shade(accent, 0.32)

    def box(x0, y0, x1, y1, c):
        rect(r, x0, y0, x1, y1, c)

    def outline_box(x0, y0, x1, y1, c):
        line(r, x0, y0, x1, y0, c)
        line(r, x0, y1, x1, y1, c)
        line(r, x0, y0, x0, y1, c)
        line(r, x1, y0, x1, y1, c)

    # ================= плащ / полы пальто за спиной =================
    if cape:
        poly(r, [(17, 26), (47, 26), (52, 58), (44, 61), (33, 58), (22, 61), (11, 58)], shade(cape, -0.12))
        poly(r, [(18, 27), (31, 27), (27, 58), (13, 57)], shade(cape, 0.05))
        line(r, 14, 29, 11, 57, shade(cape, 0.18))
        line(r, 49, 29, 52, 57, shade(cape, -0.28))
        for x in range(12, 53, 5):
            put(r, x, 58, shade(cape, -0.3))
            put(r, x, 59, shade(cape, -0.4))

    # ================= ноги =================
    if outfit in ('robe', 'healer', 'mage'):
        poly(r, [(21, 33), (42, 33), (45, 57), (43, 61), (19, 61), (17, 57)], top)
        poly(r, [(21, 34), (31, 34), (28, 58), (18, 58)], shade(top, 0.06))
        line(r, 20, 36, 18, 57, shade(top, -0.22))
        line(r, 43, 36, 45, 57, shade(top, -0.3))
        box(23, 48, 40, 50, shade(top, -0.1))
        box(24, 40, 39, 42, dark)
        box(30, 40, 33, 42, accent)
        for y in (35, 45, 55):
            put(r, 27, y, accent)
            put(r, 36, y, accent)
        # подол с каймой
        for x in range(19, 45):
            if 19 <= x <= 44:
                put(r, x, 58, shade(top, -0.35))
                if x % 3 == 0:
                    put(r, x, 59, accent)
        box(22, 59, 29, 63, boots)
        box(34, 59, 41, 63, boots)
        box(22, 59, 29, 60, boot_l)
        box(34, 59, 41, 60, boot_l)
    elif outfit in ('plate', 'beast'):
        box(24, 43, 30, 53, dark)
        box(34, 43, 40, 53, dark)
        box(23, 44, 31, 50, metal)
        box(33, 44, 41, 50, metal)
        box(23, 44, 31, 45, metal_l)
        box(33, 44, 41, 45, metal_l)
        box(24, 50, 30, 52, metal_d)
        box(34, 50, 40, 52, metal_d)
        box(23, 52, 31, 57, metal_d)
        box(33, 52, 41, 57, metal_d)
        box(22, 57, 30, 63, metal)
        box(34, 57, 42, 63, metal)
        box(22, 57, 30, 58, metal_l)
        box(34, 57, 42, 58, metal_l)
        box(22, 62, 30, 63, shade(metal, -0.45))
        box(34, 62, 42, 63, shade(metal, -0.45))
        put(r, 25, 55, accent); put(r, 37, 55, accent)
    elif outfit == 'blouse':
        box(25, 44, 30, 55, '#1a1a22')
        box(34, 44, 39, 55, '#1a1a22')
        line(r, 25, 44, 25, 55, '#2c2c38')
        line(r, 39, 44, 39, 55, '#101016')
        box(24, 55, 31, 62, '#15151c')
        box(33, 55, 40, 62, '#15151c')
        box(24, 55, 31, 56, '#30303c')
        box(33, 55, 40, 56, '#30303c')
        box(24, 62, 31, 63, '#0a0a0e')
        box(33, 62, 40, 63, '#0a0a0e')
        put(r, 29, 57, accent); put(r, 35, 57, accent)
        # длинные полы белого пальто
        poly(r, [(17, 27), (23, 27), (19, 58), (11, 55)], '#e8e4ec')
        poly(r, [(41, 27), (47, 27), (52, 55), (45, 58)], '#e8e4ec')
        line(r, 12, 45, 10, 55, '#c8a040')
        line(r, 50, 45, 52, 55, '#c8a040')
        line(r, 19, 30, 12, 55, '#d4d0dc')
    elif outfit == 'tracksuit':
        box(24, 44, 30, 56, top)
        box(34, 44, 40, 56, top)
        box(24, 44, 25, 56, hx('#e8eef8'))
        box(39, 44, 40, 56, hx('#e8eef8'))
        box(22, 56, 31, 60, hx('#e8eef8'))
        box(33, 56, 42, 60, hx('#e8eef8'))
        box(22, 60, 30, 63, hx('#c8d0dc'))
        box(34, 60, 42, 63, hx('#c8d0dc'))
        box(22, 59, 30, 60, hx('#ffffff'))
        box(34, 59, 42, 60, hx('#ffffff'))
    else:
        box(23, 42, 31, 57, legs)
        box(33, 42, 41, 57, legs)
        box(23, 43, 24, 56, leg_l)
        box(40, 43, 41, 56, shade(legs, -0.25))
        box(30, 43, 31, 56, shade(legs, -0.3))
        box(33, 43, 34, 56, shade(legs, -0.3))
        line(r, 24, 50, 30, 50, shade(legs, -0.18))
        line(r, 34, 50, 40, 50, shade(legs, -0.18))
        box(21, 57, 31, 62, boots)
        box(33, 57, 43, 62, boots)
        box(21, 57, 31, 58, boot_l)
        box(33, 57, 43, 58, boot_l)
        box(20, 62, 31, 63, shade(boots, -0.4))
        box(33, 62, 44, 63, shade(boots, -0.4))
        put(r, 28, 59, accent_d); put(r, 36, 59, accent_d)

    # ================= торс =================
    if outfit == 'suit':
        poly(r, [(21, 25), (42, 25), (43, 34), (41, 43), (23, 43), (20, 34)], dark)
        box(21, 26, 41, 28, shade(dark, 0.1))
        box(20, 34, 21, 42, shade(dark, 0.16))
        box(41, 34, 42, 42, shade(dark, -0.12))
        # рубашка и галстук
        box(29, 26, 35, 39, hx('#e8ecf4'))
        box(29, 26, 35, 27, hx('#ffffff'))
        line(r, 29, 28, 29, 39, hx('#c8d2de'))
        box(31, 28, 33, 37, accent)
        poly(r, [(31, 28), (33, 28), (32, 34)], accent_l)
        put(r, 32, 38, accent_d)
        # лацканы
        poly(r, [(26, 26), (30, 27), (29, 39), (26, 33)], shade(dark, -0.28))
        poly(r, [(37, 26), (33, 27), (34, 39), (37, 33)], shade(dark, -0.28))
        for y in (30, 34, 38):
            put(r, 36, y, accent_l)
        if spec.get('badge', True):
            box(37, 28, 40, 31, hx('#e8c76a'))
            box(38, 29, 39, 30, hx('#6a5420'))
        box(22, 41, 41, 43, dark)
        box(29, 41, 34, 42, accent)
    elif outfit in ('plate', 'beast'):
        poly(r, [(21, 26), (42, 26), (43, 33), (41, 40), (23, 40), (20, 33)], metal)
        box(21, 26, 42, 27, metal_l)
        box(21, 39, 42, 40, metal_d)
        line(r, 22, 29, 41, 29, shade(metal, 0.1))
        poly(r, [(29, 30), (34, 30), (35, 36), (32, 39), (28, 36)], accent)
        poly(r, [(31, 32), (33, 32), (33, 35), (31, 35)], accent_l)
        for x in (24, 38):
            put(r, x, 31, metal_l); put(r, x, 37, metal_d)
        box(23, 40, 41, 43, dark)
        box(30, 40, 34, 43, accent)
        # наплечники
        poly(r, [(11, 27), (20, 24), (23, 29), (21, 33), (12, 33)], metal)
        poly(r, [(43, 24), (52, 27), (51, 33), (42, 33), (40, 29)], metal)
        poly(r, [(13, 27), (19, 25), (21, 28), (19, 30), (13, 30)], metal_l)
        poly(r, [(44, 25), (51, 28), (50, 30), (44, 30), (42, 28)], metal_l)
        line(r, 12, 32, 21, 32, metal_d)
        line(r, 42, 32, 51, 32, metal_d)
        put(r, 17, 29, accent); put(r, 46, 29, accent)
        if outfit == 'beast':
            # меховая мантия только на плечах, лицо открыто
            for (x, y, rx, ry) in ((14, 27, 4, 2), (19, 26, 4, 2), (30, 26, 4, 2),
                                   (41, 26, 4, 2), (46, 27, 4, 2), (50, 28, 3, 2)):
                ellipse(r, x, y, rx, ry, hx('#eef0f2'))
            for x in range(13, 52, 4):
                put(r, x, 29, hx('#d0d6dc'))
                put(r, x + 1, 28, hx('#f8fafc'))
            # тигриные полосы
            for (x, y) in ((15, 31), (17, 34), (48, 31), (46, 34)):
                line(r, x, y, x + 2, y, hx('#2a3a4a'))
    elif outfit in ('robe', 'healer', 'mage'):
        poly(r, [(21, 25), (42, 25), (43, 35), (41, 43), (23, 43), (20, 35)], top)
        box(21, 26, 42, 27, top_l)
        box(20, 34, 21, 42, shade(top, -0.25))
        box(41, 34, 42, 42, shade(top, -0.3))
        # V-воротник
        poly(r, [(26, 23), (32, 34), (32, 39), (23, 29)], dark)
        poly(r, [(37, 23), (32, 34), (32, 39), (40, 29)], dark)
        box(27, 23, 37, 25, shade(dark, 0.12))
        box(25, 31, 39, 33, dark)
        box(30, 31, 33, 33, accent)
        for y in (35, 38):
            put(r, 25, y, accent); put(r, 38, y, accent)
        box(23, 40, 41, 43, dark)
        box(29, 41, 34, 43, accent)
        if outfit == 'healer':
            box(22, 27, 41, 28, hx('#f8f4fa'))
            box(24, 29, 39, 30, hx('#f0dce8'))
            box(30, 35, 34, 39, accent)
            box(28, 36, 36, 38, accent)
        if outfit == 'mage':
            for y in (28, 33, 38):
                line(r, 23, y, 41, y, accent_d)
            box(21, 26, 22, 42, accent)
            box(41, 26, 42, 42, accent)
    elif outfit == 'blouse':
        # белая блуза с чёрным бантом
        poly(r, [(21, 26), (42, 26), (42, 38), (40, 42), (23, 42), (21, 37)], '#f2eef4')
        box(21, 26, 41, 27, '#fbf7ff')
        box(40, 33, 41, 41, '#d8d2e0')
        box(22, 33, 23, 41, '#ffffff')
        line(r, 29, 27, 29, 40, '#e0dae6')
        for y in (30, 34, 38):
            put(r, 35, y, accent)
        box(29, 23, 34, 25, '#22222a')
        # бант
        poly(r, [(29, 24), (26, 22), (26, 27), (29, 26)], '#22222a')
        poly(r, [(35, 24), (38, 22), (38, 27), (35, 26)], '#22222a')
        box(31, 24, 33, 25, '#3a3a44')
        box(30, 27, 33, 31, '#22222a')
        box(31, 27, 32, 30, '#3a3a44')
        box(23, 39, 40, 42, '#24242e')
        box(30, 40, 34, 42, accent)
        put(r, 32, 40, accent_l)
    elif outfit == 'tracksuit':
        poly(r, [(20, 25), (43, 25), (44, 33), (42, 43), (22, 43), (20, 33)], top)
        box(21, 26, 42, 27, shade(top, 0.2))
        box(20, 33, 21, 42, shade(top, -0.2))
        box(42, 33, 43, 42, shade(top, -0.3))
        box(31, 26, 32, 42, hx('#e8eef8'))
        box(31, 26, 32, 26, hx('#ffffff'))
        box(22, 30, 27, 32, shade(top, -0.15))
        box(36, 30, 41, 32, shade(top, -0.15))
        box(22, 35, 27, 38, shade(top, -0.18))
        box(36, 35, 41, 38, shade(top, -0.18))
        box(24, 22, 39, 26, dark)
        box(25, 23, 38, 25, shade(top, 0.1))
        box(23, 41, 40, 43, shade(top, -0.25))
        box(29, 41, 34, 43, hx('#e8eef8'))
    else:
        # охотничья куртка
        poly(r, [(20, 25), (43, 25), (44, 34), (42, 43), (22, 43), (19, 34)], top)
        box(20, 26, 42, 27, top_l)
        box(19, 34, 20, 42, shade(top, -0.22))
        box(42, 34, 43, 42, shade(top, -0.3))
        # высокий воротник
        poly(r, [(26, 22), (32, 23), (32, 28), (26, 26)], dark)
        poly(r, [(37, 22), (32, 23), (32, 28), (36, 26)], dark)
        box(27, 23, 31, 24, shade(dark, 0.2))
        box(33, 23, 36, 24, shade(dark, 0.2))
        # V-вырез с кожей
        poly(r, [(30, 26), (34, 26), (32, 31)], skin_d)
        line(r, 32, 27, 32, 40, accent)
        put(r, 32, 27, accent_l)
        box(23, 31, 25, 40, dark)
        box(39, 31, 41, 40, dark)
        box(23, 34, 25, 35, accent_d)
        box(39, 34, 41, 35, accent_d)
        box(21, 40, 42, 43, dark)
        box(29, 40, 34, 43, accent)
        # карманы и швы
        line(r, 22, 34, 29, 34, shade(top, -0.2))
        line(r, 35, 34, 42, 34, shade(top, -0.2))
        line(r, 22, 28, 22, 40, shade(top, 0.08))
        if outfit == 'veteran':
            box(20, 23, 43, 26, dark)
            box(23, 29, 26, 33, accent)
            box(38, 29, 41, 33, accent)
            for x in range(20, 44, 6):
                put(r, x, 28, shade(top, 0.22))

    # ================= руки =================
    arm_style = 'normal'
    if outfit in ('plate', 'beast'):
        box(14, 31, 20, 39, metal)
        box(43, 31, 49, 39, metal)
        box(14, 31, 20, 32, metal_l)
        box(43, 31, 49, 32, metal_l)
        box(14, 38, 20, 41, metal_d)
        box(43, 38, 49, 41, metal_d)
        box(15, 41, 19, 45, skin)
        box(44, 41, 48, 45, skin)
        put(r, 17, 43, skin_l); put(r, 45, 43, skin_l)
        line(r, 16, 34, 19, 34, metal_d)
        line(r, 44, 34, 47, 34, metal_d)
    elif outfit in ('robe', 'healer', 'mage'):
        poly(r, [(14, 27), (20, 27), (19, 39), (17, 42), (12, 39)], top)
        poly(r, [(43, 27), (49, 27), (51, 39), (46, 42), (44, 39)], top)
        line(r, 13, 37, 17, 40, accent)
        line(r, 50, 37, 46, 40, accent)
        box(15, 41, 19, 45, skin)
        box(44, 41, 48, 45, skin)
        put(r, 17, 43, skin_l); put(r, 45, 43, skin_l)
    elif outfit == 'blouse':
        ellipse(r, 19, 29, 4, 3, '#f2eef4')
        ellipse(r, 44, 29, 4, 3, '#f2eef4')
        box(16, 30, 21, 38, '#f2eef4')
        box(42, 30, 47, 38, '#f2eef4')
        box(16, 37, 21, 38, accent)
        box(42, 37, 47, 38, accent)
        box(16, 38, 20, 44, skin)
        box(43, 38, 47, 44, skin)
        put(r, 18, 41, skin_l); put(r, 45, 41, skin_l)
    elif outfit == 'tracksuit':
        box(15, 27, 20, 38, top)
        box(43, 27, 48, 38, top)
        box(15, 27, 16, 38, hx('#e8eef8'))
        box(47, 27, 48, 38, hx('#e8eef8'))
        box(15, 37, 20, 39, shade(top, -0.25))
        box(43, 37, 48, 39, shade(top, -0.25))
        box(16, 39, 20, 44, skin)
        box(43, 39, 47, 44, skin)
        put(r, 18, 41, skin_l); put(r, 45, 41, skin_l)
    else:
        box(14, 27, 20, 38, top)
        box(43, 27, 49, 38, top)
        box(14, 27, 15, 37, shade(top, 0.1))
        box(48, 27, 49, 37, shade(top, -0.2))
        box(14, 34, 20, 37, shade(top, -0.18))
        box(43, 34, 49, 37, shade(top, -0.22))
        box(14, 36, 20, 39, dark)
        box(43, 36, 49, 39, dark)
        box(15, 39, 20, 44, skin)
        box(43, 39, 48, 44, skin)
        put(r, 18, 41, skin_l); put(r, 45, 41, skin_l)
        line(r, 16, 41, 16, 43, skin_d)
        line(r, 47, 41, 47, 43, skin_d)

    # ================= шея и лицо =================
    box(29, 20, 34, 25, skin_d)
    box(30, 21, 33, 25, skin)
    line(r, 30, 24, 33, 24, skin_dd)

    # задняя масса волос (только по бокам, лицо остаётся открытым)
    if hair_style == 'long':
        poly(r, [(22, 9), (41, 9), (43, 20), (41, 29), (36, 33), (32, 28), (28, 33), (23, 29), (21, 20)], hair)
        poly(r, [(23, 10), (30, 10), (27, 31), (23, 27)], shade(hair, 0.06))
        line(r, 24, 12, 22, 26, shade(hair, 0.16))
        line(r, 41, 12, 43, 26, shade(hair, -0.24))
        for x in range(24, 41, 4):
            put(r, x, 28 + (x % 4), shade(hair, -0.18))
        # низкий хвост с заколкой
        poly(r, [(38, 21), (44, 20), (47, 26), (46, 34), (42, 37), (39, 32), (41, 26)], hair)
        line(r, 40, 23, 43, 33, shade(hair, 0.14))
        box(39, 20, 43, 22, accent_d)
        put(r, 40, 21, accent)
    elif hair_style == 'ponytail':
        poly(r, [(24, 8), (40, 8), (42, 17), (39, 24), (34, 22), (29, 24), (23, 21), (22, 15)], hair)
        line(r, 24, 11, 22, 20, shade(hair, 0.14))
        line(r, 40, 11, 42, 20, shade(hair, -0.22))
        for x in range(25, 40, 5):
            put(r, x, 21 + (x % 3), shade(hair, -0.16))

    # форма лица
    face = [
        (9, 28, 36), (10, 27, 37), (11, 26, 38), (12, 26, 38), (13, 26, 38),
        (14, 26, 38), (15, 26, 38), (16, 26, 38), (17, 26, 38), (18, 27, 37),
        (19, 28, 36), (20, 29, 35), (21, 30, 34), (22, 31, 33),
    ]
    for (y, x0, x1) in face:
        for x in range(x0, x1 + 1):
            put(r, x, y, skin)
    box(28, 9, 36, 9, skin_l)
    box(30, 10, 35, 11, skin_l)
    line(r, 26, 12, 26, 19, skin_d)
    line(r, 38, 12, 38, 19, skin_d)
    put(r, 27, 21, skin_d); put(r, 37, 21, skin_d)
    put(r, 30, 22, skin_d); put(r, 34, 22, skin_d)

    # уши
    box(24, 14, 25, 17, skin)
    box(39, 14, 40, 17, skin)
    put(r, 24, 16, skin_d); put(r, 39, 16, skin_d)

    # брови
    brow = shade(hair, -0.15)
    thin = hair_style in ('long', 'ponytail')
    if thin:
        line(r, 27, 13, 29, 13, brow)
        line(r, 35, 13, 37, 13, brow)
    else:
        line(r, 27, 13, 29, 12, brow)
        line(r, 35, 12, 37, 13, brow)
        put(r, 30, 13, brow); put(r, 34, 13, brow)

    # глаза: узкая радужка, аккуратный белок
    for (ex, ix) in ((27, 28), (35, 35)):
        # тень глазницы
        put(r, ex, 14, skin_d)
        put(r, ix, 14, skin_d)
        if eye_glow:
            # светящийся разрез: тёмная глазница, яркая радужка
            put(r, ex, 15, shade(eye_glow, -0.55))
            put(r, ex, 16, shade(eye_glow, -0.6))
            put(r, ix, 15, eye_glow)
            put(r, ix, 16, shade(eye_glow, -0.2))
            put(r, ix, 14, shade(eye_glow, 0.35))
            put(r, ex, 15, shade(eye_glow, -0.25))
        else:
            put(r, ex, 15, hx('#f4f8ff'))
            put(r, ex, 16, hx('#e4ebf4'))
            put(r, ix, 15, eye)
            put(r, ix, 16, shade(eye, -0.3))
            put(r, ix, 14, skin_d)
        if thin:
            put(r, 26 if ex == 27 else 37, 14, hx('#2a2028'))
        put(r, ex, 17, skin_d)

    # нос и губы
    put(r, 32, 17, skin_d)
    put(r, 32, 18, skin_dd)
    put(r, 33, 17, skin_l)
    mouth = hx('#9a5a62') if thin else hx('#8a4a52')
    line(r, 31, 20, 33, 20, mouth)
    put(r, 30, 20, skin_d); put(r, 34, 20, skin_d)
    put(r, 32, 21, skin_l)
    if thin:
        put(r, 29, 18, mix(skin, accent, 0.12)); put(r, 35, 18, mix(skin, accent, 0.12))

    if spec.get('beard'):
        for x in range(26, 39):
            if 19 <= x or x in (26, 38):
                put(r, x, 22 + (x % 2), hair)
                put(r, x, 23 + (x % 2), shade(hair, -0.18))
        for x in range(27, 38):
            put(r, x, 24, shade(hair, -0.08))
        box(29, 20, 35, 21, hair)
        box(30, 20, 34, 20, shade(hair, 0.12))
        box(28, 25, 37, 25, shade(hair, -0.22))
        line(r, 28, 23, 27, 24, hx('#d8d8d0'))
        put(r, 31, 23, hx('#e8e8e0')); put(r, 35, 22, hx('#d8d8d0'))

    if special in ('go', 'song'):
        put(r, 26, 17, skin_d); put(r, 38, 17, skin_d)
        put(r, 27, 18, skin_d); put(r, 37, 18, skin_d)
        line(r, 26, 12, 27, 11, skin_d)
        line(r, 37, 11, 38, 12, skin_d)

    if spec.get('glasses'):
        g = hx('#12161e')
        # оправа
        box(26, 14, 30, 14, g)
        box(26, 17, 30, 17, g)
        box(26, 15, 26, 16, g)
        box(30, 15, 30, 16, g)
        box(34, 14, 38, 14, g)
        box(34, 17, 38, 17, g)
        box(34, 15, 34, 16, g)
        box(38, 15, 38, 16, g)
        line(r, 31, 15, 33, 15, g)
        put(r, 28, 15, hx('#9fe6ff')); put(r, 36, 15, hx('#9fe6ff'))
        put(r, 27, 14, hx('#5a6a7a')); put(r, 35, 14, hx('#5a6a7a'))

    # ================= волосы: шапка и чёлка =================
    if hair_style == 'spiky':
        # плотная масса волос и толстые острые пряди
        poly(r, [(21, 12), (21, 7), (25, 4), (31, 1), (38, 3), (42, 7), (43, 12), (39, 9), (32, 7), (25, 9)], hair)
        poly(r, [(22, 6), (25, 0), (29, 7)], hair)
        poly(r, [(27, 5), (31, 0), (34, 6)], hair)
        poly(r, [(33, 5), (37, 1), (40, 7)], hair)
        poly(r, [(38, 6), (42, 3), (43, 9)], hair)
        box(23, 7, 41, 11, hair)
        line(r, 27, 2, 27, 7, hair_l)
        line(r, 31, 1, 31, 6, hair_l)
        line(r, 36, 3, 36, 7, hair_l)
        line(r, 24, 8, 29, 7, hair_d)
        line(r, 35, 7, 40, 9, hair_d)
        # виски и бакенбарды
        box(22, 10, 25, 18, hair)
        box(40, 10, 43, 18, hair)
        box(22, 10, 23, 18, hair_d)
        box(42, 10, 43, 18, hair_d)
        # косматая чёлка, глаза остаются открытыми
        box(25, 9, 30, 12, hair)
        box(32, 9, 37, 11, hair)
        box(38, 10, 40, 15, hair)
        box(24, 11, 27, 15, hair)
        put(r, 29, 12, hair_d); put(r, 34, 12, hair_d)
        put(r, 27, 10, hair_l); put(r, 36, 9, hair_l)
        put(r, 24, 16, hair); put(r, 41, 16, hair)
    elif hair_style == 'slick':
        for y, x0, x1 in ((6, 27, 38), (7, 25, 40), (8, 24, 41), (9, 25, 40)):
            box(x0, y, x1, y, hair)
        box(24, 9, 25, 15, hair)
        box(40, 9, 41, 15, hair)
        box(26, 10, 39, 10, hair_d)
        line(r, 28, 7, 32, 9, hair_l)
        line(r, 36, 7, 33, 9, hair_l)
        put(r, 26, 11, hair); put(r, 38, 11, hair)
        box(24, 12, 25, 16, hair_d)
        box(40, 12, 41, 16, hair_d)
    elif hair_style == 'buzz':
        box(25, 7, 40, 10, hair)
        box(26, 6, 39, 6, hair_d)
        box(26, 8, 39, 8, hair_l)
        box(24, 10, 25, 14, hair_d)
        box(40, 10, 41, 14, hair_d)
        line(r, 27, 10, 39, 10, hair_d)
    elif hair_style in ('long', 'ponytail'):
        # мягкая шапка и пробор
        for y, x0, x1 in ((7, 27, 38), (8, 25, 40), (9, 25, 40)):
            box(x0, y, x1, y, hair)
        poly(r, [(24, 9), (30, 8), (31, 12), (25, 14)], hair)
        poly(r, [(40, 9), (34, 8), (33, 12), (39, 14)], hair)
        side_end = 20
        box(22, 10, 25, side_end, hair)
        box(39, 10, 42, side_end, hair)
        box(22, 10, 23, side_end, hair_d)
        box(41, 10, 42, side_end, shade(hair, -0.15))
        line(r, 24, 12, 23, side_end - 1, hair_l)
        line(r, 40, 13, 41, side_end - 1, shade(hair, 0.12))
        if hair_style == 'ponytail':
            # высокий хвост и золотой зажим
            poly(r, [(39, 9), (44, 8), (48, 13), (49, 22), (46, 30), (42, 34), (41, 29), (44, 20), (42, 13)], hair)
            line(r, 43, 10, 47, 14, hair_l)
            line(r, 46, 15, 48, 27, shade(hair, -0.2))
            box(40, 10, 44, 12, accent)
            put(r, 41, 10, accent_l); put(r, 43, 12, accent_d)
            # косой пробор: чёлка уходит вправо
            box(26, 9, 35, 10, hair)
            box(30, 11, 38, 11, hair)
            box(35, 12, 39, 13, hair)
            put(r, 36, 11, hair_l); put(r, 30, 10, hair_d)
            put(r, 26, 11, hair); put(r, 26, 12, hair_l)
        else:
            put(r, 28, 11, hair_l); put(r, 35, 10, hair_l)
            box(27, 12, 30, 13, hair); box(34, 12, 37, 13, hair)
    else:
        # короткая стрижка
        for y, x0, x1 in ((6, 27, 38), (7, 25, 40), (8, 24, 41), (9, 24, 41), (10, 24, 41)):
            box(x0, y, x1, y, hair)
        box(24, 10, 26, 17, hair)
        box(39, 10, 41, 17, hair)
        line(r, 26, 8, 30, 7, hair_l)
        line(r, 35, 7, 38, 8, hair_l)
        # чёлка
        box(26, 10, 31, 12, hair)
        box(33, 10, 38, 11, hair)
        box(32, 10, 32, 11, hair_d)
        put(r, 28, 12, hair_d); put(r, 35, 11, hair_d)
        put(r, 25, 12, hair); put(r, 39, 12, hair)
        box(24, 15, 25, 17, hair_d)
        box(40, 15, 41, 17, hair_d)

    # блики на макушке
    if hair_style != 'buzz':
        put(r, 30, 8, hair_l)
        put(r, 37, 9, hair_l)
    if special in ('cha',):
        put(r, 34, 10, hx('#fff4c0')); put(r, 37, 12, hx('#ffe8a0'))

    # ================= особые детали =================
    if special == 'jinwoo':
        # полы охотничьего пальто
        poly(r, [(16, 38), (22, 38), (22, 59), (14, 57)], dark)
        poly(r, [(42, 38), (48, 38), (50, 57), (42, 59)], dark)
        line(r, 16, 41, 15, 57, accent)
        line(r, 47, 41, 49, 56, accent)
        # холодный контровой свет, чтобы силуэт не тонул в тёмной арене
        line(r, 21, 26, 30, 26, '#4a4a62')
        line(r, 19, 28, 19, 41, '#3c3c54')
        line(r, 20, 32, 20, 39, '#303044')
        line(r, 43, 28, 43, 40, '#2e2e42')
        line(r, 17, 43, 16, 56, '#323248')
        line(r, 47, 44, 49, 55, '#2a2a3c')
        put(r, 26, 6, '#524a70'); put(r, 33, 5, '#4a4266')
        line(r, 21, 40, 21, 57, shade(dark, 0.2))
        line(r, 43, 40, 43, 57, shade(dark, 0.12))
        # подсумок на поясе
        box(38, 36, 42, 40, dark)
        box(39, 37, 41, 39, accent_d)
        # тени у ног
        for (x, y) in ((19, 56), (22, 58), (46, 55), (43, 59), (17, 52)):
            put(r, x, y, accent_d)
    elif special == 'cha':
        # золотая отделка белого пальто и блузы
        for y in (28, 33, 38):
            put(r, 23, y, accent)
            put(r, 40, y, accent)
        line(r, 11, 44, 10, 54, accent)
        line(r, 52, 44, 52, 54, accent)
        # золотой зажим хвоста уже нарисован; блик на клинке
    elif special == 'song':
        for x in range(20, 45, 4):
            box(x, 22, x + 3, 24, hx('#c8c4b4'))
            put(r, x + 1, 21, hx('#e0dccc'))
        box(23, 25, 41, 26, hx('#8a8a7a'))
    elif special == 'lee':
        box(30, 33, 34, 37, accent)
        box(28, 34, 36, 36, accent)
        box(31, 34, 33, 36, hx('#ffffff'))
        for x in range(24, 40, 4):
            put(r, x, 28, hx('#ffffff'))
    elif special == 'baek':
        for y in (29, 34, 39):
            put(r, 23, y, hx('#6ad7ff')); put(r, 40, y, hx('#6ad7ff'))
        for x in (14, 17, 46, 49):
            line(r, x, 43, x + 1, 47, hx('#e8f4ff'))
    elif special == 'kim':
        box(27, 23, 37, 25, hx('#b83232'))
        box(36, 24, 40, 36, hx('#8a2020'))
        poly(r, [(16, 40), (22, 40), (21, 58), (14, 56)], hx('#4a1a1a'))
        poly(r, [(42, 40), (48, 40), (50, 56), (43, 58)], hx('#4a1a1a'))
        line(r, 17, 42, 16, 56, accent)
        line(r, 47, 42, 49, 55, accent)
        line(r, 27, 13, 29, 15, hx('#c88a7a'))  # шрам
    elif special == 'choi':
        poly(r, [(16, 40), (22, 40), (21, 59), (14, 57)], hx('#181820'))
        poly(r, [(42, 40), (48, 40), (50, 57), (43, 59)], hx('#181820'))
        line(r, 17, 42, 16, 57, accent)
        line(r, 47, 42, 49, 56, accent)
        for (x, y) in ((18, 38), (46, 35), (25, 26), (39, 26), (15, 48)):
            put(r, x, y, hx('#ff8a3c'))
            put(r, x, y - 1, hx('#ffd24a'))
    elif special == 'min':
        box(30, 32, 34, 38, accent)
        box(28, 34, 36, 36, accent)
        box(31, 33, 33, 37, hx('#ffffff'))
        box(22, 26, 42, 27, hx('#ffffff'))
        line(r, 25, 30, 25, 39, accent_d)
        line(r, 39, 30, 39, 39, accent_d)
    elif special == 'go':
        # золотые часы/бейдж
        box(38, 28, 41, 31, hx('#e8c76a'))
        box(39, 29, 40, 30, hx('#6a5420'))
        line(r, 22, 27, 30, 27, shade(dark, 0.2))

    # ================= оружие =================
    side = spec.get('weaponSide', 1)

    def wp(x, y, c):
        put(r, 63 - x if side < 0 else x, y, c)

    def wb(x0, y0, x1, y1, c):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                wp(x, y, c)

    if weapon == 'dagger':
        wb(48, 29, 49, 38, hx('#d8e2ea'))
        wb(49, 29, 49, 38, hx('#f4faff'))
        wp(48, 28, hx('#9ab6c8'))
        wb(45, 38, 52, 39, hx('#c8a040'))
        wp(46, 38, hx('#f0dc8a')); wp(51, 38, hx('#f0dc8a'))
        wb(47, 39, 49, 44, hx('#4a3520'))
        wb(48, 40, 48, 43, hx('#6b4a2a'))
        wp(48, 45, hx('#c8a040'))
        if special == 'jinwoo':
            for (x, y) in ((50, 30), (51, 32), (50, 34), (52, 30)):
                wp(x, y, accent)
    elif weapon == 'sword':
        wb(48, 13, 49, 40, hx('#c9d3dd'))
        wb(49, 13, 49, 40, hx('#f4faff'))
        wp(48, 12, hx('#9ab6c8'))
        wb(45, 40, 52, 41, hx('#c8a040'))
        wb(45, 41, 52, 41, hx('#8a6b2f'))
        wb(46, 42, 51, 42, hx('#e8d080'))
        wb(47, 42, 49, 47, hx('#4a3520'))
        wb(48, 43, 48, 46, hx('#7a5a2a'))
        wp(48, 48, hx('#c8a040'))
        wp(48, 49, accent)
    elif weapon == 'rapier':
        wb(50, 13, 50, 41, hx('#f4faff'))
        wp(51, 15, hx('#c8d8e8'))
        wp(49, 41, hx('#c8a040'))
        wb(46, 41, 54, 42, hx('#e8c76a'))
        wp(47, 42, hx('#fff0b0')); wp(53, 42, hx('#fff0b0'))
        line(r, 50, 43, 53, 47, hx('#c8a040'))
        line(r, 50, 43, 47, 47, hx('#c8a040'))
        wb(49, 43, 50, 47, hx('#3a2a20'))
        wp(49, 48, accent)
    elif weapon == 'staff':
        wb(50, 10, 50, 60, hx('#6b4a26'))
        wp(51, 11, hx('#8a6230'))
        for y in (18, 30, 42, 54):
            wb(49, y, 52, y, hx('#c8a040'))
        gem = hx(spec.get('staffGem', '#9fe6ff'))
        poly(r, [(50, 3), (54, 8), (50, 13), (46, 8)], gem)
        poly(r, [(50, 4), (52, 8), (50, 11), (48, 8)], shade(gem, 0.3))
        wp(50, 4, hx('#ffffff'))
        for (x, y) in ((45, 6), (55, 7), (47, 12), (53, 12)):
            wp(x, y, shade(gem, 0.4))
        if special == 'choi':
            for (x, y) in ((48, 3), (52, 2), (50, 1), (46, 9), (54, 10)):
                wp(x, y, hx('#ffd24a'))
                wp(x, y - 1, hx('#ff5a2a'))
        elif special in ('song', 'lee', 'min'):
            wp(50, 14, shade(gem, 0.35))
    elif weapon == 'shield':
        # щит танка на левой руке
        poly(r, [(10, 29), (19, 27), (24, 31), (22, 42), (16, 47), (11, 42)], hx('#2f6fd0'))
        poly(r, [(12, 31), (18, 29), (21, 32), (20, 41), (16, 44), (13, 41)], hx('#e8eef8'))
        poly(r, [(14, 33), (18, 31), (18, 35), (16, 36)], hx('#9bd0ff'))
        box(14, 37, 18, 39, hx('#2f6fd0'))
        box(15, 36, 17, 40, hx('#e8c76a'))
        put(r, 16, 37, hx('#ffffff'))
        line(r, 11, 29, 11, 42, hx('#1d4a91'))
        line(r, 24, 31, 22, 42, hx('#1d4a91'))

    # ================= аура =================
    if spec.get('aura'):
        aura = hx(spec['aura'])
        for (x, y) in ((17, 45), (48, 43), (20, 52), (47, 54), (14, 49)):
            put(r, x, y, aura)
            put(r, x + 1, y, shade(aura, -0.3))

    return r


HUMANS = {
    'sung-jin-woo': dict(
        hair='#17131f', skin='#e8c4a4', eye='#4a4258', top='#1b1b24', dark='#0d0d13',
        legs='#26262f', boots='#0a0a0e', accent='#8a5cf0', metal='#8a90a8',
        weapon='dagger', outfit='hunter', hairStyle='spiky',
        glowEye='#8a68e8', aura='#7a5cff', special='jinwoo'),
    'yoo-jinho': dict(
        hair='#191720', skin='#f2d0ac', eye='#3a2a18', top='#2f6fd0', dark='#1d4a91',
        legs='#2f4a78', boots='#e8eef8', accent='#9bd0ff', metal='#c8d8e8',
        weapon='shield', outfit='tracksuit', hairStyle='short'),
    'cha-hae-in': dict(
        hair='#d8b04a', skin='#f8dcbc', eye='#b87c28', top='#f2eef4', dark='#22222a',
        legs='#1a1a22', boots='#15151c', accent='#c8a040', metal='#e8e0f0',
        weapon='rapier', outfit='blouse', hairStyle='ponytail', special='cha'),
    'go-gun-hee': dict(
        hair='#c8ccd4', skin='#e2bc98', eye='#3a3a44', top='#2a3038', dark='#161a20',
        legs='#1e242c', boots='#101418', accent='#e8c76a', metal='#8a8f9c',
        weapon=None, outfit='suit', hairStyle='slick', badge=True, special='go'),
    'song-chi-yul': dict(
        hair='#b8b8b0', skin='#dcc0a0', eye='#4a4440', top='#4a5538', dark='#2a3220',
        legs='#4a4438', boots='#2a241c', accent='#b6e3ff', metal='#8a8f7a',
        weapon='staff', staffGem='#7ad7ff', outfit='veteran', hairStyle='short', beard=True, special='song'),
    'lee-joo-hee': dict(
        hair='#5a3a28', skin='#f8dcbc', eye='#543420', top='#efe6ec', dark='#b886a0',
        legs='#8b8f99', boots='#5d4a52', accent='#ff9ac8', metal='#e8e8f0',
        weapon='staff', staffGem='#ffb0d0', outfit='healer', hairStyle='ponytail', special='lee'),
    'ahn-sang-min': dict(
        hair='#1e1a1a', skin='#eec6a0', eye='#2a2622', top='#3a4452', dark='#222a34',
        legs='#2e3640', boots='#1a2026', accent='#9fe6ff', metal='#8a96a2',
        weapon=None, outfit='suit', hairStyle='short', glasses=True, badge=True),
    'woo-jin-chul': dict(
        hair='#17130f', skin='#e2bc98', eye='#26221e', top='#181c22', dark='#0c0e12',
        legs='#141820', boots='#0a0c10', accent='#6a74b8', metal='#6a707c',
        weapon=None, outfit='suit', hairStyle='buzz', glasses=True, badge=True),
    'baek-yoon-ho': dict(
        hair='#eef0f2', skin='#f2d0ac', eye='#c8a850', top='#e8e8e2', dark='#8fb0c8',
        legs='#d0d4d8', boots='#8f8f88', accent='#6ad7ff', metal='#f0f4f8',
        weapon=None, outfit='beast', hairStyle='spiky', aura='#9fe6ff', special='baek'),
    'kim-chul': dict(
        hair='#8a2a20', skin='#e2bc98', eye='#33231a', top='#5a3426', dark='#2e1a14',
        legs='#3a2e2a', boots='#241c18', accent='#ff8a5a', metal='#a8a8a0',
        weapon='sword', outfit='hunter', hairStyle='short', special='kim'),
    'choi-jong-in': dict(
        hair='#c86a2a', skin='#f0c8a0', eye='#4a2f1a', top='#24242c', dark='#121218',
        legs='#1e1e26', boots='#101014', accent='#ff8a3c', metal='#8a8a92',
        weapon='staff', staffGem='#ff8a3c', outfit='mage', hairStyle='spiky', aura='#ff6a3c', special='choi'),
    'min-byung-gu': dict(
        hair='#d8d8d4', skin='#ecc8a4', eye='#3c3a36', top='#e6e9ee', dark='#a8b2bd',
        legs='#7d8590', boots='#4c525a', accent='#5ac8e8', metal='#f0f4f8',
        weapon='staff', staffGem='#9fe6ff', outfit='healer', hairStyle='short', glasses=True, special='min'),
    'goto-ryuji': dict(
        hair='#141018', skin='#e8c4a0', eye='#2a2018', top='#20242c', dark='#0e1014',
        legs='#181c24', boots='#0a0c10', accent='#b83a3a', metal='#a8b0c0',
        weapon='sword', outfit='hunter', hairStyle='slick', aura='#ff7a7a'),
    'kenzo-tanaka': dict(
        hair='#1c1412', skin='#d8ac84', eye='#2a1a14', top='#3a2a22', dark='#1a1210',
        legs='#2a201c', boots='#120d0b', accent='#d06a3a', metal='#b0a090',
        weapon='sword', outfit='plate', hairStyle='buzz', aura='#ff8a4a'),
    'kanae-tawata': dict(
        hair='#3a2448', skin='#f2d4b8', eye='#5a3a68', top='#2a2038', dark='#14101c',
        legs='#241c30', boots='#100c18', accent='#a06cff', metal='#c8b8e0',
        weapon='rapier', outfit='hunter', hairStyle='long', aura='#b88cff'),
    'kei': dict(
        hair='#1a2230', skin='#e8ccb0', eye='#7ad7ff', top='#203040', dark='#101820',
        legs='#1a2634', boots='#0a1018', accent='#7ad7ff', metal='#c0e8ff',
        weapon='staff', staffGem='#bfe6f7', outfit='mage', hairStyle='short',
        glasses=True, aura='#8fdcff'),
    'park-hee-jin': dict(
        hair='#2a1a2a', skin='#f0c8a8', eye='#3a2a3a', top='#e8ecf8', dark='#3a4a6a',
        legs='#2a3040', boots='#1a2028', accent='#7ad7ff', metal='#c8d8f0',
        weapon='staff', staffGem='#9fe6ff', outfit='mage', hairStyle='long'),
    'han-song-yi': dict(
        hair='#1a1a22', skin='#f2d0b0', eye='#3a2a20', top='#f0e8e0', dark='#4a3a3a',
        legs='#2e2a32', boots='#1a161c', accent='#ff9ac8', metal='#b8b8c8',
        weapon=None, outfit='hunter', hairStyle='short'),
    'sung-jin-ah': dict(
        hair='#17131f', skin='#f2d0b0', eye='#3a2a38', top='#e8e0f0', dark='#5a4a6a',
        legs='#2a2a34', boots='#1a1a20', accent='#c08cff', metal='#b8b0c8',
        weapon=None, outfit='hunter', hairStyle='ponytail'),
    'sung-il-hwan': dict(
        hair='#2a2a30', skin='#dcc0a0', eye='#3a3a44', top='#2a2e38', dark='#151820',
        legs='#1a1e26', boots='#0d1016', accent='#8aa0c0', metal='#8a96a8',
        weapon='sword', outfit='veteran', hairStyle='short', beard=True),
    'esil-radiru': dict(
        hair='#f0c8d8', skin='#f0c8b0', eye='#c84a6a', top='#5a1a2a', dark='#2a0a12',
        legs='#3a0e18', boots='#1a060c', accent='#ff5a8a', metal='#d8b45a',
        weapon=None, outfit='robe', hairStyle='long'),
    'ruler': dict(
        hair='#f4f0d8', skin='#f0d8b8', eye='#fff0a0', top='#e8e0c8', dark='#8a7a52',
        legs='#d8d0b8', boots='#b8a878', accent='#ffd24a', metal='#f4e6b0',
        weapon=None, outfit='robe', hairStyle='long', cape='#f0ead8',
        glowEye='#fff0a0', aura='#ffe8a0', special='ruler'),
}


def generate(out_dir):
    import os
    made = []
    for cid, spec in HUMANS.items():
        path = os.path.join(out_dir, cid + '.png')
        png.save_png(path, 64, 64, build_human(spec))
        made.append(path)
    return made
