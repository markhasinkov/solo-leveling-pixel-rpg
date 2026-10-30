// shadows.js — данные теневой армии: стили союзников, извлечение и прокачка.
(function () {
  'use strict';

  const DEFS = {
    igris: {
      id: 'igris', name: 'Игрис', title: 'Рыцарь крови',
      portrait: 'assets/sprites/portraits/igris.png', cutin: 'assets/sprites/cutins/cutin_igris.jpg',
      animId: 'igris', drawW: 78, drawH: 78, color: '#a06cff', chapter: 5,
      atkPct: 0.5, attackCd: 0.8, range: 54, moveSpeed: 235, style: 'slash',
      passive: 'Удары иногда оглушают противника.',
      upgrade: '+12% урона и +4% скорости атаки за уровень.',
      quote: 'Восстань.',
      lines: [
        { speaker: 'Система', text: 'Обнаружена тень противника, достойного служить. Извлечение доступно.' },
        { speaker: 'igris', text: 'Я служил своему королю даже после смерти. Теперь мой клинок — твой, Монарх.' },
        { speaker: 'Система', text: 'Тень Игриса присоединилась к армии теней.' }
      ]
    },
    baruka: {
      id: 'baruka', name: 'Барука', title: 'Вождь ледяных эльфов',
      portrait: 'assets/sprites/portraits/baruka.png', cutin: 'assets/sprites/cutins/cutin_baruka.jpg',
      animId: 'baruka', drawW: 76, drawH: 76, color: '#bfe6f7', chapter: 6,
      atkPct: 0.38, attackCd: 0.9, range: 340, moveSpeed: 195, style: 'projectile',
      slow: 1.5,
      passive: 'Ледяные клинки замедляют врагов.',
      upgrade: '+12% урона и +4% скорости атаки за уровень.',
      quote: 'Мой клан не исчезнет.',
      lines: [
        { speaker: 'Система', text: 'Тень ледяного вождя достаточно сильна, чтобы служить. Извлечение доступно.' },
        { speaker: 'baruka', text: 'Мой клан не исчезнет. Если мои клинки нужны тебе — я приму твою волю.' },
        { speaker: 'Система', text: 'Тень Баруки присоединилась к армии теней.' }
      ]
    },
    beru: {
      id: 'beru', name: 'Беру', title: 'Король муравьёв',
      portrait: 'assets/sprites/portraits/beru.png', cutin: 'assets/sprites/cutins/cutin_beru.jpg',
      animId: 'beru', drawW: 86, drawH: 86, color: '#c08cff', chapter: 9,
      atkPct: 0.46, attackCd: 0.55, range: 52, moveSpeed: 265, style: 'multi',
      lifesteal: 0.08,
      passive: 'Лечит игрока на 8% нанесённого урона.',
      upgrade: '+12% урона и +4% скорости атаки за уровень.',
      quote: 'Хо-хо. Беру служит сильнейшему.',
      lines: [
        { speaker: 'Система', text: 'Тень короля улья отзывается на силу победителя. Извлечение доступно.' },
        { speaker: 'beru', text: 'Хо-хо... Сильнейший победил Беру. Теперь Беру будет служить тебе, Монарх.' },
        { speaker: 'Система', text: 'Тень Беру присоединилась к армии теней.' }
      ]
    }
  };

  const UPGRADE_COSTS = [1, 2, 3, 4];

  window.ShadowArmy = {
    DEFS: DEFS,
    MAX: 2,
    ids() { return Object.keys(DEFS); },
    def(id) { return DEFS[id] || null; },
    upgradeCost(level) {
      return UPGRADE_COSTS[Math.max(0, Math.min(UPGRADE_COSTS.length - 1, (level || 1) - 1))];
    }
  };
})();
