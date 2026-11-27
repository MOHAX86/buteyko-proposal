/* 27.11.2026: поиск по сайту (кнопка [data-search]) и раскрывающийся пункт «Книги» (details.dd).
   Список страниц: search-ru.json / search-en.json рядом с этим файлом (собирает build/search_index.py). */
(() => {
  const en = document.documentElement.lang === 'en';
  const L = en
    ? { title: 'Search the site', ph: 'What are you looking for?', close: 'Close', none: 'Nothing found. Try another word.', hint: 'For example: control pause, nasal breathing, instructors', fail: 'Search is unavailable right now.' }
    : { title: 'Поиск по сайту', ph: 'Что вы ищете?', close: 'Закрыть', none: 'Ничего не нашлось. Попробуйте другое слово.', hint: 'Например: контрольная пауза, носовое дыхание, методисты', fail: 'Поиск сейчас недоступен.' };
  const src = new URL(en ? 'search-en.json' : 'search-ru.json', document.currentScript.src);

  const css = document.createElement('style');
  css.textContent = `
.srch-btn{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;flex:none;padding:0;border-radius:999px;border:1px solid rgba(0,16,72,.18);background:transparent;color:inherit;cursor:pointer;font:inherit}
.srch-btn:hover{border-color:#001048}
.srch-btn svg{width:20px;height:20px}
.srch{width:min(680px,calc(100vw - 24px));max-height:min(80vh,720px);margin:7vh auto auto;padding:0;border:0;border-radius:20px;background:#fff;color:#001048;box-shadow:0 24px 80px rgba(0,16,72,.3);overflow:hidden}
.srch[open]{display:flex;flex-direction:column}
.srch::backdrop{background:rgba(0,16,72,.45)}
.srch__top{display:flex;gap:8px;padding:16px;border-bottom:1px solid rgba(0,16,72,.12)}
.srch__top input{flex:1;min-width:0;height:48px;padding:0 16px;font:inherit;font-size:18px;color:inherit;background:#fff;border:1px solid rgba(0,16,72,.28);border-radius:12px}
.srch__top input:focus{outline:2px solid #001048;outline-offset:1px}
.srch__x{width:48px;height:48px;flex:none;font-size:26px;line-height:1;color:inherit;background:none;border:0;border-radius:12px;cursor:pointer}
.srch__out{overflow:auto;padding:6px 8px 12px;margin:0;list-style:none}
.srch__out a{display:block;padding:10px 12px;border-radius:12px;text-decoration:none;color:inherit}
.srch__out a:hover,.srch__out a:focus-visible{background:rgba(0,16,72,.06)}
.srch__out b{display:block;font-size:17px;font-weight:700;line-height:1.3}
.srch__out span{display:block;margin-top:2px;font-size:15px;line-height:1.4;opacity:.75}
.srch__out .srch__msg{padding:14px 12px;font-size:16px;opacity:.75}
.dd{position:relative}
.dd>summary{display:inline-flex;align-items:center;gap:6px;min-height:44px;cursor:pointer;list-style:none;white-space:nowrap}
.dd>summary::-webkit-details-marker{display:none}
.dd>summary::after{content:"";width:6px;height:6px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:translateY(-2px) rotate(45deg)}
.dd[open]>summary::after{transform:translateY(1px) rotate(225deg)}
.dd__list{position:absolute;top:calc(100% + 6px);left:-14px;z-index:60;min-width:230px;padding:8px;border-radius:14px;background:#fff;box-shadow:0 12px 40px rgba(0,16,72,.2)}
.nav-links .dd__list a,.dd__list a{display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:10px;color:#001048!important;text-decoration:none;text-transform:none;letter-spacing:0;font-size:16px;white-space:nowrap;opacity:1}
.dd__list a:hover{background:rgba(0,16,72,.07)}
`;
  document.head.appendChild(css);

  /* «Книги»: закрыть по клику мимо и по Esc */
  document.addEventListener('click', e => document.querySelectorAll('details.dd[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('details.dd[open]').forEach(d => { d.open = false; }); });

  let box, input, out, pages;
  const norm = s => s.toLowerCase().replace(/ё/g, 'е');
  /* грубое отсечение окончаний: «паузы», «паузу» → «пауз» */
  const stem = w => w.length > 6 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w;
  const msg = text => { const li = document.createElement('li'); li.className = 'srch__msg'; li.textContent = text; out.replaceChildren(li); };

  function show() {
    const words = norm(input.value).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1).map(stem);
    if (!words.length) return msg(L.hint);
    if (!pages) return;
    const found = [];
    pages.forEach((p, i) => {
      let score = 0;
      for (const w of words) {
        const s = (p._t.includes(w) ? 10 : 0) + (p._d.includes(w) ? 3 : 0) + (p._h.includes(w) ? 1 : 0);
        if (!s) return;
        score += s;
      }
      found.push([score + (p.m ? 5 : 0), i, p]);
    });
    if (!found.length) return msg(L.none);
    found.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    out.replaceChildren(...found.slice(0, 25).map(([, , p]) => {
      const li = document.createElement('li'), a = document.createElement('a'), b = document.createElement('b'), s = document.createElement('span');
      a.href = new URL(p.u, new URL('..', src)).href; b.textContent = p.t; s.textContent = p.d; a.append(b, s); li.append(a); return li;
    }));
  }

  function build() {
    box = document.createElement('dialog'); box.className = 'srch'; box.setAttribute('aria-label', L.title);
    box.innerHTML = '<div class="srch__top"><input type="search" autocomplete="off" enterkeyhint="search"><button type="button" class="srch__x">×</button></div><ul class="srch__out" aria-live="polite"></ul>';
    document.body.appendChild(box);
    input = box.querySelector('input'); out = box.querySelector('ul');
    input.placeholder = L.ph; input.setAttribute('aria-label', L.title);
    box.querySelector('button').setAttribute('aria-label', L.close);
    box.querySelector('button').addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    input.addEventListener('input', show);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = out.querySelector('a'); if (a) a.click(); } });
    fetch(src).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(list => {
      pages = list.map(p => Object.assign(p, { _t: norm(p.t), _d: norm(p.d), _h: norm(p.h || '') })); show();
    }).catch(() => msg(L.fail));
  }

  function open() {
    document.querySelectorAll('details.dd[open]').forEach(d => { d.open = false; });
    if (!box) build();
    if (!box.open) box.showModal();
    input.focus(); input.select(); show();
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-search]')) { e.preventDefault(); e.stopPropagation(); open(); } }, true);
  /* «/» открывает поиск, если человек не печатает в поле */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
})();
