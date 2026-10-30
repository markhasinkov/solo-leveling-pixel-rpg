// quests.js — сюжетные, побочные и скрытые квесты: условия, прогресс, награды.
(function () {
  'use strict';

  const Quests = {
    data: { main: [], side: [], hidden: [] },
    byId: {},
    state: {},
    counters: {},
    talked: {},
    game: null,
    _depth: 0,

    init(data, game) {
      this.data = {
        main: (data && data.main) || [],
        side: (data && data.side) || [],
        hidden: (data && data.hidden) || []
      };
      this.byId = {};
      ['main', 'side', 'hidden'].forEach((type) => {
        this.data[type].forEach((q) => {
          q.type = type;
          this.byId[q.id] = q;
        });
      });
      this.game = game || null;
      this.reset();
    },

    bind(game) { this.game = game; },

    reset() {
      this.state = {};
      this.counters = {};
      this.talked = {};
    },

    ensureChapter(chapterId) {
      const all = this.data.main.concat(this.data.side);
      all.forEach((q) => {
        if (q.chapter !== chapterId) return;
        if (this.state[q.id]) return;
        this.state[q.id] = {
          status: 'active',
          discovered: true,
          progress: q.objectives.map(() => 0)
        };
      });
      if (this.game) this.game.onQuestsChanged();
    },

    quest(id) { return this.byId[id] || null; },

    stateOf(id) {
      return this.state[id] || null;
    },

    visible(type) {
      const list = this.data[type] || [];
      return list.filter((q) => {
        const st = this.state[q.id];
        return st && st.discovered;
      });
    },

    activeForChapter(type, chapterId) {
      return (this.data[type] || []).filter((q) => {
        const st = this.state[q.id];
        return st && st.discovered && st.status === 'active' && q.chapter === chapterId;
      });
    },

    tracker(chapterId, limit) {
      const out = [];
      const main = this.activeForChapter('main', chapterId);
      main.forEach((q) => out.push(q));
      const side = this.activeForChapter('side', chapterId);
      side.forEach((q) => { if (out.length < (limit || 3)) out.push(q); });
      this.visible('hidden').forEach((q) => {
        if (this.state[q.id].status === 'active' && out.length < (limit || 3)) out.push(q);
      });
      return out;
    },

    countTalked(chapterId, npcId) {
      const key = String(chapterId);
      this.talked[key] = this.talked[key] || {};
      if (this.talked[key][npcId]) return false;
      this.talked[key][npcId] = true;
      return true;
    },

    emit(type, payload) {
      payload = payload || {};
      if (!this.game) return;
      const chapterId = payload.chapterId;
      const amount = payload.amount == null ? 1 : payload.amount;

      // Счётчики для открытия скрытых квестов
      if (type === 'level') {
        this.counters.level = Math.max(this.counters.level || 0, payload.level || 0);
      } else if (['kill', 'secret', 'puzzle', 'chest', 'boss', 'bossNoHit', 'noPotionBoss'].includes(type)) {
        this.counters[type] = (this.counters[type] || 0) + amount;
      }

      this.checkDiscoveries(type, payload);

      // Обновление целей активных квестов
      ['main', 'side', 'hidden'].forEach((qtype) => {
        this.data[qtype].forEach((q) => {
          const st = this.state[q.id];
          if (!st || st.status !== 'active') return;
          if (q.chapter != null && q.chapter !== chapterId) return;
          this.applyObjectives(q, st, type, payload, amount);
        });
      });

      // Завершение и награды
      ['main', 'side', 'hidden'].forEach((qtype) => {
        this.data[qtype].forEach((q) => {
          const st = this.state[q.id];
          if (!st || st.status !== 'active') return;
          const done = q.objectives.every((obj, i) => (st.progress[i] || 0) >= obj.count);
          if (done) this.complete(q, st);
        });
      });

      if (this.game.onQuestsChanged) this.game.onQuestsChanged();
    },

    applyObjectives(q, st, type, payload, amount) {
      q.objectives.forEach((obj, i) => {
        let current = st.progress[i] || 0;
        if (obj.type === 'level') {
          if (type === 'level') st.progress[i] = Math.max(current, payload.level || 0);
          return;
        }
        if (obj.type !== type) return;
        if (obj.target && payload.target !== obj.target && payload.id !== obj.target) return;
        if (obj.type === 'collect' && obj.target && payload.target !== obj.target) return;
        if (obj.type === 'talk' && obj.target && payload.target !== obj.target) return;
        st.progress[i] = Math.min(obj.count, current + amount);
      });

      // Прохождение главы закрывает основные цели (сюжет нельзя потерять)
      if (type === 'chapter' && q.type === 'main') {
        q.objectives.forEach((obj, i) => { st.progress[i] = obj.count; });
      }
    },

    checkDiscoveries(type, payload) {
      this.data.hidden.forEach((q) => {
        if (this.state[q.id] && this.state[q.id].discovered) return;
        const cond = q.discover;
        if (!cond) return;
        let metric = 0;
        if (cond.event === 'level') {
          if (type !== 'level') return;
          metric = payload.level || 0;
        } else {
          if (type !== cond.event) {
            const neverDiscovered = !this.state[q.id];
            if (!neverDiscovered) return;
            metric = this.counters[cond.event] || 0;
            if (metric < (cond.count || 1)) return;
            this.discover(q);
            return;
          }
          metric = this.counters[cond.event] || 0;
        }
        if (metric >= (cond.count || 1)) this.discover(q);
      });
    },

    discover(q) {
      if (this.state[q.id]) return;
      const cond = q.discover || {};
      const event = cond.event;
      const counter = event === 'level' ? (this.counters.level || 0) : (this.counters[event] || 0);
      const base = Math.max(0, counter - (cond.count || 1));
      this.state[q.id] = {
        status: 'active',
        discovered: true,
        progress: q.objectives.map((obj) => {
          if (obj.type === 'level') return Math.min(obj.count, this.counters.level || 0);
          if (obj.type === event) return Math.min(obj.count, base);
          return 0;
        })
      };
      if (this.game.notifyHiddenQuest) this.game.notifyHiddenQuest(q);
    },

    refreshDiscoveries(playerLevel) {
      if (playerLevel) this.counters.level = Math.max(this.counters.level || 0, playerLevel);
      let changed = false;
      this.data.hidden.forEach((q) => {
        if (this.state[q.id] && this.state[q.id].discovered) return;
        const cond = q.discover;
        if (!cond) return;
        const metric = cond.event === 'level' ? (this.counters.level || 0) : (this.counters[cond.event] || 0);
        if (metric >= (cond.count || 1)) {
          this.discover(q);
          changed = true;
          const st = this.state[q.id];
          if (st && st.status === 'active' && q.objectives.every((obj, i) => (st.progress[i] || 0) >= obj.count)) {
            this.complete(q, st);
          }
        }
      });
      if (changed && this.game && this.game.onQuestsChanged) this.game.onQuestsChanged();
    },

    complete(q, st) {
      if (st.status !== 'active') return;
      st.status = 'completed';
      if (this.game.onQuestComplete) this.game.onQuestComplete(q);
      if (this.game.grantRewards && q.rewards) this.game.grantRewards(q.rewards, q);
    },

    objectiveLabel(q, i) {
      const obj = q.objectives[i];
      const st = this.state[q.id];
      const cur = st ? Math.min(st.progress[i] || 0, obj.count) : 0;
      return {
        text: obj.label || obj.type,
        current: cur,
        count: obj.count,
        done: cur >= obj.count
      };
    },

    serialize() {
      const state = {};
      for (const id in this.state) {
        const st = this.state[id];
        state[id] = {
          status: st.status,
          discovered: st.discovered,
          progress: st.progress.slice()
        };
      }
      return {
        state,
        counters: Object.assign({}, this.counters),
        talked: JSON.parse(JSON.stringify(this.talked))
      };
    },

    deserialize(save) {
      this.reset();
      if (!save) return;
      this.counters = Object.assign({}, save.counters || {});
      this.talked = save.talked || {};
      const st = save.state || {};
      for (const id in st) {
        const def = this.byId[id];
        if (!def) continue;
        const src = st[id];
        const progress = def.objectives.map((o, i) => Math.min(o.count, (src.progress && src.progress[i]) || 0));
        this.state[id] = {
          status: src.status === 'completed' ? 'completed' : 'active',
          discovered: src.discovered !== false,
          progress
        };
      }
    }
  };

  window.Quests = Quests;
})();
