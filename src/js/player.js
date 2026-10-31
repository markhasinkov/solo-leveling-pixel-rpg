// player.js — бойцы: игрок, монстры, NPC и теневые союзники.
// Анимации: 4 кадра x состояния idle/walk/attack/jump/hurt/death.
(function () {
  'use strict';

  const GRAVITY = 2200;
  const MOVE_SPEED = 260;
  const JUMP_SPEED = 760;
  const ROW = { idle: 0, walk: 1, attack: 2, jump: 3, hurt: 4, death: 5 };
  const FPS = { idle: 5, walk: 10, attack: 14, jump: 7, hurt: 10, death: 7 };

  class Fighter {
    constructor(x, y, w, h, opts) {
      opts = opts || {};
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.vx = 0; this.vy = 0;
      this.onGround = false;
      this.face = opts.face || 1;
      this.maxHp = opts.maxHp != null ? opts.maxHp : (opts.hp != null ? opts.hp : 100);
      this.hp = opts.hp != null ? opts.hp : this.maxHp;
      this.atk = opts.atk != null ? opts.atk : 10;
      this.def = opts.def != null ? opts.def : 0;
      this.kind = opts.kind || 'monster';
      this.name = opts.name || '';
      this.color = opts.color || '#8cf';
      this.speed = opts.speed != null ? opts.speed : MOVE_SPEED;
      this.jump = opts.jump != null ? opts.jump : JUMP_SPEED;
      this.drawW = opts.drawW || this.w;
      this.drawH = opts.drawH || this.h;
      this.hurtTimer = 0;
      this.attackAnimTimer = 0;
      this.invulnTimer = 0;
      this.stunTimer = 0;
      this.slowTimer = 0;
      this.dead = false;
      this.deathTimer = 0;
      this.animState = 'idle';
      this.animT = 0;
      this.animFrame = 0;
      this.statsBase = opts.statsBase || null;
      this.lootId = opts.lootId || null;
      this.elite = !!opts.elite;
      this.isBoss = false;
      this.animId = opts.animId || null;
      this.sheet = opts.animId
        ? Engine.getSheet('assets/sprites/anim/' + opts.animId + '.png', 64, 64, 4, 6, this.color)
        : null;
      this.staticSprite = opts.sprite || null;
      this.blinkSeed = Math.random() * 10;
    }

    getDrawX() { return this.x + this.w / 2 - this.drawW / 2; }
    getDrawY() { return this.y + this.h - this.drawH; }

    setAnim(state) {
      if (this.animState !== state) {
        this.animState = state;
        this.animT = 0;
      }
    }

    updateAnimation(dt) {
      let state;
      if (this.dead) state = 'death';
      else if (this.hurtTimer > 0) state = 'hurt';
      else if (this.attackAnimTimer > 0) state = 'attack';
      else if (this.stunTimer > 0) state = 'idle';
      else if (!this.onGround) state = 'jump';
      else if (Math.abs(this.vx) > 25) state = 'walk';
      else state = 'idle';
      this.setAnim(state);
      this.animT += dt;
      const fps = FPS[state] || 8;
      let frame = Math.floor(this.animT * fps) % 4;
      if (state === 'hurt') frame = Math.min(1, frame % 2);
      else if (state === 'jump') frame = this.vy < 0 ? 1 : 0;
      this.animFrame = frame;
    }

    physics(dt, level) {
      if (this.dead) {
        this.vx *= Math.max(0, 1 - 6 * dt);
        this.vy += GRAVITY * 0.4 * dt;
      } else {
        this.vy += GRAVITY * dt;
      }
      this.x += this.vx * dt;
      if (level) level.collideX(this);
      const prevBottom = this.y + this.h;
      this.y += this.vy * dt;
      this.onGround = false;
      if (level) {
        level.collideY(this);
        // Свип-проверка пола: страхует от туннелирования при редком/большом кадре.
        if (this.vy >= 0 && prevBottom <= level.floorY + 2 && this.y + this.h > level.floorY) {
          this.y = level.floorY - this.h;
          this.vy = 0;
          this.onGround = true;
        }
        // В уровнях нет ям: если актёр всё же оказался ниже пола, возвращаем его.
        if (!this.dead && this.y > level.floorY + 140) {
          this.y = level.floorY - this.h;
          this.vx = 0;
          this.vy = 0;
          this.onGround = true;
        }
      }
      if (this.hurtTimer > 0) this.hurtTimer -= dt;
    }

    tickTimers(dt) {
      if (this.hurtTimer > 0) this.hurtTimer -= dt;
      if (this.attackAnimTimer > 0) this.attackAnimTimer -= dt;
      if (this.invulnTimer > 0) this.invulnTimer -= dt;
      if (this.stunTimer > 0) this.stunTimer -= dt;
      if (this.slowTimer > 0) this.slowTimer -= dt;
      if (this.dead && this.deathTimer > 0) this.deathTimer -= dt;
    }

    hurt(dmg, opts) {
      opts = opts || {};
      if (this.dead) return 0;
      if (this.invulnTimer > 0 && opts.ignoreInvuln !== true) return 0;
      const real = Math.max(1, Math.round(dmg));
      this.hp -= real;
      this.hurtTimer = opts.hurtTime || 0.18;
      this.attackAnimTimer = 0;
      if (opts.knockback) {
        this.vx = (opts.dir || (opts.attacker ? (this.x > opts.attacker.x ? 1 : -1) : -this.face)) * opts.knockback;
        this.vy = Math.min(this.vy, -180);
      }
      if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        this.deathTimer = 1.0;
        this.vx *= 0.4;
      }
      return real;
    }

    drawShadow(ctx) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + this.h - 2, this.w * 0.42, Math.max(3, this.h * 0.09), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    draw(ctx) {
      this.drawShadow(ctx);
      const bob = !this.dead && this.onGround
        ? (this.animState === 'walk' ? Math.sin(this.animT * 12) * 1.2 : Math.sin(this.animT * 3) * 0.8)
        : 0;
      let alpha = 1;
      if (this.invulnTimer > 0 && this.kind === 'player' && !this.dead) {
        alpha = Math.floor(this.invulnTimer * 22) % 2 === 0 ? 0.4 : 1;
      }
      if (this.dead) alpha = Math.max(0, Math.min(1, this.deathTimer / 1.0));
      if (this.elite) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(this.animT * 5) * 0.2;
        ctx.strokeStyle = '#e8c76a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h - 2, this.w * 0.55, this.h * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      const row = ROW[this.animState] || 0;
      const dx = this.getDrawX();
      const dy = this.getDrawY() + bob;
      if (this.sheet && this.sheet.ok) {
        Engine.drawFrame(this.sheet, this.animFrame, row, dx, dy, this.drawW, this.drawH, this.face < 0, alpha);
      } else if (this.staticSprite) {
        Engine.drawSprite(this.staticSprite, dx, dy, this.drawW, this.drawH, this.face < 0, alpha);
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.dead ? '#555' : this.color;
        ctx.fillRect(dx, dy, this.drawW, this.drawH);
        ctx.fillStyle = '#000';
        ctx.fillRect(dx + (this.face > 0 ? this.drawW * 0.6 : this.drawW * 0.2), dy + this.drawH * 0.2, 3, 3);
        ctx.restore();
      }
      if (this.stunTimer > 0 && !this.dead) {
        ctx.save();
        ctx.fillStyle = '#ffd24a';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✦', this.x + this.w / 2, this.y - 16 + Math.sin(this.animT * 8) * 2);
        ctx.restore();
      }
      if ((this.kind === 'monster' || this.kind === 'boss') && !this.dead && this.hp > 0) {
        const bw = Math.max(30, this.w), bh = 4;
        const by = this.getDrawY() - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(this.x + this.w / 2 - bw / 2 - 1, by, bw + 2, bh + 2);
        ctx.fillStyle = this.isBoss ? '#ffb347' : (this.elite ? '#e8c76a' : '#e33');
        ctx.fillRect(this.x + this.w / 2 - bw / 2, by + 1, bw * (this.hp / this.maxHp), bh);
      }
    }
  }

  class Player extends Fighter {
    constructor(x, y, opts) {
      super(x, y, 36, 64, Object.assign({ kind: 'player', hp: 850, atk: 120, def: 70, animId: 'sung-jin-woo', drawW: 64, drawH: 64 }, opts));
      this.maxMp = opts && opts.maxMp != null ? opts.maxMp : 100;
      this.mp = this.maxMp;
      this.stats = null;
      this.attackTimer = 0;
      this.attackCd = 0.4;
      this.attackRange = 48;
      this.kills = 0;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.jumpsUsed = 0;
      this.dashTimer = 0;
      this.dashVX = 0;
      this.dashColor = '#9a6cff';
      this.afterimageTimer = 0;
      this.lowHpPulse = 0;
      this.dodgeCd = 0;
      this.dodgeInvuln = 0;
      this.comboStep = 0;
      this.comboTimer = 0;
      this.comboWindow = 0.9;
    }

    syncStats(stats, heal) {
      this.stats = stats;
      const oldMax = this.maxHp;
      const oldMpMax = this.maxMp;
      this.maxHp = stats.maxHp;
      this.maxMp = stats.maxMp;
      this.atk = stats.atk;
      this.def = stats.def;
      this.speed = stats.speed;
      if (heal) {
        this.hp = this.maxHp;
        this.mp = this.maxMp;
      } else {
        this.hp = Math.min(this.maxHp, this.hp + Math.max(0, this.maxHp - oldMax));
        this.mp = Math.min(this.maxMp, this.mp + Math.max(0, this.maxMp - oldMpMax));
      }
    }

    startDash(dir, distance, duration, opts) {
      opts = opts || {};
      this.face = dir;
      this.dashTimer = duration || 0.16;
      this.dashVX = (distance || 210) / this.dashTimer * dir;
      this.dashColor = opts.color || '#9a6cff';
      this.invulnTimer = Math.max(this.invulnTimer, opts.invuln || (this.dashTimer + 0.08));
      this.afterimageTimer = 0;
    }

    tryDodge() {
      if (this.dead || this.stunTimer > 0 || this.dodgeCd > 0 || this.dashTimer > 0) return false;
      const axis = Engine.Input.axisX();
      const dir = axis !== 0 ? (axis > 0 ? 1 : -1) : this.face;
      this.face = dir;
      this.startDash(dir, 230, 0.18, { invuln: 0.36, color: '#7ad7ff' });
      this.dodgeCd = 1.15;
      this.dodgeInvuln = 0.36;
      this.attackAnimTimer = 0;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h * 0.45;
      Effects.ring({ x: cx, y: cy, r0: 7, maxR: 58, life: 0.28, color: '#7ad7ff', width: 3 });
      Effects.spawnParticles(cx, cy + 14, '#7ad7ff', 7, { speed: 110, life: 0.3, size: 2, glow: true });
      AudioFX.play('dash');
      if (window.TG) window.TG.haptic('light');
      return true;
    }

    hurt(dmg, opts) {
      const real = super.hurt(dmg, opts);
      if (real > 0) {
        this.comboStep = 0;
        this.comboTimer = 0;
      }
      return real;
    }

    update(dt, level, game) {
      this.tickTimers(dt);
      this.lowHpPulse += dt;
      if (this.dodgeCd > 0) this.dodgeCd = Math.max(0, this.dodgeCd - dt);
      if (this.dodgeInvuln > 0) this.dodgeInvuln = Math.max(0, this.dodgeInvuln - dt);
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.comboTimer = 0;
          this.comboStep = 0;
        }
      }

      if (this.dead) {
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      if (this.stats) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * (this.stats.hpRegen || 0) * dt);
        this.mp = Math.min(this.maxMp, this.mp + (this.stats.mpRegen || 0) * dt);
      }

      if (this.stunTimer > 0) {
        this.vx *= Math.max(0, 1 - 8 * dt);
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      const axis = Engine.Input.axisX();
      const slow = this.slowTimer > 0 ? 0.55 : 1;
      const mouseAim = Engine.Input.mouse.active && Engine.Input.mouse.overCanvas;
      if (mouseAim) {
        const mw = Engine.Input.mouseWorld();
        this.face = mw.x >= this.x + this.w / 2 ? 1 : -1;
      }

      if (Engine.Input.actionHit('dodge')) this.tryDodge();

      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.vx = this.dashVX;
        this.afterimageTimer -= dt;
        if (this.afterimageTimer <= 0) {
          this.afterimageTimer = 0.035;
          Effects.afterimage({
            sheet: this.sheet, col: this.animFrame, row: ROW[this.animState] || 0,
            x: this.getDrawX(), y: this.getDrawY(), w: this.drawW, h: this.drawH, face: this.face, life: 0.22, color: this.dashColor
          });
        }
      } else {
        const target = axis * this.speed * slow;
        this.vx += (target - this.vx) * Math.min(1, dt * 22);
        if (Math.abs(this.vx) < 3) this.vx = 0;
        if (axis && !mouseAim) this.face = axis > 0 ? 1 : -1;
      }

      if (Engine.Input.action('down') && !this.onGround && this.dashTimer <= 0) {
        this.vy = Math.min(1700, this.vy + 3600 * dt);
      }

      if (this.onGround) {
        this.coyote = 0.1;
        this.jumpsUsed = 0;
      } else if (this.coyote > 0) {
        this.coyote -= dt;
      } else if (this.jumpsUsed === 0) {
        this.jumpsUsed = 1;
      }

      if (Engine.Input.actionHit('jump')) {
        this.jumpBuffer = 0.13;
        this.jumpHeld = true;
      } else if (!Engine.Input.action('jump')) {
        this.jumpBuffer = 0;
        if (this.jumpHeld && this.vy < -240) this.vy *= 0.55;
        this.jumpHeld = false;
      }
      if (this.jumpBuffer > 0) {
        this.jumpBuffer -= dt;
        const maxJumps = (this.stats && this.stats.doubleJump) ? 2 : 1;
        const canGround = this.onGround || this.coyote > 0;
        if (canGround || this.jumpsUsed < maxJumps) {
          this.vy = -this.jump;
          this.onGround = false;
          this.coyote = 0;
          this.jumpBuffer = 0;
          this.jumpsUsed = canGround ? 1 : Math.max(1, this.jumpsUsed + 1);
          Effects.spawnParticles(this.x + this.w / 2, this.y + this.h, '#9fb4d8', 5, {
            angle: -Math.PI / 2, spread: 2.4, speed: 90, life: 0.3, gravity: 500, size: 2
          });
          AudioFX.play('dash');
        }
      }

      if ((Engine.Input.action('attack') || Engine.Input.actionHit('attack')) && this.attackTimer <= 0 && this.dashTimer <= 0) {
        game.playerAttack(this);
      }
      if (this.attackTimer > 0) this.attackTimer -= dt;

      this.physics(dt, level);
      this.updateAnimation(dt);
    }

    draw(ctx) {
      super.draw(ctx);
      if (this.attackAnimTimer > 0 && !this.dead) {
        // лёгкий наклон вперёд во время удара
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#9a6cff';
        ctx.fillRect(this.face > 0 ? this.x + this.w : this.x - 6, this.y + this.h * 0.45, 6, 4);
        ctx.restore();
      }
    }
  }

  const TRAITS = {
    goblin: { speed: 175, attackRange: 44, windup: 0.22, attackCd: 1.05, aggro: 300, melee: 1.0 },
    orc: { speed: 120, attackRange: 54, windup: 0.45, attackCd: 1.5, aggro: 300, melee: 1.25 },
    'knight-ant': { speed: 135, attackRange: 48, windup: 0.3, attackCd: 1.4, aggro: 380, ranged: true, shootCd: 2.4, melee: 0.8 },
    'ice-bear': { speed: 155, attackRange: 58, windup: 0.4, attackCd: 1.6, aggro: 340, lunge: true, melee: 1.2 },
    'demon-knight': { speed: 118, attackRange: 58, windup: 0.5, attackCd: 1.6, aggro: 360, melee: 1.3, guard: 0.55 },
    hellhound: { speed: 195, attackRange: 48, windup: 0.24, attackCd: 1.0, aggro: 430, melee: 1.05, lunge: true },
    'goblin-shaman': { speed: 105, attackRange: 48, windup: 0.35, attackCd: 1.8, aggro: 420, ranged: true, shootCd: 2.6, melee: 0.65, projectileColor: '#8aff6a', projectileSpeed: 300, projectileSlow: 1.0 },
    'cave-spider': { speed: 195, attackRange: 46, windup: 0.24, attackCd: 1.05, aggro: 380, melee: 1.0, lunge: true, lungeColor: '#b06a8a', onHitSlow: 1.3 },
    'orc-berserker': { speed: 155, attackRange: 60, windup: 0.3, attackCd: 1.15, aggro: 380, melee: 1.4, berserk: true },
    'ice-elf-ranger': { speed: 145, attackRange: 50, windup: 0.3, attackCd: 1.5, aggro: 440, ranged: true, shootCd: 2.2, melee: 0.7, projectileColor: '#bfe6f7', projectileSpeed: 430, projectileSlow: 1.2 },
    'frost-wolf': { speed: 210, attackRange: 48, windup: 0.22, attackCd: 1.0, aggro: 440, melee: 1.0, lunge: true, lungeColor: '#bfe6f7', onHitSlow: 0.9 },
    guardian: { speed: 140, attackRange: 54, windup: 0.35, attackCd: 1.3, aggro: 320, melee: 1.1 }
  };

  class Monster extends Fighter {
    constructor(x, y, opts) {
      opts = opts || {};
      super(x, y, opts.w || 36, opts.h || 40, Object.assign({ kind: 'monster' }, opts));
      this.trait = TRAITS[opts.lootId] || TRAITS.guardian;
      if (!opts.speed) this.speed = this.trait.speed;
      this.homeX = x;
      this.patrolRange = 90;
      this.attackTimer = 1 + Math.random();
      this.attackCd = opts.attackCd || this.trait.attackCd;
      this.windup = 0;
      this.windupActive = false;
      this.shootTimer = 1.5;
      this.lungeCd = 3;
      this.guardBreakTimer = 0;
      this.berserked = false;
      this.aiTimer = 0;
      this.aiDir = Math.random() < 0.5 ? -1 : 1;
      this.removed = false;
      this.summons = 0;
    }

    update(dt, level, game) {
      this.tickTimers(dt);
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

      this.attackTimer -= dt;
      this.shootTimer -= dt;
      this.lungeCd -= dt;
      if (this.guardBreakTimer > 0) this.guardBreakTimer -= dt;
      if (this.trait.berserk && !this.berserked && this.hp <= this.maxHp * 0.35) {
        this.berserked = true;
        this.atk = Math.round(this.atk * 1.25);
        this.speed = Math.round(this.speed * 1.35);
        this.attackCd = Math.max(0.7, this.attackCd * 0.85);
        Effects.text(this.x + this.w / 2, this.y - 26, 'ЯРОСТЬ', { color: '#ff6a4a', size: 11, life: 1.0 });
        Effects.ring({ x: this.x + this.w / 2, y: this.y + this.h / 2, maxR: 90, life: 0.55, color: '#ff5a4a', width: 4 });
      }

      if (this.stunTimer > 0) {
        this.vx *= Math.max(0, 1 - 10 * dt);
        this.physics(dt, level);
        this.updateAnimation(dt);
        return;
      }

      const dx = (p.x + p.w / 2) - (this.x + this.w / 2);
      const dy = (p.y + p.h / 2) - (this.y + this.h / 2);
      const dist = Math.abs(dx);
      const aggro = this.trait.aggro || 300;
      const slowFactor = this.slowTimer > 0 ? 0.62 : 1;

      if (this.windupActive) {
        this.windup -= dt;
        this.vx *= Math.max(0, 1 - 9 * dt);
        this.face = dx > 0 ? 1 : -1;
        if (this.windup <= 0) {
          this.windupActive = false;
          if (Math.abs(dx) < (this.trait.attackRange || 50) + p.w / 2 && Math.abs(dy) < 70) {
            const dmg = window.Formulas.damage(this.atk, p.def, this.trait.melee || 1);
            game.hurtPlayer(dmg, { source: 'melee', attacker: this });
            if (this.trait.onHitSlow) p.slowTimer = Math.max(p.slowTimer || 0, this.trait.onHitSlow);
          }
          this.attackAnimTimer = 0.22;
          Effects.slash({
            x: this.x + this.w / 2, y: this.y + this.h * 0.5,
            r: (this.trait.attackRange || 50) * 0.8, face: this.face,
            life: 0.16, color: '#ff9a6a', width: 3
          });
        }
      } else if (dist < aggro && Math.abs(dy) < 130) {
        this.face = dx > 0 ? 1 : -1;
        if (this.trait.ranged && dist > 120 && dist < 430 && this.shootTimer <= 0) {
          this.shootTimer = this.trait.shootCd;
          this.attackAnimTimer = 0.3;
          this.vx = 0;
          const dmg = window.Formulas.damage(this.atk, p.def, 1);
          Effects.projectile({
            x: this.x + this.w / 2, y: this.y + this.h * 0.35,
            vx: this.face * (this.trait.projectileSpeed || 330), vy: -30, r: 6,
            damage: dmg, owner: 'enemy', color: this.trait.projectileColor || '#a8ff6a',
            slow: this.trait.projectileSlow || 0, life: 2.2
          });
          AudioFX.play('slash');
        } else if (this.trait.lunge && dist > 220 && this.lungeCd <= 0 && this.onGround) {
          this.lungeCd = 4.2;
          this.vy = -460;
          this.vx = this.face * 300 * slowFactor;
          Effects.spawnParticles(this.x + this.w / 2, this.y + this.h, this.trait.lungeColor || '#bfe6f7', 8, { speed: 160, life: 0.4 });
        }
        if (dist > (this.trait.attackRange || 50) + 8) {
          this.vx = this.face * this.speed * slowFactor;
        } else if (this.attackTimer <= 0 && !this.windupActive) {
          this.attackTimer = this.attackCd;
          this.windupActive = true;
          this.windup = this.trait.windup || 0.3;
          this.attackAnimTimer = this.windup + 0.1;
          this.vx = 0;
        } else {
          this.vx *= Math.max(0, 1 - 8 * dt);
        }
      } else {
        this.aiTimer -= dt;
        if (this.aiTimer <= 0) {
          this.aiDir *= -1;
          this.aiTimer = 1.3 + Math.random() * 1.6;
        }
        if (Math.abs(this.x - this.homeX) > this.patrolRange) {
          this.aiDir = this.x > this.homeX ? -1 : 1;
        }
        this.vx = this.aiDir * this.speed * 0.35 * slowFactor;
        this.face = this.aiDir;
      }

      this.physics(dt, level);
      this.updateAnimation(dt);
    }

    draw(ctx) {
      super.draw(ctx);
      if (this.berserked && !this.dead) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.animT * 8) * 0.12;
        ctx.strokeStyle = '#ff5a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h * 0.5, this.w * 0.8, this.h * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (this.dead || !this.trait.guard || this.guardBreakTimer > 0) return;
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.animT * 6) * 0.12;
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h * 0.5;
      const a = this.face > 0 ? 0.55 : Math.PI - 0.55;
      ctx.arc(cx, cy, this.w * 0.72, a - 0.7, a + 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }

  class Npc extends Fighter {
    constructor(x, y, opts) {
      super(x, y, 36, 64, Object.assign({ kind: 'npc', hp: 999, maxHp: 999, drawW: 64, drawH: 64 }, opts));
      this.homeX = x;
      this.wanderTimer = 2 + Math.random() * 3;
      this.wanderDir = 0;
    }

    update(dt, level, game) {
      this.tickTimers(dt);
      const p = game.player;
      this.wanderTimer -= dt;
      if (p && Math.abs((p.x + p.w / 2) - (this.x + this.w / 2)) < 96 && Math.abs(p.y - this.y) < 70) {
        this.vx *= 0.8;
        this.face = p.x > this.x ? 1 : -1;
      } else {
        if (this.wanderTimer <= 0) {
          this.wanderDir = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1);
          this.wanderTimer = 1.5 + Math.random() * 3;
        }
        if (Math.abs(this.x - this.homeX) > 70) this.wanderDir = this.x > this.homeX ? -1 : 1;
        this.vx = this.wanderDir * 55;
        if (this.wanderDir) this.face = this.wanderDir;
      }
      this.physics(dt, level);
      this.updateAnimation(dt);
    }

    draw(ctx) {
      super.draw(ctx);
    }
  }

  class Ally extends Fighter {
    constructor(x, y, opts) {
      super(x, y, 36, 64, Object.assign({ kind: 'ally', hp: 999, maxHp: 999, animId: 'sung-jin-woo', drawW: 64, drawH: 64 }, opts));
      this.life = opts.life || 15;
      this.attackTimer = 0.5;
      this.attackRange = opts.attackRange || 50;
      this.attackCd = opts.attackCd || 0.7;
      this.attackStyle = opts.attackStyle || 'slash';
      this.moveSpeed = opts.moveSpeed || 210;
      this.damageMult = opts.damageMult || 0.7;
      this.allyColor = opts.color || '#9a6cff';
      this.lifesteal = opts.lifesteal || 0;
      this.applySlow = opts.slow || 0;
      this.stunChance = opts.stunChance || 0;
      this.afterimageTimer = 0;
      this.shadowId = opts.shadowId || null;
      this.shadowLevel = opts.shadowLevel || 0;
    }

    update(dt, level, game) {
      this.tickTimers(dt);
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        this.deathTimer = 0.3;
        Effects.spawnParticles(this.x + this.w / 2, this.y + this.h / 2, '#9a6cff', 16, { speed: 180, life: 0.6, glow: true });
        return;
      }
      this.attackTimer -= dt;
      const p = game.player;
      let target = null, best = 1e9;
      for (const m of game.monsters) {
        if (m.dead) continue;
        const d = Math.abs((m.x + m.w / 2) - (this.x + this.w / 2));
        if (d < best) { best = d; target = m; }
      }
      if (target) {
        const dx = (target.x + target.w / 2) - (this.x + this.w / 2);
        this.face = dx > 0 ? 1 : -1;
        if (Math.abs(dx) > this.attackRange) {
          this.vx = this.face * this.moveSpeed;
        } else {
          this.vx = 0;
          if (this.attackTimer <= 0) {
            this.attackTimer = this.attackCd;
            this.attackAnimTimer = 0.22;
            const dmg = window.Formulas.damage(this.atk, target.def, this.damageMult);
            if (this.attackStyle === 'projectile') {
              Effects.projectile({
                x: this.x + this.w / 2, y: this.y + this.h * 0.35,
                vx: this.face * 560, vy: -12, r: 7,
                damage: dmg, owner: 'ally', color: this.allyColor,
                life: 1.5, slow: this.applySlow
              });
              Effects.spawnParticles(this.x + this.w / 2, this.y + this.h * 0.3, this.allyColor, 5, {
                speed: 70, up: 30, life: 0.3, glow: true
              });
            } else {
              const hits = this.attackStyle === 'multi' ? 2 : 1;
              for (let h = 0; h < hits; h++) {
                const hitDmg = h === 0 ? dmg : Math.round(dmg * 0.8);
                const stun = this.stunChance && Math.random() < this.stunChance ? 0.3 : 0;
                game.damageMonster(target, hitDmg, {
                  source: 'ally', color: this.allyColor, stun
                });
                Effects.slash({
                  x: this.x + this.w / 2, y: this.y + this.h * 0.45,
                  r: this.attackStyle === 'multi' ? 54 : 44, face: this.face,
                  life: 0.16, color: this.allyColor, width: this.attackStyle === 'multi' ? 4 : 3
                });
              }
              if (this.applySlow) target.slowTimer = Math.max(target.slowTimer || 0, this.applySlow);
              if (this.lifesteal > 0 && dmg > 0 && p) {
                const heal = Math.round(dmg * this.lifesteal);
                if (heal > 0) {
                  p.hp = Math.min(p.maxHp, p.hp + heal);
                  Effects.text(p.x + p.w / 2, p.y - 6, '+' + heal, { color: '#6aff9a', size: 9, life: 0.5 });
                }
              }
            }
          }
        }
      } else if (p) {
        const dx = (p.x + p.w / 2) - (this.x + this.w / 2);
        if (Math.abs(dx) > 90) { this.vx = Math.sign(dx) * this.moveSpeed; this.face = Math.sign(dx); }
        else this.vx = 0;
      }
      this.afterimageTimer -= dt;
      if (this.afterimageTimer <= 0) {
        this.afterimageTimer = 0.12;
        Effects.afterimage({
          sheet: this.sheet, col: this.animFrame, row: ROW[this.animState] || 0,
          x: this.getDrawX(), y: this.getDrawY(), w: this.drawW, h: this.drawH, face: this.face, life: 0.25, color: this.allyColor
        });
      }
      this.physics(dt, level);
      this.updateAnimation(dt);
    }

    draw(ctx) {
      this.drawShadow(ctx);
      const bob = this.onGround ? Math.sin(this.animT * 8) * 1.2 : 0;
      ctx.save();
      ctx.globalAlpha = 0.55;
      const row = ROW[this.animState] || 0;
      if (this.sheet && this.sheet.ok) {
        Engine.drawFrame(this.sheet, this.animFrame, row, this.getDrawX(), this.getDrawY() + bob, this.drawW, this.drawH, this.face < 0, 0.8);
      } else {
        ctx.fillStyle = '#5d4bff';
        ctx.fillRect(this.getDrawX(), this.getDrawY() + bob, this.drawW, this.drawH);
      }
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = this.allyColor;
      ctx.fillRect(this.getDrawX() - 3, this.getDrawY() + bob - 3, this.drawW + 6, this.drawH + 6);
      ctx.restore();
      if (Math.random() < 0.12) {
        Effects.spawnParticles(this.x + Math.random() * this.w, this.y + this.h, this.allyColor, 1, {
          speed: 20, life: 0.5, gravity: -40, size: 2, glow: true
        });
      }
    }
  }

  window.GameActors = { Fighter, Player, Monster, Npc, Ally, ROW };
})();
