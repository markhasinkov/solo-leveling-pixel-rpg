// dialogue.js — диалоги, листание реплик, портреты говорящих.
(function () {
  'use strict';

  class DialogueManager {
    constructor() {
      this.active = false;
      this.lines = [];
      this.index = 0;
      this.onFinish = null;
    }

    start(lines, onFinish) {
      if (!lines || !lines.length) { if (onFinish) onFinish(); return; }
      this.lines = lines;
      this.index = 0;
      this.onFinish = onFinish || null;
      this.active = true;
      UI.showDialog(this.current());
      AudioFX.play('ui');
    }

    current() {
      const line = this.lines[this.index];
      if (!line) return null;
      return {
        speaker: line.speaker || '???',
        text: line.text || '',
        icon: line.icon || null,
        index: this.index,
        total: this.lines.length
      };
    }

    advance() {
      if (!this.active) return;
      this.index++;
      AudioFX.play('ui');
      if (this.index >= this.lines.length) this.close();
      else UI.showDialog(this.current());
    }

    close() {
      this.active = false;
      this.lines = [];
      this.index = 0;
      const fin = this.onFinish;
      this.onFinish = null;
      UI.hideDialog();
      if (fin) fin();
    }
  }

  window.Dialogue = new DialogueManager();
})();
