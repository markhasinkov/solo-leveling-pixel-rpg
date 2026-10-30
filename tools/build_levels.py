# -*- coding: utf-8 -*-
"""Сборка больших глав: 4 зоны, декор, лор, NPC, энкаунтеры, опасности.

Запуск из корня проекта:
    python tools/build_levels.py
Результат: src/data/levels.json (UTF-8).
"""
import json
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "data", "levels.json")
FLOOR = 820


def zone(zid, name, subtitle, kind, x, w, props, story=None):
    return {
        "id": zid, "name": name, "subtitle": subtitle, "kind": kind,
        "x": x, "w": w, "props": props, "story": story or []
    }


def npc(cid, x, lines=None, repeat=None):
    return {"id": cid, "x": x, "lines": lines or [], "repeat": repeat or []}


def lore(x, title, text, kind="tablet", xp=20):
    return {"x": x, "title": title, "text": text, "kind": kind, "xp": xp}


def enc(cid, x, count, elite=False, name=None, spread=76):
    return {"id": cid, "x": x, "count": count, "elite": elite, "name": name, "spread": spread}


def hazard(x, w, kind, damage, y=None):
    item = {"x": x, "w": w, "type": kind, "damage": damage}
    if y is not None:
        item["y"] = y
    return item


def rack(x, elite=False):
    return {"x": int(x), "elite": bool(elite)}


def quest_object(kind, x, event, title, enemy=None, enemy_count=1):
    obj = {"kind": kind, "x": int(x), "event": event, "title": title}
    if enemy:
        obj["enemy"] = enemy
        obj["enemyCount"] = int(enemy_count)
    return obj


def boss_barks(phase, enrage):
    return {"phase": phase, "enrage": enrage}


def boss_override(name, anim_id, size, boss_data):
    return {"name": name, "animId": anim_id, "size": int(size), "bossData": boss_data}


def shrine(x, name):
    return {"x": x, "name": name}


def platform(x, y, w, h=18, kind="stone"):
    return {"x": int(x), "y": int(y), "w": int(w), "h": int(h), "kind": kind}


def scene(sid, x, title, subtitle, lines, cutin=None):
    return {
        "id": sid, "x": int(x), "title": title, "subtitle": subtitle,
        "lines": lines, "cutin": cutin
    }


def cinematic(ch, arena_bg, arena_name, arena_x, cutin, scenes):
    """Уникальная арена босса, cut-in портрет и авторские сцены главы."""
    ch["arena"] = {"bg": arena_bg, "name": arena_name, "x": int(arena_x)}
    ch["cutin"] = cutin
    ch["scenes"] = scenes
    return ch


def auto_platforms(zones, floor, seed):
    """Уникальные, но предсказуемые платформы для каждой зоны."""
    rng = random.Random(seed)
    out = []
    for z in zones:
        kind = z["kind"]
        if kind == "arena":
            continue
        if kind in ("bridge",):
            out.append(platform(z["x"] + z["w"] * 0.12, floor - 92, z["w"] * 0.30, 18, "wood"))
            out.append(platform(z["x"] + z["w"] * 0.58, floor - 168, 150, 18, "stone"))
            continue
        if kind in ("entrance", "camp", "ward", "office", "lobby"):
            spots = [(0.55, 170, -128, "stone"), (0.82, 130, -212, "wood")]
        elif kind in ("corridor", "training"):
            spots = [(0.24, 150, -164, "stone"), (0.52, 180, -258, "stone"),
                     (0.78, 140, -190, "wood")]
        elif kind in ("hall", "chapel", "sanctum", "fortress", "gate"):
            spots = [(0.18, 150, -184, "stone"), (0.42, 120, -268, "stone"),
                     (0.66, 180, -210, "stone"), (0.86, 120, -300, "wood")]
        else:
            spots = [(0.14, 140, -150, "stone"), (0.33, 170, -236, "stone"),
                     (0.55, 120, -300, "wood"), (0.74, 170, -190, "stone"),
                     (0.88, 120, -270, "wood")]
        for frac, w, dy, mat in spots:
            jitter = int(rng.random() * 40 - 20)
            out.append(platform(z["x"] + z["w"] * frac + jitter, floor + dy, w, 18, mat))
    # арена: три платформы вокруг будущего босса
    return out


def base_chapter(cid, theme, zones, boss_x, seed, npcs, encounters, lore_items, hazards,
                 secret, puzzle, chests, decor, start_x=90):
    floor = FLOOR
    zones[0]["x"] = 0
    for i in range(1, len(zones)):
        zones[i]["x"] = zones[i - 1]["x"] + zones[i - 1]["w"]
    world_w = zones[-1]["x"] + zones[-1]["w"]
    platforms = auto_platforms(zones, floor, seed)
    # Арена босса: платформы по краям, чтобы было где уклоняться.
    platforms += [
        platform(boss_x - 360, floor - 174, 150, 20, "arena"),
        platform(boss_x - 80, floor - 262, 140, 20, "arena"),
        platform(boss_x + 190, floor - 200, 150, 20, "arena"),
    ]
    return {
        "theme": theme,
        "worldW": world_w,
        "worldH": 900,
        "floorY": floor,
        "startX": start_x,
        "bossX": boss_x,
        "zones": zones,
        "platforms": platforms,
        "npcs": npcs,
        "encounters": encounters,
        "lore": lore_items,
        "shrines": [],
        "hazards": hazards,
        "decor": decor,
        "secret": secret,
        "puzzle": puzzle,
        "chests": chests
    }


def finish(ch, secret_x, puzzle_x, chest_xs, shrine_xs, chest_tiers, secret_data, puzzle_data):
    ch["secret"] = dict(secret_data, x=int(secret_x))
    ch["puzzle"] = dict(puzzle_data, x=int(puzzle_x))
    ch["chests"] = [{"x": int(x), "chest": tier} for x, tier in zip(chest_xs, chest_tiers)]
    ch["shrines"] = shrine_xs
    # Награда за вертикальное исследование: сундук на высокой платформе.
    zones = ch["zones"]
    if len(zones) >= 3:
        lo = zones[1]["x"]
        hi = zones[2]["x"] + zones[2]["w"]
        candidates = [p for p in ch["platforms"]
                      if lo <= p["x"] <= hi
                      and ch["floorY"] - 125 <= p["y"] <= ch["floorY"] - 95
                      and p["w"] >= 120 and p.get("kind") != "arena"]
        if not candidates:
            z2 = zones[1]
            p = platform(z2["x"] + z2["w"] * 0.62, ch["floorY"] - 106, 170, 18, "treasure")
            ch["platforms"].append(p)
            candidates = [p]
        p = candidates[len(chest_xs) % len(candidates)]
        ch["chests"].append({
            "x": int(p["x"] + p["w"] / 2),
            "y": int(p["y"] - 26),
            "chest": "epic" if int(ch["worldW"]) >= 8000 else "rare",
            "high": True
        })
    return ch


CHAPTERS = []

# =====================================================================
# 1. Двойное подземелье / Храм Картенона
# =====================================================================
z1 = [
    zone("gate", "Двойное подземелье", "Вход в Умпо · D-ранг снаружи", "entrance", 0, 1500,
         ["boulder", "rubble", "crate", "bones", "banner", "brazier"]),
    zone("statues", "Коридор статуй", "Заповеди храма высечены в камне", "corridor", 0, 1900,
         ["statue", "column", "brazier", "pew", "rubble", "banner"],
         [{"speaker": "song-chi-yul", "text": "Не двигайтесь. Статуи следят за каждым шагом."},
          {"speaker": "lee-joo-hee", "text": "Джин-Ву, держись ближе. Здесь слишком тихо."}]),
    zone("altar", "Зал алтаря", "Здесь молились те, кто не вышел", "hall", 0, 1900,
         ["altar", "statue", "statue", "brazier", "bones", "rubble"],
         [{"speaker": "Голос храма", "text": "Первое правило храма: не двигайтесь, пока статуя смотрит."}]),
    zone("temple", "Храм Картенона", "Статуя Бога пробуждается", "arena", 0, 2300,
         ["column", "statue", "brazier", "rubble", "banner", "chain"],
         [{"speaker": "song-chi-yul", "text": "Двери захлопнулись! Это двойное подземелье!"},
          {"speaker": "lee-joo-hee", "text": "Статуи... они двигаются!"}]),
]
ch = base_chapter(1, "temple", z1, 6980, 101, [
    npc("song-chi-yul", 1180,
        [{"speaker": "song-chi-yul", "text": "Джин-Ву, всё в порядке? За сегодня ты уже второй раз еле уворачиваешься."},
         {"speaker": "song-chi-yul", "text": "E-ранг есть E-ранг. Держись позади и не геройствуй."}],
        ["Если статуи двинутся — беги. Я серьёзно."]),
    npc("lee-joo-hee", 2080,
        [{"speaker": "lee-joo-hee", "text": "Я подлечу тебя... Но, пожалуйста, будь осторожнее."},
         {"speaker": "lee-joo-hee", "text": "Не хочу снова видеть тебя раненым."}],
        ["Джин-Ву, у тебя ещё есть время отступить."]),
], [
    enc("goblin", 2650, 2), enc("goblin", 3480, 1), enc("goblin", 4450, 1),
    enc("goblin", 5750, 1)
], [
    lore(760, "Дневник охотника", "«Двойное подземелье. D-ранг снаружи, но правила внутри другие. Если статуя смотрит — не двигайся».", "corpse", 18),
    lore(2450, "Первая заповедь", "«Не двигайтесь, пока статуя смотрит на вас. Нарушители будут наказаны».", "tablet", 20),
    lore(3870, "Молитва у алтаря", "Кто-то выцарапал на камне: «Прости, что привёл их сюда. Я не знал, что это ловушка».", "corpse", 22),
    lore(5950, "Сломанная табличка", "«Храм Картенона принимает лишь того, кто готов умереть стоя».", "tablet", 24),
], [
    hazard(3050, 120, "spikes", 12), hazard(4830, 110, "spikes", 14),
], {}, {}, [], [
    {"type": "portal", "x": 330},
    {"type": "statue", "x": 5550}, {"type": "statue", "x": 6250},
    {"type": "altar", "x": 4200},
])
finish(ch, 3800, 4550, [1400, 3250, 5700], [
    shrine(2650, "Алтарь у статуй"), shrine(5480, "Алтарь перед храмом")
], ["common", "rare", "epic"],
    {"type": "illusory", "name": "Тайник за алтарём", "chest": "rare",
     "lore": "За обломками алтаря — узкая ниша. Кто-то молился здесь, пока статуи не начали двигаться."},
    {"type": "runes", "name": "Печати храма", "sequence": [0, 2, 1], "hint": "I · III · II",
     "chest": "rare", "lore": "Три печати вспыхивают по очереди. Неверный шаг — и храм отвергнет наглеца."})
cinematic(ch, "assets/sprites/arenas/arena_cartenon.jpg", "Храм Картенона", 5850,
    "assets/sprites/cutins/cutin_statue.jpg",
    [
        scene("ch1-rules", 2900, "Первая заповедь", "Коридор статуй · не двигаться",
              [{"speaker": "Система", "text": "Обнаружено скрытое подземелье. Правило первое: не двигайтесь, пока статуя смотрит."},
               {"speaker": "song-chi-yul", "text": "Джин-Ву, назад! Двери закрылись сами. Это не D-ранг."},
               {"speaker": "lee-joo-hee", "text": "Одна из статуй... она улыбается. Я вижу."}],
              "assets/sprites/cutins/cutin_statue.jpg"),
        scene("ch1-awakening", 6200, "Пробуждение Игрока", "Порог храма Картенона",
              [{"speaker": "Система", "text": "Кандидат прошёл проверку. Разум готов принять Систему."},
               {"speaker": "sung-jin-woo", "text": "Если это единственный способ выжить — я приму её."},
               {"speaker": "Система", "text": "Вы стали Игроком. Ежедневный квест сформирован."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 2. Пробуждение в больнице
# =====================================================================
z2 = [
    zone("ward", "Пациентская палата", "Три дня без сознания", "ward", 0, 1500,
         ["bed", "iv", "curtain", "monitor", "wheelchair"]),
    zone("rehab", "Коридор реабилитации", "Система не спит", "corridor", 0, 1700,
         ["bed", "curtain", "iv", "monitor", "wheelchair", "cabinet"],
         [{"speaker": "Система", "text": "Ежедневный квест сформирован. Невыполнение влечёт штраф."},
          {"speaker": "lee-joo-hee", "text": "Ты снова встаёшь? Врачи говорят, тебе нужен покой."}]),
    zone("training", "Тренировочный зал", "100 отжиманий. 100 приседаний. 10 км.", "training", 0, 1800,
         ["dummy", "dummy", "monitor", "cabinet", "desk", "couch"],
         [{"speaker": "sung-jin-woo", "text": "Если Система даёт квест — значит, это шанс. Я не собираюсь снова быть слабейшим."}]),
    zone("penalty", "Штрафная зона", "Система не прощает пропусков", "arena", 0, 1800,
         ["rubble", "bones", "totem", "brazier", "chain"],
         [{"speaker": "Система", "text": "Ежедневный квест провален. Штрафная зона активирована."}]),
]
ch = base_chapter(2, "hospital", z2, 6180, 202, [
    npc("lee-joo-hee", 520,
        [{"speaker": "lee-joo-hee", "text": "Джин-Ву! Слава богу... Я так боялась, что ты не очнёшься."},
         {"speaker": "lee-joo-hee", "text": "Не вставай резко. Я принесу воды."}],
        ["Тебе правда нужно отдохнуть."]),
    npc("sung-jin-ah", 3320,
        [{"speaker": "sung-jin-ah", "text": "Оппа... Ты очнулся. Я принесла твои вещи и немного еды."},
         {"speaker": "sung-jin-ah", "text": "Мама всё ещё спит. Но врачи говорят, что она стабильна."}],
        ["Я побуду здесь, ладно?"]),
    npc("ahn-sang-min", 2780,
        [{"speaker": "ahn-sang-min", "text": "Доброе утро, Джин-Ву-сси. Я Ан Сан Мин из Ассоциации."},
         {"speaker": "ahn-sang-min", "text": "Врачи удивлены: травмы заживают быстрее нормы."}],
        ["Если что-то понадобится — я в коридоре."]),
], [
    enc("goblin", 3720, 2, False, "Тренировочная тень", 90),
    enc("goblin", 4300, 1, True, "Тренировочная тень", 80),
], [
    lore(700, "Медицинская карта", "«Пациент Сон Джин-Ву. Три дня без сознания. Травмы несовместимы с жизнью — но пациент жив».", "terminal", 18),
    lore(2100, "Записка Ассоциации", "«Двойное подземелье закрыто. Выживший один. Не распространять до отчёта У Джин-Чоля».", "terminal", 20),
    lore(3600, "Дневник тренировок", "«100 отжиманий. 100 приседаний. 100 подъёмов. 10 км. Я сделаю это, даже если тело горит».", "tablet", 22),
    lore(5200, "Правила Штрафной зоны", "«Пропуск ежедневного квеста отправляет Игрока в Штрафную зону. Выживание обязательно. Награда — опыт и материалы».", "terminal", 24),
], [
    hazard(3050, 100, "spikes", 10),
], {}, {}, [], [
    {"type": "bed", "x": 950}, {"type": "iv", "x": 1120},
    {"type": "reception", "x": 5480}, {"type": "monitor", "x": 4750},
])
finish(ch, 2650, 4200, [1250, 3200, 5650], [
    shrine(2200, "Алтарь восстановления"), shrine(5120, "Алтарь Ассоциации")
], ["common", "rare", "rare"],
    {"type": "chest", "name": "Забытый сейф", "chest": "common",
     "lore": "В подсобке больницы стоит сейф, который никто не открывал десятилетиями."},
    {"type": "levers", "name": "Рубильники реабилитации", "sequence": [1, 2, 0], "hint": "II · III · I",
     "chest": "rare", "lore": "Система спрятала награду за тренировку в старом распределительном щите."})
ch["boss"] = boss_override("Гигантская многоножка", "giant-centipede", 118, "giant-centipede")
cinematic(ch, "assets/sprites/arenas/arena_penalty_zone.jpg", "Штрафная зона", 5150,
    "assets/sprites/cutins/cutin_giant_centipede.jpg",
    [
        scene("ch2-daily", 2380, "Ежедневный квест", "Коридор реабилитации",
              [{"speaker": "Система", "text": "Ежедневный квест сформирован: 100 отжиманий, 100 приседаний, 100 подъёмов, 10 км."},
               {"speaker": "lee-joo-hee", "text": "Ты снова встаёшь? Врачи говорят, тебе нужен покой."},
               {"speaker": "sung-jin-woo", "text": "Если Система даёт квест — это шанс. Я больше не буду слабейшим."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch2-trial", 5320, "Штрафная зона", "Система не прощает пропусков",
              [{"speaker": "Система", "text": "Ежедневный квест провален. Штрафная зона активирована."},
               {"speaker": "sung-jin-woo", "text": "Это не палата и не коридор... Это наказание Системы."},
               {"speaker": "Система", "text": "Цель: выжить. Враждебная форма: гигантская многоножка."}],
              "assets/sprites/cutins/cutin_giant_centipede.jpg")
    ])
ch["bossBarks"] = boss_barks(
    ["Штрафная зона не прощает слабости.", "Мои клыки помнят каждого, кто пытался бежать."],
    "Яд уже в твоей крови. Осталось только упасть.")
CHAPTERS.append(ch)

# =====================================================================
# 3. Первое соло-подземелье
# =====================================================================
z3 = [
    zone("entrance", "Станция Хэпджон", "Мгновенное подземелье приняло облик штольни", "entrance", 0, 1600,
         ["support", "minecart", "rail", "crate", "barrel", "bones"]),
    zone("tunnels", "Тоннели гоблинов", "Их больше, чем в отчёте", "tunnel", 0, 1900,
         ["support", "bones", "totem", "brazier", "rubble", "rail"],
         [{"speaker": "sung-jin-woo", "text": "Раньше я бежал от гоблинов. Сегодня — нет."}]),
    zone("flooded", "Затопленный перрон", "Вода светится ядом", "challenge", 0, 1800,
         ["support", "rail", "minecart", "crystal", "rubble", "bones"],
         [{"speaker": "Система", "text": "Обнаружены следы более сильного хищника. Рекомендуется осторожность."}]),
    zone("lair", "Логово Касаки", "E-ранг был приманкой", "arena", 0, 1900,
         ["statue", "column", "rubble", "bones", "brazier", "chain"],
         [{"speaker": "Система", "text": "Обнаружен хозяин подземелья: Касака."}]),
]
ch = base_chapter(3, "cave", z3, 6580, 303, [], [
    enc("goblin", 2550, 2),
    enc("cave-spider", 3500, 2),
    enc("goblin-shaman", 3900, 1),
    enc("goblin", 4650, 1, True, "Гоблин-вожак"),
    enc("goblin-shaman", 5300, 1),
    enc("cave-spider", 5600, 2),
    enc("goblin", 6100, 1)
], [
    lore(820, "Ключ Системы", "«Мгновенное подземелье сгенерировано. Вход: заброшенная штольня. Хозяин: Касака».", "terminal", 18),
    lore(2850, "Гоблинский тотем", "На черепах нанизаны бирки охотников. Некоторые датированы вчерашним днём.", "banner", 20),
    lore(4050, "Затопленная записка", "«Не пей воду. Она светится. Гоблины не пьют её — они бросают туда тела».", "corpse", 22),
    lore(5900, "Чешуя Касаки", "Синяя чешуя тверда, как сталь, а яд оставляет зелёные прожилки даже на камне.", "tablet", 24),
], [
    hazard(3200, 100, "acid", 12), hazard(4700, 120, "acid", 14),
], {}, {}, [], [
    {"type": "minecart", "x": 700}, {"type": "support", "x": 1450},
    {"type": "crystal", "x": 4300}, {"type": "statue", "x": 5650},
])
finish(ch, 2420, 4380, [1280, 3020, 6020], [
    shrine(2200, "Алтарь шахтёров"), shrine(5750, "Алтарь перед логовом")
], ["rare", "rare", "epic"],
    {"type": "illusory", "name": "Щель в стене", "chest": "rare",
     "lore": "В стене подземелья — щель, из которой тянет сквозняком. За ней пахнет старой сталью."},
    {"type": "orbs", "name": "Шары E-ранга", "sequence": [2, 0, 1], "hint": "III · I · II",
     "chest": "rare", "lore": "Три тусклых шара висят в воздухе. Удар по ним в верном порядке снимает печать."})
ch["boss"] = boss_override("Касака", "kasaka", 118, "kasaka")
cinematic(ch, "assets/sprites/arenas/arena_hapjeong.jpg", "Затопленный перрон Хэпджона", 5550,
    "assets/sprites/cutins/cutin_kasaka.jpg",
    [
        scene("ch3-whisper", 3060, "Ключ Системы", "Мгновенное подземелье",
              [{"speaker": "Система", "text": "Мгновенное подземелье сгенерировано. Вход активирован."},
               {"speaker": "sung-jin-woo", "text": "E-ранг был приманкой. Но я пришёл не за отчётом."},
               {"speaker": "Система", "text": "Зафиксировано движение на нижних уровнях. Источник: Касака."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch3-guardian", 5750, "Клыки Касаки", "Затопленный перрон",
              [{"speaker": "Система", "text": "Касака пробуждён. Уровень угрозы пересчитан."},
               {"speaker": "sung-jin-woo", "text": "Синяя чешуя, яд и клыки. Я стану первым, кто выйдет отсюда."},
               {"speaker": "Система", "text": "Условие выхода: уничтожить хозяина подземелья."}],
              "assets/sprites/cutins/cutin_kasaka.jpg")
    ])
ch["bossBarks"] = boss_barks(
    ["Ты вошёл в моё подземелье. Вода запомнит твой запах.", "Ещё никто не уходил из Хэпджона живым."],
    "Яд Касаки не оставляет шансов.")
ch["questObjects"] = [
    quest_object("miner", 1450, "rescue", "Шахтёр под завалом", "goblin"),
    quest_object("miner", 3750, "rescue", "Шахтёр под завалом", "goblin"),
    quest_object("miner", 4900, "rescue", "Шахтёр под завалом", "goblin")
]
CHAPTERS.append(ch)

# =====================================================================
# 4. Охота на орков и камышовый босс
# =====================================================================
z4 = [
    zone("camp", "Лагерь рейда", "Партия D-ранга идёт в логово", "camp", 0, 1600,
         ["tent", "crate", "barrel", "brazier", "banner", "support"]),
    zone("reeds", "Пещеры высоких орков", "Здесь пахнет кровью и тотемным дымом", "hall", 0, 2000,
         ["fern", "vine", "bones", "totem", "rubble", "brazier"],
         [{"speaker": "yoo-jinho", "text": "Джин-Ву-хён, я... я не отстану. Обещаю!"}]),
    zone("altar", "Алтарь шамана", "Каргалган ждёт", "sanctum", 0, 1800,
         ["altar", "totem", "bones", "brazier", "rubble", "banner"],
         [{"speaker": "song-chi-yul", "text": "Шаман высоких орков не прощает ошибок. Держите строй."}]),
    zone("throne", "Трон Каргалгана", "Здесь закончился рейд пропавшей партии", "arena", 0, 2000,
         ["totem", "bones", "vine", "brazier", "rubble", "banner"],
         [{"speaker": "song-chi-yul", "text": "Это логово... Оно живое. Не дайте тотемам схватить вас."}]),
]
ch = base_chapter(4, "cave", z4, 6780, 404, [
    npc("song-chi-yul", 1180,
        [{"speaker": "song-chi-yul", "text": "Партия D-ранга идёт в логово орков. Джин-Ву, пойдёшь с нами?"},
         {"speaker": "song-chi-yul", "text": "Твоя выносливость заметно выросла. Я вижу."}],
        ["Не отрывайся от партии."]),
    npc("yoo-jinho", 2520,
        [{"speaker": "yoo-jinho", "text": "П-привет! Я Ю Джин-Хо, D-ранг! Буду рад работать с тобой в одной партии!"},
         {"speaker": "yoo-jinho", "text": "Я куплю снаряжение, только охоться со мной!"}],
        ["Джин-Ву-хён, ты видел, как я держал щит?"]),
], [
    enc("orc", 3050, 2),
    enc("orc-berserker", 3900, 2),
    enc("orc", 4550, 1),
    enc("orc-berserker", 5200, 1),
    enc("orc", 6000, 1, True, "Орк-громила"),
], [
    lore(780, "Дневник пропавшего охотника", "«Мы нашли логово высоких орков. Шаман Каргалган смеётся над нами из огня. Я не вернусь».", "corpse", 20),
    lore(2860, "Тотем орков", "Кости, перья и бирки охотников. Самые свежие — с гербом партии, пропавшей здесь много лет назад.", "banner", 22),
    lore(4380, "Молитва высоких орков", "«Кровь — это плата. Огонь — это ответ. Тот, кто войдёт в круг, останется в нём».", "tablet", 24),
    lore(5800, "Бирка павшей партии", "Металлическая бирка с именем. На обратной стороне — рисунок маленькой дочери.", "corpse", 26),
], [
    hazard(3300, 120, "thorns", 14), hazard(5000, 130, "acid", 16),
], {}, {}, [], [
    {"type": "tent", "x": 500}, {"type": "altar", "x": 4780},
    {"type": "totem", "x": 3350}, {"type": "vine", "x": 6200},
])
finish(ch, 2620, 4650, [1300, 3200, 6100], [
    shrine(2350, "Алтарь рейда"), shrine(5580, "Алтарь перед логовом")
], ["common", "rare", "epic"],
    {"type": "chest", "name": "Схрон партии", "chest": "rare",
     "lore": "Партия, погибшая здесь раньше, оставила припасы под слоем пепла."},
    {"type": "runes", "name": "Алтарь шамана", "sequence": [1, 0, 2], "hint": "II · I · III",
     "chest": "rare", "lore": "Алтарь высоких орков помнит имена тех, кто приходил сюда до вас."})
cinematic(ch, "assets/sprites/arenas/arena_high_orc_gate.jpg", "Трон Каргалгана", 5750,
    "assets/sprites/cutins/cutin_kargalgan.jpg",
    [
        scene("ch4-party", 3420, "Долг партии", "Пещеры высоких орков",
              [{"speaker": "song-chi-yul", "text": "Пропавшая партия так и не вернулась. Их бирки — на тотемах."},
               {"speaker": "yoo-jinho", "text": "Джин-Ву-хён, я не отстану. Обещаю."},
               {"speaker": "sung-jin-woo", "text": "Держись рядом. Здесь высокие орки забирают неосторожных."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch4-reed", 5850, "Голос Каргалгана", "Трон Каргалгана",
              [{"speaker": "Система", "text": "Обнаружен хозяин врат. Уровень угрозы: высокий."},
               {"speaker": "yoo-jinho", "text": "Этот голос... он идёт из самого огня!"},
               {"speaker": "sung-jin-woo", "text": "Значит, Каргалган ответит мне за каждого охотника."}],
              "assets/sprites/cutins/cutin_kargalgan.jpg")
    ])
ch["bossBarks"] = boss_barks(
    ["Ты силён, охотник. Но высокие орки не склоняются перед людьми.", "Мои боги уже пробудились. Ты опоздал."],
    "Кровь высоких орков не прольётся напрасно!")
ch["questObjects"] = [
    quest_object("hunter", 1850, "rescue", "Раненый охотник", "orc"),
    quest_object("hunter", 3500, "rescue", "Раненый охотник", "orc"),
    quest_object("hunter", 5300, "rescue", "Раненый охотник", "orc")
]
CHAPTERS.append(ch)

# =====================================================================
# 5. Квест на смену класса
# =====================================================================
z6 = [
    zone("gate", "Врата испытания", "Квест на смену класса", "entrance", 0, 1700,
         ["portal", "gargoyle", "banner", "brazier", "bones", "armor"],
         [{"speaker": "Система", "text": "Игрок достиг условий смены класса. Отказ невозможен."}]),
    zone("armory", "Зал рыцарских доспехов", "Каждый доспех — чья-то смерть", "hall", 0, 1900,
         ["armor", "armor", "candelabra", "banner", "carpet", "gargoyle"],
         [{"speaker": "sung-jin-woo", "text": "Подземелье смены класса... Рыцари и стражи повсюду. Но отступать некуда."}]),
    zone("chapel", "Кровавая часовня", "Здесь Игрис ждёт достойного", "chapel", 0, 1800,
         ["altar", "candelabra", "banner", "armor", "carpet", "brazier"],
         [{"speaker": "igris", "text": "Я — Игрис, Рыцарь Крови. Докажи свою силу клинком."}]),
    zone("throne", "Тронный зал рыцаря крови", "Клятва или смерть", "arena", 0, 2400,
         ["armor", "banner", "candelabra", "brazier", "rubble", "gargoyle"],
         [{"speaker": "igris", "text": "Только клинок решит, кто покинет этот зал. Подними оружие, смертный."}]),
]
ch = base_chapter(5, "castle", z6, 7180, 606, [], [
    enc("hellhound", 2100, 2),
    enc("demon-knight", 3000, 1),
    enc("demon-knight", 3950, 2),
    enc("hellhound", 5500, 2),
    enc("demon-knight", 6150, 1, True, "Демонический капитан"),
], [
    lore(760, "Запись Системы", "«Подземелье создано как испытание. Рыцарь крови не спит уже тысячу лет».", "terminal", 24),
    lore(3050, "Дневник рыцаря", "«Я служил господину, которого больше нет. Клинок помнит клятву, даже когда мир забыл».", "corpse", 26),
    lore(4350, "Кровавая молитва", "«Кровь на камне — не жертва. Это приглашение».", "banner", 28),
    lore(6300, "Клеймо Игриса", "На клинке выбито: «Верность — это не выбор. Это последнее, что остаётся».", "tablet", 30),
], [
    hazard(3400, 120, "lava", 18), hazard(5000, 120, "spikes", 20),
], {}, {}, [], [
    {"type": "portal", "x": 380}, {"type": "armor", "x": 1250},
    {"type": "armor", "x": 3850}, {"type": "throne", "x": 6880},
    {"type": "candelabra", "x": 5450},
])
finish(ch, 2620, 4700, [1350, 3300, 6100], [
    shrine(2350, "Алтарь крови"), shrine(5800, "Алтарь перед троном")
], ["epic", "epic", "epic"],
    {"type": "illusory", "name": "Заложенная дверь", "chest": "epic",
     "lore": "Дверь в стене замка заложена кирпичом. За ней — личные покои рыцаря крови."},
    {"type": "orbs", "name": "Рунные сферы", "sequence": [1, 2, 0], "hint": "II · III · I",
     "chest": "epic", "lore": "Демонические сферы отзываются на кровь и сталь. Порядок имеет значение."})
cinematic(ch, "assets/sprites/arenas/arena_igris.jpg", "Тронный зал рыцаря крови", 5900,
    "assets/sprites/cutins/cutin_igris.jpg",
    [
        scene("ch5-knight", 4120, "Рыцарь крови", "Кровавая часовня",
              [{"speaker": "igris", "text": "Я — Игрис, рыцарь крови. Ты, что осмелился войти в мой чертог, подними клинок."},
               {"speaker": "Система", "text": "Испытание на смену класса начато. Отказ невозможен."},
               {"speaker": "sung-jin-woo", "text": "Я не отказываюсь. Я пришёл за силой."}],
              "assets/sprites/cutins/cutin_igris.jpg"),
        scene("ch5-oath", 6100, "Клятва на клинке", "Тронный зал",
              [{"speaker": "igris", "text": "Докажи, что твоя воля сильнее моей клятвы."},
               {"speaker": "sung-jin-woo", "text": "Клятва без силы — просто слова. Я покажу тебе разницу."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg")
    ])
ch["racks"] = [rack(1820), rack(3780), rack(4470), rack(5350, True)]
CHAPTERS.append(ch)

# =====================================================================
# 6. Красные ворота
# =====================================================================
z5 = [
    zone("gate", "Красные ворота", "Обратной дороги нет", "entrance", 0, 1700,
         ["portal", "tent", "crate", "bones", "brazier", "banner"],
         [{"speaker": "han-song-yi", "text": "Ворота стали красными! Выйти нельзя, пока не будет убит босс!"}]),
    zone("forest", "Ледяной лес", "Клан Баруки не любит гостей", "forest", 0, 2000,
         ["ice_tree", "ice_crystal", "frozen", "bones", "elf_banner"],
         [{"speaker": "kim-chul", "text": "Еду забирают сильные. Так выживают."},
          {"speaker": "park-hee-jin", "text": "Люди уже начинают паниковать. Если мы не наведём порядок, начнётся бойня."}]),
    zone("fortress", "Ледяная крепость", "Мост к замку вождя", "fortress", 0, 1900,
         ["ice_crystal", "elf_banner", "frozen", "statue", "brazier", "ice_tree"],
         [{"speaker": "park-hee-jin", "text": "Джин-Ву... ты правда пойдёшь один?"}]),
    zone("hall", "Зал Баруки", "Вождь ледяных эльфов", "arena", 0, 2200,
         ["ice_crystal", "elf_banner", "statue", "brazier", "frozen", "chain"],
         [{"speaker": "baruka", "text": "Смертный, нарушивший покой снежного леса... Твоя душа станет наградой моему клану."}]),
]
ch = base_chapter(6, "ice", z5, 7180, 505, [
    npc("park-hee-jin", 1320,
        [{"speaker": "park-hee-jin", "text": "Джин-Ву, я иду с тобой. B-ранг не бросает слабых в красных воротах."},
         {"speaker": "park-hee-jin", "text": "Если увидишь ледяного эльфа — не геройствуй. Они бьют из засады."}],
        ["Держись рядом. Я прикрою."]),
    npc("han-song-yi", 2860,
        [{"speaker": "han-song-yi", "text": "Джин-Ву-сси... Джин-А просила присмотреть за тобой. Смешно, да? Это мне нужна помощь."},
         {"speaker": "han-song-yi", "text": "Я останусь с ранеными. Только... вернись, хорошо?"}],
        ["Я ещё держусь. Правда."]),
    npc("kim-chul", 6180,
        [{"speaker": "kim-chul", "text": "Ты правда думаешь, что сможешь убить Баруку один?"},
         {"speaker": "kim-chul", "text": "Если выживешь — я, возможно, изменю своё мнение о E-рангах."}],
        ["Не жди, что я буду тебе помогать."]),
], [
    enc("frost-wolf", 2200, 2),
    enc("ice-bear", 2950, 1),
    enc("ice-elf-ranger", 3500, 1),
    enc("frost-wolf", 4300, 2),
    enc("ice-bear", 4750, 1),
    enc("ice-elf-ranger", 5250, 1),
    enc("ice-bear", 6350, 1, True, "Белый вожак"),
], [
    lore(800, "Предсмертная записка охотника", "«Красные ворота не выпускают. Мы едим кору. Барука слышит нас сквозь лёд».", "corpse", 22),
    lore(3020, "Ледяная стела", "«Клан Баруки хранит покой снежного леса. Чужаки не должны видеть его сердца».", "tablet", 24),
    lore(4800, "Дневник Ким Чхоля", "«Сильные выживают. Я повторяю это, чтобы не слышать, как плачут слабые».", "corpse", 26),
    lore(6320, "Песня клана", "На льду вырезаны имена эльфов. Последнее имя — Барука, вождь, что остался последним.", "tablet", 28),
], [
    hazard(3300, 120, "ice", 16), hazard(5000, 130, "ice", 18),
], {}, {}, [], [
    {"type": "portal", "x": 360}, {"type": "tent", "x": 980},
    {"type": "ice_tree", "x": 2380}, {"type": "ice_crystal", "x": 5100},
])
finish(ch, 2820, 4900, [1580, 3600, 6250], [
    shrine(2550, "Алтарь выживших"), shrine(6000, "Алтарь перед замком")
], ["rare", "rare", "epic"],
    {"type": "illusory", "name": "Наледь с пустотой", "chest": "rare",
     "lore": "Под наледью — полость. Ледяные эльфы прятали здесь добычу клана."},
    {"type": "levers", "name": "Механизм ворот", "sequence": [0, 2, 1], "hint": "I · III · II",
     "chest": "rare", "lore": "Красные ворота открываются изнутри, но не выйти — только в сокровищницу."})
cinematic(ch, "assets/sprites/arenas/arena_baruka.jpg", "Зал Баруки", 5950,
    "assets/sprites/cutins/cutin_baruka.jpg",
    [
        scene("ch6-gates", 2050, "Красные ворота", "Обратной дороги нет",
              [{"speaker": "han-song-yi", "text": "Врата стали красными! Выйти нельзя, пока босс жив?"},
               {"speaker": "kim-chul", "text": "Слабые здесь только мешают. Держись подальше, E-ранг."},
               {"speaker": "park-hee-jin", "text": "Ким Чхоль, мы одна партия. Джин-Ву, не слушай его."},
               {"speaker": "sung-jin-woo", "text": "Тогда я буду тем, кто откроет эти ворота."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch6-voice", 6350, "Голос во льду", "Клан Баруки вышел на охоту",
              [{"speaker": "baruka", "text": "Смертный. Ты убил моих охотников и вошёл в мой лес."},
               {"speaker": "park-hee-jin", "text": "Джин-Ву, он говорит с нами через лёд..."},
               {"speaker": "baruka", "text": "Оставь мне слабых — и, может быть, я позволю тебе умереть быстро."}],
              "assets/sprites/cutins/cutin_baruka.jpg")
    ])
ch["bossBarks"] = boss_barks(
    ["Ты силён, смертный. Но мой клан видел, как падали и не такие."],
    "Лёд моего клана не растает! Я заберу твою тень с собой!")
ch["questObjects"] = [
    quest_object("brazier", 600, "light", "Погасшая жаровня"),
    quest_object("brazier", 2300, "light", "Погасшая жаровня"),
    quest_object("brazier", 4100, "light", "Погасшая жаровня")
]
CHAPTERS.append(ch)

# =====================================================================
# 7. Демонический замок
# =====================================================================
z7 = [
    zone("gate", "Врата Демонического замка", "Сто этажей вниз", "entrance", 0, 1700,
         ["portal", "gargoyle", "banner", "brazier", "bones", "armor"],
         [{"speaker": "Система", "text": "Демонический замок открыт. Цель — Святой источник жизни на сотом этаже."}]),
    zone("floors", "Залы ста этажей", "Каждый этаж — новая печать", "hall", 0, 2100,
         ["armor", "candelabra", "banner", "carpet", "rubble", "brazier"],
         [{"speaker": "igris", "text": "Мой господин, источник близко. Я чувствую его свет сквозь тьму."}]),
    zone("seal", "Печать источника", "Святой свет под демонической тьмой", "sanctum", 0, 1900,
         ["altar", "candelabra", "chain", "brazier", "rubble", "banner"],
         [{"speaker": "sung-jin-woo", "text": "Источник за этой печатью. Осталось снять её."}]),
    zone("throne", "Трон короля демонов", "Баран ждёт", "arena", 0, 2500,
         ["throne", "banner", "brazier", "rubble", "armor", "candelabra"],
         [{"speaker": "baran", "text": "Ты добрался до моего трона, тень. Дальше — только пепел."}]),
]
ch = base_chapter(7, "castle", z7, 7180, 707, [
    npc("igris", 1520,
        [{"speaker": "igris", "text": "Мой господин, свет источника всё ближе. Я не позволю тьме замка остановить вас."},
         {"speaker": "igris", "text": "Баран силён. Но армия теней готова исполнить ваш приказ."}],
        ["Клинок готов, мой господин."]),
    npc("esil-radiru", 4050,
        [{"speaker": "esil-radiru", "text": "Ты первый смертный, который прошёл так далеко без благословения Монарха."},
         {"speaker": "esil-radiru", "text": "Я не буду мешать. Просто... постарайся не умереть."}],
        ["Трон Барана впереди. Будь осторожен."]),
], [
    enc("demon-knight", 2250, 2),
    enc("hellhound", 3350, 2),
    enc("demon-knight", 4550, 2),
    enc("hellhound", 5650, 2),
    enc("demon-knight", 6550, 1, True, "Демонический капитан"),
], [
    lore(780, "Запись Системы", "«Демонический замок — сто этажей испытаний. На вершине — Святой источник жизни».", "terminal", 28),
    lore(3050, "Печать источника", "«Источник не терпит жадных. Он отдаётся тому, кто готов за него умереть».", "tablet", 30),
    lore(4850, "Тронная запись", "«Баран, король демонов, хранит источник ценой собственной жизни».", "banner", 32),
    lore(6450, "Молитва матери", "«Я верю, что ты вернёшься. Даже если весь мир против».", "corpse", 34),
], [
    hazard(3550, 120, "lava", 22), hazard(5250, 120, "spikes", 24),
], {}, {}, [], [
    {"type": "portal", "x": 380}, {"type": "armor", "x": 1500},
    {"type": "altar", "x": 3600}, {"type": "throne", "x": 7200},
    {"type": "candelabra", "x": 5200},
])
finish(ch, 2720, 4750, [1450, 3450, 6350], [
    shrine(2450, "Алтарь у врат"), shrine(6050, "Алтарь источника")
], ["epic", "epic", "legendary"],
    {"type": "illusory", "name": "Тайник стража", "chest": "epic",
     "lore": "За тронной колонной спрятан тайник демонического стража. Здесь хранили подношения королю."},
    {"type": "runes", "name": "Печати источника", "sequence": [2, 0, 1], "hint": "III · I · II",
     "chest": "epic", "lore": "Три печати удерживают свет источника. Неверный порядок разбудит тьму замка."})
cinematic(ch, "assets/sprites/arenas/arena_demon_castle.jpg", "Трон короля демонов", 5900,
    "assets/sprites/cutins/cutin_baran.jpg",
    [
        scene("ch7-floors", 4120, "Сто этажей", "Печать источника",
              [{"speaker": "igris", "text": "Мой господин, свет источника за этой печатью."},
               {"speaker": "Система", "text": "До Святого источника жизни остался один этаж. Защитник — король демонов Баран."},
               {"speaker": "sung-jin-woo", "text": "Мама ждала достаточно. Снимаем печать."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch7-baran", 6100, "Король демонов", "Трон короля демонов",
              [{"speaker": "baran", "text": "Кто осмелился войти в тронный зал короля демонов? Тень, ещё не ставшая Монархом..."},
               {"speaker": "sung-jin-woo", "text": "Я пришёл за Святым источником. Отдай его — или я заберу сам."},
               {"speaker": "baran", "text": "Источник — сердце замка. Чтобы получить его, тебе придётся вырвать моё."}],
              "assets/sprites/cutins/cutin_baran.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 8. Пересмотр ранга
# =====================================================================
z8 = [
    zone("lobby", "Ассоциация охотников", "Очередь на измерение", "lobby", 0, 1600,
         ["reception", "monitor", "couch", "banner", "cabinet"]),
    zone("corridor", "Коридор ожидания", "Слухи о E-ранге, который стал S", "corridor", 0, 1800,
         ["monitor", "couch", "cabinet", "wheelchair", "desk"],
         [{"speaker": "ahn-sang-min", "text": "Ваша мама... Святой источник жизни подействовал. Она очнулась."},
          {"speaker": "sung-jin-woo", "text": "Мама проснулась. Теперь я могу думать о будущем."}]),
    zone("measure", "Измерительный зал", "Разбейте шар, если сможете", "hall", 0, 1800,
         ["dummy", "monitor", "cabinet", "crate", "banner"],
         [{"speaker": "woo-jin-chul", "text": "Показания зашкаливают. Разбейте измерительный шар — это тест."}]),
    zone("chairman", "Кабинет председателя", "Ко Кын-Хи ждёт", "office", 0, 1800,
         ["desk", "couch", "cabinet", "trophy", "monitor"],
         [{"speaker": "go-gun-hee", "text": "Значит, это ты — тот самый охотник. Сон Джин-Ву."}]),
]
ch = base_chapter(8, "hospital", z8, 6380, 707, [
    npc("ahn-sang-min", 1220,
        [{"speaker": "ahn-sang-min", "text": "Джин-Ву-сси! Добрые новости: Святой источник жизни подействовал, ваша мама очнулась."},
         {"speaker": "ahn-sang-min", "text": "Врачи говорят, что ей больше ничего не угрожает."}],
        ["S-ранг! Теперь все гильдии будут охотиться за вами."]),
    npc("woo-jin-chul", 4850,
        [{"speaker": "woo-jin-chul", "text": "Сон Джин-Ву. Показания измерения магической силы... зашкаливают."},
         {"speaker": "woo-jin-chul", "text": "Я обязан доложить председателю."}],
        ["Не двигайтесь, пока идёт измерение."]),
    npc("go-gun-hee", 5600,
        [{"speaker": "go-gun-hee", "text": "Я Ко Кын-Хи, председатель Ассоциации. Хочу поговорить о твоём будущем."},
         {"speaker": "go-gun-hee", "text": "Ты выжил в двойном подземелье, прошёл красные ворота и Демонический замок."},
         {"speaker": "go-gun-hee", "text": "Тебе присвоен S-ранг. Но я не хочу, чтобы тебя использовали как оружие."}],
        ["Береги себя, охотник. Настоящая война ещё впереди."]),
], [
    enc("goblin", 3650, 2, False, "Тренировочная тень", 90),
    enc("goblin", 4450, 1, True, "Тень измерения", 80),
], [
    lore(820, "Объявление Ассоциации", "«Пересмотр ранга. Все охотники обязаны пройти измерение магической силы».", "terminal", 18),
    lore(2550, "Медкарта", "«Пациентка Сон. Вечный сон. После приёма Святого источника жизни показатели восстановились. Пациентка пришла в себя».", "terminal", 20),
    lore(3950, "Протокол измерения", "«Шкала разрушена. Повторное измерение невозможно. Ранг: S».", "terminal", 24),
    lore(5520, "Записка председателя", "«Если этот мальчик действительно стал сильнее всех, он может стать тем, кто защитит мир».", "corpse", 26),
], [
    hazard(3600, 90, "spikes", 12),
], {}, {}, [], [
    {"type": "reception", "x": 700}, {"type": "monitor", "x": 1450},
    {"type": "dummy", "x": 5600}, {"type": "trophy", "x": 6350},
])
finish(ch, 2420, 4300, [1300, 3050, 5700], [
    shrine(2200, "Алтарь Ассоциации"), shrine(5400, "Алтарь перед кабинетом")
], ["rare", "epic", "epic"],
    {"type": "chest", "name": "Шкафчик Ассоциации", "chest": "rare",
     "lore": "В шкафчике — запасной измерительный шар и записка: «Не разбивай. Или разбей»."},
    {"type": "runes", "name": "Измерительные печати", "sequence": [2, 1, 0], "hint": "III · II · I",
     "chest": "epic", "lore": "Порядок печатей соответствует рангам: S, A, E. Ассоциация любит порядок."})
ch["boss"] = boss_override("Магический измеритель", "measurement-device", 112, "measurement-device")
cinematic(ch, "assets/sprites/arenas/arena_measure_hall.jpg", "Измерительный полигон", 5250,
    "assets/sprites/cutins/cutin_measurement_device.jpg",
    [
        scene("ch8-rank", 4620, "Предел шкалы", "Измерительный зал",
              [{"speaker": "woo-jin-chul", "text": "Показания зашкаливают. Шкала не выдерживает."},
               {"speaker": "ahn-sang-min", "text": "S-ранг... Впервые на моей памяти."},
               {"speaker": "sung-jin-woo", "text": "Мне не нужен ранг. Мне нужна сила, чтобы защитить близких."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch8-golem", 5320, "Перегрузка шкалы", "Измерительный полигон",
              [{"speaker": "Система", "text": "Протокол проверки активирован. Магический измеритель перегружен."},
               {"speaker": "go-gun-hee", "text": "Это не нападение, охотник. Это последняя проверка Ассоциации."},
               {"speaker": "sung-jin-woo", "text": "Тогда я пройду её. Как проходил всё остальное."}],
              "assets/sprites/cutins/cutin_measurement_device.jpg")
    ])
ch["bossBarks"] = boss_barks(
    ["Измерение продолжается. Предел не достигнут.", "Шкала не рассчитана на такую величину."],
    "Перегрузка неизбежна.")
CHAPTERS.append(ch)

# =====================================================================
# 9. Остров Чеджу
# =====================================================================
z9 = [
    zone("beach", "Берег Чеджу", "Рейд S-ранга начинается", "camp", 0, 1700,
         ["helicopter", "tent", "crate", "barrel", "banner", "bones"],
         [{"speaker": "choi-jong-in", "text": "Рейд на остров Чеджу. Магические звери истребили прошлую партию S-рангов."}]),
    zone("jungle", "Джунгли Чеджу", "Муравьи перестраивают остров", "jungle", 0, 2100,
         ["palm", "fern", "ant_mound", "egg", "bones", "vine"],
         [{"speaker": "baek-yoon-ho", "text": "Король муравьёв поглотил силы погибших охотников. Это будет ад."}]),
    zone("hive", "Улей", "Здесь нет неба", "hive", 0, 2100,
         ["ant_mound", "egg", "egg", "bones", "vine", "rubble"],
         [{"speaker": "cha-hae-in", "text": "От тебя не пахнет магией. Кто ты, Сон Джин-Ву?"}]),
    zone("queen", "Королевская камера", "Беру ждёт", "arena", 0, 2300,
         ["egg", "ant_mound", "bones", "vine", "brazier", "rubble"],
         [{"speaker": "beru", "text": "Хо. Хо-хо. Люди... вкусно. Я — Беру, король этого улья."}]),
]
ch = base_chapter(9, "jungle", z9, 7580, 808, [
    npc("baek-yoon-ho", 1420,
        [{"speaker": "baek-yoon-ho", "text": "Сон Джин-Ву. На Чеджу нам нужен каждый сильный охотник."},
         {"speaker": "baek-yoon-ho", "text": "Если увидишь короля муравьёв — не геройствуй в одиночку."}],
        ["Моя трансформация зверя ещё не восстановилась."]),
    npc("cha-hae-in", 3050,
        [{"speaker": "cha-hae-in", "text": "Вы... Сон Джин-Ву? Обычно я чувствую запах магической силы охотников."},
         {"speaker": "cha-hae-in", "text": "Но от тебя... ничем не пахнет. Кто ты?"}],
        ["Не отходи далеко. Здесь повсюду улей."]),
    npc("min-byung-gu", 6250,
        [{"speaker": "min-byung-gu", "text": "Я Мин Бён-Гю, целитель гильдии «Охотники». Держитесь рядом — я подлечу."},
         {"speaker": "min-byung-gu", "text": "Этот остров... он не для обычных охотников."}],
        ["Раненые — ко мне. Я ещё держусь."]),
], [
    enc("knight-ant", 3050, 2), enc("knight-ant", 4800, 2),
    enc("knight-ant", 6400, 1, True, "Королевский муравей"),
], [
    lore(850, "План рейда", "«Чеджу. Четыре S-ранга. Цель — король муравьёв. Потери прошлого рейда: неизвестны».", "terminal", 24),
    lore(2850, "Записка Мин Бён-Гю", "«Если я не вернусь, передайте матери, что я был не только целителем. Я был её сыном».", "corpse", 26),
    lore(4800, "Хитиновая стена", "Стены улья покрыты янтарём. Внутри — снаряжение охотников, которых Беру не переварил.", "tablet", 28),
    lore(6500, "Королевская тропа", "«Король муравьёв поглощает сильнейших. Каждая смерть делает его умнее».", "corpse", 30),
], [
    hazard(3350, 130, "acid", 20), hazard(5050, 140, "acid", 22),
], {}, {}, [], [
    {"type": "helicopter", "x": 420}, {"type": "tent", "x": 1100},
    {"type": "ant_mound", "x": 4350}, {"type": "egg", "x": 6550},
])
finish(ch, 2920, 6100, [1600, 3600, 6400], [
    shrine(2650, "Алтарь рейда"), shrine(5950, "Алтарь перед ульем")
], ["epic", "epic", "legendary"],
    {"type": "illusory", "name": "Камера улья", "chest": "epic",
     "lore": "Стены улья покрыты янтарём. Внутри — снаряжение охотников, которых Беру не переварил."},
    {"type": "levers", "name": "Тоннели улья", "sequence": [2, 0, 1], "hint": "III · I · II",
     "chest": "epic", "lore": "Три хода улья перекрыты хитиновыми заслонками. Откройте их в верном порядке."})
cinematic(ch, "assets/sprites/arenas/arena_beru.jpg", "Королевская камера", 6300,
    "assets/sprites/cutins/cutin_beru.jpg",
    [
        scene("ch9-scent", 4260, "Охотник без запаха", "Улей Чеджу",
              [{"speaker": "cha-hae-in", "text": "От тебя не пахнет магией. Так не бывает... Кто ты, Сон Джин-Ву?"},
               {"speaker": "sung-jin-woo", "text": "Тот, кто придёт за королём этого улья."},
               {"speaker": "baek-yoon-ho", "text": "Не отрывайся. Мы прикроем."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch9-king", 6700, "Король улья", "Королевская камера",
              [{"speaker": "beru", "text": "Хо-хо. Люди пришли сами. Как вкусно."},
               {"speaker": "min-byung-gu", "text": "Это не муравей... Это король. Он поглотил S-рангов!"},
               {"speaker": "beru", "text": "Я — Беру. И я съем тебя последним, охотник."}],
              "assets/sprites/cutins/cutin_beru.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 10. Гильдия Ахджин
# =====================================================================
z10 = [
    zone("hq", "Штаб-квартира Ахджин", "Гильдия из двух человек", "office", 0, 1600,
         ["desk", "couch", "monitor", "trophy", "banner", "cabinet"]),
    zone("master", "Кабинет мастера", "Здесь решаются судьбы гильдии", "office", 0, 1700,
         ["desk", "cabinet", "monitor", "trophy", "trophy"],
         [{"speaker": "yoo-jinho", "text": "Джин-Ву-хён! Мы получили предложение о рейде A-ранга!"}]),
    zone("training", "Тренировочный полигон", "Спарринг с сильнейшим мечником Кореи", "training", 0, 1800,
         ["dummy", "dummy", "monitor", "crate", "banner"],
         [{"speaker": "cha-hae-in", "text": "После Чеджу я не могу перестать думать о твоих боях. Позволь сразиться."}]),
    zone("arena", "Арена спарринга", "Испытание Ча Хэ-Ин", "arena", 0, 2100,
         ["banner", "dummy", "monitor", "crate", "brazier"],
         [{"speaker": "cha-hae-in", "text": "Не сдерживайся, Сон Джин-Ву. Я хочу увидеть настоящую силу."}]),
]
ch = base_chapter(10, "guild", z10, 6580, 909, [
    npc("yoo-jinho", 1080,
        [{"speaker": "yoo-jinho", "text": "Джин-Ву-хён! Гильдия зарегистрирована! Мы — мастера гильдии Ахджин!"},
         {"speaker": "yoo-jinho", "text": "Я — вице-мастер, всё как договаривались!"}],
        ["Клиенты уже звонят! Гильдия Ахджин работает!"]),
    npc("woo-jin-chul", 2850,
        [{"speaker": "woo-jin-chul", "text": "Гильдия из двух человек, где мастер и вице-мастер сами зачищают A-ранговые ворота."},
         {"speaker": "woo-jin-chul", "text": "Ассоциация следит за вами с интересом, мастер Сон."}],
        ["Не забывайте подавать отчёты, мастер Сон."]),
], [
    enc("goblin", 3650, 2, False, "Тренировочная тень", 90),
], [
    lore(760, "Устав гильдии", "«Ахджин. Мастер — Сон Джин-Ву. Вице-мастер — Ю Джин-Хо. Наёмные охотники не привлекаются».", "terminal", 24),
    lore(2500, "Записка Джин-Хо", "«Я не хочу быть просто богатым наследником. Я хочу быть полезным. Хён, спасибо».", "corpse", 26),
    lore(4000, "Протокол спарринга", "«Ча Хэ-Ин против Сон Джин-Ву. Победитель неизвестен. Оба остались живы».", "terminal", 28),
    lore(5400, "Тень в зеркале", "В зеркале тренировочного зала отражается не только Джин-Ву. За его спиной стоят тени.", "tablet", 30),
], [
    hazard(3500, 80, "spikes", 12),
], {}, {}, [], [
    {"type": "desk", "x": 700}, {"type": "trophy", "x": 1300},
    {"type": "dummy", "x": 5450}, {"type": "banner", "x": 6250},
])
finish(ch, 2420, 4200, [1300, 3050, 5500], [
    shrine(2200, "Алтарь гильдии"), shrine(5200, "Алтарь арены")
], ["rare", "epic", "epic"],
    {"type": "illusory", "name": "Пустая стена штаба", "chest": "epic",
     "lore": "Стена новой штаб-квартиры звучит пусто. Джин-Хо клянётся, что ничего не прятал."},
    {"type": "orbs", "name": "Спарринг-сферы", "sequence": [0, 2, 1], "hint": "I · III · II",
     "chest": "epic", "lore": "Сферы для спарринга светятся в такт ударам. Хэ-Ин оставила подсказку."})
ch["boss"] = boss_override("Ча Хэ-Ин", "cha-hae-in", 96, "cha-hae-in")
cinematic(ch, "assets/sprites/arenas/arena_ahjin_sparring.jpg", "Арена Ахджин", 5520,
    "assets/sprites/cutins/cutin_cha_hae_in.jpg",
    [
        scene("ch10-guild", 3150, "Гильдия из двух", "Штаб-квартира Ахджин",
              [{"speaker": "yoo-jinho", "text": "Джин-Ву-хён! Гильдия Ахджин зарегистрирована — мастер и вице-мастер!"},
               {"speaker": "woo-jin-chul", "text": "Гильдия из двух человек, зачищающая A-ранговые врата. Ассоциация наблюдает."},
               {"speaker": "sung-jin-woo", "text": "Мы начнём с малого. И не остановимся."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch10-duel", 5620, "Испытание Ча Хэ-Ин", "Арена спарринга",
              [{"speaker": "cha-hae-in", "text": "Игрис и Беру уже проверили меня. Теперь я хочу проверить мастера Ахджин."},
               {"speaker": "yoo-jinho", "text": "Это же просто спарринг... верно?"},
               {"speaker": "sung-jin-woo", "text": "До первого касания. Или до первого падения."}],
              "assets/sprites/cutins/cutin_cha_hae_in.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 11. Наследие Монарха Теней
# =====================================================================
z11 = [
    zone("temple", "Забытый храм", "Возвращение в Картенон", "entrance", 0, 1800,
         ["column", "statue", "rubble", "brazier", "banner", "bones"]),
    zone("memory", "Зал памяти", "Монархи смотрят со стен", "hall", 0, 2100,
         ["statue", "mural", "brazier", "column", "rubble", "banner"],
         [{"speaker": "Система", "text": "С возвращением, Игрок. Все условия выполнены. Пора получить наследие."}]),
    zone("reliquary", "Реликварий", "Здесь спит наследие Осборна", "sanctum", 0, 1900,
         ["altar", "statue", "brazier", "column", "rubble", "banner"],
         [{"speaker": "ashborn", "text": "Я ждал тебя, Сон Джин-Ву. Я — Осборн, Монарх Теней."}]),
    zone("sanctum", "Трон Монарха Теней", "Прими силу или откажись", "arena", 0, 2200,
         ["statue", "column", "brazier", "chain", "rubble", "banner"],
         [{"speaker": "ashborn", "text": "Прими мою силу. Стань новым Монархом Теней."}]),
]
ch = base_chapter(11, "temple", z11, 7380, 1010, [
    npc("igris", 6050,
        [{"speaker": "igris", "text": "Мой господин... сила Монарха Теней пробуждается."},
         {"speaker": "igris", "text": "Армия ждёт приказа. Я отведу тени в бой."}],
        ["Клинок готов, мой господин."]),
    npc("ashborn", 6200,
        [{"speaker": "ashborn", "text": "Архитектор проверил тебя. Теперь ты слышишь мой голос."},
         {"speaker": "ashborn", "text": "Это не конец. Наследие ждёт за последним порогом."}],
        ["Иди вперёд, наследник."]),
], [
    enc("orc", 3200, 2), enc("knight-ant", 4900, 1, True, "Страж реликвария"),
    enc("orc", 6600, 2),
], [
    lore(900, "Стела Картенона", "«Храм помнит всех, кто входил в него. Одни остались статуями. Другие — тенями».", "tablet", 28),
    lore(3300, "Молитва Монарху", "«Смерть — не конец для тех, кто служит Монарху Теней».", "corpse", 30),
    lore(4900, "Имя наследника", "На стене высечено имя. Оно появляется, когда Джин-Ву проходит мимо.", "tablet", 32),
    lore(6500, "Последняя заповедь", "«Не двигайтесь, пока статуя смотрит. Но если вы — Монарх, статуи склонятся перед вами».", "tablet", 34),
], [
    hazard(3700, 120, "spikes", 22), hazard(5450, 130, "lava", 24),
], {}, {}, [], [
    {"type": "statue", "x": 2250}, {"type": "altar", "x": 6350},
    {"type": "column", "x": 3800}, {"type": "brazier", "x": 7000},
])
finish(ch, 3000, 5150, [1450, 3550, 6700], [
    shrine(2800, "Алтарь храма"), shrine(6200, "Алтарь наследия")
], ["epic", "epic", "legendary"],
    {"type": "illusory", "name": "Реликварий Монарха", "chest": "epic",
     "lore": "За алтарём — реликварий, который Осборн оставил наследнику. Проверка на жадность."},
    {"type": "runes", "name": "Заповеди Картенона", "sequence": [2, 0, 3, 1], "hint": "III · I · IV · II",
     "chest": "epic", "lore": "Четыре заповеди статуй. Тот, кто помнит их порядок, достоин наследия."})
ch["boss"] = boss_override("Архитектор", "architect", 110, "architect")
cinematic(ch, "assets/sprites/arenas/arena_ashborn_relicary.jpg", "Храм Картенон: Трон Архитектора", 6280,
    "assets/sprites/cutins/cutin_architect.jpg",
    [
        scene("ch11-memory", 4080, "Суд Архитектора", "Храм Картенон",
              [{"speaker": "architect", "text": "С возвращением, Игрок. Я — Архитектор, создатель Системы. Все условия выполнены."},
               {"speaker": "architect", "text": "Но наследие не отдают. Его вырывают у храма."},
               {"speaker": "sung-jin-woo", "text": "Тогда я заберу его. Я прошёл слишком долгий путь, чтобы остановиться здесь."}],
              "assets/sprites/cutins/cutin_architect.jpg"),
        scene("ch11-crown", 6420, "Наследие", "Трон Монарха Теней",
              [{"speaker": "ashborn", "text": "Архитектор сделал своё дело. Теперь ты слышишь меня, Сон Джин-Ву."},
               {"speaker": "igris", "text": "Мой господин, сила Монарха Теней пробуждается."},
               {"speaker": "sung-jin-woo", "text": "Я приму силу. Но не стану тем, кем был ты. Я защищу свой мир."}],
              "assets/sprites/cutins/cutin_ashborn.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 12. Война Монархов
# =====================================================================
z12 = [
    zone("camp", "Сеул: штаб Ассоциации", "Гражданские эвакуированы, врата нестабильны", "camp", 0, 1700,
         ["tent", "crate", "monitor", "banner", "brazier", "helicopter"],
         [{"speaker": "go-gun-hee", "text": "Силлад уже здесь. Я задержу его — защити Сеул."}]),
    zone("battlefield", "Площадь павших врат", "Небо расколото над столицей", "battlefield", 0, 2100,
         ["rubble", "armor", "bones", "banner", "brazier", "column"],
         [{"speaker": "ashborn", "text": "Врата дрожат. Монархи идут. Эта война — твоя."}]),
    zone("gate", "Небесный разлом", "Правители держат печати", "gate", 0, 2000,
         ["portal", "column", "statue", "brazier", "rubble", "banner"],
         [{"speaker": "ruler", "text": "Правители откроют путь. Дальше — только ты и Монархи."}]),
    zone("throne", "Трон Монархов", "Силлад, Ракан, Керехша", "arena", 0, 2400,
         ["column", "brazier", "rubble", "banner", "chain", "statue"],
         [{"speaker": "igris", "text": "Мой клинок — ваш, мой господин. Ни шагу назад."}]),
]
ch = base_chapter(12, "temple", z12, 7580, 1111, [
    npc("go-gun-hee", 1180,
        [{"speaker": "go-gun-hee", "text": "Сон Джин-Ву... Силлад, Монарх Холода, уже прорвался к Ассоциации."},
         {"speaker": "go-gun-hee", "text": "Я сдержу его здесь. Защити Сеул и будущее охотников."}],
        ["Я ещё держусь. Иди."]),
    npc("ashborn", 1880,
        [{"speaker": "ashborn", "text": "Врата между измерениями дрожат. Монархи идут на ваш мир."},
         {"speaker": "ashborn", "text": "Война, которую я не смог закончить, теперь твоя."}],
        ["Тени помнят каждую павшую армию. Они пойдут за тобой."]),
    npc("igris", 3300,
        [{"speaker": "igris", "text": "Мой клинок — ваш, мой господин."},
         {"speaker": "igris", "text": "Рыцарь Крови и армия теней ждут приказа."}],
        ["Ни шагу назад, солдаты!"]),
    npc("ruler", 4200,
        [{"speaker": "ruler", "text": "Правители не забудут, что ты сделал для этого мира."},
         {"speaker": "ruler", "text": "Мы держим разлом. Твоё дело — Монархи."}],
        ["Путь открыт. Не теряй время."]),
    npc("cha-hae-in", 4950,
        [{"speaker": "cha-hae-in", "text": "Джин-Ву, я видела, как небо раскололось."},
         {"speaker": "cha-hae-in", "text": "Скажи честно — ты уходишь на войну, откуда не возвращаются?"}],
        ["Я буду ждать. Ты обещал вернуться."]),
    npc("beru", 5750,
        [{"speaker": "beru", "text": "Господин! Беру готов! Армия теней готова!"},
         {"speaker": "beru", "text": "Разорвём Монархов на части, ки-хи-хи!"}],
        ["Беру охраняет врата. Никто не пройдёт."]),
], [
    enc("orc", 3050, 3), enc("knight-ant", 5050, 2, True, "Ледяной страж"),
    enc("orc", 6550, 1, True, "Ветеран войны"),
], [
    lore(850, "Приказ Ассоциации", "«Все охотники S-ранга мобилизованы. Гражданские эвакуированы. Врата нестабильны».", "terminal", 30),
    lore(3050, "Полевая записка", "«Ракан, Монарх Звериных Клыков, прошёл через северный фланг. Мы держимся. Ко Кын-Хи».", "corpse", 32),
    lore(5050, "Слово Правителя", "«Мы не можем забрать вашу войну. Но можем дать вам шанс».", "tablet", 34),
    lore(6500, "Слово Монарха", "«Война Монархов не закончится, пока один из нас не станет тенью».", "tablet", 36),
], [
    hazard(3350, 130, "lava", 26), hazard(5250, 120, "spikes", 28),
    hazard(6650, 110, "lava", 26),
], {}, {}, [], [
    {"type": "helicopter", "x": 430}, {"type": "portal", "x": 6250},
    {"type": "statue", "x": 2250}, {"type": "throne", "x": 7150},
])
finish(ch, 2850, 6150, [1400, 3550, 6950], [
    shrine(2550, "Алтарь Ассоциации"), shrine(5900, "Алтарь у врат")
], ["epic", "legendary", "legendary"],
    {"type": "chest", "name": "Военный склад", "chest": "legendary",
     "lore": "Склад Ассоциации, оставленный перед войной Монархов. Всё, что нужно для последнего боя."},
    {"type": "levers", "name": "Печати врат", "sequence": [1, 2, 0, 3], "hint": "II · III · I · IV",
     "chest": "legendary", "lore": "Четыре печати удерживают врата между мирами. Снимите их — и врата откроются."})
ch["boss"] = boss_override("Силлад, Монарх Холода", "sillad", 118, "sillad")
ch["bossSequence"] = [
    {"name": "Силлад, Монарх Холода", "animId": "sillad", "size": 118, "bossData": "sillad", "hp": 7000, "atk": 430, "def": 170, "cutin": "assets/sprites/cutins/cutin_sillad.jpg"},
    {"name": "Ракан, Монарх Звериных Клыков", "animId": "rakan", "size": 126, "bossData": "rakan", "hp": 8500, "atk": 460, "def": 180, "cutin": "assets/sprites/cutins/cutin_rakan.jpg"},
    {"name": "Керехша, Монарх Чумы", "animId": "kerehsha", "size": 120, "bossData": "kerehsha", "hp": 9000, "atk": 480, "def": 190, "cutin": "assets/sprites/cutins/cutin_kerehsha.jpg"}
]
cinematic(ch, "assets/sprites/arenas/arena_war_monarchs.jpg", "Трон Монархов", 6450,
    "assets/sprites/cutins/cutin_sillad.jpg",
    [
        scene("ch12-sky", 2520, "Небо расколото", "Площадь павших врат",
              [{"speaker": "ashborn", "text": "Врата между измерениями дрожат. Монархи идут на ваш мир."},
               {"speaker": "go-gun-hee", "text": "Все охотники S-ранга мобилизованы. Гражданские эвакуированы."},
               {"speaker": "sung-jin-woo", "text": "Я встречу их здесь. Война закончится сегодня."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch12-rulers", 4300, "Правители вступают", "Небесный разлом",
              [{"speaker": "ruler", "text": "Мы не можем сражаться вместо тебя. Но разлом будет открыт."},
               {"speaker": "sung-jin-woo", "text": "Этого достаточно. Остальное сделают тени."},
               {"speaker": "ruler", "text": "Тогда иди. Силлад уже ждёт."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch12-herald", 6300, "Три Монарха", "Трон Монархов",
              [{"speaker": "sillad", "text": "Ты пришёл на войну, мальчик. Но холод не спрашивает разрешения."},
               {"speaker": "sung-jin-woo", "text": "Тогда я отвечу тебе тем, что не замерзает. Тенями."},
               {"speaker": "rakan", "text": "Силлад, не трать время. Я сам разорву его."},
               {"speaker": "kerehsha", "text": "Оставь его мне. Его плоть станет моим ульем."}],
              "assets/sprites/cutins/cutin_sillad.jpg")
    ])
CHAPTERS.append(ch)

# =====================================================================
# 13. Финал: Антарес
# =====================================================================
z13 = [
    zone("approach", "Пылающий тронный зал", "Король драконов ждёт", "entrance", 0, 1800,
         ["dragon_skull", "obsidian", "brazier", "banner", "chain", "rubble"],
         [{"speaker": "antares", "text": "Значит, это ты — новый Монарх Теней. Твой мир станет моим пеплом."}]),
    zone("bridge", "Мост Монархов", "Над огнём", "bridge", 0, 2000,
         ["obsidian", "chain", "brazier", "dragon_skull", "rubble"],
         [{"speaker": "beru", "text": "Господин, этот ящер силён! Беру попытается прогрызть его броню!"}]),
    zone("heart", "Сердце пламени", "Здесь заканчиваются миры", "sanctum", 0, 2100,
         ["obsidian", "brazier", "dragon_skull", "banner", "chain", "rubble"],
         [{"speaker": "igris", "text": "Держитесь, солдаты! Ни шагу назад!"}]),
    zone("antares", "Арена Антареса", "Монарх Разрушения", "arena", 0, 2700,
         ["dragon_skull", "obsidian", "brazier", "banner", "chain", "rubble"],
         [{"speaker": "antares", "text": "Жалкие тени! Драконье пламя сожжёт даже смерть!"}]),
]
ch = base_chapter(13, "throne", z13, 7980, 1212, [
    npc("beru", 1280,
        [{"speaker": "beru", "text": "Господин! Беру и армия теней готовы к бою!"},
         {"speaker": "beru", "text": "Этот ящер силён, но Беру прогрызёт его броню!"}],
        ["Беру не отступит. Никогда."]),
    npc("igris", 3050,
        [{"speaker": "igris", "text": "Мой клинок — ваш, мой господин."},
         {"speaker": "igris", "text": "Слава Монарха Теней! Ни шагу назад!"}],
        ["Армия ждёт вашего приказа."]),
    npc("cha-hae-in", 5050,
        [{"speaker": "cha-hae-in", "text": "Джин-Ву! Небо снова чистое. Врата закрылись."},
         {"speaker": "cha-hae-in", "text": "Это действительно конец?"}],
        ["Я дождалась. Ты вернулся."]),
    npc("yoo-jinho", 5500,
        [{"speaker": "yoo-jinho", "text": "Хён! Мы победили! Гильдия Ахджин войдёт в историю!"},
         {"speaker": "yoo-jinho", "text": "Я же говорил, что мы справимся!"}],
        ["Гильдия Ахджин всегда рядом."]),
], [
    enc("orc", 3200, 3), enc("knight-ant", 5250, 2, True, "Драконий страж"),
    enc("orc", 6650, 1, True, "Последний легионер"),
], [
    lore(900, "Тронная запись", "«Антарес, Монарх Разрушения, король драконов. Его пламя пережило миры».", "tablet", 34),
    lore(3200, "Драконья чешуя", "Чешуя размером с щит. На ней выжжены силуэты павших Монархов.", "corpse", 36),
    lore(5150, "Последняя клятва", "«Я вернусь. Обещаю. Жди меня, Хэ-Ин. Я выбрал этот путь, чтобы больше никогда никого не терять».", "tablet", 38),
    lore(6600, "Пламя Монарха", "«Даже Осборн пал бы перед драконьим пламенем. Но ты — не Осборн».", "tablet", 40),
    lore(7600, "Чаша Перерождения", "«Правители создали её, чтобы отматывать время. Один глоток — и мир получит второй шанс. Но помнить будет только тот, кто пьёт».", "tablet", 42),
], [
    hazard(3350, 140, "lava", 28), hazard(2050, 500, "lava", 30, FLOOR - 12),
    hazard(6250, 120, "spikes", 30),
], {}, {}, [], [
    {"type": "dragon_skull", "x": 2200}, {"type": "throne", "x": 7050},
    {"type": "obsidian", "x": 3000}, {"type": "brazier", "x": 5500},
])
finish(ch, 2900, 6150, [1450, 3550, 6800], [
    shrine(2650, "Алтарь перед мостом"), shrine(5850, "Алтарь перед ареной")
], ["legendary", "legendary", "legendary"],
    {"type": "illusory", "name": "Казна Монарха", "chest": "legendary",
     "lore": "Тронный зал хранит казну прежнего Монарха. Тени не нужны драгоценности — но вам пригодятся."},
    {"type": "orbs", "name": "Печати творения", "sequence": [3, 1, 2, 0], "hint": "IV · II · III · I",
     "chest": "legendary", "lore": "Печати творения отвечают лишь на волю Монарха Теней. Порядок — ключ ко всему."})
cinematic(ch, "assets/sprites/arenas/arena_antares.jpg", "Арена Антареса", 6550,
    "assets/sprites/cutins/cutin_antares.jpg",
    [
        scene("ch13-army", 4160, "Монарх против Монарха", "Сердце пламени",
              [{"speaker": "igris", "text": "Мой господин, армия теней ждёт приказа."},
               {"speaker": "beru", "text": "Беру прогрызёт ящеру крылья! Только скажи!"},
               {"speaker": "sung-jin-woo", "text": "Вперёд. Сегодня мы закончим эту войну."}],
              "assets/sprites/cutins/cutin_jinwoo.jpg"),
        scene("ch13-flame", 6950, "Пламя Монарха", "Арена Антареса",
              [{"speaker": "antares", "text": "Ты пахнешь тенью, мальчик. Но тень не может сжечь дракона."},
               {"speaker": "sung-jin-woo", "text": "Тень — это всё, что остаётся от пламени. Я покажу тебе, что останется от тебя."},
               {"speaker": "antares", "text": "Дерзость. Драконье пламя ответит."}],
              "assets/sprites/cutins/cutin_antares.jpg")
    ])
CHAPTERS.append(ch)


# Канонический порядок: квест на смену класса → Красные врата →
# Демонический замок → врата гильдии «Охотники» (Каргалган).
CHAPTERS[:] = [CHAPTERS[i] for i in (0, 1, 2, 4, 5, 6, 3, 7, 8, 9, 10, 11, 12)]


def main():
    data = {str(i + 1): ch for i, ch in enumerate(CHAPTERS)}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    total_zones = sum(len(c["zones"]) for c in CHAPTERS)
    total_enc = sum(sum(e["count"] for e in c["encounters"]) for c in CHAPTERS)
    total_lore = sum(len(c["lore"]) for c in CHAPTERS)
    print("Глав: %d · зон: %d · врагов в энкаунтерах: %d · записей: %d" %
          (len(CHAPTERS), total_zones, total_enc, total_lore))
    for c in CHAPTERS:
        print("  %2d  %5d px  %d зон  %d NPC  %d записей" %
              (CHAPTERS.index(c) + 1, c["worldW"], len(c["zones"]),
               len(c["npcs"]), len(c["lore"])))


if __name__ == "__main__":
    main()
