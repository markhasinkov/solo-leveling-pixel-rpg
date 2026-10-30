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
    'Святой источник жизни',
]
REQUIRED_FILES = [
    (ROOT / 'src' / 'data' / 'chapters.json', 'Сон Джин-Ву'),
    (ROOT / 'src' / 'data' / 'chapters.json', 'Святой источник жизни'),
    (ROOT / 'src' / 'data' / 'levels.json', 'Эхо Осборна'),
    (ROOT / 'src' / 'data' / 'bosses.json', 'Эхо Монарха Теней'),
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

if len(chapters) != 12:
    failures.append(f'глав должно быть 12, найдено {len(chapters)}')

by_id = {c['id']: c for c in chapters}
ch1, ch5, ch6, ch7 = by_id.get(1, {}), by_id.get(5, {}), by_id.get(6, {}), by_id.get(7, {})
ch9, ch11, ch12 = by_id.get(9, {}), by_id.get(11, {}), by_id.get(12, {})

if 'architect' in (ch1.get('characters') or []):
    failures.append('глава 1: Архитектор не должен присутствовать в двойном подземелье')
if 'lee-joo-hee' in (ch5.get('characters') or []):
    failures.append('глава 5: Ли Джу-Хи не участвовала в Красных вратах')
if 'igris' not in (ch6.get('characters') or []):
    failures.append('глава 6: Игрис должен быть боссом смены класса')
if 'Демоническ' in (ch6.get('title') or ''):
    failures.append('глава 6: квест на смену класса не должен называться Демоническим замком')
if 'армия теней' in json.dumps(ch5, ensure_ascii=False):
    failures.append('глава 5: тени ещё не пробуждены до смены класса')
if 'Святой источник' not in json.dumps(ch7, ensure_ascii=False):
    failures.append('глава 7: пробуждение мамы должно быть связано со Святым источником жизни')
if any(word in json.dumps(ch7, ensure_ascii=False) for word in ('операци', 'пересадк')):
    failures.append('глава 7: мама не должна лечиться обычной операцией')
if (levels.get('10', {}).get('boss') or {}).get('name') != 'Эхо Осборна':
    failures.append('глава 10: босс должен быть эхом Осборна, а не самим Осборном')
if any((npc or {}).get('id') == 'architect' for npc in (levels.get('1', {}).get('npcs') or [])):
    failures.append('глава 1: Архитектор не должен быть NPC')
if 'architect' in (ch9.get('characters') or []):
    failures.append('глава 9: Архитектор не участвует в гильдии Ахджин')
if 'Герольд' not in json.dumps(ch11, ensure_ascii=False):
    failures.append('глава 11: потерян Герольд Монархов')
if 'куб времени' in json.dumps(ch12, ensure_ascii=False).lower():
    failures.append('глава 12: неканонический «куб времени»')

architect = next((c for c in characters if c['id'] == 'architect'), {})
if 'Статуя Бога' in (architect.get('role') or ''):
    failures.append('Архитектор ошибочно назван Статуей Бога')
if 'Эхо' not in (bosses.get('ashborn', {}).get('subtitle') or ''):
    failures.append('bosses.json: Осборн должен быть эхом, а не обычным боссом')

if failures:
    print('LORE LINT: найдены расхождения:')
    for failure in failures:
        print(' - ' + failure)
    sys.exit(1)
print('LORE LINT: канон имён и ключевые инварианты в порядке.')
