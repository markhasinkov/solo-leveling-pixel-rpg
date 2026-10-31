// bonds.js — тихие вечера в штабе Ахджин: Ча Хэ-Ин, семья и Эсиль.
(function () {
  'use strict';

  const BONDS = [
    {
      id: 'cha',
      name: 'Ча Хэ-Ин',
      role: 'S-ранг · гильдия «Охотники»',
      portrait: 'assets/sprites/portraits/cha-hae-in.png',
      stages: [
        {
          id: 'cha-1', chapter: 10, title: 'После спарринга', cutin: 'assets/sprites/cutins/cutin_cha_hae_in.jpg',
          hint: 'Хэ-Ин хочет поговорить наедине после тренировки.',
          bonus: { permAtk: 4 },
          lines: [
            { speaker: 'cha-hae-in', text: 'Ты снова сдержался. Я чувствовала, что твой клинок мог остановить мой в любой момент.' },
            { speaker: 'sung-jin-woo', text: 'Спарринг не должен заканчиваться травмой.' },
            { speaker: 'cha-hae-in', text: 'Значит, ты бережёшь не только себя. Странно... мне это нравится.' },
            { speaker: 'sung-jin-woo', text: 'Тогда в следующий раз я не буду сдерживаться. Обещаю.' }
          ]
        },
        {
          id: 'cha-2', chapter: 11, title: 'Кофе на крыше',
          hint: 'Хэ-Ин ждёт на крыше штаба с двумя чашками.',
          bonus: { permHp: 12 },
          lines: [
            { speaker: 'cha-hae-in', text: 'После Чеджу я стала чаще смотреть на небо. Будто жду, что оттуда снова что-то придёт.' },
            { speaker: 'sung-jin-woo', text: 'Тогда смотри на меня. Я вернусь.' },
            { speaker: 'cha-hae-in', text: 'Обещания охотников плохо заканчиваются.' },
            { speaker: 'sung-jin-woo', text: 'Значит, я буду исключением.' }
          ]
        },
        {
          id: 'cha-3', chapter: 12, title: 'После войны', cutin: 'assets/sprites/cutins/cutin_cha_hae_in.jpg',
          hint: 'Война Монархов позади. Самое время сдержать обещание.',
          bonus: { permAtk: 5, permHp: 15 },
          lines: [
            { speaker: 'cha-hae-in', text: 'Война закончилась. Ты вернулся.' },
            { speaker: 'sung-jin-woo', text: 'Я обещал.' },
            { speaker: 'cha-hae-in', text: 'Тогда... кофе. И, может быть, что-то большее, чем кофе.' },
            { speaker: 'sung-jin-woo', text: 'Я не против. Начнём с кофе.' }
          ]
        }
      ]
    },
    {
      id: 'family',
      name: 'Семья',
      role: 'Сон Джин-А · Сон Иль-Хван · мама',
      portrait: 'assets/sprites/portraits/sung-jin-ah.png',
      stages: [
        {
          id: 'family-1', chapter: 9, title: 'Завтрак дома',
          hint: 'Джин-А зовёт домой: мама впервые встала к столу.',
          bonus: { permHp: 20 },
          lines: [
            { speaker: 'sung-jin-ah', text: 'Оппа, мама впервые за долгое время сама встала к столу.' },
            { speaker: 'sung-jin-woo', text: 'Не давай ей переутомляться.' },
            { speaker: 'sung-il-hwan', text: 'Она уже командует мной, как будто и не было этих лет. Это хороший знак.' },
            { speaker: 'sung-jin-ah', text: 'И ещё... спасибо, что вернул её нам.' }
          ]
        },
        {
          id: 'family-2', chapter: 11, title: 'Семейный ужин',
          hint: 'Дома пахнет едой, а не больницей.',
          bonus: { permMp: 10 },
          lines: [
            { speaker: 'Мама', text: 'Я слышала, ты теперь мастер гильдии. Это правда?' },
            { speaker: 'sung-jin-woo', text: 'Правда. Но готовлю я всё ещё хуже тебя.' },
            { speaker: 'sung-jin-ah', text: 'Он даже чай забывает. Хорошо, что у тебя есть я.' },
            { speaker: 'sung-il-hwan', text: 'За стол, охотники. Пока еда не остыла.' }
          ]
        },
        {
          id: 'family-3', chapter: 12, title: 'Тихое утро', cutin: 'assets/sprites/cutins/cutin_jinwoo.jpg',
          hint: 'После войны дом звучит иначе — спокойно.',
          bonus: { permHp: 20, permMp: 8 },
          lines: [
            { speaker: 'sung-jin-ah', text: 'Оппа, ты снова встал раньше всех.' },
            { speaker: 'sung-jin-woo', text: 'Привычка. После войны тишина кажется слишком громкой.' },
            { speaker: 'sung-jin-ah', text: 'Тогда я включу радио. И разбужу маму — она будет ворчать, что ты не завтракаешь.' },
            { speaker: 'sung-jin-woo', text: 'Это уже похоже на дом.' }
          ]
        }
      ]
    },
    {
      id: 'esil',
      name: 'Эсиль Радиру',
      role: 'Дочь барона демонов · гостья Ахджин',
      portrait: 'assets/sprites/portraits/esil-radiru.png',
      stages: [
        {
          id: 'esil-1', chapter: 9, title: 'Письмо из замка',
          hint: 'Из демонического замка пришло письмо на человеческой бумаге.',
          bonus: { permMp: 5 },
          lines: [
            { speaker: 'yoo-jinho', text: 'Хён, к нам пришло письмо. Оно... пахнет серой и печеньем?' },
            { speaker: 'esil-radiru', text: 'Это я! Научилась писать по-человечески. Долго тренировалась, между прочим.' },
            { speaker: 'sung-jin-woo', text: 'В замке всё спокойно?' },
            { speaker: 'esil-radiru', text: 'Скучновато. Отец занят, демоны воюют за место у кухни. Я хочу увидеть Сеул.' }
          ]
        },
        {
          id: 'esil-2', chapter: 10, title: 'Гостья гильдии',
          hint: 'Эсиль хочет посмотреть, как живут охотники.',
          bonus: { permAtk: 3 },
          lines: [
            { speaker: 'yoo-jinho', text: 'Хён, у нас гостья. Она говорит, что знает тебя. И что ей можно есть всё, что не приколочено.' },
            { speaker: 'esil-radiru', text: 'Это нормальная демоническая вежливость!' },
            { speaker: 'sung-jin-woo', text: 'Оставь ей чай. И спрячь документы гильдии.' },
            { speaker: 'esil-radiru', text: 'Я не читаю документы. Я читаю только меню.' }
          ]
        },
        {
          id: 'esil-3', chapter: 12, title: 'Долг демона',
          hint: 'Эсиль пришла предупредить о Монархах.',
          bonus: { permMp: 8, permAtk: 2 },
          lines: [
            { speaker: 'esil-radiru', text: 'Отец говорит, что Монархи не остановятся. Даже демоны закрывают врата.' },
            { speaker: 'sung-jin-woo', text: 'Значит, придётся встретить их в Сеуле.' },
            { speaker: 'esil-radiru', text: 'Я не воин. Но могу провести тебя через замок, если понадобится.' },
            { speaker: 'sung-jin-woo', text: 'Спасибо. Не каждый демон предлагает помощь человеку.' }
          ]
        }
      ]
    }
  ];

  function byId(id) {
    return BONDS.find((b) => b.id === id) || null;
  }

  function level(game, bondId) {
    const raw = game && game.bonds && game.bonds[bondId];
    return Math.max(0, Math.min(3, raw | 0 || 0));
  }

  function nextStage(game, bond) {
    if (!bond) return null;
    return bond.stages[level(game, bond.id)] || null;
  }

  function unlocked(game, stage) {
    if (!game || !stage) return false;
    return !!game.finished || (game.unlocked | 0) >= (stage.chapter | 0);
  }

  function canStart(game, bond) {
    const stage = nextStage(game, bond);
    return !!(stage && unlocked(game, stage));
  }

  function bonusText(bonus) {
    if (!bonus) return '';
    const parts = [];
    if (bonus.permAtk) parts.push('+' + bonus.permAtk + ' ATK');
    if (bonus.permHp) parts.push('+' + bonus.permHp + ' HP');
    if (bonus.permMp) parts.push('+' + bonus.permMp + ' MP');
    return parts.join(' · ');
  }

  window.Bonds = {
    BONDS,
    byId,
    level,
    nextStage,
    unlocked,
    canStart,
    bonusText
  };
})();
