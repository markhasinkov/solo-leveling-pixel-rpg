// boss.js — боссы с фазами, уникальными телеграф-атаками и яростью.
(function () {
  'use strict';

  const Monster = window.GameActors.Monster;
  const F = window.Formulas;

  function center(actor) {
    return { x: actor.x + actor.w / 2, y: actor.y + actor.h / 2 };
  }

  function distToRect(x, y, rect) {
    const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    return Math.hypot(x - nx, y - ny);
  }

  class Boss extends Monster {
    constructor(x, y, opts) {
      opts = opts || {};
      super(x, y, opts);
      this.isBoss = true;
      this.kind = 'boss';
      this.bossData = opts.bossData || {};
      this.phase = 0;
      this.patternTimer = 2.2;
      this.attackTimers = {};
      this.shieldTimer = 0;
      this.damageReduction = 0;
      this.castingTimer = 0;
      this.enraged = false;
      this.introShown = false;
      this.engaged = false;
      this.homeX = x;
      this.leash = 460;
      this.name = opts.name || this.bossData.title || 'Босс';
      this.subtitle = this.bossData.subtitle || '';
      this.maxHp = opts.maxHp || this.maxHp;
      this.hp = this.maxHp;
      this.speed = opts.speed || 110;
    }

    hurt(dmg, opts) {
      opts = opts || {};
      if (this.damageReduction > 0) dmg *= (1 - this.damageReduction);
      if (opts.stun) opts = Object.assign({}, opts, { stun: Math.min(0.5, opts.stun) });
      return super.hurt(dmg, opts);
    }

    update(dt, level, game) {
      this.tickTimers(dt);
      this.patternTimer -= dt;
      this.castingTimer -= dt;
      if (this.shieldTimer > 0) {
        this.shieldTimer -= dt;
        if (this.shieldTimer <= 0) this.damageReduction = 0;
      }
      for (const key in this.attackTimers) {
        if (this.attackTimers[key] > 0) this.attackTimers[key] -= dt;
      }

      if (this.dead) {
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      const p = game.player;
      if (!p || p.hp <= 0) {
        this.vx = 0;
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      if (!this.engaged) {
        const distToPlayer = Math.abs((p.x + p.w / 2) - (this.x + this.w / 2));
        if (distToPlayer < 640 || (this.hp < this.maxHp && distToPlayer < 1000)) {
          this.engaged = true;
          this.patternTimer = Math.max(this.patternTimer, 2.0);
          if (!this.introShown) {
            this.introShown = true;
            if (game.onBossIntro) game.onBossIntro(this);
          }
          if (game.onBossEngaged) game.onBossEngaged(this);
        } else {
          this.vx = Math.abs(this.x - this.homeX) > 24
            ? Math.sign(this.homeX - this.x) * this.speed * 0.55
            : 0;
          this.physics(dt, level);
          this.x = Math.max(this.homeX - this.leash, Math.min(this.homeX + this.leash, this.x));
          this.updateAnimation(dt);
          return;
        }
      } else {
        const chaseDist = Math.abs((p.x + p.w / 2) - (this.x + this.w / 2));
        if (chaseDist > 1200) {
          this.engaged = false;
          this.vx = 0;
          this.physics(dt, level);
          this.updateAnimation(dt);
          return;
        }
      }

      this.updatePhase(game);

      if (this.stunTimer > 0) {
        this.vx *= Math.max(0, 1 - 10 * dt);
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      const dx = (p.x + p.w / 2) - (this.x + this.w / 2);
      const dy = (p.y + p.h / 2) - (this.y + this.h / 2);
      const dist = Math.abs(dx);
      this.face = dx > 0 ? 1 : -1;

      if (this.castingTimer > 0) {
        this.vx *= Math.max(0, 1 - 12 * dt);
      } else {
        const attack = this.chooseAttack(dist, Math.abs(dy));
        if (attack) {
          this.executeAttack(attack, game);
        } else if (dist > 105) {
          const homeDist = this.x - this.homeX;
          if (Math.abs(homeDist) > this.leash && Math.sign(homeDist) === Math.sign(dx)) {
            this.vx = Math.sign(this.homeX - this.x) * this.speed * 0.8;
          } else {
            this.vx = this.face * this.speed * 0.7;
          }
        } else {
          this.vx = 0;
          if (this.attackTimer <= 0) {
            this.attackTimer = 1.7;
            this.attackAnimTimer = 0.5;
            const dmg = F.damage(this.atk, p.def, 1.1);
            Effects.timer(0.32, () => {
              if (!this.dead && Math.abs((p.x + p.w / 2) - (this.x + this.w / 2)) < 125 && Math.abs(p.y - this.y) < 120) {
                game.hurtPlayer(dmg, { source: 'boss-melee', attacker: this });
              }
            });
            Effects.slash({
              x: this.x + this.w / 2, y: this.y + this.h * 0.45,
              r: this.w * 0.7, face: this.face, life: 0.2, color: '#ff8a6a', width: 5
            });
          }
        }
      }

      this.physics(dt, level);
      this.x = Math.max(this.homeX - this.leash, Math.min(this.homeX + this.leash, this.x));
      this.updateAnimation(dt);
    }

    updatePhase(game) {
      const data = this.bossData;
      const ratio = this.hp / this.maxHp;
      const thresholds = data.phases || [];
      let phase = 0;
      for (const t of thresholds) if (ratio <= t) phase++;
      if (phase > this.phase) {
        this.phase = phase;
        if (game.onBossPhase) game.onBossPhase(this, phase);
        Effects.ring({ x: this.x + this.w / 2, y: this.y + this.h / 2, maxR: 240, life: 0.6, color: '#ffd24a', width: 4 });
      }
      const enrage = data.enrage;
      if (enrage && !this.enraged && ratio <= enrage.hp) {
        this.enraged = true;
        this.atk = Math.round(this.atk * (enrage.atkMult || 1.3));
        this.speed = Math.round(this.speed * (enrage.speedMult || 1.2));
        this.patternTimer = Math.min(this.patternTimer, 0.8);
        if (game.onBossEnrage) game.onBossEnrage(this);
        Effects.flash('#ff3a3a', 0.28, 0.25);
        Effects.ring({ x: this.x + this.w / 2, y: this.y + this.h / 2, maxR: 300, life: 0.8, color: '#ff4a4a', width: 6 });
      }
    }

    chooseAttack(dist, dy) {
      const data = this.bossData;
      const attacks = (data.attacks || []).filter((atk) => (atk.phase || 0) <= this.phase);
      const ready = attacks.filter((atk) => !this.attackTimers[atk.name]);
      if (!ready.length) {
        if (this.patternTimer <= 0) this.patternTimer = 0.6;
        return null;
      }
      if (this.patternTimer > 0) return null;
      return ready[Math.floor(Math.random() * ready.length)];
    }

    executeAttack(atk, game) {
      this.attackTimers[atk.name] = atk.cd || 6;
      this.patternTimer = 1.0 + Math.random() * 1.4;
      this.castingTimer = Math.max(0.4, atk.windup || 0.8);
      this.attackAnimTimer = this.castingTimer + 0.1;
      this.vx = 0;
      const p = game.player;
      const pc = center(p);
      const bc = center(this);
      const color = atk.color || '#ff6a5a';
      Effects.text(bc.x, this.y - 34, atk.name, { color, size: 12, life: 1.0, vy: -24 });
      const dmgMult = atk.dmg || 1.2;
      const bossDmg = F.damage(this.atk, p.def, dmgMult);
      const windup = atk.windup || 0.8;
      const floorY = (game.level && game.level.floorY) || 820;

      switch (atk.type) {
        case 'slam': {
          const sx = Math.max(80, Math.min(pc.x, (game.level ? game.level.worldW : 2400) - 80));
          const radius = atk.radius || 120;
          Effects.telegraphCircle(sx, floorY - 30, radius, windup, () => {
            if (this.dead) return;
            Effects.ring({ x: sx, y: floorY - 20, maxR: radius + 30, life: 0.4, color, width: 6 });
            Effects.spawnParticles(sx, floorY - 20, color, 22, { speed: 260, up: 160, life: 0.6, size: 4, gravity: 900 });
            Camera.addTrauma(0.45);
            AudioFX.play('hit');
            if (distToRect(sx, floorY - 30, p) < radius) {
              game.hurtPlayer(bossDmg, { source: 'boss-slam', attacker: this, dir: p.x > sx ? 1 : -1, knockback: 260 });
            }
          }, color);
          break;
        }

        case 'beam': {
          if (atk.mode === 'horizontal') {
            const y = floorY - 82;
            const h = 78;
            Effects.telegraphRect(0, y, (game.level ? game.level.worldW : 2400), h, windup, () => {
              if (this.dead) return;
              Effects.telegraphRect(0, y, (game.level ? game.level.worldW : 2400), h, 0.18, null, '#fff');
              for (let x = 0; x < 2400; x += 34) {
                Effects.spawnParticles(x, y + h / 2, color, 2, { speed: 120, life: 0.35, size: 3, gravity: -60, glow: true });
              }
              Camera.addTrauma(0.5);
              Effects.flash(color, 0.18, 0.16);
              AudioFX.play('boss');
              if (p.y + p.h > y && p.y < y + h) {
                game.hurtPlayer(bossDmg, { source: 'boss-beam', attacker: this, knockback: 240 });
              }
            }, color);
          } else {
            const cx = Math.max(60, Math.min(pc.x, (game.level ? game.level.worldW : 2400) - 60));
            const w = atk.width || 80;
            Effects.telegraphRect(cx - w / 2, 0, w, floorY + 60, windup, () => {
              if (this.dead) return;
              Effects.telegraphRect(cx - w / 2, 0, w, floorY + 60, 0.2, null, '#fff');
              for (let y = 0; y < floorY; y += 30) {
                Effects.spawnParticles(cx, y, color, 2, { speed: 60, life: 0.3, size: 3, gravity: 0, glow: true });
              }
              Camera.addTrauma(0.4);
              Effects.flash(color, 0.16, 0.15);
              AudioFX.play('boss');
              if (pc.x > cx - w / 2 && pc.x < cx + w / 2) {
                game.hurtPlayer(bossDmg, { source: 'boss-beam', attacker: this, knockback: 200 });
              }
            }, color);
          }
          break;
        }

        case 'fan': {
          const count = atk.count || 5;
          const spread = atk.spread || 0.9;
          const angle = Math.atan2(pc.y - bc.y, pc.x - bc.x);
          Effects.timer(windup, () => {
            if (this.dead) return;
            for (let i = 0; i < count; i++) {
              const a = angle + (i - (count - 1) / 2) * (spread / Math.max(1, count - 1));
              Effects.projectile({
                x: bc.x, y: bc.y,
                vx: Math.cos(a) * (atk.speed || 380),
                vy: Math.sin(a) * (atk.speed || 380),
                r: 7, damage: bossDmg, owner: 'enemy', color, life: 3.0
              });
            }
            Effects.spawnParticles(bc.x, bc.y, color, 12, { speed: 140, life: 0.4 });
            AudioFX.play('slash');
          });
          break;
        }

        case 'rain': {
          const count = atk.count || 6;
          const radius = atk.radius || 55;
          for (let i = 0; i < count; i++) {
            const rx = Math.max(70, Math.min(pc.x + (Math.random() - 0.5) * 480, (game.level ? game.level.worldW : 2400) - 70));
            const delay = windup + i * 0.11;
            Effects.telegraphCircle(rx, floorY - 26, radius, delay, () => {
              if (this.dead) return;
              Effects.ring({ x: rx, y: floorY - 24, maxR: radius + 16, life: 0.3, color, width: 4 });
              Effects.spawnParticles(rx, floorY - 24, color, 14, { speed: 220, up: 120, life: 0.5, size: 3 });
              Camera.addTrauma(0.15);
              if (distToRect(rx, floorY - 26, p) < radius) {
                game.hurtPlayer(bossDmg, { source: 'boss-rain', attacker: this, knockback: 150 });
              }
            }, color);
          }
          break;
        }

        case 'nova': {
          const radius = atk.radius || 220;
          Effects.telegraphCircle(bc.x, floorY - 40, radius, windup, () => {
            if (this.dead) return;
            Effects.ring({ x: bc.x, y: bc.y, maxR: radius, life: 0.55, color, width: 6 });
            Effects.ring({ x: bc.x, y: bc.y, maxR: radius * 0.7, life: 0.45, color: '#fff', width: 2 });
            Camera.addTrauma(0.5);
            Effects.flash(color, 0.18, 0.16);
            AudioFX.play('boss');
            if (Math.hypot(pc.x - bc.x, pc.y - bc.y) < radius) {
              game.hurtPlayer(bossDmg, { source: 'boss-nova', attacker: this, knockback: 320 });
            }
          }, color);
          break;
        }

        case 'zone': {
          const zx = pc.x;
          Effects.timer(windup, () => {
            if (this.dead) return;
            Effects.zone({
              x: zx, y: floorY - 24, r: atk.radius || 110,
              life: atk.duration || 6, dps: F.damage(this.atk, p.def, atk.dps || 0.4),
              slow: atk.slow || 0.4, owner: 'enemy', color
            });
            Effects.spawnParticles(zx, floorY - 24, color, 16, { speed: 100, life: 0.6, size: 3, gravity: 200 });
            AudioFX.play('hurt');
          });
          break;
        }

        case 'summon': {
          Effects.timer(windup, () => {
            if (this.dead || !game.spawnMinion) return;
            const ids = atk.ids || ['goblin'];
            const names = atk.names || [];
            for (let i = 0; i < (atk.count || 2); i++) {
              const id = ids[i % ids.length];
              const x = this.x + (i % 2 === 0 ? -70 : 70) + (Math.random() - 0.5) * 40;
              game.spawnMinion(id, x, floorY - 80, names[i] || null, true);
            }
            Effects.ring({ x: bc.x, y: bc.y, maxR: 160, life: 0.5, color, width: 4 });
            AudioFX.play('skill');
          });
          break;
        }

        case 'dash': {
          const targetX = Math.max(70, Math.min(pc.x - this.w / 2, (game.level ? game.level.worldW : 2400) - this.w - 70));
          const dir = targetX > this.x ? 1 : -1;
          const minX = Math.min(this.x, targetX);
          Effects.telegraphRect(minX, this.y, Math.abs(targetX - this.x) + this.w, this.h, windup, () => {
            if (this.dead) return;
            for (let i = 0; i < 6; i++) {
              Effects.afterimage({
                sheet: this.sheet, col: this.animFrame, row: 1,
                x: this.getDrawX() + (targetX - this.x) * (i / 6), y: this.getDrawY(),
                w: this.drawW, h: this.drawH, face: dir, life: 0.35, color
              });
            }
            this.x = targetX;
            this.face = dir;
            Effects.ring({ x: this.x + this.w / 2, y: this.y + this.h / 2, maxR: 150, life: 0.35, color, width: 5 });
            Camera.addTrauma(0.4);
            AudioFX.play('dash');
            if (Math.hypot(pc.x - (this.x + this.w / 2), pc.y - (this.y + this.h / 2)) < 130) {
              game.hurtPlayer(bossDmg, { source: 'boss-dash', attacker: this, knockback: 300 });
            }
          }, color);
          break;
        }

        case 'shield': {
          Effects.timer(windup, () => {
            if (this.dead) return;
            this.damageReduction = atk.reduction || 0.6;
            this.shieldTimer = atk.duration || 3;
            Effects.ring({ x: bc.x, y: bc.y, maxR: 120, life: 0.5, color: '#ffd24a', width: 5 });
            Effects.text(bc.x, this.y - 20, 'БЛОК', { color: '#ffd24a', size: 14, life: 1 });
            AudioFX.play('ui');
            if (game.onBossShield) game.onBossShield(this, this.shieldTimer);
          });
          break;
        }

        case 'heal': {
          Effects.timer(windup, () => {
            if (this.dead) return;
            const amount = Math.round(this.maxHp * (atk.percent || 0.05));
            this.hp = Math.min(this.maxHp, this.hp + amount);
            Effects.text(bc.x, this.y - 24, '+' + amount, { color: '#6aff9a', size: 18, life: 1.1 });
            Effects.spawnParticles(bc.x, bc.y, '#6aff9a', 18, { speed: 120, up: 80, life: 0.7, glow: true });
            AudioFX.play('heal');
          });
          break;
        }

        case 'teleport': {
          Effects.timer(windup, () => {
            if (this.dead) return;
            const oldX = this.x;
            for (let i = 0; i < 4; i++) {
              Effects.afterimage({
                sheet: this.sheet, col: this.animFrame, row: 0,
                x: oldX + (i - 2) * 10, y: this.getDrawY(), w: this.drawW, h: this.drawH,
                face: this.face, life: 0.4, color
              });
            }
            this.x = Math.max(70, Math.min(p.x + (p.face > 0 ? 110 : -110 - this.w), (game.level ? game.level.worldW : 2400) - this.w - 70));
            const dx = (p.x + p.w / 2) - (this.x + this.w / 2);
            this.face = dx > 0 ? 1 : -1;
            Effects.ring({ x: this.x + this.w / 2, y: this.y + this.h / 2, maxR: 130, life: 0.4, color, width: 4 });
            Effects.spawnParticles(this.x + this.w / 2, this.y + this.h / 2, color, 16, { speed: 180, life: 0.5, glow: true });
            AudioFX.play('dash');
          });
          break;
        }

        default:
          this.patternTimer = 0.5;
          break;
      }
    }

    draw(ctx) {
      const ratio = this.hp / this.maxHp;
      const aura = this.enraged ? 'rgba(255,74,74,0.5)' : (this.phase > 0 ? 'rgba(255,210,74,0.35)' : 'rgba(160,108,255,0.25)');
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(Effects.time * 4) * 0.1;
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.75, this.h * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      super.draw(ctx);
      if (this.shieldTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(Effects.time * 10) * 0.2;
        ctx.strokeStyle = '#ffd24a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.72, this.h * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // индикатор фазы в полосе над боссом
      if (!this.dead) {
        const phaseColors = ['#9a6cff', '#ffd24a', '#ff4a4a'];
        ctx.save();
        ctx.fillStyle = phaseColors[Math.min(this.phase, 2)];
        ctx.fillRect(this.x + this.w / 2 - 8, this.y - 20, 16, 3);
        ctx.restore();
      }
    }
  }

  window.Boss = Boss;
})();
