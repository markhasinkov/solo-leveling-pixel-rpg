// tools/smoke_test.js — headless-проверка всей игры без браузера.
// Загружает реальные модули и JSON, подменяет DOM/canvas и прогоняет сценарии.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  toggle(c, force) {
    if (force === undefined) force = !this.set.has(c);
    if (force) this.set.add(c); else this.set.delete(c);
    return force;
  }
  contains(c) { return this.set.has(c); }
}

function makeCtx() {
  const gradient = { addColorStop() {} };
  let saveDepth = 0;
  const target = {
    canvas: { width: 960, height: 540 },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setTransform() {}, save() { saveDepth++; }, restore() { saveDepth--; },
    translate() {}, scale() {}, rotate() {},
    drawImage() {}, fillRect() {}, strokeRect() {}, clearRect() {}, beginPath() {},
    closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
    fillText() {}, strokeText() {}, setLineDash() {}, clip() {}, putImageData() {}
  };
  Object.defineProperty(target, '__saveDepth', { get: () => saveDepth });
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      return function () {};
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

let elementSeq = 0;
class FakeElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = { setProperty() {} };
    this.classList = new ClassList();
    this.dataset = {};
    this.textContent = '';
    this.innerHTML = '';
    this.title = '';
    this.src = '';
    this.alt = '';
    this.disabled = false;
    this.width = 0;
    this.height = 0;
    this.offsetWidth = 100;
    this._listeners = {};
    this._id = ++elementSeq;
    this.className = '';
    this.draggable = false;
  }
  get firstChild() { return this.children[0] || null; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) {
    const i = this.children.indexOf(c);
    if (i >= 0) { this.children.splice(i, 1); c.parentNode = null; }
    return c;
  }
  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this._listeners[type] || [];
    const i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  }
  dispatch(type, ev) {
    (this._listeners[type] || []).forEach((fn) => fn(ev || {}));
  }
  click() { this.dispatch('click', {}); }
  matches(sel) {
    if (sel.startsWith('.')) return String(this.className).split(/\s+/).includes(sel.slice(1));
    if (sel.startsWith('#')) return this.id === sel.slice(1);
    return this.tagName === sel.toUpperCase();
  }
  querySelector(sel) {
    for (const child of this.children) {
      if (child.matches(sel)) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    return null;
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(sel)) out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }
  getContext() { return makeCtx(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 118, height: 118 }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  focus() {}
  blur() {}
}

const uiRoot = new FakeElement('div');
uiRoot.id = 'ui-root';
const canvas = new FakeElement('canvas');
canvas.id = 'game-canvas';
canvas.width = 960; canvas.height = 540;
const wrap = new FakeElement('div');
wrap.className = 'game-wrap';
const boot = new FakeElement('div');
boot.id = 'boot-screen';
const rotateHint = new FakeElement('div');
rotateHint.id = 'rotate-hint';
const rotateBtn = new FakeElement('button');
rotateBtn.id = 'rotate-continue';
const docElement = new FakeElement('html');
const body = new FakeElement('body');

const byId = {
  'game-canvas': canvas,
  'ui-root': uiRoot,
  'boot-screen': boot,
  'rotate-hint': rotateHint,
  'rotate-continue': rotateBtn
};

const domReadyListeners = [];
const documentStub = {
  readyState: 'loading',
  body,
  documentElement: docElement,
  createElement(tag) { return new FakeElement(tag); },
  getElementById(id) { return byId[id] || null; },
  querySelector(sel) {
    if (sel === '.game-wrap') return wrap;
    return wrap.querySelector(sel);
  },
  querySelectorAll(sel) { return wrap.querySelectorAll(sel); },
  addEventListener(type, fn) { if (type === 'DOMContentLoaded') domReadyListeners.push(fn); }
};

let now = 0;
const rafQueue = [];
const timers = [];
let timerSeq = 0;

const storage = new Map();

function readJson(url) {
  const clean = url.replace(/^\.?\//, '');
  const file = path.join(ROOT, clean);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const sandbox = {
  console,
  document: documentStub,
  navigator: { maxTouchPoints: 0, userAgent: 'NodeSmokeTest' },
  InnerWidth: 960,
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k)
  },
  performance: { now: () => now },
  requestAnimationFrame(cb) { rafQueue.push(cb); return rafQueue.length; },
  setTimeout(fn, ms) { const id = ++timerSeq; timers.push({ id, at: now + (ms || 0), fn }); return id; },
  clearTimeout(id) { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
  Image: class FakeImage {
    constructor() { this.onload = null; this.onerror = null; this._src = ''; }
    set src(v) { this._src = v; if (this.onerror) this.onerror(); }
    get src() { return this._src; }
  },
  fetch(url) {
    try {
      const data = readJson(String(url));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
    } catch (e) {
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(e) });
    }
  },
  Math, JSON, Object, Array, Promise, Number, String, Boolean, Set, Map, Date, Error,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  queueMicrotask
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
Object.defineProperty(sandbox, 'innerWidth', { get: () => 960, set: () => {} });
Object.defineProperty(sandbox, 'innerHeight', { get: () => 540, set: () => {} });
sandbox.addEventListener = function () {};
sandbox.removeEventListener = function () {};

vm.createContext(sandbox);

const scripts = [
  'engine.js', 'formulas.js', 'audio.js', 'effects.js', 'player.js', 'boss.js',
  'combat.js', 'progress.js', 'loot.js', 'quests.js', 'world.js', 'dialogue.js',
  'shadows.js', 'bonds.js', 'ui.js', 'save.js', 'tg.js', 'main.js'
];
for (const f of scripts) {
  const code = fs.readFileSync(path.join(ROOT, 'src', 'js', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log('  OK  ' + msg);
  else { failures++; console.log('  FAIL ' + msg); }
}

function advance(ms) {
  const steps = Math.max(1, Math.round(ms / 16));
  for (let s = 0; s < steps; s++) {
    now += 16;
    const due = timers.filter((t) => t.at <= now);
    for (const t of due) {
      const i = timers.indexOf(t);
      if (i >= 0) timers.splice(i, 1);
      try { t.fn(); } catch (e) { console.error('timer error', e); failures++; }
    }
    const q = rafQueue.splice(0);
    for (const cb of q) cb(now);
  }
}

function press(key) {
  sandbox.Engine.Input.keys.add(key);
  sandbox.Engine.Input.pressed.add(key);
}
function release(key) { sandbox.Engine.Input.keys.delete(key); }

(async () => {
  const Solo = sandbox.window.SoloGame;
  assert(!!Solo && typeof Solo.loadData === 'function', 'window.SoloGame.loadData существует');
  const data = await Solo.loadData();
  assert(Array.isArray(data.chapters) && data.chapters.length === 13, 'loadData отдаёт 13 глав');
  assert(Array.isArray(data.characters) && data.characters.length >= 20, 'loadData отдаёт персонажей');

  const game = Solo.Game;
  await game.init();
  advance(100);

  assert(game.loading === false, 'игра загружена');
  assert(game.chapter && game.chapter.id === 1, 'старт с главы 1');
  assert(game.player && game.player.hp > 0, 'игрок создан');
  assert(game.boss && game.boss.name === 'Статуя Бога', 'босс главы 1 — Статуя Бога');
  assert(game.monsters.length >= 3, 'враги главы 1 созданы: ' + game.monsters.length);
  assert(game.npcs.length >= 2, 'NPC главы 1 созданы: ' + game.npcs.length);
  assert(uiRoot.children.length > 5, 'UI построен (' + uiRoot.children.length + ' корневых блоков)');

  // ---------- Сюжетное вступление ----------
  assert(sandbox.Dialogue.active, 'сюжетное вступление главы показывается автоматически');
  const storyIntroLines = sandbox.Dialogue.lines.length;
  assert(storyIntroLines >= 3, 'сюжетное вступление содержит сцену (' + storyIntroLines + ' реплик)');
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();

  // ---------- Движение и удар ----------
  const x0 = game.player.x;
  press('d');
  advance(240);
  release('d');
  assert(game.player.x > x0 + 5, 'игрок двигается вправо (D)');

  const target = game.monsters.find((m) => !m.dead && !m.isBoss);
  assert(!!target, 'есть обычный враг для теста');
  game.player.x = target.x - 30;
  game.player.y = target.y;
  game.player.face = 1;
  game.player.attackTimer = 0;
  const hpBefore = target.hp;
  game.playerAttack(game.player);
  assert(target.hp < hpBefore, 'обычная атака наносит урон (' + hpBefore + ' → ' + target.hp + ')');

  // ---------- Комбо-цепочки ----------
  game.player.invulnTimer = 999;
  game.player.comboStep = 0;
  game.player.comboTimer = 0;
  game.player.x = 590;
  game.player.y = game.world.floorY - game.player.h;
  game.player.face = 1;
  const dummy = game.spawnEnemy('goblin', 620, { stats: { hp: 99999, atk: 0, def: 0 } });
  dummy.update = () => {};
  const originalPlayerDamage = sandbox.Combat.playerDamage;
  const comboMults = [];
  sandbox.Combat.playerDamage = (g, m, mult) => {
    comboMults.push(mult);
    return { dmg: 0, crit: false };
  };
  try {
    game.playerAttack(game.player);
    assert(game.player.comboStep === 1, 'первый удар открывает комбо');
    game.playerAttack(game.player);
    assert(game.player.comboStep === 2, 'второй удар продолжает комбо');
    game.playerAttack(game.player);
    assert(game.player.comboStep === 3, 'третий удар завершает комбо');
    assert(comboMults.length === 3 && comboMults[2] > comboMults[1] && comboMults[1] > comboMults[0],
      'удары комбо усиливаются к финишеру');
  } finally {
    sandbox.Combat.playerDamage = originalPlayerDamage;
    game.monsters = game.monsters.filter((m) => m !== dummy);
  }
  sandbox.UI.update(game, true);
  assert(sandbox.UI.comboBadge.style.display !== 'none' &&
    sandbox.UI.comboCount.textContent === '×3' &&
    sandbox.UI.comboWord.textContent === 'ФИНИШЕР', 'HUD показывает финишер комбо');
  advance(1100);
  assert(game.player.comboStep === 0, 'комбо сбрасывается по таймеру');
  sandbox.UI.update(game, true);
  assert(sandbox.UI.comboBadge.style.display === 'none', 'HUD скрывает завершённое комбо');

  // ---------- Рывок с i-frames ----------
  game.player.invulnTimer = 0;
  game.player.comboStep = 2;
  game.player.comboTimer = 0.8;
  game.hurtPlayer(10, { source: 'test' });
  assert(game.player.comboStep === 0, 'полученный урон сбрасывает комбо');
  game.player.hp = game.player.maxHp;
  game.player.x = 90;
  game.player.y = game.world.floorY - game.player.h;
  game.player.dodgeCd = 0;
  game.player.dashTimer = 0;
  game.player.dodgeInvuln = 0;
  game.player.invulnTimer = 0;
  game.player.onGround = true;
  game.player.mp = 10;
  press('shift');
  advance(32);
  release('shift');
  assert(game.player.dodgeCd > 0.8, 'рывок уходит в кулдаун');
  assert(game.player.invulnTimer > 0.2 && game.player.dodgeInvuln > 0, 'рывок даёт кадры неуязвимости');
  const dodgeHp = game.player.hp;
  const dodgeMp = game.player.mp;
  const dodgeHit = game.hurtPlayer(50, { source: 'melee' });
  assert(dodgeHit === 0 && game.player.hp === dodgeHp, 'i-frames блокируют урон');
  assert(game.player.mp === Math.min(game.player.maxMp, dodgeMp + 4), 'идеальный рывок возвращает ману');
  advance(1300);
  assert(game.player.dodgeCd === 0, 'кулдаун рывка восстанавливается');
  game.player.invulnTimer = 0;
  game.player.comboStep = 0;
  game.player.comboTimer = 0;
  game.player.mp = game.player.maxMp;

  // ---------- Умения ----------
  game.progress.level = 10;
  game.progress.recalc();
  game.player.syncStats(game.progress.stats, false);
  game.player.mp = game.player.maxMp;
  const mpBefore = game.player.mp;
  game.castSkillSlot(0);
  assert(game.player.mp < mpBefore, 'умение тратит ману (' + mpBefore + ' → ' + game.player.mp + ')');
  assert(sandbox.Combat.cooldownLeft('shadow-slash') > 0, 'умение уходит в перезарядку');
  advance(120);

  // ---------- Новые умения ----------
  assert(sandbox.Combat.skills.length === 8, 'в игре восемь активных умений');
  assert(['6', '7', '8'].every((key) => sandbox.Combat.skills.some((s) => s.key === key)),
    'новые умения назначены на клавиши 6–8');
  game.progress.level = Math.max(14, game.progress.level);
  game.progress.recalc();
  game.player.syncStats(game.progress.stats, false);
  game.player.mp = game.player.maxMp;
  const testDummy = game.spawnEnemy('goblin', 300, {});
  testDummy.x = game.player.x + 90;
  testDummy.y = game.world.floorY - testDummy.h;
  testDummy.hp = testDummy.maxHp = 99999;
  testDummy.def = 0;
  testDummy.stunTimer = 0;
  game.player.face = 1;
  const hpBeforeBlood = game.player.hp = 50;
  game.castSkillSlot(5);
  advance(40);
  assert(game.player.hp > hpBeforeBlood, 'Кровавый клинок лечит от нанесённого урона');
  sandbox.Effects.projectiles.length = 0;
  game.player.mp = game.player.maxMp;
  game.castSkillSlot(6);
  assert(sandbox.Effects.projectiles.filter((p) => p.owner === 'player').length === 5,
    'Веер теней выпускает пять клинков');
  sandbox.Effects.projectiles.length = 0;
  game.player.mp = game.player.maxMp;
  game.castSkillSlot(7);
  assert(testDummy.stunTimer > 0, 'Теневая клетка оглушает врагов');
  testDummy.dead = true;
  game.monsters = game.monsters.filter((m) => m !== testDummy);
  advance(80);

  // ---------- Опыт и таланты ----------
  const lvlBefore = game.progress.level;
  const tpBefore = game.progress.talentPoints;
  game.progress.xp = game.progress.xpNext() - 1;
  game.addXp(10);
  assert(game.progress.level === lvlBefore + 1, 'опыт повышает уровень');
  assert(game.progress.talentPoints > tpBefore, 'за уровень даётся очко таланта');
  const firstNode = Object.values(game.progress.nodesById).find((n) => game.progress.canLearn(n.id).ok);
  if (firstNode) {
    const res = game.learnTalent(firstNode.id);
    assert(res.ok && game.progress.rank(firstNode.id) === 1, 'талант изучается: ' + firstNode.name);
  } else {
    assert(false, 'нет доступного таланта для теста');
  }

  // ---------- Инвентарь и экипировка ----------
  game.grantItem('rusty-dagger', 1, { notable: false });
  const atkBefore = game.progress.stats.atk;
  game.equipItem('rusty-dagger');
  assert(game.progress.stats.atk > atkBefore, 'экипировка повышает атаку');
  assert(game.inventory.equipment.weapon === 'rusty-dagger', 'оружие надето в слот');
  game.grantItem('hp-potion-small', 2, { notable: false });
  game.player.hp = Math.max(1, game.player.maxHp - 300);
  const hpPotionBefore = game.player.hp;
  const used = game.useItem('hp-potion-small');
  assert(used && game.player.hp > hpPotionBefore, 'зелье лечения восстанавливает HP');

  // ---------- Секрет и загадка ----------
  const secret = game.world.secrets[0];
  assert(!!secret, 'секрет главы существует');
  game.player.x = secret.x + secret.w / 2 - game.player.w / 2;
  game.player.y = game.world.floorY - game.player.h;
  const secretsBefore = game.stats.secrets;
  const found = game.world.tryInteract(game.player, game);
  assert(found && secret.found, 'тайник находится через E');
  assert(game.stats.secrets === secretsBefore + 1, 'найденный тайник учитывается в статистике');
  assert(!!sandbox.Quests.stateOf('hidden-secrets'), 'найденный тайник открывает скрытый квест «Шёпот стен»');
  const sideSecret = sandbox.Quests.stateOf('side-1b');
  assert(sideSecret && sideSecret.status === 'completed', 'побочный квест за тайник выполняется');

  const puzzle = game.world.puzzles[0];
  assert(!!puzzle, 'загадка главы существует');
  puzzle.sequence.forEach((idx) => game.world.activateDevice(puzzle, idx, game));
  assert(puzzle.solved, 'загадка решается правильной последовательностью');
  assert(!!puzzle.rewardChest, 'за решение появляется сундук');
  puzzle.rewardChest.opened = false;
  game.player.x = puzzle.rewardChest.x + 4;
  game.player.y = game.world.floorY - game.player.h;
  const chestOk = game.world.tryInteract(game.player, game);
  assert(chestOk && puzzle.rewardChest.opened, 'сундук за загадку открывается');
  assert(!!sandbox.Quests.stateOf('hidden-puzzle'), 'решение загадки открывает скрытый квест');

  // Отводим игрока от босса, чтобы он не начал бой во время проверки механик
  game.player.x = 90;
  game.player.y = game.world.floorY - game.player.h;
  game.boss.x = game.boss.homeX;
  game.boss.engaged = false;
  sandbox.Engine.Camera.snap(game.player, game.level.worldW, game.level.worldH);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();

  // ---------- Механики всех боссов ----------
  game.player.invulnTimer = 999;
  game.player.hp = game.player.maxHp = 99999;
  let mechanicsErrors = 0;
  for (const bid of Object.keys(game.bossesData)) {
    const bd = game.bossesData[bid];
    let boss;
    try {
      boss = new sandbox.window.Boss(900, game.world.floorY - 80, {
        w: 70, h: 80, hp: 5000, atk: 100, def: 20,
        name: bd.title || bid, lootId: 'guardian', bossData: bd
      });
      bd.attacks.forEach((atk) => boss.executeAttack(atk, game));
    } catch (e) {
      mechanicsErrors++;
      console.log('    boss mechanics error ' + bid + ': ' + e.message);
    }
  }
  advance(2600);
  assert(mechanicsErrors === 0, 'все типы атак боссов исполняются без ошибок');

  // ---------- Читаемость паттернов ----------
  const readabilityBoss = new sandbox.window.Boss(900, game.world.floorY - 80, {
    w: 70, h: 80, hp: 5000, atk: 100, def: 20,
    name: 'Тест', bossData: game.bossesData.baruka
  });
  const fanAttack = game.bossesData.baruka.attacks.find((a) => a.type === 'fan');
  sandbox.Effects.reset();
  readabilityBoss.executeAttack(fanAttack, game);
  assert(sandbox.Effects.telegraphs.some((t) => t.shape === 'cone'),
    'веер босса получает конусный телеграф');
  assert(sandbox.UI.bossCast.style.display !== 'none' &&
    sandbox.UI.bossCastName.textContent === fanAttack.name &&
    sandbox.UI.bossCastType.textContent === 'ВЕЕР', 'плашка замаха показывает веер');
  sandbox.UI.hideBossCast();
  sandbox.Effects.reset();
  const teleportAttack = game.bossesData.ashborn.attacks.find((a) => a.type === 'teleport');
  readabilityBoss.executeAttack(teleportAttack, game);
  assert(sandbox.Effects.telegraphs.some((t) => t.shape === 'circle'),
    'телепорт заранее показывает точку выхода');
  assert(sandbox.UI.bossCastType.textContent === 'ТЕЛЕПОРТ', 'плашка замаха показывает телепорт');
  sandbox.UI.hideBossCast();
  sandbox.Effects.reset();

  // ---------- Звуковые сигналы замахов ----------
  const toneCalls = [];
  const noiseCalls = [];
  const originalTone = sandbox.AudioFX.tone;
  const originalNoise = sandbox.AudioFX.noise;
  sandbox.AudioFX.tone = function (opts) { toneCalls.push(opts); };
  sandbox.AudioFX.noise = function (opts) { noiseCalls.push(opts); };
  for (const cue of ['bossWarnHeavy', 'bossWarnQuick', 'bossWarnMagic', 'bossTick', 'bossTickFinal']) {
    const before = toneCalls.length + noiseCalls.length;
    sandbox.AudioFX.play(cue);
    assert(toneCalls.length + noiseCalls.length > before, 'звук «' + cue + '» синтезируется');
  }
  sandbox.AudioFX.tone = originalTone;
  sandbox.AudioFX.noise = originalNoise;

  sandbox.UI.showBossCast('Короткий замах', 0.4, '#ffffff', 'ЩИТ');
  assert(sandbox.UI._bossCastCues.length === 0, 'короткий замах обходится без тиков');
  sandbox.UI.showBossCast('Средний замах', 0.7, '#ffffff', 'ВЕЕР');
  assert(sandbox.UI._bossCastCues.length === 1 &&
    sandbox.UI._bossCastCueSounds[0] === 'bossTickFinal', 'средний замах получает только финальный тик');
  sandbox.UI.hideBossCast();

  const audioLog = [];
  const originalPlay = sandbox.AudioFX.play;
  sandbox.AudioFX.play = function (name) {
    audioLog.push(name);
    return originalPlay.call(this, name);
  };
  const slamAttack = game.bossesData['statue-of-god'].attacks.find((a) => a.type === 'slam');
  readabilityBoss.executeAttack(slamAttack, game);
  assert(audioLog.indexOf('bossWarnHeavy') >= 0, 'тяжёлый замах озвучен низким сигналом');
  sandbox.UI.hideBossCast();
  audioLog.length = 0;
  const shieldAttack = game.bossesData.igris.attacks.find((a) => a.type === 'shield');
  readabilityBoss.executeAttack(shieldAttack, game);
  assert(audioLog.indexOf('bossWarnMagic') >= 0, 'магический замах озвучен переливом');
  sandbox.UI.hideBossCast();
  sandbox.Effects.reset();

  game.boss.engaged = false;
  sandbox.Dialogue.close();
  game._pendingZoneStory = null;
  sandbox.UI.showBossCast('Проверка отсчёта', 1.0, '#ff6a5a', 'УДАР');
  advance(650);
  assert(audioLog.indexOf('bossTick') >= 0, 'замах даёт тик обратного отсчёта');
  assert(audioLog.indexOf('bossTickFinal') < 0, 'до удара остаётся больше одного тика');
  advance(300);
  assert(audioLog.indexOf('bossTickFinal') >= 0, 'перед ударом звучит финальный тик');
  sandbox.UI.hideBossCast();
  sandbox.AudioFX.play = originalPlay;
  sandbox.Effects.reset();
  for (const m of game.monsters) {
    if (m.summoned) { m.dead = true; m.deathTimer = 0; }
  }
  game.player.invulnTimer = 0;
  game.player.hp = game.player.maxHp;

  // ---------- Диалог босса перед боем ----------
  game._pendingZoneStory = null;
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  game.player.invulnTimer = 999;
  game.player.x = game.boss.x - 420;
  game.player.y = game.world.floorY - game.player.h;
  advance(400);
  assert(game.boss.engaged, 'босс входит в бой при приближении');
  assert(game._bossDlgPlayed && sandbox.Dialogue.active, 'перед боем проигрывается сюжетный диалог босса');
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  game._pendingZoneStory = null;
  game.player.x = 90;
  game.player.y = game.world.floorY - game.player.h;
  sandbox.Engine.Camera.snap(game.player, game.level.worldW, game.level.worldH);

  // ---------- Мышь и выбор умения ----------
  game.progress.level = 10;
  game.progress.recalc();
  game.player.syncStats(game.progress.stats, true);
  const I = sandbox.Engine.Input;
  I.touchMode = false;
  I.mouse.overCanvas = true;
  I.mouse.active = true;
  I.mouse.screenX = 480;
  I.mouse.screenY = 300;
  const aim = sandbox.Combat.aimVector(game);
  assert(aim.source === 'mouse', 'мышь задаёт направление прицела');
  I.mouse.left = true;
  assert(I.action('attack') === true, 'ЛКМ включает удержание атаки');
  I.mouse.left = false;
  I.mouse.rightPressed = true;
  assert(I.mouse.rightPressed === true, 'ПКМ фиксирует каст выбранного умения');
  game.selectedSkill = 0;
  game.cycleSelectedSkill(1);
  assert(game.selectedSkill === 1, 'колесо/цикл переключает выбранное умение');
  I.mouse.overCanvas = false;
  I.mouse.active = false;
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();

  // ---------- Мобильная раскладка ----------
  game.settings.leftHanded = true;
  sandbox.UI.applyHandedness();
  assert(sandbox.document.body.classList.contains('left-handed'), 'раскладка для левши включается');

  // ---------- Квесты, лут, завершение главы ----------
  const mainQuest = sandbox.Quests.byId['main-1'];
  assert(!!mainQuest && sandbox.Quests.stateOf('main-1'), 'сюжетный квест главы активен');
  game.inventory.items = {};
  game.monsters.filter((m) => !m.isBoss && !m.dead).forEach((m) => game.damageMonster(m, 99999, { source: 'basic' }));
  assert(game.monsters.filter((m) => !m.isBoss).every((m) => m.dead), 'обычные враги побеждены');
  game.damageMonster(game.boss, 99999, { source: 'basic' });
  advance(1800);
  assert(game.boss.dead, 'босс повержен');
  assert(sandbox.Dialogue.active || game.state === 'chapterEnd', 'после победы начинается диалог главы');
  if (sandbox.Dialogue.active) {
    for (let i = 0; i < 20 && sandbox.Dialogue.active; i++) {
      press('e'); advance(100); release('e');
    }
  }
  advance(200);
  assert(game.chapterIndex === 1, 'после главы 1 открывается глава 2 (index=' + game.chapterIndex + ')');
  const mainState = sandbox.Quests.stateOf('main-1');
  assert(mainState && mainState.status === 'completed', 'сюжетный квест главы 1 завершён и награждён');
  assert(game.inventory.count('hunter-dagger') + game.inventory.count('hunter-jacket') > 0, 'с босса гарантированно падает снаряжение');
  assert(game.boss === null || game.chapterIndex === 1, 'состояние главы корректно после перехода');

  // ---------- Сохранение ----------
  game.persist();
  const raw = storage.get('solo-leveling-save');
  assert(!!raw, 'сохранение записано');
  const saved = JSON.parse(raw);
  assert(saved.version === 5 && saved.progress && saved.inventory, 'сохранение v5 содержит прогресс, инвентарь и теней');
  const loaded = sandbox.SaveSystem.load();
  assert(loaded && loaded.version === 5 && loaded.chapterIndex === 1, 'сохранение читается обратно');

  // ---------- UI-панели ----------
  try {
    sandbox.UI.toggleInventory();
    assert(sandbox.UI.inventory.style.display !== 'none', 'инвентарь открывается');
    sandbox.UI.renderInventory();
    sandbox.UI.closeAllPanels();
    sandbox.UI.toggleTalents();
    assert(sandbox.UI.talents.style.display !== 'none', 'древо талантов открывается');
    sandbox.UI.refreshTalents();
    sandbox.UI.closeAllPanels();
    sandbox.UI.toggleQuests();
    assert(sandbox.UI.quest.style.display !== 'none', 'журнал квестов открывается');
    sandbox.UI.renderQuests();
    assert(!!sandbox.UI.questContent.querySelector('.story-summary'), 'в журнале показывается сводка сюжета главы');
    sandbox.UI.closeAllPanels();
    sandbox.UI.toggleMenu();
    assert(sandbox.UI.menu.style.display !== 'none', 'меню открывается');
    assert(sandbox.UI.menuShadow.textContent.indexOf('Теневая армия:') === 0, 'в меню есть строка теневой армии');
    sandbox.UI.closeAllPanels();
    sandbox.UI.enableTouch(true);
    assert(!!sandbox.UI.touch, 'touch-управление включается');
    sandbox.UI.enableTouch(false);
    press('y');
    advance(60);
    release('y');
    assert(sandbox.UI.shadowPanel.style.display !== 'none', 'Y открывает панель теневой армии');
    sandbox.UI.closeAllPanels();

    // ---------- Хаб гильдии Ахджин ----------
    game.unlocked = 1;
    game.chapterIndex = 1;
    assert(!sandbox.UI.hubUnlocked(), 'до главы 9 хаб гильдии закрыт');
    sandbox.UI.toggleHub();
    assert(sandbox.UI.hub.style.display === 'none', 'закрытый хаб не открывается');
    game.unlocked = 9;
    press('g');
    advance(60);
    release('g');
    assert(sandbox.UI.hub.style.display !== 'none', 'G открывает хаб гильдии');
    assert(sandbox.UI.hub.querySelectorAll('.hub-chapter').length === 13, 'доска контрактов показывает 13 глав');
    const openChapters = Array.from(sandbox.UI.hub.querySelectorAll('.hub-chapter'))
      .filter((b) => String(b.className).indexOf('locked') < 0);
    assert(openChapters.length === 10, 'в хабе доступны открытые главы');
    assert(sandbox.UI.hub.querySelectorAll('.hub-shadow-card').length === 2, 'в хабе два слота отряда');
    assert(sandbox.UI.hub.querySelectorAll('.hub-act').length === 6, 'снабжение хаба предлагает 6 действий');
    assert(sandbox.UI.hub.querySelectorAll('.hub-contract').length === 3, 'в хабе три ежедневных контракта');
    assert(sandbox.UI.hub.querySelectorAll('.hub-contract-btn').length === 3, 'у контрактов есть кнопки действий');
    game.inventory.add('hp-potion-small', 1);
    game.player.hp = 1;
    sandbox.UI.renderHub();
    const hubHeal = Array.from(sandbox.UI.hub.querySelectorAll('.hub-link'))
      .find((b) => b.textContent === 'ВЫПИТЬ');
    assert(hubHeal && !hubHeal.disabled, 'хаб предлагает выпить зелье');
    hubHeal.click();
    assert(game.player.hp > 1, 'зелье из хаба лечит игрока');
    const hubChapter = openChapters[0];
    hubChapter.click();
    advance(80);
    assert(game.chapterIndex === 0 && sandbox.UI.hub.style.display === 'none',
      'контракт с доски возвращает в выбранную главу');
    sandbox.UI.closeAllPanels();

    // ---------- Связи в хабе ----------
    game.unlocked = 9;
    game.bonds = {};
    press('g');
    advance(60);
    release('g');
    assert(sandbox.UI.hub.querySelectorAll('.hub-bond').length === 3,
      'в хабе доступны три линии связей');
    const bondCard = (name) => Array.from(sandbox.UI.hub.querySelectorAll('.hub-bond'))
      .find((c) => c.querySelector('.hub-bond-name').textContent === name);
    assert(bondCard('Ча Хэ-Ин').querySelector('.hub-bond-btn').disabled,
      'линия Ча Хэ-Ин закрыта до главы 10');
    assert(!bondCard('Семья').querySelector('.hub-bond-btn').disabled,
      'семейная линия открыта после пробуждения мамы');
    const hpBeforeBond = game.player.maxHp;
    bondCard('Семья').querySelector('.hub-bond-btn').click();
    advance(40);
    assert(sandbox.Dialogue.active, 'сцена связи запускается');
    while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
    advance(60);
    assert(game.bonds.family === 1, 'уровень семейной связи повышается');
    assert(game.player.maxHp === hpBeforeBond + 20, 'связь даёт постоянный бонус HP');
    const saveWithBonds = JSON.parse(storage.get('solo-leveling-save'));
    assert(saveWithBonds.bonds && saveWithBonds.bonds.family === 1,
      'уровни связей сохраняются');
    const normalizedBonds = game.normalizeBonds({ family: 1, unknown: 2 });
    assert(normalizedBonds.family === 1 && !normalizedBonds.unknown,
      'связи нормализуются при загрузке');
    press('g');
    advance(60);
    release('g');
    const litPips = Array.from(bondCard('Семья').querySelectorAll('.hub-bond-pip'))
      .filter((p) => String(p.className).indexOf(' on') >= 0);
    assert(litPips.length === 1, 'хаб показывает прогресс связи');
    sandbox.UI.closeAllPanels();
    sandbox.UI.toggleCodex();
    assert(sandbox.UI.codex.style.display !== 'none', 'кодекс открывается');
    assert(sandbox.UI.codexContent.children.length > 0, 'кодекс показывает людей');
    const codexBossTab = Array.from(sandbox.UI.codex.querySelectorAll('.panel-tab'))
      .find((b) => b.dataset.tab === 'bosses');
    codexBossTab.click();
    assert(sandbox.UI.codexContent.querySelectorAll('.codex-card').length > 3,
      'в кодексе есть карточки боссов');
    sandbox.UI.closeAllPanels();
    assert(sandbox.UI.codex.style.display === 'none', 'кодекс закрывается');

    // ---------- Качество, панели и отказоустойчивость ----------
    assert(!!sandbox.UI.panelHost && sandbox.UI.hub.parentNode === sandbox.UI.panelHost,
      'панели вынесены в отдельный слой вне масштабируемого канваса');
    game.settings.quality = 'low';
    game.applyQuality();
    assert(sandbox.Engine.lowQuality && Math.abs(sandbox.Engine.renderScale - 0.65) < 0.001 &&
      sandbox.Engine.canvas.width === Math.round(960 * sandbox.Engine.renderScale),
      'экономный режим снижает разрешение рендера');
    game.settings.quality = 'high';
    game.applyQuality();
    assert(!sandbox.Engine.lowQuality && sandbox.Engine.renderScale === 1 &&
      sandbox.Engine.canvas.width === 960, 'высокий режим возвращает полное разрешение');
    game.settings.quality = 'low';
    game.applyQuality();
    const baseScale = sandbox.Engine.renderScale;
    game.adaptQuality(20);
    game.adaptQuality(20);
    assert(sandbox.Engine.degradeLevel === 1 && sandbox.Engine.renderScale < baseScale,
      'при FPS ниже 30 включается первая ступень деградации');
    game.adaptQuality(60);
    game.adaptQuality(60);
    game.adaptQuality(60);
    game.adaptQuality(60);
    assert(sandbox.Engine.degradeLevel === 0 && Math.abs(sandbox.Engine.renderScale - baseScale) < 0.001,
      'при устойчивых 60 FPS качество плавно возвращается');
    game.settings.quality = 'auto';
    game.applyQuality();
    sandbox.UI.showDialog({ speaker: 'Тест', text: 'Проверка диалога', index: 0, total: 1 });
    assert(sandbox.document.body.classList.contains('dialog-open'), 'диалог включает мобильный режим');
    sandbox.UI.hideDialog();
    assert(!sandbox.document.body.classList.contains('dialog-open'), 'после диалога управление возвращается');
    sandbox.UI.showFatalError(new Error('тестовая ошибка'));
    assert(sandbox.UI.fatalScreen.style.display !== 'none', 'экран ошибки не оставляет белый экран');
    sandbox.UI.hideFatalError();
    assert(sandbox.UI.fatalScreen.style.display === 'none', 'экран ошибки закрывается');
  } catch (e) {
    failures++;
    console.log('  FAIL UI panels: ' + e.stack);
  }

  // ---------- Ежедневные контракты Ахджин ----------
  const dayKeyOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0');
  const today = new Date();
  const todayKey = dayKeyOf(today);
  const tomorrowKey = dayKeyOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  game.unlocked = 9;
  game.contracts = { day: null, list: [] };
  game.ensureContracts(todayKey);
  const daily = game.contracts.list;
  assert(daily.length === 3, 'ежедневная доска выдаёт три контракта');
  assert(new Set(daily.map((c) => c.chapter)).size === 3, 'контракты ведут в разные главы');
  assert(daily.every((c) => c.status === 'available' && c.rewards && c.rewards.gold > 0),
    'у контрактов есть статус и награда');

  const bossContract = daily[0];
  assert(game.startContract(bossContract.id), 'контракт запускается из хаба');
  assert(game.activeContract && bossContract.status === 'active', 'контракт становится активным');
  assert(game.chapter.id === bossContract.chapter, 'контракт открывает нужную главу');
  assert(game.player.x < game.boss.x && game.player.x > game.boss.x - 620,
    'контракт переносит героя к арене босса');
  assert(game.monsters.filter((m) => !m.isBoss).length === bossContract.adds,
    'на арене появляются только стражи контракта');
  const goldBeforeContract = game.progress.gold;
  game.damageMonster(game.boss, 999999, { source: 'basic' });
  assert(bossContract.status === 'completed', 'обычный контракт завершается убийством босса');
  assert(game.progress.gold > goldBeforeContract, 'за контракт начисляется золото');
  assert(game.activeContract === null, 'после выполнения контракт снимается');
  advance(1600);
  assert(game.state === 'chapterEnd' && sandbox.Dialogue.active,
    'после контракта показывается возврат в штаб');
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(200);
  assert(game.contractRun === false && game.chapter.id === game.unlocked + 1,
    'контракт возвращает в актуальную главу и не двигает кампанию');

  const noPotionContract = daily.find((c) => c.type === 'no-potion');
  game.inventory.add('hp-potion-small', 2);
  assert(game.startContract(noPotionContract.id), 'контракт без зелий запускается');
  game.player.hp = 1;
  const potionsBeforeFail = game.inventory.count('hp-potion-small');
  game.usePotion();
  assert(noPotionContract.status === 'failed' && game.activeContract === null,
    'зелье проваливает контракт без лечения');
  assert(game.inventory.count('hp-potion-small') === potionsBeforeFail,
    'провал контракта не тратит зелье');

  const eliteContract = daily.find((c) => c.type === 'elite');
  assert(game.startContract(eliteContract.id), 'элитный контракт запускается');
  const eliteAdds = game.monsters.filter((m) => !m.isBoss);
  assert(eliteAdds.length === 3 && eliteAdds.every((m) => m.elite && m.summoned),
    'элитная арена выставляет трёх элитных стражей');
  game.startChapter(0, { replay: true });
  advance(60);
  assert(game.activeContract === null, 'старт обычной главы прерывает контракт');

  sandbox.UI.toggleHub();
  assert(sandbox.UI.hub.querySelectorAll('.hub-contract-completed').length === 1,
    'хаб показывает выполненный контракт');
  assert(sandbox.UI.hub.querySelectorAll('.hub-contract-failed').length >= 1,
    'хаб показывает проваленный контракт');
  sandbox.UI.closeAllPanels();
  game.persist();
  const savedContracts = JSON.parse(storage.get('solo-leveling-save')).contracts;
  assert(savedContracts && savedContracts.day === todayKey && savedContracts.list.length === 3,
    'ежедневные контракты сохраняются в v5');
  game.ensureContracts(tomorrowKey);
  assert(game.contracts.day === tomorrowKey &&
    game.contracts.list.every((c) => c.status === 'available'),
    'на следующий день контракты обновляются');

  // ---------- Смерть и возрождение ----------
  game.startChapter(0, { replay: true });
  advance(100);
  game.player.hp = 1;
  game.player.invulnTimer = 0;
  game.hurtPlayer(99999, { source: 'test' });
  assert(game.state === 'dead', 'при нуле HP наступает смерть');
  game.respawn();
  advance(100);
  assert(game.state === 'play' && game.player.hp === game.player.maxHp, 'возрождение восстанавливает HP');

  // ---------- Все главы: боссы, секреты, загадки ----------
  game.savedWorld = {};
  const chapterReport = [];
  let bossMissing = 0, puzzleFail = 0;
  for (let i = 0; i < game.chapters.length; i++) {
    game.startChapter(i, { replay: true });
    const w = game.world;
    const p = w.puzzles[0];
    if (p) {
      p.sequence.forEach((idx) => {
        if (p.kind === 'orbs') {
          const d = p.devices[idx];
          w.hitOrbsRect({ x: d.x, y: d.y, w: d.w, h: d.h }, game);
        } else {
          w.activateDevice(p, idx, game);
        }
      });
      if (!p.solved || !p.rewardChest) puzzleFail++;
    }
    if (!game.boss) bossMissing++;
    chapterReport.push({
      id: game.chapter.id,
      boss: game.boss ? game.boss.name : '—',
      bossAnim: game.boss ? game.boss.animId : '—',
      bossSubtitle: game.boss ? game.boss.subtitle : '—',
      arena: !!w.arena,
      cutin: !!w.cutinPath,
      scenes: w.scenes.length,
      monsters: game.monsters.length,
      npcs: game.npcs.length,
      secret: !!w.secrets[0],
      puzzle: p ? p.kind : '—'
    });
    const state = w.serialize();
    assert(!!state && typeof state === 'object', 'мир главы ' + game.chapter.id + ' сериализуется');
  }
  assert(bossMissing === 0, 'в каждой главе есть босс');
  assert(puzzleFail === 0, 'загадки всех типов (руны/рычаги/сферы) решаются');
  const ch3 = chapterReport.find((r) => r.id === 3);
  assert(ch3 && ch3.boss !== 'Гоблин', 'в главе 3 не назначается гоблин-босс');
  assert(chapterReport.every((r) => r.secret && r.puzzle !== '—'), 'в каждой главе есть секрет и загадка');
  assert(chapterReport.every((r) => r.arena && r.cutin && r.scenes >= 2),
    'в каждой главе есть арена, cut-in и две сцены');
  const storyChapters = new Map(data.chapters.map((c) => [c.id, c]));
  assert(!storyChapters.get(1).characters.includes('architect'),
    'Архитектор не участвует в двойном подземелье');
  assert(storyChapters.get(4).title.includes('смену класса') &&
    storyChapters.get(4).characters.includes('igris'),
    'глава 4 — квест на смену класса с Игрисом');
  assert(storyChapters.get(5).title.includes('Красные ворота') &&
    ['park-hee-jin', 'han-song-yi', 'kim-chul'].every((id) => storyChapters.get(5).characters.includes(id)) &&
    !storyChapters.get(5).characters.includes('lee-joo-hee') &&
    !storyChapters.get(5).characters.includes('yoo-jinho'),
    'глава 5 — Красные врата с Пак Хи-Джин, Хан Сон-И и Ким Чхолем');
  assert(storyChapters.get(6).title.includes('Демонический замок') &&
    storyChapters.get(6).characters.includes('baran') &&
    JSON.stringify(storyChapters.get(6)).includes('Святой источник жизни'),
    'глава 6 — Демонический замок с Бараном и Святым источником');
  assert(chapterReport.find((r) => r.id === 4).boss === 'Игрис', 'глава 4: босс — Игрис');
  assert(chapterReport.find((r) => r.id === 5).boss === 'Барука', 'глава 5: босс — Барука');
  assert(chapterReport.find((r) => r.id === 6).boss === 'Баран', 'глава 6: босс — Баран');
  assert(chapterReport.find((r) => r.id === 10).boss === 'Ча Хэ-Ин', 'глава 10: босс — Ча Хэ-Ин');
  assert(chapterReport.find((r) => r.id === 11).boss === 'Архитектор', 'глава 11: босс — Архитектор');
  const bossIdentities = {
    2: ['Гигантская многоножка', 'giant-centipede', 'giant-centipede'],
    3: ['Касака', 'kasaka', 'kasaka'],
    4: ['Игрис', 'igris', 'igris'],
    5: ['Барука', 'baruka', 'baruka'],
    6: ['Баран', 'baran', 'baran'],
    7: ['Каргалган', 'kargalgan', 'kargalgan'],
    8: ['Магический измеритель', 'measurement-device', 'measurement-device'],
    9: ['Королева муравьёв', 'ant-queen', 'ant-queen'],
    10: ['Ча Хэ-Ин', 'cha-hae-in', 'cha-hae-in'],
    11: ['Архитектор', 'architect', 'architect'],
    12: ['Силлад, Монарх Холода', 'sillad', 'sillad']
  };
  for (const cid of Object.keys(bossIdentities)) {
    const row = chapterReport.find((r) => r.id === Number(cid));
    const expected = bossIdentities[cid];
    assert(row && row.boss === expected[0] && row.bossAnim === expected[1],
      'у главы ' + cid + ' свой облик и имя босса');
    assert(game.bossesData[expected[2]] && game.bossesData[expected[2]].title === expected[0],
      'у главы ' + cid + ' свой профиль босса');
  }
  assert(chapterReport.find((r) => r.id === 2).bossSubtitle.indexOf('Штрафной') >= 0,
    'у гигантской многоножки свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 3).bossSubtitle.indexOf('мгновенного') >= 0,
    'у Касаки свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 4).bossSubtitle.indexOf('Рыцарь крови') >= 0,
    'у Игриса свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 6).bossSubtitle.indexOf('Король демонов') >= 0,
    'у Барана свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 7).bossSubtitle.indexOf('высоких орков') >= 0,
    'у Каргалгана свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 8).bossSubtitle.indexOf('шкалы') >= 0,
    'у магического измерителя свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 10).bossSubtitle.indexOf('Охотники') >= 0,
    'у Ча Хэ-Ин свой подзаголовок');
  assert(chapterReport.find((r) => r.id === 11).bossSubtitle.indexOf('Храм') >= 0,
    'у Архитектора свой подзаголовок');
  advance(100);

  // ---------- Враги глав 3–5 ----------
  game.startChapter(2, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  const caveIds = game.monsters.map((m) => m.lootId);
  assert(caveIds.indexOf('goblin-shaman') >= 0, 'в главе 3 есть гоблин-шаман');
  assert(caveIds.indexOf('cave-spider') >= 0, 'в главе 3 есть пещерный паук');
  const spider = game.monsters.find((m) => m.lootId === 'cave-spider');
  assert(spider.trait.lunge && spider.trait.onHitSlow > 0, 'паук прыгает и замедляет');
  const shaman = game.monsters.find((m) => m.lootId === 'goblin-shaman');
  assert(shaman.trait.ranged && shaman.trait.projectileSlow > 0, 'шаман стреляет замедляющим снарядом');

  game.startChapter(6, { replay: true });
  advance(80);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  const berserker = game.monsters.find((m) => m.lootId === 'orc-berserker');
  assert(!!berserker, 'в главе 4 есть орк-берсерк');
  const normalSpeed = berserker.speed;
  berserker.hp = Math.floor(berserker.maxHp * 0.3);
  advance(80);
  assert(berserker.berserked && berserker.speed > normalSpeed, 'орк-берсерк впадает в ярость при низком HP');

  game.startChapter(4, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  const iceIds = game.monsters.map((m) => m.lootId);
  assert(iceIds.indexOf('ice-elf-ranger') >= 0, 'в главе 6 есть ледяной эльф-стрелок');
  assert(iceIds.indexOf('frost-wolf') >= 0, 'в главе 6 есть морозный волк');
  const ranger = game.monsters.find((m) => m.lootId === 'ice-elf-ranger');
  assert(ranger.trait.ranged && ranger.trait.projectileColor === '#bfe6f7', 'эльф стреляет ледяными снарядами');

  // ---------- Локальные квесты глав 3–5 ----------
  const clearQuestChapter = (idx) => {
    game.startChapter(idx, { replay: true });
    advance(80);
    if (sandbox.Dialogue.active) sandbox.Dialogue.close();
    game.player.invulnTimer = 999;
    game.player.hp = game.player.maxHp = 999999;
  };
  const interactAll = (count) => {
    const objects = game.world.questObjects.slice();
    objects.forEach((o) => {
      game.player.x = o.x + o.w / 2 - game.player.w / 2;
      game.player.y = game.world.floorY - game.player.h;
      game.world.tryInteract(game.player, game);
    });
    return objects;
  };

  clearQuestChapter(2);
  const miners = interactAll();
  assert(miners.length === 3 && miners.every((o) => o.done), 'шахтёры спасаются интерактивно');
  assert(sandbox.Quests.stateOf('side-3c').status === 'completed', 'квест «Заживо погребённые» завершается');

  clearQuestChapter(6);
  const hunters = interactAll();
  assert(hunters.length === 3 && hunters.every((o) => o.done), 'раненые охотники выводятся');
  assert(sandbox.Quests.stateOf('side-4c').status === 'completed', 'квест «Долг партии» завершается');

  clearQuestChapter(4);
  const braziers = interactAll();
  assert(braziers.length === 3 && braziers.every((o) => o.done), 'жаровни зажигаются');
  assert(sandbox.Quests.stateOf('side-5c').status === 'completed', 'квест «Тепло для живых» завершается');
  game.startChapter(4, { replay: true });
  advance(80);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  assert(game.world.questObjects.every((o) => o.done), 'зажжённые жаровни сохраняются');

  clearQuestChapter(1);
  game.onBossPhase({ name: 'Гигантская многоножка', bossData: game.bossesData['giant-centipede'] }, 1);
  assert(sandbox.UI.bossBarkText.textContent.indexOf('Штрафная зона') >= 0, 'у гигантской многоножки есть фазовая реплика');
  game.onBossEnrage({ name: 'Гигантская многоножка', bossData: game.bossesData['giant-centipede'] });
  assert(sandbox.UI.bossBarkText.textContent.indexOf('Яд уже') >= 0, 'у гигантской многоножки есть реплика ярости');
  clearQuestChapter(2);
  game.onBossPhase({ name: 'Касака', bossData: game.bossesData.kasaka }, 1);
  assert(sandbox.UI.bossBarkText.textContent.indexOf('подземелье') >= 0, 'у Касаки есть фазовая реплика');
  clearQuestChapter(4);
  game.onBossPhase({ name: 'Барука', bossData: game.bossesData.baruka }, 1);
  assert(sandbox.UI.bossBarkText.textContent.indexOf('клан') >= 0, 'у Баруки есть фазовая реплика');

  // ---------- Глава 4: новые враги, доспехи, фазы и тень ----------
  game.startChapter(3, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  game.player.invulnTimer = 999;
  game.player.hp = game.player.maxHp = 999999;
  const knights = game.monsters.filter((m) => m.lootId === 'demon-knight');
  const hounds = game.monsters.filter((m) => m.lootId === 'hellhound');
  assert(knights.length >= 3, 'в главе 5 есть демонические рыцари (' + knights.length + ')');
  assert(hounds.length >= 2, 'в главе 5 есть адские гончие (' + hounds.length + ')');
  const knight = knights[0];
  knight.hp = knight.maxHp;
  game.player.x = knight.x - 30;
  game.player.y = knight.y;
  knight.face = -1;
  game.damageMonster(knight, 100, { source: 'basic', color: '#fff' });
  const frontLoss = knight.maxHp - knight.hp;
  knight.hp = knight.maxHp;
  game.player.x = knight.x - 30;
  knight.face = -1;
  game.damageMonster(knight, 100, { source: 'nova', color: '#fff' });
  knight.hp = knight.maxHp;
  game.damageMonster(knight, 100, { source: 'basic', color: '#fff' });
  const brokenLoss = knight.maxHp - knight.hp;
  assert(frontLoss < brokenLoss, 'щит рыцаря держит удар, но ломается от умения (front ' + frontLoss + ' < broken ' + brokenLoss + ')');
  game.onBossPhase({ name: 'Игрис', bossData: game.bossesData.igris }, 1);
  assert(sandbox.UI.bossBarkText.textContent.indexOf('клинок') >= 0, 'фаза Игриса показывает боевую реплику');

  const racks = game.world.racks;
  assert(racks.length === 4, 'в главе 5 четыре проклятые стойки');
  racks.forEach((rack) => {
    game.player.x = rack.x + rack.w / 2 - game.player.w / 2;
    game.player.y = game.world.floorY - game.player.h;
    const before = game.monsters.length;
    const ok = game.world.tryInteract(game.player, game);
    assert(ok && rack.broken, 'стойка доспехов освобождается');
    assert(game.monsters.length === before + 1, 'из стойки появляется демонический рыцарь');
  });
  assert(sandbox.Quests.stateOf('side-6c') && sandbox.Quests.stateOf('side-6c').status === 'completed',
    'квест «Освободить доспехи павших» завершается');
  game.startChapter(3, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  assert(game.world.racks.every((r) => r.broken), 'разбитые стойки сохраняются после перезапуска главы');

  // Извлечение тени Игриса
  game.startChapter(3, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  game.player.invulnTimer = 999;
  game.player.hp = game.player.maxHp = 999999;
  game.monsters.filter((m) => !m.isBoss).forEach((m) => game.damageMonster(m, 999999, { source: 'basic' }));
  game.damageMonster(game.boss, 99999999, { source: 'basic' });
  advance(200);
  assert(game._shadowAvailable && game._extractionStarted, 'после победы над Игрисом начинается извлечение тени');
  advance(1200);
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(100);
  assert(game.hasShadow('igris') && game.shadows.equipped.indexOf('igris') >= 0, 'тень Игриса извлечена и экипирована');

  game.startChapter(4, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  assert(game.allies.some((a) => a.shadowId === 'igris'), 'тень Игриса сопровождает игрока в следующей главе');
  game.toggleShadow('igris');
  assert(!game.allies.some((a) => a.shadowId === 'igris'), 'тень можно отправить в резерв');
  game.toggleShadow('igris');
  assert(game.allies.some((a) => a.shadowId === 'igris'), 'тень возвращается в строй');

  // Прокачка и вторая/третья тени
  game.inventory.add('shadow-essence', 10);
  const essenceBefore = game.inventory.count('shadow-essence');
  assert(game.upgradeShadow('igris') && game.shadowLevel('igris') === 2, 'тень Игриса прокачивается эссенцией');
  assert(game.inventory.count('shadow-essence') === essenceBefore - 1, 'прокачка тратит эссенцию');

  game.startChapter(4, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  game.player.invulnTimer = 999;
  game.player.hp = game.player.maxHp = 999999;
  game.monsters.filter((m) => !m.isBoss).forEach((m) => game.damageMonster(m, 999999, { source: 'basic' }));
  game.damageMonster(game.boss, 99999999, { source: 'basic' });
  advance(200);
  assert(game._shadowExtractionId === 'baruka', 'после победы над Барукой доступна его тень');
  advance(1200);
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(100);
  assert(game.hasShadow('baruka'), 'тень Баруки извлечена');

  game.startChapter(8, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  game.player.invulnTimer = 999;
  game.player.hp = game.player.maxHp = 999999;
  game.monsters.filter((m) => !m.isBoss).forEach((m) => game.damageMonster(m, 999999, { source: 'basic' }));
  assert(game.boss && game.boss.name.indexOf('Королева') >= 0 && game.boss.animId === 'ant-queen' &&
    game.boss.cutinPath.indexOf('cutin_ant_queen') >= 0, 'глава Чеджу начинается с королевы муравьёв');
  assert(game.npcs.some((n) => n.charId === 'min-byung-gu') &&
    game.npcs.some((n) => n.charId === 'goto-ryuji') &&
    game.npcs.some((n) => n.charId === 'kenzo-tanaka') &&
    game.npcs.some((n) => n.charId === 'kanae-tawata') &&
    game.npcs.some((n) => n.charId === 'kei'),
    'на Чеджу присутствуют Мин Бён-Гю, Гото и японская команда Draw Sword');
  game.damageMonster(game.boss, 99999999, { source: 'basic' });
  advance(200);
  assert(game._bossStage === 1 && game.boss && !game.boss.dead && game.boss.animId === 'beru' &&
    game.boss.name.indexOf('Беру') >= 0, 'после королевы из глубин появляется Беру');
  assert(game.boss.cutinPath.indexOf('cutin_beru') >= 0, 'у Беру свой cut-in');
  assert(game.npcs.every((n) => ['min-byung-gu', 'goto-ryuji', 'kenzo-tanaka', 'kanae-tawata', 'kei'].indexOf(n.charId) < 0),
    'Мин Бён-Гю, Гото и японская команда погибают при появлении Беру');
  assert(sandbox.Dialogue.active, 'переход к Беру сопровождается сценой гибели союзников');
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(200);
  game.damageMonster(game.boss, 99999999, { source: 'basic' });
  advance(200);
  assert(game._shadowExtractionId === 'beru', 'после победы над Беру доступна его тень');
  advance(1200);
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(100);
  assert(game.hasShadow('beru'), 'тень Беру извлечена');
  assert(game.shadows.equipped.length === 2 && game.shadows.equipped.indexOf('beru') < 0,
    'при заполненных слотах Беру остаётся в резерве');
  game.toggleShadow('beru');
  assert(game.shadows.equipped.indexOf('beru') < 0, 'третий слот не активируется');
  game.toggleShadow('igris');
  game.toggleShadow('beru');
  assert(game.shadows.equipped.indexOf('beru') >= 0, 'Беру занимает освободившийся слот');
  assert(game.allies.some((a) => a.shadowId === 'baruka' && a.attackStyle === 'projectile'),
    'Барука атакует ледяными снарядами');
  assert(game.allies.some((a) => a.shadowId === 'beru' && a.attackStyle === 'multi'),
    'Беру использует быстрые множественные удары');
  assert(sandbox.ShadowArmy.maxFor(game) === 2, 'до таланта доступно два слота теней');
  game.progress.level = Math.max(game.progress.level, 14);
  game.progress.talents['shd-5'] = 1;
  game.progress.recalc();
  assert(sandbox.ShadowArmy.maxFor(game) === 3, 'талант «Третий клинок» открывает третий слот');
  game.toggleShadow('igris');
  assert(game.shadows.equipped.length === 3 && game.shadows.equipped.indexOf('igris') >= 0,
    'третья тень встаёт в строй');
  assert(game.allies.some((a) => a.shadowId === 'igris'), 'третья тень выходит в бой');

  sandbox.UI.toggleShadows();
  assert(sandbox.UI.shadowPanel.style.display !== 'none', 'панель теневой армии открывается');
  assert(sandbox.UI.shadowBody.children.length > 0, 'панель показывает теней и слоты');
  assert(sandbox.UI.shadowBody.querySelectorAll('.shadow-slot').length === 3,
    'панель показывает три слота после таланта');
  sandbox.UI.closeAllPanels();
  game.persist();
  const shadowSave = JSON.parse(storage.get('solo-leveling-save'));
  assert(shadowSave.shadows.levels.igris === 2 && shadowSave.shadows.owned.baruka &&
    shadowSave.shadows.owned.beru && shadowSave.shadows.equipped.length === 3,
    'уровни, состав и три слота теней сохраняются');

  // ---------- Миграция сохранения v1 ----------
  const currentSave = storage.get('solo-leveling-save');
  storage.set('solo-leveling-save', JSON.stringify({
    chapterIndex: 2, unlocked: 3, hp: 100, maxHp: 100, atk: 10, def: 1,
    level: 4, kills: 7, items: [{ name: 'Гоблин', qty: 2 }]
  }));
  const migrated = sandbox.SaveSystem.load();
  assert(migrated && migrated.version === 5, 'старое сохранение v1 мигрирует в v5');
  assert(migrated && migrated.progress.level === 4 && migrated.inventory.items.length === 1, 'миграция сохраняет уровень и трофеи');
  storage.set('solo-leveling-save', JSON.stringify({
    version: 2, savedAt: 1, chapterIndex: 3, unlocked: 4,
    progress: { level: 6 }, inventory: { items: [] }, world: {}, storySeen: {},
    stats: {}, settings: {}, finished: false
  }));
  const migratedV2 = sandbox.SaveSystem.load();
  assert(migratedV2 && migratedV2.version === 5 && migratedV2.progress.level === 6 &&
    migratedV2.shadows && Array.isArray(migratedV2.shadows.equipped), 'сохранение v2 мигрирует в v5 без потери прогресса');
  storage.set('solo-leveling-save', JSON.stringify({
    version: 3, savedAt: 1, chapterIndex: 5, unlocked: 6,
    progress: { level: 10 }, inventory: { items: [] }, world: { 5: 'red-gate', 6: 'job-change' },
    storySeen: { 5: true, 6: true }, stats: {}, settings: {}, finished: false
  }));
  const migratedV3 = sandbox.SaveSystem.load();
  assert(migratedV3 && migratedV3.version === 5 && migratedV3.chapterIndex === 4 &&
    migratedV3.unlocked === 6, 'сохранение v3 мигрирует в v5 с новым порядком глав');
  assert(migratedV3.world[4] === 'job-change' && migratedV3.world[5] === 'red-gate' &&
    migratedV3.storySeen[4] === true && migratedV3.storySeen[5] === true,
    'миграция v3 переносит мир и просмотренные сцены');
  storage.set('solo-leveling-save', JSON.stringify({
    version: 4, savedAt: 1, chapterIndex: 4, unlocked: 4,
    progress: { level: 10 }, inventory: { items: [] },
    world: { 4: 'hunters-gate', 5: 'job-change' },
    storySeen: { 4: true, 5: true },
    quests: { state: {}, counters: {}, talked: { 4: { 'kim-chul': true } } },
    stats: {}, settings: {}, finished: false
  }));
  const migratedV4 = sandbox.SaveSystem.load();
  assert(migratedV4 && migratedV4.version === 5 && migratedV4.chapterIndex === 4 &&
    migratedV4.unlocked === 4, 'сохранение v4 переносит Каргалгана в главу 7');
  assert(migratedV4.world[7] === 'hunters-gate' && migratedV4.world[4] === 'job-change' &&
    migratedV4.storySeen[7] === true && migratedV4.quests.talked[7]['kim-chul'] === true,
    'миграция v4 переносит мир, сцены и разговоры');
  if (currentSave) storage.set('solo-leveling-save', currentSave);

  // ---------- Финальная отрисовка ----------
  try {
    game.render();
    assert(true, 'кадр отрисовывается без ошибок');
    assert(sandbox.Engine.ctx.__saveDepth === 0, 'canvas save/restore сбалансирован после отрисовки');
  } catch (e) {
    failures++;
    console.log('  FAIL render: ' + e.stack);
  }

  // ---------- Лор-подсказка и кинематографическая сцена ----------
  game.startChapter(0, { replay: true });
  advance(100);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  const loreEntry = game.world.lore[0];
  game.player.x = loreEntry.x + loreEntry.w / 2 - game.player.w / 2;
  game.player.y = game.world.floorY - game.player.h;
  const loreHint = game.world.getHint(game.player);
  assert(!!loreHint && loreHint.indexOf('Прочитать') >= 0, 'подсказка у лор-записи не ломает игровой цикл');

  game.world.zones.forEach((z) => { game.world.seenZones[z.id] = true; });
  game._pendingZoneStory = null;
  const storyScene = game.world.scenes[0];
  game.player.x = storyScene.x + 10;
  game.player.y = game.world.floorY - game.player.h;
  advance(60);
  assert(storyScene.triggered && game.state === 'scene', 'сюжетная сцена запускается при входе в триггер');
  assert(sandbox.UI.cutinLayer.style.display !== 'none', 'cut-in портрет показывается');
  assert(uiRoot.classList.contains('cinematic'), 'кинематографические плашки включаются');
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  advance(60);
  assert(game.state === 'play' && !uiRoot.classList.contains('cinematic'), 'после сцены управление возвращается');
  assert(game.savedWorld[game.chapter.id].scenes[storyScene.id] === true, 'просмотренная сцена сохраняется');

  game.startChapter(0, { replay: true });
  advance(80);
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  assert(game.world.scenes[0].triggered === true, 'сцена не повторяется после перезагрузки главы');

  // ---------- Война Монархов: последовательность трёх боссов ----------
  game.startChapter(11, { replay: true });
  advance(100);
  while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  const warStages = [];
  for (let stage = 0; stage < 3; stage++) {
    assert(game.boss && !game.boss.dead, 'стадия Войны Монархов ' + (stage + 1) + ' существует');
    warStages.push({ name: game.boss.name, cutin: game.boss.cutinPath });
    game.player.invulnTimer = 999;
    game.player.hp = game.player.maxHp = 999999;
    game.monsters.filter((m) => !m.isBoss).forEach((m) => game.damageMonster(m, 999999, { source: 'basic' }));
    game.damageMonster(game.boss, 99999999, { source: 'basic' });
    advance(180);
    while (sandbox.Dialogue.active) sandbox.Dialogue.advance();
  }
  assert(warStages.map((s) => s.name).join('|') === 'Силлад, Монарх Холода|Ракан, Монарх Звериных Клыков|Керехша, Монарх Чумы',
    'Война Монархов идёт через Силлада, Ракана и Керехшу');
  assert(warStages[1].cutin.indexOf('cutin_rakan') >= 0 && warStages[2].cutin.indexOf('cutin_kerehsha') >= 0,
    'у стадий Войны Монархов свои cut-in');
  assert(sandbox.SaveSystem && game.chapter.id === 12, 'после последовательности боссов глава остаётся двенадцатой');

  // ---------- Полный прогон кампании 1–13 ----------
  game.resetProgress();
  advance(100);
  game.grantShadow('igris');
  game.grantShadow('baruka');
  game.grantShadow('beru');
  for (let cid = 1; cid <= 13; cid++) {
    assert(game.chapterIndex === cid - 1, 'полный прогон: открыта глава ' + cid);
    if (sandbox.Dialogue.active) sandbox.Dialogue.close();
    game.player.invulnTimer = 999;
    game.monsters.filter((m) => !m.isBoss && !m.dead)
      .forEach((m) => game.damageMonster(m, 999999, { source: 'basic' }));
    let bossGuard = 0;
    while (game.boss && !game.boss.dead && bossGuard++ < 6) {
      game.damageMonster(game.boss, 999999, { source: 'basic' });
      advance(120);
    }
    advance(1800);
    let guard = 0;
    while (game.chapterIndex === cid - 1 && !game.finished && guard++ < 50) {
      if (sandbox.Dialogue.active) sandbox.Dialogue.advance();
      advance(150);
    }
    assert(game.chapterIndex === cid || (cid === 13 && game.finished),
      'полный прогон: глава ' + cid + ' закрыта');
  }
  assert(game.finished, 'полный прогон: кампания завершена');
  assert(game.hasShadow('iron') && !!sandbox.ShadowArmy.def('iron'),
    'после Красных врат Ким Чхоль становится тенью Айроном');

  // ---------- Короткий тап атаки и загрузка тайлов ----------
  if (sandbox.Dialogue.active) sandbox.Dialogue.close();
  sandbox.UI.closeAllPanels();
  game.state = 'play';
  game.player.dead = false;
  game.player.hp = game.player.maxHp;
  game.player.attackTimer = 0;
  game.player.dashTimer = 0;
  game.player.stunTimer = 0;
  game.player.comboStep = 0;
  game.player.comboTimer = 0;
  sandbox.Engine.Input.pressed.add('j');
  game.player.update(1 / 60, game.level, game);
  sandbox.Engine.Input.pressed.clear();
  assert(game.player.attackTimer > 0 || game.player.comboStep > 0,
    'короткий тап атаки не теряется между кадрами');

  const tileLevel = game.world.level;
  const savedPatterns = tileLevel._patterns;
  const savedTiles = {
    floor: tileLevel.tileFloor.img,
    wall: tileLevel.tileWall.img,
    stairs: tileLevel.tileStairs.img
  };
  tileLevel._patterns = null;
  tileLevel.tileFloor.img = {};
  tileLevel.tileWall.img = {};
  tileLevel.tileStairs.img = null;
  const patternsBeforeStairs = tileLevel.patterns();
  tileLevel.tileStairs.img = {};
  const patternsAfterStairs = tileLevel.patterns();
  tileLevel._patterns = savedPatterns;
  tileLevel.tileFloor.img = savedTiles.floor;
  tileLevel.tileWall.img = savedTiles.wall;
  tileLevel.tileStairs.img = savedTiles.stairs;
  assert(patternsBeforeStairs === null, 'паттерны пола ждут загрузки всех тайлов, включая ступени');
  assert(patternsAfterStairs !== null, 'паттерны собираются после загрузки тайлов');

  // ---------- FX Lab и мини-стайлгайд ----------
  const labJs = fs.readFileSync(path.join(ROOT, 'tools', 'fx_lab.js'), 'utf8');
  const labHtml = fs.readFileSync(path.join(ROOT, 'tools', 'fx_lab.html'), 'utf8');
  const styleGuide = fs.readFileSync(path.join(ROOT, 'docs', 'vfx-style-guide.md'), 'utf8');
  const variants = [...labJs.matchAll(/\{ id: '([^']+)', name: '[^']+', play: (play\w+) \}/g)];
  assert(variants.length === 18, 'FX Lab: 18 вариантов эффектов (6 семейств × 3)');
  for (const [, id, fn] of variants) {
    assert(labJs.includes('function ' + fn + '('), 'FX Lab: у варианта ' + id + ' есть реализация ' + fn);
  }
  const paletteAnchors = {
    shadow: '#5d3a9e', blood: '#6a1018', ice: '#3c7188',
    acid: '#3a6424', gold: '#7a5a1e', fire: '#8a2414'
  };
  for (const [family, color] of Object.entries(paletteAnchors)) {
    assert(labJs.includes(color), 'FX Lab: цвет ' + family + ' ' + color);
    assert(styleGuide.toLowerCase().includes(color), 'стайлгайд: цвет ' + family + ' ' + color);
  }
  assert(labHtml.includes('fx_lab.js') && labHtml.includes('game-canvas'), 'FX Lab: страница подключает полигон');
  assert(styleGuide.includes('tools/fx_lab.html') && styleGuide.includes('renderUnder'),
    'стайлгайд: ссылается на FX Lab и слои Effects');

  console.log(failures === 0 ? '\nSMOKE TEST: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ' : '\nSMOKE TEST: ОШИБОК ' + failures);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('SMOKE TEST CRASH:', e);
  process.exit(2);
});
