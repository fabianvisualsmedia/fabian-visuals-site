// Generic UI building blocks: bottom sheets, confirm dialogs, toasts.

import { escapeHtml } from './format.js';
import { icon } from './icons.js';

const layer = () => document.getElementById('layer');

/**
 * Opens a bottom sheet. `body` is an HTML string; `onMount(el, close)` wires behaviour.
 * Returns a promise that resolves with the value passed to close(value).
 */
export function openSheet({ title = '', subtitle = '', body = '', onMount, className = '', closable = true } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-backdrop';
    wrap.innerHTML = `
      <section class="sheet ${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="sheet-grip" aria-hidden="true"></div>
        ${title || closable ? `<header class="sheet-head">
          <div>
            ${title ? `<h2 class="sheet-title">${escapeHtml(title)}</h2>` : ''}
            ${subtitle ? `<p class="sheet-sub">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          ${closable ? `<button class="icon-btn sm" data-close aria-label="Schließen">${icon('x', 18)}</button>` : ''}
        </header>` : ''}
        <div class="sheet-body">${body}</div>
      </section>`;
    const prevFocus = document.activeElement;
    let done = false;
    const close = (value = null) => {
      if (done) return;
      done = true;
      wrap.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => wrap.remove(), 260);
      prevFocus?.focus?.({ preventScroll: true });
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape' && closable) close(null);
    };
    wrap.addEventListener('click', (e) => {
      if (closable && (e.target === wrap || e.target.closest('[data-close]'))) close(null);
    });
    document.addEventListener('keydown', onKey);
    layer().appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('open'));
    const sheet = wrap.querySelector('.sheet');
    onMount?.(sheet, close);
    const focusable = sheet.querySelector('[autofocus]') || sheet.querySelector('button, input, select, textarea');
    setTimeout(() => focusable?.focus?.({ preventScroll: true }), 50);
  });
}

export function confirmDialog(message, { title = 'Sicher?', confirmLabel = 'Bestätigen', danger = false } = {}) {
  return openSheet({
    title,
    className: 'sheet-compact',
    body: `<p class="muted">${escapeHtml(message)}</p>
      <div class="btn-row">
        <button class="btn ghost" data-close>Abbrechen</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${escapeHtml(confirmLabel)}</button>
      </div>`,
    onMount: (el, close) => el.querySelector('[data-ok]').addEventListener('click', () => close(true)),
  }).then(Boolean);
}

let toastTimer;
export function toast(message, { tone = '' } = {}) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.dataset.tone = tone;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/** Tiny delegated click handler: <button data-action="foo" data-id="…"> → handlers.foo(el, event). */
export function delegate(root, handlers) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.action];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  });
}

/** Segmented control HTML. */
export const segmented = (name, options, value) => `
  <div class="segmented" role="radiogroup">
    ${options
      .map(
        (o) => `<label class="seg"><input type="radio" name="${name}" value="${o.key}" ${o.key === value ? 'checked' : ''}><span>${escapeHtml(o.label)}</span></label>`,
      )
      .join('')}
  </div>`;

/** Number stepper HTML. */
export const stepper = (name, value, { min = 0, max = 99 } = {}) => `
  <div class="stepper" data-stepper="${name}" data-min="${min}" data-max="${max}">
    <button type="button" class="icon-btn sm" data-step="-1" aria-label="Weniger">${icon('minus', 16)}</button>
    <output>${value}</output>
    <input type="hidden" name="${name}" value="${value}">
    <button type="button" class="icon-btn sm" data-step="1" aria-label="Mehr">${icon('plus', 16)}</button>
  </div>`;

export function wireSteppers(root, onChange) {
  root.querySelectorAll('[data-stepper]').forEach((st) => {
    const input = st.querySelector('input');
    const out = st.querySelector('output');
    const min = Number(st.dataset.min), max = Number(st.dataset.max);
    st.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const v = Math.min(max, Math.max(min, Number(input.value) + Number(b.dataset.step)));
      input.value = v;
      out.textContent = v;
      onChange?.(st.dataset.stepper, v);
    });
  });
}
