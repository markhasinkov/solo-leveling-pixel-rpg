// effects.js — частицы, всплывающие числа, снаряды, телеграфы, зоны, вспышки.
(function () {
  'use strict';

  const E = Engine;

  function circleRect(cx, cy, r, rect) {
    const nx = E.clamp(cx, rect.x, rect.x + rect.w);
    const ny = E.clamp(cy, rect.y, rect.y + rect.h);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  const Effects = {
    particles: [],
    texts: [],
    projectiles: [],
    slashes: [],
    rings: [],
    sigils: [],
    pools: [],
    cracks: [],
    telegraphs: [],
    zones: [],
    afterimages: [],
    timers: [],
    flashes: [],
    time: 0,

    reset() {
      this.particles.length = 0;
      this.texts.length = 0;
      this.projectiles.length = 0;
      this.slashes.length = 0;
      this.rings.length = 0;
      this.sigils.length = 0;
      this.pools.length = 0;
      this.cracks.length = 0;
      this.telegraphs.length = 0;
      this.zones.length = 0;
      this.afterimages.length = 0;
      this.timers.length = 0;
      this.flashes.length = 0;
      this.time = 0;
    },

    // ---------- Создание ----------
    spawnParticles(x, y, color, count, opts) {
      opts = opts || {};
      count = count || 6;
      if (this.particles.length > 420) return;
      for (let i = 0; i < count; i++) {
        const a = opts.angle != null ? opts.angle + (Math.random() - 0.5) * (opts.spread || 1.2) : Math.random() * Math.PI * 2;
        const sp = (opts.speed || 150) * (0.35 + Math.random());
        this.particles.push({
          x: x + (Math.random() - 0.5) * (opts.spreadX || 4),
          y: y + (Math.random() - 0.5) * (opts.spreadY || 4),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (opts.up || 0),
          life: (opts.life || 0.55) * (0.6 + Math.random() * 0.7),
          maxLife: opts.life || 0.55,
          size: opts.size || 3,
          color,
          gravity: opts.gravity == null ? 700 : opts.gravity,
          drag: opts.drag == null ? 1.6 : opts.drag,
          glow: !!opts.glow,
          shape: opts.shape || 'square'
        });
      }
    },

    text(x, y, str, opts) {
      opts = opts || {};
      this.texts.push({
        x, y,
        text: String(str),
        color: opts.color || '#fff',
        size: opts.size || 14,
        life: opts.life || 0.8,
        maxLife: opts.life || 0.8,
        vy: opts.vy == null ? -60 : opts.vy,
        crit: !!opts.crit
      });
    },

    damageText(x, y, amount, opts) {
      opts = opts || {};
      this.text(x, y, amount, {
        color: opts.color || (opts.crit ? '#ffd24a' : '#fff'),
        size: opts.crit ? 21 : 14,
        life: opts.crit ? 1.0 : 0.75,
        vy: opts.crit ? -90 : -65,
        crit: opts.crit
      });
    },

    slash(opts) {
      this.slashes.push({
        x: opts.x, y: opts.y,
        r: opts.r || 46,
        face: opts.face || 1,
        life: opts.life || 0.18,
        maxLife: opts.life || 0.18,
        color: opts.color || '#bfe6ff',
        width: opts.width || 4,
        follow: opts.follow || null,
        oy: opts.oy == null ? 0 : opts.oy
      });
    },

    ring(opts) {
      this.rings.push({
        x: opts.x, y: opts.y,
        r0: opts.r0 || 8,
        maxR: opts.maxR || 120,
        life: opts.life || 0.4,
        maxLife: opts.life || 0.4,
        color: opts.color || '#a06cff',
        width: opts.width || 4,
        follow: opts.follow || null
      });
    },

    sigil(opts) {
      this.sigils.push({
        x: opts.x, y: opts.y,
        r: opts.r || 80,
        life: opts.life || 1.0,
        maxLife: opts.life || 1.0,
        color: opts.color || '#a06cff',
        mode: opts.mode || 'rune',
        follow: opts.follow || null,
        offsetY: opts.offsetY || 0
      });
    },

    pool(opts) {
      this.pools.push({
        x: opts.x, y: opts.y,
        r: opts.r || 70,
        life: opts.life || 1.2,
        maxLife: opts.life || 1.2,
        color: opts.color || '#9a6cff',
        follow: opts.follow || null
      });
    },

    crack(opts) {
      const x = opts.x, y = opts.y;
      const lines = [];
      const rng = Engine.mulberry32((opts.seed || 7) * 97 + 11);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.15 + i * 0.17) + rng() * 0.2;
        const pts = [[x, y]];
        let px = x, py = y;
        const len = (opts.length || 38) * (0.5 + rng());
        for (let k = 0; k < 4; k++) {
          px += Math.cos(a) * len / 4 + (rng() - 0.5) * 9;
          py += Math.sin(a) * len * 0.22 / 4 + (rng() - 0.5) * 4;
          pts.push([px, py]);
        }
        lines.push(pts);
      }
      this.cracks.push({
        lines,
        life: opts.life || 1.4,
        maxLife: opts.life || 1.4,
        color: opts.color || '#a06cff'
      });
    },

    shadowBurst(x, y, color, count, opts) {
      opts = opts || {};
      for (let i = 0; i < (count || 10); i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * (opts.spread || 18),
          y: y + (Math.random() - 0.5) * (opts.spreadY || 20),
          vx: (Math.random() - 0.5) * (opts.speed || 170),
          vy: -(Math.random() * (opts.up || 130)) - 10,
          life: (opts.life || 0.9) * (0.6 + Math.random() * 0.8),
          maxLife: opts.life || 0.9,
          size: (opts.size || 7) * (0.6 + Math.random()),
          grow: 0.8,
          color: color || 'rgba(80,45,140,0.65)',
          gravity: opts.gravity == null ? -50 : opts.gravity,
          drag: 1.1,
          glow: false,
          shape: 'smoke'
        });
      }
    },

    skillName(x, y, text, color) {
      this.text(x, y, text, { color: color || '#c8b0ff', size: 13, life: 1.15, vy: -34 });
    },

    telegraphCircle(x, y, r, time, onDone, color) {
      this.telegraphs.push({ shape: 'circle', x, y, r, time, maxTime: time, onDone, color: color || '#ff5a5a' });
    },

    telegraphRect(x, y, w, h, time, onDone, color) {
      this.telegraphs.push({ shape: 'rect', x, y, w, h, time, maxTime: time, onDone, color: color || '#ff5a5a' });
    },

    projectile(opts) {
      this.projectiles.push({
        x: opts.x, y: opts.y,
        vx: opts.vx, vy: opts.vy,
        r: opts.r || 7,
        damage: opts.damage || 1,
        mult: opts.mult == null ? null : opts.mult,
        isSkill: !!opts.isSkill,
        crit: !!opts.crit,
        owner: opts.owner || 'player',
        color: opts.color || '#9ad7ff',
        life: opts.life || 2.4,
        pierce: opts.pierce == null ? 0 : opts.pierce,
        hit: new Set(),
        knockback: opts.knockback || 0,
        slow: opts.slow || 0,
        trail: opts.trail !== false,
        trailTimer: 0,
        spin: opts.spin || 0,
        angle: opts.angle || 0,
        shape: opts.shape || 'orb',
        scale: opts.scale || 1
      });
    },

    zone(opts) {
      this.zones.push({
        x: opts.x, y: opts.y,
        r: opts.r || 100,
        life: opts.life || 5,
        maxLife: opts.life || 5,
        dps: opts.dps || 0,
        slow: opts.slow || 0,
        owner: opts.owner || 'enemy',
        color: opts.color || '#ff6a3c',
        tick: 0.4,
        phase: Math.random() * 6
      });
    },

    afterimage(opts) {
      this.afterimages.push({
        sheet: opts.sheet, col: opts.col || 0, row: opts.row || 0,
        x: opts.x, y: opts.y, w: opts.w, h: opts.h,
        face: opts.face || 1,
        life: opts.life || 0.28,
        maxLife: opts.life || 0.28,
        color: opts.color || '#a06cff'
      });
    },

    timer(delay, fn) {
      this.timers.push({ t: delay, fn });
    },

    flash(color, strength, duration) {
      this.flashes.push({
        color: color || '#fff',
        strength: strength == null ? 0.5 : strength,
        life: duration || 0.12,
        maxLife: duration || 0.12
      });
    },

    // ---------- Обновление ----------
    update(dt, game) {
      this.time += dt;

      for (let i = this.timers.length - 1; i >= 0; i--) {
        const t = this.timers[i];
        t.t -= dt;
        if (t.t <= 0) {
          this.timers.splice(i, 1);
          try { t.fn(); } catch (e) { console.warn('Effects.timer', e); }
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.vy += p.gravity * dt;
        p.vx *= Math.max(0, 1 - p.drag * dt);
        p.vy *= Math.max(0, 1 - p.drag * 0.35 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        t.y += t.vy * dt;
        t.vy *= Math.max(0, 1 - 2.2 * dt);
        if (t.life <= 0) this.texts.splice(i, 1);
      }

      for (let i = this.slashes.length - 1; i >= 0; i--) {
        const s = this.slashes[i];
        s.life -= dt;
        if (s.follow) {
          s.x = s.follow.x + s.follow.w / 2;
          s.y = s.follow.y + s.follow.h / 2 + s.oy;
        }
        if (s.life <= 0) this.slashes.splice(i, 1);
      }

      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        if (r.follow) { r.x = r.follow.x + r.follow.w / 2; r.y = r.follow.y + r.follow.h / 2; }
        if (r.life <= 0) this.rings.splice(i, 1);
      }

      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        const a = this.afterimages[i];
        a.life -= dt;
        if (a.life <= 0) this.afterimages.splice(i, 1);
      }

      for (let i = this.sigils.length - 1; i >= 0; i--) {
        const sg = this.sigils[i];
        sg.life -= dt;
        if (sg.follow) {
          sg.x = sg.follow.x + sg.follow.w / 2;
          sg.y = sg.follow.y + sg.offsetY;
        }
        if (sg.life <= 0) this.sigils.splice(i, 1);
      }

      for (let i = this.pools.length - 1; i >= 0; i--) {
        const pl = this.pools[i];
        pl.life -= dt;
        if (pl.follow) {
          pl.x = pl.follow.x + pl.follow.w / 2;
          pl.y = pl.follow.y + pl.follow.h - 6;
        }
        if (pl.life <= 0) this.pools.splice(i, 1);
      }

      for (let i = this.cracks.length - 1; i >= 0; i--) {
        this.cracks[i].life -= dt;
        if (this.cracks[i].life <= 0) this.cracks.splice(i, 1);
      }

      for (let i = this.flashes.length - 1; i >= 0; i--) {
        const f = this.flashes[i];
        f.life -= dt;
        if (f.life <= 0) this.flashes.splice(i, 1);
      }

      for (let i = this.telegraphs.length - 1; i >= 0; i--) {
        const t = this.telegraphs[i];
        t.time -= dt;
        if (t.time <= 0) {
          this.telegraphs.splice(i, 1);
          if (t.onDone) {
            try { t.onDone(); } catch (e) { console.warn('Effects.telegraph', e); }
          }
        }
      }

      // Зоны
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        z.life -= dt;
        z.tick -= dt;
        if (z.life <= 0) { this.zones.splice(i, 1); continue; }
        if (game && game.player && !game.player.dead && z.owner === 'enemy') {
          const p = game.player;
          const inside = circleRect(z.x, z.y, z.r, p);
          if (inside) {
            if (p.slowTimer != null) p.slowTimer = Math.max(p.slowTimer, 0.25);
            if (z.tick <= 0 && z.dps > 0) {
              z.tick = 0.5;
              game.hurtPlayer(z.dps * 0.5, { source: 'zone', color: z.color });
            }
          }
        }
        if (game && z.owner === 'player' && z.tick <= 0) {
          z.tick = 0.5;
          for (const m of game.monsters) {
            if (!m.dead && circleRect(z.x, z.y, z.r, m)) game.damageMonster(m, z.dps * 0.5, { source: 'zone', color: z.color });
          }
        }
      }

      // Снаряды
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }

        if (p.trail) {
          p.trailTimer -= dt;
          if (p.trailTimer <= 0) {
            p.trailTimer = 0.035;
            this.particles.push({
              x: p.x, y: p.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
              life: 0.22, maxLife: 0.22, size: p.r * 0.7, color: p.color,
              gravity: 0, drag: 2.5, glow: true, shape: 'circle'
            });
          }
        }

        if (p.owner === 'player' && game) {
          if (game.world && game.world.hitOrbsCircle) game.world.hitOrbsCircle(p.x, p.y, p.r, game);
          for (const m of game.monsters) {
            if (m.dead || p.hit.has(m)) continue;
            if (!circleRect(p.x, p.y, p.r, m)) continue;
            p.hit.add(m);
            if (p.mult != null && game.projectileHit) {
              game.projectileHit(m, p);
            } else {
              game.damageMonster(m, p.damage, {
                crit: p.crit, source: 'projectile', color: p.color, knockback: p.knockback
              });
            }
            this.spawnParticles(p.x, p.y, p.color, 5, { speed: 110, life: 0.3, size: 2 });
            if (p.pierce > 0) { p.pierce--; } else { this.projectiles.splice(i, 1); break; }
          }
        } else if (p.owner === 'ally' && game) {
          for (const m of game.monsters) {
            if (m.dead || p.hit.has(m)) continue;
            if (!circleRect(p.x, p.y, p.r, m)) continue;
            p.hit.add(m);
            game.damageMonster(m, p.damage, { source: 'ally', color: p.color });
            if (p.slow > 0) m.slowTimer = Math.max(m.slowTimer || 0, p.slow);
            this.spawnParticles(p.x, p.y, p.color, 6, { speed: 100, life: 0.3, size: 2, glow: true });
            if (p.pierce > 0) { p.pierce--; } else { this.projectiles.splice(i, 1); break; }
          }
        } else if (p.owner === 'enemy' && game && game.player) {
          const player = game.player;
          if (!player.dead && player.invulnTimer <= 0 && circleRect(p.x, p.y, p.r, player)) {
            game.hurtPlayer(p.damage, { source: 'projectile', color: p.color });
            if (p.slow > 0) player.slowTimer = Math.max(player.slowTimer || 0, p.slow);
            this.spawnParticles(p.x, p.y, p.color, 6, { speed: 130, life: 0.35, size: 2 });
            this.projectiles.splice(i, 1);
          }
        }
      }
    },

    // ---------- Отрисовка ----------
    renderUnder(ctx) {
      // Теневые лужи и рунические круги
      for (const p of this.pools) {
        const t = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 0.35) * (0.35 + t * 0.3);
        ctx.fillStyle = 'rgba(8,5,16,0.8)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = Math.min(1, p.life / 0.35) * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 8]);
        ctx.lineDashOffset = -this.time * 40;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * (0.82 + t * 0.18), p.r * 0.26 * (0.82 + t * 0.18), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 5; i++) {
          const a = this.time * 1.2 + i * 1.26;
          ctx.globalAlpha = 0.6 * (1 - t * 0.4);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x + Math.cos(a) * p.r * 0.5 - 1, p.y + Math.sin(a) * p.r * 0.12 - 1, 2, 2);
        }
        ctx.restore();
      }
      for (const c of this.cracks) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life / 0.3) * 0.8;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.5;
        for (const pts of c.lines) {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
        ctx.restore();
      }
      // Зоны
      for (const z of this.zones) {
        const a = Math.min(1, z.life / 0.4) * 0.75;
        ctx.save();
        ctx.globalAlpha = 0.18 * a;
        ctx.fillStyle = z.color;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.55 * a;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -this.time * 30;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.5 * a;
        for (let i = 0; i < 4; i++) {
          const ang = this.time * 1.5 + i * 1.57 + z.phase;
          const rr = z.r * (0.3 + 0.5 * ((i + 1) / 4));
          ctx.beginPath();
          ctx.arc(z.x + Math.cos(ang) * rr, z.y + Math.sin(ang) * rr * 0.45, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Телеграфы
      for (const t of this.telegraphs) {
        const prog = 1 - Math.max(0, t.time) / t.maxTime;
        const pulse = 0.18 + 0.15 * Math.abs(Math.sin(this.time * 12));
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = t.color;
        if (t.shape === 'circle') {
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = t.color; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r * (0.25 + prog * 0.75), 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = t.color; ctx.lineWidth = 3;
          ctx.strokeRect(t.x, t.y, t.w, t.h);
        }
        ctx.restore();
      }
    },

    renderOver(ctx) {
      // Рунические печати и корона
      for (const s of this.sigils) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = Math.max(0, Math.min(1, s.life / s.maxLife)) * 0.9;
        if (s.mode === 'crown') {
          const bob = Math.sin(this.time * 5) * 2;
          ctx.strokeStyle = s.color;
          ctx.fillStyle = s.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, -s.r * 0.55 + bob, s.r * 0.55, 0, Math.PI * 2); ctx.stroke();
          const top = -s.r * 0.95 + bob;
          ctx.beginPath();
          ctx.moveTo(-s.r * 0.3, top);
          ctx.lineTo(-s.r * 0.2, top - s.r * 0.3);
          ctx.lineTo(-s.r * 0.07, top - s.r * 0.1);
          ctx.lineTo(0, top - s.r * 0.4);
          ctx.lineTo(s.r * 0.07, top - s.r * 0.1);
          ctx.lineTo(s.r * 0.2, top - s.r * 0.3);
          ctx.lineTo(s.r * 0.3, top);
          ctx.closePath();
          ctx.globalAlpha *= 0.8;
          ctx.fill();
          ctx.globalAlpha /= 0.8;
          for (let i = 0; i < 5; i++) {
            const ang = this.time * 1.4 + i * 1.256;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(Math.cos(ang) * s.r * 0.45 - 1, -s.r * 0.55 + bob + Math.sin(ang) * s.r * 0.12 - 1, 2, 2);
          }
        } else {
          ctx.scale(1, 0.34);
          ctx.rotate(this.time * 0.6);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, s.r * 0.78, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, s.r * 0.36, 0, Math.PI * 2); ctx.stroke();
          for (let i = 0; i < 12; i++) {
            const ang = i * Math.PI / 6;
            const r0 = i % 3 === 0 ? s.r * 0.42 : s.r * 0.62;
            const r1 = i % 3 === 0 ? s.r * 0.68 : s.r * 0.86;
            ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); ctx.stroke();
          }
          ctx.fillStyle = s.color;
          for (let i = 0; i < 8; i++) {
            const ang = this.time * -0.8 + i * Math.PI / 4;
            ctx.fillRect(Math.cos(ang) * s.r * 0.9 - 1, Math.sin(ang) * s.r * 0.9 - 1, 2, 2);
          }
        }
        ctx.restore();
      }
      // Послеобразы
      for (const a of this.afterimages) {
        const alpha = (a.life / a.maxLife) * 0.4;
        Engine.drawFrame(a.sheet, a.col, a.row, a.x, a.y, a.w, a.h, a.face < 0, alpha);
      }

      // Снаряды
      for (const p of this.projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.r * 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(0, 0, p.r * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (p.shape === 'dagger') {
          ctx.fillStyle = '#171222';
          ctx.beginPath();
          ctx.moveTo(15, 0); ctx.lineTo(2, 4); ctx.lineTo(-7, 2); ctx.lineTo(-7, -2); ctx.lineTo(2, -4);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(2, 2); ctx.lineTo(-2, 0); ctx.lineTo(2, -2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e8e0ff';
          ctx.fillRect(-1, -1, 2, 2);
          ctx.fillStyle = '#c8a040';
          ctx.fillRect(-10, -4, 3, 8);
          ctx.fillRect(-15, -1, 5, 2);
        } else {
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(-p.r * 0.25, -p.r * 0.25, p.r * 0.35, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // Дуги ударов
      for (const s of this.slashes) {
        const t = 1 - s.life / s.maxLife;
        const alpha = Math.max(0, 1 - t);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(s.face, 1);
        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width * (1 - t * 0.5);
        ctx.lineCap = 'round';
        const start = -0.9 + t * 0.7;
        const end = start + 1.5;
        const rr = s.r * (0.8 + t * 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, rr, start, end);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.4;
        ctx.lineWidth = s.width * 3.2;
        ctx.beginPath();
        ctx.arc(0, 0, rr, start, end);
        ctx.stroke();
        // яркое ядро дуги
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, s.width * 0.32);
        ctx.beginPath();
        ctx.arc(0, 0, rr, start + 0.1, end - 0.1);
        ctx.stroke();
        // росчерк-искра на острие
        const tip = end - t * 0.1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.cos(tip) * rr - 2, Math.sin(tip) * rr - 2, 4, 4);
        ctx.restore();
      }

      // Кольца
      for (const r of this.rings) {
        const t = 1 - r.life / r.maxLife;
        const radius = r.r0 + (r.maxR - r.r0) * Engine.easeOutCubic(t);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width * (1 - t * 0.6);
        ctx.beginPath(); ctx.arc(r.x, r.y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - t) * 0.25;
        ctx.lineWidth = r.width * 3;
        ctx.beginPath(); ctx.arc(r.x, r.y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // Частицы
      for (const p of this.particles) {
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === 'smoke') {
          const grow = 1 + (1 - alpha) * (p.grow || 0.5);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        if (p.glow) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Тексты
      for (const t of this.texts) {
        const alpha = Math.max(0, Math.min(1, t.life / t.maxLife * 1.6));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold ' + t.size + 'px monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = t.crit ? 4 : 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }
    },

    renderScreen(ctx) {
      for (const f of this.flashes) {
        const a = (f.life / f.maxLife) * f.strength;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.fillRect(0, 0, Engine.CANVAS_W, Engine.CANVAS_H);
        ctx.restore();
      }
    }
  };

  window.Effects = Effects;
})();
