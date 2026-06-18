// script.js — vanilla JS to power theme, navigation, animations, filtering, and UI interactions

(() => {
  // Utilities
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Elements
  const root = document.documentElement;
  const body = document.body;
  const themeToggle = $('#theme-toggle');
  const menuToggle = $('#menu-toggle');
  const navList = $('#nav-list');
  const navLinks = $$('.nav-link');
  const revealEls = $$('.reveal');
  const backToTop = $('#back-to-top');
  const scrollProgress = $('#scroll-progress');
  const statEls = $$('.stat-value');
  const filterBtns = $$('.filter-btn');
  const projectsGrid = $('#projects-grid');
  const yearEl = $('#footer-year');

  // Initialize year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // THEME
  const THEME_KEY = 'pref-theme';
  function setTheme(theme) {
    if (theme === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch(e){}
  }
  function toggleTheme() {
    const isLight = body.classList.contains('theme-light');
    setTheme(isLight ? 'dark' : 'light');
  }
  // init theme
  (function initTheme(){
    let stored;
    try { stored = localStorage.getItem(THEME_KEY); } catch(e){}
    if (stored) { setTheme(stored); }
    else {
      // prefer dark by default
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }
  })();
  themeToggle && themeToggle.addEventListener('click', toggleTheme);

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      navList.style.display = expanded ? '' : 'flex';
    });
  }

  // Smooth scroll for nav links
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // close mobile nav if open
        if (window.innerWidth < 820 && menuToggle) {
          menuToggle.setAttribute('aria-expanded', 'false');
          navList.style.display = '';
        }
      }
    });
  });

  // Active nav highlighting using IntersectionObserver
  const sections = navLinks.map(l => document.querySelector(l.getAttribute('href')));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = navLinks.find(a => a.getAttribute('href') === `#${id}`);
      if (entry.isIntersecting && link) {
        navLinks.forEach(n => n.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(sec => sec && observer.observe(sec));

  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? Number(el.dataset.delay) : 0;
        setTimeout(() => el.classList.add('visible'), delay);
        revealObserver.unobserve(el);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));

  // Stat counters (animate when in view)
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = Number(el.dataset.target) || 0;
        animateCounter(el, target, 1200);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statEls.forEach(s => statObserver.observe(s));

  function animateCounter(el, target, duration = 1000) {
    const start = 0;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * (target - start) + start);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  // Back to top button and scroll progress
  function updateScrollUI(){
    const scrolled = window.scrollY;
    if (scrolled > 400) backToTop.style.display = 'block';
    else backToTop.style.display = 'none';

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  updateScrollUI();

  // Project filtering
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filt = btn.dataset.filter;
      filterProjects(filt);
    });
  });

  function filterProjects(filter){
    const cards = $$('.project-card', projectsGrid);
    cards.forEach(card => {
      const cat = card.dataset.category || 'all';
      if (filter === 'all' || cat === filter) {
        card.style.display = '';
        // re-run reveal if it wasn't visible
        if (!card.classList.contains('visible')) card.classList.add('visible');
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Contact form: UI-only handling
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Basic UI feedback
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Sending...';
      setTimeout(() => {
        submit.textContent = 'Sent';
        submit.disabled = false;
        form.reset();
      }, 900);
    });
  }

  // Accessibility: keyboard shortcut to toggle theme (T)
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); toggleTheme();
    }
  });

  // Preference for reduced motion: if so, remove animated reveals (already handled by CSS)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Small helper: show mobile nav on resize to avoid stuck hidden nav
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) navList.style.display = '';
  });

  // End of IIFE
})();
