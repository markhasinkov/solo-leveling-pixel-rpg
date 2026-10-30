// progress.js — опыт, уровни, очки талантов, пермаментные бонусы, экипировка.
(function () {
  'use strict';

  const F = window.Formulas;

  const Progress = {
    base: { hp: 850, atk: 120, def: 70 },
    level: 1,
    xp: 0,
    gold: 0,
    talentPoints: 0,
    talents: {},
    bonus: { atk: 0, hp: 0, mp: 0 },
    nodesById: {},
    branches: [],
    inventory: null,
    stats: null,

    init(base, talentsData, inventory) {
      this.base = {
        hp: (base && base.hp) || 850,
        atk: (base && base.atk) || 120,
        def: (base && base.def) || 70
      };
      this.branches = (talentsData && talentsData.branches) || [];
      this.nodesById = {};
      const nodes = (talentsData && talentsData.nodes) || [];
      nodes.forEach((n) => { this.nodesById[n.id] = n; });
      this.inventory = inventory || null;
      this.reset();
    },

    reset() {
      this.level = 1;
      this.xp = 0;
      this.gold = 0;
      this.talentPoints = 0;
      this.talents = {};
      this.bonus = { atk: 0, hp: 0, mp: 0 };
      this.recalc();
    },

    recalc() {
      const mods = F.aggregateTalents(this.nodesById, this.talents);
      const gear = this.inventory ? this.inventory.getEquipmentBonuses() : {};
      this.stats = F.derivedStats(this.base, this.level, mods, gear, this.bonus);
      this.stats.xpNext = F.xpToNext(this.level);
      return this.stats;
    },

    xpNext() { return F.xpToNext(this.level); },

    addXp(amount) {
      if (!amount || amount <= 0) return { levels: 0, gained: 0 };
      this.xp += Math.round(amount);
      let levels = 0;
      let guard = 0;
      while (this.xp >= this.xpNext() && guard < 100) {
        this.xp -= this.xpNext();
        this.level++;
        this.talentPoints++;
        levels++;
        guard++;
      }
      if (levels) this.recalc();
      return { levels, gained: Math.round(amount) };
    },

    addGold(amount) {
      this.gold = Math.max(0, this.gold + Math.round(amount || 0));
    },

    spendGold(amount) {
      amount = Math.round(amount || 0);
      if (this.gold < amount) return false;
      this.gold -= amount;
      return true;
    },

    rank(id) { return this.talents[id] || 0; },

    node(id) { return this.nodesById[id] || null; },

    canLearn(id) {
      const node = this.node(id);
      if (!node) return { ok: false, reason: 'Узел не найден' };
      const rank = this.rank(id);
      if (rank >= node.maxRank) return { ok: false, reason: 'Максимальный ранг' };
      if (this.level < (node.levelReq || 1)) return { ok: false, reason: 'Нужен ' + node.levelReq + ' уровень' };
      if (this.talentPoints < (node.cost || 1)) return { ok: false, reason: 'Не хватает очков талантов' };
      const reqs = node.requires || [];
      for (let i = 0; i < reqs.length; i++) {
        if (this.rank(reqs[i]) < 1) {
          const reqNode = this.node(reqs[i]);
          return { ok: false, reason: 'Сначала: ' + ((reqNode && reqNode.name) || reqs[i]) };
        }
      }
      return { ok: true, reason: '' };
    },

    learn(id) {
      const check = this.canLearn(id);
      if (!check.ok) return check;
      const node = this.node(id);
      this.talentPoints -= node.cost || 1;
      this.talents[id] = this.rank(id) + 1;
      this.recalc();
      return { ok: true, node };
    },

    applyPermanent(use) {
      if (!use) return false;
      if (use.permAtk) this.bonus.atk += use.permAtk;
      if (use.permHp) this.bonus.hp += use.permHp;
      if (use.permMp) this.bonus.mp += use.permMp;
      this.recalc();
      return true;
    },

    serialize() {
      return {
        level: this.level,
        xp: this.xp,
        gold: this.gold,
        talentPoints: this.talentPoints,
        talents: Object.assign({}, this.talents),
        bonus: Object.assign({}, this.bonus)
      };
    },

    deserialize(save) {
      if (!save || typeof save !== 'object') return;
      this.level = Math.max(1, save.level | 0 || 1);
      this.xp = Math.max(0, save.xp | 0 || 0);
      this.gold = Math.max(0, save.gold | 0 || 0);
      this.talentPoints = Math.max(0, save.talentPoints | 0 || 0);
      this.talents = {};
      if (save.talents && typeof save.talents === 'object') {
        for (const id in save.talents) {
          const rank = save.talents[id] | 0;
          if (this.nodesById[id] && rank > 0) this.talents[id] = Math.min(rank, this.nodesById[id].maxRank);
        }
      }
      this.bonus = {
        atk: (save.bonus && save.bonus.atk) | 0,
        hp: (save.bonus && save.bonus.hp) | 0,
        mp: (save.bonus && save.bonus.mp) | 0
      };
      this.recalc();
    }
  };

  window.Progress = Progress;
})();
