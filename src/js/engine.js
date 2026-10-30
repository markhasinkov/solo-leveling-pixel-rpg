// engine.js — ядро: канвас, ввод (клавиши + виртуальные кнопки), камера,
// спрайты и анимационные листы, hit-stop, игровой цикл.
(function () {
  'use strict';

  const CANVAS_W = 960;
  const CANVAS_H = 540;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ---------- Кэш изображений ----------
  const spriteCache = new Map();
  function getSprite(src, fallbackColor, w, h) {
    if (spriteCache.has(src)) return spriteCache.get(src);
    const handle = { src, img: null, ok: false, color: fallbackColor || '#c0c', w: w || 32, h: h || 32 };
    spriteCache.set(src, handle);
    const image = new Image();
    image.onload = () => { handle.img = image; handle.ok = true; };
    image.onerror = () => { handle.ok = false; };
    image.src = src;
    return handle;
  }

  // Анимационный лист: frameW x frameH, cols x rows
  function getSheet(src, frameW, frameH, cols, rows, fallbackColor) {
    const key = 'sheet:' + src;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const handle = {
      src, img: null, ok: false, cols, rows,
      frameW: frameW || 32, frameH: frameH || 32,
      color: fallbackColor || '#8a6cff'
    };
    spriteCache.set(key, handle);
    const image = new Image();
    image.onload = () => { handle.img = image; handle.ok = true; };
    image.onerror = () => { handle.ok = false; };
    image.src = src;
    return handle;
  }

  function drawSprite(handle, x, y, w, h, flip, alpha) {
    if (!handle) return;
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    if (handle.img) {
      if (flip) {
        ctx.translate(x + w, y); ctx.scale(-1, 1);
        ctx.drawImage(handle.img, 0, 0, w, h);
      } else {
        ctx.drawImage(handle.img, x, y, w, h);
      }
    } else {
      ctx.fillStyle = handle.color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, y, w, Math.max(2, h / 8));
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
    ctx.restore();
  }

  function drawFrame(sheet, col, row, x, y, w, h, flip, alpha) {
    if (!sheet) return;
    if (!sheet.img || !sheet.ok) {
      // Фолбэк до загрузки листа
      ctx.save();
      if (alpha != null) ctx.globalAlpha = alpha;
      ctx.fillStyle = sheet.color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x, y, w, Math.max(2, h / 8));
      ctx.restore();
      return;
    }
    const fw = sheet.frameW, fh = sheet.frameH;
    const sx = (col % sheet.cols) * fw;
    const sy = (row % sheet.rows) * fh;
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(x + w, y); ctx.scale(-1, 1);
      ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, w, h);
    } else {
      ctx.drawImage(sheet.img, sx, sy, fw, fh, x, y, w, h);
    }
    ctx.restore();
  }

  // ---------- Ввод: действия, а не клавиши ----------
  const BINDINGS = {
    left: ['a', 'arrowleft'],
    right: ['d', 'arrowright'],
    jump: ['w', 'arrowup', ' '],
    down: ['s', 'arrowdown'],
    attack: ['j', 'x'],
    dodge: ['shift', 'k'],
    interact: ['e'],
    skill1: ['1'], skill2: ['2'], skill3: ['3'], skill4: ['4'], skill5: ['5'],
    potion: ['h'],
    inventory: ['i'],
    talents: ['t'],
    quests: ['q'],
    shadows: ['y'],
    hub: ['g'],
    pause: ['escape'],
    map: ['m']
  };

  const Input = {
    keys: new Set(),
    pressed: new Set(),
    virtualHeld: new Set(),
    virtualPressed: new Set(),
    moveX: 0,
    touchMode: false,
    wheelDelta: 0,
    mouse: {
      screenX: CANVAS_W / 2,
      screenY: CANVAS_H / 2,
      worldX: 0,
      worldY: 0,
      overCanvas: false,
      active: false,
      left: false,
      right: false,
      leftPressed: false,
      rightPressed: false
    },

    init() {
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (!this.keys.has(k)) this.pressed.add(k);
        this.keys.add(k);
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.clear());

      window.addEventListener('pointermove', (e) => this.updatePointer(e));
      window.addEventListener('pointerup', (e) => {
        if (e.button === 0) this.mouse.left = false;
        if (e.button === 2) this.mouse.right = false;
      });
      window.addEventListener('pointercancel', () => {
        this.mouse.left = false;
        this.mouse.right = false;
      });
      canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        this.updatePointer(e);
        if (e.button === 0) {
          this.mouse.left = true;
          this.mouse.leftPressed = true;
        } else if (e.button === 2) {
          this.mouse.right = true;
          this.mouse.rightPressed = true;
        }
        e.preventDefault();
      });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('pointerleave', () => {
        this.mouse.overCanvas = false;
        this.mouse.active = false;
      });
      canvas.addEventListener('wheel', (e) => {
        this.wheelDelta += e.deltaY > 0 ? 1 : -1;
        e.preventDefault();
      }, { passive: false });
    },

    updatePointer(e) {
      if (e.pointerType === 'touch') {
        this.mouse.overCanvas = false;
        this.mouse.active = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width * CANVAS_W;
      const y = (e.clientY - rect.top) / rect.height * CANVAS_H;
      const inside = x >= 0 && x <= CANVAS_W && y >= 0 && y <= CANVAS_H;
      this.mouse.screenX = Math.max(0, Math.min(CANVAS_W, x));
      this.mouse.screenY = Math.max(0, Math.min(CANVAS_H, y));
      this.mouse.overCanvas = inside && e.target === canvas;
      this.mouse.active = this.mouse.overCanvas;
      if (inside) {
        this.mouse.worldX = x + Camera.x;
        this.mouse.worldY = y + Camera.y;
      }
    },

    mouseWorld() {
      return {
        x: this.mouse.screenX + Camera.x,
        y: this.mouse.screenY + Camera.y
      };
    },

    consumeWheel() {
      const d = this.wheelDelta;
      this.wheelDelta = 0;
      return d;
    },

    clear() {
      this.keys.clear();
      this.pressed.clear();
      this.virtualHeld.clear();
      this.virtualPressed.clear();
      this.moveX = 0;
      this.mouse.left = false;
      this.mouse.right = false;
      this.mouse.overCanvas = false;
      this.mouse.active = false;
      this.wheelDelta = 0;
    },

    down() {
      for (let i = 0; i < arguments.length; i++) if (this.keys.has(arguments[i])) return true;
      return false;
    },

    hit() {
      for (let i = 0; i < arguments.length; i++) if (this.pressed.has(arguments[i])) return true;
      return false;
    },

    isBound(action, bound, virtualSet) {
      const list = BINDINGS[action] || [];
      for (let i = 0; i < list.length; i++) if (bound.has(list[i])) return true;
      return false;
    },

    action(name) {
      if (this.virtualHeld.has(name)) return true;
      if (name === 'attack' && this.mouse.overCanvas && this.mouse.left) return true;
      return this.isBound(name, this.keys);
    },

    actionHit(name) {
      if (this.virtualPressed.has(name)) return true;
      if (name === 'attack' && this.mouse.overCanvas && this.mouse.leftPressed) return true;
      return this.isBound(name, this.pressed);
    },

    axisX() {
      const l = this.action('left'), r = this.action('right');
      const keyAxis = (r ? 1 : 0) - (l ? 1 : 0);
      if (this.touchMode && this.moveX !== 0) return this.moveX;
      return keyAxis;
    },

    setVirtual(name, down) {
      if (down) {
        if (!this.virtualHeld.has(name)) this.virtualPressed.add(name);
        this.virtualHeld.add(name);
      } else {
        this.virtualHeld.delete(name);
      }
    },

    endFrame() {
      this.pressed.clear();
      this.virtualPressed.clear();
      this.mouse.leftPressed = false;
      this.mouse.rightPressed = false;
      this.wheelDelta = 0;
    }
  };

  // ---------- Камера с затухающей тряской (trauma) ----------
  const Camera = {
    x: 0, y: 0,
    trauma: 0,
    enabled: true,
    shakeX: 0, shakeY: 0,
    _t: 0,
    lookAhead: 0,

    follow(target, worldW, worldH, dt) {
      dt = dt || 1 / 60;
      const desiredLook = target.face * 42;
      this.lookAhead += (desiredLook - this.lookAhead) * Math.min(1, dt * 3);
      let tx = target.x + target.w / 2 - CANVAS_W / 2 + this.lookAhead;
      let ty = target.y + target.h / 2 - CANVAS_H / 2 - 24;
      tx = Math.max(0, Math.min(tx, Math.max(0, worldW - CANVAS_W)));
      ty = Math.max(0, Math.min(ty, Math.max(0, worldH - CANVAS_H)));
      this.x += (tx - this.x) * Math.min(1, dt * 7);
      this.y += (ty - this.y) * Math.min(1, dt * 7);
    },

    snap(target, worldW, worldH) {
      this.x = Math.max(0, Math.min(target.x + target.w / 2 - CANVAS_W / 2, worldW - CANVAS_W));
      this.y = Math.max(0, Math.min(target.y + target.h / 2 - CANVAS_H / 2, worldH - CANVAS_H));
    },

    addTrauma(v) {
      if (!this.enabled) return;
      this.trauma = Math.min(1, this.trauma + v);
    },

    update(dt) {
      if (this.trauma <= 0) {
        this.shakeX = 0; this.shakeY = 0;
        return;
      }
      this.trauma = Math.max(0, this.trauma - dt * 1.25);
      const s = this.trauma * this.trauma;
      this._t += dt * 28;
      this.shakeX = 13 * s * Math.sin(this._t * 1.7);
      this.shakeY = 9 * s * Math.sin(this._t * 2.3 + 1.1);
    }
  };

  // ---------- Hit-stop ----------
  let hitStopLeft = 0;
  function hitStop(seconds) {
    hitStopLeft = Math.max(hitStopLeft, seconds || 0.05);
  }
  function clearHitStop() { hitStopLeft = 0; }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // ---------- Игровой цикл с самовосстановлением ----------
  let loopGen = 0;
  let loopState = null;
  let watchdog = null;

  function startLoop(update, render) {
    const gen = ++loopGen;
    const state = {
      update, render,
      last: performance.now(),
      lastFrameAt: performance.now()
    };
    loopState = state;

    function frame(now) {
      if (gen !== loopGen) return;
      const raw = Math.max(0, Math.min(0.05, (now - state.last) / 1000));
      state.last = now;
      state.lastFrameAt = performance.now();
      let dt = raw;
      if (hitStopLeft > 0) {
        hitStopLeft = Math.max(0, hitStopLeft - raw);
        dt = 0;
      }
      update(dt, raw);
      render(raw);
      Input.endFrame();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Если вкладка/вебвью «потеряла» кадр (фон, троттлинг, Telegram),
    // цикл оживает сам, а не замирает навсегда.
    if (!watchdog && typeof setInterval === 'function') {
      watchdog = setInterval(() => {
        if (!loopState) return;
        if (performance.now() - loopState.lastFrameAt > 1500) {
          startLoop(loopState.update, loopState.render);
        }
      }, 1000);
    }
  }

  window.Engine = {
    CANVAS_W, CANVAS_H, canvas, ctx,
    Input, getSprite, getSheet, drawSprite, drawFrame, Camera,
    mulberry32, startLoop, hitStop, clamp, lerp, easeOutCubic, clearHitStop,
    get hitStopLeft() { return hitStopLeft; }
  };
  window.Camera = Camera;
})();
