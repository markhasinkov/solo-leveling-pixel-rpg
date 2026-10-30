// main.js — сборка игры: данные, главы, актёры, боссы, квесты, сохранения, цикл.
(function () {
  'use strict';

  const F = window.Formulas;

  // ---------- Фолбэки, если JSON недоступен (например, file://) ----------
  const FALLBACK_CHAPTERS = [
    {
      id: 1, title: 'Глава 1. Двойное подземелье', location: 'double-dungeon',
      characters: ['sung-jin-woo', 'song-chi-yul', 'lee-joo-hee', 'statue-of-god'],
      dialogues: [
        { speaker: 'song-chi-yul', text: 'Джин-Ву, за этой дверью — двойное подземелье. Нам не справиться без тебя.' },
        { speaker: 'lee-joo-hee', text: 'Я поддержу вас лечением... Пожалуйста, будьте осторожны!' },
        { speaker: 'sung-jin-woo', text: 'Я пойду первым. Если что-то пойдёт не так — бегите.' },
        { speaker: 'Голос храма', text: 'Скрытая комната открыта. Добро пожаловать в Храм Картенон.' },
        { speaker: 'statue-of-god', text: '...Система активирована. Кандидат принят.' }
      ],
      quest: 'Выжить в Храме Картенон и стать Игроком Системы.'
    },
    {
      id: 2, title: 'Глава 2. Пробуждение в больнице', location: 'hospital',
      characters: ['sung-jin-woo', 'lee-joo-hee', 'ahn-sang-min', 'woo-jin-chul'],
      dialogues: [
        { speaker: 'ahn-sang-min', text: 'Доброе утро, Джин-Ву-сси. Врачи удивлены — травмы заживают быстрее нормы.' },
        { speaker: 'woo-jin-chul', text: 'Вы единственный выживший из партии. Нам понадобится ваше заявление.' },
        { speaker: 'lee-joo-hee', text: 'Я так боялась, что ты не очнёшься. Спасибо, что спас нас тогда.' }
      ],
      quest: 'Принять Систему и начать тренировки.'
    }
  ];
  const FALLBACK_CHARACTERS = [
    { id: 'sung-jin-woo', name: 'Сон Джин-Ву', role: 'Охотник E-ранга', sprite: 'assets/sprites/sung-jin-woo.png', stats: { hp: 850, atk: 120, def: 70 } },
    { id: 'song-chi-yul', name: 'Сон Чи-Ёль', role: 'Охотник C-ранга', sprite: 'assets/sprites/song-chi-yul.png', stats: { hp: 300, atk: 45, def: 30 } },
    { id: 'lee-joo-hee', name: 'Ли Джу-Хи', role: 'Целительница B-ранга', sprite: 'assets/sprites/lee-joo-hee.png', stats: { hp: 260, atk: 20, def: 20 } },
    { id: 'ahn-sang-min', name: 'Ан Сан Мин', role: 'Сотрудник Ассоциации', sprite: 'assets/sprites/ahn-sang-min.png', stats: { hp: 220, atk: 25, def: 18 } },
    { id: 'woo-jin-chul', name: 'У Джин-Чоль', role: 'Ассоциация охотников', sprite: 'assets/sprites/woo-jin-chul.png', stats: { hp: 340, atk: 50, def: 35 } },
    { id: 'architect', name: 'Архитектор', role: 'Создатель Системы', sprite: 'assets/sprites/architect.png', stats: { hp: 900, atk: 135, def: 75 } },
    { id: 'goblin', name: 'Гоблин', role: 'Монстр E-рангового подземелья', sprite: 'assets/sprites/goblin.png', stats: { hp: 60, atk: 18, def: 5 } },
    { id: 'statue-of-god', name: 'Статуя Бога', role: 'Босс храма Картенона', sprite: 'assets/sprites/statue-of-god.png', stats: { hp: 1200, atk: 150, def: 90 } }
  ];
  const FALLBACK_SKILLS = [
    {
      id: 'shadow-slash', name: 'Теневой разрез', desc: 'Три дымные дуги тьмы по врагам перед собой.',
      icon: 'assets/sprites/icons/skill-shadow-slash.png', type: 'melee', key: '1', mp: 12, cooldown: 4,
      damage: 1.7, range: 112, arc: 1.7, color: '#a06cff', unlock: { level: 1 }
    },
    {
      id: 'dagger-throw', name: 'Кинжалы тени', desc: 'Теневой кинжал с багровым следом пробивает врагов.',
      icon: 'assets/sprites/icons/skill-dagger-throw.png', type: 'projectile', key: '2', mp: 10, cooldown: 3,
      damage: 1.35, speed: 760, pierce: 3, color: '#7ad7ff', unlock: { level: 2 }
    }
  ];
  const FALLBACK_TALENTS = {
    branches: [
      { id: 'strength', name: 'Сила', color: '#e8674a', desc: 'Урон.' },
      { id: 'agility', name: 'Ловкость', color: '#4ad8c8', desc: 'Скорость.' },
      { id: 'endurance', name: 'Стойкость', color: '#e8c76a', desc: 'Здоровье.' },
      { id: 'shadow', name: 'Тень', color: '#a06cff', desc: 'Мана.' }
    ],
    nodes: [
      { id: 'str-1', branch: 'strength', name: 'Тяжёлая рука', desc: '+6% урона за ранг', maxRank: 5, cost: 1, levelReq: 1, x: 0, y: 0, effect: { damagePct: 0.06 } },
      { id: 'agi-1', branch: 'agility', name: 'Лёгкий шаг', desc: '+7% скорости', maxRank: 3, cost: 1, levelReq: 1, x: 1, y: 0, effect: { speedPct: 0.07 } },
      { id: 'end-1', branch: 'endurance', name: 'Крепкое тело', desc: '+7% HP', maxRank: 5, cost: 1, levelReq: 1, x: 2, y: 0, effect: { maxHpPct: 0.07 } },
      { id: 'shd-1', branch: 'shadow', name: 'Резерв тьмы', desc: '+8% маны', maxRank: 4, cost: 1, levelReq: 1, x: 3, y: 0, effect: { maxMpPct: 0.08 } }
    ]
  };
  const FALLBACK_LOOT = {
    items: [
      { id: 'hp-potion-small', name: 'Малое зелье лечения', type: 'consumable', rarity: 'common', icon: 'assets/sprites/icons/item-hp-potion-small.png', price: 25, value: 10, desc: 'Восстанавливает 150 HP.', use: { heal: 150 } },
      { id: 'mp-potion', name: 'Зелье маны', type: 'consumable', rarity: 'uncommon', icon: 'assets/sprites/icons/item-mp-potion.png', price: 55, value: 22, desc: 'Восстанавливает 60 маны.', use: { mana: 60 } },
      { id: 'rusty-dagger', name: 'Ржавый кинжал', type: 'weapon', rarity: 'common', icon: 'assets/sprites/icons/item-rusty-dagger.png', price: 40, value: 20, desc: 'Оружие E-ранга.', stats: { atk: 8 } },
      { id: 'goblin-fang', name: 'Клык гоблина', type: 'material', rarity: 'common', icon: 'assets/sprites/icons/item-goblin-fang.png', price: 8, value: 4, desc: 'Материал.' }
    ],
    tables: {
      goblin: { gold: [4, 9], drops: [{ id: 'goblin-fang', chance: 0.85, qty: [1, 2] }, { id: 'hp-potion-small', chance: 0.15, qty: [1, 1] }] },
      guardian: { gold: [25, 45], drops: [{ id: 'goblin-fang', chance: 0.5, qty: [1, 2] }, { id: 'hp-potion-small', chance: 0.6, qty: [1, 1] }] },
      'statue-of-god': { gold: [120, 180], drops: [{ id: 'rusty-dagger', chance: 0.7, qty: [1, 1] }, { id: 'hp-potion-small', chance: 1, qty: [1, 2] }] }
    },
    chests: { common: { gold: [20, 45], drops: [{ id: 'hp-potion-small', chance: 0.8, qty: [1, 2] }] } },
    shop: [{ id: 'hp-potion-small', price: 25 }, { id: 'mp-potion', price: 55 }]
  };
  const FALLBACK_QUESTS = {
    main: [{
      id: 'main-1', chapter: 1, title: 'Двойное подземелье', desc: 'Выжить в храме Картенона.',
      objectives: [{ type: 'kill', count: 2, label: 'Победить врагов' }, { type: 'chapter', count: 1, label: 'Пройти главу' }],
      rewards: { xp: 120, gold: 80, items: [{ id: 'hp-potion-small', qty: 2 }] }
    }],
    side: [],
    hidden: []
  };
  const FALLBACK_BOSSES = {
    guardian: {
      title: 'Страж главы', subtitle: 'Порождение подземелья', intro: 'Страж поднимается из пола.',
      phases: [0.4],
      attacks: [
        { type: 'slam', name: 'Тяжёлый удар', cd: 5, windup: 0.85, dmg: 1.3, radius: 120, color: '#ffd24a' },
        { type: 'fan', name: 'Осколки камня', cd: 7, windup: 0.75, dmg: 1.0, count: 4, spread: 0.8, speed: 360, color: '#c8b45a', phase: 1 }
      ],
      enrage: { hp: 0.4, atkMult: 1.3, speedMult: 1.2, label: 'АГОНИЯ СТРАЖА' }
    }
  };
  const FALLBACK_LEVELS = {
    '1': {
      theme: 'temple', extra: [],
      secret: { x: 620, type: 'illusory', name: 'Тайник за алтарём', chest: 'common', lore: 'За обломками алтаря — узкая ниша.' },
      puzzle: { x: 1850, type: 'runes', name: 'Печати храма', sequence: [0, 2, 1], hint: 'Пепел · Свет · Тьма', chest: 'rare', lore: 'Три печати вспыхивают по очереди.' },
      chests: [{ x: 1400, chest: 'common' }]
    }
  };

  const BOSS_SIZE = {
    'statue-of-god': 108, 'reed-boss': 104, 'baruka': 100, 'igris': 104,
    'beru': 112, 'ashborn': 108, 'antares': 140, 'architect': 110, 'guardian': 100
  };
  const THEME_ANIM = {
    temple: 'statue-of-god', cave: 'orc', hospital: 'architect', ice: 'ice-bear',
    castle: 'igris', jungle: 'knight-ant', guild: 'igris', throne: 'antares'
  };
  const MONSTER_SIZE = {
    goblin: [40, 46], orc: [52, 58], 'knight-ant': [56, 44], 'ice-bear': [64, 52],
    'demon-knight': [48, 60], hellhound: [54, 38],
    'goblin-shaman': [44, 50], 'cave-spider': [56, 34], 'orc-berserker': [56, 62],
    'ice-elf-ranger': [42, 60], 'frost-wolf': [60, 40]
  };
  const MONSTER_DRAW = {
    goblin: [48, 48], orc: [64, 64], 'knight-ant': [64, 52], 'ice-bear': [80, 64],
    'demon-knight': [72, 76], hellhound: [76, 48],
    'goblin-shaman': [52, 56], 'cave-spider': [68, 44], 'orc-berserker': [72, 76],
    'ice-elf-ranger': [60, 72], 'frost-wolf': [78, 52]
  };

  function fetchJson(url) {
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
      return r.json();
    });
  }

  function distToActor(actor, x, y) {
    return Math.hypot((actor.x + actor.w / 2) - x, (actor.y + actor.h / 2) - y);
  }

  function emptyShadows() {
    return { owned: {}, equipped: [], levels: {} };
  }

  function emptyContracts() {
    return { day: null, list: [] };
  }

  function dayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededShuffle(list, seed) {
    let x = seed >>> 0;
    for (let i = list.length - 1; i > 0; i--) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      const j = x % (i + 1);
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  const Game = {
    data: null,
    chapters: [],
    characters: [],
    charById: {},
    skillsData: [],
    talentsData: null,
    lootData: null,
    questsData: null,
    bossesData: {},
    levelsData: {},
    chapterIndex: 0,
    unlocked: 0,
    replaying: false,
    chapter: null,
    level: null,
    world: null,
    player: null,
    npcs: [],
    monsters: [],
    allies: [],
    boss: null,
    bossRun: { noHit: true, noPotion: true },
    state: 'play',
    selectedSkill: 0,
    settings: { muted: false, shake: true, touch: false, touchUser: false, leftHanded: false, seenTutorial: false },
    stats: { kills: 0, deaths: 0, bosses: 0, chests: 0, secrets: 0 },
    progress: null,
    inventory: null,
    savedWorld: {},
    storySeen: {},
    shadows: emptyShadows(),
    contracts: emptyContracts(),
    activeContract: null,
    contractRun: false,
    contractOutcome: null,
    finished: false,
    loading: true,
    hintPuzzle: null,
    _finishing: false,
    _chapterDlgShown: false,
    _newGame: false,
    _saveAccum: 0,
    _lastHint: '',

    // ---------- Загрузка ----------
    async init() {
      Engine.Input.init();
      await this.loadAllData();

      const search = (typeof location !== 'undefined' && location.search) || '';
      this.forceTouch = /[?&](touch|mobile)=1/.test(search);
      if (this.forceTouch) this.settings.touch = true;

      window.Loot.init(this.lootData);
      this.progress = window.Progress;
      this.inventory = new window.Inventory();
      this.progress.init(this.baseStats(), this.talentsData, this.inventory);
      window.Quests.init(this.questsData, this);
      window.Combat.init(this.skillsData);

      UI.init(this);
      if (window.TG) window.TG.init(UI);
      AudioFX.init(this.settings.muted);
      const save = await this.loadSave();
      if (save) this.applySave(save);
      else this.newGameState();
      if (this.forceTouch) {
        this.settings.touch = true;
        UI.enableTouch(true);
      }
      if (this.settings.touch && !UI.touch) UI.enableTouch(true);
      if (this.settings.touchUser && !this.settings.touch && UI.touch) UI.enableTouch(false);
      UI.applyHandedness();
      AudioFX.setMuted(this.settings.muted);
      Engine.Camera.enabled = this.settings.shake;
      this.loading = false;
      const boot = document.getElementById('boot-screen');
      if (boot) boot.style.display = 'none';
      this.startChapter(this.chapterIndex, { fromSave: !!save });

      Engine.startLoop((dt) => this.update(dt), () => this.render());

      if (this._newGame) {
        setTimeout(() => this.showIntro(), 900);
      }
    },

    async loadSave() {
      if (!window.SaveSystem) return null;
      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
        return await Promise.race([window.SaveSystem.loadAsync(), timeout]);
      } catch (e) {
        console.warn('SoloGame: сохранение не загружено', e);
        return null;
      }
    },

    async loadAllData() {
      const files = {
        chapters: 'src/data/chapters.json',
        characters: 'src/data/characters.json',
        skills: 'src/data/skills.json',
        talents: 'src/data/talents.json',
        loot: 'src/data/loot.json',
        quests: 'src/data/quests.json',
        bosses: 'src/data/bosses.json',
        levels: 'src/data/levels.json'
      };
      const keys = Object.keys(files);
      const results = await Promise.all(keys.map((k) => fetchJson(files[k]).catch((e) => {
        console.warn('SoloGame: ' + files[k] + ' недоступен, фолбэк.', e);
        return null;
      })));
      const by = {};
      keys.forEach((k, i) => { by[k] = results[i]; });

      this.chapters = Array.isArray(by.chapters) && by.chapters.length ? by.chapters.slice().sort((a, b) => (a.id || 0) - (b.id || 0)) : FALLBACK_CHAPTERS;
      this.characters = Array.isArray(by.characters) && by.characters.length ? by.characters : FALLBACK_CHARACTERS;
      this.skillsData = Array.isArray(by.skills) && by.skills.length ? by.skills : FALLBACK_SKILLS;
      this.talentsData = by.talents && by.talents.nodes ? by.talents : FALLBACK_TALENTS;
      this.lootData = by.loot && by.loot.items ? by.loot : FALLBACK_LOOT;
      this.questsData = by.quests && by.quests.main ? by.quests : FALLBACK_QUESTS;
      this.bossesData = by.bosses || FALLBACK_BOSSES;
      this.levelsData = by.levels || FALLBACK_LEVELS;
      this.data = { chapters: this.chapters, characters: this.characters };
      this.charById = {};
      this.characters.forEach((c) => { this.charById[c.id] = c; });
    },

    baseStats() {
      const main = this.charById['sung-jin-woo'];
      return (main && main.stats) || { hp: 850, atk: 120, def: 70 };
    },

    newGameState() {
      this.chapterIndex = 0;
      this.unlocked = 0;
      this.stats = { kills: 0, deaths: 0, bosses: 0, chests: 0, secrets: 0 };
      this.savedWorld = {};
      this.storySeen = {};
      this.shadows = emptyShadows();
      this.contracts = emptyContracts();
      this.activeContract = null;
      this.contractRun = false;
      this.contractOutcome = null;
      this.finished = false;
      this._newGame = true;
    },

    applySave(save) {
      const last = this.chapters.length - 1;
      this.chapterIndex = Math.max(0, Math.min(last, save.chapterIndex | 0));
      this.unlocked = Math.max(0, Math.min(last, save.unlocked | 0));
      if (save.stats) {
        this.stats = {
          kills: save.stats.kills | 0 || 0,
          deaths: save.stats.deaths | 0 || 0,
          bosses: save.stats.bosses | 0 || 0,
          chests: save.stats.chests | 0 || 0,
          secrets: save.stats.secrets | 0 || 0
        };
      }
      if (save.settings) this.settings = Object.assign(this.settings, save.settings);
      this.progress.deserialize(save.progress);
      this.inventory.deserialize(save.inventory);
      this.progress.inventory = this.inventory;
      this.progress.recalc();
      window.Quests.deserialize(save.quests);
      this.savedWorld = save.world || {};
      this.storySeen = save.storySeen || {};
      this.shadows = this.normalizeShadows(save.shadows);
      this.contracts = this.normalizeContracts(save.contracts);
      this.activeContract = null;
      this.contractRun = false;
      this.contractOutcome = null;
      this.finished = !!save.finished;
      this._newGame = false;
    },

    normalizeShadows(raw) {
      const out = emptyShadows();
      const owned = raw && raw.owned && typeof raw.owned === 'object' ? raw.owned : {};
      const defs = window.ShadowArmy ? window.ShadowArmy.DEFS : {};
      Object.keys(owned).forEach((id) => {
        if (owned[id] && (!window.ShadowArmy || defs[id])) out.owned[id] = true;
      });
      const rawLevels = raw && raw.levels && typeof raw.levels === 'object' ? raw.levels : {};
      Object.keys(out.owned).forEach((id) => {
        const level = parseInt(rawLevels[id], 10) || 1;
        out.levels[id] = Math.max(1, Math.min(5, level));
      });
      const eq = raw && Array.isArray(raw.equipped) ? raw.equipped : [];
      const max = window.ShadowArmy ? window.ShadowArmy.MAX : 2;
      out.equipped = eq.filter((id, i) => out.owned[id] && eq.indexOf(id) === i).slice(0, max);
      return out;
    },

    normalizeContracts(raw) {
      const today = dayKey();
      if (!raw || raw.day !== today || !Array.isArray(raw.list)) return emptyContracts();
      const allowed = ['available', 'active', 'completed', 'failed'];
      const types = ['boss', 'no-potion', 'elite'];
      const list = raw.list.filter((c) => c && c.id && c.chapter &&
        types.indexOf(c.type) >= 0 && allowed.indexOf(c.status) >= 0).slice(0, 3).map((c) => {
          const status = c.status === 'active' ? 'failed' : c.status;
          return Object.assign({}, c, { status });
        });
      if (list.length !== 3) return emptyContracts();
      return { day: raw.day, list };
    },

    persist() {
      if (!window.SaveSystem || !this.progress) return;
      if (this.world && this.chapter) this.savedWorld[this.chapter.id] = this.world.serialize();
      window.SaveSystem.save({
        chapterIndex: this.chapterIndex,
        unlocked: this.unlocked,
        progress: this.progress.serialize(),
        inventory: this.inventory.serialize(),
        quests: window.Quests.serialize(),
        world: this.savedWorld,
        storySeen: this.storySeen,
        stats: this.stats,
        settings: this.settings,
        shadows: this.shadows,
        contracts: this.contracts,
        finished: this.finished
      });
    },

    // ---------- Главы ----------
    startChapter(index, opts) {
      opts = opts || {};
      if (!opts.contract && this.activeContract) this.failContract('контракт прерван');
      if (!opts.contract) this.activeContract = null;
      this.contractRun = false;
      this.contractOutcome = null;
      const last = this.chapters.length - 1;
      index = Math.max(0, Math.min(last, index));
      this.chapterIndex = index;
      this.unlocked = Math.max(this.unlocked, index);
      this.replaying = index < this.unlocked || !!opts.replay;
      this.chapter = this.chapters[index];

      const levelData = this.levelsData[String(this.chapter.id)] || {};
      this.world = new window.World(this.chapter, levelData, this.chapter.id, this.savedWorld[this.chapter.id] || {});
      this.level = this.world.level;

      window.Effects.reset();
      window.Combat.reset();
      this.npcs = [];
      this.monsters = [];
      this.allies = [];
      this.boss = null;
      this.state = 'play';
      this._finishing = false;
      this._chapterDlgShown = false;
      this.hintPuzzle = null;
      this.bossRun = { noHit: true, noPotion: true };
      this.bossIntroShown = false;
      this._bossDlgPlayed = false;
      this._storyIntroStarted = false;
      this._pendingZoneStory = null;
      this._shadowAvailable = false;
      this._shadowExtractionId = null;
      this._extractionStarted = false;
      this._lastHint = '';
      this.selectedSkill = 0;
      if (window.Dialogue && window.Dialogue.active) window.Dialogue.close();
      UI.hideCinema();
      UI.hideCutin();
      UI.hideBossCast();

      const stats = this.progress.recalc();
      const main = this.charById['sung-jin-woo'];
      const floor = this.world.floorY;
      const startX = this.world.checkpointX || this.world.startX || 90;
      this.player = new window.GameActors.Player(startX, floor - 64, {
        maxHp: stats.maxHp,
        hp: stats.maxHp,
        maxMp: stats.maxMp,
        atk: stats.atk,
        def: stats.def,
        speed: stats.speed,
        animId: 'sung-jin-woo',
        sprite: main && main.sprite ? Engine.getSprite(main.sprite, '#4fa', 32, 32) : null
      });
      this.player.stats = stats;
      this.player.mp = stats.maxMp;
      this.spawnShadowArmy();

      this.spawnNpcs(levelData);
      this.spawnMonsters(levelData);
      // Страховка: все бойцы начинают на полу, а не под ним.
      const floorTop = this.level.floorY;
      const grounded = [this.player].concat(this.monsters, this.npcs.map((n) => n.actor));
      grounded.forEach((a) => {
        if (!a) return;
        if (!isFinite(a.y) || a.y + a.h > floorTop) {
          a.y = floorTop - a.h;
          a.vy = 0;
          a.onGround = true;
        }
      });
      window.Quests.ensureChapter(this.chapter.id);
      window.Quests.refreshDiscoveries(this.progress.level);

      Engine.Camera.snap(this.player, this.level.worldW, this.level.worldH);
      UI.hideDeath();
      UI.closeAllPanels();
      UI.setSelectedSkill(0);
      UI.refreshTracker();
      if (!opts.respawn) {
        UI.showChapterBanner('Глава ' + this.chapter.id, this.chapter.title.replace(/^Глава \d+\.\s*/, ''));
      }
      if (this.replaying && !opts.respawn && !opts.contract) {
        UI.toast('Повторное прохождение', 'Глава ' + this.chapter.id + ' · награды и тайники сохраняются', { color: '#6ad7ff' });
      }
      this.persist();
      const showStory = !this.replaying && !this.storySeen[this.chapter.id];
      if (showStory) {
        this.storySeen[this.chapter.id] = true;
        this.persist();
        this.startStoryIntro();
      }
    },

    makeStoryLines(entries) {
      if (!Array.isArray(entries)) return [];
      return entries.map((entry) => {
        const c = this.charById[entry.speaker];
        return {
          speaker: c ? c.name : entry.speaker,
          text: entry.text || '',
          icon: c ? ('assets/sprites/portraits/' + c.id + '.png') : null
        };
      }).filter((l) => l.text);
    },

    startStoryIntro() {
      const lines = this.makeStoryLines(this.chapter && this.chapter.storyIntro);
      if (!lines.length) return;
      this._storyIntroStarted = true;
      Dialogue.start(lines);
    },

    spawnNpcs(levelData) {
      const ids = this.chapter.characters || [];
      const floor = this.world.floorY;
      const hasNpcData = Array.isArray(levelData.npcs);
      const defs = hasNpcData ? levelData.npcs : [];
      const make = (id, x, def) => {
        const c = this.charById[id];
        if (!c || this.isEnemy(id, c, this.chapter.id)) return;
        const px = Math.max(70, Math.min(this.world.worldW - 100, Math.round(x)));
        const npc = new window.GameActors.Npc(px, floor - 64, {
          name: c.name || id,
          animId: id,
          sprite: c.sprite ? Engine.getSprite(c.sprite, '#fc6', 32, 32) : null
        });
        this.npcs.push({
          actor: npc,
          charId: id,
          talked: false,
          lines: def && Array.isArray(def.lines) ? def.lines : null,
          repeat: def && Array.isArray(def.repeat) ? def.repeat : null,
          zone: def && def.zone || null
        });
      };

      if (hasNpcData) {
        defs.forEach((def) => make(def.id, def.x, def));
        return;
      }

      const friendly = [];
      ids.forEach((id) => {
        if (id === 'sung-jin-woo') return;
        const c = this.charById[id];
        if (!c || this.isEnemy(id, c, this.chapter.id)) return;
        friendly.push(id);
      });
      const span = Math.max(1, this.world.worldW - 1400);
      friendly.forEach((id, i) => {
        const x = 480 + (friendly.length > 1 ? (span * i) / (friendly.length - 1) : span * 0.3);
        make(id, x, null);
      });
    },

    spawnEnemy(id, x, opts) {
      opts = opts || {};
      const c = this.charById[id];
      if (!c || !this.world) return null;
      const chapter = this.chapter.id;
      const hpScale = 1 + 0.09 * (chapter - 1);
      const atkScale = 1 + 0.05 * (chapter - 1);
      const defScale = 1 + 0.04 * (chapter - 1);
      const floor = this.world.floorY;
      const elite = !!opts.elite;
      const size = MONSTER_SIZE[id] || [36, 40];
      const drawSize = MONSTER_DRAW[id] || [64, 64];
      const stats = opts.stats || c.stats || { hp: 100, atk: 20, def: 5 };
      const px = Math.max(620, Math.min(this.world.worldW - 780, Math.round(x)));
      const mon = new window.GameActors.Monster(px, floor - size[1], {
        w: size[0] + (elite ? 6 : 0),
        h: size[1] + (elite ? 6 : 0),
        drawW: drawSize[0] + (elite ? 6 : 0),
        drawH: drawSize[1] + (elite ? 6 : 0),
        hp: Math.round(stats.hp * hpScale * (elite ? 1.55 : 1)),
        atk: Math.round(stats.atk * atkScale * (elite ? 1.15 : 1)),
        def: Math.round(stats.def * defScale * (elite ? 1.1 : 1)),
        name: opts.name || ((elite ? 'Элитный ' : '') + (c.name || id)),
        animId: id,
        sprite: c.sprite ? Engine.getSprite(c.sprite, '#96f', 32, 32) : null,
        color: elite ? '#e8c76a' : '#8a6',
        lootId: id,
        statsBase: stats,
        elite
      });
      mon.maxHp = mon.hp;
      this.monsters.push(mon);
      return mon;
    },

    spawnMonsters(levelData) {
      const floor = this.world.floorY;
      const chapter = this.chapter.id;
      const rand = Engine.mulberry32(chapter * 1613 + 41);
      const enemyEntries = [];
      (this.chapter.characters || []).forEach((id) => {
        if (id === 'sung-jin-woo') return;
        const c = this.charById[id];
        if (!c || !this.isEnemy(id, c, chapter)) return;
        enemyEntries.push({ id, c });
      });

      const roleLc = (e) => ((e.c.role || '') + '').toLowerCase();
      const isBossRole = (e) => /босс|монарх|король|вождь/.test(roleLc(e));
      let bossIdx = enemyEntries.findIndex(isBossRole);
      if (bossIdx < 0) bossIdx = enemyEntries.findIndex((e) => ['statue-of-god', 'reed-boss', 'baruka', 'igris', 'beru', 'ashborn', 'antares', 'architect'].includes(e.id));

      const encounters = Array.isArray(levelData.encounters) && levelData.encounters.length
        ? levelData.encounters : null;
      if (encounters) {
        encounters.forEach((enc) => {
          const c = this.charById[enc.id];
          if (!c) return;
          const count = Math.max(1, Math.min(8, enc.count | 0 || 1));
          const spread = enc.spread == null ? 76 : enc.spread;
          for (let i = 0; i < count; i++) {
            const x = enc.x + (i - (count - 1) / 2) * spread + (rand() - 0.5) * 34;
            this.spawnEnemy(enc.id, x, {
              elite: !!enc.elite,
              name: enc.name || null
            });
          }
        });
      } else {
        const regulars = [];
        enemyEntries.forEach((e, i) => {
          if (i === bossIdx) return;
          regulars.push({ id: e.id, c: e.c, count: 1 });
        });
        (levelData.extra || []).forEach((ex) => {
          const c = this.charById[ex.id];
          if (!c) return;
          regulars.push({ id: ex.id, c, count: Math.max(1, ex.count | 0 || 1) });
        });
        const arenaX = this.world.bossX - 900;
        const zones = this.world.zones.filter((z) => z.x + z.w < arenaX);
        let slot = 0;
        regulars.forEach((entry) => {
          for (let i = 0; i < entry.count; i++) {
            const zone = zones[slot % Math.max(1, zones.length)] || this.world.zones[0];
            const x = zone.x + zone.w * 0.35 + (slot % 4) * 120 + rand() * 60;
            this.spawnEnemy(entry.id, x, { elite: Math.random() < 0.14 && chapter > 2 });
            slot++;
          }
        });
      }

      // Босс
      if (bossIdx >= 0 && enemyEntries[bossIdx]) {
        const e = enemyEntries[bossIdx];
        const stats = e.c.stats || { hp: 900, atk: 120, def: 60 };
        const size = BOSS_SIZE[e.id] || 80;
        const bossData = this.bossesData[e.id] || this.bossesData.guardian || FALLBACK_BOSSES.guardian;
        const boss = new window.Boss(this.world.bossX, floor - size, {
          w: size, h: size,
          drawW: size, drawH: size,
          hp: bossData.hpBase || Math.round(stats.hp * (1 + 0.07 * (chapter - 1))),
          atk: bossData.atkBase || Math.round(stats.atk * (1 + 0.045 * (chapter - 1))),
          def: bossData.defBase || Math.round(stats.def * (1 + 0.03 * (chapter - 1))),
          name: e.c.name || e.id,
          animId: e.id,
          sprite: e.c.sprite ? Engine.getSprite(e.c.sprite, '#f46', 32, 32) : null,
          color: '#c34',
          lootId: e.id,
          statsBase: stats,
          bossData: bossData
        });
        boss.maxHp = boss.hp;
        this.monsters.push(boss);
        this.boss = boss;
      } else {
        // Фолбэк-страж: главы без явного босса
        const theme = levelData.theme || 'cave';
        const custom = levelData.boss || {};
        const bossData = (custom.bossData && (this.bossesData[custom.bossData] ||
          FALLBACK_BOSSES[custom.bossData])) ||
          this.bossesData.guardian || FALLBACK_BOSSES.guardian;
        const size = Math.max(60, custom.size || BOSS_SIZE.guardian);
        const hp = bossData.hpBase || 3500 + chapter * 1200;
        const atk = bossData.atkBase || 58 + chapter * 20;
        const def = bossData.defBase || 18 + chapter * 7;
        const boss = new window.Boss(this.world.bossX, floor - size, {
          w: size, h: size, hp, atk, def,
          drawW: size, drawH: size,
          name: custom.name || levelData.guardianName || bossData.title || 'Страж главы',
          animId: custom.animId || THEME_ANIM[theme] || 'igris',
          color: '#c34',
          lootId: 'guardian',
          statsBase: { hp, atk, def },
          bossData
        });
        boss.maxHp = boss.hp;
        this.monsters.push(boss);
        this.boss = boss;
      }
    },

    isEnemy(id, c, chapterId) {
      const HUMANS = ['yoo-jinho', 'cha-hae-in', 'go-gun-hee', 'song-chi-yul', 'lee-joo-hee',
        'ahn-sang-min', 'woo-jin-chul', 'baek-yoon-ho', 'kim-chul', 'choi-jong-in',
        'min-byung-gu', 'architect'];
      if (HUMANS.includes(id)) return false;
      if (id === 'igris') return chapterId === 6;
      if (id === 'beru') return chapterId === 8;
      if (id === 'ashborn') return chapterId === 10;
      if (['antares', 'baruka', 'statue-of-god', 'reed-boss'].includes(id)) return true;
      const role = ((c && c.role) || '').toLowerCase();
      return /монстр|босс|зверь|вождь|рыцарь кров/.test(role);
    },

    spawnMinion(id, x, y, name, summoned) {
      const c = this.charById[id];
      if (!c) return null;
      const alive = this.monsters.filter((m) => m.summoned && !m.dead).length;
      if (alive >= 8) return null;
      const chapter = this.chapter.id;
      const stats = c.stats || { hp: 100, atk: 20, def: 5 };
      const size = MONSTER_SIZE[id] || [34, 38];
      const hpScale = (1 + 0.09 * (chapter - 1)) * 0.7;
      const mon = new window.GameActors.Monster(
        Math.max(80, Math.min(x, this.world.worldW - 120)),
        Math.min(this.world.floorY - size[1], y + 40),
        {
          w: size[0], h: size[1],
          drawW: 64, drawH: 64,
          hp: Math.round(stats.hp * hpScale),
          atk: Math.round(stats.atk * (1 + 0.05 * (chapter - 1)) * 0.85),
          def: Math.round(stats.def * 0.6),
          name: name || c.name || id,
          animId: id,
          sprite: c.sprite ? Engine.getSprite(c.sprite, '#96f', 32, 32) : null,
          color: '#8a6',
          lootId: id,
          statsBase: stats
        }
      );
      mon.summoned = true;
      mon.maxHp = mon.hp;
      this.monsters.push(mon);
      window.Effects.ring({ x: mon.x + mon.w / 2, y: mon.y + mon.h / 2, maxR: 80, life: 0.5, color: '#a06cff', width: 3 });
      window.Effects.spawnParticles(mon.x + mon.w / 2, mon.y + mon.h / 2, '#a06cff', 14, { speed: 140, life: 0.6, glow: true });
      return mon;
    },

    spawnAlly(x, y, duration, atk) {
      const ally = new window.GameActors.Ally(x, this.world.floorY - 64, {
        atk,
        life: duration,
        animId: 'sung-jin-woo'
      });
      this.allies.push(ally);
      window.Effects.spawnParticles(x + 14, this.world.floorY - 22, '#9a6cff', 14, { speed: 120, up: 80, life: 0.5, glow: true });
      return ally;
    },

    hasShadow(id) {
      return !!(this.shadows && this.shadows.owned && this.shadows.owned[id]);
    },

    shadowLevel(id) {
      return Math.max(1, Math.min(5, parseInt(this.shadows.levels[id], 10) || 1));
    },

    shadowStats(id) {
      const def = window.ShadowArmy && window.ShadowArmy.def(id);
      if (!def) return null;
      const level = this.shadowLevel(id);
      const damageMult = 1 + 0.12 * (level - 1);
      const speedMult = 1 - 0.04 * (level - 1);
      return {
        def,
        level,
        atkPct: def.atkPct * damageMult,
        attackCd: def.attackCd * speedMult,
        range: def.range,
        style: def.style,
        color: def.color,
        moveSpeed: def.moveSpeed,
        damageMult: def.style === 'projectile' ? 1 : 0.7,
        lifesteal: def.lifesteal || 0,
        slow: def.slow || 0,
        stunChance: def.id === 'igris' ? 0.18 : 0
      };
    },

    grantShadow(id) {
      if (!id || !window.ShadowArmy || !window.ShadowArmy.def(id)) return;
      this.shadows.owned[id] = true;
      if (!this.shadows.levels[id]) this.shadows.levels[id] = 1;
      const max = window.ShadowArmy.MAX;
      if (this.shadows.equipped.indexOf(id) < 0 && this.shadows.equipped.length < max) {
        this.shadows.equipped.push(id);
      }
      this.persist();
      if (window.UI) {
        if (UI.refreshMenu) UI.refreshMenu();
        if (UI.renderShadows) UI.renderShadows();
      }
    },

    upgradeShadow(id) {
      if (!this.hasShadow(id)) {
        UI.toast('Теневая армия', 'Эта тень ещё не извлечена.', { color: '#a06cff', duration: 2600 });
        return false;
      }
      const level = this.shadowLevel(id);
      if (level >= 5) {
        UI.toast('Теневая армия', 'Достигнут максимальный уровень.', { color: '#e8c76a', duration: 2200 });
        return false;
      }
      const cost = window.ShadowArmy.upgradeCost(level);
      if (this.inventory.count('shadow-essence') < cost) {
        UI.toast('Недостаточно эссенции', 'Нужно эссенции тени: ' + cost + '.', { color: '#ff8a8a', duration: 2600 });
        return false;
      }
      this.inventory.remove('shadow-essence', cost);
      this.shadows.levels[id] = level + 1;
      this.syncShadowAllies();
      this.persist();
      if (window.UI) {
        if (UI.renderShadows) UI.renderShadows();
        if (UI.refreshMenu) UI.refreshMenu();
      }
      UI.toast('Тень усилена', window.ShadowArmy.def(id).name + ' · уровень ' + (level + 1), {
        color: '#e8c76a', duration: 2800
      });
      AudioFX.play('levelup');
      return true;
    },

    toggleShadow(id) {
      const def = window.ShadowArmy && window.ShadowArmy.def(id);
      if (!def) return;
      if (!this.hasShadow(id)) {
        UI.toast('Теневая армия', 'Сначала победите ' + def.name + '. ' + this.shadowUnlockHint(id), {
          color: '#a06cff', duration: 3400
        });
        return;
      }
      if (this.chapter && this.chapter.id === 6) {
        UI.toast('Теневая армия', 'В демоническом замке тень не может сражаться против своего короля.', {
          color: '#a06cff', duration: 3000
        });
        return;
      }
      const idx = this.shadows.equipped.indexOf(id);
      if (idx >= 0) {
        this.shadows.equipped.splice(idx, 1);
        UI.toast('Теневая армия', def.name + ' отправлен в резерв.', { color: '#a06cff', duration: 2400 });
      } else {
        if (this.shadows.equipped.length >= window.ShadowArmy.MAX) {
          UI.toast('Теневая армия', 'Оба слота заняты. Сначала отправьте одну тень в резерв.', {
            color: '#ffd24a', duration: 3000
          });
          return;
        }
        this.shadows.equipped.push(id);
        UI.toast('Теневая армия', def.name + ' в строю.', { color: '#a06cff', duration: 2400 });
      }
      this.syncShadowAllies();
      this.persist();
      if (window.UI) {
        if (UI.renderShadows) UI.renderShadows();
        if (UI.refreshMenu) UI.refreshMenu();
      }
    },

    shadowUnlockHint(id) {
      if (id === 'igris') return 'Игрис ждёт в главе 6.';
      if (!this.hasShadow('igris')) return 'Сначала извлеките Игриса в главе 6.';
      const def = window.ShadowArmy.def(id);
      return 'Повторно пройдите главу ' + def.chapter + ' и извлеките его тень.';
    },

    syncShadowAllies() {
      if (!this.player || !this.world) return;
      if (this.chapter && this.chapter.id === 6) return;
      const max = window.ShadowArmy ? window.ShadowArmy.MAX : 2;
      const active = this.shadows.equipped.slice(0, max);
      this.allies = this.allies.filter((a) => !a.shadowId || active.indexOf(a.shadowId) >= 0);
      active.forEach((id) => {
        if (!this.allies.some((a) => a.shadowId === id)) this.spawnShadowUnit(id);
      });
    },

    spawnShadowUnit(id) {
      const stat = this.shadowStats(id);
      if (!stat || !this.player || !this.world) return null;
      const slot = Math.max(0, this.shadows.equipped.indexOf(id));
      const sx = Math.max(80, this.player.x - 72 - slot * 58);
      const atk = Math.round((this.progress.stats.atk || 100) * stat.atkPct);
      const ally = new window.GameActors.Ally(sx, this.world.floorY - 64, {
        atk,
        life: Infinity,
        animId: stat.def.animId,
        drawW: stat.def.drawW,
        drawH: stat.def.drawH,
        shadowId: id,
        name: 'Тень ' + stat.def.name,
        shadowLevel: stat.level,
        attackCd: stat.attackCd,
        attackStyle: stat.style,
        attackRange: stat.range,
        moveSpeed: stat.moveSpeed,
        damageMult: stat.damageMult,
        color: stat.color,
        lifesteal: stat.lifesteal,
        slow: stat.slow,
        stunChance: stat.stunChance
      });
      this.allies.push(ally);
      window.Effects.pool({ x: sx + 18, y: this.world.floorY - 2, r: 54, life: 1.0, color: stat.color });
      window.Effects.spawnParticles(sx + 18, this.world.floorY - 28, stat.color, 16, {
        speed: 120, up: 130, life: 0.7, glow: true
      });
      return ally;
    },

    spawnShadowArmy() {
      this.syncShadowAllies();
    },

    startShadowExtraction() {
      if (this._extractionStarted || !this._shadowAvailable) return;
      const id = this._shadowExtractionId;
      const def = window.ShadowArmy && window.ShadowArmy.def(id);
      if (!def) {
        this._shadowAvailable = false;
        this._shadowExtractionId = null;
        return;
      }
      this._extractionStarted = true;
      this._pendingZoneStory = null;
      this.state = 'scene';
      // Убираем застывшие тела и вспышки смерти, чтобы церемония читалась чисто.
      this.monsters = this.monsters.filter((m) => !m.dead);
      window.Effects.flashes.length = 0;
      window.Effects.rings.length = 0;
      window.Effects.telegraphs.length = 0;
      window.Effects.ring({
        x: this.player.x + this.player.w / 2,
        y: this.world.floorY - 24,
        maxR: 260, life: 1.1, color: def.color, width: 6
      });
      UI.showCutin({
        image: def.cutin,
        eyebrow: 'ТЕНЬ',
        name: def.name,
        subtitle: def.title,
        quote: def.quote
      });
      UI.showCinema('Восстань', 'Тень ' + def.name);
      AudioFX.play('boss');
      const lines = this.makeStoryLines(def.lines);
      const begin = () => {
        if (!this._extractionStarted) return;
        Dialogue.start(lines, () => {
          this.grantShadow(id);
          this._shadowAvailable = false;
          this._shadowExtractionId = null;
          this._extractionStarted = false;
          this.state = 'play';
          UI.hideCinema();
          UI.hideCutin();
          const inArmy = this.shadows.equipped.indexOf(id) >= 0;
          UI.toast('Теневая армия', inArmy
            ? def.name + ' в строю. В меню теней можно сменить состав.'
            : def.name + ' в резерве: оба слота заняты.', { color: '#a06cff', duration: 4200 });
          this.persist();
          this.checkChapterClear();
        });
      };
      window.Effects.timer(1.0, begin);
      this.persist();
    },

    // ---------- Ежедневные контракты Ахджин ----------
    ensureContracts(day) {
      const key = day || dayKey();
      if (this.contracts && this.contracts.day === key &&
        Array.isArray(this.contracts.list) && this.contracts.list.length === 3) {
        return this.contracts;
      }
      // Не подменяем доску посреди активного забега, даже если наступила полночь.
      if (this.activeContract && this.contracts && this.contracts.day !== key) return this.contracts;
      this.contracts = { day: key, list: this.generateDailyContracts(key) };
      this.activeContract = null;
      this.contractRun = false;
      this.persist();
      return this.contracts;
    },

    generateDailyContracts(day) {
      const maxIdx = Math.max(0, Math.min(this.unlocked, this.chapters.length - 1));
      const start = Math.max(0, maxIdx - 5);
      const pool = [];
      for (let i = start; i <= maxIdx; i++) pool.push(i);
      while (pool.length < 3) pool.push(maxIdx);
      seededShuffle(pool, hashSeed(day + ':ahjin:' + maxIdx));
      return ['boss', 'no-potion', 'elite'].map((type, slot) =>
        this.makeDailyContract(type, pool[slot], slot, day));
    },

    makeDailyContract(type, chapterIndex, slot, day) {
      const chapter = this.chapters[chapterIndex];
      const short = chapter.title.replace(/^Глава \d+\.\s*/, '').split(':')[0];
      const templates = {
        boss: {
          tag: 'ОХОТА', title: 'Охота: ' + short,
          desc: 'Победите босса главы ' + chapter.id + ' на его арене.',
          adds: 0, eliteAdds: false, goldMult: 1, essence: 1, potion: null
        },
        'no-potion': {
          tag: 'БЕЗ ЗЕЛИЙ', title: 'Без лечения: ' + short,
          desc: 'Победите босса главы ' + chapter.id + ', не используя зелья. На арене два стража.',
          adds: 2, eliteAdds: false, goldMult: 1.5, essence: 2, potion: 'hp-potion-large'
        },
        elite: {
          tag: 'ЭЛИТА', title: 'Элитная арена: ' + short,
          desc: 'Победите босса главы ' + chapter.id + ', пока арену охраняют три элитных стража.',
          adds: 3, eliteAdds: true, goldMult: 2, essence: 3, potion: 'hp-potion-medium'
        }
      };
      const cfg = templates[type];
      const rewards = {
        gold: Math.round((100 + chapter.id * 20) * cfg.goldMult),
        items: [{ id: 'shadow-essence', qty: cfg.essence }]
      };
      if (cfg.potion) rewards.items.push({ id: cfg.potion, qty: 1 });
      return {
        id: 'daily-' + day.replace(/-/g, '') + '-' + (slot + 1),
        type,
        modifier: type === 'boss' ? 'none' : type,
        tag: cfg.tag,
        chapter: chapter.id,
        chapterIndex,
        title: cfg.title,
        desc: cfg.desc,
        adds: cfg.adds,
        eliteAdds: cfg.eliteAdds,
        rewards,
        status: 'available',
        attempts: 0
      };
    },

    contractRewardText(contract) {
      const reward = (contract && contract.rewards) || {};
      const parts = ['◈ ' + (reward.gold || 0)];
      (reward.items || []).forEach((it) => {
        const def = window.Loot && window.Loot.item(it.id);
        parts.push((def ? def.name : it.id) + (it.qty > 1 ? ' ×' + it.qty : ''));
      });
      return parts.join(' · ');
    },

    findContract(id) {
      if (!this.contracts || !Array.isArray(this.contracts.list)) return null;
      return this.contracts.list.find((c) => c.id === id) || null;
    },

    startContract(id) {
      this.ensureContracts();
      const contract = this.findContract(id);
      if (!contract) return false;
      if (contract.status === 'completed') {
        UI.toast('Контракт', 'Этот контракт уже выполнен сегодня.', { color: '#9aa0c0', duration: 2600 });
        return false;
      }
      if (this.activeContract) {
        UI.toast('Контракт', 'Сначала завершите текущий контракт или прервите его.', {
          color: '#ff9a6a', duration: 3200
        });
        return false;
      }
      const idx = Math.max(0, Math.min(this.chapters.length - 1, (contract.chapter | 0) - 1));
      if (idx > this.unlocked) {
        UI.toast('Контракт', 'Эта глава ещё не открыта.', { color: '#ff9a6a', duration: 2600 });
        return false;
      }
      if (contract.status === 'active') contract.status = 'failed';
      contract.status = 'active';
      contract.attempts = (contract.attempts || 0) + 1;
      contract.failedReason = '';
      this.activeContract = {
        id: contract.id,
        type: contract.type,
        modifier: contract.modifier,
        chapter: contract.chapter,
        addId: null,
        potionsUsed: 0
      };
      UI.closeAllPanels();
      this.startChapter(idx, { replay: true, contract: true });
      this.contractRun = true;
      this.contractOutcome = null;
      this.setupContractArena(contract);
      UI.showChapterBanner('Контракт Ахджин', contract.title);
      UI.toast('Ежедневный контракт', contract.desc + ' Награда: ' + this.contractRewardText(contract), {
        color: '#e8c76a', duration: 5600
      });
      AudioFX.play('ui');
      this.persist();
      return true;
    },

    setupContractArena(contract) {
      const boss = this.boss;
      if (!boss || !this.player || !this.world) {
        this.failContract('арена недоступна');
        return;
      }
      const regular = this.monsters.find((m) => !m.isBoss);
      const addId = regular ? regular.lootId : 'goblin';
      if (this.activeContract) this.activeContract.addId = addId;
      this.monsters = this.monsters.filter((m) => m.isBoss);
      this.player.x = Math.max(80, boss.x - 460);
      this.player.y = this.world.floorY - this.player.h;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.onGround = true;
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      this.player.invulnTimer = Math.max(this.player.invulnTimer || 0, 0.8);
      const zone = this.world.zones[this.world.zones.length - 1];
      if (zone) {
        this.world.seenZones[zone.id] = true;
        this.world.activeZoneId = zone.id;
      }
      this._pendingZoneStory = null;
      window.Engine.Camera.snap(this.player, this.level.worldW, this.level.worldH);
      const adds = contract.adds | 0;
      for (let i = 0; i < adds; i++) {
        const x = Math.max(100, Math.min(this.world.worldW - 80, boss.x - 260 + i * 180));
        const add = this.spawnEnemy(addId, x, { elite: !!contract.eliteAdds });
        if (add) {
          add.x = x;
          add.summoned = true;
          add.name = contract.eliteAdds ? 'Элитный страж арены' : 'Страж арены';
        }
      }
    },

    resolveContractBossKill() {
      if (!this.activeContract) return;
      const contract = this.findContract(this.activeContract.id);
      if (!contract || contract.status !== 'active' || contract.chapter !== this.chapter.id) return;
      if (contract.modifier === 'no-potion' && (this.activeContract.potionsUsed || 0) > 0) {
        this.failContract('условие «без зелий» нарушено');
        return;
      }
      this.completeContract(contract);
    },

    completeContract(contract) {
      if (!contract || contract.status !== 'active') return;
      contract.status = 'completed';
      contract.completedAt = Date.now();
      this.contractOutcome = 'completed';
      const reward = contract.rewards || {};
      if (reward.gold) this.progress.addGold(reward.gold);
      (reward.items || []).forEach((it) => this.grantItem(it.id, it.qty, { notable: false }));
      this.activeContract = null;
      UI.toast('Контракт выполнен', contract.title + ' · ' + this.contractRewardText(contract), {
        color: '#ffd24a', duration: 5600
      });
      AudioFX.play('quest');
      if (window.TG) window.TG.haptic('success');
      this.persist();
      if (window.UI && UI.hub && UI.hub.style.display !== 'none') UI.renderHub();
    },

    failContract(reason) {
      const run = this.activeContract;
      if (!run) return;
      const contract = this.findContract(run.id);
      if (contract && contract.status === 'active') {
        contract.status = 'failed';
        this.contractOutcome = 'failed';
        contract.failedReason = reason || '';
        contract.failedAt = Date.now();
      }
      this.activeContract = null;
      UI.toast('Контракт провален', (contract ? contract.title : 'Контракт') +
        (reason ? ' · ' + reason : ''), { color: '#ff8a8a', duration: 5000 });
      AudioFX.play('error');
      this.persist();
      if (window.UI && UI.hub && UI.hub.style.display !== 'none') UI.renderHub();
    },

    showIntro() {
      UI.toast('Система', 'Игрок пробуждён. A/D — движение, W — прыжок, S — быстрое падение. Мышь — прицел, ЛКМ — удар, ПКМ — умение. E — взаимодействие.', {
        color: '#a06cff', duration: 7000
      });
      UI.toast('Совет', 'Колесо мыши выбирает умение. Ищите тайники у стен, решайте загадки — награды выше.', {
        color: '#e8c76a', duration: 6500
      });
      UI.toast('Бой', 'Shift или K — рывок с неуязвимостью. Три удара подряд — комбо с финишером.', {
        color: '#7ad7ff', duration: 7000
      });
      this.settings.seenTutorial = true;
      this.persist();
    },

    // ---------- Ввод/обновление ----------
    update(dt) {
      if (this.loading || !this.player) return;
      const I = Engine.Input;

      if (Dialogue.active) {
        if (I.actionHit('interact')) Dialogue.advance();
        UI.setHint('[E] Далее');
        UI.update(this);
        return;
      }

      if (this.state === 'dead') {
        if (I.actionHit('interact')) this.respawn();
        UI.update(this);
        return;
      }

      if (this._pendingZoneStory) {
        this._zoneStoryDelay = (this._zoneStoryDelay || 0) - dt;
        if (this._zoneStoryDelay <= 0) {
          const lines = this._pendingZoneStory;
          this._pendingZoneStory = null;
          Dialogue.start(lines);
          UI.update(this);
          return;
        }
      }

      // Короткая кинематографическая пауза: эффекты смерти босса успевают погаснуть.
      if (this.state === 'scene' && !Dialogue.active) {
        this.player.vx = 0;
        window.Effects.update(dt, this);
        window.Combat.update(dt);
        Engine.Camera.follow(this.player, this.level.worldW, this.level.worldH, dt);
        Engine.Camera.update(dt);
        UI.update(this);
        return;
      }

      // Горячие клавиши панелей
      if (I.actionHit('inventory')) { AudioFX.play('ui'); UI.toggleInventory(); }
      if (I.actionHit('talents')) { AudioFX.play('ui'); UI.toggleTalents(); }
      if (I.actionHit('quests')) { AudioFX.play('ui'); UI.toggleQuests(); }
      if (I.actionHit('shadows')) { AudioFX.play('ui'); UI.toggleShadows(); }
      if (I.actionHit('hub')) UI.toggleHub();
      if (I.actionHit('pause')) { if (UI.isModalOpen()) UI.closeAllPanels(); else UI.toggleMenu(); AudioFX.play('ui'); }

      if (UI.isModalOpen()) {
        UI.update(this);
        return;
      }

      if (Engine.Input.mouse.overCanvas) {
        const wheel = Engine.Input.consumeWheel();
        if (wheel) this.cycleSelectedSkill(wheel);
        if (Engine.Input.mouse.rightPressed) {
          this.castSkillSlot(this.selectedSkill);
        }
      }

      if (I.actionHit('interact')) this.tryInteract();
      if (I.actionHit('potion')) this.usePotion();
      for (let i = 0; i < 5; i++) {
        if (I.actionHit('skill' + (i + 1))) this.castSkillSlot(i);
      }

      this.player.update(dt, this.level, this);
      for (const n of this.npcs) n.actor.update(dt, this.level, this);
      for (const m of this.monsters) m.update(dt, this.level, this);
      for (const a of this.allies) a.update(dt, this.level, this);
      this.allies = this.allies.filter((a) => !a.dead);

      this.hintPuzzle = null;
      this.world.update(dt, this);
      window.Effects.update(dt, this);
      window.Combat.update(dt);

      if (this.player.dead || this.player.hp <= 0) {
        this.onPlayerDeath();
        return;
      }

      this.checkChapterClear();
      Engine.Camera.follow(this.player, this.level.worldW, this.level.worldH, dt);
      Engine.Camera.update(dt);

      this.updateHint();
      UI.update(this);

      this._saveAccum += dt;
      if (this._saveAccum > 8) {
        this._saveAccum = 0;
        this.persist();
      }
    },

    updateHint() {
      let hint = '';
      if (this.state === 'play' && !this.player.dead) {
        hint = this.world.getHint(this.player);
        if (hint && hint.indexOf('[E]') !== 0 && this.boss && this.boss.engaged && !this.boss.dead) {
          hint = 'Цель: ' + this.boss.name;
        }
        if (!hint) {
          const nearby = this.npcs.find((n) => (!n.talked || (n.repeat && n.repeat.length)) &&
            Math.abs((n.actor.x + n.actor.w / 2) - (this.player.x + this.player.w / 2)) < 78 &&
            Math.abs(n.actor.y - this.player.y) < 80);
          if (nearby) hint = '[E] Поговорить — ' + nearby.actor.name;
          else if (this.boss && !this.boss.dead) {
            hint = this.boss.engaged
              ? 'Цель: ' + this.boss.name
              : 'В глубине подземелья: ' + this.boss.name;
          } else if (this.boss && this.boss.dead && this.monsters.some((m) => !m.dead && !m.summoned)) hint = 'Добейте оставшихся врагов';
        }
      }
      UI.setHint(hint);
    },

    // ---------- Бой ----------
    playerAttack(player) {
      if (this.state !== 'play' || UI.isModalOpen() || Dialogue.active || player.dead) return;
      const stats = player.stats || {};
      player.attackTimer = Math.max(0.14, player.attackCd * (1 - (stats.attackSpeedPct || 0)));
      player.attackAnimTimer = 0.22;
      window.Combat.basicAttack(this);
    },

    castSkillSlot(i) {
      if (this.state !== 'play' || UI.isModalOpen() || Dialogue.active || !this.player || this.player.dead) return;
      const skill = window.Combat.skills[i];
      if (!skill) return;
      if (window.Combat.unlocked(skill, this)) {
        this.selectedSkill = i;
        UI.setSelectedSkill(i);
      }
      window.Combat.cast(skill, this);
      if (window.TG) window.TG.haptic('light');
      UI.update(this);
    },

    cycleSelectedSkill(dir) {
      const skills = window.Combat.skills;
      if (!skills.length) return;
      let idx = this.selectedSkill;
      for (let k = 0; k < skills.length; k++) {
        idx = (idx + (dir > 0 ? 1 : -1) + skills.length) % skills.length;
        const skill = skills[idx];
        if (skill && window.Combat.unlocked(skill, this)) {
          this.selectedSkill = idx;
          UI.setSelectedSkill(idx);
          AudioFX.play('ui');
          return;
        }
      }
    },

    nearestMonster(range) {
      let best = null, bestD = range || 1e9;
      for (const m of this.monsters) {
        if (m.dead) continue;
        const d = distToActor(m, this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
        if (d < bestD) { bestD = d; best = m; }
      }
      return best;
    },

    projectileHit(m, p) {
      if (!m || m.dead) return;
      const roll = window.Combat.playerDamage(this, m, p.mult, p.isSkill !== false);
      this.damageMonster(m, roll.dmg, {
        crit: roll.crit,
        source: 'projectile',
        color: p.color,
        knockback: p.knockback
      });
    },

    damageMonster(m, dmg, opts) {
      if (!m || m.dead) return 0;
      opts = opts || {};
      let finalDmg = dmg;
      let guarded = false;
      let guardBroken = false;
      if (m.trait && m.trait.guard && !m.stunTimer && (m.guardBreakTimer || 0) <= 0) {
        const playerLeft = (this.player.x + this.player.w / 2) < (m.x + m.w / 2);
        const facingPlayer = playerLeft ? m.face < 0 : m.face > 0;
        if (facingPlayer) {
          finalDmg *= (1 - m.trait.guard);
          guarded = true;
          const breaker = opts.crit || opts.stun || opts.source === 'skill' ||
            opts.source === 'nova' || opts.source === 'dash';
          if (breaker) {
            m.guardBreakTimer = 2.2;
            guardBroken = true;
          }
        }
      }
      const real = m.hurt(finalDmg, {
        crit: opts.crit,
        knockback: opts.knockback,
        stun: opts.stun,
        source: opts.source,
        attacker: this.player,
        ignoreInvuln: true
      });
      if (real > 0) {
        const cx = m.x + m.w / 2, cy = m.y - 8;
        window.Effects.damageText(cx, cy, real, { crit: !!opts.crit, color: opts.color });
        window.Effects.spawnParticles(cx, m.y + m.h / 2, opts.color || '#ff6a5e', opts.crit ? 12 : 5, {
          speed: opts.crit ? 220 : 130, life: 0.35, size: opts.crit ? 4 : 2, glow: !!opts.crit
        });
        if (guarded) {
          window.Effects.text(cx, cy - 18, guardBroken ? 'ПРОБОЙ' : 'БЛОК', {
            color: guardBroken ? '#ffd24a' : '#a8b0c8', size: guardBroken ? 12 : 10, life: 0.55
          });
          window.Effects.spawnParticles(cx, m.y + m.h * 0.45, '#ffd24a', guardBroken ? 12 : 5, {
            speed: 90, up: 50, life: 0.3, glow: true, size: 2
          });
        }
        if (opts.crit) {
          Camera.addTrauma(0.18);
          Engine.hitStop(0.04);
          AudioFX.play('crit');
          if (window.TG) window.TG.haptic('medium');
        } else {
          AudioFX.play('hit');
        }
        const lifesteal = (this.player.stats && this.player.stats.lifesteal) || 0;
        if (lifesteal > 0 && (opts.source === 'basic' || opts.source === 'skill' || opts.source === 'dash' || opts.source === 'nova' || opts.source === 'projectile')) {
          const healed = real * lifesteal;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + healed);
          if (healed >= 2) window.Effects.text(this.player.x + this.player.w / 2, this.player.y - 6, '+' + Math.round(healed), { color: '#6aff9a', size: 11, life: 0.6 });
        }
        if (m.dead) this.onMonsterKilled(m);
      }
      return real;
    },

    hurtPlayer(amount, opts) {
      opts = opts || {};
      if (!this.player || this.player.dead || this.state !== 'play') return 0;
      const source = opts.source || '';
      const dodgeable = source === 'melee' || source === 'projectile' || source.indexOf('boss') === 0;
      const dodging = dodgeable && this.player.invulnTimer > 0 && this.player.dodgeInvuln > 0;
      const real = this.player.hurt(amount, opts);
      if (real === 0 && dodging) {
        const mpBefore = this.player.mp;
        this.player.dodgeInvuln = 0;
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 4);
        const gained = Math.round(this.player.mp - mpBefore);
        const cx = this.player.x + this.player.w / 2;
        const cy = this.player.y + this.player.h * 0.45;
        window.Effects.text(cx, cy - 26, 'УКЛОНЕНИЕ', { color: '#7ad7ff', size: 12, life: 0.7 });
        if (gained > 0) {
          window.Effects.text(cx, cy - 42, '+' + gained + ' MP', { color: '#8ae6ff', size: 10, life: 0.55 });
        }
        window.Effects.ring({ x: cx, y: cy, r0: 10, maxR: 64, life: 0.3, color: '#7ad7ff', width: 3 });
        AudioFX.play('dash');
        if (window.TG) window.TG.haptic('light');
      }
      if (real > 0) {
        window.Effects.damageText(this.player.x + this.player.w / 2, this.player.y - 10, real, { color: '#ff6a6a', size: 15 });
        window.Effects.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ff5a5a', 8, { speed: 150, life: 0.4 });
        Camera.addTrauma(0.32);
        Engine.hitStop(0.04);
        window.Effects.flash('#ff2a2a', 0.10, 0.1);
        AudioFX.play('hurt');
        if (window.TG) window.TG.haptic('heavy');
        if (this.boss && this.boss.engaged && !this.boss.dead) this.bossRun.noHit = false;
        if (this.player.dead) this.onPlayerDeath();
      }
      return real;
    },

    onMonsterKilled(m) {
      if (!m || m._killed) return;
      m._killed = true;
      this.stats.kills++;
      this.player.kills = this.stats.kills;

      const base = m.statsBase || { hp: 60, atk: 10 };
      const xpBase = m.isBoss ? Object.assign({}, base, { hp: Math.min(base.hp, 2200) }) : base;
      const xp = Math.round(F.enemyXp(xpBase, m.isBoss, this.chapter.id) * (m.elite ? 1.35 : 1) * (m.summoned ? 0.2 : 1));
      if (xp > 0) {
        this.addXp(xp);
        window.Effects.text(m.x + m.w / 2, m.y - 24, '+' + xp + ' XP', { color: '#6ad7ff', size: 11, life: 0.8 });
      }

      if (!m.summoned) {
        const loot = window.Loot.rollEnemy(m.lootId || 'guardian', { isBoss: m.isBoss, elite: m.elite });
        if (m.isBoss) this.guaranteeBossGear(loot, m);
        this.grantLoot(loot, m.name, m.isBoss);
      }

      if (!this.contractRun) {
        window.Quests.emit('kill', {
          chapterId: this.chapter.id,
          target: m.lootId || 'guardian',
          isBoss: m.isBoss,
          amount: 1
        });
      }

      if (m.isBoss) {
        this.stats.bosses++;
        if (!this.contractRun) {
          window.Quests.emit('boss', { chapterId: this.chapter.id, target: m.lootId, amount: 1 });
          if (this.bossRun.noHit) window.Quests.emit('bossNoHit', { chapterId: this.chapter.id, amount: 1 });
          if (this.bossRun.noPotion) window.Quests.emit('noPotionBoss', { chapterId: this.chapter.id, amount: 1 });
        }
        this.onBossKilled(m);
      }

      this.checkChapterClear();
      this.persist();
    },

    onBossKilled(boss) {
      const contractRun = !!this.contractRun;
      UI.hideBossCast();
      window.Effects.flash('#fff', 0.5, 0.35);
      window.Effects.ring({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, maxR: 320, life: 0.9, color: '#ffd24a', width: 8 });
      window.Effects.spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffd24a', 50, {
        speed: 380, up: 200, life: 1.1, size: 4, glow: true
      });
      window.Effects.flash('#ffd24a', 0.3, 0.3);
      Camera.addTrauma(0.8);
      Engine.hitStop(0.12);
      AudioFX.play('death');
      if (window.TG) window.TG.haptic('success');
      // Минионы гибнут вместе с хозяином
      for (const m of this.monsters) {
        if (m !== boss && !m.dead && m.summoned) {
          m.dead = true;
          m.deathTimer = 0.6;
          window.Effects.spawnParticles(m.x + m.w / 2, m.y + m.h / 2, '#a06cff', 10, { speed: 140, life: 0.5, glow: true });
        }
      }
      window.Effects.projectiles = window.Effects.projectiles.filter((p) => p.owner !== 'enemy');
      window.Effects.zones = window.Effects.zones.filter((z) => z.owner !== 'enemy');
      window.Effects.telegraphs.length = 0;
      const shadowDef = window.ShadowArmy && window.ShadowArmy.def(boss.lootId);
      const canExtract = !contractRun && !!shadowDef && !this.hasShadow(shadowDef.id) &&
        (shadowDef.id === 'igris' || this.hasShadow('igris'));
      if (canExtract) {
        this._shadowAvailable = true;
        this._shadowExtractionId = shadowDef.id;
        // История зоны не должна перебивать церемонию извлечения.
        this._pendingZoneStory = null;
      }
      if (this.activeContract) this.resolveContractBossKill();
      this.checkChapterClear();
    },

    checkChapterClear() {
      if (!this.boss || !this.boss.dead) return;
      if (this._shadowAvailable && !this._extractionStarted) {
        if (!this.monsters.some((m) => !m.dead && !m.summoned)) {
          this.startShadowExtraction();
          return;
        }
      }
      if (this._finishing || this._extractionStarted) return;
      if (this.monsters.some((m) => !m.dead && !m.summoned)) return;
      this._finishing = true;
      UI.toast('Победа', 'Босс повержен. Глава завершена.', { color: '#ffd24a', duration: 2600 });
      window.Effects.timer(1.3, () => {
        if (this.state === 'play') this.finishChapter();
      });
    },

    finishChapter() {
      if (this.state === 'chapterEnd') return;
      if (this.contractRun) {
        const failed = this.contractOutcome === 'failed';
        this.contractRun = false;
        this.contractOutcome = null;
        this.state = 'chapterEnd';
        this.persist();
        const back = this.unlocked;
        Dialogue.start([{
          speaker: 'Система',
          text: failed
            ? 'Контракт провален. Возвращаемся в штаб Ахджин — попробуйте снова.'
            : 'Контракт завершён. Возвращаемся в штаб Ахджин — награда уже в инвентаре.'
        }], () => {
          this.state = 'play';
          this.startChapter(back, { replay: true });
          UI.toast('Штаб Ахджин', 'Новые контракты дня доступны в хабе (G).', {
            color: '#e8c76a', duration: 4200
          });
        });
        return;
      }
      this.state = 'chapterEnd';
      const ch = this.chapter;
      window.Quests.emit('chapter', { chapterId: ch.id, amount: 1 });
      this.persist();
      const nextIdx = this.chapterIndex + 1;
      const wasReplay = this.chapterIndex < this.unlocked;
      const outro = wasReplay ? [] : this.makeStoryLines(ch.storyOutro);

      if (wasReplay) {
        Dialogue.start([{
          speaker: 'Система',
          text: 'Глава ' + ch.id + ' пройдена повторно. Возвращаемся в штаб — прогресс и награды сохранены.'
        }], () => {
          this.state = 'play';
          this.startChapter(this.unlocked, { replay: false });
        });
        return;
      }

      if (nextIdx < this.chapters.length) {
        this.unlocked = Math.max(this.unlocked, nextIdx);
        this.persist();
        const next = this.chapters[nextIdx];
        Dialogue.start(outro.concat([{
          speaker: 'Система',
          text: 'Задание главы выполнено. Открывается глава ' + next.id + ': «' + next.title.replace(/^Глава \d+\.\s*/, '') + '».'
        }]), () => {
          this.state = 'play';
          this.startChapter(nextIdx, { replay: false });
        });
      } else {
        this.finished = true;
        this.unlocked = this.chapters.length - 1;
        this.persist();
        Dialogue.start(outro.concat([{
          speaker: 'Система',
          text: 'Антарес пал. Врата между мирами закрыты. Сон Джин-Ву стал Монархом Теней и защитил свой мир. История завершена — спасибо, что играли!'
        }]), () => {
          this.state = 'play';
          UI.showVictory(this);
          window.Effects.flash('#ffd24a', 0.35, 0.4);
          window.Effects.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ffd24a', 60, {
            speed: 360, up: 240, life: 1.6, size: 4, glow: true
          });
          UI.toast('Финал', 'Все главы пройдены. Скрытые квесты и тайники остаются доступны.', { color: '#e8c76a', duration: 6000 });
        });
      }
    },

    onPlayerDeath() {
      if (this.state === 'dead') return;
      if (this.activeContract) this.failContract('герой погиб');
      this.state = 'dead';
      this.stats.deaths++;
      AudioFX.play('death');
      UI.showDeath(this);
      UI.setHint('');
      this.persist();
    },

    respawn() {
      this.persist();
      UI.hideDeath();
      this.state = 'play';
      const atShrine = !!(this.world && this.world.checkpointX);
      this.startChapter(this.chapterIndex, { replay: true, respawn: true });
      UI.toast('Возрождение', atShrine
        ? 'HP и мана восстановлены. Вы у последнего алтаря.'
        : 'HP и мана восстановлены. Глава начнётся заново.', { color: '#6aff9a' });
      AudioFX.play('heal');
    },

    // ---------- Награды и предметы ----------
    addXp(amount) {
      if (!amount) return;
      const before = Object.assign({}, this.progress.stats);
      const res = this.progress.addXp(amount);
      if (res.levels > 0) {
        const oldHp = this.player.maxHp, oldMp = this.player.maxMp;
        this.player.syncStats(this.progress.stats, false);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.max(0, this.player.maxHp - oldHp) + this.player.maxHp * 0.25);
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + Math.max(0, this.player.maxMp - oldMp) + this.player.maxMp * 0.35);
        const dHp = this.progress.stats.maxHp - before.maxHp;
        const dAtk = this.progress.stats.atk - before.atk;
        const dDef = this.progress.stats.def - before.def;
        UI.showLevelUp(this.progress.level,
          '+' + dHp + ' HP · +' + dAtk + ' ATK · +' + dDef + ' DEF · +1 очко таланта');
        this.player.hp = Math.min(this.player.maxHp, this.player.hp);
        this.player.mp = Math.min(this.player.maxMp, this.player.mp);
        window.Quests.emit('level', { level: this.progress.level });
        window.Effects.ring({ x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2, maxR: 220, life: 0.8, color: '#ffd24a', width: 6 });
        window.Effects.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ffd24a', 30, { speed: 260, up: 140, life: 0.9, glow: true });
        if (window.TG) window.TG.haptic('success');
      }
    },

    guaranteeBossGear(loot, boss) {
      const hasGear = (loot.items || []).some((entry) => {
        const item = window.Loot.item(entry.id);
        return item && ['weapon', 'armor', 'accessory'].includes(item.type);
      });
      if (hasGear) return;
      const byBoss = {
        'statue-of-god': 'hunter-dagger',
        'reed-boss': 'frost-blade',
        'baruka': 'frost-mail',
        'igris': 'demon-knight-blade',
        'beru': 'shadow-amulet',
        'ashborn': 'monarch-cloak',
        'antares': 'monarch-seal',
        'architect': 'demon-plate'
      };
      let id = byBoss[boss.lootId];
      if (!id) {
        const chapter = this.chapter ? this.chapter.id : 1;
        id = chapter >= 10 ? 'shadow-amulet' : chapter >= 5 ? 'frost-blade' : 'hunter-jacket';
      }
      loot.items = loot.items || [];
      loot.items.push({ id, qty: 1 });
    },

    grantLoot(result, sourceName, notable) {
      if (!result) return;
      if (result.gold > 0) {
        this.progress.addGold(result.gold);
        if (notable) {
          UI.toast('Золото', '◈ +' + result.gold + (sourceName ? ' · ' + sourceName : ''), { color: '#e8c76a', duration: 2600 });
          AudioFX.play('coin');
        }
      }
      (result.items || []).forEach((entry) => {
        this.grantItem(entry.id, entry.qty, { notable: !!notable });
      });
    },

    grantItem(id, qty, opts) {
      opts = opts || {};
      const item = window.Loot.item(id);
      if (!item) return;
      this.inventory.add(id, qty);
      window.Quests.emit('collect', { target: id, amount: qty, chapterId: this.chapter ? this.chapter.id : null });
      const notable = opts.notable || item.rarity === 'epic' || item.rarity === 'legendary' ||
        ['weapon', 'armor', 'accessory'].includes(item.type) || item.rarity === 'rare';
      if (notable) {
        UI.toast('Получено', item.name + (qty > 1 ? ' ×' + qty : ''), {
          icon: item.icon, color: window.Loot.rarityColor(item.rarity), duration: 3000
        });
        AudioFX.play('pickup');
      }
    },

    grantRewards(rewards) {
      if (!rewards) return;
      if (rewards.xp) this.addXp(rewards.xp);
      if (rewards.gold) this.progress.addGold(rewards.gold);
      if (rewards.talentPoints) this.progress.talentPoints += rewards.talentPoints;
      (rewards.items || []).forEach((it) => this.grantItem(it.id, it.qty, { notable: true }));
      UI.update(this);
      this.persist();
    },

    usePotion() {
      if (this.state !== 'play' || !this.player || this.player.dead) return;
      const p = this.player;
      if (p.hp >= p.maxHp - 1) {
        UI.toast('Зелье', 'HP уже полны', { color: '#9aa0c0' });
        return;
      }
      const missing = p.maxHp - p.hp;
      const options = [
        { id: 'hp-potion-small', amount: 150 },
        { id: 'hp-potion-medium', amount: 380 },
        { id: 'hp-potion-large', amount: p.maxHp * 0.5 }
      ].filter((o) => this.inventory.count(o.id) > 0);
      if (!options.length) {
        UI.toast('Зелье', 'Нет зелий лечения. Откройте лавку (I).', { color: '#ff9a6a' });
        AudioFX.play('error');
        return;
      }
      if (this.activeContract && this.activeContract.modifier === 'no-potion') {
        this.failContract('условие «без зелий» нарушено');
        return;
      }
      const chosen = (options.find((o) => o.amount >= missing * 0.75) || options[options.length - 1]).id;
      this.useItem(chosen);
    },

    useItem(id) {
      const item = window.Loot.item(id);
      if (!item || !this.inventory.count(id)) return false;
      const p = this.player;
      if (item.type === 'consumable' && item.use) {
        const use = item.use;
        let used = false;
        if (use.heal) {
          if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + use.heal); used = true; }
        }
        if (use.healPct) {
          if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * use.healPct); used = true; }
        }
        if (use.mana) {
          if (p.mp < p.maxMp) { p.mp = Math.min(p.maxMp, p.mp + use.mana); used = true; }
        }
        if (use.full) {
          if (p.hp < p.maxHp || p.mp < p.maxMp) { p.hp = p.maxHp; p.mp = p.maxMp; used = true; }
        }
        if (!used) {
          UI.toast('Предмет', 'Сейчас это не требуется', { color: '#9aa0c0' });
          return false;
        }
        this.inventory.remove(id, 1);
        if (item.type === 'consumable' && this.boss && this.boss.engaged && !this.boss.dead) this.bossRun.noPotion = false;
        window.Effects.spawnParticles(p.x + p.w / 2, p.y + p.h / 2, use.mana ? '#4aa8ff' : '#6aff9a', 14, { speed: 120, up: 80, life: 0.7, glow: true });
        AudioFX.play('heal');
        UI.toast('Использовано', item.name, { icon: item.icon, color: window.Loot.rarityColor(item.rarity), duration: 1800 });
        UI.update(this);
        this.persist();
        return true;
      }
      if (item.type === 'elixir' && item.use) {
        this.progress.applyPermanent(item.use);
        this.player.syncStats(this.progress.stats, false);
        this.inventory.remove(id, 1);
        window.Effects.ring({ x: p.x + p.w / 2, y: p.y + p.h / 2, maxR: 120, life: 0.6, color: '#ffd24a', width: 4 });
        AudioFX.play('levelup');
        UI.toast('Сила навсегда', item.desc, { icon: item.icon, color: '#ffd24a' });
        this.persist();
        return true;
      }
      if (['weapon', 'armor', 'accessory'].includes(item.type)) return this.equipItem(id);
      AudioFX.play('error');
      UI.toast('Предмет', 'Материал можно продать в инвентаре.', { icon: item.icon, color: '#9aa0c0' });
      return false;
    },

    equipItem(id) {
      const res = this.inventory.equip(id);
      if (!res.ok) { UI.toast('Экипировка', res.reason, { color: '#ff9a6a' }); return false; }
      this.progress.recalc();
      this.player.syncStats(this.progress.stats, false);
      const item = res.item;
      UI.toast('Экипировано', item.name + (res.replaced ? ' (заменено: ' + res.replaced.name + ')' : ''), {
        icon: item.icon, color: window.Loot.rarityColor(item.rarity)
      });
      AudioFX.play('pickup');
      this.persist();
      return true;
    },

    unequipItem(slot) {
      const res = this.inventory.unequip(slot);
      if (!res.ok) return false;
      this.progress.recalc();
      this.player.syncStats(this.progress.stats, false);
      UI.toast('Снято', res.item.name, { icon: res.item.icon, color: window.Loot.rarityColor(res.item.rarity) });
      this.persist();
      return true;
    },

    sellItem(id) {
      const item = window.Loot.item(id);
      if (!item || !this.inventory.count(id)) return false;
      this.inventory.remove(id, 1);
      this.progress.addGold(item.value || 1);
      AudioFX.play('coin');
      UI.toast('Продано', item.name + ' · ◈+' + (item.value || 1), { color: '#e8c76a', duration: 1800 });
      this.persist();
      return true;
    },

    buyItem(id, price) {
      if (!this.progress.spendGold(price)) {
        AudioFX.play('error');
        UI.toast('Лавка', 'Не хватает золота', { color: '#ff9a6a' });
        return false;
      }
      this.grantItem(id, 1, { notable: true });
      AudioFX.play('coin');
      this.persist();
      return true;
    },

    learnTalent(id) {
      const res = this.progress.learn(id);
      if (res.ok) {
        this.player.syncStats(this.progress.stats, false);
        this.persist();
      }
      return res;
    },

    toggleMute() {
      this.settings.muted = !this.settings.muted;
      AudioFX.setMuted(this.settings.muted);
      this.persist();
    },

    toggleShake() {
      this.settings.shake = !this.settings.shake;
      Engine.Camera.enabled = this.settings.shake;
      if (!this.settings.shake) Engine.Camera.trauma = 0;
      this.persist();
    },

    toggleTouchControls() {
      this.settings.touch = !this.settings.touch;
      this.settings.touchUser = true;
      UI.enableTouch(this.settings.touch);
      UI.applyHandedness();
      this.persist();
    },

    toggleHandedness() {
      this.settings.leftHanded = !this.settings.leftHanded;
      UI.applyHandedness();
      this.persist();
    },

    resetProgress() {
      window.SaveSystem.clear();
      this.progress.reset();
      this.inventory = new window.Inventory();
      this.progress.inventory = this.inventory;
      this.progress.recalc();
      window.Quests.reset();
      window.Combat.reset();
      this.chapterIndex = 0;
      this.unlocked = 0;
      this.stats = { kills: 0, deaths: 0, bosses: 0, chests: 0, secrets: 0 };
      this.savedWorld = {};
      this.storySeen = {};
      this.shadows = emptyShadows();
      this.contracts = emptyContracts();
      this.activeContract = null;
      this.contractRun = false;
      this.contractOutcome = null;
      this.finished = false;
      this._newGame = true;
      UI.closeAllPanels();
      this.startChapter(0, { replay: false });
      UI.toast('Новая игра', 'Прогресс сброшен. Удачи, охотник.', { color: '#ffd24a' });
    },

    startChapterReplay(index) {
      if (index > this.unlocked) return;
      this.persist();
      this.startChapter(index, { replay: index < this.unlocked });
      UI.showChapterBanner('Глава ' + this.chapters[index].id, 'Повторное прохождение');
    },

    // ---------- Квесты и мир ----------
    onQuestsChanged() {
      if (!window.UI || !UI.game) return;
      UI.refreshTracker();
      if (UI.quest && UI.quest.style.display !== 'none') UI.renderQuests();
    },

    onQuestComplete(q) {
      UI.toast('Задание выполнено', q.title, { color: '#4ce87a', duration: 4000 });
      AudioFX.play('quest');
      if (window.TG) window.TG.haptic('success');
      this.persist();
    },

    notifyHiddenQuest(q) {
      UI.toast('СКРЫТЫЙ КВЕСТ', q.title + ' — ' + q.desc, { color: '#e8c76a', duration: 6000 });
      AudioFX.play('secret');
      if (window.TG) window.TG.haptic('success');
      this.persist();
    },

    onChestOpened(chest) {
      this.stats.chests++;
      const result = window.Loot.rollChest(chest.tier);
      this.grantLoot(result, 'Сундук', true);
      window.Quests.emit('chest', { chapterId: this.chapter.id, amount: 1 });
      this.addXp(10 + this.chapter.id * 4);
      this.persist();
    },

    onSecretFound(secret) {
      this.stats.secrets++;
      const result = window.Loot.rollChest(secret.chestTier);
      this.grantLoot(result, secret.name, true);
      window.Quests.emit('secret', { chapterId: this.chapter.id, amount: 1 });
      this.addXp(25 + this.chapter.id * 6);
      UI.toast('Тайник найден', secret.name + '. ' + secret.lore, { color: '#6ad7ff', duration: 6000 });
      this.persist();
    },

    onArmorRack(rack) {
      if (!rack) return;
      const elite = !!rack.elite;
      this.spawnEnemy('demon-knight', rack.x + 92, {
        elite,
        name: elite ? 'Демонический капитан' : null
      });
      const left = this.world.racks.filter((r) => !r.broken).length;
      UI.toast('Проклятие снято', elite
        ? 'Из доспехов поднимается демонический капитан!'
        : (left > 0 ? 'Доспехи павшего рыцаря освобождены. Осталось стоек: ' + left : 'Последняя стойка разрушена.'), {
        color: '#c08cff', duration: 3000
      });
      window.Quests.emit('armor', { chapterId: this.chapter.id, amount: 1 });
      Camera.addTrauma(0.18);
      window.Effects.flash('#a06cff', 0.08, 0.12);
      AudioFX.play('boss');
      this.persist();
    },

    onQuestObject(obj) {
      if (!obj) return;
      const brazier = obj.kind === 'brazier';
      if (obj.enemy) {
        for (let i = 0; i < obj.enemyCount; i++) {
          this.spawnEnemy(obj.enemy, obj.x + 92 + i * 44, {});
        }
      }
      if (brazier) {
        const p = this.player;
        if (p) p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.12));
        window.Effects.flash('#ffb36a', 0.06, 0.12);
        window.Effects.ring({ x: obj.x + obj.w / 2, y: obj.y + 10, maxR: 130, life: 0.7, color: '#ffd24a', width: 4 });
      } else {
        window.Effects.flash('#b6ffe0', 0.05, 0.12);
      }
      window.Quests.emit(obj.event, {
        chapterId: this.chapter.id,
        target: obj.kind,
        amount: 1
      });
      const left = this.world.questObjects.filter((q) => !q.done).length;
      UI.toast(brazier ? 'Жаровня зажжена' : 'Живой найден', brazier
        ? 'Тепло возвращается в лагерь. Осталось жаровен: ' + left
        : 'Раненый выбирается к своим. Осталось найти: ' + left, {
        color: brazier ? '#ffd24a' : '#7affc8', duration: 3000
      });
      AudioFX.play(brazier ? 'secret' : 'heal');
      this.persist();
    },

    onPuzzleSolved(puzzle) {
      window.Quests.emit('puzzle', { chapterId: this.chapter.id, amount: 1 });
      this.addXp(35 + this.chapter.id * 8);
      this.progress.addGold(30 + this.chapter.id * 10);
      UI.toast('Загадка решена', puzzle.name + '. ' + puzzle.lore, { color: '#c08cff', duration: 6000 });
      this.persist();
    },

    onBossCast(atk, windup) {
      if (!atk || !this.boss || this.boss.dead) return;
      const labels = {
        slam: 'УДАР', beam: 'ЛУЧ', fan: 'ВЕЕР', rain: 'ГРАД', nova: 'НОВА',
        zone: 'ЗОНА', summon: 'ПРИЗЫВ', dash: 'РЫВОК', shield: 'ЩИТ',
        heal: 'ЛЕЧЕНИЕ', teleport: 'ТЕЛЕПОРТ'
      };
      const cues = {
        slam: 'bossWarnHeavy', beam: 'bossWarnHeavy', nova: 'bossWarnHeavy', rain: 'bossWarnHeavy',
        fan: 'bossWarnQuick', dash: 'bossWarnQuick',
        zone: 'bossWarnMagic', summon: 'bossWarnMagic', shield: 'bossWarnMagic',
        heal: 'bossWarnMagic', teleport: 'bossWarnMagic'
      };
      if (window.UI && UI.showBossCast) {
        UI.showBossCast(atk.name, windup, atk.color, labels[atk.type] || 'АТАКА');
      }
      if (window.AudioFX) AudioFX.play(cues[atk.type] || 'bossWarnQuick');
    },

    onBossIntro(boss) {
      if (this.bossIntroShown) return;
      this.bossIntroShown = true;
      this.bossRun = { noHit: true, noPotion: true };
      const cutin = this.world && this.world.cutinPath;
      if (cutin) {
        UI.showCutin({
          image: cutin,
          eyebrow: 'БОСС',
          name: boss.name,
          subtitle: boss.subtitle || (this.world.arena && this.world.arena.name) || '',
          quote: (boss.bossData && boss.bossData.intro) || '',
          boss: true,
          duration: 4200
        });
        AudioFX.play('boss');
        Camera.addTrauma(0.45);
        if (window.TG) window.TG.haptic('warning');
      } else {
        UI.showBossIntro(boss);
      }
    },

    onBossEngaged(boss) {
      UI.toast('Босс пробудился', boss.name + ' заметил вас. Готовьтесь!', { color: '#ff8a8a', duration: 2800 });
      AudioFX.play('boss');
      Camera.addTrauma(0.25);
      if (!this._bossDlgPlayed && !this.contractRun && this.chapter && this.chapter.bossDialogue) {
        const lines = this.makeStoryLines(this.chapter.bossDialogue);
        if (lines.length) {
          this._bossDlgPlayed = true;
          Dialogue.start(lines);
        }
      }
    },

    onBossPhase(boss, phase) {
      const levelBarks = (this.world && this.world.data && this.world.data.bossBarks) || null;
      const barks = (levelBarks && levelBarks.phase) || (boss.bossData && boss.bossData.phaseBarks) || [];
      const bark = barks[Math.max(0, phase - 1)];
      if (bark) {
        UI.showBossBark(boss.name, bark, { duration: 3400 });
      } else {
        UI.toast('Фаза ' + (phase + 1), boss.name + ' меняет тактику', { color: '#ffd24a', duration: 2600 });
      }
      AudioFX.play('boss');
      Camera.addTrauma(0.35);
    },

    onBossEnrage(boss) {
      const label = (boss.bossData.enrage && boss.bossData.enrage.label) || 'ЯРОСТЬ';
      const levelBarks = (this.world && this.world.data && this.world.data.bossBarks) || null;
      const bark = (levelBarks && levelBarks.enrage) || boss.bossData.enrageBark;
      if (bark) {
        UI.showBossBark(boss.name + ' · ' + label, bark, { duration: 3600 });
      } else {
        UI.toast('ЯРОСТЬ БОССА', label, { color: '#ff4a4a', duration: 3200 });
      }
      UI.setHint('Босс в ярости! Уклоняйтесь!');
      if (window.TG) window.TG.haptic('warning');
    },

    onBossShield(boss, time) {
      UI.toast('Босс', boss.name + ' блокирует урон ' + time.toFixed(1) + ' с', { color: '#ffd24a', duration: 1800 });
    },

    // ---------- Взаимодействие ----------
    tryInteract() {
      if (this.state !== 'play' || UI.isModalOpen() || Dialogue.active || this.player.dead) return;
      if (this.world.tryInteract(this.player, this)) return;

      const p = this.player;
      let nearest = null, bestD = 1e9;
      for (const n of this.npcs) {
        if (n.talked && !(n.repeat && n.repeat.length)) continue;
        const a = n.actor;
        const d = Math.abs((a.x + a.w / 2) - (p.x + p.w / 2));
        if (d < 78 && Math.abs(a.y - p.y) < 80 && d < bestD) { bestD = d; nearest = n; }
      }
      if (nearest) {
        if (!nearest.talked) {
          nearest.talked = true;
          if (window.Quests.countTalked(this.chapter.id, nearest.charId)) {
            window.Quests.emit('talk', { chapterId: this.chapter.id, target: nearest.charId, amount: 1 });
          }
          this.runChapterDialogue(nearest.actor);
        } else {
          this.startNpcLines(nearest, nearest.repeat);
        }
        return;
      }
      if (this.npcs.length && this.npcs.every((n) => n.talked) && !this._chapterDlgShown) {
        this._chapterDlgShown = true;
        this.runChapterDialogue(null);
      }
    },

    runChapterDialogue(npcActor) {
      const entry = npcActor ? this.npcs.find((n) => n.actor === npcActor) : null;
      if (entry && entry.lines && entry.lines.length) {
        this.startNpcLines(entry, entry.lines);
        return;
      }
      const lines = this.chapter.dialogues || [];
      let selected;
      if (npcActor && entry) {
        selected = lines.filter((l) => l.speaker === entry.charId);
        if (!selected.length) selected = lines.slice(0, 2);
      } else {
        selected = lines;
      }
      Dialogue.start(this.makeStoryLines(selected));
    },

    startNpcLines(entry, lines) {
      const raw = (lines || []).map((l) => {
        if (typeof l === 'string') return { speaker: entry.actor.name, text: l };
        return l;
      });
      const named = this.makeStoryLines(raw);
      if (!named.length) return;
      if (entry) named.forEach((l) => { if (!l.icon && entry.charId) l.icon = 'assets/sprites/portraits/' + entry.charId + '.png'; });
      Dialogue.start(named);
    },

    onZoneEntered(zone) {
      if (!zone) return;
      const first = this.world.zones[0] && this.world.zones[0].id === zone.id;
      if (!first) {
        UI.showZoneBanner(zone.name, zone.subtitle);
        AudioFX.play('ui');
      }
      if (zone.story && zone.story.length) {
        const lines = this.makeStoryLines(zone.story);
        if (lines.length) {
          this._pendingZoneStory = lines;
          this._zoneStoryDelay = 0.65;
        }
      }
      this.persist();
    },

    onSceneTrigger(scene) {
      if (!scene) return;
      const lines = this.makeStoryLines(scene.lines);
      this.persist();
      if (!lines.length) return;
      this.state = 'scene';
      if (scene.cutin) {
        UI.showCutin({
          image: scene.cutin,
          eyebrow: 'СЦЕНА',
          name: scene.title,
          subtitle: scene.subtitle
        });
      }
      UI.showCinema(scene.title, scene.subtitle);
      AudioFX.play('ui');
      Dialogue.start(lines, () => {
        if (this.state === 'scene') this.state = 'play';
        UI.hideCinema();
        UI.hideCutin();
        this.persist();
      });
    },

    showLore(lore, first) {
      if (!lore) return;
      Dialogue.start([{ speaker: lore.title, text: lore.text, icon: null }]);
      if (first) {
        UI.toast('Запись найдена', lore.title + ' · +' + (lore.xp || 18) + ' XP', { color: '#ffd24a', duration: 3200 });
      }
    },

    // ---------- Отрисовка ----------
    render() {
      if (this.loading || !this.world || !this.player) return;
      const ctx = Engine.ctx;
      const cam = Engine.Camera;
      ctx.clearRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
      this.world.drawBackground(ctx);

      ctx.save();
      ctx.translate(Math.round(-cam.x + cam.shakeX), Math.round(-cam.y + cam.shakeY));

      this.world.draw(ctx);
      window.Effects.renderUnder(ctx);

      const actors = [];
      for (const n of this.npcs) actors.push({ a: n.actor, kind: 'npc', ref: n });
      for (const a of this.allies) actors.push({ a, kind: 'ally' });
      for (const m of this.monsters) {
        if (!m.dead || m.deathTimer > 0) actors.push({ a: m, kind: 'monster' });
      }
      actors.push({ a: this.player, kind: 'player' });
      actors.sort((x, y) => (x.a.y + x.a.h) - (y.a.y + y.a.h));

      for (const entry of actors) {
        entry.a.draw(ctx);
        if (entry.kind === 'npc' && !entry.ref.talked && !entry.a.dead) {
          const bob = Math.sin(Effects.time * 3 + entry.a.x) * 3;
          ctx.save();
          ctx.fillStyle = '#ffd24a';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.lineWidth = 3;
          ctx.strokeText('!', entry.a.x + entry.a.w / 2, entry.a.getDrawY() - 18 + bob);
          ctx.fillText('!', entry.a.x + entry.a.w / 2, entry.a.getDrawY() - 18 + bob);
          ctx.restore();
        }
      }

      window.Effects.renderOver(ctx);

      // Туман/атмосфера поверх мира
      ctx.save();
      ctx.fillStyle = this.world.theme.fog;
      ctx.fillRect(cam.x, cam.y, Engine.CANVAS_W, Engine.CANVAS_H);
      ctx.restore();

      ctx.restore();

      window.Effects.renderScreen(ctx);
      this.renderVignette(ctx);
      this.renderAim(ctx);
      this.renderBossArrow(ctx);
    },

    monsterAtWorld(x, y) {
      for (const m of this.monsters) {
        if (m.dead) continue;
        if (x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) return m;
      }
      return null;
    },

    renderAim(ctx) {
      const I = Engine.Input;
      const canAim = this.state === 'play' && this.player && !this.player.dead &&
        !Dialogue.active && !UI.isModalOpen();
      if (!canAim) {
        Engine.canvas.style.cursor = 'default';
        return;
      }
      const skill = window.Combat.skills[this.selectedSkill];
      const color = skill ? skill.color : '#bfe6ff';

      if (I.mouse.overCanvas && I.mouse.active) {
        Engine.canvas.style.cursor = 'none';
        const sx = I.mouse.screenX;
        const sy = I.mouse.screenY;
        const mw = I.mouseWorld();
        const target = this.monsterAtWorld(mw.x, mw.y);
        const cx = this.player.x + this.player.w / 2 - Engine.Camera.x;
        const cy = this.player.y + this.player.h * 0.45 - Engine.Camera.y;
        if (skill && (skill.type === 'projectile' || skill.type === 'dash')) {
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 7]);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        const tint = target ? '#ffd24a' : color;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = tint;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, target ? 11 : 8, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = tint;
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 + (Effects.time * 0.8);
          ctx.fillRect(Math.cos(a) * 15 - 1, Math.sin(a) * 15 - 1, 2, 2);
        }
        ctx.fillRect(-1, -1, 2, 2);
        if (target) {
          const tx = target.x + target.w / 2 - Engine.Camera.x;
          const ty = target.y - 18 - Engine.Camera.y;
          ctx.globalAlpha = 0.9 + Math.sin(Effects.time * 6) * 0.1;
          ctx.fillStyle = '#ffd24a';
          ctx.beginPath();
          ctx.moveTo(tx, ty); ctx.lineTo(tx + 4, ty + 5); ctx.lineTo(tx, ty + 10); ctx.lineTo(tx - 4, ty + 5);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      } else {
        Engine.canvas.style.cursor = 'default';
        if (I.touchMode && skill && (skill.type === 'projectile' || skill.type === 'dash')) {
          const target = this.nearestMonster(680);
          if (target) {
            const tx = target.x + target.w / 2 - Engine.Camera.x;
            const ty = target.y + target.h / 2 - Engine.Camera.y;
            ctx.save();
            ctx.globalAlpha = 0.6 + Math.sin(Effects.time * 5) * 0.2;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx - 22, ty); ctx.lineTo(tx - 12, ty);
            ctx.moveTo(tx + 12, ty); ctx.lineTo(tx + 22, ty);
            ctx.moveTo(tx, ty - 22); ctx.lineTo(tx, ty - 12);
            ctx.moveTo(tx, ty + 12); ctx.lineTo(tx, ty + 22);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    },

    renderVignette(ctx) {
      if (!this._vignette) {
        const g = ctx.createRadialGradient(480, 270, 170, 480, 270, 560);
        g.addColorStop(0, 'rgba(4,5,12,0)');
        g.addColorStop(0.65, 'rgba(4,5,12,0.12)');
        g.addColorStop(1, 'rgba(4,5,12,0.52)');
        this._vignette = g;
      }
      ctx.save();
      ctx.fillStyle = this._vignette;
      ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
      ctx.restore();
    },

    renderBossArrow(ctx) {
      const boss = this.boss;
      if (!boss || boss.dead || !boss.engaged) return;
      const cam = Engine.Camera;
      const sx = boss.x + boss.w / 2 - cam.x;
      if (sx > 0 && sx < Engine.CANVAS_W) return;
      const right = sx > 0;
      const x = right ? Engine.CANVAS_W - 34 : 34;
      const y = Engine.CANVAS_H - 150;
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(Effects.time * 4) * 0.2;
      ctx.fillStyle = '#ff4a4a';
      ctx.beginPath();
      if (right) {
        ctx.moveTo(x + 16, y); ctx.lineTo(x - 8, y - 12); ctx.lineTo(x - 8, y + 12);
      } else {
        ctx.moveTo(x - 16, y); ctx.lineTo(x + 8, y - 12); ctx.lineTo(x + 8, y + 12);
      }
      ctx.closePath(); ctx.fill();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('БОСС', x, y + 26);
      ctx.restore();
    }
  };

  // ---------- Публичный контракт ----------
  window.SoloGame = {
    loadData() {
      return Promise.all([
        fetchJson('src/data/chapters.json'),
        fetchJson('src/data/characters.json')
      ]).then(([chapters, characters]) => ({ chapters, characters }))
        .catch(() => ({ chapters: FALLBACK_CHAPTERS, characters: FALLBACK_CHARACTERS }));
    },
    getGame() { return Game; },
    respawn() { Game.respawn(); },
    Game
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Game.init());
  } else {
    Game.init();
  }
})();
