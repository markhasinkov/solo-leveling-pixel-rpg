'use strict';

(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = Engine.ctx;
  const CW = Engine.CANVAS_W;
  const CH = Engine.CANVAS_H;
  const FLOOR = 456;
  const CENTER = 480;

  // Effects.update ожидает игровой контекст; сам полигон эффектов его не имеет.
  const game = { monsters: [], player: null, world: null };

  const PALETTES = {
    shadow: { name: 'Тень', colors: ['#241232', '#5d3a9e', '#a06cff', '#e0d0ff'] },
    blood: { name: 'Кровь', colors: ['#2a0a0e', '#6a1018', '#ff4a5a', '#ffd0d0'] },
    ice: { name: 'Лёд', colors: ['#173244', '#3c7188', '#8fdcff', '#eafaff'] },
    acid: { name: 'Кислота', colors: ['#142412', '#3a6424', '#8fef6a', '#e8ffc0'] },
    gold: { name: 'Золото', colors: ['#2e2410', '#7a5a1e', '#e8c76a', '#fff0b0'] },
    fire: { name: 'Огонь', colors: ['#2e0c08', '#8a2414', '#ff6a3c', '#ffe0a0'] }
  };

  const EFFECTS = [
    {
      id: 'dash', name: 'Рывок / мерцание', duration: 1.8,
      variants: [
        { id: 'shadow', name: 'Тень', play: playDashShadow },
        { id: 'blink', name: 'Световой блинк', play: playDashBlink },
        { id: 'rift', name: 'Разлом', play: playDashRift }
      ]
    },
    {
      id: 'impact', name: 'Удар / финишер', duration: 1.35,
      variants: [
        { id: 'slash', name: 'Разрез', play: playImpactSlash },
        { id: 'heavy', name: 'Тяжёлый удар', play: playImpactHeavy },
        { id: 'finisher', name: 'Финишер', play: playImpactFinisher }
      ]
    },
    {
      id: 'rain', name: 'Дождь / шторм', duration: 2.6,
      variants: [
        { id: 'storm', name: 'Шторм', play: playRainStorm },
        { id: 'drizzle', name: 'Морось', play: playRainDrizzle },
        { id: 'acid', name: 'Кислотный дождь', play: playRainAcid }
      ]
    },
    {
      id: 'ice', name: 'Лёд / осколки', duration: 2.2,
      variants: [
        { id: 'spikes', name: 'Шипы', play: playIceSpikes },
        { id: 'nova', name: 'Морозная нова', play: playIceNova },
        { id: 'shatter', name: 'Раскол', play: playIceShatter }
      ]
    },
    {
      id: 'blackhole', name: 'Гравитационная воронка', duration: 2.8,
      variants: [
        { id: 'well', name: 'Колодец', play: playBlackWell },
        { id: 'collapse', name: 'Схлопывание', play: playBlackCollapse },
        { id: 'disk', name: 'Аккреционный диск', play: playBlackDisk }
      ]
    },
    {
      id: 'summon', name: 'Призыв / печать', duration: 2.0,
      variants: [
        { id: 'army', name: 'Армия теней', play: playSummonArmy },
        { id: 'crown', name: 'Корона', play: playSummonCrown },
        { id: 'gate', name: 'Врата', play: playSummonGate }
      ]
    }
  ];

  let currentEffect = EFFECTS[0];
  let currentVariant = currentEffect.variants[0];
  let elapsed = 0;
  let duration = currentEffect.duration;
  let last = performance.now();
  let loop = true;
  let speed = 1;
  let grid = false;
  let bg = 'cave';
  let eco = false;
  let statusTimer = null;
  let fpsAvg = 60;
  let statClock = 0;

  const $ = (id) => document.getElementById(id);
  const effectSelect = $('effect');
  const variantsBox = $('variants');
  const stats = $('stats');
  const status = $('status');
  const loopCheck = $('loop');
  const speedSelect = $('speed');
  const bgSelect = $('bg');

  function setStatus(text) {
    status.textContent = text || '';
    clearTimeout(statusTimer);
    if (text) statusTimer = setTimeout(() => { status.textContent = ''; }, 2600);
  }

  function makeFilename(ext) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return 'fx-' + currentEffect.id + '-' + currentVariant.id + '-' + stamp + '.' + ext;
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---------- Реквизит ----------
  function slash(x, y, color, r, life, width, face) {
    Effects.slash({ x, y, r, life, width, color, face: face || 1 });
  }

  function shards(x, y, color, count, opts) {
    Effects.spawnParticles(x, y, color, count, Object.assign({
      shape: 'square', speed: 190, up: 150, life: 0.65, size: 2.2, gravity: 720, drag: 0.4
    }, opts || {}));
  }

  function mote(x, y, color, count, opts) {
    Effects.spawnParticles(x, y, color, count, Object.assign({
      shape: 'circle', speed: 90, up: 20, life: 1.1, size: 2, gravity: -20, drag: 1.4, glow: true
    }, opts || {}));
  }

  // ---------- Варианты ----------
  function playDashShadow() {
    const x = CENTER;
    const y = FLOOR - 40;
    Effects.pool({ x, y: FLOOR - 6, r: 62, life: 0.8, color: '#3a1e68' });
    Effects.sigil({ x, y: FLOOR - 4, r: 54, life: 0.55, color: '#a06cff', mode: 'rune' });
    Effects.ring({ x, y, r0: 8, maxR: 90, life: 0.42, color: '#a06cff', width: 4 });
    Effects.shadowBurst(x, y, 'rgba(40,18,70,0.85)', 18, { spread: 30, speed: 170, up: 150, life: 0.9, size: 8 });
    mote(x, y, '#c8a6ff', 16, { speed: 130, life: 0.7 });
    for (let i = 0; i < 4; i++) {
      Effects.timer(i * 0.06, () => {
        Effects.pool({ x: x + 28 + i * 36, y: FLOOR - 5, r: 42, life: 0.45, color: '#5d3a9e' });
        Effects.ring({ x: x + 28 + i * 36, y: y - 12, r0: 4, maxR: 44, life: 0.3, color: '#a06cff', width: 2 });
      });
    }
    Effects.timer(0.22, () => {
      slash(x + 150, y - 18, '#e0d0ff', 70, 0.25, 5, 1);
      Effects.flash('#8a5cff', 0.12, 0.1);
      Effects.ring({ x: x + 150, y: y - 18, r0: 10, maxR: 100, life: 0.35, color: '#a06cff', width: 4 });
    });
  }

  function playDashBlink() {
    const x = CENTER;
    const y = FLOOR - 40;
    Effects.sigil({ x, y: FLOOR - 4, r: 62, life: 0.7, color: '#8fdcff', mode: 'rune' });
    Effects.ring({ x, y, r0: 10, maxR: 130, life: 0.35, color: '#d8f4ff', width: 3 });
    mote(x, y, '#eafaff', 30, { speed: 220, life: 0.45, size: 2 });
    Effects.flash('#d8f4ff', 0.18, 0.08);
    Effects.timer(0.14, () => {
      const tx = x + 180;
      Effects.sigil({ x: tx, y: FLOOR - 4, r: 72, life: 0.65, color: '#8fdcff', mode: 'rune' });
      Effects.ring({ x: tx, y, r0: 12, maxR: 150, life: 0.4, color: '#ffffff', width: 3 });
      mote(tx, y, '#eafaff', 24, { speed: 180, life: 0.5, size: 2 });
      slash(tx, y - 20, '#eafaff', 76, 0.2, 4, 1);
    });
  }

  function playDashRift() {
    const x = CENTER;
    const y = FLOOR - 38;
    Effects.pool({ x, y: FLOOR - 6, r: 82, life: 1.0, color: '#2a1640' });
    Effects.crack({ x, y: FLOOR - 6, length: 130, color: '#a06cff', seed: 7 });
    Effects.sigil({ x, y: FLOOR - 4, r: 74, life: 0.9, color: '#d66cff', mode: 'rune' });
    Effects.shadowBurst(x, y, 'rgba(22,10,40,0.9)', 22, { spread: 42, speed: 220, up: 180, life: 1.0, size: 9 });
    for (let i = 0; i < 3; i++) {
      Effects.timer(0.12 + i * 0.1, () => {
        slash(x + 60 + i * 36, y - 22 - i * 12, '#c8a6ff', 90 - i * 8, 0.26, 5 - i, 1);
        Effects.ring({ x: x + 60 + i * 36, y: y - 10, r0: 6, maxR: 80, life: 0.32, color: '#d66cff', width: 2 });
      });
    }
    Effects.timer(0.5, () => {
      Effects.flash('#a06cff', 0.1, 0.12);
      shards(x + 150, FLOOR - 20, '#a06cff', 12, { speed: 160, up: 100, size: 2 });
    });
  }

  function playImpactSlash() {
    const x = CENTER;
    const y = FLOOR - 48;
    slash(x, y, '#eafaff', 84, 0.22, 6, 1);
    Effects.ring({ x, y, r0: 8, maxR: 110, life: 0.3, color: '#bfe6ff', width: 3 });
    Effects.spawnParticles(x + 40, y, '#eafaff', 22, { speed: 230, up: 110, life: 0.5, size: 2, glow: true });
    Effects.timer(0.05, () => {
      Effects.crack({ x, y: FLOOR - 4, length: 110, color: '#bfe6ff', seed: 4 });
      Effects.flash('#d8f4ff', 0.12, 0.06);
    });
  }

  function playImpactHeavy() {
    const x = CENTER;
    const y = FLOOR - 46;
    slash(x, y, '#ffd0d0', 96, 0.28, 8, 1);
    slash(x - 10, y - 10, '#ffffff', 70, 0.18, 3, -1);
    Effects.ring({ x, y, r0: 12, maxR: 150, life: 0.38, color: '#ff6a5a', width: 6 });
    Effects.crack({ x, y: FLOOR - 4, length: 160, color: '#ff6a5a', seed: 9 });
    shards(x + 60, y, '#ff9a8a', 26, { speed: 280, up: 190, life: 0.7, size: 3 });
    Effects.timer(0.08, () => {
      Effects.flash('#ff6a5a', 0.2, 0.1);
      Effects.spawnParticles(x, y, '#2a0a0e', 18, { shape: 'smoke', speed: 150, up: 80, life: 0.9, size: 12, gravity: -30 });
    });
  }

  function playImpactFinisher() {
    const x = CENTER;
    const y = FLOOR - 50;
    for (let i = 0; i < 3; i++) {
      Effects.timer(i * 0.045, () => {
        slash(x, y, ['#f4eaff', '#c8a6ff', '#ffd24a'][i], 100 - i * 12, 0.3, 7 - i, i % 2 ? -1 : 1);
        Effects.ring({ x, y, r0: 10, maxR: 120 + i * 25, life: 0.36, color: ['#e8d8ff', '#a06cff', '#ffd24a'][i], width: 3 });
      });
    }
    Effects.crack({ x, y: FLOOR - 4, length: 150, color: '#ffd24a', seed: 12 });
    Effects.text(x, y - 56, 'ФИНИШЕР', { color: '#ffd24a', size: 16, life: 0.8 });
    shards(x + 80, y, '#ffd24a', 30, { speed: 300, up: 230, life: 0.8, size: 3 });
    Effects.timer(0.18, () => Effects.flash('#ffd24a', 0.2, 0.12));
  }

  function makeRain(color, count, speed, life, mistColor) {
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * 840;
      Effects.spawnParticles(x, -20, color, 1, {
        shape: 'square', angle: Math.PI / 2, spread: 0.04, speed: speed || 0,
        up: 0, gravity: 720, drag: 0, life: life || (0.6 + Math.random() * 0.4),
        size: 1.4, spreadX: 1, spreadY: 2
      });
    }
    for (let i = 0; i < 7; i++) {
      Effects.timer(0.06 + i * 0.11, () => {
        const x = 70 + Math.random() * 820;
        Effects.ring({ x, y: FLOOR - 4, r0: 2, maxR: 20, life: 0.28, color: color, width: 1 });
        Effects.spawnParticles(x, FLOOR - 8, color, 3, { shape: 'square', speed: 70, up: 50, gravity: 250, life: 0.3, size: 1.4 });
      });
    }
    Effects.spawnParticles(CENTER, FLOOR - 20, mistColor || 'rgba(160,200,230,0.4)', 8, {
      shape: 'smoke', speed: 35, up: 0, gravity: -8, drag: 1, life: 1.8, size: 22
    });
  }

  function playRainStorm() {
    makeRain('#b8e4ff', 44, 0, 0.7, 'rgba(150,190,230,0.35)');
    Effects.pool({ x: CENTER, y: FLOOR - 6, r: 180, life: 2.2, color: '#6a74b8' });
    Effects.timer(0.5, () => { Effects.flash('#bfe6f7', 0.08, 0.08); Effects.ring({ x: CENTER, y: FLOOR - 8, r0: 20, maxR: 180, life: 0.5, color: '#bfe6f7', width: 2 }); });
    Effects.timer(1.1, () => Effects.flash('#bfe6f7', 0.06, 0.08));
  }

  function playRainDrizzle() {
    makeRain('#9fc8e8', 22, 0, 0.9, 'rgba(120,160,200,0.25)');
    Effects.spawnParticles(CENTER, FLOOR - 40, 'rgba(160,200,230,0.3)', 10, { shape: 'smoke', speed: 20, up: 0, gravity: -4, life: 2.2, size: 16 });
  }

  function playRainAcid() {
    makeRain('#b8ff6a', 34, 0, 0.7, 'rgba(100,180,60,0.35)');
    Effects.zone({ x: CENTER, y: FLOOR - 8, r: 170, life: 1.8, dps: 0, slow: 0, owner: 'enemy', color: '#8fef6a' });
    Effects.timer(0.3, () => Effects.text(CENTER, FLOOR - 120, 'КИСЛОТА', { color: '#b8ff6a', size: 13, life: 1 }));
  }

  function playIceSpikes() {
    const x = CENTER;
    Effects.crack({ x, y: FLOOR - 4, length: 180, color: '#bfe6f7', seed: 13 });
    Effects.pool({ x, y: FLOOR - 6, r: 130, life: 1.2, color: '#3c7188' });
    Effects.ring({ x, y: FLOOR - 6, r0: 20, maxR: 190, life: 0.55, color: '#8fdcff', width: 4 });
    for (let i = 0; i < 5; i++) {
      Effects.timer(i * 0.08, () => {
        const sx = x - 150 + i * 75;
        Effects.spawnParticles(sx, FLOOR - 10, '#bfe6f7', 10, {
          shape: 'square', speed: 180, up: 280, gravity: 760, life: 0.7, size: 2.4
        });
        Effects.ring({ x: sx, y: FLOOR - 8, r0: 2, maxR: 30, life: 0.32, color: '#eafaff', width: 2 });
      });
    }
    Effects.timer(0.35, () => Effects.flash('#bfe6f7', 0.12, 0.1));
  }

  function playIceNova() {
    const x = CENTER;
    Effects.sigil({ x, y: FLOOR - 4, r: 120, life: 0.9, color: '#8fdcff', mode: 'rune' });
    Effects.ring({ x, y: FLOOR - 6, r0: 10, maxR: 250, life: 0.55, color: '#bfe6f7', width: 6 });
    Effects.ring({ x, y: FLOOR - 6, r0: 20, maxR: 190, life: 0.4, color: '#eafaff', width: 2 });
    Effects.spawnParticles(x, FLOOR - 12, '#d8f6ff', 36, { shape: 'square', speed: 260, up: 140, gravity: 520, life: 0.7, size: 2.2 });
    Effects.timer(0.1, () => Effects.flash('#bfe6f7', 0.16, 0.12));
  }

  function playIceShatter() {
    const x = CENTER;
    Effects.crack({ x, y: FLOOR - 4, length: 220, color: '#d8f6ff', seed: 21 });
    Effects.spawnParticles(x, FLOOR - 36, '#bfe6f7', 34, {
      shape: 'square', speed: 260, up: 180, gravity: 820, drag: 0.2, life: 0.9, size: 2.8
    });
    Effects.ring({ x, y: FLOOR - 6, r0: 20, maxR: 170, life: 0.6, color: '#eafaff', width: 3 });
    Effects.timer(0.15, () => Effects.flash('#d8f6ff', 0.13, 0.1));
    Effects.timer(0.45, () => shards(x, FLOOR - 20, '#eafaff', 12, { speed: 120, up: 110, size: 1.8 }));
  }

  function playBlackWell() {
    const x = CENTER;
    const y = FLOOR - 70;
    Effects.pool({ x, y: FLOOR - 6, r: 130, life: 2.2, color: '#201038' });
    Effects.sigil({ x, y: FLOOR - 4, r: 110, life: 1.6, color: '#8a5cff', mode: 'rune' });
    Effects.sigil({ x, y: y - 36, r: 48, life: 1.5, color: '#e0d0ff', mode: 'crown' });
    mote(x, y, '#c8a6ff', 40, { speed: 130, life: 1.8, size: 2.4 });
    for (let i = 0; i < 4; i++) {
      Effects.timer(0.16 + i * 0.18, () => {
        Effects.ring({ x, y, r0: 120 - i * 18, maxR: 60 - i * 8, life: 0.55, color: '#a06cff', width: 3 });
        Effects.spawnParticles(x, y, '#8a5cff', 8, { shape: 'circle', speed: 90, up: 35, gravity: 0, drag: 0.4, life: 0.7, size: 2, glow: true });
      });
    }
    Effects.timer(0.8, () => Effects.flash('#5d3bff', 0.1, 0.18));
  }

  function playBlackCollapse() {
    const x = CENTER;
    const y = FLOOR - 62;
    Effects.sigil({ x, y: FLOOR - 4, r: 120, life: 1.4, color: '#5d3bff', mode: 'rune' });
    for (let i = 0; i < 5; i++) {
      Effects.timer(i * 0.16, () => Effects.ring({ x, y, r0: 220 - i * 30, maxR: 24, life: 0.4, color: (i % 2 ? '#e0d0ff' : '#8a5cff'), width: 4 }));
    }
    Effects.spawnParticles(x, y, '#c8a6ff', 46, { shape: 'circle', speed: 180, up: 0, gravity: 0, drag: 0.25, life: 1.2, size: 2.2, glow: true });
    Effects.timer(0.9, () => {
      Effects.flash('#e0d0ff', 0.24, 0.16);
      Effects.ring({ x, y, r0: 20, maxR: 330, life: 0.5, color: '#e0d0ff', width: 2 });
    });
  }

  function playBlackDisk() {
    const x = CENTER;
    const y = FLOOR - 74;
    Effects.pool({ x, y: FLOOR - 6, r: 160, life: 2.3, color: '#241232' });
    Effects.sigil({ x, y: FLOOR - 4, r: 130, life: 1.5, color: '#8a5cff', mode: 'rune' });
    Effects.sigil({ x, y: y - 20, r: 46, life: 1.2, color: '#fff0b0', mode: 'crown' });
    for (let i = 0; i < 4; i++) {
      Effects.timer(i * 0.15, () => {
        Effects.ring({ x, y, r0: 40 + i * 20, maxR: 150 + i * 20, life: 0.8, color: ['#5d3bff', '#a06cff', '#e0d0ff', '#fff0b0'][i], width: 2 });
      });
    }
    Effects.spawnParticles(x, y, '#a06cff', 52, { shape: 'circle', speed: 160, up: 20, gravity: -12, drag: 0.9, life: 1.4, size: 2, glow: true });
    Effects.timer(0.45, () => Effects.text(x, y - 90, 'ГОРИЗОНТ СОБЫТИЙ', { color: '#e0d0ff', size: 12, life: 1.1 }));
  }

  function playSummonArmy() {
    const x = CENTER;
    Effects.pool({ x, y: FLOOR - 6, r: 180, life: 1.8, color: '#3a1e68' });
    Effects.sigil({ x, y: FLOOR - 4, r: 160, life: 1.5, color: '#a06cff', mode: 'rune' });
    Effects.sigil({ x, y: FLOOR - 74, r: 64, life: 1.2, color: '#f0e4ff', mode: 'crown' });
    Effects.ring({ x, y: FLOOR - 6, r0: 20, maxR: 220, life: 0.8, color: '#a06cff', width: 5 });
    Effects.shadowBurst(x, FLOOR - 20, 'rgba(18,8,34,0.9)', 28, { spread: 100, speed: 180, up: 200, life: 1.2, size: 10 });
    for (let i = 0; i < 3; i++) {
      Effects.timer(0.1 + i * 0.1, () => {
        const ax = x - 120 + i * 120;
        Effects.pool({ x: ax, y: FLOOR - 4, r: 54, life: 0.9, color: '#5d3a9e' });
        Effects.ring({ x: ax, y: FLOOR - 6, r0: 4, maxR: 70, life: 0.45, color: '#a06cff', width: 3 });
      });
    }
  }

  function playSummonCrown() {
    const x = CENTER;
    Effects.sigil({ x, y: FLOOR - 4, r: 90, life: 1.3, color: '#e8c76a', mode: 'rune' });
    Effects.sigil({ x, y: FLOOR - 92, r: 54, life: 1.2, color: '#fff0b0', mode: 'crown' });
    Effects.ring({ x, y: FLOOR - 8, r0: 12, maxR: 150, life: 0.55, color: '#e8c76a', width: 3 });
    mote(x, FLOOR - 90, '#fff0b0', 28, { speed: 100, up: 10, life: 1.2, size: 2, gravity: -10 });
    Effects.timer(0.3, () => Effects.flash('#e8c76a', 0.12, 0.1));
  }

  function playSummonGate() {
    const x = CENTER;
    Effects.sigil({ x, y: FLOOR - 4, r: 120, life: 1.3, color: '#5d3bff', mode: 'rune' });
    Effects.pool({ x, y: FLOOR - 6, r: 90, life: 1.5, color: '#241232' });
    Effects.ring({ x, y: FLOOR - 60, r0: 20, maxR: 100, life: 0.8, color: '#a06cff', width: 3 });
    Effects.spawnParticles(x, FLOOR - 60, '#c8a6ff', 34, { shape: 'circle', speed: 120, up: 30, gravity: -18, drag: 0.8, life: 1.3, size: 2.2 });
    Effects.timer(0.4, () => Effects.flash('#8a5cff', 0.1, 0.14));
  }

  // ---------- Сцена ----------
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    if (bg === 'ice') {
      g.addColorStop(0, '#102636'); g.addColorStop(0.6, '#173a4a'); g.addColorStop(1, '#071018');
    } else if (bg === 'throne') {
      g.addColorStop(0, '#1a0c2a'); g.addColorStop(0.6, '#241036'); g.addColorStop(1, '#08050e');
    } else {
      g.addColorStop(0, '#0b1420'); g.addColorStop(0.65, '#0d1d1a'); g.addColorStop(1, '#05070c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
    if (grid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(160,108,255,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
      for (let y = 0; y <= CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(5,7,12,0.35)';
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 250;
      ctx.fillRect(x, 70, 70, FLOOR - 70);
      ctx.fillStyle = 'rgba(160,108,255,0.05)';
      ctx.fillRect(x + 20, 100, 20, 150);
      ctx.fillStyle = 'rgba(5,7,12,0.35)';
    }
    ctx.fillStyle = '#101722';
    ctx.fillRect(0, FLOOR, CW, CH - FLOOR);
    ctx.fillStyle = 'rgba(160,108,255,0.18)';
    ctx.fillRect(0, FLOOR, CW, 1);
    // Силуэт героя для проверки читаемости.
    ctx.save();
    const heroX = CENTER;
    ctx.fillStyle = '#14101f';
    ctx.strokeStyle = 'rgba(200,166,255,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(heroX - 9, FLOOR - 50);
    ctx.lineTo(heroX + 9, FLOOR - 50);
    ctx.lineTo(heroX + 13, FLOOR - 34);
    ctx.lineTo(heroX + 10, FLOOR - 16);
    ctx.lineTo(heroX + 4, FLOOR - 16);
    ctx.lineTo(heroX + 3, FLOOR - 28);
    ctx.lineTo(heroX - 3, FLOOR - 28);
    ctx.lineTo(heroX - 4, FLOOR - 16);
    ctx.lineTo(heroX - 10, FLOOR - 16);
    ctx.lineTo(heroX - 13, FLOOR - 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1c162b';
    ctx.strokeStyle = 'rgba(200,166,255,0.32)';
    ctx.beginPath();
    ctx.arc(heroX, FLOOR - 60, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a2038';
    ctx.fillRect(heroX - 6, FLOOR - 64, 12, 4);
    ctx.strokeStyle = 'rgba(224,208,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(heroX + 13, FLOOR - 48);
    ctx.lineTo(heroX + 26, FLOOR - 62);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, CW, CH);
    drawBackground();
    Effects.renderUnder(ctx);
    Effects.renderOver(ctx);
    Effects.renderScreen(ctx);
  }

  // ---------- Управление ----------
  function rebuildVariants() {
    variantsBox.innerHTML = '';
    currentEffect.variants.forEach((variant, index) => {
      const b = document.createElement('button');
      b.className = 'btn' + (variant === currentVariant ? ' active' : '');
      b.textContent = (index + 1) + '. ' + variant.name;
      b.title = 'Вариант ' + (index + 1) + ': ' + variant.name;
      b.addEventListener('click', () => selectVariant(index));
      variantsBox.appendChild(b);
    });
  }

  function selectEffect(index, replayNow) {
    currentEffect = EFFECTS[Math.max(0, Math.min(EFFECTS.length - 1, index))];
    currentVariant = currentEffect.variants[0];
    duration = currentEffect.duration;
    effectSelect.value = String(EFFECTS.indexOf(currentEffect));
    rebuildVariants();
    if (replayNow !== false) replay();
    updateUrl();
  }

  function selectVariant(index, replayNow) {
    currentVariant = currentEffect.variants[Math.max(0, Math.min(currentEffect.variants.length - 1, index))];
    duration = currentVariant.duration || currentEffect.duration;
    rebuildVariants();
    if (replayNow !== false) replay();
    updateUrl();
  }

  function replay() {
    Effects.reset();
    elapsed = 0;
    last = performance.now();
    currentVariant.play();
    setStatus(currentEffect.name + ' · ' + currentVariant.name);
  }

  function updateUrl() {
    try {
      const params = new URLSearchParams();
      params.set('effect', currentEffect.id);
      params.set('variant', currentVariant.id);
      if (bg !== 'cave') params.set('bg', bg);
      if (eco) params.set('quality', 'eco');
      if (speed !== 1) params.set('speed', String(speed));
      history.replaceState(null, '', '?' + params.toString());
    } catch (e) { /* file:// */ }
  }

  function setEco(on) {
    eco = !!on;
    Effects.lowQuality = eco;
    Effects.qualityFactor = 1;
    Engine.setRenderScale(eco ? 0.65 : 1);
    $('quality').textContent = 'ГРАФИКА: ' + (eco ? 'ЭКОНОМНАЯ' : 'ВЫСОКАЯ');
    $('quality').classList.toggle('active', eco);
    replay();
    updateUrl();
  }

  function record() {
    if (!window.MediaRecorder || !canvas.captureStream) {
      setStatus('MediaRecorder недоступен — используйте PNG');
      return;
    }
    let stream;
    try {
      stream = canvas.captureStream(30);
      const supported = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = supported.find((type) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) || '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        download(blob, makeFilename('webm'));
        stream.getTracks().forEach((track) => track.stop());
        setStatus('Запись сохранена: docs/qa/fx/');
      };
      recorder.start();
      setStatus('Идёт запись 3 секунды…');
      setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 3000);
    } catch (e) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setStatus('Запись не удалась: ' + e.message);
    }
  }

  function savePng() {
    canvas.toBlob((blob) => {
      if (!blob) { setStatus('PNG не создан'); return; }
      download(blob, makeFilename('png'));
      setStatus('PNG сохранён');
    }, 'image/png');
  }

  function buildControls() {
    EFFECTS.forEach((effect, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = effect.name;
      effectSelect.appendChild(option);
    });
    effectSelect.addEventListener('change', () => selectEffect(Number(effectSelect.value)));
    $('replay').addEventListener('click', replay);
    loopCheck.addEventListener('change', () => { loop = loopCheck.checked; });
    speedSelect.addEventListener('change', () => { speed = Number(speedSelect.value) || 1; updateUrl(); });
    $('quality').addEventListener('click', () => setEco(!eco));
    bgSelect.addEventListener('change', () => {
      bg = bgSelect.value;
      updateUrl();
      draw();
    });
    $('grid').addEventListener('click', () => {
      grid = !grid;
      $('grid').classList.toggle('active', grid);
      draw();
    });
    $('record').addEventListener('click', record);
    $('png').addEventListener('click', savePng);

    // Палитра
    const palette = $('palette');
    Object.keys(PALETTES).forEach((key) => {
      const item = PALETTES[key];
      const box = document.createElement('div');
      box.className = 'swatch';
      const name = document.createElement('div');
      name.className = 'swatch-name';
      name.textContent = item.name;
      box.appendChild(name);
      const row = document.createElement('div');
      row.className = 'swatch-row';
      item.colors.forEach((color) => {
        const sw = document.createElement('span');
        sw.style.background = color;
        sw.title = color;
        row.appendChild(sw);
      });
      box.appendChild(row);
      palette.appendChild(box);
    });

    window.addEventListener('keydown', (event) => {
      if (event.target && /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === ' ') { event.preventDefault(); replay(); }
      else if (key >= '1' && key <= '9') selectVariant(Number(key) - 1);
      else if (key === 'q') setEco(!eco);
      else if (key === 'g') { grid = !grid; $('grid').classList.toggle('active', grid); draw(); }
      else if (key === 's') savePng();
      else if (key === 'r') record();
    });
  }

  function applyUrl() {
    const params = new URLSearchParams(location.search);
    const effect = EFFECTS.findIndex((item) => item.id === params.get('effect'));
    if (effect >= 0) currentEffect = EFFECTS[effect];
    const variant = currentEffect.variants.findIndex((item) => item.id === params.get('variant'));
    currentVariant = currentEffect.variants[Math.max(0, variant)];
    duration = currentVariant.duration || currentEffect.duration;
    bg = ['cave', 'ice', 'throne'].indexOf(params.get('bg')) >= 0 ? params.get('bg') : 'cave';
    bgSelect.value = bg;
    speed = Number(params.get('speed')) || 1;
    speedSelect.value = String(speed);
    effectSelect.value = String(EFFECTS.indexOf(currentEffect));
    if (params.get('quality') === 'eco') eco = true;
  }

  function frame(now) {
    const deltaMs = Math.max(0.1, Math.min(250, now - last));
    const raw = Math.min(0.05, deltaMs / 1000);
    last = now;
    const dt = raw * speed;
    Effects.update(dt, game);
    elapsed += dt;
    if (elapsed >= duration && loop) replay();
    draw();

    fpsAvg += (1000 / deltaMs - fpsAvg) * 0.08;
    statClock += deltaMs;
    if (statClock >= 240) {
      statClock = 0;
      const active = Effects.particles.length + Effects.projectiles.length +
        Effects.rings.length + Effects.sigils.length + Effects.slashes.length;
      stats.textContent = 'FPS ' + Math.round(fpsAvg) +
        ' · частиц ' + Effects.particles.length + ' · слоёв ' + active +
        ' · ' + (eco ? 'экономно' : 'высоко') +
        ' · ' + currentEffect.name + ' / ' + currentVariant.name;
    }
  }

  function boot() {
    buildControls();
    applyUrl();
    rebuildVariants();
    setEco(eco);

    function loopFrame(now) {
      frame(now);
      requestAnimationFrame(loopFrame);
    }
    requestAnimationFrame(loopFrame);
  }

  boot();
})();
