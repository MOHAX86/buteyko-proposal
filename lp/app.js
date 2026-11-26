(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  root.classList.add('js');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const TG = 'https://t.me/alikmullahmetov';
  const BOT = 'https://t.me/buteyko_bot';

  /* меню и шапка */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('open', open);
    menu.inert = !open;
    $('main').inert = open;
    document.body.classList.toggle('lock', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 1120px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* первый экран: кружки меняют фото, подпись и тон */
  const hero0 = $('#top'), slidesEl = $$('.m-slide', hero0), picksEl = $$('.m-pick', hero0);
  const mData = JSON.parse($('#m-data').textContent), mText = $('#m-text'), mRole = $('#m-role');
  const showSlide = (i) => {
    const d = mData[i];
    slidesEl.forEach((s, k) => s.classList.toggle('on', k === i));
    picksEl.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    hero0.dataset.tone = d.tone; hero0.style.setProperty('--c', d.bg);
    [[mText, d.text], [mRole, d.role]].forEach(([el, t]) => { el.textContent = t; el.classList.remove('fade'); void el.offsetWidth; el.classList.add('fade'); });
    toneNav();
  };
  const toneNav = () => nav.classList.toggle('on-dark', hero0.dataset.tone === 'dark' && innerWidth >= 900 && hero0.getBoundingClientRect().bottom > 80);
  picksEl.forEach((b, k) => b.addEventListener('click', () => showSlide(k)));
  addEventListener('scroll', toneNav, { passive: true }); addEventListener('resize', toneNav);
  slidesEl.forEach((s) => { const im = $('img', s); im.loading = 'eager'; });

  /* прокрутка: шапка, линия маршрута, нижняя кнопка телефона */
  const hero = $('#top'), bar = $('#bar'), contacts = $('#contacts'), path = $('#path'), steps = $$('li', path);
  const foot = $('.foot');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    nav.classList.toggle('solid', scrollY > 20);
    const h = innerHeight;
    const past = hero.getBoundingClientRect().bottom < h * 0.45;
    const ending = contacts.getBoundingClientRect().top < h * 0.75 || foot.getBoundingClientRect().top < h;
    const busy = ['#timer', '#quiz'].some((id) => { const r = $(id).getBoundingClientRect(); return r.top < h * 0.8 && r.bottom > h * 0.35; });
    const show = past && !ending && !busy;
    bar.classList.toggle('show', show);
    bar.inert = !show;
    const r = path.getBoundingClientRect();
    const p = calm.matches ? 1 : Math.min(1, Math.max(0, (h * 0.62 - r.top) / Math.max(1, r.height - 40)));
    path.style.setProperty('--p', p.toFixed(3));
    steps.forEach((li) => li.classList.toggle('on', calm.matches || li.getBoundingClientRect().top < h * 0.64));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* линия дыхания дорисовывается, когда до неё дошли */
  const line = $('#breath-line');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { line.classList.add('on'); o.disconnect(); } }), { rootMargin: '0px 0px -15% 0px' }).observe(line);
  } else line.classList.add('on');

  /* две волны дыхания */
  const box = $('#paradox'), wave = $('#wave-path');
  const forms = { over: { amp: 70, waves: 7 }, calm: { amp: 30, waves: 2.5 } };
  let cur = { ...forms.over }, phase = 0, seen = false, raf = 0, last = 0;
  const draw = () => {
    let d = '';
    for (let x = 0; x <= 600; x += 5) {
      const y = 90 - cur.amp * Math.sin((x / 600) * cur.waves * Math.PI * 2 - phase);
      d += (x ? ' L' : 'M') + x + ' ' + y.toFixed(1);
    }
    wave.setAttribute('d', d);
  };
  const tick = (t) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const target = forms[box.dataset.mode];
    const k = Math.min(1, dt * 4);
    cur.amp += (target.amp - cur.amp) * k;
    cur.waves += (target.waves - cur.waves) * k;
    phase += dt * (box.dataset.mode === 'over' ? 4.2 : 1.1);
    draw();
    raf = seen ? requestAnimationFrame(tick) : 0;
  };
  draw();
  new IntersectionObserver((es) => {
    seen = es[0].isIntersecting && !calm.matches;
    if (seen && !raf) { last = 0; raf = requestAnimationFrame(tick); }
  }).observe(box);

  const segment = (rootEl, apply) => {
    $$('.seg button', rootEl).forEach((b) => b.addEventListener('click', () => {
      $$('.seg button', rootEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply(b.dataset.set);
    }));
  };
  segment(box, (v) => { box.dataset.mode = v; if (calm.matches) { cur = { ...forms[v] }; draw(); } });
  const cmp = $('#cmp');
  segment(cmp, (v) => { cmp.dataset.show = v; });

  /* тест паузы: отдых 2 минуты, затем замер */
  const REST = 120;
  const timer = $('#timer'), num = $('#dial-num'), label = $('#dial-label'), msg = $('#timer-msg'), fg = $('#dial-fg');
  const main = $('#timer-main'), skip = $('#timer-skip'), result = $('#timer-result'), send = $('#timer-send');
  let state = 'idle', t0 = 0, iv = 0;
  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const button = (icon, text) => { main.innerHTML = '<i class="ph ph-' + icon + '" aria-hidden="true"></i><span>' + text + '</span>'; };
  const mark = (n) => [1, 2, 3].forEach((i) => $('#how-' + i).classList.toggle('now', i === n));
  const ring = (v) => { fg.style.strokeDashoffset = String(1 - Math.max(0, Math.min(1, v))); };
  const go = (next, seconds) => {
    state = next; clearInterval(iv); timer.dataset.state = next;
    result.hidden = next !== 'done';
    main.hidden = next === 'done';
    skip.hidden = !(next === 'idle' || next === 'rest');
    if (next === 'idle') {
      num.textContent = mmss(REST); label.textContent = 'отдых перед замером'; ring(0); mark(0);
      msg.textContent = 'Сядьте удобно и начните с двух минут покоя.';
      button('play', 'Начать две минуты отдыха');
    }
    if (next === 'rest') {
      t0 = performance.now(); mark(1);
      msg.textContent = 'Сидите спокойно и дышите как обычно.';
      label.textContent = 'идёт отдых';
      button('x', 'Отменить');
      const upd = () => {
        const left = REST - (performance.now() - t0) / 1000;
        if (left <= 0) return go('ready');
        num.textContent = mmss(Math.ceil(left)); ring(1 - left / REST);
      };
      upd(); iv = setInterval(upd, 250);
    }
    if (next === 'ready') {
      num.textContent = '0'; label.textContent = 'секунд'; ring(0); mark(2);
      msg.textContent = 'Обычный неглубокий выдох, зажмите нос и нажмите «Старт».';
      button('play', 'Старт');
    }
    if (next === 'run') {
      t0 = performance.now(); mark(3);
      msg.textContent = 'При первом желании вдохнуть нажмите «Стоп».';
      button('stop', 'Стоп');
      const upd = () => {
        const s = (performance.now() - t0) / 1000;
        num.textContent = String(Math.floor(s)); ring((s % 60) / 60);
      };
      upd(); iv = setInterval(upd, 100);
    }
    if (next === 'done') {
      mark(0); num.textContent = String(seconds); label.textContent = 'секунд, ваша пауза'; ring(1);
      msg.textContent = 'Дышите спокойно. Запишите цифру и назовите её на бесплатной консультации.';
      send.href = TG + '?text=' + encodeURIComponent('Консультация. Моя контрольная пауза: ' + seconds + ' с.');
    }
  };
  main.addEventListener('click', () => {
    if (state === 'idle') go('rest');
    else if (state === 'rest') go('idle');
    else if (state === 'ready') go('run');
    else if (state === 'run') go('done', Math.floor((performance.now() - t0) / 1000));
  });
  skip.addEventListener('click', () => { go('ready'); main.focus(); });
  $('#timer-again').addEventListener('click', () => { go('idle'); main.focus(); });

  /* подбор формата: без полей и без сбора данных */
  const body = $('#quiz-body'), qbar = $('#quiz-bar');
  const icon = (n) => '<i class="ph ph-' + n + '" aria-hidden="true"></i>';
  const link = (cls, url, ic, text) => '<a class="btn ' + cls + '" href="' + url + '" target="_blank" rel="noopener">' + icon(ic) + '<span>' + text + '</span></a>';
  const say = (text) => TG + '?text=' + encodeURIComponent(text);
  const Q1 = { title: 'Что для вас сейчас главное?', answers: [
    ['self', 'Освоить спокойное дыхание для себя'], ['personal', 'Заниматься лично с методистом'],
    ['teach', 'Самому обучать методу других'], ['child', 'Помочь своему ребёнку']] };
  const Q2 = { title: 'Вы уже пробовали метод?', answers: [
    ['new', 'Только слышал(а)'], ['video', 'Пробовал(а) по видео или книгам'], ['pro', 'Уже занимался(лась) с методистом']] };
  const RESULTS = {
    lessons: { h: 'Начните с бесплатных уроков', p: 'Познакомьтесь с методом в Telegram-боте. Когда появятся вопросы, обсудите их на бесплатном разговоре.',
      a: link('btn-main', BOT, 'graduation-cap', 'Бесплатные уроки'), b: link('btn-ghost', TG, 'telegram-logo', 'Получить консультацию') },
    course: { h: 'Присмотритесь к личному курсу', p: '10 занятий с методистом и чат между ними. На бесплатном разговоре Алик честно скажет, подходит ли вам курс.',
      a: link('btn-main', say('Консультация. Хочу личное обучение.'), 'telegram-logo', 'Получить консультацию'), b: link('btn-ghost', BOT, 'graduation-cap', 'Бесплатные уроки') },
    teach: { h: 'Обучение методистов ВЛГД', p: '2 месяца, 10 личных встреч, стажировка и аттестация. Первый разговор бесплатный.',
      a: link('btn-main', say('Консультация. Хочу стать методистом.'), 'telegram-logo', 'Получить консультацию'), b: link('btn-ghost', 'https://buteykolive.com/ru-metodistam', 'certificate', 'Программа обучения') },
    child: { h: 'Начните с книги для родителей', p: 'Основы метода, контрольная пауза и игры для совместного чтения с ребёнком. Занятия ребёнка согласуйте с врачом.',
      a: link('btn-main', 'https://buteykolive.com/ru-deti', 'books', 'О книге'), b: link('btn-ghost', say('Консультация. Вопрос о занятиях для ребёнка.'), 'telegram-logo', 'Получить консультацию') },
  };
  let first = null;
  const focus = () => { const h = $('.q-title', body); if (h) h.focus({ preventScroll: true }); };
  const ask = (n, user) => {
    const q = n === 1 ? Q1 : Q2;
    qbar.style.transform = 'scaleX(' + (n === 1 ? 0.08 : 0.5) + ')';
    body.innerHTML = '<p class="q-step">Вопрос ' + n + ' из 2</p><h3 class="q-title" tabindex="-1">' + q.title + '</h3><div class="q-answers' + (n === 2 ? ' three' : '') + '">' +
      q.answers.map((a) => '<button type="button" data-v="' + a[0] + '"><span>' + a[1] + '</span>' + icon('arrow-right') + '</button>').join('') + '</div>' +
      (n === 2 ? '<button type="button" class="btn-text" data-back>Назад</button>' : '');
    $$('[data-v]', body).forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.v;
      if (n === 1) { first = v; if (v === 'teach' || v === 'child') show(v); else ask(2, true); }
      else show(first === 'self' && v === 'new' ? 'lessons' : 'course');
    }));
    const back = $('[data-back]', body);
    if (back) back.addEventListener('click', () => ask(1, true));
    if (user) focus();
  };
  const show = (key) => {
    const r = RESULTS[key];
    qbar.style.transform = 'scaleX(1)';
    body.innerHTML = '<div class="q-result" data-result="' + key + '"><h3 class="q-title" tabindex="-1">' + r.h + '</h3><p>' + r.p + '</p>' + r.a + r.b +
      '<button type="button" class="btn-text" data-again>Пройти заново</button></div>';
    $('[data-again]', body).addEventListener('click', () => ask(1, true));
    focus();
  };
  ask(1, false);
})();
