// world.js — уровни, тайники, сундуки и загадки (руны, рычаги, сферы).
(function () {
  'use strict';

  const TILE = 16;
  const THEMES = {
    temple: { wall: '#3a3350', accent: '#a06cff', flame: '#ffb36a', fog: 'rgba(80,50,140,0.10)', tint: 'rgba(12,8,24,0.24)' },
    cave: { wall: '#2a3350', accent: '#6ad7ff', flame: '#ffb36a', fog: 'rgba(40,70,120,0.12)', tint: 'rgba(6,12,24,0.34)' },
    hospital: { wall: '#2c3a44', accent: '#9fe6ff', flame: '#cfeaff', fog: 'rgba(120,170,200,0.10)', tint: 'rgba(10,24,32,0.52)' },
    ice: { wall: '#2e4a5e', accent: '#bfe6f7', flame: '#9fe6ff', fog: 'rgba(150,220,255,0.12)', tint: 'rgba(10,28,42,0.44)' },
    castle: { wall: '#3a2030', accent: '#ff6a6a', flame: '#ff8a3c', fog: 'rgba(120,30,40,0.12)', tint: 'rgba(30,8,12,0.44)' },
    jungle: { wall: '#243a28', accent: '#7ec850', flame: '#ffd24a', fog: 'rgba(60,120,60,0.12)', tint: 'rgba(6,20,10,0.44)' },
    guild: { wall: '#33304a', accent: '#e8c76a', flame: '#ffd24a', fog: 'rgba(80,60,120,0.10)', tint: 'rgba(14,12,26,0.42)' },
    throne: { wall: '#2a1a3a', accent: '#d66cff', flame: '#ff6aff', fog: 'rgba(100,40,140,0.14)', tint: 'rgba(20,6,28,0.48)' }
  };

  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  function rgba(hex, alpha) {
    const s = String(hex).replace('#', '');
    const r = parseInt(s.slice(0, 2), 16) || 0;
    const g = parseInt(s.slice(2, 4), 16) || 0;
    const b = parseInt(s.slice(4, 6), 16) || 0;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function accentAlpha(hex, alpha) { return rgba(hex, alpha); }
  function themeAlpha(hex, alpha) { return rgba(hex, alpha); }

  function pseudo(x, seed) {
    const v = Math.sin((x + 17) * 12.9898 + (seed + 3) * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  class Level {
    constructor(worldW, worldH, bgPath, theme) {
      this.worldW = worldW;
      this.worldH = worldH;
      this.floorY = worldH - 80;
      this.solids = [];
      this.bgPath = bgPath || null;
      this.bg = bgPath ? Engine.getSprite(bgPath, '#101426', 640, 360) : null;
      const themeId = THEMES[theme] ? theme : 'cave';
      this.themeId = themeId;
      this.tileFloor = Engine.getSprite('assets/sprites/tex/' + themeId + '_floor.png', '#2a3350', 32, 32);
      this.tileWall = Engine.getSprite('assets/sprites/tex/' + themeId + '_wall.png', '#1d2436', 32, 32);
      this.tileStairs = Engine.getSprite('assets/sprites/tile_stairs.png', '#39405c', 16, 16);
      this._patterns = null;
      this._shadeGrad = null;
    }

    addSolid(x, y, w, h, kind) { this.solids.push({ x, y, w, h, kind: kind || 'stone' }); }

    collideX(e) {
      for (const s of this.solids) {
        if (e.x < s.x + s.w && e.x + e.w > s.x && e.y < s.y + s.h && e.y + e.h > s.y) {
          if (e.vx > 0) e.x = s.x - e.w;
          else if (e.vx < 0) e.x = s.x + s.w;
          e.vx = 0;
        }
      }
    }

    collideY(e) {
      for (const s of this.solids) {
        if (e.x < s.x + s.w && e.x + e.w > s.x && e.y < s.y + s.h && e.y + e.h > s.y) {
          if (e.vy > 0) { e.y = s.y - e.h; e.onGround = true; }
          else if (e.vy < 0) { e.y = s.y + s.h; }
          e.vy = 0;
        }
      }
    }

    patterns() {
      if (this._patterns) return this._patterns;
      if (!this.tileFloor.img || !this.tileWall.img) return null;
      this._patterns = {
        floor: Engine.ctx.createPattern(this.tileFloor.img, 'repeat'),
        wall: Engine.ctx.createPattern(this.tileWall.img, 'repeat'),
        stairs: Engine.ctx.createPattern(this.tileStairs.img, 'repeat')
      };
      return this._patterns;
    }

    drawBackground(ctx) {
      const cam = Engine.Camera;
      if (this.bg && this.bg.img) {
        if (Engine.lowQuality) {
          // Экономный режим: одна копия без параллакса вместо двух
          // полноэкранных отрисовок. На мобильном это заметно дешевле.
          ctx.drawImage(this.bg.img, 0, 0, 960, 540);
        } else {
          const px = ((-cam.x * 0.25) % 960 + 960) % 960 - 960;
          // Две горизонтальные копии покрывают экран; вертикальный параллакс
          // стоил вторую пару полноэкранных копий, а заметен почти не был.
          ctx.drawImage(this.bg.img, px, 0, 960, 540);
          ctx.drawImage(this.bg.img, px + 960, 0, 960, 540);
        }
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, Engine.CANVAS_H);
        g.addColorStop(0, '#141a30'); g.addColorStop(1, '#05070f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
      }
      if (!this._shadeGrad) {
        this._shadeGrad = ctx.createLinearGradient(0, 0, 0, Engine.CANVAS_H);
        this._shadeGrad.addColorStop(0, 'rgba(5,7,15,0.28)');
        this._shadeGrad.addColorStop(0.6, 'rgba(5,7,15,0.12)');
        this._shadeGrad.addColorStop(1, 'rgba(5,7,15,0.62)');
      }
      ctx.fillStyle = this._shadeGrad;
      ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
    }

    drawSolids(ctx, theme) {
      const pat = this.patterns();
      const cam = Engine.Camera;
      for (const s of this.solids) {
        const sx = s.x - cam.x, sy = s.y - cam.y;
        if (sx > Engine.CANVAS_W + 40 || sx + s.w < -40 || sy > Engine.CANVAS_H + 40 || sy + s.h < -40) continue;
        // Ограничиваем заливку видимой областью: пол тянется на весь мир,
        // и pattern fill по 10 000 px был лишней работой каждый кадр.
        const drawX = Math.max(s.x, cam.x - 60);
        const drawRight = Math.min(s.x + s.w, cam.x + Engine.CANVAS_W + 60);
        const drawW = Math.max(0, drawRight - drawX);
        if (drawW <= 0) continue;
        ctx.fillStyle = '#121722';
        ctx.fillRect(drawX, s.y, drawW, s.h);
        if (pat && (!Engine.lowQuality || s.w <= 420)) {
          ctx.save();
          ctx.globalAlpha = 0.98;
          ctx.fillStyle = pat.wall;
          ctx.fillRect(drawX, s.y, drawW, s.h);
          ctx.fillStyle = pat.floor;
          const topH = Math.min(s.h, 28);
          ctx.fillRect(drawX, s.y, drawW, topH);
          ctx.restore();
        } else {
          ctx.fillStyle = theme ? theme.wall : '#2a3350';
          ctx.fillRect(drawX, s.y, drawW, Math.min(s.h, 28));
        }
        // Затемняем твёрдые поверхности, чтобы персонажи и эффекты читались
        // даже на светлых фонах (больница, лёд).
        ctx.fillStyle = 'rgba(3,5,12,0.18)';
        ctx.fillRect(drawX, s.y, drawW, s.h);
        if (theme) {
          ctx.save();
          ctx.globalAlpha = 0.34;
          ctx.fillStyle = theme.accent;
          ctx.fillRect(drawX, s.y, drawW, 2);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(drawX, s.y, drawW, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(drawX, s.y + s.h - 4, drawW, 4);
        // трещины
        if (!Engine.lowQuality) {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          for (let x = drawX + 40; x < drawRight; x += 130) {
            ctx.beginPath();
            ctx.moveTo(x, s.y + 6);
            ctx.lineTo(x + 7, s.y + 14);
            ctx.lineTo(x + 3, s.y + 22);
            ctx.stroke();
          }
        }
        if (theme && !Engine.lowQuality) {
          ctx.save();
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = theme.accent;
          ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.restore();
        }
      }
    }
  }

  class World {
    constructor(chapter, levelData, chapterNumber, savedState) {
      this.chapter = chapter;
      this.chapterId = chapter.id;
      this.data = levelData || {};
      this.theme = THEMES[this.data.theme] || THEMES.cave;
      this.themeId = this.data.theme || 'cave';
      this.time = 0;
      this.dustTimer = 0;
      this.worldW = Math.max(2400, Math.round(this.data.worldW || 2400));
      this.worldH = Math.max(720, Math.round(this.data.worldH || 900));
      this.floorY = Math.round(this.data.floorY || (this.worldH - 80));
      this.bossX = Math.max(1100, Math.min(this.worldW - 220, Math.round(this.data.bossX || (this.worldW - 470))));
      this.startX = Math.max(40, Math.min(this.worldW - 220, Math.round(this.data.startX || 90)));
      this.zones = (this.data.zones || []).map((z, i) => ({
        id: z.id || ('zone-' + i),
        name: z.name || 'Локация',
        subtitle: z.subtitle || '',
        x: Math.max(0, Math.round(z.x || 0)),
        w: Math.max(400, Math.round(z.w || 1600)),
        kind: z.kind || 'hall',
        props: Array.isArray(z.props) ? z.props : [],
        story: Array.isArray(z.story) ? z.story : [],
        tint: z.tint || null
      })).sort((a, b) => a.x - b.x);
      if (!this.zones.length) {
        this.zones = [{
          id: 'main', name: chapter.title || 'Локация', subtitle: '', x: 0,
          w: this.worldW, kind: 'hall', props: [], story: [], tint: null
        }];
      }
      this.seenZones = {};
      this.lore = [];
      this.shrines = [];
      this.hazards = [];
      this.racks = [];
      this.questObjects = [];
      this.checkpointX = 0;
      this.activeZoneId = null;
      const arenaData = this.data.arena || null;
      this.arena = arenaData && arenaData.bg ? {
        bg: arenaData.bg,
        name: arenaData.name || 'Арена босса',
        x: Math.max(0, Math.round(arenaData.x || Math.max(0, this.bossX - 900)))
      } : null;
      this.arenaBg = this.arena
        ? Engine.getSprite(this.arena.bg, '#0d0a16', Engine.CANVAS_W, Engine.CANVAS_H)
        : null;
      this._arenaVignette = null;
      this.cutinPath = this.data.cutin || null;
      this.scenes = (Array.isArray(this.data.scenes) ? this.data.scenes : []).map((s, i) => ({
        id: s.id || ('scene-' + this.chapterId + '-' + i),
        x: Math.max(0, Math.round(s.x || 0)),
        title: s.title || 'Сцена',
        subtitle: s.subtitle || '',
        lines: Array.isArray(s.lines) ? s.lines : [],
        cutin: s.cutin || null,
        triggered: false
      })).sort((a, b) => a.x - b.x);
      this.decor = Array.isArray(this.data.decor) ? this.data.decor : [];
      const themeId = this.data.theme || 'cave';
      const themeBg = (themeId === 'castle' || themeId === 'throne')
        ? ('assets/sprites/bg_theme_' + themeId + '.png')
        : null;
      const bgPath = themeBg || (chapter.location ? ('assets/sprites/bg_' + chapter.location + '.png') : null);
      this.level = new Level(this.worldW, this.worldH, bgPath, themeId);
      this.chests = [];
      this.secrets = [];
      this.puzzles = [];
      this.torches = [];
      this.buildTerrain();
      this.buildContent();
      this.restore(savedState || {});
    }

    buildTerrain() {
      const rand = Engine.mulberry32((this.chapterId || 1) * 7919 + 13);
      const L = this.level;
      L.addSolid(0, this.floorY, this.worldW, this.worldH - this.floorY);
      L.addSolid(-40, 0, 40, this.worldH);
      L.addSolid(this.worldW, 0, 40, this.worldH);

      const platforms = Array.isArray(this.data.platforms) ? this.data.platforms : [];
      if (platforms.length) {
        platforms.forEach((p) => {
          const x = Math.max(0, Math.round(p.x));
          const w = Math.max(16, Math.round(p.w || 100));
          const y = Math.max(30, Math.min(this.floorY - 20, Math.round(p.y || (this.floorY - 160))));
          L.addSolid(x, y, Math.min(w, this.worldW - x), Math.max(8, Math.round(p.h || 20)), p.kind || 'stone');
        });
      } else {
        let px = 300;
        let guard = 0;
        while (px < this.worldW - 380 && guard < 80) {
          guard++;
          const w = 100 + Math.floor(rand() * 90);
          const py = this.floorY - (140 + Math.floor(rand() * 190));
          L.addSolid(px, py, w, 22);
          px += w + 200 + Math.floor(rand() * 180);
        }
      }
      // Арена босса: платформы, если их не задали в данных.
      const arenaPlatforms = [
        [this.bossX - 360, this.floorY - 170, 150, 22],
        [this.bossX - 60, this.floorY - 260, 140, 22],
        [this.bossX + 200, this.floorY - 190, 150, 22]
      ];
      arenaPlatforms.forEach(([x, y, w, h]) => {
        if (x < 40 || x + w > this.worldW - 40) return;
        const close = L.solids.some((s) => Math.abs(s.x - x) < 80 && Math.abs(s.y - y) < 50);
        if (!close) L.addSolid(x, y, w, h, 'arena');
      });

      this.torches = [];
      for (let x = 240; x < this.worldW - 120; x += 360) this.torches.push(x);
    }

    buildContent() {
      const data = this.data;
      const floor = this.floorY;

      if (data.secret) {
        const s = data.secret;
        const secret = {
          id: 'secret-' + this.chapterId,
          type: 'secret',
          kind: s.type === 'chest' ? 'chest' : 'wall',
          x: s.x, y: floor - 78, w: 56, h: 78,
          name: s.name || 'Тайник',
          lore: s.lore || '',
          chestTier: s.chest || 'common',
          found: false,
          revealTimer: 0
        };
        this.secrets.push(secret);
      }

      if (data.puzzle) {
        const p = data.puzzle;
        const seq = Array.isArray(p.sequence) ? p.sequence : [0, 1, 2];
        const puzzle = {
          id: 'puzzle-' + this.chapterId,
          type: 'puzzle',
          kind: p.type || 'runes',
          name: p.name || 'Древний механизм',
          lore: p.lore || '',
          hint: p.hint || '',
          sequence: seq,
          chestTier: p.chest || 'rare',
          x: p.x, y: floor,
          solved: false,
          step: 0,
          lockTimer: 0,
          devices: [],
          rewardChest: null
        };
        const count = Math.max(seq.length, 3);
        for (let i = 0; i < count; i++) {
          const dx = (i - (count - 1) / 2) * 96;
          if (puzzle.kind === 'levers') {
            puzzle.devices.push({ index: i, x: p.x + dx - 8, y: floor - 46, w: 16, h: 46, pulled: false });
          } else if (puzzle.kind === 'orbs') {
            puzzle.devices.push({ index: i, x: p.x + dx - 13, y: floor - 60, w: 26, h: 26, lit: false });
          } else {
            puzzle.devices.push({ index: i, x: p.x + dx - 24, y: floor - 8, w: 48, h: 8, lit: false, inside: false });
          }
        }
        this.puzzles.push(puzzle);
      }

      (data.chests || []).forEach((c, i) => {
        this.chests.push({
          id: 'chest-' + this.chapterId + '-' + i,
          type: 'chest',
          x: c.x, y: c.y == null ? floor - 26 : Math.round(c.y), w: 30, h: 26,
          tier: c.chest || 'common',
          opened: false
        });
      });

      (data.lore || []).forEach((l, i) => {
        this.lore.push({
          id: 'lore-' + this.chapterId + '-' + i,
          type: 'lore',
          kind: l.kind || 'tablet',
          x: Math.max(80, Math.min(this.worldW - 120, Math.round(l.x))),
          y: floor - 54, w: 38, h: 54,
          title: l.title || 'Запись',
          text: l.text || '',
          xp: l.xp == null ? 18 : l.xp,
          read: false
        });
      });

      (data.shrines || []).forEach((s, i) => {
        this.shrines.push({
          id: 'shrine-' + this.chapterId + '-' + i,
          type: 'shrine',
          x: Math.max(120, Math.min(this.worldW - 160, Math.round(s.x))),
          y: floor - 58, w: 52, h: 58,
          name: s.name || 'Алтарь Системы',
          cooldown: 0,
          used: false
        });
      });

      (data.hazards || []).forEach((h, i) => {
        this.hazards.push({
          id: 'hazard-' + this.chapterId + '-' + i,
          type: h.type || 'spikes',
          x: Math.round(h.x),
          y: h.y == null ? floor - 12 : Math.round(h.y),
          w: Math.max(30, Math.round(h.w || 90)),
          h: Math.max(8, Math.round(h.h || 16)),
          damage: h.damage == null ? 14 : h.damage,
          slow: h.slow == null ? 0.15 : h.slow,
          tick: 0
        });
      });

      (data.racks || []).forEach((r, i) => {
        this.racks.push({
          id: 'rack-' + this.chapterId + '-' + i,
          type: 'rack',
          x: Math.max(120, Math.min(this.worldW - 160, Math.round(r.x))),
          y: floor - 64, w: 44, h: 64,
          elite: !!r.elite,
          broken: false,
          glow: Math.random() * 6
        });
      });

      (data.questObjects || []).forEach((q, i) => {
        this.questObjects.push({
          id: 'quest-' + this.chapterId + '-' + i,
          kind: q.kind || 'miner',
          x: Math.max(120, Math.min(this.worldW - 160, Math.round(q.x))),
          y: floor - 50, w: 46, h: 50,
          event: q.event || 'rescue',
          title: q.title || 'Задание',
          enemy: q.enemy || null,
          enemyCount: Math.max(1, Math.min(4, q.enemyCount | 0 || 1)),
          done: false,
          glow: Math.random() * 6
        });
      });
    }

    restore(state) {
      const secrets = state.secrets || {};
      const chests = state.chests || {};
      const puzzles = state.puzzles || {};
      this.secrets.forEach((s) => { s.found = !!secrets[s.id]; });
      this.chests.forEach((c) => { c.opened = !!chests[c.id]; });
      this.lore.forEach((l) => { l.read = !!(state.lore && state.lore[l.id]); });
      this.seenZones = Object.assign({}, state.zones || {});
      this.checkpointX = Math.max(0, Number(state.checkpointX || 0));
      const scenes = state.scenes || {};
      this.scenes.forEach((s) => { s.triggered = !!scenes[s.id]; });
      const racks = state.racks || {};
      this.racks.forEach((r) => { r.broken = !!racks[r.id]; });
      const questObjects = state.questObjects || {};
      this.questObjects.forEach((q) => { q.done = !!questObjects[q.id]; });
      this.puzzles.forEach((p) => {
        if (puzzles[p.id]) {
          p.solved = true;
          p.step = p.sequence.length;
          p.devices.forEach((d) => { if (p.kind === 'levers') d.pulled = true; else d.lit = true; });
          const chest = this.makePuzzleChest(p);
          chest.opened = !!chests[chest.id];
          p.rewardChest = chest;
        }
      });
      if (this.checkpointX) {
        this.zones.forEach((z) => {
          if (z.x < this.checkpointX) this.seenZones[z.id] = true;
        });
      }
    }

    serialize() {
      const secrets = {}, chests = {}, puzzles = {}, lore = {}, scenes = {}, racks = {}, questObjects = {};
      this.secrets.forEach((s) => { if (s.found) secrets[s.id] = true; });
      this.chests.forEach((c) => { if (c.opened) chests[c.id] = true; });
      this.lore.forEach((l) => { if (l.read) lore[l.id] = true; });
      this.scenes.forEach((s) => { if (s.triggered) scenes[s.id] = true; });
      this.racks.forEach((r) => { if (r.broken) racks[r.id] = true; });
      this.questObjects.forEach((q) => { if (q.done) questObjects[q.id] = true; });
      if (this.puzzles.length) {
        const p = this.puzzles[0];
        if (p.solved) {
          puzzles[p.id] = true;
          if (p.rewardChest && p.rewardChest.opened) chests[p.rewardChest.id] = true;
        }
      }
      return {
        secrets, chests, puzzles, lore, scenes, racks, questObjects,
        zones: Object.assign({}, this.seenZones),
        checkpointX: this.checkpointX
      };
    }

    makePuzzleChest(puzzle) {
      // Сундук ставим с противоположной от арены босса стороны, чтобы он не оказался под боссом.
      const bossHome = this.bossX;
      const dir = puzzle.x < bossHome ? -1 : 1;
      const chest = {
        id: 'puzzle-chest-' + this.chapterId,
        type: 'chest',
        x: Math.max(100, Math.min(this.worldW - 90, puzzle.x + dir * 140)),
        y: this.floorY - 26,
        w: 30, h: 26,
        tier: puzzle.chestTier,
        opened: false,
        reward: true
      };
      this.chests.push(chest);
      return chest;
    }

    // ---------- Обновление ----------
    update(dt, game) {
      this.time += dt;
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.2;
        const cam = Engine.Camera;
        const x = cam.x + Math.random() * Engine.CANVAS_W;
        const y = cam.y + Math.random() * Engine.CANVAS_H * 0.85;
        const themeId = this.themeId;
        let color = 'rgba(160,180,230,0.8)';
        let opts = { speed: 8, life: 1.8, size: 1.5, gravity: -8, drag: 0.3 };
        if (themeId === 'ice') {
          color = 'rgba(200,240,255,0.9)';
          opts = { speed: 12, life: 2.6, size: 1.6, gravity: 26, drag: 0.1, up: 0 };
        } else if (themeId === 'castle' || themeId === 'throne') {
          color = themeId === 'castle' ? 'rgba(255,138,60,0.9)' : 'rgba(190,130,255,0.9)';
          opts = { speed: 10, life: 2.2, size: 1.5, gravity: -26, drag: 0.2, glow: true };
        } else if (themeId === 'jungle') {
          color = 'rgba(140,230,90,0.9)';
          opts = { speed: 16, life: 2.8, size: 1.4, gravity: -4, drag: 0.1, glow: true };
        } else if (themeId === 'temple') {
          color = 'rgba(180,140,255,0.8)';
          opts = { speed: 7, life: 2.2, size: 1.4, gravity: -14, drag: 0.2, glow: true };
        } else if (themeId === 'guild') {
          color = 'rgba(232,199,106,0.75)';
          opts = { speed: 6, life: 2.2, size: 1.3, gravity: -6, drag: 0.2 };
        } else if (themeId === 'hospital') {
          color = 'rgba(190,225,240,0.6)';
          opts = { speed: 6, life: 2.0, size: 1.2, gravity: -4, drag: 0.2 };
        }
        Effects.spawnParticles(x, y, color, 1, opts);
      }

      const player = game.player;
      if (!player || player.dead) return;

      // Зоны и сюжетные триггеры входа
      const px = player.x + player.w / 2;
      let zone = null;
      for (const z of this.zones) {
        if (px >= z.x && px < z.x + z.w) { zone = z; break; }
      }
      if (!zone) zone = this.zones[this.zones.length - 1];
      if (zone) {
        this.activeZoneId = zone.id;
        if (!this.seenZones[zone.id]) {
          this.seenZones[zone.id] = true;
          if (game.onZoneEntered) game.onZoneEntered(zone);
        }
      }

      // Авторские кинематографические сцены: срабатывают один раз и сохраняются.
      if (game.state === 'play' && (!window.Dialogue || !window.Dialogue.active) && !game._pendingZoneStory) {
        for (const sc of this.scenes) {
          if (sc.triggered || px < sc.x || px > sc.x + 84) continue;
          sc.triggered = true;
          if (game.onSceneTrigger) game.onSceneTrigger(sc);
          return;
        }
      }

      // Алтари и опасные участки
      for (const s of this.shrines) {
        if (s.cooldown > 0) s.cooldown -= dt;
      }
      for (const h of this.hazards) {
        if (h.tick > 0) h.tick -= dt;
        const inside = player.x < h.x + h.w && player.x + player.w > h.x &&
          player.y + player.h > h.y && player.y + player.h < h.y + h.h + 26;
        if (!inside) continue;
        player.slowTimer = Math.max(player.slowTimer || 0, h.slow || 0.12);
        if (h.tick <= 0) {
          h.tick = 0.7;
          game.hurtPlayer(h.damage, { source: 'hazard', color: h.type === 'lava' ? '#ff6a3c' : '#a06cff' });
          Effects.spawnParticles(px, player.y + player.h - 6, h.type === 'lava' ? '#ff8a3c' : '#b06cff', 6, {
            speed: 100, up: 90, life: 0.45, glow: true
          });
        }
      }

      for (const puzzle of this.puzzles) {
        if (puzzle.lockTimer > 0) puzzle.lockTimer -= dt;
        if (puzzle.solved) continue;
        if (puzzle.kind === 'runes') {
          for (const d of puzzle.devices) {
            const overlap = player.x < d.x + d.w && player.x + player.w > d.x &&
              player.y + player.h >= d.y - 2 && player.y + player.h < d.y + d.h + 18;
            if (overlap && !d.inside) {
              d.inside = true;
              this.activateDevice(puzzle, d.index, game);
            } else if (!overlap) {
              d.inside = false;
            }
          }
        }
        if (game.hintPuzzle !== puzzle) {
          const dist = Math.abs((player.x + player.w / 2) - puzzle.x);
          if (dist < 230) game.hintPuzzle = puzzle;
        }
      }

      // Искры у ненайденных тайников рядом с игроком
      for (const secret of this.secrets) {
        if (secret.found) continue;
        const dist = Math.abs((player.x + player.w / 2) - (secret.x + secret.w / 2));
        if (dist < 240 && Math.random() < 0.12) {
          Effects.spawnParticles(secret.x + secret.w / 2 + (Math.random() - 0.5) * 40, secret.y + 20 + Math.random() * 40, this.theme.accent, 1, {
            speed: 12, life: 0.7, size: 2, gravity: -30, glow: true
          });
        }
      }
    }

    activateDevice(puzzle, index, game) {
      if (puzzle.solved || puzzle.lockTimer > 0) return;
      const expected = puzzle.sequence[puzzle.step];
      const device = puzzle.devices[index];
      if (!device) return;
      if (index === expected && !device.lit && (puzzle.kind !== 'levers' || !device.pulled)) {
        puzzle.step++;
        if (puzzle.kind === 'levers') device.pulled = true;
        else device.lit = true;
        Effects.ring({
          x: device.x + device.w / 2, y: device.y + (puzzle.kind === 'levers' ? 0 : 10),
          r0: 6, maxR: 44, life: 0.4, color: this.theme.accent, width: 3
        });
        Effects.spawnParticles(device.x + device.w / 2, device.y + 8, this.theme.accent, 10, {
          speed: 90, life: 0.5, glow: true
        });
        AudioFX.play('puzzle');
        if (puzzle.step >= puzzle.sequence.length) this.solvePuzzle(puzzle, game);
      } else {
        puzzle.step = 0;
        puzzle.lockTimer = 0.8;
        puzzle.devices.forEach((d) => {
          d.lit = false;
          if (puzzle.kind === 'levers') d.pulled = false;
        });
        Effects.spawnParticles(puzzle.x, this.floorY - 20, '#ff5a5a', 14, { speed: 160, life: 0.5 });
        Effects.text(puzzle.x, this.floorY - 110, 'Печать погасла', { color: '#ff8a8a', size: 12, life: 1 });
        AudioFX.play('error');
      }
    }

    solvePuzzle(puzzle, game) {
      puzzle.solved = true;
      const chest = this.makePuzzleChest(puzzle);
      puzzle.rewardChest = chest;
      Effects.ring({ x: puzzle.x, y: this.floorY - 20, r0: 20, maxR: 220, life: 0.8, color: '#ffd24a', width: 7 });
      Effects.ring({ x: puzzle.x, y: this.floorY - 20, r0: 10, maxR: 140, life: 0.6, color: this.theme.accent, width: 3 });
      Effects.flash('#ffd24a', 0.18, 0.2);
      Effects.spawnParticles(puzzle.x, this.floorY - 20, '#ffd24a', 30, { speed: 260, up: 180, life: 0.9, glow: true });
      Camera.addTrauma(0.35);
      AudioFX.play('secret');
      if (game.onPuzzleSolved) game.onPuzzleSolved(puzzle);
    }

    hitOrbsRect(rect, game) {
      for (const puzzle of this.puzzles) {
        if (puzzle.solved || puzzle.kind !== 'orbs' || puzzle.lockTimer > 0) continue;
        for (const d of puzzle.devices) {
          if (d.lit) continue;
          const hit = rect.x < d.x + d.w && rect.x + rect.w > d.x && rect.y < d.y + d.h && rect.y + rect.h > d.y;
          if (hit) this.activateDevice(puzzle, d.index, game);
        }
      }
    }

    hitOrbsCircle(x, y, r, game) {
      for (const puzzle of this.puzzles) {
        if (puzzle.solved || puzzle.kind !== 'orbs' || puzzle.lockTimer > 0) continue;
        for (const d of puzzle.devices) {
          if (d.lit) continue;
          const nx = Math.max(d.x, Math.min(x, d.x + d.w));
          const ny = Math.max(d.y, Math.min(y, d.y + d.h));
          if ((x - nx) * (x - nx) + (y - ny) * (y - ny) <= r * r) this.activateDevice(puzzle, d.index, game);
        }
      }
    }

    nearDevice(player, device, pad) {
      const cx = device.x + device.w / 2;
      return Math.abs((player.x + player.w / 2) - cx) < (pad || 60) && Math.abs((player.y + player.h) - (device.y + device.h)) < 90;
    }

    getHint(player) {
      const shrine = this.shrines.find((s) => this.nearShrine(player, s));
      const lore = this.lore.find((l) => this.nearLore(player, l));
      const chest = this.chests.find((c) => !c.opened && this.nearChest(player, c));
      const secret = this.secrets.find((s) => !s.found && this.nearSecret(player, s));
      const rack = this.racks.find((r) => !r.broken && this.nearRack(player, r));
      const questObject = this.questObjects.find((q) => !q.done && this.nearQuestObject(player, q));
      let lever = null;
      for (const puzzle of this.puzzles) {
        if (puzzle.solved || puzzle.kind !== 'levers') continue;
        for (const d of puzzle.devices) {
          if (!d.pulled && this.nearDevice(player, d, 56)) { lever = { puzzle, device: d }; break; }
        }
        if (lever) break;
      }
      if (shrine) return '[E] Алтарь Системы';
      if (lore) return lore.read ? '[E] Перечитать запись' : '[E] Прочитать: ' + lore.title;
      if (chest) return '[E] Открыть сундук (' + chest.tier + ')';
      if (secret) return '[E] Исследовать тайник';
      if (rack) return '[E] Разбить проклятую стойку';
      if (questObject) {
        if (questObject.kind === 'brazier') return '[E] Зажечь жаровню';
        if (questObject.kind === 'miner') return '[E] Спасти шахтёра';
        return '[E] Вытащить охотника';
      }
      if (lever) return '[E] Потянуть рычаг';
      for (const puzzle of this.puzzles) {
        if (puzzle.solved) continue;
        if (Math.abs((player.x + player.w / 2) - puzzle.x) < 230) {
          return puzzle.name + ': ' + puzzle.hint;
        }
      }
      return '';
    }

    nearChest(player, c) {
      return Math.abs((player.x + player.w / 2) - (c.x + c.w / 2)) < 58 &&
        Math.abs((player.y + player.h) - (c.y + c.h)) < 60;
    }

    nearSecret(player, s) {
      return Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 64 &&
        Math.abs((player.y + player.h) - (s.y + s.h)) < 90;
    }

    nearRack(player, r) {
      return Math.abs((player.x + player.w / 2) - (r.x + r.w / 2)) < 66 &&
        Math.abs((player.y + player.h) - (r.y + r.h)) < 80;
    }

    nearQuestObject(player, q) {
      return Math.abs((player.x + player.w / 2) - (q.x + q.w / 2)) < 70 &&
        Math.abs((player.y + player.h) - (q.y + q.h)) < 84;
    }

    nearLore(player, l) {
      return Math.abs((player.x + player.w / 2) - (l.x + l.w / 2)) < 66 &&
        Math.abs((player.y + player.h) - (l.y + l.h)) < 80;
    }

    nearShrine(player, s) {
      return Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 72 &&
        Math.abs((player.y + player.h) - (s.y + s.h)) < 80;
    }

    useShrine(shrine, game) {
      if (shrine.cooldown > 0) {
        Effects.text(shrine.x + shrine.w / 2, shrine.y - 22, 'Алтарь восстанавливается', { color: '#9aa0c0', size: 11, life: 0.9 });
        return;
      }
      const p = game.player;
      shrine.cooldown = 18;
      shrine.used = true;
      this.checkpointX = shrine.x + shrine.w / 2;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      p.stunTimer = 0;
      Effects.ring({ x: shrine.x + shrine.w / 2, y: shrine.y + 20, r0: 12, maxR: 150, life: 0.8, color: '#7affc8', width: 5 });
      Effects.ring({ x: shrine.x + shrine.w / 2, y: shrine.y + 20, r0: 4, maxR: 90, life: 0.55, color: '#ffffff', width: 2 });
      Effects.flash('#7affc8', 0.12, 0.16);
      Effects.spawnParticles(shrine.x + shrine.w / 2, shrine.y + 6, '#b6ffe0', 28, {
        speed: 150, up: 170, life: 1.0, glow: true, shape: 'circle'
      });
      AudioFX.play('levelup');
      UI.toast('Алтарь Системы', 'Здоровье и мана восстановлены. Точка возрождения сохранена.', { color: '#7affc8', duration: 3200 });
      if (window.TG) window.TG.haptic('success');
      game.persist();
    }

    openLore(lore, game) {
      const first = !lore.read;
      lore.read = true;
      if (game.showLore) game.showLore(lore, first);
      else if (window.Dialogue) {
        window.Dialogue.start([{ speaker: lore.title, text: lore.text, icon: null }]);
      }
      if (first) {
        if (game.addXp) game.addXp(lore.xp || 18);
        Effects.ring({ x: lore.x + lore.w / 2, y: lore.y + 20, maxR: 82, life: 0.55, color: '#ffd24a', width: 3 });
        Effects.spawnParticles(lore.x + lore.w / 2, lore.y + 16, '#ffd24a', 14, { speed: 90, up: 90, life: 0.6, glow: true });
        AudioFX.play('secret');
        game.persist();
      }
    }

    tryInteract(player, game) {
      let best = null, bestD = 1e9;
      for (const s of this.shrines) {
        if (!this.nearShrine(player, s)) continue;
        const d = Math.abs((player.x + player.w / 2) - (s.x + s.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'shrine', obj: s }; }
      }
      for (const l of this.lore) {
        if (!this.nearLore(player, l)) continue;
        const d = Math.abs((player.x + player.w / 2) - (l.x + l.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'lore', obj: l }; }
      }
      for (const c of this.chests) {
        if (c.opened || !this.nearChest(player, c)) continue;
        const d = Math.abs((player.x + player.w / 2) - (c.x + c.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'chest', obj: c }; }
      }
      for (const s of this.secrets) {
        if (s.found || !this.nearSecret(player, s)) continue;
        const d = Math.abs((player.x + player.w / 2) - (s.x + s.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'secret', obj: s }; }
      }
      for (const r of this.racks) {
        if (r.broken || !this.nearRack(player, r)) continue;
        const d = Math.abs((player.x + player.w / 2) - (r.x + r.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'rack', obj: r }; }
      }
      for (const q of this.questObjects) {
        if (q.done || !this.nearQuestObject(player, q)) continue;
        const d = Math.abs((player.x + player.w / 2) - (q.x + q.w / 2));
        if (d < bestD) { bestD = d; best = { type: 'questObject', obj: q }; }
      }
      for (const p of this.puzzles) {
        if (p.solved || p.kind !== 'levers') continue;
        for (const d of p.devices) {
          if (d.pulled || !this.nearDevice(player, d, 56)) continue;
          const dist = Math.abs((player.x + player.w / 2) - (d.x + d.w / 2));
          if (dist < bestD) { bestD = dist; best = { type: 'lever', puzzle: p, obj: d }; }
        }
      }
      if (!best) return false;
      if (best.type === 'shrine') {
        this.useShrine(best.obj, game);
        return true;
      }
      if (best.type === 'lore') {
        this.openLore(best.obj, game);
        return true;
      }
      if (best.type === 'chest') {
        best.obj.opened = true;
        Effects.spawnParticles(best.obj.x + best.obj.w / 2, best.obj.y, '#ffd24a', 16, { speed: 160, up: 120, life: 0.6 });
        AudioFX.play('chest');
        if (game.onChestOpened) game.onChestOpened(best.obj);
      } else if (best.type === 'secret') {
        best.obj.found = true;
        best.obj.revealTimer = 1;
        Effects.ring({ x: best.obj.x + best.obj.w / 2, y: best.obj.y + best.obj.h / 2, maxR: 130, life: 0.7, color: '#ffd24a', width: 5 });
        Effects.spawnParticles(best.obj.x + best.obj.w / 2, best.obj.y + best.obj.h / 2, '#ffd24a', 26, { speed: 220, life: 0.9, glow: true });
        AudioFX.play('secret');
        if (game.onSecretFound) game.onSecretFound(best.obj);
      } else if (best.type === 'rack') {
        best.obj.broken = true;
        Effects.ring({ x: best.obj.x + best.obj.w / 2, y: best.obj.y + best.obj.h / 2, maxR: 120, life: 0.65, color: '#a06cff', width: 5 });
        Effects.spawnParticles(best.obj.x + best.obj.w / 2, best.obj.y + best.obj.h / 2, '#a06cff', 26, { speed: 210, life: 0.8, glow: true });
        AudioFX.play('secret');
        if (game.onArmorRack) game.onArmorRack(best.obj);
      } else if (best.type === 'questObject') {
        best.obj.done = true;
        const warm = best.obj.kind === 'brazier';
        Effects.ring({ x: best.obj.x + best.obj.w / 2, y: best.obj.y + best.obj.h / 2, maxR: 120, life: 0.7, color: warm ? '#ffb36a' : '#7affc8', width: 5 });
        Effects.spawnParticles(best.obj.x + best.obj.w / 2, best.obj.y + best.obj.h / 2, warm ? '#ffd24a' : '#b6ffe0', 24, { speed: 200, up: 90, life: 0.8, glow: true });
        AudioFX.play(warm ? 'secret' : 'heal');
        if (game.onQuestObject) game.onQuestObject(best.obj);
      } else if (best.type === 'lever') {
        this.activateDevice(best.puzzle, best.obj.index, game);
      }
      return true;
    }

    // ---------- Отрисовка ----------
    activeZone() {
      for (const z of this.zones) {
        const px = Engine.Camera.x + Engine.CANVAS_W / 2;
        if (px >= z.x && px < z.x + z.w) return z;
      }
      return this.zones[this.zones.length - 1];
    }

    visible(x, w) {
      const cam = Engine.Camera;
      return x + w > cam.x - 100 && x < cam.x + Engine.CANVAS_W + 100;
    }

    drawBackground(ctx) {
      this.level.drawBackground(ctx);
      // Уникальная арена босса проявляется по мере приближения к ней.
      if (this.arena && this.arenaBg && this.arenaBg.img) {
        const camCenter = Engine.Camera.x + Engine.CANVAS_W / 2;
        const p = Math.max(0, Math.min(1, (camCenter - this.arena.x) / 480));
        if (p > 0.01) {
          ctx.save();
          ctx.globalAlpha = p;
          ctx.drawImage(this.arenaBg.img, 0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
          ctx.globalAlpha = 1;
          if (!this._arenaVignette) {
            this._arenaVignette = ctx.createRadialGradient(480, 250, 140, 480, 250, 580);
            this._arenaVignette.addColorStop(0, 'rgba(0,0,0,0)');
            this._arenaVignette.addColorStop(1, 'rgba(0,0,0,0.58)');
          }
          ctx.fillStyle = this._arenaVignette;
          ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
          ctx.restore();
        }
      }
      // Цветокоррекция локации: яркие фоны (больница, лёд) приводим к общей тёмной палитре.
      const zone = this.activeZone();
      ctx.save();
      ctx.fillStyle = (zone && zone.tint) || this.theme.tint || 'rgba(6,8,16,0.28)';
      ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
      ctx.fillStyle = this.theme.fog;
      ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
      ctx.restore();
    }

    draw(ctx) {
      const theme = this.theme;
      const floor = this.floorY;
      const L = this.level;

      this.drawBackdrop(ctx);
      this.drawZoneGates(ctx);

      L.drawSolids(ctx, theme);
      this.drawGroundDecals(ctx);
      this.drawAtmosphere(ctx);
      this.drawZoneProps(ctx);
      this.drawHazards(ctx);
      this.drawShrines(ctx);
      this.drawLore(ctx);

      // Секреты
      for (const s of this.secrets) this.drawSecret(ctx, s);

      // Загадки
      for (const p of this.puzzles) this.drawPuzzle(ctx, p);

      // Сундуки
      for (const c of this.chests) this.drawChest(ctx, c);

      // Проклятые стойки доспехов
      for (const r of this.racks) this.drawArmorRack(ctx, r);

      // Локальные объекты заданий
      for (const q of this.questObjects) this.drawQuestObject(ctx, q);

      // Факелы
      for (const tx of this.torches) {
        if (this.visible(tx - 20, 40)) this.drawTorch(ctx, tx, floor, theme);
      }

      // миникарта-цели (светящиеся маркеры)
      for (const s of this.secrets) {
        if (s.found) continue;
        const dist = Math.abs((Engine.Camera.x + Engine.CANVAS_W / 2) - s.x);
        if (dist < 500) {
          ctx.save();
          ctx.globalAlpha = 0.25 + Math.sin(this.time * 3) * 0.1;
          ctx.fillStyle = theme.accent;
          ctx.fillRect(s.x + s.w / 2 - 2, s.y - 26, 4, 10);
          ctx.restore();
        }
      }
    }

    drawBackdrop(ctx) {
      const floor = this.floorY;
      const theme = this.theme;
      for (const z of this.zones) {
        if (!this.visible(z.x, z.w)) continue;
        const spots = Engine.lowQuality
          ? [z.x + z.w * 0.28, z.x + z.w * 0.72]
          : [z.x + z.w * 0.12, z.x + z.w * 0.32, z.x + z.w * 0.5,
            z.x + z.w * 0.7, z.x + z.w * 0.88];
        spots.forEach((x, i) => {
          if (!this.visible(x - 90, 200)) return;
          const k = z.kind;
          ctx.save();
          if (this.themeId === 'hospital' || this.themeId === 'guild') {
            const y = 120 + (i % 2) * 36;
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = this.themeId === 'guild' ? '#e8c76a' : '#9fe6ff';
            ctx.fillRect(x - 46, y, 92, 74);
            ctx.fillStyle = 'rgba(8,12,20,0.7)';
            ctx.fillRect(x - 38, y + 8, 76, 58);
            ctx.fillStyle = accentAlpha(this.theme.accent, 0.16);
            ctx.fillRect(x - 30, y + 16, 60, 42);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(x - 52, y - 10, 104, 10);
            ctx.fillRect(x - 52, y + 74, 104, 8);
          } else if (this.themeId === 'cave' || k === 'tunnel') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#05070d';
            for (let s = 0; s < 4; s++) {
              const sx = x - 70 + s * 42;
              const h = 50 + ((s * 37 + i * 23) % 90);
              ctx.beginPath();
              ctx.moveTo(sx - 16, 70);
              ctx.lineTo(sx, 70 + h);
              ctx.lineTo(sx + 18, 70);
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = this.theme.accent;
            ctx.beginPath();
            ctx.ellipse(x, floor - 4, 130, 34, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (z.kind === 'hive') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#3a2a12';
            ctx.fillRect(x - 110, 40, 220, floor - 40);
            ctx.fillStyle = '#5a4020';
            for (let hy = 60; hy < floor - 20; hy += 34) {
              for (let hx = -90; hx <= 90; hx += 38) {
                ctx.beginPath();
                ctx.arc(x + hx + (hy % 68 ? 18 : 0), hy, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(20,12,4,0.35)';
                ctx.beginPath();
                ctx.arc(x + hx + (hy % 68 ? 18 : 0), hy, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#5a4020';
              }
            }
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#7ac850';
            ctx.beginPath(); ctx.ellipse(x, floor - 6, 140, 26, 0, 0, Math.PI * 2); ctx.fill();
          } else if (this.themeId === 'jungle') {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#07140b';
            ctx.fillRect(x - 34, 40, 68, floor - 40);
            ctx.fillStyle = '#0d2413';
            ctx.fillRect(x - 22, 40, 44, floor - 40);
            ctx.fillStyle = '#0a1a0e';
            for (let s = 0; s < 5; s++) {
              ctx.beginPath();
              ctx.ellipse(x - 50 + s * 26, 90 + s * 12, 52, 16, -0.35 + s * 0.18, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (this.themeId === 'ice') {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#bfe6f7';
            for (let s = 0; s < 3; s++) {
              const bx = x - 54 + s * 48;
              const h = 90 + ((s * 43 + i * 17) % 100);
              ctx.beginPath();
              ctx.moveTo(bx - 16, floor);
              ctx.lineTo(bx, floor - h);
              ctx.lineTo(bx + 16, floor);
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#8fd8f0';
            ctx.beginPath();
            ctx.ellipse(x, floor - 8, 150, 28, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (this.themeId === 'castle') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#160810';
            ctx.fillRect(x - 38, 40, 76, floor - 40);
            ctx.fillStyle = '#2a1018';
            ctx.beginPath();
            ctx.moveTo(x - 50, 40);
            ctx.lineTo(x, 0);
            ctx.lineTo(x + 50, 40);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ff6a6a';
            ctx.fillRect(x - 8, 120, 16, 46);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(x - 4, 128, 8, 30);
          } else if (this.themeId === 'throne') {
            ctx.globalAlpha = 0.42;
            ctx.fillStyle = '#12081e';
            ctx.fillRect(x - 42, 30, 84, floor - 30);
            ctx.fillStyle = '#241038';
            ctx.fillRect(x - 30, 30, 60, floor - 30);
            ctx.fillStyle = accentAlpha(this.theme.accent, 0.28);
            ctx.fillRect(x - 6, 70, 12, floor - 70);
            for (let s = 0; s < 3; s++) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(x - 58 + s * 50, 40 + s * 6, 16, 120);
            }
          } else {
            // храм: арки и статуи
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#080512';
            ctx.fillRect(x - 66, 70, 22, floor - 70);
            ctx.fillRect(x + 44, 70, 22, floor - 70);
            ctx.beginPath();
            ctx.arc(x, 70, 68, Math.PI, 0);
            ctx.fill();
            ctx.globalAlpha = 0.24;
            ctx.fillStyle = this.theme.accent;
            ctx.fillRect(x - 54, 86, 108, 4);
            ctx.beginPath();
            ctx.arc(x, 86, 58, Math.PI, 0);
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.theme.accent;
            ctx.stroke();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#0a0714';
            ctx.beginPath();
            ctx.ellipse(x, floor - 8, 120, 24, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      }
    }

    drawZoneGates(ctx) {
      const floor = this.floorY;
      const theme = this.theme;
      this.zones.forEach((z, i) => {
        if (i === 0) return;
        if (!this.visible(z.x - 90, 180)) return;
        const x = z.x;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x - 54, floor - 176, 16, 176);
        ctx.fillRect(x + 38, floor - 176, 16, 176);
        ctx.fillStyle = theme.wall;
        ctx.fillRect(x - 50, floor - 170, 12, 170);
        ctx.fillRect(x + 38, floor - 170, 12, 170);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x - 50, floor - 170, 3, 170);
        ctx.fillRect(x + 38, floor - 170, 3, 170);
        ctx.fillStyle = theme.wall;
        ctx.fillRect(x - 50, floor - 190, 100, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x - 50, floor - 190, 100, 3);
        ctx.fillStyle = accentAlpha(theme.accent, 0.22);
        ctx.fillRect(x - 32, floor - 182, 64, 4);
        // висящая табличка с названием зоны
        ctx.fillStyle = 'rgba(8,8,16,0.85)';
        ctx.fillRect(x - 68, floor - 158, 136, 30);
        ctx.strokeStyle = accentAlpha(theme.accent, 0.55);
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 68, floor - 158, 136, 30);
        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(z.name, x, floor - 139);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.ellipse(x, floor - 4, 64, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    drawGroundDecals(ctx) {
      const floor = this.floorY;
      const themeId = this.themeId;
      for (const z of this.zones) {
        if (!this.visible(z.x, z.w)) continue;
        const count = Engine.lowQuality ? Math.max(4, Math.floor(z.w / 260)) : Math.max(8, Math.floor(z.w / 150));
        for (let i = 0; i < count; i++) {
          const x = z.x + 80 + ((i + 0.5) / count) * (z.w - 160);
          const r = pseudo(x, i + this.chapterId);
          ctx.save();
          ctx.globalAlpha = 0.16 + r * 0.12;
          if (themeId === 'ice') {
            ctx.fillStyle = '#eafaff';
            ctx.beginPath();
            ctx.ellipse(x, floor - 3, 24 + r * 30, 4 + r * 3, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (themeId === 'jungle') {
            ctx.strokeStyle = '#7ec850';
            ctx.lineWidth = 2;
            for (let k = 0; k < 3; k++) {
              ctx.beginPath();
              ctx.moveTo(x - 18 + k * 12, floor - 2);
              ctx.quadraticCurveTo(x - 8 + k * 12, floor - 14 - r * 10, x + 2 + k * 12, floor - 2);
              ctx.stroke();
            }
          } else if (themeId === 'hospital' || themeId === 'guild') {
            ctx.strokeStyle = themeId === 'hospital' ? '#cfeaff' : '#e8c76a';
            ctx.lineWidth = 1;
            for (let k = 0; k < 2; k++) {
              ctx.beginPath();
              ctx.moveTo(x - 30 + k * 22, floor - 5);
              ctx.lineTo(x - 18 + k * 22, floor - 18);
              ctx.lineTo(x - 6 + k * 22, floor - 8);
              ctx.stroke();
            }
          } else if (themeId === 'castle' || themeId === 'throne') {
            ctx.strokeStyle = themeId === 'castle' ? '#8a2230' : '#ff6a3c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 26, floor - 2);
            ctx.lineTo(x - 12, floor - 8);
            ctx.lineTo(x - 2, floor - 4);
            ctx.lineTo(x + 12, floor - 12);
            ctx.stroke();
            if (r > 0.65) {
              ctx.fillStyle = themeId === 'castle' ? '#4a0e18' : '#ff5a2a';
              ctx.fillRect(x + 16, floor - 5, 22, 3);
            }
          } else {
            ctx.strokeStyle = themeId === 'cave' ? '#6a74a8' : '#a06cff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - 20, floor - 3);
            ctx.lineTo(x - 8, floor - 10);
            ctx.lineTo(x + 4, floor - 5);
            ctx.lineTo(x + 16, floor - 12);
            ctx.stroke();
            if (r > 0.5) {
              ctx.fillStyle = '#3a6a3a';
              ctx.fillRect(x - 14, floor - 4, 30, 2);
            }
          }
          ctx.restore();
        }
      }
    }

    drawHazards(ctx) {
      for (const h of this.hazards) {
        if (!this.visible(h.x, h.w)) continue;
        const cx = h.x + h.w / 2;
        const base = Math.min(h.y + h.h, this.floorY);
        ctx.save();
        if (h.type === 'lava') {
          const g = ctx.createLinearGradient(h.x, base - 8, h.x, base + 4);
          g.addColorStop(0, '#ffd24a'); g.addColorStop(0.5, '#ff6a2a'); g.addColorStop(1, '#7a1a08');
          ctx.fillStyle = g;
          ctx.fillRect(h.x, base - 12, h.w, 12);
          ctx.globalAlpha = 0.5 + Math.sin(this.time * 3 + h.x) * 0.2;
          ctx.fillStyle = '#ffb04a';
          for (let i = 0; i < h.w; i += 26) {
            const r = 3 + Math.abs(Math.sin(this.time * 2 + i)) * 4;
            ctx.beginPath(); ctx.arc(h.x + i + 12, base - 11, r, 0, Math.PI * 2); ctx.fill();
          }
        } else if (h.type === 'acid') {
          ctx.fillStyle = 'rgba(90,220,90,0.35)';
          ctx.fillRect(h.x, base - 6, h.w, 10);
          ctx.strokeStyle = '#8fef6a';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          for (let i = 0; i <= h.w; i += 8) {
            const y = base - 9 - Math.sin(this.time * 2 + i * 0.2) * 3;
            if (i === 0) ctx.moveTo(h.x + i, y); else ctx.lineTo(h.x + i, y);
          }
          ctx.stroke();
        } else if (h.type === 'ice') {
          ctx.fillStyle = 'rgba(180,240,255,0.3)';
          ctx.fillRect(h.x, base - 5, h.w, 9);
          for (let i = 0; i < h.w; i += 22) {
            ctx.fillStyle = '#d8f6ff';
            ctx.beginPath();
            ctx.moveTo(h.x + i, base);
            ctx.lineTo(h.x + i + 8, base - 22 - Math.sin(i) * 6);
            ctx.lineTo(h.x + i + 16, base);
            ctx.closePath();
            ctx.fill();
          }
        } else if (h.type === 'thorns') {
          ctx.strokeStyle = '#6a9a4a';
          ctx.lineWidth = 2;
          for (let i = 0; i < h.w; i += 16) {
            ctx.beginPath();
            ctx.moveTo(h.x + i, base);
            ctx.lineTo(h.x + i + 6, base - 18);
            ctx.lineTo(h.x + i + 12, base);
            ctx.stroke();
          }
        } else {
          // spikes
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(h.x, base - 4, h.w, 5);
          for (let i = 0; i < h.w; i += 16) {
            ctx.fillStyle = '#b8c0cc';
            ctx.beginPath();
            ctx.moveTo(h.x + i, base);
            ctx.lineTo(h.x + i + 6, base - 20);
            ctx.lineTo(h.x + i + 12, base);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#e8f0f8';
            ctx.fillRect(h.x + i + 5, base - 18, 2, 8);
          }
        }
        ctx.restore();
      }
    }

    drawShrines(ctx) {
      for (const s of this.shrines) {
        if (!this.visible(s.x - 20, s.w + 40)) continue;
        const cx = s.x + s.w / 2;
        const base = s.y + s.h;
        const ready = s.cooldown <= 0;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(cx, base, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2a3040';
        ctx.fillRect(cx - 22, base - 24, 44, 24);
        ctx.fillStyle = '#4a5468';
        ctx.fillRect(cx - 22, base - 24, 44, 4);
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(cx - 14, base - 18, 28, 3);
        // кристалл
        const pulse = 0.7 + Math.sin(this.time * 3 + s.x) * 0.2;
        ctx.globalAlpha = ready ? pulse : 0.22;
        const g = ctx.createRadialGradient(cx, base - 38, 2, cx, base - 38, 34);
        g.addColorStop(0, 'rgba(160,255,220,0.9)');
        g.addColorStop(1, 'rgba(90,255,200,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, base - 38, 34, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = ready ? 1 : 0.35;
        ctx.fillStyle = '#b6ffe0';
        ctx.beginPath();
        ctx.moveTo(cx, base - 60);
        ctx.lineTo(cx + 8, base - 38);
        ctx.lineTo(cx, base - 26);
        ctx.lineTo(cx - 8, base - 38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, base - 52, 4, 12);
        // руническое кольцо
        ctx.globalAlpha = ready ? 0.55 : 0.18;
        ctx.strokeStyle = '#7affc8';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, base - 8, 26, 7, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#7affc8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('СИСТЕМА', cx, base - 70);
        ctx.restore();
      }
    }

    drawLore(ctx) {
      for (const l of this.lore) {
        if (!this.visible(l.x - 20, l.w + 40)) continue;
        const cx = l.x + l.w / 2;
        const base = l.y + l.h;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.ellipse(cx, base, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
        if (l.kind === 'terminal') {
          ctx.fillStyle = '#2a303c';
          ctx.fillRect(cx - 16, base - 34, 32, 34);
          ctx.fillStyle = l.read ? '#3a6a6a' : '#7affc8';
          ctx.globalAlpha = l.read ? 0.35 : 0.65 + Math.sin(this.time * 3 + l.x) * 0.2;
          ctx.fillRect(cx - 11, base - 29, 22, 15);
          ctx.fillStyle = '#0a1018';
          ctx.fillRect(cx - 8, base - 26, 16, 2);
          ctx.fillRect(cx - 8, base - 22, 11, 2);
          ctx.fillStyle = '#4a5460';
          ctx.fillRect(cx - 10, base - 14, 20, 3);
        } else if (l.kind === 'corpse') {
          ctx.fillStyle = '#3a3028';
          ctx.fillRect(cx - 22, base - 10, 44, 10);
          ctx.fillStyle = '#5a4a3a';
          ctx.beginPath(); ctx.arc(cx - 18, base - 16, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#8a7a5a';
          ctx.fillRect(cx + 2, base - 15, 20, 12);
          ctx.fillStyle = l.read ? '#6a5a3a' : '#ffd24a';
          ctx.fillRect(cx + 8, base - 12, 8, 5);
        } else if (l.kind === 'banner') {
          ctx.fillStyle = themeAlpha(this.theme.accent, 0.4);
          ctx.fillRect(cx - 18, base - 70, 36, 62);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          for (let i = 0; i < 3; i++) ctx.fillRect(cx - 14, base - 60 + i * 16, 28, 3);
          ctx.fillStyle = this.theme.accent;
          ctx.fillRect(cx - 2, base - 74, 4, 8);
        } else {
          // stone tablet
          ctx.fillStyle = '#30364a';
          ctx.fillRect(cx - 15, base - 52, 30, 52);
          ctx.fillStyle = '#4a5468';
          ctx.fillRect(cx - 15, base - 52, 30, 4);
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(cx - 11, base - 44, 22, 2);
          ctx.fillRect(cx - 11, base - 38, 16, 2);
          ctx.fillRect(cx - 11, base - 32, 20, 2);
          ctx.fillStyle = l.read ? '#6a5a3a' : this.theme.accent;
          ctx.globalAlpha = l.read ? 0.4 : 0.55 + Math.sin(this.time * 2.4 + l.x) * 0.25;
          ctx.fillRect(cx - 4, base - 24, 8, 8);
          ctx.fillRect(cx - 8, base - 22, 16, 4);
        }
        if (!l.read) {
          ctx.globalAlpha = 0.35 + Math.sin(this.time * 3 + l.x) * 0.15;
          ctx.fillStyle = '#ffd24a';
          ctx.fillRect(cx - 1, base - 72, 2, 12);
        }
        ctx.restore();
      }
    }

    drawZoneProps(ctx) {
      const floor = this.floorY;
      const unique = { portal: 1, helicopter: 1, throne: 1, dragon_skull: 1, altar: 1 };
      for (const z of this.zones) {
        if (!this.visible(z.x, z.w)) continue;
        const props = z.props || [];
        const n = props.length;
        if (!n) continue;
        const reps = z.w > 1200 ? 2 : 1;
        for (let rp = 0; rp < reps; rp++) {
          for (let i = 0; i < n; i++) {
            const type = props[i];
            if (!type || type === 'gate') continue;
            if (rp > 0 && unique[type]) continue;
            const r = pseudo(z.x + i * 97 + rp * 41, this.chapterId);
            const x = z.x + 100 + ((i + rp * n + 0.5) / (n * reps)) * (z.w - 200) + (r - 0.5) * 56;
            if (!this.visible(x - 80, 160)) continue;
            this.drawProp(ctx, type, x, floor, 0.9 + r * 0.25, rp > 0 && r > 0.5);
          }
        }
      }
      for (const d of this.decor) {
        if (!this.visible(d.x - 120, 260)) continue;
        this.drawProp(ctx, d.type, d.x, floor, d.scale || 1, d.flip);
      }
    }

    drawProp(ctx, type, x, floor, scale, flip) {
      const theme = this.theme;
      const accent = theme.accent;
      const wall = theme.wall;
      ctx.save();
      ctx.translate(x, floor);
      if (flip) ctx.scale(-1, 1);
      const s = typeof scale === 'number' && scale > 0 ? scale : 1;
      ctx.scale(s, s);
      ctx.globalAlpha = 0.94;

      if (type === 'pillar' || type === 'column') {
        const h = type === 'pillar' ? 150 : 190;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(10, -h, 24, h);
        ctx.fillStyle = wall;
        ctx.fillRect(0, -h, 26, h);
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(1, -h, 4, h);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let y = -h + 18; y < -10; y += 24) ctx.fillRect(4, y, 20, 3);
        ctx.fillStyle = accentAlpha(accent, 0.45);
        ctx.fillRect(-4, -h - 8, 34, 8);
        ctx.fillRect(-4, -8, 34, 8);
        if (type === 'pillar') {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath(); ctx.moveTo(26, -h + 18); ctx.lineTo(38, -h + 50); ctx.lineTo(26, -h + 42); ctx.closePath(); ctx.fill();
        }
      } else if (type === 'statue') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-18, -106, 36, 10);
        ctx.fillStyle = '#2a3040';
        ctx.fillRect(-16, -100, 32, 10);
        ctx.fillStyle = '#4a5468';
        ctx.fillRect(-12, -92, 24, 62);
        ctx.fillStyle = '#3a4050';
        ctx.fillRect(-9, -90, 18, 28);
        ctx.fillStyle = '#5a6478';
        ctx.beginPath(); ctx.arc(0, -96, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(-6, -98, 12, 4);
        ctx.fillStyle = accentAlpha(accent, 0.7);
        ctx.fillRect(-2, -100, 4, 2);
        ctx.fillStyle = '#4a5468';
        ctx.fillRect(-22, -72, 44, 6);
        ctx.fillStyle = '#30364a';
        ctx.fillRect(-8, -30, 16, 30);
      } else if (type === 'altar') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(-28, -6, 60, 6);
        ctx.fillStyle = wall;
        ctx.fillRect(-24, -28, 48, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(-24, -28, 48, 3);
        ctx.fillStyle = accentAlpha(accent, 0.5);
        ctx.fillRect(-14, -22, 28, 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.45 + Math.sin(this.time * 2 + x) * 0.15;
        ctx.fillRect(-4, -48, 8, 16);
        ctx.restore();
        return;
      } else if (type === 'brazier') {
        ctx.fillStyle = '#2a2018';
        ctx.fillRect(-3, -34, 6, 34);
        ctx.fillStyle = '#4a3a24';
        ctx.fillRect(-12, -38, 24, 8);
        const g = ctx.createRadialGradient(0, -48, 2, 0, -48, 36);
        g.addColorStop(0, 'rgba(255,210,120,0.5)');
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-36, -84, 72, 72);
        ctx.fillStyle = theme.flame;
        ctx.beginPath();
        ctx.moveTo(-7, -38); ctx.lineTo(Math.sin(this.time * 8 + x) * 3, -58); ctx.lineTo(7, -38);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(0, -50); ctx.lineTo(2, -40); ctx.closePath(); ctx.fill();
      } else if (type === 'banner' || type === 'elf_banner') {
        ctx.fillStyle = '#2a1a20';
        ctx.fillRect(-2, -110, 4, 110);
        const col = type === 'elf_banner' ? '#6ac8e8' : accent;
        ctx.fillStyle = themeAlpha(col, 0.55);
        ctx.beginPath();
        ctx.moveTo(0, -108); ctx.lineTo(28, -100); ctx.lineTo(24, -48); ctx.lineTo(12, -58); ctx.lineTo(0, -46);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = themeAlpha('#ffffff', 0.2);
        ctx.fillRect(4, -96, 16, 3);
        ctx.fillRect(4, -86, 12, 3);
        ctx.fillStyle = themeAlpha(col, 0.8);
        ctx.fillRect(10, -76, 8, 8);
      } else if (type === 'pew') {
        ctx.fillStyle = '#2a2020';
        ctx.fillRect(-44, -20, 88, 8);
        ctx.fillRect(-38, -12, 6, 12);
        ctx.fillRect(32, -12, 6, 12);
        ctx.fillStyle = '#4a3a30';
        ctx.fillRect(-44, -22, 88, 4);
      } else if (type === 'rubble') {
        ctx.fillStyle = '#2a3040';
        for (let i = 0; i < 5; i++) {
          const bx = -28 + i * 13;
          const bw = 10 + (i % 3) * 7;
          ctx.fillRect(bx, -8 - (i % 3) * 7, bw, 8 + (i % 3) * 7);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(-18, -18, 12, 3);
      } else if (type === 'bones') {
        ctx.strokeStyle = '#d8d0bc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-24, -4); ctx.lineTo(18, -12);
        ctx.moveTo(-14, -16); ctx.lineTo(24, -2);
        ctx.stroke();
        ctx.fillStyle = '#e8e0cc';
        ctx.beginPath(); ctx.arc(-16, -10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1410';
        ctx.fillRect(-19, -12, 3, 3); ctx.fillRect(-13, -12, 3, 3);
        ctx.fillRect(-18, -7, 5, 2);
      } else if (type === 'crate') {
        ctx.fillStyle = '#4a3620'; ctx.fillRect(-18, -32, 36, 32);
        ctx.fillStyle = '#6b4a26'; ctx.fillRect(-18, -32, 36, 4);
        ctx.strokeStyle = '#2a1e12'; ctx.lineWidth = 2;
        ctx.strokeRect(-18, -32, 36, 32);
        ctx.beginPath(); ctx.moveTo(-18, -32); ctx.lineTo(18, 0); ctx.moveTo(18, -32); ctx.lineTo(-18, 0); ctx.stroke();
      } else if (type === 'barrel') {
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-13, -36, 26, 36);
        ctx.fillStyle = '#5a4024'; ctx.fillRect(-13, -34, 26, 4);
        ctx.strokeStyle = '#241a10'; ctx.lineWidth = 2;
        ctx.strokeRect(-13, -36, 26, 36);
        ctx.strokeRect(-13, -24, 26, 2); ctx.strokeRect(-13, -10, 26, 2);
      } else if (type === 'minecart' || type === 'rail') {
        if (type === 'rail') {
          ctx.strokeStyle = '#4a4238'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(-60, -2); ctx.lineTo(60, -2); ctx.stroke();
          ctx.strokeStyle = '#6a5a42';
          for (let i = -54; i < 60; i += 18) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i + 4, 0); ctx.stroke(); }
        } else {
          ctx.fillStyle = '#2a2a30'; ctx.fillRect(-26, -30, 52, 18);
          ctx.fillStyle = '#4a4a54'; ctx.fillRect(-26, -32, 52, 4);
          ctx.fillStyle = '#3a3a44';
          ctx.fillRect(-22, -12, 6, 12); ctx.fillRect(16, -12, 6, 12);
          ctx.fillStyle = '#8a6a3a';
          ctx.fillRect(-18, -28, 12, 6); ctx.fillRect(-2, -30, 16, 8);
          ctx.strokeStyle = '#6a5a42'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-30, -2); ctx.lineTo(30, -2); ctx.stroke();
        }
      } else if (type === 'support') {
        ctx.fillStyle = '#4a3620';
        ctx.fillRect(-22, -120, 8, 120);
        ctx.fillRect(14, -120, 8, 120);
        ctx.fillStyle = '#6b4a26';
        ctx.fillRect(-26, -124, 56, 8);
        ctx.fillStyle = '#3a2a16';
        ctx.fillRect(-20, -112, 2, 108);
      } else if (type === 'crystal' || type === 'ice_crystal') {
        const col = type === 'crystal' ? accent : '#bfe6f7';
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = themeAlpha(col, 0.5 + i * 0.15);
          ctx.beginPath();
          ctx.moveTo(-10 + i * 10, 0);
          ctx.lineTo(-4 + i * 10, -26 - i * 14);
          ctx.lineTo(4 + i * 10, 0);
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(0, -4, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'ice_tree') {
        ctx.fillStyle = '#2a3a4a'; ctx.fillRect(-4, -100, 8, 100);
        ctx.fillStyle = '#bfe6f7';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, -100 - i * 16);
          ctx.lineTo(-28 - i * 8, -60 + i * 12);
          ctx.lineTo(28 + i * 8, -60 + i * 12);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-1, -96, 2, 40);
      } else if (type === 'frozen') {
        ctx.fillStyle = 'rgba(160,220,255,0.5)';
        ctx.beginPath(); ctx.ellipse(0, -20, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a4a5a'; ctx.fillRect(-18, -18, 30, 10);
        ctx.fillStyle = '#5a6a7a'; ctx.beginPath(); ctx.arc(-18, -22, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bfe6f7'; ctx.fillRect(-26, -30, 4, 24); ctx.fillRect(14, -26, 4, 20);
      } else if (type === 'armor' || type === 'dummy') {
        ctx.fillStyle = '#2a1a20'; ctx.fillRect(-18, -4, 36, 4);
        ctx.fillStyle = '#4a1a24'; ctx.fillRect(-2, -80, 4, 80);
        ctx.fillStyle = '#6a2430'; ctx.fillRect(-14, -70, 28, 34);
        ctx.fillStyle = '#8a3040'; ctx.fillRect(-16, -76, 32, 8);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(-4, -64, 8, 12);
        ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.arc(0, -84, 10, 0, Math.PI * 2); ctx.fill();
        if (type === 'armor') {
          ctx.fillStyle = '#c8a040'; ctx.fillRect(-24, -78, 48, 4);
        } else {
          ctx.strokeStyle = '#8a6a5a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-24, -54); ctx.lineTo(24, -54); ctx.stroke();
        }
      } else if (type === 'candelabra') {
        ctx.fillStyle = '#2a2018'; ctx.fillRect(-2, -60, 4, 60);
        ctx.fillStyle = '#4a3a24'; ctx.fillRect(-18, -62, 36, 4);
        for (let i = -1; i <= 1; i++) {
          ctx.fillStyle = '#e8d8b0'; ctx.fillRect(i * 14 - 1, -70, 2, 10);
          ctx.fillStyle = theme.flame;
          ctx.beginPath(); ctx.arc(i * 14, -73, 2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (type === 'gargoyle') {
        ctx.fillStyle = '#1a1420';
        ctx.fillRect(-18, -4, 36, 4);
        ctx.fillStyle = '#2a2230';
        ctx.fillRect(-10, -58, 20, 54);
        ctx.fillStyle = '#3a3040';
        ctx.beginPath(); ctx.arc(0, -62, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6a6a';
        ctx.fillRect(-5, -64, 3, 2); ctx.fillRect(2, -64, 3, 2);
        ctx.fillStyle = '#2a2230';
        ctx.beginPath(); ctx.moveTo(-10, -58); ctx.lineTo(-28, -78); ctx.lineTo(-22, -46); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, -58); ctx.lineTo(28, -78); ctx.lineTo(22, -46); ctx.closePath(); ctx.fill();
      } else if (type === 'carpet') {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#5a1420';
        ctx.fillRect(-60, -4, 120, 4);
        ctx.fillStyle = '#8a2430';
        ctx.fillRect(-60, -5, 120, 1);
      } else if (type === 'fountain') {
        ctx.fillStyle = '#2a1a20'; ctx.fillRect(-24, -26, 48, 26);
        ctx.fillStyle = '#4a1a24'; ctx.fillRect(-18, -24, 36, 8);
        ctx.fillStyle = '#8a2230';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-14, -22, 28, 3);
        ctx.fillStyle = '#c84a52';
        ctx.fillRect(-2, -46, 4, 22);
      } else if (type === 'throne') {
        ctx.fillStyle = '#1a1020'; ctx.fillRect(-28, -10, 56, 10);
        ctx.fillStyle = '#2a1a30'; ctx.fillRect(-22, -78, 44, 70);
        ctx.fillStyle = '#4a2a54'; ctx.fillRect(-26, -84, 52, 10);
        ctx.fillStyle = '#6a3a74'; ctx.fillRect(-18, -76, 36, 8);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(-2, -94, 4, 20);
        ctx.fillRect(-10, -92, 20, 3);
      } else if (type === 'fern' || type === 'palm') {
        ctx.fillStyle = '#2a3a1a';
        ctx.fillRect(-3, -80, 6, 80);
        const col = type === 'palm' ? '#3a7a3a' : '#4a9a4a';
        for (let i = 0; i < 6; i++) {
          const a = -1.2 + i * 0.48;
          ctx.strokeStyle = col; ctx.lineWidth = type === 'palm' ? 5 : 3;
          ctx.beginPath();
          ctx.moveTo(0, -80);
          ctx.quadraticCurveTo(Math.cos(a) * 34, -100 + Math.sin(i) * 10, Math.cos(a) * 56, -74 + Math.sin(i) * 14);
          ctx.stroke();
        }
      } else if (type === 'ant_mound' || type === 'egg') {
        if (type === 'ant_mound') {
          ctx.fillStyle = '#3a2a18';
          ctx.beginPath(); ctx.ellipse(0, -10, 36, 34, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#5a4024';
          ctx.beginPath(); ctx.ellipse(0, -18, 28, 26, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#1a1208';
          ctx.beginPath(); ctx.ellipse(0, -4, 10, 12, 0, Math.PI, 0); ctx.fill();
        } else {
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = 'rgba(220,240,200,0.7)';
            ctx.beginPath(); ctx.ellipse(-24 + i * 16, -10 - (i % 2) * 8, 8, 12, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(90,120,60,0.5)';
            ctx.fillRect(-26 + i * 16, -16 - (i % 2) * 8, 2, 10);
          }
        }
      } else if (type === 'vine') {
        ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-16 + i * 16, -180);
          ctx.quadraticCurveTo(-22 + i * 16, -120, -8 + i * 16, -60);
          ctx.stroke();
          ctx.fillStyle = '#5a9a4a';
          ctx.fillRect(-13 + i * 16, -100, 6, 3);
        }
      } else if (type === 'desk' || type === 'reception') {
        ctx.fillStyle = '#2a2a34'; ctx.fillRect(-36, -34, 72, 8);
        ctx.fillRect(-32, -26, 8, 26); ctx.fillRect(24, -26, 8, 26);
        ctx.fillStyle = '#3a3a46'; ctx.fillRect(-36, -36, 72, 4);
        ctx.fillStyle = '#6a7a8a'; ctx.fillRect(-22, -44, 18, 10);
        ctx.fillStyle = '#9fe6ff'; ctx.globalAlpha = 0.6; ctx.fillRect(-20, -42, 14, 6);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#d8d0c0'; ctx.fillRect(4, -40, 20, 3);
        ctx.fillStyle = '#8a8a94'; ctx.fillRect(4, -44, 24, 4);
      } else if (type === 'couch') {
        ctx.fillStyle = '#2a303a'; ctx.fillRect(-40, -24, 80, 18);
        ctx.fillStyle = '#3a4450'; ctx.fillRect(-40, -34, 80, 12);
        ctx.fillStyle = '#4a5866'; ctx.fillRect(-44, -30, 8, 22); ctx.fillRect(36, -30, 8, 22);
        ctx.fillStyle = '#5a6a7a'; ctx.fillRect(-30, -30, 18, 4);
      } else if (type === 'monitor' || type === 'trophy') {
        if (type === 'monitor') {
          ctx.fillStyle = '#1a2028'; ctx.fillRect(-22, -54, 44, 30);
          ctx.fillStyle = '#0a1018'; ctx.fillRect(-18, -50, 36, 22);
          ctx.fillStyle = '#9fe6ff'; ctx.globalAlpha = 0.65;
          ctx.fillRect(-14, -46, 20, 2); ctx.fillRect(-14, -41, 26, 2); ctx.fillRect(-14, -36, 16, 2);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#2a3038'; ctx.fillRect(-2, -24, 4, 12); ctx.fillRect(-14, -12, 28, 4);
        } else {
          ctx.fillStyle = '#2a2a34'; ctx.fillRect(-24, -44, 48, 44);
          ctx.fillStyle = '#3a3a46'; ctx.fillRect(-20, -40, 40, 36);
          ctx.fillStyle = '#c8a040'; ctx.fillRect(-8, -32, 16, 20);
          ctx.fillStyle = '#fff0b0'; ctx.fillRect(-4, -28, 8, 12);
        }
      } else if (type === 'bed') {
        ctx.fillStyle = '#3a4450'; ctx.fillRect(-38, -20, 76, 6);
        ctx.fillStyle = '#d8e4ec'; ctx.fillRect(-34, -32, 34, 12);
        ctx.fillStyle = '#9fb4c4'; ctx.fillRect(-34, -20, 68, 12);
        ctx.fillStyle = '#2a3038'; ctx.fillRect(-38, -14, 4, 14); ctx.fillRect(34, -14, 4, 14);
        ctx.fillStyle = '#e8f4ff'; ctx.fillRect(-30, -30, 18, 6);
      } else if (type === 'iv') {
        ctx.strokeStyle = '#8a94a0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.moveTo(-10, -70); ctx.lineTo(10, -70); ctx.stroke();
        ctx.fillStyle = 'rgba(160,230,255,0.5)'; ctx.fillRect(-6, -64, 12, 18);
        ctx.fillStyle = '#cfeaff'; ctx.fillRect(-1, -60, 2, 10);
      } else if (type === 'curtain') {
        ctx.fillStyle = 'rgba(180,200,220,0.35)';
        ctx.fillRect(-30, -110, 60, 108);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        for (let i = -24; i < 30; i += 12) ctx.fillRect(i, -108, 2, 104);
      } else if (type === 'wheelchair') {
        ctx.strokeStyle = '#8a94a0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-8, -14, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#6a7480';
        ctx.beginPath(); ctx.moveTo(-18, -26); ctx.lineTo(-8, -26); ctx.lineTo(-4, -40); ctx.lineTo(16, -40); ctx.stroke();
        ctx.fillStyle = '#3a4048'; ctx.fillRect(-2, -38, 18, 4);
      } else if (type === 'cabinet') {
        ctx.fillStyle = '#2a3038'; ctx.fillRect(-26, -70, 52, 70);
        ctx.fillStyle = '#3a4450'; ctx.fillRect(-22, -66, 44, 30);
        ctx.fillStyle = '#4a5866'; ctx.fillRect(-22, -32, 44, 28);
        ctx.fillStyle = '#9fe6ff'; ctx.fillRect(-18, -60, 12, 2);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(-2, -52, 4, 4); ctx.fillRect(-2, -22, 4, 4);
      } else if (type === 'tent') {
        ctx.fillStyle = '#3a3028';
        ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, -62); ctx.lineTo(40, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a4a38';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(0, -54); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1a140e'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(0, -34); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill();
      } else if (type === 'helicopter') {
        ctx.fillStyle = '#2a3038'; ctx.beginPath(); ctx.ellipse(0, -34, 42, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a4450'; ctx.fillRect(-6, -52, 50, 12);
        ctx.fillStyle = '#9fe6ff'; ctx.globalAlpha = 0.5; ctx.fillRect(28, -50, 12, 8); ctx.globalAlpha = 1;
        ctx.fillStyle = '#1a2028'; ctx.fillRect(-40, -28, 22, 6);
        ctx.strokeStyle = '#4a5460'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-8, -54); ctx.lineTo(-8, -74); ctx.moveTo(-48, -74); ctx.lineTo(32, -74); ctx.stroke();
        ctx.fillStyle = '#4a5460'; ctx.fillRect(-24, -18, 6, 16); ctx.fillRect(18, -18, 6, 16);
      } else if (type === 'dragon_skull') {
        ctx.fillStyle = '#2a1a18'; ctx.fillRect(-26, -28, 52, 28);
        ctx.fillStyle = '#4a2a24'; ctx.beginPath(); ctx.ellipse(0, -34, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a0e0c'; ctx.fillRect(-18, -36, 10, 8); ctx.fillRect(8, -36, 10, 8);
        ctx.fillStyle = '#e8c76a'; ctx.fillRect(-16, -34, 5, 4); ctx.fillRect(11, -34, 5, 4);
        ctx.fillStyle = '#4a2a24';
        ctx.beginPath(); ctx.moveTo(-28, -42); ctx.lineTo(-44, -58); ctx.lineTo(-22, -48); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(28, -42); ctx.lineTo(44, -58); ctx.lineTo(22, -48); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8e0d0';
        for (let i = -18; i < 20; i += 8) ctx.fillRect(i, -24, 4, 8);
      } else if (type === 'obsidian') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(6, -170, 20, 170);
        ctx.fillStyle = '#160a22';
        ctx.beginPath();
        ctx.moveTo(-14, 0); ctx.lineTo(-8, -160); ctx.lineTo(12, -180); ctx.lineTo(22, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2a1038'; ctx.fillRect(-2, -150, 6, 140);
        ctx.fillStyle = accentAlpha(accent, 0.6); ctx.fillRect(8, -120, 3, 40);
      } else if (type === 'chain') {
        ctx.strokeStyle = '#4a4a54'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -220); ctx.lineTo(0, -80); ctx.stroke();
        ctx.globalAlpha = 0.7;
        for (let y = -210; y < -80; y += 12) {
          ctx.strokeStyle = '#6a6a74';
          ctx.beginPath(); ctx.ellipse(0, y, 4, 6, 0, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (type === 'mural') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(-52, -168, 104, 132);
        ctx.fillStyle = '#30364a';
        ctx.fillRect(-48, -164, 96, 124);
        ctx.strokeStyle = accentAlpha(accent, 0.55);
        ctx.lineWidth = 2;
        ctx.strokeRect(-43, -159, 86, 114);
        ctx.fillStyle = '#1a202c';
        const figures = [[-28, 0], [-8, 1], [12, 0], [32, 1]];
        figures.forEach(([fx, kind]) => {
          ctx.fillRect(fx - 4, -108, 8, 20);
          ctx.beginPath(); ctx.arc(fx, -112, 5, 0, Math.PI * 2); ctx.fill();
          if (kind) ctx.fillRect(fx - 12, -100, 24, 5);
          else ctx.fillRect(fx - 2, -88, 4, 30);
        });
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = accent;
        for (let i = 0; i < 5; i++) ctx.fillRect(-34 + i * 17, -48, 9, 3);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#e8c76a';
        ctx.fillRect(-4, -146, 8, 8);
      } else if (type === 'totem') {
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(-10, -96, 20, 96);
        ctx.fillStyle = '#5a4024';
        ctx.fillRect(-12, -90, 24, 6);
        ctx.fillRect(-14, -58, 28, 6);
        for (let i = 0; i < 3; i++) {
          const yy = -84 + i * 28;
          ctx.fillStyle = i === 2 ? '#e8e0cc' : '#d8d0bc';
          ctx.beginPath(); ctx.arc(0, yy, 10, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a1410';
          ctx.fillRect(-6, yy - 2, 4, 4);
          ctx.fillRect(2, yy - 2, 4, 4);
          ctx.fillRect(-3, yy + 5, 6, 2);
        }
        ctx.strokeStyle = '#c8b45a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -96); ctx.lineTo(-16, -120); ctx.moveTo(0, -96); ctx.lineTo(14, -122); ctx.stroke();
        ctx.fillStyle = accentAlpha(accent, 0.6);
        ctx.fillRect(-17, -123, 5, 5); ctx.fillRect(12, -125, 5, 5);
      } else if (type === 'portal') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-62, -190, 124, 190);
        ctx.fillStyle = '#2a0a12';
        ctx.fillRect(-58, -184, 14, 184);
        ctx.fillRect(44, -184, 14, 184);
        ctx.fillRect(-58, -196, 116, 16);
        ctx.fillStyle = '#070208';
        ctx.fillRect(-44, -180, 88, 180);
        const g = ctx.createRadialGradient(0, -94, 4, 0, -94, 92);
        g.addColorStop(0, 'rgba(255,220,190,0.95)');
        g.addColorStop(0.22, 'rgba(255,90,70,0.9)');
        g.addColorStop(0.62, 'rgba(130,18,40,0.8)');
        g.addColorStop(1, 'rgba(30,4,10,0.05)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -94, 40, 82, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.55 + Math.sin(this.time * 2.5) * 0.15;
        ctx.strokeStyle = '#ffb090';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -94, 14 + i * 11, 34 + i * 20, this.time * (0.4 + i * 0.2), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffd0b0';
        ctx.fillRect(-58, -202, 116, 5);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#ff8a6a';
          ctx.fillRect(-54 + i * 30, -196 + (i % 2) * 4, 18, 3);
        }
        ctx.restore();
        return;
      } else if (type === 'boulder') {
        ctx.fillStyle = '#2a3040';
        ctx.beginPath(); ctx.ellipse(0, -24, 34, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a4050';
        ctx.beginPath(); ctx.ellipse(-6, -30, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        // неизвестный тип — небольшой камень
        ctx.fillStyle = '#2a3040';
        ctx.fillRect(-12, -10, 24, 10);
      }
      ctx.restore();
    }

    drawAtmosphere(ctx) {
      const floor = this.floorY;
      const accent = this.theme.accent;
      const flame = this.theme.flame;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // косые лучи света
      const rayCount = Engine.lowQuality ? 1 : 3;
      for (let i = 0; i < rayCount; i++) {
        const baseX = this.worldW * (0.18 + i * 0.32) + Math.sin(this.time * 0.18 + i) * 14;
        const g = ctx.createLinearGradient(baseX, 0, baseX + 180, floor);
        g.addColorStop(0, rgba(accent, 0.085));
        g.addColorStop(0.55, rgba(accent, 0.035));
        g.addColorStop(1, rgba(accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(baseX, 0);
        ctx.lineTo(baseX + 64, 0);
        ctx.lineTo(baseX + 220, floor);
        ctx.lineTo(baseX + 120, floor);
        ctx.closePath();
        ctx.fill();
      }
      // световые пятна от факелов (только видимые)
      const cam = Engine.Camera;
      for (const tx of this.torches) {
        if (Engine.lowQuality) break;
        if (tx < cam.x - 140 || tx > cam.x + Engine.CANVAS_W + 140) continue;
        const g = ctx.createRadialGradient(tx, floor - 10, 2, tx, floor - 10, 100);
        g.addColorStop(0, rgba(flame, 0.13));
        g.addColorStop(0.5, rgba(flame, 0.05));
        g.addColorStop(1, rgba(flame, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(tx, floor - 8, 100, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // низкий туман
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.theme.fog;
      const fogCount = Engine.lowQuality ? 1 : 3;
      for (let i = 0; i < fogCount; i++) {
        const x = ((this.time * (6 + i * 3) + i * 780) % (this.worldW + 500)) - 250;
        ctx.beginPath();
        ctx.ellipse(x, floor - 14, 230, 26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Погодная атмосфера: снег, пепел, светлячки или пыль.
      const weather = this.themeId;
      const palette = weather === 'ice' ? 'rgba(220,240,255,0.7)'
        : (weather === 'castle' || weather === 'throne') ? 'rgba(255,150,80,0.8)'
          : weather === 'jungle' ? 'rgba(140,255,200,0.7)'
            : 'rgba(220,210,180,0.45)';
      const count = Engine.lowQuality
        ? (weather === 'ice' ? 18 : weather === 'jungle' ? 12 : 16)
        : (weather === 'ice' ? 46 : (weather === 'jungle' ? 24 : 30));
      const rising = weather === 'castle' || weather === 'throne';
      const speed = weather === 'ice' ? 18 : (rising ? 26 : 9);
      ctx.save();
      ctx.fillStyle = palette;
      ctx.globalCompositeOperation = (rising || weather === 'jungle') ? 'lighter' : 'source-over';
      for (let i = 0; i < count; i++) {
        const span = this.worldW + 240;
        const x = ((i * 173 + this.time * (rising ? -speed : speed) * (0.4 + (i % 5) * 0.12)) % span + span) % span - 120;
        if (x < Engine.Camera.x - 40 || x > Engine.Camera.x + Engine.CANVAS_W + 40) continue;
        const baseY = rising ? floor : 80;
        const travel = rising ? -260 : (floor - 80);
        const y = baseY + ((i * 97 + this.time * speed * (0.6 + (i % 4) * 0.15)) % travel);
        const drift = Math.sin(this.time * 0.7 + i) * (weather === 'ice' ? 8 : 3);
        const size = weather === 'ice' ? 2 : (rising ? 2 : 1.4);
        ctx.globalAlpha = 0.28 + ((i % 4) * 0.06);
        ctx.fillRect(x + drift, y, size, size);
      }
      ctx.restore();
    }

    drawPillar(ctx, x, floor, theme) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 6, floor - 190, 26, 190);
      ctx.fillStyle = theme.wall;
      ctx.fillRect(x, floor - 196, 26, 196);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, floor - 196, 4, 196);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      for (let y = floor - 180; y < floor - 10; y += 26) ctx.fillRect(x + 3, y, 20, 3);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x + 9, floor - 210, 8, 10);
      ctx.restore();
    }

    drawTorch(ctx, x, floor, theme) {
      const flick = Math.sin(this.time * 9 + x) * 2 + Math.sin(this.time * 17 + x) * 1.2;
      const y = floor - 172;
      ctx.save();
      ctx.fillStyle = '#4a3a24';
      ctx.fillRect(x - 3, y, 6, 26);
      const g = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 56);
      g.addColorStop(0, 'rgba(255,200,120,0.35)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y - 8, 56, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.flame;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 2);
      ctx.lineTo(x + Math.sin(this.time * 11 + x) * 2, y - 20 - flick);
      ctx.lineTo(x + 5, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 4);
      ctx.lineTo(x, y - 13 - flick * 0.6);
      ctx.lineTo(x + 2, y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawSecret(ctx, s) {
      const found = s.found;
      ctx.save();
      if (s.kind === 'wall') {
        ctx.fillStyle = found ? '#0b0d14' : this.theme.wall;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(s.x + 5, s.y + 10, s.w - 10, 2);
        ctx.strokeStyle = found ? 'rgba(255,210,74,0.35)' : 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + 14, s.y + 18);
        ctx.lineTo(s.x + 26, s.y + 34);
        ctx.lineTo(s.x + 20, s.y + 50);
        ctx.lineTo(s.x + 36, s.y + 64);
        ctx.stroke();
        if (found) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#ffd24a';
          ctx.fillRect(s.x + s.w / 2 - 2, s.y + 30, 4, 20);
        }
      } else {
        // «Забытый сейф» — сундук в хламе
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(s.x + 4, s.y + 8, s.w + 8, s.h - 6);
        ctx.fillStyle = '#3a2d20';
        ctx.fillRect(s.x + 8, s.y + 34, s.w - 16, s.h - 34);
        ctx.fillStyle = this.theme.accent;
        ctx.globalAlpha = found ? 0.25 : 0.75;
        ctx.fillRect(s.x + s.w / 2 - 3, s.y + 44, 6, 8);
      }
      if (!found) {
        ctx.globalAlpha = 0.18 + Math.sin(this.time * 3 + s.x) * 0.08;
        ctx.fillStyle = this.theme.accent;
        ctx.fillRect(s.x + s.w / 2 - 1, s.y - 18, 2, 12);
      }
      ctx.restore();
    }

    drawPuzzle(ctx, p) {
      const theme = this.theme;
      const floor = this.floorY;
      ctx.save();
      // Арка/алтарь за загадкой
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(p.x - 62, floor - 132, 124, 132);
      ctx.fillStyle = theme.wall;
      ctx.fillRect(p.x - 58, floor - 128, 116, 128);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(p.x - 58, floor - 128, 116, 3);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = p.solved ? 0.9 : 0.35 + Math.sin(this.time * 2.5) * 0.12;
      ctx.fillRect(p.x - 26, floor - 108, 52, 4);
      ctx.fillRect(p.x - 4, floor - 120, 8, 28);
      ctx.globalAlpha = 1;
      // Надпись-подсказка
      ctx.fillStyle = 'rgba(8,10,18,0.75)';
      ctx.fillRect(p.x - 110, floor - 164, 220, 24);
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(p.x - 110, floor - 164, 220, 24);
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.hint, p.x, floor - 148);

      for (const d of p.devices) {
        if (p.kind === 'runes') {
          ctx.fillStyle = d.lit ? theme.accent : '#20263c';
          ctx.fillRect(d.x, d.y, d.w, d.h);
          ctx.strokeStyle = d.lit ? '#fff' : 'rgba(160,180,220,0.35)';
          ctx.lineWidth = 2;
          ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
          ctx.fillStyle = d.lit ? '#0a0b12' : theme.accent;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(ROMAN[d.index], d.x + d.w / 2, d.y + d.h - 1);
          if (d.lit) {
            const g = ctx.createRadialGradient(d.x + d.w / 2, d.y, 2, d.x + d.w / 2, d.y, 46);
            g.addColorStop(0, 'rgba(255,210,74,0.25)');
            g.addColorStop(1, 'rgba(255,210,74,0)');
            ctx.fillStyle = g;
            ctx.fillRect(d.x - 30, d.y - 46, d.w + 60, 60);
          }
        } else if (p.kind === 'levers') {
          ctx.fillStyle = '#2a2438';
          ctx.fillRect(d.x + d.w / 2 - 2, d.y + 10, 4, d.h - 10);
          ctx.fillStyle = d.pulled ? theme.accent : '#7a6a4a';
          ctx.fillRect(d.x - 4, d.y, d.w + 8, 8);
          ctx.fillStyle = d.pulled ? '#fff0b0' : '#201a14';
          ctx.fillRect(d.x + d.w / 2 - 3, d.y - 6, 6, 8);
          ctx.fillStyle = d.pulled ? theme.accent : 'rgba(200,210,240,0.6)';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(ROMAN[d.index], d.x + d.w / 2, d.y - 16);
          if (d.pulled) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = theme.accent;
            ctx.fillRect(d.x + d.w / 2 - 8, d.y - 28, 16, 4);
            ctx.globalAlpha = 1;
          }
        } else {
          const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
          const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
          g.addColorStop(0, d.lit ? 'rgba(255,240,180,0.9)' : 'rgba(120,140,220,0.45)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = d.lit ? theme.accent : '#3a4260';
          ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = d.lit ? '#fff' : '#6a74b8';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = 'rgba(220,230,255,0.9)';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(ROMAN[d.index], cx, cy + 3);
        }
      }
      ctx.restore();
    }

    drawQuestObject(ctx, q) {
      if (!this.visible(q.x - 24, q.w + 48)) return;
      const x = q.x, y = q.y, w = q.w, h = q.h;
      const cx = x + w / 2;
      const pulse = 0.5 + Math.sin(this.time * 3 + q.glow) * 0.2;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(cx, y + h - 3, w * 0.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (q.kind === 'brazier') {
        ctx.fillStyle = '#2a2228';
        ctx.fillRect(x + 12, y + h - 12, w - 24, 9);
        ctx.fillStyle = '#4a3a34';
        ctx.fillRect(x + 14, y + h - 10, w - 28, 3);
        ctx.fillStyle = '#3a2a2a';
        ctx.fillRect(x + 10, y + h - 24, w - 20, 10);
        ctx.fillStyle = '#5a4036';
        ctx.fillRect(x + 12, y + h - 24, w - 24, 3);
        if (q.done) {
          ctx.globalAlpha = 0.35;
          const g = ctx.createRadialGradient(cx, y + h - 30, 4, cx, y + h - 30, 56);
          g.addColorStop(0, 'rgba(255,180,70,0.9)');
          g.addColorStop(1, 'rgba(255,120,40,0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - 56, y + h - 86, 112, 112);
          ctx.globalAlpha = 1;
          for (let i = 0; i < 3; i++) {
            const fx = cx - 8 + i * 8;
            ctx.fillStyle = i === 1 ? '#ffd24a' : '#ff8a3c';
            ctx.beginPath();
            ctx.moveTo(fx - 5, y + h - 24);
            ctx.quadraticCurveTo(fx, y + h - 46 - i * 4, fx + 5, y + h - 24);
            ctx.fill();
          }
          ctx.fillStyle = '#fff0b0';
          ctx.fillRect(cx - 2, y + h - 36, 4, 7);
        } else {
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = '#a06cff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, y + h - 27, 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#a06cff';
          ctx.fillRect(cx - 2, y + h - 29, 4, 4);
          ctx.globalAlpha = 1;
        }
      } else if (q.kind === 'miner') {
        ctx.fillStyle = '#3a2e26';
        ctx.beginPath();
        ctx.ellipse(cx, y + h - 8, w * 0.46, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x + 6, y + h - 20, 14, 10);
        ctx.fillRect(x + w - 22, y + h - 18, 16, 8);
        if (q.done) {
          ctx.globalAlpha = pulse * 0.7;
          ctx.strokeStyle = '#7affc8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + h - 22);
          ctx.lineTo(cx, y + h - 38);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          // шахтёр под завалом: лицо, каска с лампой и рука
          ctx.fillStyle = '#c8a080';
          ctx.beginPath();
          ctx.ellipse(cx - 2, y + h - 20, 6, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a1e18';
          ctx.fillRect(cx - 5, y + h - 21, 2, 2);
          ctx.fillRect(cx + 1, y + h - 21, 2, 2);
          ctx.fillStyle = '#8a8a96';
          ctx.beginPath();
          ctx.arc(cx - 2, y + h - 25, 9, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#5a5a66';
          ctx.fillRect(cx - 12, y + h - 25, 20, 4);
          ctx.fillStyle = '#ffd24a';
          ctx.fillRect(cx - 1, y + h - 32, 4, 4);
          ctx.fillStyle = '#c8a080';
          ctx.fillRect(cx + 9, y + h - 15, 9, 4);
          ctx.fillStyle = '#2a1e18';
          ctx.fillRect(cx + 14, y + h - 19, 3, 5);
        }
      } else {
        // раненый охотник
        ctx.fillStyle = '#4a1a22';
        ctx.beginPath();
        ctx.ellipse(cx, y + h - 12, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a2430';
        ctx.beginPath();
        ctx.moveTo(cx - 13, y + h - 12);
        ctx.lineTo(cx, y + h - 38);
        ctx.lineTo(cx + 13, y + h - 12);
        ctx.fill();
        ctx.fillStyle = '#bcd0dc';
        ctx.beginPath();
        ctx.arc(cx, y + h - 40, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1e18';
        ctx.fillRect(cx - 6, y + h - 43, 12, 3);
        if (q.done) {
          ctx.globalAlpha = pulse;
          ctx.fillStyle = '#7affc8';
          ctx.fillRect(cx - 8, y + h - 30, 16, 4);
          ctx.fillRect(cx - 2, y + h - 36, 4, 16);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = '#c8a080';
          ctx.fillRect(cx + 8, y + h - 22, 7, 3);
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#ff6a5a';
          ctx.fillRect(cx - 3, y + h - 22, 6, 2);
          ctx.globalAlpha = 1;
        }
      }

      if (!q.done) {
        ctx.globalAlpha = 0.75 + Math.sin(this.time * 4 + q.glow) * 0.2;
        ctx.fillStyle = q.kind === 'brazier' ? '#ffd24a' : '#7affc8';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, y - 8);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    drawArmorRack(ctx, r) {
      if (!this.visible(r.x - 24, r.w + 48)) return;
      const x = r.x, y = r.y, w = r.w, h = r.h;
      const pulse = 0.5 + Math.sin(this.time * 3 + r.glow) * 0.2;
      ctx.save();
      // тень и основание
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 3, w * 0.62, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1018';
      ctx.fillRect(x + 2, y + h - 9, w - 4, 8);
      ctx.fillStyle = '#3a2a30';
      ctx.fillRect(x + 4, y + h - 8, w - 8, 2);

      if (r.broken) {
        ctx.strokeStyle = '#6a5a50';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 7, y + h - 9); ctx.lineTo(x + 2, y + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - 7, y + h - 9); ctx.lineTo(x + w - 2, y + 16); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,108,255,' + (pulse * 0.7).toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(x + 8, y + 28); ctx.lineTo(x + 19, y + 38); ctx.lineTo(x + 14, y + 50); ctx.stroke();
        ctx.fillStyle = '#2a2228';
        ctx.fillRect(x + 12, y + 46, w - 24, 8);
        ctx.fillStyle = '#4a2230';
        ctx.fillRect(x + 16, y + 43, w - 32, 4);
        ctx.globalAlpha = 0.35 + Math.sin(this.time * 4 + r.glow) * 0.15;
        ctx.fillStyle = '#a06cff';
        ctx.fillRect(x + 17, y + 22, 2, 12);
        ctx.restore();
        return;
      }

      // стойка доспехов
      ctx.fillStyle = '#2a1c22';
      ctx.fillRect(x + 3, y + 6, w - 6, 4);
      ctx.fillStyle = '#3a2a30';
      ctx.fillRect(x + 6, y + 8, 4, h - 16);
      ctx.fillRect(x + w - 10, y + 8, 4, h - 16);
      ctx.fillStyle = '#5a4650';
      ctx.fillRect(x + 6, y + 8, 1, h - 16);
      ctx.fillRect(x + w - 10, y + 8, 1, h - 16);
      ctx.fillStyle = '#6a5a50';
      ctx.fillRect(x + 10, y + 10, 2, 5);
      ctx.fillRect(x + w - 12, y + 10, 2, 5);
      // наплечники
      ctx.fillStyle = '#4a4454';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 24); ctx.lineTo(x + 14, y + 21);
      ctx.lineTo(x + 16, y + 30); ctx.lineTo(x + 4, y + 33);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w - 2, y + 24); ctx.lineTo(x + w - 14, y + 21);
      ctx.lineTo(x + w - 16, y + 30); ctx.lineTo(x + w - 4, y + 33);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a6270';
      ctx.fillRect(x + 3, y + 24, 10, 2);
      ctx.fillRect(x + w - 13, y + 24, 10, 2);
      // нагрудник
      ctx.fillStyle = '#3a3442';
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 28);
      ctx.lineTo(x + w - 12, y + 28);
      ctx.lineTo(x + w - 14, y + 44);
      ctx.lineTo(x + w / 2, y + 50);
      ctx.lineTo(x + 14, y + 44);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5a5262';
      ctx.fillRect(x + 16, y + 30, w - 32, 3);
      ctx.fillStyle = '#7a2030';
      ctx.fillRect(x + 14, y + 41, w - 28, 2);
      ctx.fillStyle = '#2a1420';
      ctx.fillRect(x + w / 2 - 2, y + 29, 4, 20);
      // шлем
      ctx.fillStyle = '#5a5666';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 17, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9a94a6';
      ctx.fillRect(x + w / 2 - 5, y + 13, 10, 2);
      ctx.fillStyle = '#ff4a4a';
      ctx.globalAlpha = 0.7 + Math.sin(this.time * 5 + r.glow) * 0.25;
      ctx.fillRect(x + w / 2 - 5, y + 18, 3, 2);
      ctx.fillRect(x + w / 2 + 2, y + 18, 3, 2);
      ctx.globalAlpha = 1;
      // рога
      ctx.strokeStyle = '#d8d0c0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w / 2 - 6, y + 13); ctx.lineTo(x + w / 2 - 11, y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w / 2 + 6, y + 13); ctx.lineTo(x + w / 2 + 11, y + 5); ctx.stroke();
      // щит, прислонённый к стойке
      ctx.fillStyle = '#2a2832';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 39); ctx.lineTo(x + 13, y + 38);
      ctx.lineTo(x + 15, y + 50); ctx.lineTo(x + 8, y + 58);
      ctx.lineTo(x + 2, y + 52); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#9a94a6'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#7a2030';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 43); ctx.lineTo(x + 11, y + 47);
      ctx.lineTo(x + 8, y + 52); ctx.lineTo(x + 5, y + 47);
      ctx.closePath(); ctx.fill();
      // цепи
      ctx.strokeStyle = '#6a5a50';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 12, y + 12); ctx.lineTo(x + 6, y + 23); ctx.lineTo(x + 8, y + 27); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w - 12, y + 12); ctx.lineTo(x + w - 6, y + 23); ctx.lineTo(x + w - 8, y + 27); ctx.stroke();
      // печать на груди
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#a06cff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 38, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#a06cff';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 38, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawChest(ctx, c) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h, c.w * 0.6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const glowColor = c.tier === 'legendary' ? '#ffd24a' : c.tier === 'epic' ? '#b06cff' : c.tier === 'rare' ? '#4aa8ff' : '#8b90b8';
      if (!c.opened) {
        const g = ctx.createRadialGradient(c.x + c.w / 2, c.y + c.h / 2, 2, c.x + c.w / 2, c.y + c.h / 2, 46);
        g.addColorStop(0, glowColor + '55');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 46, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#4a3620';
      ctx.fillRect(c.x, c.y + 8, c.w, c.h - 8);
      ctx.fillStyle = '#6b4a26';
      ctx.fillRect(c.x, c.y + (c.opened ? 2 : 8), c.w, 8);
      if (!c.opened) {
        ctx.fillStyle = '#2a1e12';
        ctx.fillRect(c.x, c.y + 13, c.w, 2);
        ctx.fillStyle = '#e8c76a';
        ctx.fillRect(c.x + c.w / 2 - 3, c.y + 12, 6, 7);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(c.x + 2, c.y + 10, c.w - 4, c.h - 12);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(c.x + 0.5, c.y + 8.5, c.w - 1, c.h - 9);
      ctx.restore();
    }

    drawFront(ctx) {
      const theme = this.theme;
      ctx.save();
      ctx.fillStyle = theme.fog;
      ctx.fillRect(Engine.Camera.x, Engine.Camera.y, Engine.CANVAS_W, Engine.CANVAS_H);
      ctx.restore();
    }

    minimapData() {
      return {
        worldW: this.worldW,
        worldH: this.worldH,
        chests: this.chests.filter((c) => !c.opened).map((c) => ({ x: c.x, y: c.y, tier: c.tier })),
        secrets: this.secrets.filter((s) => !s.found).map((s) => ({ x: s.x, y: s.y })),
        puzzles: this.puzzles.filter((p) => !p.solved).map((p) => ({ x: p.x, y: p.y, kind: p.kind })),
        shrines: this.shrines.map((s) => ({ x: s.x, y: s.y })),
        lore: this.lore.map((l) => ({ x: l.x, y: l.y, read: l.read })),
        zones: this.zones.map((z) => ({ x: z.x, w: z.w, name: z.name }))
      };
    }
  }

  window.Level = Level;
  window.World = World;
})();
