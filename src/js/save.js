// save.js — сохранение v4: миграция v1–v3, теневой легион, настройки, квесты, мир.
(function () {
  'use strict';

  const SAVE_KEY = 'solo-leveling-save';
  const VERSION = 4;

  const LEGACY_ITEM_MAP = {
    'Гоблин': 'goblin-fang',
    'Орк': 'orc-tusk',
    'Муравей-рыцарь': 'ant-carapace',
    'Ледяной медведь': 'bear-fur',
    'Статуя Бога': 'obsidian-shard',
    'Камышовый босс': 'temple-relic',
    'Барики': 'ice-crystal',
    'Игрис': 'demon-horn',
    'Бер': 'ant-carapace',
    'Эшборн': 'shadow-essence',
    'Антарас': 'dragon-scale',
    'Архитектор': 'obsidian-shard'
  };

  // v3 → v4: главы 5/6 переставлены, добавлен Демонический замок (глава 7).
  const OLD_CHAPTER_TO_NEW = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 5, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13 };
  const OLD_UNLOCKED_TO_NEW = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];

  function remapKeys(source) {
    const out = {};
    if (!source || typeof source !== 'object') return out;
    Object.keys(source).forEach((key) => {
      const mapped = OLD_CHAPTER_TO_NEW[key | 0];
      if (mapped) out[mapped] = source[key];
    });
    return out;
  }

  function migrateChapterOrder(data) {
    const last = 12;
    const oldIndex = Math.max(0, Math.min(11, data.chapterIndex | 0));
    const oldUnlocked = Math.max(0, Math.min(11, data.unlocked | 0));
    const finished = !!data.finished;
    let chapterIndex = finished ? last : (oldIndex <= 3 ? oldIndex : oldIndex <= 5 ? 4 : 6);
    let unlocked = finished ? last : Math.max(chapterIndex, OLD_UNLOCKED_TO_NEW[oldUnlocked] || 0);
    unlocked = Math.max(0, Math.min(last, unlocked));
    return Object.assign({}, data, {
      version: VERSION,
      chapterIndex,
      unlocked,
      world: remapKeys(data.world),
      storySeen: remapKeys(data.storySeen),
      contracts: { day: null, list: [] },
      migrated: true,
      migratedLore: true
    });
  }

  function migrateV1(old) {
    const level = Math.max(1, old.level | 0 || 1);
    const items = [];
    (old.items || []).forEach((entry) => {
      const id = LEGACY_ITEM_MAP[entry && entry.name];
      if (id) items.push({ id, qty: Math.max(1, entry.qty | 0 || 1) });
    });
    return migrateChapterOrder({
      version: VERSION,
      savedAt: Date.now(),
      chapterIndex: Math.max(0, old.chapterIndex | 0 || 0),
      unlocked: Math.max(0, old.unlocked | 0 || 0),
      progress: {
        level,
        xp: 0,
        gold: 0,
        talentPoints: Math.max(0, level - 1),
        talents: {},
        bonus: { atk: 0, hp: 0, mp: 0 }
      },
      inventory: { items, equipment: { weapon: null, armor: null, accessory: null } },
      quests: null,
      world: {},
      storySeen: {},
      stats: { kills: old.kills | 0 || 0, deaths: 0, bosses: 0, playTime: 0 },
      settings: { muted: false, shake: true, touch: false },
      shadows: { owned: {}, equipped: [] },
      finished: false,
      migrated: true
    });
  }

  function migrateV2(old) {
    return migrateChapterOrder(Object.assign({}, old, {
      version: VERSION,
      savedAt: Date.now(),
      shadows: old.shadows && typeof old.shadows === 'object'
        ? old.shadows
        : { owned: {}, equipped: [] },
      migrated: true
    }));
  }

  function migrateV3(old) {
    return migrateChapterOrder(Object.assign({}, old, {
      version: VERSION,
      savedAt: Date.now(),
      migrated: true
    }));
  }

  const Save = {
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        if (typeof data.chapterIndex !== 'number' || typeof data.unlocked !== 'number') return null;
        const version = data.version || 1;
        if (version < VERSION) {
          const migrated = version >= 3 ? migrateV3(data) : version >= 2 ? migrateV2(data) : migrateV1(data);
          this.write(migrated);
          return migrated;
        }
        data.version = VERSION;
        return data;
      } catch (e) {
        console.warn('Save.load: повреждённое сохранение, начинаем заново', e);
        return null;
      }
    },

    write(obj) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); return true; }
      catch (e) { console.warn('Save.write', e); return false; }
    },

    save(state) {
      const obj = {
        version: VERSION,
        savedAt: Date.now(),
        chapterIndex: Math.max(0, state.chapterIndex | 0),
        unlocked: Math.max(0, state.unlocked | 0),
        progress: state.progress || {},
        inventory: state.inventory || { items: [], equipment: {} },
        quests: state.quests || null,
        world: state.world || {},
        storySeen: state.storySeen || {},
        stats: state.stats || {},
        settings: state.settings || {},
        shadows: state.shadows || { owned: {}, equipped: [] },
        contracts: state.contracts || { day: null, list: [] },
        finished: !!state.finished
      };
      this.write(obj);
      if (window.TG && window.TG.isTelegram) {
        window.TG.cloudSet(SAVE_KEY, obj).catch(() => {});
      }
      return obj;
    },

    async loadAsync() {
      const local = this.load();
      if (!window.TG || !window.TG.isTelegram) return local;
      try {
        const cloud = await window.TG.cloudGet(SAVE_KEY);
        if (cloud && (!local || (cloud.savedAt || 0) > (local.savedAt || 0))) {
          const version = cloud.version || 1;
          if (version < VERSION) {
            const migrated = version >= 3 ? migrateV3(cloud) : version >= 2 ? migrateV2(cloud) : migrateV1(cloud);
            this.write(migrated);
            return migrated;
          }
          this.write(cloud);
          return cloud;
        }
      } catch (e) { /* noop */ }
      return local;
    },

    clear() {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ }
      if (window.TG && window.TG.isTelegram) window.TG.cloudRemove(SAVE_KEY).catch(() => {});
    }
  };

  window.SaveSystem = Save;
})();
