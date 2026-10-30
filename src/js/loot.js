// loot.js — база предметов, таблицы дропа, инвентарь и экипировка.
(function () {
  'use strict';

  const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const RARITY_COLOR = {
    common: '#9aa0c0', uncommon: '#4ce87a', rare: '#4aa8ff', epic: '#b06cff', legendary: '#e8c76a'
  };
  const RARITY_NAME = {
    common: 'обычное', uncommon: 'необычное', rare: 'редкое', epic: 'эпическое', legendary: 'легендарное'
  };
  const TYPE_NAME = {
    weapon: 'оружие', armor: 'броня', accessory: 'аксессуар',
    consumable: 'расходник', elixir: 'эликсир', material: 'материал'
  };

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  const Loot = {
    items: [],
    byId: {},
    tables: {},
    chests: {},
    shop: [],

    init(data) {
      this.items = (data && data.items) || [];
      this.byId = {};
      this.items.forEach((it) => { this.byId[it.id] = it; });
      this.tables = (data && data.tables) || {};
      this.chests = (data && data.chests) || {};
      this.shop = (data && data.shop) || [];
    },

    item(id) { return this.byId[id] || null; },

    rarityColor(r) { return RARITY_COLOR[r] || RARITY_COLOR.common; },
    rarityName(r) { return RARITY_NAME[r] || r; },
    typeName(t) { return TYPE_NAME[t] || t; },
    rarityRank(r) { return RARITY_ORDER[r] || 0; },

    rollTable(table, opts) {
      opts = opts || {};
      const out = { gold: 0, items: [] };
      if (!table) return out;
      const luck = opts.luck || 0;
      if (table.gold) out.gold = randInt(table.gold[0], table.gold[1]);
      if (opts.goldMult) out.gold = Math.round(out.gold * opts.goldMult);
      (table.drops || []).forEach((drop) => {
        const chance = Math.min(1, (drop.chance || 0) * (1 + luck));
        if (Math.random() > chance) return;
        let qty = drop.qty ? randInt(drop.qty[0], drop.qty[1]) : 1;
        if (opts.bonusQty && RARITY_ORDER[(this.byId[drop.id] || {}).rarity] <= 1) qty += 1;
        const existing = out.items.find((i) => i.id === drop.id);
        if (existing) existing.qty += qty;
        else out.items.push({ id: drop.id, qty });
      });
      return out;
    },

    rollEnemy(enemyId, opts) {
      opts = opts || {};
      const table = this.tables[enemyId] || this.tables.guardian;
      const result = this.rollTable(table, {
        luck: (opts.elite ? 0.1 : 0) + (opts.isBoss ? 0.25 : 0),
        goldMult: (opts.elite ? 1.5 : 1) * (opts.isBoss ? 1 : 1),
        bonusQty: false
      });
      if (opts.elite) {
        const material = (table.drops || []).find((d) => (this.byId[d.id] || {}).type === 'material');
        if (material) {
          const existing = result.items.find((i) => i.id === material.id);
          if (existing) existing.qty += 1;
          else result.items.push({ id: material.id, qty: 1 });
        }
      }
      return result;
    },

    rollChest(tier) {
      return this.rollTable(this.chests[tier] || this.chests.common, { luck: 0.05 });
    }
  };

  class Inventory {
    constructor() {
      this.items = {};
      this.equipment = { weapon: null, armor: null, accessory: null };
      this.onAdd = null;
    }

    add(id, qty) {
      const item = Loot.item(id);
      if (!item) return null;
      qty = Math.max(1, qty | 0 || 1);
      this.items[id] = (this.items[id] || 0) + qty;
      if (this.onAdd) this.onAdd(item, qty);
      return item;
    }

    remove(id, qty) {
      qty = Math.max(1, qty | 0 || 1);
      if (!this.items[id]) return false;
      this.items[id] -= qty;
      if (this.items[id] <= 0) delete this.items[id];
      return true;
    }

    count(id) { return this.items[id] || 0; }

    slots() { return Object.keys(this.items).map((id) => ({ id, qty: this.items[id], item: Loot.item(id) })).filter((e) => e.item); }

    sorted(typeFilter) {
      const rarity = (it) => Loot.rarityRank(it.rarity);
      return this.slots()
        .filter((e) => !typeFilter || e.item.type === typeFilter)
        .sort((a, b) => rarity(b.item) - rarity(a.item) || a.item.name.localeCompare(b.item.name, 'ru'));
    }

    equip(id) {
      const item = Loot.item(id);
      if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return { ok: false, reason: 'Нельзя экипировать' };
      if (!this.items[id]) return { ok: false, reason: 'Нет предмета' };
      const slot = item.type;
      const old = this.equipment[slot];
      this.remove(id, 1);
      if (old) this.add(old, 1);
      this.equipment[slot] = id;
      return { ok: true, item, replaced: old ? Loot.item(old) : null };
    }

    unequip(slot) {
      const id = this.equipment[slot];
      if (!id) return { ok: false };
      this.add(id, 1);
      this.equipment[slot] = null;
      return { ok: true, item: Loot.item(id) };
    }

    getEquipmentBonuses() {
      return window.Formulas.gearBonuses(Loot.byId, this.equipment);
    }

    serialize() {
      return {
        items: Object.keys(this.items).map((id) => ({ id, qty: this.items[id] })),
        equipment: Object.assign({}, this.equipment)
      };
    }

    deserialize(save) {
      this.items = {};
      this.equipment = { weapon: null, armor: null, accessory: null };
      if (!save) return;
      (save.items || []).forEach((entry) => {
        if (!entry || !entry.id || !Loot.item(entry.id)) return;
        const qty = Math.max(1, entry.qty | 0 || 1);
        this.items[entry.id] = (this.items[entry.id] || 0) + qty;
      });
      const eq = save.equipment || {};
      for (const slot of ['weapon', 'armor', 'accessory']) {
        if (eq[slot] && Loot.item(eq[slot])) this.equipment[slot] = eq[slot];
      }
    }
  }

  window.Loot = Loot;
  window.Inventory = Inventory;
})();
