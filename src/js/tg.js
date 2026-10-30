// tg.js — Telegram Mini App: тема, safe-area, haptics, CloudStorage, fullscreen.
(function () {
  'use strict';

  const TG = {
    webapp: null,
    isTelegram: false,
    ui: null,
    _cloudPrefix: 'sl_save_',
    _chunkSize: 1300,
    _lastCloudAt: 0,

    init(ui) {
      this.ui = ui;
      const wa = window.Telegram && window.Telegram.WebApp;
      if (wa) this.webapp = wa;
      this.isTelegram = !!(wa && wa.initData && wa.initData.length > 0);
      if (this.isTelegram) {
        try { wa.ready(); } catch (e) { /* noop */ }
        try { wa.expand(); } catch (e) { /* noop */ }
        if (this.supports('6.1')) {
          try { wa.setHeaderColor('#0b0c14'); } catch (e) { /* noop */ }
          try { wa.setBackgroundColor('#0b0c14'); } catch (e) { /* noop */ }
        }
        if (this.supports('7.7')) {
          try { if (wa.disableVerticalSwipes) wa.disableVerticalSwipes(); } catch (e) { /* noop */ }
        }
        if (this.supports('6.2')) {
          try { if (wa.enableClosingConfirmation) wa.enableClosingConfirmation(); } catch (e) { /* noop */ }
        }
        try {
          if (wa.onEvent) wa.onEvent('viewportChanged', () => { if (this.ui) this.ui.applyScale(); });
          if (wa.onEvent) wa.onEvent('themeChanged', () => { if (this.ui) this.ui.applyScale(); });
        } catch (e) { /* noop */ }
        document.body.classList.add('tg');
      }
      if (this.isTelegram || 'ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
      }
      this.updateCssInsets();
      if (this.ui) this.ui.applyScale();
    },

    supports(version) {
      if (!this.webapp) return false;
      try {
        return !this.webapp.isVersionAtLeast || this.webapp.isVersionAtLeast(version);
      } catch (e) {
        return false;
      }
    },

    safeInsets() {
      const wa = this.webapp;
      if (wa && wa.safeAreaInset) {
        return {
          top: wa.safeAreaInset.top || 0,
          right: wa.safeAreaInset.right || 0,
          bottom: wa.safeAreaInset.bottom || 0,
          left: wa.safeAreaInset.left || 0
        };
      }
      return { top: 0, right: 0, bottom: 0, left: 0 };
    },

    updateCssInsets() {
      const i = this.safeInsets();
      const root = document.documentElement;
      root.style.setProperty('--safe-top', i.top + 'px');
      root.style.setProperty('--safe-right', i.right + 'px');
      root.style.setProperty('--safe-bottom', i.bottom + 'px');
      root.style.setProperty('--safe-left', i.left + 'px');
    },

    haptic(type) {
      const wa = this.webapp;
      if (!wa || !wa.HapticFeedback) return;
      try {
        if (type === 'success' || type === 'warning' || type === 'error') wa.HapticFeedback.notificationOccurred(type);
        else wa.HapticFeedback.impactOccurred(type || 'light');
      } catch (e) { /* noop */ }
    },

    fullscreen() {
      if (this.isTelegram && this.supports('8.0') && this.webapp.requestFullscreen) {
        try { this.webapp.requestFullscreen(); return; } catch (e) { /* noop */ }
      }
      const root = document.documentElement;
      if (root.requestFullscreen) {
        try { root.requestFullscreen(); } catch (e) { /* noop */ }
      }
    },

    // ---------- CloudStorage (с чанками) ----------
    _getItem(key) {
      return new Promise((resolve) => {
        try {
          this.webapp.CloudStorage.getItem(key, (err, value) => {
            if (err || value == null) resolve(null);
            else resolve(value);
          });
        } catch (e) { resolve(null); }
      });
    },

    _setItem(key, value) {
      return new Promise((resolve) => {
        try {
          this.webapp.CloudStorage.setItem(key, value, (err) => resolve(!err));
        } catch (e) { resolve(false); }
      });
    },

    _removeItem(key) {
      return new Promise((resolve) => {
        try {
          this.webapp.CloudStorage.removeItem(key, () => resolve(true));
        } catch (e) { resolve(false); }
      });
    },

    async cloudGet(name) {
      if (!this.isTelegram || !this.supports('6.9') || !this.webapp || !this.webapp.CloudStorage) return null;
      const metaRaw = await this._getItem(this._cloudPrefix + name + '_meta');
      if (!metaRaw) return null;
      let meta;
      try { meta = JSON.parse(metaRaw); } catch (e) { return null; }
      if (!meta || !meta.chunks) return null;
      const parts = [];
      for (let i = 0; i < meta.chunks; i++) {
        const chunk = await this._getItem(this._cloudPrefix + name + '_' + i);
        if (chunk == null) return null;
        parts.push(chunk);
      }
      try { return JSON.parse(parts.join('')); } catch (e) { return null; }
    },

    async cloudSet(name, obj) {
      if (!this.isTelegram || !this.supports('6.9') || !this.webapp || !this.webapp.CloudStorage) return false;
      if (Date.now() - this._lastCloudAt < 18000) return false;
      this._lastCloudAt = Date.now();
      let json;
      try { json = JSON.stringify(obj); } catch (e) { return false; }
      const chunks = [];
      for (let i = 0; i < json.length; i += this._chunkSize) chunks.push(json.slice(i, i + this._chunkSize));
      for (let i = 0; i < chunks.length; i++) {
        const ok = await this._setItem(this._cloudPrefix + name + '_' + i, chunks[i]);
        if (!ok) return false;
      }
      const okMeta = await this._setItem(this._cloudPrefix + name + '_meta', JSON.stringify({ chunks: chunks.length, savedAt: Date.now() }));
      // Чистим хвосты от прошлых сохранений
      for (let i = chunks.length; i < chunks.length + 6; i++) {
        const tail = await this._getItem(this._cloudPrefix + name + '_' + i);
        if (tail == null) break;
        await this._removeItem(this._cloudPrefix + name + '_' + i);
      }
      return okMeta;
    },

    async cloudRemove(name) {
      if (!this.isTelegram || !this.supports('6.9') || !this.webapp || !this.webapp.CloudStorage) return;
      const metaRaw = await this._getItem(this._cloudPrefix + name + '_meta');
      let chunks = 0;
      try { chunks = JSON.parse(metaRaw).chunks || 0; } catch (e) { /* noop */ }
      for (let i = 0; i < chunks + 6; i++) await this._removeItem(this._cloudPrefix + name + '_' + i);
      await this._removeItem(this._cloudPrefix + name + '_meta');
    }
  };

  window.TG = TG;
})();
