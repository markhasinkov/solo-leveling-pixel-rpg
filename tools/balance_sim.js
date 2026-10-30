// tools/balance_sim.js — оценка баланса по главам на основе реальных формул и данных.
'use strict';
const fs = require('fs');
const path = require('path');
const F = require('../src/js/formulas.js');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const chapters = read('src/data/chapters.json');
const characters = read('src/data/characters.json');
const talentsData = read('src/data/talents.json');
const loot = read('src/data/loot.json');
const levels = read('src/data/levels.json');
const bosses = read('src/data/bosses.json');

const byId = Object.fromEntries(characters.map((c) => [c.id, c]));
const itemsById = Object.fromEntries(loot.items.map((i) => [i.id, i]));
const nodesById = Object.fromEntries(talentsData.nodes.map((n) => [n.id, n]));

const HUMANS = new Set(['yoo-jinho', 'cha-hae-in', 'go-gun-hee', 'song-chi-yul', 'lee-joo-hee',
  'ahn-sang-min', 'woo-jin-chul', 'baek-yoon-ho', 'kim-chul', 'choi-jong-in', 'min-byung-gu', 'architect']);

function isEnemy(id, c, chapter) {
  if (HUMANS.has(id)) return false;
  if (id === 'igris') return chapter === 5;
  if (id === 'baran') return chapter === 7;
  if (id === 'beru') return chapter === 9;
  if (id === 'hokhan') return chapter === 12;
  if (id === 'ashborn') return false;
  if (['antares', 'baruka', 'statue-of-god', 'kargalgan'].includes(id)) return true;
  const role = (c.role || '').toLowerCase();
  return /монстр|босс|зверь|вождь|король|рыцарь кров/.test(role);
}

function bossId(list, chapter) {
  const roleBoss = list.find((e) => /босс|монарх|король|вождь/.test((e.c.role || '').toLowerCase()));
  if (roleBoss) return roleBoss.id;
  const known = list.find((e) => ['statue-of-god', 'kargalgan', 'baruka', 'igris', 'baran', 'beru', 'ashborn', 'antares', 'architect'].includes(e.id));
  if (known) return known.id;
  return null;
}

// Ожидаемая экипировка к началу главы (игрок подбирает лут по ходу)
const GEAR = {
  1: {},
  2: { weapon: 'rusty-dagger' },
  3: { weapon: 'hunter-dagger', armor: 'hunter-jacket' },
  4: { weapon: 'frost-blade', armor: 'hunter-jacket', accessory: 'agility-ring' },
  5: { weapon: 'frost-blade', armor: 'frost-mail', accessory: 'agility-ring' },
  6: { weapon: 'demon-knight-blade', armor: 'frost-mail', accessory: 'agility-ring' },
  7: { weapon: 'demon-knight-blade', armor: 'demon-plate', accessory: 'agility-ring' },
  8: { weapon: 'demon-knight-blade', armor: 'demon-plate', accessory: 'shadow-amulet' },
  9: { weapon: 'kamish-dagger', armor: 'demon-plate', accessory: 'shadow-amulet' },
  10: { weapon: 'kamish-dagger', armor: 'monarch-cloak', accessory: 'shadow-amulet' },
  11: { weapon: 'kamish-dagger', armor: 'monarch-cloak', accessory: 'monarch-seal' },
  12: { weapon: 'monarch-blade', armor: 'monarch-cloak', accessory: 'monarch-seal' },
  13: { weapon: 'monarch-blade', armor: 'monarch-cloak', accessory: 'monarch-seal' }
};

// Разумное распределение талантов: сила/стойкость с переходом в крит и тень
const TALENT_ORDER = [
  'str-1', 'end-1', 'str-1', 'end-1', 'str-2', 'end-1', 'str-1', 'end-2',
  'shd-1', 'str-2', 'end-1', 'agi-1', 'str-3', 'end-2', 'shd-2', 'str-2',
  'end-3', 'str-4', 'end-4', 'shd-4', 'agi-2', 'agi-3', 'agi-4', 'shd-3'
];

function allocateTalents(points) {
  const ranks = {};
  let i = 0;
  let guard = 0;
  while (points > 0 && guard < 200) {
    guard++;
    const id = TALENT_ORDER[i % TALENT_ORDER.length];
    const node = nodesById[id];
    if (!node) { i++; continue; }
    if ((ranks[id] || 0) >= node.maxRank) { i++; continue; }
    const reqs = node.requires || [];
    if (reqs.some((r) => (ranks[r] || 0) < 1)) { i++; continue; }
    ranks[id] = (ranks[id] || 0) + 1;
    points -= node.cost || 1;
    i++;
  }
  return ranks;
}

function gearBonuses(gear) {
  const out = { hp: 0, atk: 0, def: 0, mp: 0, speedPct: 0, critChance: 0, mpRegen: 0 };
  for (const slot in gear) {
    const item = itemsById[gear[slot]];
    if (!item || !item.stats) continue;
    for (const k in out) if (typeof item.stats[k] === 'number') out[k] += item.stats[k];
  }
  return out;
}

function scaledBoss(cid, chapter, lv) {
  const c = cid ? byId[cid] : null;
  if (!c) {
    const custom = (lv && lv.boss) || {};
    const bd = (custom.bossData && bosses[custom.bossData]) || {};
    return {
      hp: bd.hpBase || 3500 + chapter * 1200,
      atk: bd.atkBase || 58 + chapter * 20,
      def: bd.defBase || 18 + chapter * 7,
      name: custom.name || 'Страж главы'
    };
  }
  const bd = bosses[cid] || {};
  return {
    hp: bd.hpBase || Math.round(c.stats.hp * (1 + 0.07 * (chapter - 1))),
    atk: bd.atkBase || Math.round(c.stats.atk * (1 + 0.045 * (chapter - 1))),
    def: bd.defBase || Math.round(c.stats.def * (1 + 0.03 * (chapter - 1))),
    name: c.name
  };
}

let level = 1;
let xp = 0;
let talentPoints = 0;
let rows = [];

for (const ch of chapters) {
  const cid = ch.id;
  const lv = levels[String(cid)] || {};
  const enemies = [];
  (ch.characters || []).forEach((ref) => {
    const c = byId[ref];
    if (c && isEnemy(ref, c, cid)) enemies.push(ref);
  });
  (lv.extra || []).forEach((ex) => { for (let i = 0; i < (ex.count || 1); i++) enemies.push(ex.id); });
  const customBoss = lv.boss && lv.boss.bossData ? lv.boss : null;
  const boss = customBoss ? null : bossId(enemies.map((id) => ({ id, c: byId[id] })), cid);
  const bossStats = scaledBoss(boss, cid, lv);

  // Игрок к началу главы
  const ranks = allocateTalents(talentPoints);
  const mods = F.aggregateTalents(nodesById, ranks);
  const gear = gearBonuses(GEAR[cid] || {});
  const stats = F.derivedStats(byId['sung-jin-woo'].stats, level, mods, gear, {});
  stats.name = 'Сон Джин-Ву';

  // DPS игрока: базовая атака + средний вклад умений (с учётом MP и КД ~70%)
  const crit = 1 + stats.critChance * (stats.critMult - 1);
  const comboAvg = (1 + 1.16 + 1.58) / 3;
  const basicDmg = F.damage(stats.atk, bossStats.def, comboAvg) * crit;
  const basicDps = basicDmg / Math.max(0.18, 0.4 * (1 - stats.attackSpeedPct));
  const skills = [
    { mult: 1.7, cd: 4 }, { mult: 1.35, cd: 3 }, { mult: 1.2, cd: 7 },
    { mult: 2.2, cd: 14 }, { mult: 0.6, cd: 28 }
  ];
  const skillDps = skills.reduce((sum, s) => sum + F.damage(stats.atk, bossStats.def, s.mult) * crit / s.cd, 0) * 0.7;
  const dps = basicDps + skillDps;
  const bossTtk = bossStats.hp / dps;

  // Выживаемость: средний удар босса с множителем 1.3 и 75% попаданий
  const bossHit = F.damage(bossStats.atk, stats.def, 1.3);
  const bossDps = bossHit / 1.8 * 0.75;
  const potionHeal = 150 + 380;
  const survive = (stats.maxHp + potionHeal) / bossDps;

  // XP за главу: враги + основная награда + 60% побочных + секрет/загадка
  let enemyXp = 0;
  enemies.forEach((id) => {
    const c = byId[id];
    if (!c) return;
    enemyXp += F.enemyXp(c.stats, id === boss, cid);
  });
  const main = (require('../src/data/quests.json').main.find((q) => q.chapter === cid) || { rewards: {} });
  const side = require('../src/data/quests.json').side.filter((q) => q.chapter === cid);
  const sideXp = side.reduce((s, q) => s + ((q.rewards && q.rewards.xp) || 0), 0) * 0.6;
  const exploreXp = (25 + cid * 6) + (35 + cid * 8) + (10 + cid * 4);
  const chapterXp = enemyXp + ((main.rewards && main.rewards.xp) || 0) + sideXp + exploreXp;

  rows.push({
    chapter: cid, level, hp: stats.maxHp, atk: stats.atk, def: stats.def,
    stats: Object.assign({}, stats), gear: Object.assign({}, gear),
    boss: bossStats.name, bossHp: bossStats.hp, bossAtk: bossStats.atk,
    ttk: bossTtk, survive, dps, bossHit, chapterXp, talentPoints
  });

  // Начисляем опыт и очки талантов (1 за уровень)
  xp += chapterXp;
  while (xp >= F.xpToNext(level)) {
    xp -= F.xpToNext(level);
    level++;
    talentPoints++;
  }
}

function report() {
  console.log('Глава | Ур. | HP   | ATK | DEF | Босс              | HP босса | Удар | TTK,с | Живёт,с | XP главы');
  console.log('------+-----+------+-----+-----+-------------------+----------+------+-------+---------+--------');
  for (const r of rows) {
    console.log(
      String(r.chapter).padStart(5) + ' | ' +
      String(r.level).padStart(3) + ' | ' +
      String(r.hp).padStart(4) + ' | ' +
      String(r.atk).padStart(3) + ' | ' +
      String(r.def).padStart(3) + ' | ' +
      r.boss.padEnd(17).slice(0, 17) + ' | ' +
      String(r.bossHp).padStart(8) + ' | ' +
      String(Math.round(r.bossHit)).padStart(4) + ' | ' +
      r.ttk.toFixed(1).padStart(5) + ' | ' +
      r.survive.toFixed(1).padStart(7) + ' | ' +
      String(r.chapterXp).padStart(5)
    );
  }

  const problems = [];
  rows.forEach((r) => {
    if (r.ttk > 35) problems.push('Глава ' + r.chapter + ': босс умирает слишком долго (' + r.ttk.toFixed(1) + ' с)');
    if (r.ttk < 12) problems.push('Глава ' + r.chapter + ': босс умирает слишком быстро (' + r.ttk.toFixed(1) + ' с)');
    if (r.survive < 15) problems.push('Глава ' + r.chapter + ': игрок живёт слишком мало (' + r.survive.toFixed(1) + ' с)');
    if (r.survive > 60) problems.push('Глава ' + r.chapter + ': игрок почти неуязвим (' + r.survive.toFixed(1) + ' с)');
  });
  console.log('\nИтоговый уровень к финалу:', level, '| очков талантов:', talentPoints);
  if (problems.length) {
    console.log('\nЗамечания баланса:');
    problems.forEach((p) => console.log(' - ' + p));
  } else {
    console.log('\nБаланс в целевых диапазонах (TTK 12–35 c, выживание 15–60 c).');
  }
}

if (require.main === module) report();
module.exports = rows;
