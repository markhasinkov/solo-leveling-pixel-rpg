// formulas.js — чистые формулы баланса. Используются игрой и симулятором баланса.
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Formulas = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const BASE_MP = 100;
  const BASE_SPEED = 260;
  const BASE_CRIT = 0.05;
  const BASE_CRIT_MULT = 1.6;

  function xpToNext(level) {
    return Math.round(55 + 48 * Math.pow(Math.max(1, level), 1.32));
  }

  function enemyXp(stats, isBoss, chapter) {
    stats = stats || {};
    const hp = stats.hp || 50;
    const atk = stats.atk || 8;
    const chapterScale = 1 + 0.08 * Math.max(0, (chapter || 1) - 1);
    const base = hp * 0.05 + atk * 0.6;
    return Math.round(base * chapterScale * (isBoss ? 2.4 : 1));
  }

  function mitigation(def) {
    return 1 - (def || 0) / ((def || 0) + 150);
  }

  function damage(atk, def, mult) {
    const raw = (atk || 0) * (mult == null ? 1 : mult) * mitigation(def);
    return Math.max(1, Math.round(raw));
  }

  function defaultMods() {
    return {
      damagePct: 0,
      critChance: 0,
      critMult: 0,
      lifesteal: 0,
      skillDamagePct: 0,
      speedPct: 0,
      attackSpeedPct: 0,
      cooldownPct: 0,
      doubleJump: 0,
      maxHpPct: 0,
      defPct: 0,
      hpRegen: 0,
      maxMpPct: 0,
      mpRegen: 0,
      mpCostPct: 0,
      allyCount: 0
    };
  }

  function addMods(target, source, scale) {
    const k = scale == null ? 1 : scale;
    if (!source) return target;
    for (const key in target) {
      if (typeof source[key] === 'number') target[key] += source[key] * k;
    }
    return target;
  }

  function aggregateTalents(nodesById, ranks) {
    const mods = defaultMods();
    if (!ranks) return mods;
    for (const id in ranks) {
      const node = nodesById[id];
      if (!node || !node.effect) continue;
      addMods(mods, node.effect, ranks[id] || 0);
    }
    return mods;
  }

  function gearBonuses(itemsById, equipment) {
    const out = { hp: 0, atk: 0, def: 0, mp: 0, speedPct: 0, critChance: 0, mpRegen: 0 };
    if (!equipment) return out;
    for (const slot in equipment) {
      const id = equipment[slot];
      const item = id && itemsById ? itemsById[id] : null;
      if (!item || !item.stats) continue;
      for (const key in out) {
        if (typeof item.stats[key] === 'number') out[key] += item.stats[key];
      }
    }
    return out;
  }

  function derivedStats(base, level, mods, gear, bonus) {
    base = base || { hp: 850, atk: 120, def: 70 };
    mods = mods || defaultMods();
    gear = gear || {};
    bonus = bonus || {};
    const lv = Math.max(1, level || 1);
    const lvHp = base.hp * (1 + 0.075 * (lv - 1));
    const lvAtk = base.atk * (1 + 0.06 * (lv - 1));
    const lvDef = base.def * (1 + 0.04 * (lv - 1));

    const maxHp = Math.round(lvHp * (1 + mods.maxHpPct) + (gear.hp || 0) + (bonus.hp || 0));
    const atk = Math.round(lvAtk * (1 + mods.damagePct) + (gear.atk || 0) + (bonus.atk || 0));
    const def = Math.round(lvDef * (1 + mods.defPct) + (gear.def || 0));
    const maxMp = Math.round((BASE_MP + 7 * (lv - 1)) * (1 + mods.maxMpPct) + (gear.mp || 0) + (bonus.mp || 0));
    const speed = Math.min(430, Math.round(BASE_SPEED * (1 + mods.speedPct + (gear.speedPct || 0))));

    return {
      level: lv,
      maxHp,
      atk,
      def,
      maxMp,
      speed,
      critChance: Math.min(0.6, BASE_CRIT + mods.critChance + (gear.critChance || 0)),
      critMult: BASE_CRIT_MULT + mods.critMult,
      lifesteal: mods.lifesteal,
      skillDamagePct: mods.skillDamagePct,
      attackSpeedPct: Math.min(0.5, mods.attackSpeedPct),
      cooldownPct: Math.min(0.45, mods.cooldownPct),
      mpCostPct: Math.max(-0.4, mods.mpCostPct),
      doubleJump: mods.doubleJump > 0,
      hpRegen: mods.hpRegen,
      mpRegen: 1.5 + mods.mpRegen + (gear.mpRegen || 0),
      allyCount: Math.floor(mods.allyCount)
    };
  }

  function cooldown(baseSeconds, stats) {
    return Math.max(0.5, baseSeconds * (1 - (stats && stats.cooldownPct || 0)));
  }

  function mpCost(baseMp, stats) {
    return Math.max(1, Math.round(baseMp * (1 + (stats && stats.mpCostPct || 0))));
  }

  function rollCrit(stats, rng) {
    if ((rng ? rng() : Math.random()) < (stats.critChance || 0)) {
      return { crit: true, mult: stats.critMult || BASE_CRIT_MULT };
    }
    return { crit: false, mult: 1 };
  }

  return {
    BASE_MP, BASE_SPEED, BASE_CRIT, BASE_CRIT_MULT,
    xpToNext, enemyXp, mitigation, damage, defaultMods, addMods,
    aggregateTalents, gearBonuses, derivedStats, cooldown, mpCost, rollCrit
  };
});
