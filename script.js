/* VOLT — interactions */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Split-text hero ---------- */
  let i = 0;
  $$('.split').forEach((el, li) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      s.style.setProperty('--i', i++);
      el.appendChild(s);
    });
    el.style.setProperty('--ld', `${li * 120}ms`);
  });
  const hero = $('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero && hero.classList.add('is-loaded')));

  /* ---------- Counters ---------- */
  const fmtNum = (v) => Math.round(v).toLocaleString('ru-RU').replace(/,/g, ' ');
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = parseFloat(el.dataset.to);
    if (reduced) { el.textContent = fmtNum(to); return; }
    const dur = 2000, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmtNum(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  // hero counters start after headline
  setTimeout(() => $$('.hero .count').forEach(runCounter), reduced ? 0 : 900);

  /* ---------- Reveal on scroll ---------- */
  const onReveal = (el) => {
    el.classList.add('is-in');
    el.querySelectorAll('.count').forEach(runCounter);
  };
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { onReveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach(onReveal);
  }

  /* ---------- Scroll-linked effects ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const progress = $('.progress span');
  const parallax = $$('[data-parallax]');
  const rows = $$('[data-speed]').map((row) => ({ row, speed: parseFloat(row.dataset.speed), w: 0 }));
  const measure = () => rows.forEach((r) => { r.w = r.row.firstElementChild.getBoundingClientRect().width; });
  measure();
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  let lastY = window.scrollY;
  let drift = 0;
  const setMarquee = (y) => {
    rows.forEach(({ row, speed, w }) => {
      if (!w) return;
      const dist = (y * Math.abs(speed) + drift) % w;
      const x = speed < 0 ? -dist : dist - w;
      row.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    });
  };
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-scrolled', y > 30);
    nav.classList.toggle('is-hidden', y > lastY && y > 600 && !document.body.classList.contains('menu-open'));
    lastY = y;
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s; });
    links.forEach((a) => a.classList.toggle('is-active', !!current && a.getAttribute('href') === '#' + current.id));
    if (!reduced) {
      parallax.forEach((b) => { b.style.transform = `translate3d(0, ${(y * parseFloat(b.dataset.parallax)).toFixed(1)}px, 0)`; });
    }
  };
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; } }, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); setMarquee(scrollY); });
  onScroll();
  setMarquee(scrollY);
  if (!reduced) {
    const loop = () => { drift += 0.6; setMarquee(scrollY); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
    if (open) { nav.classList.remove('is-hidden'); menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 400); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });

  /* ---------- Desktop pointer effects ---------- */
  if (finePointer && !reduced) {
    const spot = $('.spotlight');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; root.classList.add('has-cursor'); }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('has-cursor'));
    const loop = () => { gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14; spot.style.transform = `translate3d(${gx}px, ${gy}px, 0)`; requestAnimationFrame(loop); };
    loop();

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    $$('.tilt').forEach((card) => {
      const frame = card.querySelector('.coach__frame') || card;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
        frame.style.setProperty('--mx', `${px * 100}%`); frame.style.setProperty('--my', `${py * 100}%`);
        card.style.transition = 'transform .15s ease-out, border-color .4s, box-shadow .5s, background .5s';
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) translateZ(10px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .5s, background .5s';
        card.style.transform = '';
      });
    });
  }

  /* ---------- Tabs ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, idx) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); selectTab(tabs[n], true); }
    });
  });

  /* ---------- Schedule filter ---------- */
  const chips = $$('.chip');
  const classes = $$('.cls');
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    chips.forEach((o) => { const on = o === c; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', String(on)); });
    classes.forEach((el) => {
      const match = f === 'all' || el.dataset.t === f;
      el.classList.toggle('is-dim', !match);
      el.classList.toggle('is-hit', f !== 'all' && match);
    });
  }));

  /* ---------- FAQ: one open at a time ---------- */
  const faqs = $$('.faq__item');
  faqs.forEach((d) => d.addEventListener('toggle', () => { if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; }); }));

  /* ---------- Form ---------- */
  const form = $('.form');
  if (form) {
    const name = $('#f-name'), phone = $('#f-phone'), program = $('#f-program'), consent = $('[name="consent"]', form);
    const success = $('.form__success', form);
    $$('[data-program]').forEach((a) => a.addEventListener('click', () => { program.value = a.dataset.program; program.closest('.field').classList.remove('is-invalid'); }));

    phone.addEventListener('input', () => {
      let d = phone.value.replace(/\D/g, '');
      if (!d) { phone.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ')';
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += '-' + d.slice(7, 9);
      if (d.length > 9) out += '-' + d.slice(9, 11);
      phone.value = out;
    });

    const checks = [
      [name, () => name.value.trim().replace(/[^A-Za-zА-Яа-яЁё]/g, '').length >= 2],
      [phone, () => phone.value.replace(/\D/g, '').length === 11],
      [program, () => !!program.value],
      [consent, () => consent.checked],
    ];
    const validate = (input, ok) => {
      const bad = !ok();
      input.closest('.field').classList.toggle('is-invalid', bad);
      input.setAttribute('aria-invalid', String(bad));
      return !bad;
    };
    checks.forEach(([input, ok]) => {
      const ev = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(ev, () => { if (input.closest('.field').classList.contains('is-invalid')) validate(input, ok); });
      input.addEventListener('blur', () => { if (input.value && input.type !== 'checkbox') validate(input, ok); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = checks.map(([input, ok]) => validate(input, ok));
      const firstBad = checks.find((_, k) => !results[k]);
      if (firstBad) { firstBad[0].focus(); return; }
      const label = $('button[type="submit"] span', form);
      label.textContent = 'Отправляем…';
      setTimeout(() => {
        form.classList.add('is-sent');
        success.hidden = false;
        success.focus();
        form.reset();
        label.textContent = 'Хочу на тренировку';
      }, 800);
    });
    $('.form__again', form).addEventListener('click', () => {
      form.classList.remove('is-sent'); success.hidden = true; name.focus();
    });
  }
})();
