#!/usr/bin/env python3
# lore_lint.py — проверка канонических имён и ключевых сюжетных инвариантов.
import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
TEXT_FILES = [
    ROOT / 'README.md',
    ROOT / 'docs' / 'qa' / 'qa-checklist.md',
    *sorted((ROOT / 'src' / 'data').glob('*.json')),
    ROOT / 'src' / 'js' / 'main.js',
    ROOT / 'src' / 'js' / 'ui.js',
    ROOT / 'src' / 'js' / 'shadows.js',
]
# save.js хранит старые отображаемые имена только для миграции v1.
BANNED = [
    (re.compile(r'Чжин'), 'устаревшее «Чжин» вместо «Джин»'),
    (re.compile(r'Чжу\s*Хи'), 'устаревшее «Чжу Хи» вместо «Джу-Хи»'),
    (re.compile(r'Чхиёль'), 'устаревшее «Чхиёль» вместо «Чи-Ёль»'),
    (re.compile(r'Гу\s+Гон'), 'устаревшее «Гу Гон Хи» вместо «Ко Кын-Хи»'),
    (re.compile(r'Ханты'), 'устаревшее «Ханты» вместо «Охотники»'),
    (re.compile(r'Барик[аиуе]?'), 'устаревшее «Барика/Барики» вместо «Барука»'),
    (re.compile(r'Эшборн'), 'устаревшее «Эшборн» вместо «Осборн»'),
    (re.compile(r'Антарас'), 'устаревшее «Антарас» вместо «Антарес»'),
    (re.compile(r'Пэк\s+Юн'), 'устаревшее «Пэк Юн Хо» вместо «Бэк Юн-Хо»'),
    (re.compile(r'Мин\s+Бён[-\s]?Гу'), 'устаревшее «Мин Бён Гу» вместо «Мин Бён-Гю»'),
    (re.compile(r'(?<![А-Яа-яЁё])Бер(?![А-Яа-яЁё])'), 'устаревшее «Бер» вместо «Беру»'),
    (re.compile(r'куб\s+времени', re.IGNORECASE), 'неканонический «куб времени»'),
    (re.compile(r'пересадк', re.IGNORECASE), 'неканоническая пересадка сердца'),
    (re.compile(r'операци[яиюей]', re.IGNORECASE), 'неканоническая операция вместо Святого источника'),
    (re.compile(r'Хван\s+Дон'), 'Хван Дон-Сок не погибал в камышовом логове'),
    (re.compile(r'Статуя Бога двойного подземелья'), 'Архитектор не является Статуей Бога'),
    (re.compile(r'Белый Монарх|Монарх Клыков|Монарх Пламени'), 'вымышленные имена Монархов'),
]
REQUIRED = [
    'Сон Джин-Ву', 'Барука', 'Беру', 'Осборн', 'Антарес', 'Ко Кын-Хи',
    'Ча Хэ-Ин', 'Сон Чи-Ёль', 'Ли Джу-Хи', 'Ю Джин-Хо', 'У Джин-Чоль',
    'Бэк Юн-Хо', 'Чхве Чон-Ин', 'Мин Бён-Гю', 'гильдии «Охотники»',
    'Святой источник жизни', 'Баран', 'Пак Хи-Джин', 'Хан Сон-И', 'Айрон',
    'Касака', 'Каргалган', 'Гигантская многоножка', 'Магический измеритель',
    'Кэндзо Танака', 'Канаэ Тавата',
]
REQUIRED_FILES = [
    (ROOT / 'src' / 'data' / 'chapters.json', 'Сон Джин-Ву'),
    (ROOT / 'src' / 'data' / 'chapters.json', 'Святой источник жизни'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Ча Хэ-Ин'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Архитектор'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Касака'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Каргалган'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Магический измеритель'),
]

failures = []
for path in TEXT_FILES:
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    for pattern, label in BANNED:
        for match in pattern.finditer(text):
            line_no = text.count('\n', 0, match.start()) + 1
            line = lines[line_no - 1] if line_no <= len(lines) else ''
            context = '\n'.join(lines[max(0, line_no - 2):line_no + 1])
            if any(marker in context for marker in ('нет «', 'не должно', 'а не ', 'вместо', 'устаревш')):
                continue
            failures.append(f'{path.relative_to(ROOT)}:{line_no}: {label} — «{match.group(0)}»')

all_text = '\n'.join(p.read_text(encoding='utf-8') for p in TEXT_FILES)
for name in REQUIRED:
    if name not in all_text:
        failures.append(f'нет обязательного канонического имени: {name}')

for path, needle in REQUIRED_FILES:
    if needle not in path.read_text(encoding='utf-8'):
        failures.append(f'{path.relative_to(ROOT)}: отсутствует «{needle}»')

chapters = json.loads((ROOT / 'src' / 'data' / 'chapters.json').read_text(encoding='utf-8'))
levels = json.loads((ROOT / 'src' / 'data' / 'levels.json').read_text(encoding='utf-8'))
characters = json.loads((ROOT / 'src' / 'data' / 'characters.json').read_text(encoding='utf-8'))
bosses = json.loads((ROOT / 'src' / 'data' / 'bosses.json').read_text(encoding='utf-8'))

if len(chapters) != 13:
    failures.append(f'глав должно быть 13, найдено {len(chapters)}')

by_id = {c['id']: c for c in chapters}
ch1, ch4, ch5, ch6, ch7 = by_id.get(1, {}), by_id.get(4, {}), by_id.get(5, {}), by_id.get(6, {}), by_id.get(7, {})
ch8, ch9, ch10, ch11, ch12, ch13 = by_id.get(8, {}), by_id.get(9, {}), by_id.get(10, {}), by_id.get(11, {}), by_id.get(12, {}), by_id.get(13, {})

if 'architect' in (ch1.get('characters') or []):
    failures.append('глава 1: Архитектор не должен присутствовать в двойном подземелье')
if any(x not in (ch5.get('characters') or []) for x in ('park-hee-jin', 'han-song-yi', 'kim-chul')):
    failures.append('глава 5: нужны Пак Хи-Джин, Хан Сон-И и Ким Чхоль')
if 'lee-joo-hee' in (ch5.get('characters') or []) or 'yoo-jinho' in (ch5.get('characters') or []):
    failures.append('глава 5: Ли Джу-Хи и Ю Джин-Хо не участвовали в Красных вратах')
if 'igris' not in (ch4.get('characters') or []):
    failures.append('глава 4: Игрис должен быть боссом смены класса')
if 'Демоническ' in (ch4.get('title') or ''):
    failures.append('глава 4: квест на смену класса не должен называться Демоническим замком')
if 'Красные ворота' not in (ch5.get('title') or '') or 'baruka' not in (ch5.get('characters') or []):
    failures.append('глава 5: должны быть Красные врата с Барукой')
if 'Демонический замок' not in (ch6.get('title') or '') or 'baran' not in (ch6.get('characters') or []):
    failures.append('глава 6: нужен Демонический замок с Бараном')
if 'Святой источник' not in json.dumps(ch6, ensure_ascii=False):
    failures.append('глава 6: Святой источник жизни должен быть целью замка')
if 'армия теней' in json.dumps(ch4, ensure_ascii=False):
    failures.append('глава 4: тени ещё не пробуждены до смены класса')
if 'Каргалган' not in (ch7.get('title') or '') or 'kargalgan' not in (ch7.get('characters') or []):
    failures.append('глава 7: нужны врата гильдии «Охотники» с Каргалганом')
if 'Святой источник' not in json.dumps(ch8, ensure_ascii=False):
    failures.append('глава 8: пробуждение мамы должно быть связано со Святым источником жизни')
if any(word in json.dumps(ch8, ensure_ascii=False) for word in ('операци', 'пересадк')):
    failures.append('глава 8: мама не должна лечиться обычной операцией')
if (levels.get('10', {}).get('boss') or {}).get('name') != 'Ча Хэ-Ин':
    failures.append('глава 10: босс должен быть Ча Хэ-Ин, а не тенью')
if (levels.get('11', {}).get('boss') or {}).get('name') != 'Архитектор':
    failures.append('глава 11: босс должен быть Архитектором')
if 'Тень Ахджин' in json.dumps(ch10, ensure_ascii=False):
    failures.append('глава 10: осталась Тень Ахджин')
if any((npc or {}).get('id') == 'architect' for npc in (levels.get('1', {}).get('npcs') or [])):
    failures.append('глава 1: Архитектор не должен быть NPC')
if 'Силлад' not in json.dumps(ch12, ensure_ascii=False) or 'Ракан' not in json.dumps(ch12, ensure_ascii=False) or 'Керехша' not in json.dumps(ch12, ensure_ascii=False):
    failures.append('глава 12: потеряны Силлад, Ракан или Керехша')
if 'hokhan' in bosses:
    failures.append('bosses.json: остался неканонический Хокхан')
if not isinstance((levels.get('12', {}) or {}).get('bossSequence'), list) or len(levels['12']['bossSequence']) != 3:
    failures.append('глава 12: нужна последовательность трёх Монархов')
if 'Чеджу' not in (ch9.get('title') or ''):
    failures.append('глава 9: потерян остров Чеджу')
if 'beru' in (ch9.get('characters') or []):
    failures.append('глава 9: Беру должен появляться через bossSequence, а не как персонаж')
seq9 = (levels.get('9', {}) or {}).get('bossSequence')
if not isinstance(seq9, list) or len(seq9) != 2:
    failures.append('глава 9: нужна последовательность «королева → Беру»')
else:
    if seq9[0].get('bossData') != 'ant-queen' or seq9[1].get('bossData') != 'beru':
        failures.append('глава 9: стадии должны быть Королевой муравьёв и Беру')
    if 'cutin_ant_queen' not in json.dumps(seq9[0], ensure_ascii=False) or 'cutin_beru' not in json.dumps(seq9[1], ensure_ascii=False):
        failures.append('глава 9: у стадий нет своих cut-in')
    if seq9[1].get('lootId') != 'beru':
        failures.append('глава 9: финальный Беру должен давать тень')
if 'goto-ryuji' not in [c.get('id') for c in characters]:
    failures.append('characters.json: нет Гото Рюдзи')
if any(x not in (ch9.get('characters') or []) for x in ('goto-ryuji', 'kenzo-tanaka', 'kanae-tawata', 'kei')):
    failures.append('глава 9: не хватает японской команды Draw Sword')
if any(x not in json.dumps(ch9.get('storyOutro') or [], ensure_ascii=False)
       for x in ('Гото Рюдзи', 'Кэндзо Танака', 'Канаэ Тавата', 'Кэй')):
    failures.append('глава 9: гибель японской команды должна быть в эпилоге')
if 'Мин Бён-Гю' not in json.dumps(ch9.get('storyOutro') or [], ensure_ascii=False):
    failures.append('глава 9: гибель Мин Бён-Гю должна быть в эпилоге')
if 'Гото Рюдзи' not in json.dumps(ch9.get('storyOutro') or [], ensure_ascii=False):
    failures.append('глава 9: гибель Гото Рюдзи должна быть в эпилоге')
if 'куб времени' in json.dumps(ch13, ensure_ascii=False).lower():
    failures.append('глава 13: неканонический «куб времени»')

architect = next((c for c in characters if c['id'] == 'architect'), {})
if 'Статуя Бога' in (architect.get('role') or ''):
    failures.append('Архитектор ошибочно назван Статуей Бога')

expected_bosses = {2: 'Гигантская многоножка', 3: 'Касака', 8: 'Магический измеритель'}
for cid, name in expected_bosses.items():
    if (levels.get(str(cid), {}).get('boss') or {}).get('name') != name:
        failures.append(f'глава {cid}: босс должен быть «{name}»')
    if (levels.get(str(cid), {}).get('boss') or {}).get('bossData') not in bosses:
        failures.append(f'глава {cid}: нет профиля босса «{name}»')
if 'kargalgan' not in bosses or 'kargalgan' not in [c.get('id') for c in characters]:
    failures.append('глава 7: нет Каргалгана в bosses.json или characters.json')
if 'Трон Каргалгана' not in (levels.get('7', {}).get('arena') or {}).get('name', ''):
    failures.append('глава 7: нет арены «Трон Каргалгана»')
for cid, needle in ((2, 'arena_penalty_zone'), (3, 'arena_hapjeong'), (7, 'arena_high_orc_gate'), (8, 'arena_measure_hall')):
    if needle not in json.dumps(levels.get(str(cid), {}), ensure_ascii=False):
        failures.append(f'глава {cid}: не подключена арена {needle}')
for cid, needle in ((2, 'cutin_giant_centipede'), (3, 'cutin_kasaka'), (7, 'cutin_kargalgan'), (8, 'cutin_measurement_device')):
    if needle not in json.dumps(levels.get(str(cid), {}), ensure_ascii=False):
        failures.append(f'глава {cid}: не подключён cut-in {needle}')
for old in ('shadow-trial', 'mine-guardian', 'reed-boss', 'measure-golem'):
    if old in bosses:
        failures.append(f'bosses.json: остался авторский босс {old}')

if 'baran' not in bosses or bosses['baran'].get('hpBase', 0) <= 0:
    failures.append('bosses.json: нет профиля Барана')
if 'baran' not in [c.get('id') for c in characters]:
    failures.append('characters.json: нет Барана')
if (levels.get('6', {}).get('arena') or {}).get('name') != 'Трон короля демонов':
    failures.append('глава 6: нет арены «Трон короля демонов»')
if 'arena_demon_castle' not in json.dumps(levels.get('6', {}), ensure_ascii=False):
    failures.append('глава 6: не подключена арена Демонического замка')
if 'cutin_baran' not in json.dumps(levels.get('6', {}), ensure_ascii=False):
    failures.append('глава 6: не подключён cut-in Барана')

if failures:
    print('LORE LINT: найдены расхождения:')
    for failure in failures:
        print(' - ' + failure)
    sys.exit(1)
print('LORE LINT: канон имён и ключевые инварианты в порядке.')
