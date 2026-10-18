/* JES Life home: behaviour modelled on mdebeauty.com (GSAP + ScrollTrigger + Lenis, Swiper-like sliders).
   - smooth scroll (Lenis), synced with ScrollTrigger
   - masked line reveals and fade-ups that fire once when an element enters
   - stacked scenes: the hero stays pinned while «О нас» slides over it
   - «Бизнес» opens out of an arch; «Пауза» is pinned while its stage opens from an arch
   - products rise between the giant letters (scrubbed parallax)
   - sliders with 46 px arrows, counter and an autoplay ring on «next»
   - «product rotate»: a custom cursor and a 3D tilt of the stage that follows the pointer */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;
  const AUTOPLAY = 5000;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); scrollToTarget(id); }
  }));

  /* ---------- reveals: an element gets .show once, when it enters ---------- */
  document.querySelectorAll('.pillar path').forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
  if (reduce) {
    document.querySelectorAll('[data-show], .reveal-up, .title-anim').forEach((el) => el.classList.add('show'));
  } else {
    const reveal = (el, start) => ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => el.classList.add('show') });
    document.querySelectorAll('.title-anim, .reveal-up').forEach((el) => reveal(el, 'top 88%'));
    document.querySelectorAll('section[data-show], footer[data-show]').forEach((el) => reveal(el, 'top 60%'));
  }

  /* ---------- header: fixed and always visible, transparent; its text follows the scene under it ---------- */
  const header = document.getElementById('header');
  // whatever is drawn under the header's middle line decides: light scenes get dark text
  const themeUnderHeader = () => {
    const hit = document.elementsFromPoint(innerWidth / 2, header.offsetHeight / 2).find((el) => !header.contains(el));
    const scene = hit && hit.closest('[data-theme]');
    header.classList.toggle('on-light', !!scene && scene.dataset.theme === 'light');
  };
  const onScroll = () => themeUnderHeader();
  addEventListener('resize', themeUnderHeader);
  themeUnderHeader();
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ---------- centred products: GSAP owns their transform ---------- */
  const chess = document.querySelector('.business__chess');
  const jar = document.querySelector('.products__jar');

  /* ---------- scroll scenes (desktop; phones get plain reveals, as on MDE below 1080 px) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1081px) and (prefers-reduced-motion: no-preference)', () => {
    // 1. stacked scenes: the hero stays pinned while «О нас» slides over it, the hero dims underneath
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: () => '+=' + innerHeight, pin: true, pinSpacing: false });
    gsap.to('.hero-dim', {
      opacity: 0.6, ease: 'none',
      scrollTrigger: {
        trigger: '#about', start: 'top bottom', end: 'top top', scrub: true,
        onUpdate: (st) => document.dispatchEvent(new CustomEvent('hero:covered', { detail: st.progress > 0.995 })),
      },
    });

    // 2. the chess pieces rise between the letters
    gsap.fromTo(chess, { yPercent: 38, opacity: 0.2 }, { yPercent: -4, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.business__head', start: 'top 95%', end: 'top 30%', scrub: 1 } });

    // 3. the open jar rises and turns between «О наших» and «продуктах»; the two lines drift apart
    gsap.fromTo(jar, { yPercent: 34, rotate: -7 }, { yPercent: -16, rotate: 5, ease: 'none', scrollTrigger: { trigger: '#products', start: 'top bottom', end: 'center top', scrub: 1 } });
    gsap.fromTo('.products__title .tl:first-child', { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: '#products', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.fromTo('.products__title .tl:last-child', { xPercent: -3 }, { xPercent: 3, ease: 'none', scrollTrigger: { trigger: '#products', start: 'top bottom', end: 'bottom top', scrub: 1 } });

    // 4. «Пауза» is pinned while the panorama settles in scale
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#pause', start: 'top top', end: () => '+=' + innerHeight * 0.8, pin: true, scrub: true } });
    tl.fromTo('.pause__zoom', { scale: 1.22 }, { scale: 1, ease: 'none' }, 0);

    // 5. the giant footer mark drifts up a little as the page ends
    gsap.fromTo('.footer__mark .tl', { yPercent: 12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
  });

  /* ---------- scene transitions: each scene after the hero rises as an arch that becomes the full frame
     (MDE clipPath: rounded top -> rectangle). Phones get a slimmer inset, like MDE's scaleX + radius ---------- */
  const archFrom = (inset) => `inset(0% ${inset}% 0% ${inset}% round 40vw 40vw 0vw 0vw)`;
  const ARCH_TO = 'inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)';
  // gsap runs this when any condition matches, so «narrow» is listed too, or phones would never get here
  mm.add({ wide: '(min-width: 1081px)', narrow: '(max-width: 1080px)', calm: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    if (ctx.conditions.calm) return;
    const inset = ctx.conditions.wide ? 26 : 10;
    document.querySelectorAll('[data-arch]').forEach((sec) => {
      gsap.fromTo(sec, { clipPath: archFrom(inset) }, {
        clipPath: ARCH_TO, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 92%', end: sec.dataset.archEnd || 'top 5%', scrub: 1 },
      });
    });
  });

  /* ---------- «О нас»: a photo pill opens as a large card on hover (tap on phones) to show the detail ---------- */
  {
    const zoom = document.createElement('div');
    zoom.className = 'pill-zoom';
    zoom.innerHTML = '<img alt="">';
    document.body.appendChild(zoom);
    const img = zoom.querySelector('img');
    let current = null;
    const pillBox = (pill) => { const r = pill.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: r.height / 2 }; };
    const open = (pill) => {
      current = pill;
      img.src = pill.dataset.zoom;
      img.alt = pill.alt;
      const r = pill.getBoundingClientRect();
      const w = Math.min(480, innerWidth - 32), h = (w * 9) / 16;
      const left = Math.min(Math.max(16, r.left + r.width / 2 - w / 2), innerWidth - w - 16);
      const top = Math.min(Math.max(90, r.top + r.height / 2 - h / 2), innerHeight - h - 16);
      gsap.killTweensOf(zoom);
      gsap.fromTo(zoom, { ...pillBox(pill), opacity: 0 }, { left, top, width: w, height: h, borderRadius: 24, opacity: 1, duration: 0.55, ease: 'power3.out' });
    };
    const close = () => {
      if (!current) return;
      const box = pillBox(current);
      current = null;
      gsap.killTweensOf(zoom);
      gsap.to(zoom, { ...box, opacity: 0, duration: 0.4, ease: 'power3.in' });
    };
    document.querySelectorAll('.pill[data-zoom]').forEach((pill) => {
      if (canHover) {
        pill.addEventListener('pointerenter', () => open(pill));
        pill.addEventListener('pointerleave', close);
      } else {
        pill.addEventListener('click', (e) => { e.stopPropagation(); if (current === pill) close(); else open(pill); });
      }
    });
    if (!canHover) document.addEventListener('click', close);
    if (lenis) lenis.on('scroll', close);
    else addEventListener('scroll', close, { passive: true });
  }

  /* ---------- sliders: arrows, counter, autoplay ring on «next», pause on hover / off-screen ---------- */
  function autoplay(nav, step, root) {
    let timer = 0, paused = false, visible = false;
    const run = () => {
      clearTimeout(timer);
      nav.classList.remove('playing');
      if (paused || !visible || nav.hidden) return;
      void nav.offsetWidth; // restart the ring animation
      nav.classList.add('playing');
      timer = setTimeout(() => step(1), AUTOPLAY);
    };
    nav.style.setProperty('--autoplay', AUTOPLAY / 1000 + 's');
    root.addEventListener('pointerenter', () => { paused = true; run(); });
    root.addEventListener('pointerleave', () => { paused = false; run(); });
    ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: (st) => { visible = st.isActive; run(); } });
    return run;
  }

  // product cards: one card per step; when every card fits, the navigation hides
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel__track');
    const cards = [...track.children];
    const nav = root.querySelector('[data-nav]');
    const cur = nav.querySelector('[data-cur]');
    const total = nav.querySelector('[data-total]');
    let page = 0, pages = 1, restart = () => {};
    const stepWidth = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
    const go = (i) => {
      page = ((i % pages) + pages) % pages;
      track.style.transform = `translateX(${-page * stepWidth()}px)`;
      cur.textContent = page + 1;
      restart();
    };
    const layout = () => {
      const perView = Math.max(1, Math.round((track.clientWidth + 20) / stepWidth()));
      pages = Math.max(1, cards.length - perView + 1);
      nav.hidden = pages < 2;
      total.textContent = pages;
      go(Math.min(page, pages - 1));
    };
    restart = autoplay(nav, (d) => go(page + d), root);
    nav.querySelector('.prev').addEventListener('click', () => go(page - 1));
    nav.querySelector('.next').addEventListener('click', () => go(page + 1));
    addEventListener('resize', layout);
    layout();
  });

  // «Пауза»: two slides cross-fading with a slow settle
  {
    const slides = [...document.querySelectorAll('.pause__slide')];
    const nav = document.querySelector('[data-pause-nav]');
    const cur = nav.querySelector('[data-cur]');
    nav.querySelector('[data-total]').textContent = slides.length;
    let i = 0, restart = () => {};
    const go = (n) => {
      i = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      cur.textContent = i + 1;
      restart();
    };
    restart = autoplay(nav, (d) => go(i + d), document.getElementById('pause'));
    nav.querySelector('.prev').addEventListener('click', () => go(i - 1));
    nav.querySelector('.next').addEventListener('click', () => go(i + 1));
  }

  // «product rotate»: a round cursor follows the pointer, the stage turns toward it
  {
    const stage = document.querySelector('[data-stage]');
    const turn = stage.querySelector('.pause__turn');
    const cursor = document.querySelector('.pause__cursor');
    if (canHover && !reduce) {
      const cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power2.out' });
      const cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power2.out' });
      const ry = gsap.quickTo(turn, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      const tx = gsap.quickTo(turn, 'x', { duration: 0.9, ease: 'power3.out' });
      stage.addEventListener('pointermove', (e) => {
        cx(e.clientX); cy(e.clientY);
        const r = stage.getBoundingClientRect();
        const k = ((e.clientX - r.left) / r.width) * 2 - 1;
        ry(k * 7); tx(-k * 18);
      });
      stage.addEventListener('pointerenter', (e) => { gsap.set(cursor, { x: e.clientX, y: e.clientY }); cursor.classList.add('on'); });
      stage.addEventListener('pointerleave', () => { cursor.classList.remove('on'); ry(0); tx(0); });
    }
  }

  // centring for the products is set once, outside media queries, so phones keep it too
  gsap.set([chess, jar], { transformOrigin: '50% 100%' });

  /* ---------- footer mark: «JES Life» spans the full width, like the MDE wordmark ---------- */
  const fitMark = () => {
    const el = document.querySelector('[data-fit]');
    if (!el) return;
    el.style.fontSize = '100px';
    const range = document.createRange();
    range.selectNodeContents(el);
    const w = range.getBoundingClientRect().width;
    el.style.fontSize = ((100 * el.closest('.footer__mark').clientWidth) / w).toFixed(2) + 'px';
  };
  document.fonts.ready.then(() => { fitMark(); ScrollTrigger.refresh(); });
  addEventListener('resize', fitMark);

  /* ---------- demo form: nothing is sent anywhere, it only thanks the visitor ---------- */
  document.querySelectorAll('[data-demo-form]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = form.parentElement.querySelector('[data-demo-note]');
    if (note) note.hidden = false;
    form.reset();
  }));

  addEventListener('load', () => ScrollTrigger.refresh());
})();
