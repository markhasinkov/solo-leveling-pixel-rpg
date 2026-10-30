# -*- coding: utf-8 -*-
"""Проверка всех игровых JSON и ссылок на ассеты.

Запуск из корня проекта:
    python tools/verify_data.py
"""
import io
import json
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")

errors = []
warnings = []


def load(name):
    path = os.path.join(DATA, name)
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


def exists(rel):
    return os.path.isfile(os.path.join(ROOT, rel.replace("/", os.sep)))


def png_size(rel):
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return w, h


def check(cond, msg):
    if not cond:
        errors.append(msg)


chapters = load("chapters.json")
characters = load("characters.json")
skills = load("skills.json")
talents = load("talents.json")
loot = load("loot.json")
quests = load("quests.json")
bosses = load("bosses.json")
levels = load("levels.json")

level_boss_ids = set()
for lv in levels.values():
    custom = lv.get("boss") or {}
    if custom.get("bossData"):
        level_boss_ids.add(custom["bossData"])

char_by_id = {}
for c in characters:
    check(c["id"] not in char_by_id, "Дубликат персонажа: " + str(c.get("id")))
    char_by_id[c["id"]] = c
    check(exists(c["sprite"]), "Нет спрайта %s у %s" % (c.get("sprite"), c.get("id")))
    portrait = "assets/sprites/portraits/%s.png" % c["id"]
    check(exists(portrait), "Нет портрета %s" % portrait)
    if exists(portrait):
        check(png_size(portrait) == (64, 64), "Портрет %s должен быть 64x64" % portrait)
    anim = "assets/sprites/anim/%s.png" % c["id"]
    check(exists(anim), "Нет анимационного листа %s" % anim)
    if exists(anim):
        size = png_size(anim)
        check(size == (256, 384), "Лист %s должен быть 256x384, а не %s" % (anim, size))
    for key in ("hp", "atk", "def"):
        check(isinstance(c.get("stats", {}).get(key), int), "stats.%s у %s не int" % (key, c["id"]))

NARRATORS = ("Система", "Голос храма", "Герольд Монархов")

# ---------- Главы ----------
chapter_ids = []
prev = 0
for ch in chapters:
    cid = ch.get("id")
    check(isinstance(cid, int) and cid > prev, "id главы не возрастает: %r" % cid)
    prev = cid if isinstance(cid, int) else prev
    chapter_ids.append(cid)
    bg_rel = "assets/sprites/bg_%s.png" % ch.get("location")
    check(exists(bg_rel), "Нет фона локации %r" % ch.get("location"))
    if exists(bg_rel):
        check(png_size(bg_rel) == (640, 360), "Фон %s должен быть 640x360" % bg_rel)
    check(bool(ch.get("dialogues")), "Нет диалогов в главе %s" % cid)
    for d in ch.get("dialogues", []):
        check(d.get("speaker") in char_by_id or d.get("speaker") in NARRATORS,
              "Спикер %r из главы %s не найден" % (d.get("speaker"), cid))
    check(isinstance(ch.get("summary"), str) and len(ch.get("summary", "")) >= 40,
          "Глава %s: нет сюжетного summary" % cid)
    for field in ("storyIntro", "bossDialogue", "storyOutro"):
        entries = ch.get(field)
        check(isinstance(entries, list) and entries, "Глава %s: пустое поле %s" % (cid, field))
        for entry in (entries or []):
            speaker = entry.get("speaker")
            check(bool(speaker) and bool(entry.get("text")), "Глава %s/%s: пустая реплика" % (cid, field))
            check(speaker in char_by_id or speaker in NARRATORS,
                  "Глава %s/%s: неизвестный спикер %r" % (cid, field, speaker))
    for ref in ch.get("characters", []):
        check(ref in char_by_id, "Персонаж %r из главы %s не найден" % (ref, cid))

# ---------- Умения ----------
skill_types = {"melee", "projectile", "dash", "nova", "summon"}
skill_keys = set()
skill_ids = set()
for s in skills:
    sid = s.get("id")
    check(sid not in skill_ids, "Дубликат умения " + str(sid))
    skill_ids.add(sid)
    check(s.get("type") in skill_types, "Неизвестный тип умения %s: %r" % (sid, s.get("type")))
    check(s.get("key") not in skill_keys, "Дубликат клавиши умения %s" % sid)
    skill_keys.add(s.get("key"))
    check(isinstance(s.get("mp"), int) and s["mp"] >= 0, "mp умения %s" % sid)
    check(isinstance(s.get("cooldown"), (int, float)) and s["cooldown"] > 0, "cooldown умения %s" % sid)
    check(exists(s.get("icon", "")), "Нет иконки умения %s: %s" % (sid, s.get("icon")))
    unlock = s.get("unlock") or {}
    check(1 <= unlock.get("level", 0) <= 20, "Уровень открытия умения %s" % sid)

# ---------- Таланты ----------
branch_ids = {b["id"] for b in talents["branches"]}
node_ids = set()
for n in talents["nodes"]:
    check(n["id"] not in node_ids, "Дубликат узла таланта " + n["id"])
    node_ids.add(n["id"])
    check(n.get("branch") in branch_ids, "Узел %s: неизвестная ветка %r" % (n["id"], n.get("branch")))
    for req in n.get("requires", []):
        check(req in {x["id"] for x in talents["nodes"]}, "Узел %s требует несуществующий %s" % (n["id"], req))
    check(n.get("maxRank", 0) >= 1, "maxRank узла %s" % n["id"])
    check(n.get("levelReq", 1) >= 1, "levelReq узла %s" % n["id"])
    check(isinstance(n.get("effect"), dict) and n["effect"], "Нет effect у узла %s" % n["id"])
    for key, val in (n.get("effect") or {}).items():
        check(isinstance(val, (int, float)), "Эффект %s узла %s не число" % (key, n["id"]))
for n in talents["nodes"]:
    for req in n.get("requires", []):
        req_node = next((x for x in talents["nodes"] if x["id"] == req), None)
        if req_node:
            check(req_node.get("branch") == n.get("branch"), "Узел %s требует узел из другой ветки" % n["id"])

# ---------- Лут ----------
item_ids = set()
valid_rarity = {"common", "uncommon", "rare", "epic", "legendary"}
valid_types = {"weapon", "armor", "accessory", "consumable", "elixir", "material"}
for it in loot["items"]:
    iid = it.get("id")
    check(iid not in item_ids, "Дубликат предмета " + str(iid))
    item_ids.add(iid)
    check(it.get("rarity") in valid_rarity, "Редкость %s: %r" % (iid, it.get("rarity")))
    check(it.get("type") in valid_types, "Тип %s: %r" % (iid, it.get("type")))
    check(exists(it.get("icon", "")), "Нет иконки предмета %s: %s" % (iid, it.get("icon")))
    check(isinstance(it.get("value", 0), int) and it.get("value", 0) >= 1, "value предмета %s" % iid)
    if it.get("type") in ("weapon", "armor", "accessory"):
        check(isinstance(it.get("stats"), dict) and it["stats"], "Нет stats у экипировки %s" % iid)


def check_table(name, table):
    if not table:
        errors.append("Пустая таблица лута " + name)
        return
    gold = table.get("gold")
    if gold:
        check(isinstance(gold, list) and len(gold) == 2 and 0 <= gold[0] <= gold[1], "gold таблицы " + name)
    for drop in table.get("drops", []):
        check(drop.get("id") in item_ids, "Дроп %r из %s не существует" % (drop.get("id"), name))
        check(0 < drop.get("chance", 0) <= 1, "chance дропа %r в %s" % (drop.get("id"), name))
        q = drop.get("qty", [1, 1])
        check(len(q) == 2 and 1 <= q[0] <= q[1], "qty дропа %r в %s" % (drop.get("id"), name))


for name, table in loot["tables"].items():
    check_table("tables." + name, table)
for name, table in loot["chests"].items():
    check_table("chests." + name, table)
for entry in loot.get("shop", []):
    check(entry.get("id") in item_ids, "Товар %r из shop не существует" % entry.get("id"))
    check(entry.get("price", 0) > 0, "Цена товара %r" % entry.get("id"))

# ---------- Квесты ----------
quest_ids = set()
quest_obj_types = {"kill", "boss", "chapter", "talk", "collect", "secret", "puzzle", "chest",
                   "skill", "level", "noPotionBoss", "noHitBoss", "armor", "rescue", "light"}
for qtype in ("main", "side", "hidden"):
    for q in quests.get(qtype, []):
        qid = q.get("id")
        check(qid not in quest_ids, "Дубликат квеста " + str(qid))
        quest_ids.add(qid)
        if qtype == "hidden":
            disc = q.get("discover") or {}
            check(disc.get("event") and disc.get("count", 0) >= 1, "hidden %s: нет discover" % qid)
            check("chapter" not in q or not q.get("chapter"), "hidden %s не должен быть привязан к главе" % qid)
        else:
            check(q.get("chapter") in chapter_ids, "Квест %s: глава %r не существует" % (qid, q.get("chapter")))
        check(bool(q.get("objectives")), "Квест %s без целей" % qid)
        for obj in q.get("objectives", []):
            check(obj.get("type") in quest_obj_types, "Квест %s: тип цели %r" % (qid, obj.get("type")))
            check(isinstance(obj.get("count"), int) and obj["count"] >= 1, "Квест %s: count" % qid)
            if obj.get("type") == "collect":
                check(obj.get("target") in item_ids, "Квест %s: предмет %r" % (qid, obj.get("target")))
            if obj.get("type") == "kill":
                check(obj.get("target") is None or obj.get("target") in char_by_id, "Квест %s: цель %r" % (qid, obj.get("target")))
        rewards = q.get("rewards") or {}
        for it in rewards.get("items", []):
            check(it.get("id") in item_ids, "Награда %r квеста %s не существует" % (it.get("id"), qid))

# ---------- Боссы ----------
boss_types = {"slam", "beam", "fan", "rain", "nova", "zone", "summon", "dash", "shield", "heal", "teleport"}
for bid, bd in bosses.items():
    check(bid == "guardian" or bid in char_by_id or bid in level_boss_ids,
          "bosses.json: неизвестный id %r" % bid)
    phases = bd.get("phases", [])
    check(all(0 < p < 1 for p in phases), "bosses.%s: фазы вне (0,1)" % bid)
    check(phases == sorted(phases, reverse=True), "bosses.%s: фазы должны убывать" % bid)
    check(bool(bd.get("attacks")), "bosses.%s: нет атак" % bid)
    for atk in bd.get("attacks", []):
        check(atk.get("type") in boss_types, "bosses.%s: тип атаки %r" % (bid, atk.get("type")))
        check(atk.get("cd", 0) > 0, "bosses.%s/%s: cd" % (bid, atk.get("name")))
        check(atk.get("windup", 0) > 0, "bosses.%s/%s: windup" % (bid, atk.get("name")))
        check(atk.get("phase", 0) in (0, 1, 2), "bosses.%s/%s: phase" % (bid, atk.get("name")))
        if atk.get("type") == "summon":
            for mid in atk.get("ids", []):
                check(mid in char_by_id, "bosses.%s: призыв неизвестного %r" % (bid, mid))
    en = bd.get("enrage")
    if en:
        check(0 < en.get("hp", 0) < 1, "bosses.%s: enrage.hp" % bid)
    intro = bd.get("intro")
    check(isinstance(intro, str) and intro, "bosses.%s: intro" % bid)

# ---------- Локации / секреты ----------
theme_ids = {"temple", "cave", "hospital", "ice", "castle", "jungle", "guild", "throne"}
for cid in chapter_ids:
    key = str(cid)
    check(key in levels, "levels.json: нет данных для главы %s" % cid)
    lv = levels.get(key, {})
    world_w = int(lv.get("worldW", 2400))
    check(world_w >= 4800, "levels.%s: мир слишком мал (%d), нужны большие главы" % (cid, world_w))
    check(lv.get("theme") in theme_ids, "levels.%s: тема %r" % (cid, lv.get("theme")))
    if lv.get("theme") in theme_ids:
        for kind in ("floor", "wall"):
            tex = "assets/sprites/tex/%s_%s.png" % (lv["theme"], kind)
            check(exists(tex), "Нет текстуры %s" % tex)
            if exists(tex):
                check(png_size(tex) == (32, 32), "Текстура %s должна быть 32x32" % tex)

    def in_world(x):
        return 80 <= int(x) <= world_w - 80

    zones = lv.get("zones", [])
    check(len(zones) >= 3, "levels.%s: нужно минимум 3 зоны" % cid)
    prev_end = 0
    for zi, z in enumerate(zones):
        check(bool(z.get("name")), "levels.%s: у зоны %d нет имени" % (cid, zi))
        check(z.get("kind") in ("entrance", "corridor", "hall", "chapel", "sanctum", "arena",
                                "tunnel", "challenge", "swamp", "forest", "fortress", "ward",
                                "training", "office", "lobby", "camp", "jungle", "hive",
                                "battlefield", "gate", "bridge"),
              "levels.%s: неизвестный тип зоны %r" % (cid, z.get("kind")))
        check(int(z.get("x", -1)) == prev_end, "levels.%s: зоны должны идти подряд (x=%s, ожидалось %s)"
              % (cid, z.get("x"), prev_end))
        check(int(z.get("w", 0)) >= 800, "levels.%s: зона %s слишком узкая" % (cid, z.get("id")))
        prev_end = int(z.get("x", 0)) + int(z.get("w", 0))
        check(prev_end <= world_w, "levels.%s: зона %s выходит за мир" % (cid, z.get("id")))
        for line in z.get("story", []):
            sp = line.get("speaker")
            check(sp in NARRATORS or sp in char_by_id,
                  "levels.%s: неизвестный спикер зоны %r" % (cid, sp))
            check(bool(line.get("text")), "levels.%s: пустая реплика зоны" % cid)
    check(prev_end == world_w, "levels.%s: зоны не покрывают мир (%d/%d)" % (cid, prev_end, world_w))
    boss_x = int(lv.get("bossX", world_w - 470))
    check(in_world(boss_x), "levels.%s: bossX вне мира" % cid)
    check(len(lv.get("lore", [])) >= 3, "levels.%s: мало лор-записей" % cid)
    check(len(lv.get("shrines", [])) >= 2, "levels.%s: нужны алтари-чекпоинты" % cid)
    for l in lv.get("lore", []):
        check(in_world(l.get("x", 0)), "levels.%s: x лора" % cid)
        check(bool(l.get("title")) and bool(l.get("text")), "levels.%s: пустая лор-запись" % cid)
    for s in lv.get("shrines", []):
        check(in_world(s.get("x", 0)), "levels.%s: x алтаря" % cid)
    for n in lv.get("npcs", []):
        check(n.get("id") in char_by_id, "levels.%s: неизвестный NPC %r" % (cid, n.get("id")))
        check(in_world(n.get("x", 0)), "levels.%s: x NPC %r" % (cid, n.get("id")))
    for e in lv.get("encounters", []):
        check(e.get("id") in char_by_id, "levels.%s: неизвестный враг %r" % (cid, e.get("id")))
        check(in_world(e.get("x", 0)), "levels.%s: x энкаунтера %r" % (cid, e.get("id")))
        check(1 <= int(e.get("count", 0)) <= 8, "levels.%s: count энкаунтера" % cid)
    for p in lv.get("platforms", []):
        check(0 <= int(p.get("x", -1)) and int(p.get("x", 0)) + int(p.get("w", 0)) <= world_w,
              "levels.%s: платформа вне мира" % cid)
        check(40 <= int(p.get("y", 0)) <= int(lv.get("floorY", 820)) - 40,
              "levels.%s: платформа на полу" % cid)
    for h in lv.get("hazards", []):
        check(0 <= int(h.get("x", -1)) and int(h.get("x", 0)) + int(h.get("w", 0)) <= world_w,
              "levels.%s: опасность вне мира" % cid)
        check(int(h.get("damage", 0)) > 0, "levels.%s: опасность без урона" % cid)
    for r in lv.get("racks", []):
        check(in_world(r.get("x", 0)), "levels.%s: стойка доспехов вне мира" % cid)
    if cid == 4:
        check(len(lv.get("racks", [])) == 4, "levels.4: нужно 4 проклятые стойки")
    for q in lv.get("questObjects", []):
        check(in_world(q.get("x", 0)), "levels.%s: объект задания вне мира" % cid)
        check(q.get("kind") in ("miner", "hunter", "brazier"), "levels.%s: тип объекта задания" % cid)
        check(q.get("event") in ("rescue", "light"), "levels.%s: событие объекта задания" % cid)
        check(bool(q.get("title")), "levels.%s: у объекта задания нет title" % cid)
        if q.get("enemy"):
            check(q.get("enemy") in char_by_id, "levels.%s: неизвестный враг засады %r" % (cid, q.get("enemy")))
        check(1 <= int(q.get("enemyCount", 1)) <= 4, "levels.%s: enemyCount" % cid)
    if cid in (3, 5, 7):
        check(len(lv.get("questObjects", [])) == 3, "levels.%s: нужно 3 объекта локального задания" % cid)
        check(bool(lv.get("bossBarks", {}).get("phase")) and bool(lv.get("bossBarks", {}).get("enrage")),
              "levels.%s: нет фазовых реплик босса" % cid)

    secret = lv.get("secret")
    if secret:
        check(in_world(secret.get("x", 0)), "levels.%s: x секрета" % cid)
        check(secret.get("type") in ("illusory", "chest"), "levels.%s: тип секрета" % cid)
        check(secret.get("chest") in loot["chests"], "levels.%s: сундук секрета %r" % (cid, secret.get("chest")))
    puzzle = lv.get("puzzle")
    if puzzle:
        check(puzzle.get("type") in ("runes", "levers", "orbs"), "levels.%s: тип загадки" % cid)
        check(in_world(puzzle.get("x", 0)), "levels.%s: x загадки" % cid)
        seq = puzzle.get("sequence", [])
        check(len(seq) >= 3, "levels.%s: sequence < 3" % cid)
        check(all(isinstance(i, int) and 0 <= i < max(3, len(seq)) for i in seq), "levels.%s: sequence индексы" % cid)
        check(len(set(seq)) == len(seq), "levels.%s: sequence с повторами" % cid)
        check(puzzle.get("chest") in loot["chests"], "levels.%s: сундук загадки %r" % (cid, puzzle.get("chest")))
        check(bool(puzzle.get("hint")), "levels.%s: нет hint" % cid)
        roman = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
        tokens = [t.strip() for t in str(puzzle.get("hint", "")).split("·")]
        if tokens and all(t in roman for t in tokens):
            order = [roman[t] - 1 for t in tokens]
            check(order == seq, "levels.%s: hint %r не совпадает с sequence %r" % (cid, puzzle.get("hint"), seq))
    for c in lv.get("chests", []):
        check(in_world(c.get("x", 0)), "levels.%s: x сундука" % cid)
        check(c.get("chest") in loot["chests"], "levels.%s: tier сундука %r" % (cid, c.get("chest")))

    arena = lv.get("arena")
    if arena:
        check(exists(arena.get("bg", "")), "levels.%s: нет фона арены %r" % (cid, arena.get("bg")))
        check(80 <= int(arena.get("x", -1)) <= world_w, "levels.%s: x арены вне мира" % cid)
    cutin = lv.get("cutin")
    if cutin:
        check(exists(cutin), "levels.%s: нет cut-in портрета %r" % (cid, cutin))
    custom_boss = lv.get("boss")
    if custom_boss:
        check(bool(custom_boss.get("name")), "levels.%s: у босса нет имени" % cid)
        anim_id = custom_boss.get("animId")
        check(anim_id in char_by_id or os.path.exists(os.path.join(ROOT, "assets", "sprites", anim_id + ".png")),
              "levels.%s: неизвестный animId босса %r" % (cid, anim_id))
        check(60 <= int(custom_boss.get("size", 0)) <= 180, "levels.%s: размер босса" % cid)
        check(custom_boss.get("bossData") in bosses,
              "levels.%s: неизвестный bossData %r" % (cid, custom_boss.get("bossData")))
    scene_ids = set()
    for sc in lv.get("scenes", []):
        sid = sc.get("id")
        check(bool(sid) and sid not in scene_ids, "levels.%s: повтор/пустой id сцены %r" % (cid, sid))
        scene_ids.add(sid)
        check(80 <= int(sc.get("x", -1)) <= world_w - 80, "levels.%s: x сцены %r" % (cid, sid))
        check(bool(sc.get("title")) and bool(sc.get("subtitle")), "levels.%s: у сцены %r нет заголовка" % (cid, sid))
        if sc.get("cutin"):
            check(exists(sc["cutin"]), "levels.%s: нет cut-in сцены %r" % (cid, sc["cutin"]))
        for line in sc.get("lines", []):
            sp = line.get("speaker")
            check(sp in NARRATORS or sp in char_by_id,
                  "levels.%s: спикер сцены %r" % (cid, sp))
            check(bool(line.get("text")), "levels.%s: пустая реплика сцены %r" % (cid, sid))
    check(bool(arena) and bool(cutin) and len(lv.get("scenes", [])) >= 2,
          "levels.%s: нужны арена, cut-in и 2 сюжетные сцены" % cid)

# ---------- Проверка достижимости целей по убийствам ----------
def is_enemy(cid, c, chapter_id):
    humans = {"yoo-jinho", "cha-hae-in", "go-gun-hee", "song-chi-yul", "lee-joo-hee",
              "ahn-sang-min", "woo-jin-chul", "baek-yoon-ho", "kim-chul", "choi-jong-in",
              "min-byung-gu", "architect"}
    if cid in humans:
        return False
    if cid == "igris":
        return chapter_id == 4
    if cid == "baran":
        return chapter_id == 6
    if cid == "beru":
        return chapter_id == 9
    if cid == "ashborn":
        return chapter_id == 11
    if cid in ("antares", "baruka", "statue-of-god", "kargalgan"):
        return True
    role = (c.get("role") or "").lower()
    return any(k in role for k in ("монстр", "босс", "зверь", "вождь", "король", "рыцарь кров"))


for ch in chapters:
    cid = ch["id"]
    lv = levels.get(str(cid), {})
    enemies = []
    for ref in ch.get("characters", []):
        c = char_by_id[ref]
        if is_enemy(ref, c, cid):
            enemies.append(ref)
    for e in lv.get("encounters", []):
        enemies.extend([e["id"]] * int(e.get("count", 1)))
    for extra in lv.get("extra", []):
        enemies.extend([extra["id"]] * int(extra.get("count", 1)))
    boss_candidates = []
    for ref in ch.get("characters", []):
        c = char_by_id[ref]
        if not is_enemy(ref, c, cid):
            continue
        role = (c.get("role") or "").lower()
        if any(k in role for k in ("босс", "монарх", "король", "вождь")) or ref in (
                "statue-of-god", "kargalgan", "baruka", "igris", "beru", "ashborn", "antares", "architect"):
            boss_candidates.append(ref)
    if not boss_candidates:
        enemies.append("guardian")
    total = len(enemies)
    for q in quests["main"] + quests["side"]:
        if q.get("chapter") != cid:
            continue
        for obj in q.get("objectives", []):
            if obj["type"] == "kill" and not obj.get("target"):
                if obj["count"] > total:
                    errors.append("Квест %s требует убить %d, а в главе %d всего %d врагов" % (q["id"], obj["count"], cid, total))
            if obj["type"] == "kill" and obj.get("target"):
                target = obj["target"]
                available = sum(1 for e in enemies if e == target)
                if available < obj["count"]:
                    errors.append("Квест %s требует %d %s, а в главе %d их %d" % (q["id"], obj["count"], target, cid, available))

# ---------- Итог ----------
print("Проверено: %d глав, %d персонажей, %d умений, %d талантов, %d предметов, %d квестов, %d боссов."
      % (len(chapters), len(characters), len(skills), len(talents["nodes"]), len(loot["items"]),
         len(quests["main"]) + len(quests["side"]) + len(quests["hidden"]), len(bosses)))
for w in warnings:
    print("WARN: " + w)
if errors:
    print("\nОШИБКИ (%d):" % len(errors))
    for e in errors:
        print(" - " + e)
    sys.exit(1)
print("Данные корректны.")
