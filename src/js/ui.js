// ui.js — HUD, панели, древо талантов, журнал, тосты, миникарта, touch-управление.
(function () {
  'use strict';

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function img(src, cls, parent) {
    const i = document.createElement('img');
    i.src = src;
    i.className = cls || 'pixel-icon';
    i.draggable = false;
    if (parent) parent.appendChild(i);
    return i;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  const UI = {
    game: null,
    root: null,
    hud: null,
    hpFill: null,
    mpFill: null,
    xpFill: null,
    hpText: null,
    mpText: null,
    xpText: null,
    levelText: null,
    goldText: null,
    chapterText: null,
    tracker: null,
    hint: null,
    dialogBox: null,
    dialogPortrait: null,
    inventory: null,
    invBody: null,
    quest: null,
    questBody: null,
    shadowPanel: null,
    shadowBody: null,
    talents: null,
    talentBody: null,
    menu: null,
    chapterBanner: null,
    deathScreen: null,
    cutinLayer: null,
    cutinImg: null,
    cutinEyebrow: null,
    cutinName: null,
    cutinSub: null,
    cutinQuote: null,
    cinemaLayer: null,
    cinemaTitle: null,
    cinemaSub: null,
    bossBark: null,
    bossBarkName: null,
    bossBarkText: null,
    bossBar: null,
    bossFill: null,
    bossName: null,
    bossPhase: null,
    bossHpText: null,
    skillBar: null,
    skillSlots: [],
    potionBtn: null,
    potionCount: null,
    minimap: null,
    minimapCtx: null,
    toastStack: null,
    levelBanner: null,
    lowHp: null,
    touch: null,
    joystick: null,
    joystickKnob: null,
    invTab: 'items',
    questTab: 'main',
    _toasts: [],
    _lastHint: '',
    _scale: 1,
    _lastBossKey: '',
    _resetConfirm: false,

    init(game) {
      this.game = game;
      this.root = document.getElementById('ui-root');
      clear(this.root);

      this.panelBackdrop = el('div', 'panel-backdrop', this.root);
      this.panelBackdrop.style.display = 'none';
      this.panelBackdrop.addEventListener('click', () => this.closeAllPanels());

      this.buildHud();
      this.buildCombo();
      this.buildSidePanel();
      this.buildBossBar();
      this.buildBossCast();
      this.buildSkillBar();
      this.buildMinimap();
      this.buildHint();
      this.buildDialog();
      this.buildInventory();
      this.buildQuests();
      this.buildTalents();
      this.buildShadows();
      this.buildHub();
      this.buildMenu();
      this.buildBanners();
      this.buildZoneBanner();
      this.buildCinematics();
      this.buildToastStack();
      this.buildTouchControls();
      this.applyHandedness();

      this.lowHp = el('div', 'low-hp', this.root);
      this.lowHp.style.display = 'none';

      this.refreshTracker();
      this.applyScale();
      window.addEventListener('resize', () => this.applyScale());
      if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.applyScale());
      const rotBtn = document.getElementById('rotate-continue');
      if (rotBtn) {
        rotBtn.addEventListener('click', () => {
          this._portraitDismissed = true;
          const hint = document.getElementById('rotate-hint');
          if (hint) hint.classList.remove('show');
        });
      }
    },

    // ---------- HUD ----------
    buildHud() {
      const hud = el('div', 'ui-hud', this.root);
      this.hud = hud;

      const portrait = el('div', 'hud-portrait', hud);
      const pImg = img('assets/sprites/portraits/sung-jin-woo.png', 'portrait-img', portrait);
      pImg.style.imageRendering = 'pixelated';

      const vitals = el('div', 'hud-vitals', hud);
      const top = el('div', 'hud-topline', vitals);
      this.levelText = el('span', 'hud-level', top);
      this.goldText = el('span', 'hud-gold', top);

      const hpBar = el('div', 'bar hp-bar', vitals);
      this.hpFill = el('div', 'bar-fill hp-fill', hpBar);
      this.hpText = el('span', 'bar-text', hpBar);

      const mpBar = el('div', 'bar mp-bar', vitals);
      this.mpFill = el('div', 'bar-fill mp-fill', mpBar);
      this.mpText = el('span', 'bar-text', mpBar);

      const xpBar = el('div', 'bar xp-bar', vitals);
      this.xpFill = el('div', 'bar-fill xp-fill', xpBar);
      this.xpText = el('span', 'bar-text', xpBar);
    },

    buildCombo() {
      this.comboBadge = el('div', 'combo-badge', this.root);
      this.comboBadge.style.display = 'none';
      const main = el('div', 'combo-main', this.comboBadge);
      this.comboCount = el('span', 'combo-count', main);
      this.comboWord = el('span', 'combo-word', main);
      const pips = el('div', 'combo-pips', this.comboBadge);
      this.comboPips = [0, 1, 2].map(() => el('i', 'combo-pip', pips));
      const timer = el('div', 'combo-timer', this.comboBadge);
      this.comboFill = el('i', 'combo-fill', timer);
    },

    buildSidePanel() {
      const side = el('div', 'ui-side', this.root);
      const buttons = el('div', 'side-buttons', side);
      const defs = [
        { label: 'ИНВ', key: 'i', panel: 'inventory', title: 'Инвентарь (I)' },
        { label: 'ТАЛ', key: 't', panel: 'talents', title: 'Таланты (T)' },
        { label: 'КВ', key: 'q', panel: 'quests', title: 'Квесты (Q)' },
        { label: 'ТЕНИ', key: 'y', panel: 'shadows', title: 'Теневая армия (Y)' },
        { label: 'АХДЖИН', key: 'g', panel: 'hub', title: 'Гильдия Ахджин (G)' },
        { label: 'МЕНЮ', key: 'escape', panel: 'menu', title: 'Меню (Esc)' }
      ];
      defs.forEach((d) => {
        const b = el('button', 'side-btn', buttons);
        b.textContent = d.label;
        b.title = d.title;
        b.addEventListener('click', () => {
          AudioFX.play('ui');
          this.togglePanel(d.panel);
        });
      });
      this.chapterText = el('div', 'chapter-name', side);
      this.zoneText = el('div', 'zone-name-hud', side);
      this.tracker = el('div', 'quest-tracker', side);
    },

    buildBossBar() {
      const bar = el('div', 'boss-bar', this.root);
      bar.style.display = 'none';
      this.bossBar = bar;
      const nameRow = el('div', 'boss-name-row', bar);
      this.bossName = el('span', 'boss-name', nameRow);
      this.bossPhase = el('span', 'boss-phase', nameRow);
      const hp = el('div', 'bar boss-hp', bar);
      this.bossFill = el('div', 'bar-fill boss-fill', hp);
      this.bossHpText = el('span', 'bar-text', hp);
    },

    buildBossCast() {
      const cast = el('div', 'boss-cast', this.root);
      cast.style.display = 'none';
      this.bossCast = cast;
      const row = el('div', 'boss-cast-row', cast);
      this.bossCastType = el('span', 'boss-cast-type', row);
      this.bossCastName = el('span', 'boss-cast-name', row);
      const bar = el('div', 'boss-cast-bar', cast);
      this.bossCastFill = el('i', 'boss-cast-fill', bar);
    },

    showBossCast(name, windup, color, typeLabel) {
      if (!this.bossCast) return;
      this.bossCast.style.display = '';
      this.bossCast.style.setProperty('--boss-cast-color', color || '#ff6a5a');
      this.bossCastType.textContent = typeLabel || 'ЗАМАХ';
      this.bossCastName.textContent = name || 'Атака';
      this._bossCastDuration = Math.max(0.3, windup || 0.8);
      this._bossCastEnd = (window.Effects ? window.Effects.time : 0) + this._bossCastDuration;
      this._bossCastCues = this._bossCastDuration >= 0.8 ? [0.5, 0.82]
        : this._bossCastDuration >= 0.55 ? [0.78] : [];
      this._bossCastCueSounds = this._bossCastCues.map((_, i, all) =>
        i === all.length - 1 ? 'bossTickFinal' : 'bossTick');
      this._bossCastCueStep = 0;
      this.bossCastFill.style.width = '100%';
    },

    hideBossCast() {
      if (!this.bossCast) return;
      this.bossCast.style.display = 'none';
      this._bossCastEnd = 0;
      this._bossCastCues = null;
    },

    buildSkillBar() {
      const bar = el('div', 'skill-bar', this.root);
      this.skillBar = bar;
      const skills = (window.Combat.skills || []);
      const count = Math.max(5, skills.length);
      for (let i = 0; i < count; i++) {
        const skill = skills[i];
        const slot = el('button', 'skill-slot', bar);
        slot.dataset.slot = i;
        const key = el('span', 'skill-key', slot);
        key.textContent = skill ? skill.key : String(i + 1);
        if (skill) {
          img(skill.icon, 'skill-icon', slot);
          el('span', 'skill-cd', slot);
          el('span', 'skill-cost', slot).textContent = skill.mp;
          slot.dataset.lock = 'Ур.' + skill.unlock.level;
          slot.title = skill.name + ' — ' + skill.desc;
        } else {
          slot.classList.add('skill-empty');
        }
        slot.addEventListener('click', () => {
          if (!this.game) return;
          this.game.castSkillSlot(i);
        });
        this.skillSlots.push(slot);
      }
      const potion = el('button', 'skill-slot potion-slot', bar);
      potion.title = 'Выпить зелье лечения (H)';
      this.potionBtn = potion;
      el('span', 'skill-key', potion).textContent = 'H';
      const pImg = img('assets/sprites/icons/item-hp-potion-small.png', 'skill-icon', potion);
      pImg.alt = 'Зелье';
      this.potionCount = el('span', 'potion-count', potion);
      this.potionCount.textContent = '0';
      potion.addEventListener('click', () => { if (this.game) this.game.usePotion(); });
      this.setSelectedSkill(this.game.selectedSkill || 0);
    },

    setSelectedSkill(index) {
      for (let i = 0; i < this.skillSlots.length; i++) {
        this.skillSlots[i].classList.toggle('selected', i === index);
      }
    },

    buildMinimap() {
      const wrap = el('div', 'minimap-panel', this.root);
      this.minimap = document.createElement('canvas');
      this.minimap.width = 170;
      this.minimap.height = 64;
      this.minimap.className = 'minimap-canvas';
      wrap.appendChild(this.minimap);
      this.minimapCtx = this.minimap.getContext('2d');
    },

    buildHint() {
      this.hint = el('div', 'ui-hint', this.root);
      this.hint.textContent = '';
    },

    buildDialog() {
      this.dialogBox = el('div', 'ui-dialog', this.root);
      this.dialogBox.style.display = 'none';
      this.dialogPortrait = img('assets/sprites/portraits/sung-jin-woo.png', 'dlg-portrait', this.dialogBox);
      this.dlgSpeaker = el('div', 'dlg-speaker', this.dialogBox);
      this.dlgText = el('div', 'dlg-text', this.dialogBox);
      this.dlgPaging = el('div', 'dlg-paging', this.dialogBox);
    },

    // ---------- Панели ----------
    makePanel(cls, title) {
      const panel = el('div', cls, this.root);
      panel.style.display = 'none';
      const head = el('div', 'panel-header', panel);
      el('div', 'panel-title', head).textContent = title;
      const close = el('button', 'panel-close', head);
      close.textContent = '×';
      close.addEventListener('click', () => this.closeAllPanels());
      const body = el('div', 'panel-body', panel);
      return { panel, body };
    },

    buildInventory() {
      const made = this.makePanel('ui-inventory', 'ИНВЕНТАРЬ');
      this.inventory = made.panel;
      this.invBody = made.body;
      const tabs = el('div', 'panel-tabs', this.invBody);
      const defs = [
        { id: 'gear', label: 'Снаряжение' },
        { id: 'items', label: 'Предметы' },
        { id: 'shop', label: 'Лавка' }
      ];
      defs.forEach((d) => {
        const b = el('button', 'panel-tab', tabs);
        b.textContent = d.label;
        b.dataset.tab = d.id;
        b.addEventListener('click', () => {
          AudioFX.play('ui');
          this.invTab = d.id;
          this.renderInventory();
        });
      });
      this.invContent = el('div', 'inv-content', this.invBody);
      el('div', 'panel-tip', this.invBody).textContent = 'I — закрыть · клик по предмету — действие';
    },

    buildQuests() {
      const made = this.makePanel('ui-quest', 'ЖУРНАЛ ЗАДАНИЙ');
      this.quest = made.panel;
      this.questBody = made.body;
      const tabs = el('div', 'panel-tabs', this.questBody);
      const defs = [
        { id: 'main', label: 'Сюжет' },
        { id: 'side', label: 'Побочные' },
        { id: 'hidden', label: 'Скрытые' }
      ];
      defs.forEach((d) => {
        const b = el('button', 'panel-tab', tabs);
        b.textContent = d.label;
        b.dataset.tab = d.id;
        b.addEventListener('click', () => {
          AudioFX.play('ui');
          this.questTab = d.id;
          this.renderQuests();
        });
      });
      this.questContent = el('div', 'quest-content', this.questBody);
      this.questChapters = el('div', 'chapter-select', this.questBody);
      el('div', 'panel-tip', this.questBody).textContent = 'Q — закрыть · можно вернуться в пройденную главу';
    },

    buildTalents() {
      const made = this.makePanel('ui-talents', 'ДРЕВО ТАЛАНТОВ');
      this.talents = made.panel;
      this.talentBody = made.body;
      this.talentContent = el('div', 'talent-content', this.talentBody);
      el('div', 'panel-tip', this.talentBody).textContent = 'T — закрыть · 1 очко таланта за каждый уровень';
    },

    buildMenu() {
      const made = this.makePanel('ui-menu', 'МЕНЮ');
      this.menu = made.panel;
      const body = made.body;
      const list = el('div', 'menu-list', body);

      const sound = el('button', 'menu-row', list);
      this.menuSound = sound;
      sound.addEventListener('click', () => {
        this.game.toggleMute();
        this.refreshMenu();
        AudioFX.play('ui');
      });

      const shake = el('button', 'menu-row', list);
      this.menuShake = shake;
      shake.addEventListener('click', () => {
        this.game.toggleShake();
        this.refreshMenu();
        AudioFX.play('ui');
      });

      const shadow = el('button', 'menu-row', list);
      this.menuShadow = shadow;
      shadow.addEventListener('click', () => {
        this.toggleShadows();
        AudioFX.play('ui');
      });

      const hub = el('button', 'menu-row', list);
      this.menuHub = hub;
      hub.addEventListener('click', () => this.toggleHub());

      const touch = el('button', 'menu-row', list);
      this.menuTouch = touch;
      touch.addEventListener('click', () => {
        this.game.toggleTouchControls();
        this.refreshMenu();
      });

      const handed = el('button', 'menu-row', list);
      this.menuHanded = handed;
      handed.addEventListener('click', () => {
        this.game.toggleHandedness();
        this.refreshMenu();
        AudioFX.play('ui');
      });

      const full = el('button', 'menu-row', list);
      full.textContent = 'Полный экран';
      full.addEventListener('click', () => { if (window.TG) window.TG.fullscreen(); AudioFX.play('ui'); });

      const reset = el('button', 'menu-row danger', list);
      this.menuReset = reset;
      reset.textContent = 'Сбросить прогресс';
      reset.addEventListener('click', () => {
        if (!this._resetConfirm) {
          this._resetConfirm = true;
          reset.textContent = 'Нажмите ещё раз — прогресс будет удалён';
          setTimeout(() => { this._resetConfirm = false; this.refreshMenu(); }, 3000);
        } else {
          this._resetConfirm = false;
          this.game.resetProgress();
          this.closeAllPanels();
        }
      });

      el('div', 'menu-help', body).innerHTML =
        '<b>Управление · клавиатура и мышь</b><br>' +
        'A/D — движение, W — прыжок, S — быстрое падение<br>' +
        'Мышь — прицел, ЛКМ — удар (комбо из 3), ПКМ — умение<br>' +
        'Shift/K — рывок с неуязвимостью<br>' +
        'Колесо мыши — выбрать умение, 1–5 — применить напрямую<br>' +
        'E — взаимодействие, H — зелье, I — инвентарь<br>' +
        'T — таланты, Q — квесты, Y — теневые воины<br>' +
        'G — гильдия Ахджин, Esc — меню<br><br>' +
        '<b>Телефон</b><br>' +
        'Джойстик, кнопки удара/прыжка/E/H, лента умений. Играйте в landscape.';
      el('div', 'menu-credits', body).textContent = 'Solo Leveling — Pixel RPG · Telegram Mini App';

      this.menuContinue = el('button', 'pixel-btn menu-continue', body);
      this.menuContinue.textContent = 'Продолжить';
      this.menuContinue.addEventListener('click', () => this.closeAllPanels());
    },

    buildZoneBanner() {
      this.zoneBanner = el('div', 'zone-banner', this.root);
      this.zoneBanner.style.display = 'none';
    },

    showZoneBanner(name, subtitle) {
      const b = this.zoneBanner;
      if (!b) return;
      clear(b);
      el('div', 'zone-kicker', b).textContent = 'ЛОКАЦИЯ';
      el('div', 'zone-name', b).textContent = name || 'Локация';
      if (subtitle) el('div', 'zone-sub', b).textContent = subtitle;
      b.style.display = '';
      b.classList.remove('anim');
      void b.offsetWidth;
      b.classList.add('anim');
      clearTimeout(this._zt);
      this._zt = setTimeout(() => { b.style.display = 'none'; }, 3000);
    },

    // ---------- Кинематографическая подача ----------
    buildCinematics() {
      this.cinemaLayer = el('div', 'cinema-layer', this.root);
      this.cinemaLayer.style.display = 'none';
      const top = el('div', 'cinema-bar top', this.cinemaLayer);
      const caption = el('div', 'cinema-caption', top);
      el('div', 'cinema-kicker', caption).textContent = 'СЦЕНА';
      this.cinemaTitle = el('div', 'cinema-title', caption);
      this.cinemaSub = el('div', 'cinema-sub', caption);
      el('div', 'cinema-bar bottom', this.cinemaLayer);

      this.cutinLayer = el('div', 'cutin-layer', this.root);
      this.cutinLayer.style.display = 'none';
      const card = el('div', 'cutin-card', this.cutinLayer);
      this.cutinImg = img('assets/sprites/cutins/cutin_jinwoo.jpg', 'cutin-img', card);
      el('div', 'cutin-vignette', card);
      const plate = el('div', 'cutin-plate', card);
      this.cutinEyebrow = el('div', 'cutin-eyebrow', plate);
      this.cutinName = el('div', 'cutin-name', plate);
      this.cutinSub = el('div', 'cutin-sub', plate);
      this.cutinQuote = el('div', 'cutin-quote', plate);

      this.bossBark = el('div', 'boss-bark', this.root);
      this.bossBark.style.display = 'none';
      this.bossBarkName = el('div', 'boss-bark-name', this.bossBark);
      this.bossBarkText = el('div', 'boss-bark-text', this.bossBark);
    },

    showCutin(opts) {
      opts = opts || {};
      if (!this.cutinLayer) return;
      clearTimeout(this._cutinT);
      clearTimeout(this._cutinHideT);
      this.cutinLayer.classList.remove('out');
      if (opts.image) this.cutinImg.src = opts.image;
      this.cutinLayer.classList.toggle('boss', !!opts.boss);
      this.cutinEyebrow.textContent = opts.eyebrow || '';
      this.cutinEyebrow.style.display = opts.eyebrow ? '' : 'none';
      this.cutinName.textContent = opts.name || '';
      this.cutinSub.textContent = opts.subtitle || '';
      this.cutinSub.style.display = opts.subtitle ? '' : 'none';
      this.cutinQuote.textContent = opts.quote || '';
      this.cutinQuote.style.display = opts.quote ? '' : 'none';
      this.cutinLayer.style.display = '';
      this.cutinLayer.classList.remove('anim');
      void this.cutinLayer.offsetWidth;
      this.cutinLayer.classList.add('anim');
      if (this.root) this.root.classList.add('has-cutin');
      if (opts.duration) this._cutinT = setTimeout(() => this.hideCutin(), opts.duration);
    },

    hideCutin() {
      clearTimeout(this._cutinT);
      if (!this.cutinLayer || this.cutinLayer.style.display === 'none') {
        if (this.root) this.root.classList.remove('has-cutin');
        return;
      }
      this.cutinLayer.classList.remove('anim');
      this.cutinLayer.classList.add('out');
      clearTimeout(this._cutinHideT);
      this._cutinHideT = setTimeout(() => {
        this.cutinLayer.style.display = 'none';
        this.cutinLayer.classList.remove('out');
        if (this.root) this.root.classList.remove('has-cutin');
      }, 280);
    },

    showCinema(title, subtitle) {
      if (!this.cinemaLayer) return;
      this.cinemaTitle.textContent = title || '';
      this.cinemaSub.textContent = subtitle || '';
      this.cinemaSub.style.display = subtitle ? '' : 'none';
      this.cinemaLayer.style.display = '';
      this.cinemaLayer.classList.remove('anim');
      void this.cinemaLayer.offsetWidth;
      this.cinemaLayer.classList.add('anim');
      if (this.root) this.root.classList.add('cinematic');
    },

    hideCinema() {
      if (this.cinemaLayer) {
        this.cinemaLayer.style.display = 'none';
        this.cinemaLayer.classList.remove('anim');
      }
      if (this.root) this.root.classList.remove('cinematic');
    },

    showBossBark(name, text, opts) {
      opts = opts || {};
      if (!this.bossBark || !text) return;
      clearTimeout(this._barkT);
      this.bossBarkName.textContent = name || 'Босс';
      this.bossBarkText.textContent = text;
      this.bossBark.style.display = '';
      this.bossBark.classList.remove('anim');
      void this.bossBark.offsetWidth;
      this.bossBark.classList.add('anim');
      this._barkT = setTimeout(() => {
        this.bossBark.style.display = 'none';
        this.bossBark.classList.remove('anim');
      }, opts.duration || 3200);
    },

    buildBanners() {
      this.chapterBanner = el('div', 'chapter-banner', this.root);
      this.chapterBanner.style.display = 'none';

      this.levelBanner = el('div', 'level-banner', this.root);
      this.levelBanner.style.display = 'none';

      this.deathScreen = el('div', 'death-screen', this.root);
      this.deathScreen.style.display = 'none';
      el('div', 'panel-title', this.deathScreen).textContent = 'ВЫ ПАЛИ';
      this.deathStats = el('div', 'death-stats', this.deathScreen);
      const btn = el('button', 'pixel-btn', this.deathScreen);
      btn.textContent = 'Возродиться';
      btn.addEventListener('click', () => {
        AudioFX.play('ui');
        if (window.SoloGame) window.SoloGame.respawn();
      });

      this.victoryScreen = el('div', 'victory-screen', this.root);
      this.victoryScreen.style.display = 'none';
      el('div', 'victory-eyebrow', this.victoryScreen).textContent = 'ФИНАЛ';
      el('div', 'victory-title', this.victoryScreen).textContent = 'ИСТОРИЯ ЗАВЕРШЕНА';
      el('div', 'victory-sub', this.victoryScreen).textContent = 'Врата между мирами закрыты. Сон Джин-Ву стал Монархом Теней и защитил свой мир.';
      this.victoryStats = el('div', 'victory-stats', this.victoryScreen);
      const vbtn = el('button', 'pixel-btn', this.victoryScreen);
      vbtn.textContent = 'Продолжить охоту';
      vbtn.addEventListener('click', () => {
        this.victoryScreen.style.display = 'none';
        AudioFX.play('ui');
      });
    },

    buildToastStack() {
      this.toastStack = el('div', 'toast-stack', this.root);
    },

    // ---------- Touch ----------
    buildTouchControls() {
      const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      const auto = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || coarse;
      const settings = this.game ? this.game.settings : {};
      const isTouch = settings.touch || (!settings.touchUser && auto);
      if (!isTouch) return;
      this.enableTouch(true);
    },

    applyHandedness() {
      const left = !!(this.game && this.game.settings.leftHanded);
      document.body.classList.toggle('left-handed', left);
      if (this.joystick) this.joystick.classList.toggle('left-handed-stick', left);
    },

    enableTouch(on) {
      if (on && !this.touch) {
        document.body.classList.add('touch');
        document.body.classList.add('touch-device');
        Engine.Input.touchMode = true;
        const wrap = el('div', 'touch-controls', this.root);
        this.touch = wrap;
        const stick = el('div', 'joystick', wrap);
        const base = el('div', 'joystick-base', stick);
        this.joystick = stick;
        this.joystickKnob = el('div', 'joystick-knob', base);
        let active = false, pid = null;
        const update = (e) => {
          const r = base.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          let dx = e.clientX - cx, dy = e.clientY - cy;
          const max = r.width * 0.42;
          const len = Math.hypot(dx, dy);
          if (len > max) { dx = dx / len * max; dy = dy / len * max; }
          this.joystickKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          const nx = dx / max;
          Engine.Input.moveX = Math.abs(nx) < 0.18 ? 0 : Math.max(-1, Math.min(1, nx));
        };
        base.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          active = true; pid = e.pointerId;
          base.setPointerCapture(pid);
          update(e);
        });
        base.addEventListener('pointermove', (e) => {
          if (active && e.pointerId === pid) update(e);
        });
        const reset = () => {
          active = false; pid = null;
          Engine.Input.moveX = 0;
          this.joystickKnob.style.transform = 'translate(0,0)';
        };
        base.addEventListener('pointerup', reset);
        base.addEventListener('pointercancel', reset);

        const actions = el('div', 'touch-actions', wrap);
        const mk = (cls, label, action, repeat) => {
          const b = el('button', 'touch-btn ' + cls, actions);
          b.textContent = label;
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            b.classList.add('pressed');
            if (window.TG) window.TG.haptic('light');
            if (repeat) this.game.castSkillSlot(repeat.slot);
            else Engine.Input.setVirtual(action, true);
          });
          const up = (e) => {
            if (e) e.preventDefault();
            b.classList.remove('pressed');
            if (!repeat) Engine.Input.setVirtual(action, false);
          };
          b.addEventListener('pointerup', up);
          b.addEventListener('pointercancel', up);
          b.addEventListener('pointerleave', up);
          return b;
        };
        mk('attack-btn', 'УДАР', 'attack');
        mk('jump-btn', 'ПРЫЖОК', 'jump');
        this.touchDodge = mk('dodge-btn', 'РЫВОК', 'dodge');
        mk('interact-btn', 'E', 'interact');
        mk('potion-btn-touch', 'H', 'potion');
      } else if (!on && this.touch) {
        document.body.classList.remove('touch');
        const realTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
          (window.TG && window.TG.isTelegram);
        if (!realTouch) document.body.classList.remove('touch-device');
        Engine.Input.touchMode = false;
        Engine.Input.moveX = 0;
        if (this.touch.parentNode) this.touch.parentNode.removeChild(this.touch);
        this.touch = null;
        this.touchDodge = null;
        Engine.Input.clear();
      }
      this.applyHandedness();
    },

    // ---------- Обновление HUD ----------
    update(game) {
      const p = game.player;
      if (!p) return;
      const st = game.progress.stats || {};
      const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
      this.hpFill.style.width = hpPct + '%';
      this.hpText.textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
      const mpPct = Math.max(0, Math.min(100, (p.mp / p.maxMp) * 100));
      this.mpFill.style.width = mpPct + '%';
      this.mpText.textContent = Math.floor(p.mp) + ' / ' + p.maxMp;
      const need = game.progress.xpNext();
      const xpPct = Math.max(0, Math.min(100, (game.progress.xp / need) * 100));
      this.xpFill.style.width = xpPct + '%';
      this.xpText.textContent = game.progress.xp + ' / ' + need;
      this.levelText.textContent = 'Ур. ' + game.progress.level;
      this.goldText.textContent = '◈ ' + game.progress.gold;
      this.chapterText.textContent = game.chapter ? ('Глава ' + game.chapter.id + ' · ' + game.chapter.title.replace(/^Глава \d+\.\s*/, '')) : '';
      if (this.zoneText) {
        const zone = game.world && game.world.zones ? game.world.zones.find((z) => z.id === game.world.activeZoneId) : null;
        this.zoneText.textContent = zone ? ('Локация: ' + zone.name) : '';
      }

      this.lowHp.style.display = hpPct < 30 ? 'block' : 'none';

      // Скиллы
      const stats = p.stats || {};
      for (let i = 0; i < this.skillSlots.length; i++) {
        const slot = this.skillSlots[i];
        const skill = window.Combat.skills[i];
        if (!skill) continue;
        const unlocked = window.Combat.unlocked(skill, game);
        const cd = window.Combat.cooldownLeft(skill.id);
        const cdEl = slot.querySelector('.skill-cd');
        const cost = window.Combat.mpCost(skill, p);
        const costEl = slot.querySelector('.skill-cost');
        if (costEl) costEl.textContent = cost;
        if (cdEl) {
          if (cd > 0.05) {
            cdEl.textContent = cd.toFixed(1);
            cdEl.style.display = '';
          } else {
            cdEl.style.display = 'none';
          }
        }
        slot.classList.toggle('locked', !unlocked);
        slot.classList.toggle('no-mp', unlocked && p.mp < cost);
        slot.querySelector('.skill-icon').style.filter = unlocked ? 'none' : 'grayscale(1) brightness(.45)';
      }

      // Зелья
      const potions = game.inventory.count('hp-potion-large') + game.inventory.count('hp-potion-medium') + game.inventory.count('hp-potion-small');
      this.potionCount.textContent = String(potions);
      this.potionBtn.classList.toggle('no-mp', potions === 0);

      // Комбо и рывок
      const comboStep = p.dead ? 0 : (p.comboStep || 0);
      if (comboStep > 0 && p.comboTimer > 0) {
        this.comboBadge.style.display = '';
        this.comboBadge.className = 'combo-badge' + (comboStep >= 3 ? ' finisher' : '');
        this.comboCount.textContent = '×' + comboStep;
        this.comboWord.textContent = comboStep >= 3 ? 'ФИНИШЕР' : 'КОМБО';
        this.comboPips.forEach((pip, i) => {
          pip.className = 'combo-pip' + (i < comboStep ? ' on' : '');
        });
        const ratio = Math.max(0, Math.min(1, p.comboTimer / (p.comboWindow || 0.9)));
        this.comboFill.style.width = (ratio * 100).toFixed(0) + '%';
      } else {
        this.comboBadge.style.display = 'none';
      }
      if (this.touchDodge) {
        const dodgeCd = p.dodgeCd || 0;
        this.touchDodge.textContent = dodgeCd > 0.05 ? dodgeCd.toFixed(1) : 'РЫВОК';
        this.touchDodge.classList.toggle('cooling', dodgeCd > 0.05);
      }

      // Босс
      const boss = game.boss;
      if (boss && !boss.dead && boss.engaged) {
        this.bossBar.style.display = '';
        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        this.bossFill.style.width = pct + '%';
        this.bossName.textContent = boss.name;
        this.bossHpText.textContent = Math.ceil(boss.hp) + ' / ' + boss.maxHp;
        const phaseLabel = boss.enraged ? (boss.bossData.enrage && boss.bossData.enrage.label) || 'ЯРОСТЬ'
          : (boss.phase > 0 ? 'Фаза ' + (boss.phase + 1) : 'Фаза 1');
        this.bossPhase.textContent = phaseLabel;
        const key = boss.name + ':' + boss.phase + ':' + boss.enraged;
        if (key !== this._lastBossKey) {
          this._lastBossKey = key;
          this.bossBar.classList.remove('pulse');
          void this.bossBar.offsetWidth;
          this.bossBar.classList.add('pulse');
        }
      } else {
        this.bossBar.style.display = 'none';
        if (this._lastBossKey) this._lastBossKey = '';
      }

      if (this.bossCast && this.bossCast.style.display !== 'none') {
        const time = window.Effects ? window.Effects.time : 0;
        const duration = this._bossCastDuration || 1;
        const ratio = Math.max(0, Math.min(1, (this._bossCastEnd - time) / duration));
        this.bossCastFill.style.width = (ratio * 100).toFixed(0) + '%';
        // Отсчёт идёт по Effects.time, поэтому тики замирают вместе с телеграфом.
        if (this._bossCastCues) {
          const elapsed = 1 - ratio;
          while (this._bossCastCueStep < this._bossCastCues.length &&
                 elapsed >= this._bossCastCues[this._bossCastCueStep]) {
            const cue = this._bossCastCueSounds[this._bossCastCueStep];
            if (window.AudioFX && cue) AudioFX.play(cue);
            this._bossCastCueStep++;
          }
        }
        if (ratio <= 0) this.hideBossCast();
      }

      this.drawMinimap(game);
    },

    setHint(text) {
      if (text === this._lastHint) return;
      this._lastHint = text || '';
      this.hint.textContent = text || '';
      this.hint.style.opacity = text ? '1' : '0';
    },

    refreshTracker() {
      if (!this.tracker) return;
      clear(this.tracker);
      const game = this.game;
      if (!game || !game.chapter) return;
      const list = window.Quests.tracker(game.chapter.id, 3);
      if (!list.length) {
        el('div', 'tracker-empty', this.tracker).textContent = 'Все задания выполнены';
        return;
      }
      list.forEach((q) => {
        const row = el('div', 'tracker-row' + (q.type === 'hidden' ? ' hidden' : ''), this.tracker);
        el('div', 'tracker-title', row).textContent = (q.type === 'main' ? '◆ ' : q.type === 'hidden' ? '◈ ' : '· ') + q.title;
        const st = window.Quests.stateOf(q.id);
        q.objectives.forEach((obj, i) => {
          const cur = st ? Math.min(st.progress[i] || 0, obj.count) : 0;
          if (cur >= obj.count) return;
          const line = el('div', 'tracker-obj', row);
          line.textContent = obj.label + '  ' + cur + '/' + obj.count;
        });
      });
    },

    // ---------- Диалог ----------
    showDialog(line) {
      if (!line || !this.dialogBox) return;
      this.dialogBox.style.display = '';
      this.dialogPortrait.style.display = line.icon ? '' : 'none';
      this.dialogBox.classList.toggle('no-portrait', !line.icon);
      if (line.icon) this.dialogPortrait.src = line.icon;
      this.dlgSpeaker.textContent = line.speaker;
      this.dlgText.textContent = line.text;
      this.dlgPaging.textContent = (line.index + 1) + ' / ' + line.total + '   [E]';
    },

    hideDialog() {
      if (this.dialogBox) this.dialogBox.style.display = 'none';
    },

    // ---------- Инвентарь ----------
    toggleInventory() {
      const open = this.inventory.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.inventory.style.display = '';
        this.renderInventory();
      }
      this.syncBackdrop();
    },

    renderInventory() {
      if (!this.game) return;
      const g = this.game;
      const content = this.invContent;
      clear(content);
      const tabs = this.inventory.querySelectorAll('.panel-tab');
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === this.invTab));

      if (this.invTab === 'gear') this.renderGear(content);
      else if (this.invTab === 'items') this.renderItems(content);
      else this.renderShop(content);
    },

    renderGear(root) {
      const g = this.game;
      const eq = g.inventory.equipment;
      const slots = el('div', 'equip-slots', root);
      [['weapon', 'Оружие'], ['armor', 'Броня'], ['accessory', 'Аксессуар']].forEach((pair) => {
        const slot = el('div', 'equip-slot', slots);
        const itemId = eq[pair[0]];
        const item = itemId ? window.Loot.item(itemId) : null;
        el('div', 'equip-label', slot).textContent = pair[1];
        if (item) {
          img(item.icon, 'equip-icon', slot);
          const name = el('div', 'equip-name', slot);
          name.textContent = item.name;
          name.style.color = window.Loot.rarityColor(item.rarity);
          el('div', 'equip-stats', slot).textContent = this.statLine(item.stats);
          const b = el('button', 'mini-btn', slot);
          b.textContent = 'Снять';
          b.addEventListener('click', () => { g.unequipItem(pair[0]); this.renderInventory(); this.refreshTalents(); });
        } else {
          el('div', 'equip-empty', slot).textContent = 'Пусто';
        }
      });
      const bonuses = g.inventory.getEquipmentBonuses();
      const total = el('div', 'equip-total', root);
      total.textContent = 'Бонусы снаряжения: ' + this.statLine(bonuses);

      el('div', 'section-title', root).textContent = 'Боевые характеристики';
      const stats = g.progress.stats || {};
      const grid = el('div', 'stat-grid', root);
      [
        ['Атака', stats.atk], ['Защита', stats.def], ['HP', stats.maxHp], ['Мана', stats.maxMp],
        ['Крит', Math.round((stats.critChance || 0) * 100) + '%'],
        ['Скорость', stats.speed], ['Вампиризм', Math.round((stats.lifesteal || 0) * 100) + '%'],
        ['Реген MP', (stats.mpRegen || 0).toFixed(1) + '/с']
      ].forEach((pair) => {
        const cell = el('div', 'stat-cell', grid);
        el('span', 'stat-key', cell).textContent = pair[0];
        el('span', 'stat-val', cell).textContent = pair[1];
      });
    },

    statLine(stats) {
      if (!stats) return '—';
      const map = {
        atk: 'атака', def: 'защита', hp: 'HP', mp: 'мана',
        speedPct: 'скорость', critChance: 'крит', mpRegen: 'реген MP'
      };
      const parts = [];
      for (const key in stats) {
        if (!stats[key]) continue;
        let v = stats[key];
        if (key === 'speedPct') v = '+' + Math.round(v * 100) + '%';
        else if (key === 'critChance') v = '+' + Math.round(v * 100) + '%';
        else v = '+' + v;
        parts.push((map[key] || key) + ' ' + v);
      }
      return parts.length ? parts.join(', ') : '—';
    },

    renderItems(root) {
      const g = this.game;
      const list = g.inventory.sorted();
      if (!list.length) {
        el('div', 'empty-note', root).textContent = 'Пусто. Побеждайте врагов и открывайте сундуки.';
        return;
      }
      list.forEach((entry) => {
        const item = entry.item;
        const row = el('div', 'item-row rarity-' + item.rarity, root);
        img(item.icon, 'item-icon', row);
        const info = el('div', 'item-info', row);
        const name = el('div', 'item-name', info);
        name.textContent = (entry.qty > 1 ? entry.qty + '× ' : '') + item.name;
        name.style.color = window.Loot.rarityColor(item.rarity);
        el('div', 'item-sub', info).textContent = window.Loot.typeName(item.type) + ' · ' + item.desc +
          (item.stats ? ' · ' + this.statLine(item.stats) : '');
        const actions = el('div', 'item-actions', row);
        if (item.type === 'consumable' || item.type === 'elixir') {
          const use = el('button', 'mini-btn', actions);
          use.textContent = 'Использовать';
          use.addEventListener('click', () => {
            g.useItem(item.id);
            this.renderInventory();
          });
        } else if (['weapon', 'armor', 'accessory'].includes(item.type)) {
          const equip = el('button', 'mini-btn', actions);
          equip.textContent = 'Экипировать';
          equip.addEventListener('click', () => {
            g.equipItem(item.id);
            this.renderInventory();
            this.refreshTalents();
          });
        }
        if (item.value) {
          const sell = el('button', 'mini-btn ghost', actions);
          sell.textContent = 'Продать ' + item.value;
          sell.addEventListener('click', () => {
            g.sellItem(item.id);
            this.renderInventory();
          });
        }
      });
    },

    renderShop(root) {
      const g = this.game;
      el('div', 'shop-gold', root).textContent = 'Золото: ◈ ' + g.progress.gold;
      window.Loot.shop.forEach((entry) => {
        const item = window.Loot.item(entry.id);
        if (!item) return;
        const row = el('div', 'item-row rarity-' + item.rarity, root);
        img(item.icon, 'item-icon', row);
        const info = el('div', 'item-info', row);
        const name = el('div', 'item-name', info);
        name.textContent = item.name;
        name.style.color = window.Loot.rarityColor(item.rarity);
        el('div', 'item-sub', info).textContent = item.desc;
        const actions = el('div', 'item-actions', row);
        const buy = el('button', 'mini-btn', actions);
        buy.textContent = 'Купить ◈' + entry.price;
        buy.disabled = g.progress.gold < entry.price;
        buy.addEventListener('click', () => {
          g.buyItem(entry.id, entry.price);
          this.renderInventory();
        });
      });
    },

    // ---------- Квесты ----------
    toggleQuests() {
      const open = this.quest.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.quest.style.display = '';
        this.renderQuests();
      }
      this.syncBackdrop();
    },

    renderQuests() {
      const g = this.game;
      const content = this.questContent;
      clear(content);
      this.quest.querySelectorAll('.panel-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === this.questTab));

      if (this.questTab === 'main' && g.chapter && g.chapter.summary) {
        const summary = el('div', 'story-summary', content);
        el('div', 'story-summary-title', summary).textContent = 'СЮЖЕТ ГЛАВЫ · ' + g.chapter.title;
        el('div', 'story-summary-text', summary).textContent = g.chapter.summary;
      }

      const list = window.Quests.visible(this.questTab);
      if (!list.length) {
        const note = this.questTab === 'hidden'
          ? 'Скрытые задания откроются при особых условиях. Исследуйте подземелья, ищите тайники и побеждайте без урона.'
          : 'Заданий пока нет.';
        el('div', 'empty-note', content).textContent = note;
      }
      list.sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
      list.forEach((q) => {
        const st = window.Quests.stateOf(q.id);
        const row = el('div', 'quest-row ' + q.type + (st.status === 'completed' ? ' completed' : ''), content);
        const head = el('div', 'quest-head', row);
        el('span', 'quest-title', head).textContent = q.title;
        if (q.chapter) el('span', 'quest-chapter', head).textContent = 'Гл. ' + q.chapter;
        if (st.status === 'completed') el('span', 'quest-done', head).textContent = 'ВЫПОЛНЕНО';
        el('div', 'quest-desc', row).textContent = q.desc;
        const objs = el('div', 'quest-objectives', row);
        q.objectives.forEach((obj, i) => {
          const cur = st ? Math.min(st.progress[i] || 0, obj.count) : 0;
          const line = el('div', 'quest-obj' + (cur >= obj.count ? ' done' : ''), objs);
          line.textContent = (cur >= obj.count ? '✓ ' : '· ') + obj.label + '  ' + cur + '/' + obj.count;
        });
        const rew = el('div', 'quest-rewards', row);
        const r = q.rewards || {};
        const parts = [];
        if (r.xp) parts.push('XP ' + r.xp);
        if (r.gold) parts.push('◈ ' + r.gold);
        if (r.talentPoints) parts.push('таланты +' + r.talentPoints);
        if (r.items) r.items.forEach((it) => {
          const def = window.Loot.item(it.id);
          parts.push((def ? def.name : it.id) + ' ×' + it.qty);
        });
        rew.textContent = 'Награда: ' + parts.join(' · ');
      });

      // Выбор главы
      const sel = this.questChapters;
      clear(sel);
      el('div', 'chapter-select-title', sel).textContent = 'Вернуться в главу';
      const row = el('div', 'chapter-buttons', sel);
      g.chapters.forEach((ch, i) => {
        if (i > g.unlocked) return;
        const b = el('button', 'chapter-btn' + (i === g.chapterIndex ? ' current' : ''), row);
        b.textContent = String(ch.id);
        b.title = ch.title;
        b.addEventListener('click', () => {
          this.closeAllPanels();
          g.startChapterReplay(i);
        });
      });
    },

    // ---------- Таланты ----------
    toggleTalents() {
      const open = this.talents.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.talents.style.display = '';
        this.refreshTalents();
      }
      this.syncBackdrop();
    },

    refreshTalents() {
      if (!this.game) return;
      const content = this.talentContent;
      clear(content);
      const p = this.game.progress;
      const head = el('div', 'talent-head', content);
      el('div', 'talent-points', head).textContent = 'Очки талантов: ' + p.talentPoints;
      el('div', 'talent-level', head).textContent = 'Уровень ' + p.level + ' · умения открываются с уровнем';
      const grid = el('div', 'talent-grid', content);
      const branches = p.branches || [];
      branches.forEach((branch) => {
        const col = el('div', 'talent-branch', grid);
        col.style.setProperty('--branch-color', branch.color);
        const bh = el('div', 'branch-head', col);
        bh.textContent = branch.name;
        bh.title = branch.desc;
        const nodes = Object.values(p.nodesById).filter((n) => n.branch === branch.id).sort((a, b) => a.y - b.y);
        nodes.forEach((node) => {
          const rank = p.rank(node.id);
          const check = p.canLearn(node.id);
          const b = el('button', 'talent-node' + (rank >= node.maxRank ? ' maxed' : check.ok ? ' can' : ' locked'), col);
          b.title = node.name + ' — ' + node.desc + (node.levelReq > 1 ? ' (уровень ' + node.levelReq + ')' : '');
          el('div', 'node-name', b).textContent = node.name;
          el('div', 'node-desc', b).textContent = node.desc;
          el('div', 'node-rank', b).textContent = 'Ранг ' + rank + '/' + node.maxRank + ' · цена ' + node.cost;
          const reqs = (node.requires || []).map((id) => (p.node(id) || {}).name).filter(Boolean);
          const reqParts = [];
          if (reqs.length) reqParts.push('Нужно: ' + reqs.join(', '));
          if (node.levelReq > 1) reqParts.push('Ур. ' + node.levelReq);
          if (reqParts.length) el('div', 'node-req', b).textContent = reqParts.join(' · ');
          b.addEventListener('click', () => {
            const res = this.game.learnTalent(node.id);
            if (res.ok) {
              AudioFX.play('quest');
              this.toast('Талант изучен', node.name + ' — ранг ' + p.rank(node.id), { color: branch.color });
              this.refreshTalents();
            } else {
              AudioFX.play('error');
              this.toast('Талант недоступен', res.reason, { color: '#ff9a6a' });
            }
          });
        });
      });

      const skills = el('div', 'talent-skills', content);
      el('div', 'section-title', skills).textContent = 'Умения';
      window.Combat.skills.forEach((s) => {
        const unlocked = window.Combat.unlocked(s, this.game);
        const row = el('div', 'skill-unlock' + (unlocked ? '' : ' locked'), skills);
        img(s.icon, 'skill-unlock-icon', row);
        const info = el('div', 'skill-unlock-info', row);
        el('div', 'skill-unlock-name', info).textContent = s.name + (unlocked ? '' : ' — откроется на ' + s.unlock.level + ' ур.');
        el('div', 'skill-unlock-desc', info).textContent = s.desc + ' (мана ' + s.mp + ', КД ' + s.cooldown + 'с)';
      });
    },

    // ---------- Теневая армия ----------
    buildShadows() {
      const made = this.makePanel('ui-shadows', 'ТЕНЕВАЯ АРМИЯ');
      this.shadowPanel = made.panel;
      this.shadowBody = made.body;
    },

    toggleShadows() {
      const open = this.shadowPanel.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.shadowPanel.style.display = '';
        this.renderShadows();
        AudioFX.play('ui');
      }
      this.syncBackdrop();
    },

    renderShadows() {
      if (!this.shadowBody || !this.game) return;
      const g = this.game;
      const body = this.shadowBody;
      clear(body);
      const defs = window.ShadowArmy ? window.ShadowArmy.DEFS : {};
      const max = window.ShadowArmy ? window.ShadowArmy.MAX : 2;
      const essence = g.inventory.count('shadow-essence');

      const top = el('div', 'shadow-top', body);
      el('div', 'shadow-title-line', top).textContent = 'Теневые воины подчиняются Монарху. Выберите до ' + max + ' теней.';
      const stats = el('div', 'shadow-summary', top);
      el('span', 'shadow-essence', stats).textContent = 'Эссенция тени: ' + essence;
      el('span', 'shadow-slots-count', stats).textContent = 'В строю: ' + g.shadows.equipped.length + ' / ' + max;

      const slots = el('div', 'shadow-slots', body);
      for (let i = 0; i < max; i++) {
        const id = g.shadows.equipped[i];
        const slot = el('div', 'shadow-slot' + (id ? ' filled' : ' empty'), slots);
        if (!id) {
          el('div', 'shadow-slot-label', slot).textContent = 'СЛОТ ' + (i + 1);
          el('div', 'shadow-slot-empty', slot).textContent = 'Пусто';
          continue;
        }
        const def = defs[id];
        img(def.portrait, 'shadow-slot-portrait', slot);
        const info = el('div', 'shadow-slot-info', slot);
        el('div', 'shadow-slot-label', info).textContent = 'СЛОТ ' + (i + 1);
        el('div', 'shadow-slot-name', info).textContent = def.name;
        el('div', 'shadow-slot-level', info).textContent = 'Уровень ' + g.shadowLevel(id);
        const remove = el('button', 'shadow-mini-btn', slot);
        remove.textContent = 'Убрать';
        remove.addEventListener('click', () => {
          g.toggleShadow(id);
          this.renderShadows();
        });
      }

      if (!Object.keys(g.shadows.owned).length) {
        const hint = el('div', 'shadow-empty-hint', body);
        hint.textContent = 'Теневая армия ещё не пробуждена. Победите Игриса в главе 6 и извлеките его тень.';
      }

      const grid = el('div', 'shadow-grid', body);
      (window.ShadowArmy ? window.ShadowArmy.ids() : Object.keys(defs)).forEach((id) => {
        const def = defs[id];
        const owned = g.hasShadow(id);
        const level = owned ? g.shadowLevel(id) : 1;
        const active = g.shadows.equipped.indexOf(id) >= 0;
        const card = el('div', 'shadow-card' + (owned ? '' : ' locked') + (active ? ' active' : ''), grid);
        const portrait = img(def.portrait, 'shadow-portrait', card);
        if (!owned) portrait.style.filter = 'grayscale(1) brightness(0.35)';
        const head = el('div', 'shadow-card-head', card);
        const title = el('div', 'shadow-card-title', head);
        el('div', 'shadow-name', title).textContent = def.name;
        el('div', 'shadow-role', title).textContent = def.title;
        if (owned) {
          el('div', 'shadow-level-badge', head).textContent = 'Ур. ' + level;
        } else {
          el('div', 'shadow-level-badge locked', head).textContent = 'ЗАКРЫТО';
        }
        el('div', 'shadow-passive', card).textContent = def.passive;
        if (!owned) {
          el('div', 'shadow-lock-hint', card).textContent = g.shadowUnlockHint(id);
          return;
        }
        const stat = g.shadowStats(id);
        const damagePct = Math.round(stat.atkPct * stat.damageMult * 100);
        el('div', 'shadow-stat', card).textContent =
          'Урон ' + damagePct + '% от героя · атака ' + stat.attackCd.toFixed(2) + ' с';
        el('div', 'shadow-upgrade-hint', card).textContent = def.upgrade;
        const actions = el('div', 'shadow-actions', card);
        const toggle = el('button', 'shadow-btn', actions);
        toggle.textContent = active ? 'В резерв' : 'В строй';
        toggle.addEventListener('click', () => {
          g.toggleShadow(id);
          this.renderShadows();
        });
        const up = el('button', 'shadow-btn upgrade', actions);
        if (level >= 5) {
          up.textContent = 'Максимум';
          up.disabled = true;
        } else {
          const cost = window.ShadowArmy.upgradeCost(level);
          up.textContent = 'Улучшить · ' + cost + ' эсс.';
          up.classList.toggle('short', essence < cost);
          up.addEventListener('click', () => {
            g.upgradeShadow(id);
            this.renderShadows();
          });
        }
      });
    },

    // ---------- Гильдия Ахджин ----------
    buildHub() {
      const made = this.makePanel('ui-hub', 'ГИЛЬДИЯ АХДЖИН');
      this.hub = made.panel;
      this.hubBody = made.body;
      this.hubBody.classList.add('hub-body');
    },

    hubUnlocked() {
      const g = this.game;
      return !!g && (g.finished || g.unlocked >= 8 || g.chapterIndex >= 8);
    },

    toggleHub() {
      if (!this.hubUnlocked()) {
        AudioFX.play('error');
        this.toast('Гильдия Ахджин', 'Штаб откроется после главы 9 — гильдию ещё нужно основать.', {
          color: '#c08cff', duration: 4200
        });
        return;
      }
      const open = this.hub.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.hub.style.display = '';
        this.renderHub();
        AudioFX.play('ui');
      }
      this.syncBackdrop();
    },

    renderHub() {
      if (!this.hubBody || !this.game) return;
      const g = this.game;
      const body = this.hubBody;
      clear(body);
      g.ensureContracts();
      (g.contracts.list || []).forEach((c) => {
        if (c.status === 'active' && (!g.activeContract || g.activeContract.id !== c.id)) c.status = 'failed';
      });
      const max = window.ShadowArmy ? window.ShadowArmy.MAX : 2;
      const done = (type) => (window.Quests.data[type] || [])
        .filter((q) => ((window.Quests.stateOf(q.id) || {}).status === 'completed')).length;
      const rank = g.finished || g.unlocked >= 10 ? 'S'
        : g.unlocked >= 8 ? 'A' : g.unlocked >= 6 ? 'B'
          : g.unlocked >= 4 ? 'C' : g.unlocked >= 2 ? 'D' : 'E';

      const hero = el('div', 'hub-hero', body);
      const heroBg = el('div', 'hub-hero-bg', hero);
      img('assets/sprites/arenas/arena_ahjin_sparring.jpg', 'hub-hero-img', heroBg);
      el('div', 'hub-hero-shade', hero);
      const heroText = el('div', 'hub-hero-text', hero);
      el('div', 'hub-kicker', heroText).textContent = 'ГИЛЬДИЯ · СЕУЛ';
      el('div', 'hub-title', heroText).textContent = 'АХДЖИН';
      el('div', 'hub-motto', heroText).textContent =
        '«Берём контракты, от которых отказываются другие»';
      const chips = el('div', 'hub-chips', heroText);
      const chip = (label, value) => {
        const c = el('div', 'hub-chip', chips);
        el('span', 'hub-chip-label', c).textContent = label;
        el('span', 'hub-chip-value', c).textContent = value;
      };
      chip('РАНГ', rank);
      chip('УРОВЕНЬ', String(g.progress.level));
      chip('ЗОЛОТО', '◈ ' + g.progress.gold);
      chip('ТЕНИ', g.shadows.equipped.length + '/' + max);

      const daily = el('section', 'hub-section hub-daily', body);
      const dhead = el('div', 'hub-sec-head', daily);
      el('div', 'hub-sec-title', dhead).textContent = 'ЕЖЕДНЕВНЫЕ КОНТРАКТЫ';
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const minutes = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 60000));
      const resetText = minutes >= 60
        ? Math.floor(minutes / 60) + ' ч ' + (minutes % 60) + ' мин'
        : minutes + ' мин';
      const completedContracts = g.contracts.list.filter((c) => c.status === 'completed').length;
      el('div', 'hub-sec-sub', dhead).textContent =
        'Выполнено ' + completedContracts + '/3 · сброс через ' + resetText;
      const dailyList = el('div', 'hub-daily-list', daily);
      g.contracts.list.forEach((contract, index) => {
        const card = el('article', 'hub-contract hub-contract-' + contract.status, dailyList);
        const top = el('div', 'hub-contract-top', card);
        el('span', 'hub-contract-num', top).textContent = String(index + 1).padStart(2, '0');
        el('span', 'hub-contract-tag', top).textContent = contract.tag;
        const contractTitle = el('div', 'hub-contract-title', card);
        contractTitle.textContent = contract.title;
        contractTitle.title = contract.title;
        const contractDesc = el('div', 'hub-contract-desc', card);
        contractDesc.textContent = contract.desc;
        contractDesc.title = contract.desc;
        const contractReward = el('div', 'hub-contract-reward', card);
        contractReward.textContent = 'Награда: ' + g.contractRewardText(contract);
        contractReward.title = contractReward.textContent;
        const foot = el('div', 'hub-contract-foot', card);
        const status = el('span', 'hub-contract-status', foot);
        if (contract.status === 'completed') {
          status.textContent = 'ВЫПОЛНЕНО';
        } else if (contract.status === 'failed') {
          status.textContent = 'ПРОВАЛЕН';
        } else if (contract.status === 'active') {
          status.textContent = 'В ИГРЕ';
        } else {
          status.textContent = 'ГОТОВ';
        }
        if (contract.status === 'completed') return;
        const btn = el('button', 'hub-contract-btn', foot);
        btn.textContent = contract.status === 'active' ? 'ПРОДОЛЖИТЬ'
          : contract.status === 'failed' ? 'ПОВТОРИТЬ' : 'ПРИНЯТЬ';
        btn.addEventListener('click', () => {
          if (contract.status === 'active') {
            this.closeAllPanels();
            return;
          }
          g.startContract(contract.id);
        });
      });

      const grid = el('div', 'hub-grid', body);
      const contracts = el('section', 'hub-section hub-contracts', grid);
      const chead = el('div', 'hub-sec-head', contracts);
      const ctitle = el('div', 'hub-sec-title', chead);
      ctitle.textContent = 'АРХИВ ГЛАВ';
      el('div', 'hub-sec-sub', chead).textContent =
        'Основные ' + done('main') + '/12 · побочные ' + done('side') + '/28 · скрытые ' + done('hidden') + '/8';
      const chapters = el('div', 'hub-chapters', contracts);
      g.chapters.forEach((ch, i) => {
        const unlocked = i <= g.unlocked;
        const cleared = i < g.unlocked || (g.finished && i === g.unlocked);
        const current = i === g.chapterIndex;
        const status = current ? 'ТЕКУЩАЯ' : cleared ? 'ПРОЙДЕНА' : unlocked ? 'ДОСТУПНА' : 'ЗАКРЫТО';
        const b = el('button', 'hub-chapter' + (unlocked ? '' : ' locked') +
          (current ? ' current' : '') + (cleared ? ' cleared' : ''), chapters);
        b.title = ch.title + (ch.summary ? ' — ' + ch.summary : '');
        el('span', 'hub-ch-num', b).textContent = String(ch.id).padStart(2, '0');
        el('span', 'hub-ch-title', b).textContent = ch.title.replace(/^Глава \d+\.\s*/, '');
        el('span', 'hub-ch-status', b).textContent = status;
        if (!unlocked) {
          b.disabled = true;
          return;
        }
        b.addEventListener('click', () => {
          if (i === g.chapterIndex) {
            this.closeAllPanels();
            return;
          }
          this.closeAllPanels();
          g.startChapterReplay(i);
        });
      });

      const side = el('div', 'hub-side', grid);
      const squad = el('section', 'hub-section hub-squad-section', side);
      const shead = el('div', 'hub-sec-head', squad);
      el('div', 'hub-sec-title', shead).textContent = 'ОТРЯД';
      const manage = el('button', 'hub-link', shead);
      manage.textContent = 'ВСЕ ТЕНИ';
      manage.addEventListener('click', () => {
        this.closeAllPanels();
        this.toggleShadows();
      });
      const squadGrid = el('div', 'hub-squad', squad);
      for (let i = 0; i < max; i++) {
        const id = g.shadows.equipped[i];
        const card = el('div', 'hub-shadow-card' + (id ? '' : ' empty'), squadGrid);
        if (!id) {
          el('div', 'hub-shadow-slot', card).textContent = 'СЛОТ ' + (i + 1);
          el('div', 'hub-shadow-empty', card).textContent = 'Свободный слот';
          continue;
        }
        const def = window.ShadowArmy.def(id);
        const portrait = img(def.portrait, 'hub-shadow-portrait', card);
        portrait.style.imageRendering = 'pixelated';
        const info = el('div', 'hub-shadow-info', card);
        el('div', 'hub-shadow-name', info).textContent = def.name;
        el('div', 'hub-shadow-role', info).textContent = def.title;
        el('div', 'hub-shadow-level', info).textContent = 'Ур. ' + g.shadowLevel(id);
      }
      el('div', 'hub-guild-line', squad).textContent =
        'Мастер: Сон Джин-Ву · Вице-мастер: Ю Джин-Хо';

      const supply = el('section', 'hub-section hub-supply', side);
      const phead = el('div', 'hub-sec-head', supply);
      el('div', 'hub-sec-title', phead).textContent = 'СНАБЖЕНИЕ';
      el('div', 'hub-sec-sub', phead).textContent = '◈ ' + g.progress.gold;
      const potions = g.inventory.count('hp-potion-small') +
        g.inventory.count('hp-potion-medium') + g.inventory.count('hp-potion-large');
      const potionRow = el('div', 'hub-potion-row', supply);
      el('div', 'hub-potion-text', potionRow).textContent = 'Зелья лечения: ' + potions;
      const heal = el('button', 'hub-link', potionRow);
      heal.textContent = 'ВЫПИТЬ';
      heal.disabled = potions <= 0 || !g.player || g.player.hp >= g.player.maxHp;
      heal.addEventListener('click', () => {
        g.usePotion();
        this.renderHub();
      });
      const acts = el('div', 'hub-actions', supply);
      const action = (label, fn) => {
        const b = el('button', 'hub-act', acts);
        b.textContent = label;
        b.addEventListener('click', fn);
      };
      action('ИНВЕНТАРЬ', () => { this.closeAllPanels(); this.toggleInventory(); });
      action('ЛАВКА', () => {
        this.invTab = 'shop';
        this.closeAllPanels();
        this.toggleInventory();
      });
      action('ТАЛАНТЫ', () => { this.closeAllPanels(); this.toggleTalents(); });
      action('ЖУРНАЛ', () => { this.closeAllPanels(); this.toggleQuests(); });

      const foot = el('div', 'hub-foot', body);
      el('div', 'hub-foot-left', foot).textContent =
        'Убито ' + (g.stats.kills || 0) + ' · Боссов ' + (g.stats.bosses || 0) +
        ' · Тайников ' + (g.stats.chests || 0) + ' · Секретов ' + (g.stats.secrets || 0);
      el('div', 'hub-foot-right', foot).textContent = 'Штаб · Сеул · G — закрыть';
    },

    // ---------- Меню ----------
    toggleMenu() {
      const open = this.menu.style.display === 'none';
      this.closeAllPanels();
      if (open) {
        this.menu.style.display = '';
        this.refreshMenu();
      }
      this.syncBackdrop();
    },

    refreshMenu() {
      const settings = this.game.settings;
      this.menuSound.textContent = 'Звук: ' + (settings.muted ? 'выкл' : 'вкл');
      this.menuShake.textContent = 'Тряска камеры: ' + (settings.shake ? 'вкл' : 'выкл');
      this.menuTouch.textContent = 'Экранные кнопки: ' + (this.touch ? 'вкл' : 'выкл');
      if (this.menuHanded) this.menuHanded.textContent = 'Раскладка: ' + (settings.leftHanded ? 'левша' : 'правша');
      if (this.menuShadow) {
        const max = window.ShadowArmy ? window.ShadowArmy.MAX : 2;
        const count = this.game.shadows.equipped.length;
        const owned = Object.keys(this.game.shadows.owned || {}).length;
        this.menuShadow.textContent = 'Теневая армия: ' + count + '/' + max + ' в строю' +
          (owned ? '' : ' · пока пусто');
        this.menuShadow.classList.toggle('locked', owned === 0);
      }
      if (this.menuHub) {
        const unlocked = this.hubUnlocked();
        this.menuHub.textContent = unlocked
          ? 'Гильдия Ахджин · штаб и контракты'
          : 'Гильдия Ахджин · откроется после главы 8';
        this.menuHub.classList.toggle('locked', !unlocked);
      }
    },

    closeAllPanels() {
      [this.inventory, this.quest, this.talents, this.shadowPanel, this.hub, this.menu].forEach((p) => { if (p) p.style.display = 'none'; });
      this._resetConfirm = false;
      this.syncBackdrop();
    },

    syncBackdrop() {
      if (!this.panelBackdrop) return;
      const open = [this.inventory, this.quest, this.talents, this.shadowPanel, this.hub, this.menu].some((p) => p && p.style.display !== 'none');
      this.panelBackdrop.style.display = open ? '' : 'none';
      if (this.root) this.root.classList.toggle('panel-open', open);
    },

    togglePanel(name) {
      if (name === 'inventory') this.toggleInventory();
      else if (name === 'quests') this.toggleQuests();
      else if (name === 'talents') this.toggleTalents();
      else if (name === 'shadows') this.toggleShadows();
      else if (name === 'hub') this.toggleHub();
      else if (name === 'menu') this.toggleMenu();
    },

    isModalOpen() {
      return [this.inventory, this.quest, this.talents, this.shadowPanel, this.hub, this.menu].some((p) => p && p.style.display !== 'none');
    },

    isTouch() { return !!this.touch; },

    // ---------- Баннеры и тосты ----------
    showChapterBanner(title, subtitle) {
      const b = this.chapterBanner;
      clear(b);
      b.classList.remove('boss-intro');
      el('div', 'banner-title', b).textContent = title || '';
      if (subtitle) el('div', 'banner-sub', b).textContent = subtitle;
      b.style.display = '';
      b.classList.remove('anim');
      void b.offsetWidth;
      b.classList.add('anim');
      clearTimeout(this._bt);
      this._bt = setTimeout(() => { b.style.display = 'none'; }, 2800);
    },

    showBossIntro(boss) {
      const b = this.chapterBanner;
      clear(b);
      b.classList.add('boss-intro');
      el('div', 'banner-eyebrow', b).textContent = 'БОСС';
      el('div', 'banner-title', b).textContent = boss.name;
      if (boss.subtitle) el('div', 'banner-sub', b).textContent = boss.subtitle;
      if (boss.bossData && boss.bossData.intro) el('div', 'banner-quote', b).textContent = boss.bossData.intro;
      b.style.display = '';
      b.classList.remove('anim');
      void b.offsetWidth;
      b.classList.add('anim');
      clearTimeout(this._bt);
      this._bt = setTimeout(() => {
        b.style.display = 'none';
        b.classList.remove('boss-intro');
      }, 3400);
      AudioFX.play('boss');
      Camera.addTrauma(0.45);
    },

    showLevelUp(level, gains) {
      const b = this.levelBanner;
      clear(b);
      el('div', 'levelup-title', b).textContent = 'УРОВЕНЬ ' + level;
      el('div', 'levelup-sub', b).textContent = gains;
      b.style.display = '';
      b.classList.remove('anim');
      void b.offsetWidth;
      b.classList.add('anim');
      clearTimeout(this._lt);
      this._lt = setTimeout(() => { b.style.display = 'none'; }, 2600);
      AudioFX.play('levelup');
      if (window.TG) window.TG.haptic('success');
    },

    toast(title, text, opts) {
      opts = opts || {};
      const t = el('div', 'toast', this.toastStack);
      t.style.borderColor = opts.color || '#6a74b8';
      if (opts.icon) img(opts.icon, 'toast-icon', t);
      const info = el('div', 'toast-info', t);
      el('div', 'toast-title', info).textContent = title;
      if (text) el('div', 'toast-text', info).textContent = text;
      this._toasts.push(t);
      while (this._toasts.length > 5) {
        const old = this._toasts.shift();
        if (old.parentNode) old.parentNode.removeChild(old);
      }
      setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => {
          if (t.parentNode) t.parentNode.removeChild(t);
          const i = this._toasts.indexOf(t);
          if (i >= 0) this._toasts.splice(i, 1);
        }, 320);
      }, opts.duration || 3400);
    },

    showDeath(game) {
      this.deathScreen.style.display = '';
      this.deathStats.textContent = 'Уровень ' + game.progress.level + ' · Побед: ' + game.stats.kills + ' · Золото: ◈' + game.progress.gold;
    },

    hideDeath() {
      this.deathScreen.style.display = 'none';
    },

    showVictory(game) {
      this.victoryScreen.style.display = '';
      this.victoryStats.textContent =
        'Уровень ' + game.progress.level +
        ' · Побед: ' + game.stats.kills +
        ' · Боссов: ' + game.stats.bosses +
        ' · Тайников: ' + game.stats.secrets +
        ' · Сундуков: ' + game.stats.chests;
    },

    // ---------- Миникарта ----------
    drawMinimap(game) {
      const ctx = this.minimapCtx;
      if (!ctx || !game.world || !game.player) return;
      const w = this.minimap.width, h = this.minimap.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(8,10,18,0.85)';
      ctx.fillRect(0, 0, w, h);
      const data = game.world.minimapData();
      const sx = w / data.worldW, sy = h / data.worldH;
      const py = (game.player.y / data.worldH) * h;

      ctx.fillStyle = 'rgba(90,100,150,0.25)';
      ctx.fillRect(0, (game.world.floorY / data.worldH) * h, w, 3);

      // Границы зон
      (data.zones || []).forEach((z, i) => {
        if (i === 0) return;
        ctx.fillStyle = 'rgba(160,108,255,0.25)';
        ctx.fillRect(Math.round(z.x * sx), 2, 1, h - 4);
      });
      // Алтари
      (data.shrines || []).forEach((s) => {
        ctx.fillStyle = '#7affc8';
        ctx.fillRect(s.x * sx - 1, s.y * sy - 1, 3, 3);
      });
      // Лор
      (data.lore || []).forEach((l) => {
        if (l.read) return;
        ctx.fillStyle = 'rgba(255,210,74,0.8)';
        ctx.fillRect(l.x * sx, l.y * sy, 2, 2);
      });

      // Секреты: показываем только рядом
      data.secrets.forEach((s) => {
        if (Math.abs(s.x - game.player.x) > 520) return;
        ctx.fillStyle = '#6ad7ff';
        ctx.fillRect(s.x * sx - 1, s.y * sy - 1, 3, 3);
      });
      // Сундуки
      data.chests.forEach((c) => {
        ctx.fillStyle = c.tier === 'legendary' ? '#ffd24a' : c.tier === 'epic' ? '#b06cff' : c.tier === 'rare' ? '#4aa8ff' : '#9aa0c0';
        ctx.fillRect(c.x * sx - 1, (c.y + 10) * sy - 1, 3, 3);
      });
      // Загадки
      data.puzzles.forEach((p) => {
        ctx.fillStyle = '#c08cff';
        ctx.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
      });
      // Враги
      game.monsters.forEach((m) => {
        if (m.dead) return;
        ctx.fillStyle = m.isBoss ? '#ff4a4a' : '#e86a5a';
        const size = m.isBoss ? 5 : 2;
        ctx.fillRect((m.x + m.w / 2) * sx - size / 2, (m.y + m.h / 2) * sy - size / 2, size, size);
      });
      // Игрок
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect((game.player.x + game.player.w / 2) * sx - 2, (game.player.y + game.player.h / 2) * sy - 2, 4, 4);
      ctx.strokeStyle = 'rgba(160,108,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    },

    // ---------- Масштабирование ----------
    applyScale() {
      const wrap = document.querySelector('.game-wrap');
      if (!wrap) return;
      let insets = { top: 0, right: 0, bottom: 0, left: 0 };
      if (window.TG && window.TG.safeInsets) insets = window.TG.safeInsets();
      const availW = Math.max(240, window.innerWidth - insets.left - insets.right - 8);
      const availH = Math.max(160, window.innerHeight - insets.top - insets.bottom - 8);
      const scale = Math.min(availW / 960, availH / 540);
      this._scale = scale;
      wrap.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      const dx = (insets.left - insets.right) / 2;
      const dy = (insets.top - insets.bottom) / 2;
      wrap.style.left = 'calc(50% + ' + dx + 'px)';
      wrap.style.top = 'calc(50% + ' + dy + 'px)';
      document.documentElement.style.setProperty('--game-scale', scale.toFixed(3));
      const rotate = document.getElementById('rotate-hint');
      if (rotate) {
        const touchDevice = document.body.classList.contains('touch-device') || !!this.touch;
        const portrait = window.innerHeight > window.innerWidth * 1.02;
        rotate.classList.toggle('show', touchDevice && portrait && !this._portraitDismissed);
      }
    }
  };

  window.UI = UI;
})();
