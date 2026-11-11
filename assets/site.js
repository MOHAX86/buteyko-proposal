/* Buteyko site 2.0: control-pause test → bot, video facades, methodist filter, book viewer, route card, QR, tracking.
   Every visible string is in the page or in the dictionary below (uk / ru). */
(() => {
  const RU = document.documentElement.lang === 'ru';
  const L = RU ? {
    hold: 'Держите паузу. При первом желании вдохнуть жмите «Стоп».',
    stop: 'Стоп', again: 'Ещё раз',
    yours: s => 'Ваша контрольная пауза: ' + s + ' с. Сделайте спокойный вдох носом.',
    bands: ['Очень короткая пауза. В методе Бутейко это признак выраженной гипервентиляции. Начинать стоит под наблюдением методиста.',
      'Короткая пауза: вы дышите заметно больше нормы. Именно с такими цифрами чаще всего приходят на курс.',
      'Средний уровень. Есть куда расти: за курс ученики обычно учатся стабильно удлинять паузу.',
      'Хороший результат, близкий к норме Бутейко. Курс поможет закрепить его в повседневной жизни.',
      'Норма по Бутейко: 60 секунд и больше. Вам может быть интересно обучение на методиста.'],
    bot: s => 'Получить план под мои ' + s + ' с'
  } : {
    hold: 'Тримайте паузу. При першому бажанні вдихнути тисніть «Стоп».',
    stop: 'Стоп', again: 'Ще раз',
    yours: s => 'Ваша контрольна пауза: ' + s + ' с. Зробіть спокійний вдих носом.',
    bands: ['Дуже коротка пауза. У методі Бутейка це ознака вираженої гіпервентиляції. Починати варто під наглядом методиста.',
      'Коротка пауза: ви дихаєте помітно більше норми. Саме з такими цифрами найчастіше приходять на курс.',
      'Середній рівень. Є куди рости: за курс учні зазвичай вчаться стабільно подовжувати паузу.',
      'Добрий результат, близький до норми Бутейка. Курс допоможе закріпити його в повсякденні.',
      'Норма за Бутейком: 60 секунд і більше. Вам може бути цікаве навчання на методиста.'],
    bot: s => 'Отримати план під мої ' + s + ' с'
  };

  /* tracking: events go to dataLayer (GA4 / GTM) and Meta Pixel when the client adds their IDs in the page head */
  const track = (name, params = {}) => {
    try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...params }); } catch (e) {}
    try { if (window.fbq) window.fbq('trackCustom', name, params); } catch (e) {}
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href');
    if (h.includes('t.me/buteyko_bot')) track('bot_click', { where: a.dataset.where || 'page' });
    else if (h.includes('t.me/')) track('consult_click', { where: a.dataset.where || 'page' });
  });

  /* control-pause test */
  const cp = document.querySelector('[data-cp]');
  if (cp) {
    const ring = cp.querySelector('.cp__ring'), sec = cp.querySelector('[data-cp-sec]'), step = cp.querySelector('[data-cp-step]');
    const btn = cp.querySelector('[data-cp-btn]'), res = cp.querySelector('[data-cp-result]'), cta = cp.querySelector('[data-cp-cta]');
    const bars = cp.querySelectorAll('.cp__scale span'), limits = [10, 20, 40, 60, Infinity];
    let t0 = 0, raf = 0, running = false;
    const tick = () => { const s = (performance.now() - t0) / 1000; sec.textContent = Math.floor(s); ring.style.setProperty('--p', Math.min(s / 60, 1)); raf = requestAnimationFrame(tick); };
    btn.addEventListener('click', () => {
      if (!running) {
        running = true; cp.classList.add('is-running'); res.hidden = true; cta.hidden = true; bars.forEach(b => b.classList.remove('is-on'));
        step.textContent = L.hold; btn.textContent = L.stop; t0 = performance.now(); tick(); track('cp_start');
      } else {
        running = false; cancelAnimationFrame(raf); cp.classList.remove('is-running');
        const s = Math.round((performance.now() - t0) / 1000); sec.textContent = s;
        const i = limits.findIndex(l => s < l); bars[i].classList.add('is-on');
        step.textContent = L.yours(s); res.textContent = L.bands[i]; res.hidden = false;
        cta.href = 'https://t.me/buteyko_bot?start=cp_' + s + (RU ? '_ru' : '_uk');
        cta.querySelector('[data-cp-cta-label]').textContent = L.bot(s);
        cta.hidden = false; btn.textContent = L.again; track('cp_result', { seconds: s, band: i });
      }
    });
  }

  /* problem tiles jump to the test */
  document.querySelectorAll('[data-problem]').forEach(t => t.addEventListener('click', () => track('problem_tile', { topic: t.dataset.problem })));

  /* video facades: the iframe loads only after a click */
  document.querySelectorAll('[data-vid]').forEach(v => v.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + v.dataset.vid + '?autoplay=1&rel=0';
    f.title = v.getAttribute('aria-label'); f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    const d = document.createElement('div'); d.className = v.className; d.appendChild(f); v.replaceWith(d); track('video_play', { id: v.dataset.vid });
  }));

  /* methodist directory filter */
  const md = document.querySelector('[data-md]');
  if (md) document.querySelectorAll('.md__f').forEach(f => f.addEventListener('click', () => {
    document.querySelectorAll('.md__f').forEach(x => x.setAttribute('aria-pressed', x === f ? 'true' : 'false'));
    md.querySelectorAll('li').forEach(li => { li.hidden = !(f.dataset.f === 'all' || li.dataset.c === f.dataset.f || li.dataset.c === 'all'); });
  }));

  /* book viewer */
  const bk = document.querySelector('[data-book]');
  if (bk) { const main = bk.querySelector('[data-bk-main]');
    bk.querySelectorAll('.bk__t').forEach(t => t.addEventListener('click', () => {
      bk.querySelectorAll('.bk__t').forEach(x => x.setAttribute('aria-pressed', x === t ? 'true' : 'false'));
      main.style.opacity = 0; setTimeout(() => { main.src = t.dataset.src; main.alt = t.dataset.alt; main.style.opacity = 1; }, 180);
    })); }

  /* route: the sticky course card follows the stage in view */
  const rt = document.querySelector('[data-rt]');
  if (rt && 'IntersectionObserver' in window) {
    const num = rt.querySelector('[data-rt-num]'), idx = rt.querySelector('[data-rt-i]'), bars = rt.querySelectorAll('.rt__bar span');
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const i = +e.target.dataset.i;
      num.textContent = '0' + i; idx.textContent = i; bars.forEach((b, k) => b.classList.toggle('on', k < i)); }), { rootMargin: '-45% 0px -45% 0px' });
    rt.querySelectorAll('.rt__st').forEach(st => io.observe(st));
  }

  /* QR codes (desktop) */
  const drawQR = () => document.querySelectorAll('[data-qr]').forEach(el => { if (!window.qrcode) return; const q = qrcode(0, 'M'); q.addData(el.dataset.qr); q.make(); el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); });
  if (window.qrcode) drawQR(); else window.addEventListener('load', drawQR);
})();
