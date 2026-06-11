/* ============================================================
   blocks.js — Настройки блоков (цвет, шрифт)
   Проект: alt
   Drag/resize убраны — только кастомизация оформления
   ============================================================ */
'use strict';

// Ключ хранения ОТДЕЛЬНЫЙ для каждой страницы
const PAGE_ID     = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';
const STORAGE_KEY = 'blockui_' + PAGE_ID;

document.addEventListener('DOMContentLoaded', () => {
  const blocks = [...document.querySelectorAll(
    '.block-unit[data-block-id]:not(.page-header):not(.site-footer)'
  )];

  blocks.forEach(block => createSettingsUI(block));

  const saved = loadSettings();
  if (saved) {
    blocks.forEach(block => {
      const s = saved[block.dataset.blockId];
      if (s) applySettings(block, s);
    });
  }

  window.addEventListener('scroll', closePanels, { passive: true });
});

/* ============================================================
   UI НАСТРОЕК
   ============================================================ */
function createSettingsUI(block) {
  /* --- Кнопка «Стиль» --- */
  const btn = document.createElement('button');
  btn.className = 'block-settings-btn';
  btn.innerHTML = '<span class="bsb-ico">⚙</span><span class="bsb-label">Стиль</span>';
  btn.title = 'Настроить оформление блока';

  /* --- Панель (position:fixed) --- */
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.innerHTML = buildPanelHTML();

  const bgPicker     = panel.querySelector('.sp-bg-picker');
  const bgHex        = panel.querySelector('.sp-bg-hex');
  const accentPicker = panel.querySelector('.sp-acc-picker');
  const accentHex    = panel.querySelector('.sp-acc-hex');
  const textPicker   = panel.querySelector('.sp-txt-picker');
  const textHex      = panel.querySelector('.sp-txt-hex');
  const fontSelect   = panel.querySelector('.sp-font-select');
  const sizeSlider   = panel.querySelector('.sp-size-slider');
  const sizeVal      = panel.querySelector('.sp-size-val');
  const boldBtn      = panel.querySelector('[data-sp="bold"]');
  const italicBtn    = panel.querySelector('[data-sp="italic"]');
  const resetBtn     = panel.querySelector('.sp-reset-btn');

  function applyBg(h)     { if (!isHex(h)) return; block.style.setProperty('--block-bg', h); block.style.background = h; block.dataset.currentBg = h; bgPicker.value = h; bgHex.value = h; save(); }
  function applyAccent(h) { if (!isHex(h)) return; block.style.setProperty('--block-accent', h); block.dataset.currentAccent = h; accentPicker.value = h; accentHex.value = h; save(); }
  function applyText(h)   { if (!isHex(h)) return; block.style.setProperty('--block-text-color', h); block.style.setProperty('--block-heading-color', h); block.dataset.currentText = h; textPicker.value = h; textHex.value = h; save(); }

  bgPicker.addEventListener('input',     () => applyBg(bgPicker.value));
  bgHex.addEventListener('input',        () => applyBg(bgHex.value));
  accentPicker.addEventListener('input', () => applyAccent(accentPicker.value));
  accentHex.addEventListener('input',    () => applyAccent(accentHex.value));
  textPicker.addEventListener('input',   () => applyText(textPicker.value));
  textHex.addEventListener('input',      () => applyText(textHex.value));

  fontSelect.addEventListener('change', () => {
    block.style.fontFamily = fontSelect.value || '';
    if (fontSelect.value) block.style.setProperty('--block-heading-font', fontSelect.value);
    else block.style.removeProperty('--block-heading-font');
    block.dataset.currentFont = fontSelect.value; save();
  });

  sizeSlider.addEventListener('input', () => {
    const v = sizeSlider.value;
    sizeVal.textContent = v;
    block.style.setProperty('--block-font-size', v + 'px');
    block.dataset.currentSize = v; save();
  });

  boldBtn.addEventListener('click', e => {
    e.stopPropagation();
    const on = boldBtn.classList.toggle('active');
    block.style.fontWeight = on ? '700' : '';
    block.dataset.bold = on; save();
  });
  italicBtn.addEventListener('click', e => {
    e.stopPropagation();
    const on = italicBtn.classList.toggle('active');
    block.style.fontStyle = on ? 'italic' : '';
    block.dataset.italic = on; save();
  });

  // Сброс только этого блока
  resetBtn.addEventListener('click', e => {
    e.stopPropagation();
    block.removeAttribute('style');
    delete block.dataset.currentBg;
    delete block.dataset.currentAccent;
    delete block.dataset.currentText;
    delete block.dataset.currentFont;
    delete block.dataset.currentSize;
    delete block.dataset.bold;
    delete block.dataset.italic;
    sync();
    save();
  });

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const wasOpen = panel.classList.contains('open');
    closePanels();
    if (!wasOpen) {
      sync();
      positionPanel(panel, btn);
      panel.classList.add('open');
      block.classList.add('block-active');
    }
  });

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
      block.classList.remove('block-active');
    }
  });
  panel.addEventListener('click', e => e.stopPropagation());

  function sync() {
    bgPicker.value     = safeHex(block.dataset.currentBg     || '#0d0d2b');
    bgHex.value        = safeHex(block.dataset.currentBg     || '#0d0d2b');
    accentPicker.value = safeHex(block.dataset.currentAccent || '#4f46e5');
    accentHex.value    = safeHex(block.dataset.currentAccent || '#4f46e5');
    textPicker.value   = safeHex(block.dataset.currentText   || '#94a3b8');
    textHex.value      = safeHex(block.dataset.currentText   || '#94a3b8');
    fontSelect.value   = block.dataset.currentFont  || '';
    const sz = parseInt(block.dataset.currentSize) || 13;
    sizeSlider.value = sz; sizeVal.textContent = sz;
    boldBtn.classList.toggle('active',   block.dataset.bold   === 'true');
    italicBtn.classList.toggle('active', block.dataset.italic === 'true');
  }

  function save() { saveSettings(); }

  block.appendChild(btn);
  document.body.appendChild(panel);
}

function buildPanelHTML() {
  return `
    <div class="sp-header">
      <span>⚙ Стиль блока</span>
      <button class="sp-reset-btn" title="Сбросить этот блок">↺</button>
    </div>

    <div class="sp-section">
      <div class="sp-section-title">🎨 Цвет</div>

      <div class="sp-label">Фон</div>
      <div class="sp-color-row">
        <input type="color" class="sp-color-picker sp-bg-picker"  value="#0d0d2b">
        <input type="text"  class="sp-hex-input sp-bg-hex"  placeholder="#0d0d2b" maxlength="7" spellcheck="false">
      </div>

      <div class="sp-label" style="margin-top:10px">Акцент (рамки, иконки)</div>
      <div class="sp-color-row">
        <input type="color" class="sp-color-picker sp-acc-picker" value="#4f46e5">
        <input type="text"  class="sp-hex-input sp-acc-hex" placeholder="#4f46e5" maxlength="7" spellcheck="false">
      </div>

      <div class="sp-label" style="margin-top:10px">Весь текст</div>
      <div class="sp-color-row">
        <input type="color" class="sp-color-picker sp-txt-picker" value="#94a3b8">
        <input type="text"  class="sp-hex-input sp-txt-hex" placeholder="#94a3b8" maxlength="7" spellcheck="false">
      </div>
    </div>

    <div class="sp-section sp-last">
      <div class="sp-section-title">🔤 Шрифт</div>
      <select class="sp-font-select">
        <option value="">— без изменений —</option>
        <option value="'IBM Plex Mono', monospace">IBM Plex Mono</option>
        <option value="'Oxanium', monospace">Oxanium</option>
        <option value="monospace">Monospace</option>
        <option value="sans-serif">Sans-serif</option>
        <option value="serif">Serif</option>
      </select>
      <div class="sp-size-row">
        <span class="sp-label" style="margin:0">Размер</span>
        <span class="sp-label" style="margin:0"><span class="sp-size-val">13</span> px</span>
      </div>
      <input type="range" class="sp-slider sp-size-slider" min="10" max="24" value="13" step="1">
      <div class="sp-toggle-row">
        <button class="sp-toggle" data-sp="bold"><b>B</b></button>
        <button class="sp-toggle" data-sp="italic"><i>I</i></button>
      </div>
    </div>
  `;
}

/* ============================================================
   ВСПОМОГАТЕЛЬНЫЕ
   ============================================================ */
function positionPanel(panel, btn) {
  const r = btn.getBoundingClientRect();
  let left = r.right - 264;
  if (left < 248) left = 248;
  if (left + 264 > window.innerWidth - 8) left = window.innerWidth - 272;
  panel.style.left = left + 'px';
  let top = r.bottom + 6;
  if (top + 320 > window.innerHeight - 8) top = r.top - 328;
  if (top < 8) top = 8;
  panel.style.top = top + 'px';
}

function closePanels() {
  document.querySelectorAll('.settings-panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.block-unit.block-active').forEach(b => b.classList.remove('block-active'));
}

function isHex(h)   { return typeof h === 'string' && /^#[0-9A-Fa-f]{6}$/.test(h.trim()); }
function safeHex(h) { return isHex(h) ? h.trim() : '#0d0d2b'; }

function applySettings(block, s) {
  if (s.bg)        { block.style.setProperty('--block-bg', s.bg);              block.style.background = s.bg; block.dataset.currentBg = s.bg; }
  if (s.accent)    { block.style.setProperty('--block-accent', s.accent);       block.dataset.currentAccent = s.accent; }
  if (s.textColor) { block.style.setProperty('--block-text-color', s.textColor); block.style.setProperty('--block-heading-color', s.textColor); block.dataset.currentText = s.textColor; }
  if (s.font)      { block.style.fontFamily = s.font; block.style.setProperty('--block-heading-font', s.font); block.dataset.currentFont = s.font; }
  if (s.size)      { block.style.setProperty('--block-font-size', s.size + 'px'); block.dataset.currentSize = s.size; }
  if (s.bold)      { block.style.fontWeight = '700';     block.dataset.bold   = 'true'; }
  if (s.italic)    { block.style.fontStyle  = 'italic';  block.dataset.italic = 'true'; }
}

function saveSettings() {
  const out = {};
  document.querySelectorAll('.block-unit[data-block-id]:not(.page-header):not(.site-footer)').forEach(b => {
    out[b.dataset.blockId] = {
      bg:        b.dataset.currentBg        || null,
      accent:    b.dataset.currentAccent    || null,
      textColor: b.dataset.currentText      || null,
      font:      b.dataset.currentFont      || null,
      size:      parseInt(b.dataset.currentSize) || null,
      bold:      b.dataset.bold   === 'true',
      italic:    b.dataset.italic === 'true',
    };
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(out)); }
  catch(e) { console.warn('blockui: ошибка сохранения', e); }
}

function loadSettings() {
  try {
    const j = localStorage.getItem(STORAGE_KEY);
    return j ? JSON.parse(j) : null;
  } catch(e) { localStorage.removeItem(STORAGE_KEY); return null; }
}

function resetBlocks() {
  // Сбрасываем ТОЛЬКО текущую страницу
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}