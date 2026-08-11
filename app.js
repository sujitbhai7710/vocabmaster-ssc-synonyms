/* =========================================================
   VocabMaster — app.js
   Search, filter, render, pronounce, mark-as-learned
   ========================================================= */
(function () {
  'use strict';

  // DATA comes from data.js (window.VOCAB_DATA)
  const DATA = (window.VOCAB_DATA || []).slice();

  // ---- State ----
  const state = {
    search: '',
    letter: 'ALL',
    onlyLearned: false,
    sort: 'default',
    learned: new Set(loadLearned()),
    page: 1,
    pageSize: 60,
  };

  // ---- DOM ----
  const $ = (sel) => document.querySelector(sel);
  const el = {
    search: $('#searchInput'),
    clear: $('#clearSearch'),
    cards: $('#cards'),
    empty: $('#empty'),
    loader: $('#loader'),
    alphaRail: $('#alphaRail'),
    sort: $('#sortSelect'),
    onlyLearned: $('#onlyLearned'),
    statTotal: $('#statTotal'),
    statShown: $('#statShown'),
    statLearned: $('#statLearned'),
    themeToggle: $('#themeToggle'),
    toast: $('#toast'),
  };

  // ---- Helpers ----
  function loadLearned() {
    try { return JSON.parse(localStorage.getItem('vm_learned') || '[]'); }
    catch (e) { return []; }
  }
  function saveLearned() {
    localStorage.setItem('vm_learned', JSON.stringify([...state.learned]));
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.remove('show'), 2000);
  }

  function escapeHTML(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightSentence(sentence, word) {
    if (!sentence) return '';
    // Escape first
    let s = escapeHTML(sentence);
    // Highlight the word (case-insensitive, whole word match)
    const re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'w*)\\b', 'gi');
    s = s.replace(re, '<span class="hl">$1</span>');
    return s;
  }

  // ---- Theme ----
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vm_theme', theme);
  }
  function initTheme() {
    const saved = localStorage.getItem('vm_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }
  el.themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // ---- Alphabet rail ----
  function buildAlphaRail() {
    const counts = {};
    DATA.forEach(d => {
      const l = (d.word[0] || '#').toUpperCase();
      counts[l] = (counts[l] || 0) + 1;
    });
    const letters = ['ALL', ...Object.keys(counts).sort()];
    el.alphaRail.innerHTML = '';
    letters.forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'alpha' + (l === state.letter ? ' active' : '');
      btn.dataset.letter = l;
      const label = l === 'ALL' ? 'All' : l;
      const count = l === 'ALL' ? DATA.length : counts[l];
      btn.innerHTML = label + (count ? ` <span class="count">${count}</span>` : '');
      btn.addEventListener('click', () => {
        state.letter = l;
        state.page = 1;
        document.querySelectorAll('.alpha').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
        window.scrollTo({ top: document.querySelector('.cards-wrap').offsetTop - 80, behavior: 'smooth' });
      });
      el.alphaRail.appendChild(btn);
    });
  }

  // ---- Filtering ----
  function getFiltered() {
    const q = state.search.trim().toLowerCase();
    let list = DATA.filter(d => {
      // letter
      if (state.letter !== 'ALL' && (d.word[0] || '').toUpperCase() !== state.letter) return false;
      // learned
      if (state.onlyLearned && !state.learned.has(d.sno)) return false;
      // search
      if (q) {
        const hay = (d.word + ' ' + d.meaning + ' ' + d.synonym + ' ' + (d.bengali || '') + ' ' + (d.sentence || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // sort
    if (state.sort === 'az') {
      list.sort((a, b) => a.word.localeCompare(b.word));
    } else if (state.sort === 'za') {
      list.sort((a, b) => b.word.localeCompare(a.word));
    } else if (state.sort === 'random') {
      list = list.map(d => [Math.random(), d]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
    }
    return list;
  }

  // ---- Render ----
  function render() {
    const filtered = getFiltered();
    el.statTotal.textContent = DATA.length;
    el.statShown.textContent = filtered.length;
    el.statLearned.textContent = state.learned.size;

    if (filtered.length === 0) {
      el.cards.innerHTML = '';
      el.empty.hidden = false;
      return;
    }
    el.empty.hidden = true;

    const slice = filtered.slice(0, state.page * state.pageSize);
    el.cards.innerHTML = slice.map(cardHTML).join('');

    // Bind actions
    el.cards.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', onCardAction);
    });

    // Load more on scroll
    if (slice.length < filtered.length) {
      el.loader.hidden = false;
    } else {
      el.loader.hidden = true;
    }
  }

  function cardHTML(d) {
    const isLearned = state.learned.has(d.sno);
    const sentence = d.sentence ? highlightSentence(d.sentence, d.word) : '';
    return `
      <article class="card" data-sno="${d.sno}">
        <div class="card-head">
          <div>
            <div class="card-word">${escapeHTML(d.word)}</div>
          </div>
          <div class="card-sno">#${d.sno}</div>
        </div>
        <span class="card-synonym">${escapeHTML(d.synonym || '')}</span>
        <div class="card-meaning">${escapeHTML(d.meaning || '')}</div>
        ${d.bengali ? `
        <div class="card-bn">
          <span class="card-bn-label">বাংলা</span>
          <span class="card-bn-text">${escapeHTML(d.bengali)}</span>
        </div>` : ''}
        ${sentence ? `
        <div class="card-sentence">${sentence}</div>` : ''}
        <div class="card-actions">
          <button class="btn btn-pron" data-action="pron" data-word="${escapeHTML(d.word)}" title="Hear pronunciation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            Pronounce
          </button>
          <button class="btn btn-mark ${isLearned ? 'marked' : ''}" data-action="mark" data-sno="${d.sno}" title="${isLearned ? 'Marked as mastered' : 'Mark as mastered'}">
            ${isLearned
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Mastered'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg> Mark'
            }
          </button>
        </div>
      </article>
    `;
  }

  // ---- Actions ----
  function onCardAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    if (action === 'pron') {
      speak(btn.dataset.word, btn);
    } else if (action === 'mark') {
      const sno = parseInt(btn.dataset.sno, 10);
      if (state.learned.has(sno)) {
        state.learned.delete(sno);
        toast('Removed from mastered');
      } else {
        state.learned.add(sno);
        toast('🎉 Marked as mastered!');
      }
      saveLearned();
      render();
    }
  }

  // ---- Pronunciation (Web Speech API) ----
  function speak(word, btn) {
    if (!('speechSynthesis' in window)) {
      toast('Audio not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    u.pitch = 1;

    // Try to pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => /en[-_]?US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
    if (en) u.voice = en;

    if (btn) {
      btn.classList.add('speaking');
      u.onend = () => btn.classList.remove('speaking');
      u.onerror = () => btn.classList.remove('speaking');
    }
    window.speechSynthesis.speak(u);
  }
  // Preload voices (some browsers need this)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // ---- Search ----
  let searchTimer;
  el.search.addEventListener('input', (e) => {
    state.search = e.target.value;
    state.page = 1;
    el.clear.classList.toggle('show', !!state.search);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 120);
  });
  el.clear.addEventListener('click', () => {
    el.search.value = '';
    state.search = '';
    el.clear.classList.remove('show');
    state.page = 1;
    render();
    el.search.focus();
  });

  // ---- Sort ----
  el.sort.addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });

  // ---- Only learned ----
  el.onlyLearned.addEventListener('change', (e) => {
    state.onlyLearned = e.target.checked;
    state.page = 1;
    render();
  });

  // ---- Infinite scroll ----
  window.addEventListener('scroll', () => {
    if (el.loader.hidden) return;
    const rect = el.loader.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      state.page++;
      render();
    }
  }, { passive: true });

  // ---- Keyboard shortcut: '/' focuses search ----
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== el.search) {
      e.preventDefault();
      el.search.focus();
    }
  });

  // ---- Init ----
  initTheme();
  buildAlphaRail();
  render();
})();
