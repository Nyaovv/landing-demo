/* Конструктор демо: всё берётся из URL. Параметры выводятся только через textContent. */
(() => {
  'use strict';
  const K = window.KIT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const q = new URLSearchParams(location.search);
  const arg = (k, max) => (q.get(k) || '').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

  // ---------- данные ----------
  const key = Object.hasOwn(K.niches, arg('n', 20)) ? arg('n', 20) : 'b2b';
  const d = K.niches[key];
  const b = arg('b', 60).replace(/^["'«»„“”]+|["'«»„“”]+$/g, '').trim() || d.sample;
  const city = K.cityName(arg('c', 40));
  const inCity = city ? ' ' + K.prep(city) : '';
  const fill = s => s.replaceAll('{b}', b).replaceAll('{in}', inCity);
  const nb = s => s.replace(/(?<=^|[\s(«])([а-яё]{1,3}) /gi, '$1\u00a0'); // не оставлять «в», «и», «без» в конце строки
  const s = /^[123]$/.test(q.get('s') || '') ? q.get('s') : String(d.s);
  root.dataset.s = s;
  root.dataset.n = key;

  // ---------- цвета: акцент + гарантированный контраст ----------
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  const lum = c => {
    const [r, g, bl] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const contrast = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((m, n) => n - m); return (hi + 0.05) / (lo + 0.05); };
  const mix = (c, t, k) => c.map((v, i) => Math.round(v + (t[i] - v) * k));
  let a = (q.get('a') || '').replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(a)) a = [...a].map(ch => ch + ch).join('');
  const acc = rgb(/^[0-9a-f]{6}$/.test(a) ? '#' + a : d.pal[0]);
  const BG = { 1: ['#fbfbf9', '#ffffff', '#f2f2ed'], 2: ['#0b0c0e', '#15171b', '#101114'], 3: ['#fff4e8', '#ffffff'] }[s].map(rgb);
  if (s === '3') BG.push(mix(BG[0], acc, 0.16)); // фон секций в стиле 3 подкрашен акцентом
  const toward = s === '2' ? [255, 255, 255] : [0, 0, 0];
  let ink = acc;
  for (let k = 0.05; k <= 1 && Math.min(...BG.map(c => contrast(ink, c))) < 4.6; k += 0.05) ink = mix(acc, toward, k);
  const cw = contrast(acc, [255, 255, 255]);
  const onWhite = cw >= 4.5 || cw >= contrast(acc, [17, 17, 17]);
  const txt = onWhite ? [255, 255, 255] : [17, 17, 17];
  let fillc = acc; // текст на кнопке: дотягиваем заливку до 4.5:1, сдвигая её от цвета текста (на глаз 3–6%)
  for (let k = 0; k < 40 && contrast(fillc, txt) < 4.5; k++) fillc = mix(fillc, onWhite ? [0, 0, 0] : [255, 255, 255], 0.03);
  root.style.setProperty('--accent', hex(fillc));
  root.style.setProperty('--accent2', /^[0-9a-f]{6}$/.test(a) ? hex(mix(acc, [255, 255, 255], 0.55)) : d.pal[1]);
  root.style.setProperty('--accent-ink', hex(ink));
  root.style.setProperty('--on-accent', onWhite ? '#fff' : '#111');
  $('meta[name=theme-color]').content = hex(BG[0]);

  // ---------- телефон ----------
  const praw = arg('p', 30);
  let digits = praw.replace(/\D/g, '');
  let phone = '+7 (900) 000-00-00', tel = '';
  if (digits.length >= 10 && digits.length <= 15) {
    if (digits.length === 10) digits = '7' + digits;
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    tel = 'tel:+' + digits;
    phone = digits.length === 11 && digits[0] === '7'
      ? `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
      : praw.replace(/[^\d+()\- ]/g, '');
  }
  // без настоящего номера ссылки ведут к форме, а не звонят на выдуманный номер
  $$('a[data-tel]').forEach(el => { el.href = tel || '#form'; });

  // ---------- тексты ----------
  const letter = [...b].find(ch => /[\p{L}\p{N}]/u.test(ch));
  const text = {
    brand: b,
    mark: letter ? letter.toUpperCase() : '•',
    eyebrow: d.tag + (city ? ' · ' + city : ''),
    title: nb(arg('t', 140) || fill(d.title)),
    lead: nb(arg('o', 300) || fill(d.lead)),
    cta: nb(d.cta),
    chip1: d.chips[0],
    chip2: d.chips[1],
    svT: d.svT || 'Услуги и цены',
    stT: d.stT || 'Как мы работаем',
    phone,
    year: String(new Date().getFullYear()),
  };
  $$('[data-k]').forEach(el => { el.textContent = text[el.dataset.k]; });
  if (!tel) {
    root.classList.add('no-tel');
    const g = $('.hero-btns .ghost');
    g.href = '#services';
    g.replaceChildren(text.svT);
  }
  document.title = `${b} — ${d.tag.toLowerCase()}${inCity}`;
  $$('.sec-head>p:not([data-k])').forEach(p => { p.textContent = nb(p.textContent); });
  $('#f-msg').placeholder = d.ph;
  $('.a-use').setAttribute('href', '#ic-' + key);
  if (letter) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${hex(acc)}"/></svg>`;
    $('link[rel=icon]').href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = nb(String(txt)); return n; };
  const icon = id => { const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('class', 'i'); sv.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', id); sv.append(u); return sv; };
  const list = (name, items, make) => $(`[data-list="${name}"]`).append(...items.map(make));

  list('facts', d.adv, ([t]) => { const li = el('li'); li.append(icon('#i-check'), el('span', '', t)); return li; });
  list('svc', d.svc, ([t, p, price]) => { const li = el('li', 'svc'); li.append(el('h3', '', t), el('p', '', p), el('b', 'price', price)); return li; });
  list('adv', d.adv, ([t, p], i) => { const li = el('li', 'why-item'); li.append(el('span', 'why-n', '0' + (i + 1)), el('h3', '', t), el('p', '', p)); return li; });
  list('steps', d.steps, ([t, p], i) => {
    const li = el('li', 'step'); li.style.setProperty('--i', i);
    const body = el('div'); body.append(el('h3', '', t), el('p', '', p));
    li.append(el('span', 'st-n', String(i + 1)), body); return li;
  });
  list('faq', d.faq, ([qq, aa], i) => {
    const det = el('details'); det.setAttribute('name', 'faq'); if (!i) det.open = true;
    const ans = el('div', 'ans'); ans.append(el('p', '', aa));
    det.append(el('summary', '', qq), ans); return det;
  });

  // ---------- заголовок по ширине: clamp в CSS, тут добиваем длинные слова ----------
  const h1 = $('h1');
  // длинный заголовок (свой или с длинным городом) мельче, чтобы не растягивался на 6–7 строк
  h1.style.setProperty('--k', Math.min(1, Math.max(0.72, 1 - (text.title.length - 50) * 0.008)).toFixed(3));
  const fit = () => {
    h1.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(h1).fontSize);
    while (h1.scrollWidth > h1.clientWidth + 1 && fs > 22) { fs -= 2; h1.style.fontSize = fs + 'px'; }
  };
  fit();
  if (document.fonts) document.fonts.ready.then(fit);

  // ---------- плашка ----------
  $('.draft button').addEventListener('click', () => { $('.draft').remove(); measure(); });

  // ---------- шапка, логотип и параллакс от скролла ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = $$('[data-d]');
  const art = $('.art');
  let ticking = false, artY = 0;
  function measure() { const r = art.getBoundingClientRect(); artY = r.top + scrollY + r.height / 2; }
  const onScroll = () => {
    ticking = false;
    const y = Math.max(0, scrollY);
    root.style.setProperty('--p', Math.min(1, y / 140).toFixed(3));
    // пока иллюстрация не дошла до центра экрана, она в собранном виде; дальше слои расходятся от карточки
    const rel = Math.max(0, y + innerHeight / 2 - artY);
    if (reduce.matches || rel > innerHeight) return;
    const k = innerWidth < 960 ? 0.5 : 1;
    for (const l of layers) l.style.translate = `0 ${(rel * k * l.dataset.d).toFixed(1)}px`;
  };
  measure();
  if (document.fonts) document.fonts.ready.then(() => { measure(); onScroll(); });
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---------- меню: бургер + скользящее подчёркивание ----------
  const hd = $('.hd'), burger = $('.burger'), nav = $('.nav'), ind = $('.nav-ind');
  const links = $$('.nav a');
  const setMenu = open => { hd.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); };
  burger.addEventListener('click', () => setMenu(!hd.classList.contains('open')));
  links.forEach(l => l.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  let current = null;
  const move = l => {
    ind.style.opacity = l ? '1' : '0';
    if (!l) return;
    ind.style.width = (l.offsetWidth - 24) + 'px';
    ind.style.transform = `translateX(${l.offsetLeft + 12}px)`;
  };
  const mark = () => { links.forEach(l => l.toggleAttribute('aria-current', l === current)); move(current); };
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      const l = links.find(x => x.hash === '#' + e.target.id);
      if (e.isIntersecting) current = l; else if (current === l) current = null;
    }
    mark();
  }, { rootMargin: '-45% 0px -54% 0px' });
  links.forEach(l => { const sec = $(l.hash); if (sec) io.observe(sec); });
  links.forEach(l => l.addEventListener('pointerenter', () => move(l)));
  nav.addEventListener('pointerleave', () => move(current));

  let rw = innerWidth;
  addEventListener('resize', () => { if (innerWidth === rw) return; rw = innerWidth; fit(); measure(); move(current); if (innerWidth >= 900) setMenu(false); });

  // ---------- демо-форма ----------
  const form = $('.form');
  const msg = $('.form-msg', form);
  const fName = $('#f-name'), fPhone = $('#f-phone'), fAgree = $('[name=agree]', form);
  const err = (input, text) => {
    const box = input.closest('.f');
    $('.err', box)?.remove();
    input.setAttribute('aria-invalid', String(!!text));
    if (!text) { input.removeAttribute('aria-describedby'); return; }
    const p = el('p', 'err', text); p.id = input.name + '-err';
    input.setAttribute('aria-describedby', p.id);
    box.append(p);
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = fName.value.trim();
    const ph = fPhone.value.replace(/\D/g, '');
    const bad = [
      [fName, name.length < 2 ? 'Напишите имя, хотя бы две буквы.' : ''],
      [fPhone, ph.length < 10 || ph.length > 15 ? 'Проверьте номер: нужно 10–11 цифр, например +7 900 123-45-67.' : ''],
      [fAgree, fAgree.checked ? '' : 'Без согласия не получится перезвонить.'],
    ];
    bad.forEach(([i, t]) => err(i, t));
    const first = bad.find(([, t]) => t);
    if (first) { msg.textContent = ''; first[0].focus(); return; }
    const ok = el('div', 'form-ok');
    ok.tabIndex = -1;
    ok.append(el('span', 'ok-ico'), el('h3', '', `Спасибо, ${name}!`),
      el('p', '', 'Это демо-форма: заявка никуда не ушла. На готовом сайте она сразу придёт вам в Telegram или на почту.'));
    ok.firstChild.append(icon('#i-check'));
    const again = el('button', 'link', 'Заполнить ещё раз'); again.type = 'button';
    again.addEventListener('click', () => { form.reset(); ok.replaceWith(form); fName.focus(); });
    ok.append(again);
    form.replaceWith(ok);
    ok.focus();
  });
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true') err(e.target, ''); });
})();
