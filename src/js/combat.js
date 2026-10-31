// combat.js — активные умения игрока, урон, критические удары, снаряды.
(function () {
  'use strict';

  const F = window.Formulas;

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  const Combat = {
    skills: [],
    byId: {},
    cooldowns: {},

    init(skillsData) {
      this.skills = (skillsData || []).slice().sort((a, b) => Number(a.key) - Number(b.key));
      this.byId = {};
      this.skills.forEach((s) => { this.byId[s.id] = s; });
      this.reset();
    },

    reset() { this.cooldowns = {}; },

    update(dt) {
      for (const id in this.cooldowns) {
        if (this.cooldowns[id] > 0) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
      }
    },

    unlocked(skill, game) {
      return !!(skill && skill.unlock && game.progress.level >= (skill.unlock.level || 1));
    },

    cooldownLeft(id) { return this.cooldowns[id] || 0; },

    mpCost(skill, player) {
      return F.mpCost(skill.mp, player.stats || {});
    },

    canCast(skill, game) {
      if (!skill) return { ok: false, reason: 'Нет умения' };
      if (!this.unlocked(skill, game)) return { ok: false, reason: 'Откроется на ' + skill.unlock.level + ' уровне' };
      if (this.cooldownLeft(skill.id) > 0) return { ok: false, reason: 'Перезарядка' };
      const cost = this.mpCost(skill, game.player);
      if (game.player.mp < cost) return { ok: false, reason: 'Не хватает маны' };
      if (game.player.stunTimer > 0) return { ok: false, reason: 'Оглушение' };
      return { ok: true, reason: '', cost };
    },

    playerDamage(game, target, mult, isSkill) {
      const p = game.player;
      const stats = p.stats || {};
      const skillBonus = isSkill ? 1 + (stats.skillDamagePct || 0) : 1;
      const crit = Math.random() < (stats.critChance || 0);
      const critMult = crit ? (stats.critMult || 1.6) : 1;
      const dmg = F.damage(p.atk, target.def || 0, mult * skillBonus * critMult);
      return { dmg, crit };
    },

    aimVector(game) {
      const p = game.player;
      const cx = p.x + p.w / 2;
      const cy = p.getVisualY();
      const I = Engine.Input;
      if (I.mouse.overCanvas) {
        const m = I.mouseWorld();
        let dx = m.x - cx;
        let dy = m.y - cy;
        const len = Math.hypot(dx, dy);
        if (len > 4) return { x: dx / len, y: dy / len, angle: Math.atan2(dy, dx), source: 'mouse' };
      }
      const target = game.nearestMonster ? game.nearestMonster(680) : null;
      if (target) {
        let dx = (target.x + target.w / 2) - cx;
        let dy = (target.y + target.h / 2) - cy;
        const len = Math.hypot(dx, dy) || 1;
        return { x: dx / len, y: dy / len, angle: Math.atan2(dy, dx), source: 'target' };
      }
      return { x: p.face, y: 0, angle: p.face > 0 ? 0 : Math.PI, source: 'face' };
    },

    basicAttack(game) {
      const p = game.player;
      if (Engine.Input.touchMode) {
        const target = game.nearestMonster(160);
        if (target) p.face = (target.x + target.w / 2) > (p.x + p.w / 2) ? 1 : -1;
      }
      if (p.comboTimer <= 0) p.comboStep = 0;
      p.comboStep = (p.comboStep % 3) + 1;
      p.comboTimer = p.comboWindow || 0.9;
      const step = p.comboStep;
      const combo = [
        { mult: 1.0, range: 54, knockback: 120, color: '#cfe8ff', r: 58, width: 4, trauma: 0.1, stop: 0.035 },
        { mult: 1.16, range: 60, knockback: 170, color: '#b8a4ff', r: 64, width: 5, trauma: 0.13, stop: 0.04 },
        { mult: 1.58, range: 80, knockback: 280, color: '#ffd24a', r: 84, width: 7, trauma: 0.22, stop: 0.06 }
      ][step - 1];
      const finisher = step === 3;
      const rect = finisher ? {
        x: p.x + p.w / 2 - combo.range / 2,
        y: p.y + 2,
        w: combo.range,
        h: p.h - 2
      } : {
        x: p.face > 0 ? p.x + p.w - 6 : p.x - combo.range + 6,
        y: p.y + 2,
        w: combo.range,
        h: p.h - 2
      };
      const hits = this.hitMonstersInRect(game, rect, combo.mult, {
        source: 'basic', color: combo.color, knockback: combo.knockback
      });
      const cx = p.x + p.w / 2;
      const cy = p.getVisualY();
      Effects.slash({
        x: cx, y: cy,
        r: combo.r, face: p.face, life: finisher ? 0.22 : 0.17, color: combo.color, width: combo.width
      });
      if (step === 2) {
        Effects.slash({
          x: cx, y: cy - 4, r: combo.r - 10, face: -p.face,
          life: 0.15, color: '#e2d6ff', width: 2
        });
      }
      if (finisher) {
        Effects.slash({
          x: cx, y: cy - 6, r: combo.r - 16, face: -p.face,
          life: 0.24, color: '#fff0b8', width: 3
        });
        Effects.ring({ x: cx, y: cy, r0: 12, maxR: 92, life: 0.3, color: '#ffd24a', width: 3 });
        Effects.text(cx, p.getDrawY() - 10, 'ФИНИШЕР', { color: '#ffd24a', size: 12, life: 0.6 });
        p.attackTimer *= 0.88;
      } else if (step === 2) {
        p.attackTimer *= 0.94;
      }
      AudioFX.play('slash');
      if (hits > 0) {
        Camera.addTrauma(combo.trauma);
        Engine.hitStop(combo.stop);
      }
    },

    hitMonstersInRect(game, rect, mult, opts) {
      opts = opts || {};
      let hits = 0;
      for (const m of game.monsters) {
        if (m.dead) continue;
        if (!rectsOverlap(rect, m)) continue;
        const roll = this.playerDamage(game, m, mult, opts.isSkill);
        game.damageMonster(m, roll.dmg, {
          crit: roll.crit,
          source: opts.source || 'melee',
          color: opts.color,
          knockback: opts.knockback || 0,
          stun: opts.stun || 0
        });
        if (opts.onHit) opts.onHit(m, roll.dmg);
        hits++;
      }
      if (game.world && game.world.hitOrbsRect) game.world.hitOrbsRect(rect, game);
      return hits;
    },

    castByKey(key, game) {
      const skill = this.skills.find((s) => s.key === String(key));
      if (!skill) return false;
      return this.cast(skill, game);
    },

    cast(skill, game) {
      const check = this.canCast(skill, game);
      if (!check.ok) {
        if (check.reason && check.reason !== 'Перезарядка') game.toast('Умение', check.reason, { color: '#ff9a6a', icon: skill.icon });
        AudioFX.play('error');
        return false;
      }
      const p = game.player;
      const aim = this.aimVector(game);
      if (aim.source !== 'face' && Math.abs(aim.x) > 0.08) {
        p.face = aim.x > 0 ? 1 : -1;
      }
      const cx = p.x + p.w / 2;
      const cy = p.getVisualY();
      const floorY = game.level ? game.level.floorY : p.y + p.h;
      Effects.skillName(cx, p.getDrawY() - 12, skill.name, skill.color);
      Effects.shadowBurst(cx, cy, 'rgba(55,28,90,0.55)', 5, { speed: 90, up: 70, life: 0.7, size: 6 });

      p.mp -= check.cost;
      this.cooldowns[skill.id] = F.cooldown(skill.cooldown, p.stats || {});
      p.attackAnimTimer = 0.26;
      p.attackTimer = Math.max(p.attackTimer, 0.24);
      AudioFX.play('skill');
      if (game.quests) {
        window.Quests.emit('skill', {
          chapterId: game.chapter ? game.chapter.id : null,
          target: skill.id,
          amount: 1
        });
      }

      switch (skill.type) {
        case 'melee': {
          const range = skill.range || 110;
          const rect = {
            x: p.face > 0 ? p.x + p.w - 8 : p.x - range + 8,
            y: p.y - 6,
            w: range,
            h: p.h + 12
          };
          let stolen = 0;
          const hits = this.hitMonstersInRect(game, rect, skill.damage || 1.6, {
            isSkill: true, source: 'skill', color: skill.color, knockback: 220,
            onHit: (target, dmg) => { stolen += dmg; }
          });
          // три слоя теневых дуг и дымные росчерки
          for (let i = 0; i < 3; i++) {
            Effects.timer(i * 0.055, () => {
              Effects.slash({
                x: cx + p.face * (12 + i * 9), y: cy - i * 4,
                r: range * (0.85 + i * 0.14), face: p.face,
                life: 0.26 + i * 0.03,
                color: ['#f4eaff', '#c8a6ff', '#7a4cff'][i], width: 4 + i * 2
              });
            });
          }
          Effects.ring({
            x: cx + p.face * 40, y: cy,
            r0: 10, maxR: range * 0.95, life: 0.3, color: '#5d3a9e', width: 4
          });
          Effects.crack({ x: cx + p.face * (range * 0.6), y: floorY - 3, length: range * 0.7, color: skill.color, seed: Math.floor(cx) });
          Effects.flash('#c8a6ff', 0.12, 0.1);
          Effects.shadowBurst(cx + p.face * 60, cy, 'rgba(40,18,70,0.8)', 20, { spread: 34, speed: 260, up: 120, life: 0.95, size: 9 });
          Effects.spawnParticles(cx + p.face * 54, cy, '#f4eaff', 14, { speed: 260, life: 0.4, glow: true, shape: 'circle' });
          Effects.afterimage({ sheet: p.sheet, col: p.animFrame, row: 1, x: p.getDrawX() - p.face * 12, y: p.getDrawY(), w: p.drawW, h: p.drawH, face: p.face, life: 0.22, color: skill.color });
          if (hits > 0) { Engine.hitStop(0.07); Camera.addTrauma(0.28); AudioFX.play('crit'); }
          if (skill.lifesteal && stolen > 0) {
            const heal = Math.max(1, Math.round(stolen * skill.lifesteal));
            p.hp = Math.min(p.maxHp, p.hp + heal);
            Effects.text(cx, p.y - 28, '+' + heal + ' HP', { color: '#6aff9a', size: 12, life: 0.8 });
            Effects.spawnParticles(cx, cy, '#6aff9a', 12, { speed: 120, up: 90, life: 0.6, glow: true });
          }
          break;
        }

        case 'projectile': {
          const speed = skill.speed || 720;
          const hx0 = p.x + p.w / 2 + aim.x * 18;
          const hy0 = p.y + p.h * 0.42 + aim.y * 18;
          const count = Math.max(1, skill.count || 1);
          const spread = skill.spread || 0;
          Effects.sigil({ x: hx0, y: hy0, r: 26, life: 0.32, color: skill.color, mode: 'rune' });
          for (let i = 0; i < count; i++) {
            const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
            const angle = aim.angle + offset;
            Effects.projectile({
              x: hx0, y: hy0,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              angle,
              r: 8,
              damage: p.atk,
              mult: skill.damage || 1.3,
              isSkill: true,
              owner: 'player',
              color: skill.color,
              pierce: skill.pierce || 2,
              knockback: 160,
              shape: 'dagger',
              scale: skill.count ? 1.15 : 1.5
            });
          }
          Effects.shadowBurst(hx0, hy0, 'rgba(45,30,80,0.6)', 8, { spread: 10, speed: 120, up: 60, life: 0.5, size: 5 });
          Effects.spawnParticles(hx0, hy0, skill.color, 10, { speed: 170, life: 0.35, glow: true, shape: 'circle' });
          Effects.ring({ x: hx0, y: hy0, r0: 4, maxR: 38, life: 0.22, color: '#d8f4ff', width: 2 });
          break;
        }

        case 'dash': {
          const dir = Math.abs(aim.x) > 0.18 ? (aim.x > 0 ? 1 : -1) : p.face;
          const distance = skill.distance || 220;
          const startX = p.x + p.w / 2;
          p.face = dir;
          // герой растворяется в тени на месте и выходит из лужи тьмы в конце рывка
          Effects.flash('#e0d0ff', 0.1, 0.07);
          Effects.pool({ x: startX, y: floorY - 2, r: 62, life: 0.8, color: skill.color });
          Effects.sigil({ x: startX, y: floorY - 3, r: 52, life: 0.55, color: '#e0d0ff', mode: 'rune' });
          Effects.shadowBurst(startX, cy + 10, 'rgba(22,10,40,0.8)', 16, { spread: 26, speed: 150, up: 120, life: 0.8, size: 9 });
          Effects.afterimage({ sheet: p.sheet, col: p.animFrame, row: 1, x: p.getDrawX(), y: p.getDrawY(), w: p.drawW, h: p.drawH, face: dir, life: 0.3, color: '#2a1640' });
          p.startDash(dir, distance, 0.17);
          AudioFX.play('dash');
          Effects.ring({ x: startX, y: cy, r0: 6, maxR: 74, life: 0.32, color: skill.color, width: 3 });
          Effects.timer(0.13, () => {
            const ex = p.x + p.w / 2;
            Effects.flash('#e0d0ff', 0.12, 0.08);
            Effects.pool({ x: ex, y: floorY - 2, r: 70, life: 0.85, color: skill.color });
            Effects.sigil({ x: ex, y: floorY - 3, r: 58, life: 0.6, color: '#f0e4ff', mode: 'rune' });
            Effects.ring({ x: ex, y: cy, r0: 10, maxR: 90, life: 0.34, color: skill.color, width: 4 });
            Effects.shadowBurst(ex, cy + 8, 'rgba(30,14,52,0.85)', 18, { spread: 30, speed: 170, up: 140, life: 0.85, size: 9 });
            const rect = {
              x: dir > 0 ? p.x : p.x - 70,
              y: p.y - 10,
              w: p.w + 70,
              h: p.h + 20
            };
            const hits = this.hitMonstersInRect(game, rect, skill.damage || 1.2, {
              isSkill: true, source: 'dash', color: skill.color, knockback: 260
            });
            Effects.slash({ x: ex, y: cy, r: 86, face: dir, life: 0.22, color: skill.color, width: 7 });
            Effects.slash({ x: ex, y: cy - 6, r: 66, face: dir, life: 0.3, color: '#e0c8ff', width: 3 });
            Effects.crack({ x: ex, y: floorY - 2, length: 46, color: skill.color, seed: Math.floor(ex) });
            if (hits) { Camera.addTrauma(0.25); Engine.hitStop(0.05); }
          });
          break;
        }

        case 'nova': {
          const radius = skill.radius || 190;
          const nx = p.x + p.w / 2;
          // власть монарха: невидимое давление, печать на полу и корона над героем
          Effects.sigil({ x: nx, y: floorY - 2, r: radius * 0.72, life: 0.75, color: skill.color, mode: 'rune' });
          Effects.sigil({ x: nx, y: cy - 26, r: 58, life: 0.9, color: '#e0c8ff', mode: 'crown' });
          Effects.pool({ x: nx, y: floorY - 2, r: radius * 0.6, life: 1.0, color: skill.color });
          Effects.ring({ x: nx, y: cy, r0: 20, maxR: radius, life: 0.5, color: skill.color, width: 8 });
          Effects.ring({ x: nx, y: cy, r0: 10, maxR: radius * 0.75, life: 0.38, color: '#fff', width: 2 });
          Effects.timer(0.08, () => Effects.ring({ x: nx, y: cy, r0: radius * 0.2, maxR: radius * 1.18, life: 0.42, color: '#b48cff', width: 3 }));
          Effects.timer(0.16, () => Effects.ring({ x: nx, y: cy, r0: radius * 0.4, maxR: radius * 1.3, life: 0.36, color: '#5d3a9e', width: 2 }));
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            Effects.crack({
              x: nx + Math.cos(a) * radius * 0.3,
              y: floorY - 3 + Math.sin(a) * 8,
              length: radius * 0.5, color: skill.color, seed: Math.floor(nx) + i * 13
            });
          }
          Effects.flash(skill.color, 0.2, 0.2);
          Effects.shadowBurst(nx, cy, 'rgba(38,16,64,0.8)', 26, { spread: 40, speed: 260, up: 170, life: 1.0, size: 10 });
          Effects.spawnParticles(nx, cy, skill.color, 34, {
            speed: 320, life: 0.6, glow: true, spreadX: 26, spreadY: 26, shape: 'circle'
          });
          Camera.addTrauma(0.4);
          AudioFX.play('boss');
          for (const m of game.monsters) {
            if (m.dead) continue;
            const dist = Math.hypot((m.x + m.w / 2) - (p.x + p.w / 2), (m.y + m.h / 2) - (p.y + p.h / 2));
            if (dist < radius + m.w * 0.5) {
              const roll = this.playerDamage(game, m, skill.damage || 2.1, true);
              game.damageMonster(m, roll.dmg, {
                crit: roll.crit, source: 'nova', color: skill.color,
                knockback: 320, stun: skill.stun || 0
              });
            }
          }
          Engine.hitStop(0.08);
          break;
        }

        case 'summon': {
          const count = (skill.count || 2) + ((p.stats && p.stats.allyCount) || 0);
          const sx = p.x + p.w / 2;
          // «Восстаньте»: большая печать, тени поднимаются из-под земли
          Effects.sigil({ x: sx, y: floorY - 2, r: 150, life: 1.3, color: skill.color, mode: 'rune' });
          Effects.pool({ x: sx, y: floorY - 2, r: 150, life: 1.5, color: skill.color });
          Effects.sigil({ x: sx, y: cy - 30, r: 64, life: 1.1, color: '#f0e4ff', mode: 'crown' });
          Effects.flash('#b48cff', 0.14, 0.12);
          Effects.ring({ x: sx, y: cy, r0: 24, maxR: 170, life: 0.7, color: skill.color, width: 6 });
          Effects.shadowBurst(sx, floorY - 26, 'rgba(18,8,34,0.85)', 34, { spread: 80, speed: 220, up: 180, life: 1.3, size: 11 });
          for (let i = 0; i < count; i++) {
            const ax = p.x + (i % 2 === 0 ? -60 : 60) + (Math.random() - 0.5) * 30;
            const ally = game.spawnAlly(
              ax,
              p.y + p.h - 44,
              skill.duration || 15,
              p.atk * (skill.damage || 0.6)
            );
            Effects.timer(i * 0.09, () => {
              const agx = ally ? ally.x + ally.w / 2 : ax;
              Effects.pool({ x: agx, y: floorY - 2, r: 52, life: 0.9, color: skill.color });
              Effects.sigil({ x: agx, y: floorY - 3, r: 44, life: 0.7, color: '#c8a6ff', mode: 'rune' });
              Effects.shadowBurst(agx, floorY - 30, 'rgba(25,12,46,0.9)', 16, { spread: 22, speed: 140, up: 200, life: 1.0, size: 9 });
              Effects.ring({ x: agx, y: floorY - 32, r0: 4, maxR: 70, life: 0.4, color: skill.color, width: 3 });
              Effects.spawnParticles(agx, floorY - 40, skill.color, 12, { speed: 90, up: 150, life: 0.7, glow: true, shape: 'circle' });
            });
          }
          AudioFX.play('levelup');
          Camera.addTrauma(0.25);
          break;
        }

        default:
          break;
      }
      return true;
    }
  };

  window.Combat = Combat;
})();
