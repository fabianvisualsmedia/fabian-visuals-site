// Curved ("arc") phase picker – the signature element from the moodboard.
// A scroll-snapping list whose items slide along a circular arc; the centred item is selected.

import { openSheet, stepper, wireSteppers } from './ui.js';
import { phaseIcon } from './icons.js';
import { escapeHtml } from './format.js';

const R = 340; // arc radius in px

/**
 * @returns {Promise<{phase:string, revisionRound:number|null}|null>}
 */
export function pickPhase({
  phases,
  current = null,
  title = 'Phase wählen',
  subtitle = 'damit jede Minute dort landet, wo sie hingehört',
  cta = 'Timer starten',
  revision = { round: 1, maxRound: 0, included: null },
} = {}) {
  const startKey = current && phases.some((p) => p.key === current) ? current : phases[0].key;
  const body = `
    <div class="picker">
      <div class="picker-intro">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="arc">
        <svg class="arc-line" aria-hidden="true"><path/></svg>
        <span class="arc-dash" aria-hidden="true"></span>
        <div class="arc-list" role="listbox" tabindex="0" aria-label="Phasen">
          <div class="arc-spacer"></div>
          ${phases
            .map(
              (p) => `<button type="button" class="arc-item" role="option" data-key="${p.key}">
                <span class="arc-label">${escapeHtml(p.label)}</span>
                <span class="arc-bubble">${phaseIcon(p.key, 22)}</span>
              </button>`,
            )
            .join('')}
          <div class="arc-spacer"></div>
        </div>
      </div>
      <div class="picker-round" hidden>
        <div>
          <span class="label">Korrekturrunde</span>
          <span class="hint" data-round-hint></span>
        </div>
        ${stepper('round', revision.round || 1, { min: 1, max: 20 })}
      </div>
      <button type="button" class="btn primary glow-btn block" data-go>${escapeHtml(cta)}</button>
    </div>`;

  return openSheet({
    className: 'sheet-picker',
    body,
    onMount(el, close) {
      const list = el.querySelector('.arc-list');
      const items = [...list.querySelectorAll('.arc-item')];
      const svg = el.querySelector('.arc-line');
      const path = svg.querySelector('path');
      const roundRow = el.querySelector('.picker-round');
      const roundInput = roundRow.querySelector('input[name="round"]');
      const roundHint = el.querySelector('[data-round-hint]');
      let selected = null;
      let raf = 0;

      const updateHint = () => {
        const r = Number(roundInput.value);
        const inc = revision.included;
        roundHint.textContent =
          inc == null ? '' : r > inc ? `Über Angebot – ${inc} inklusive` : `${r} von ${inc} inklusive`;
        roundHint.classList.toggle('warn', inc != null && r > inc);
      };
      wireSteppers(roundRow, updateHint);
      updateHint();

      const select = (it) => {
        if (it === selected) return;
        selected?.classList.remove('is-selected');
        selected = it;
        it.classList.add('is-selected');
        it.setAttribute('aria-selected', 'true');
        items.forEach((x) => x !== it && x.setAttribute('aria-selected', 'false'));
        roundRow.hidden = it.dataset.key !== 'revisions';
        navigator.vibrate?.(4);
      };

      const drawArc = () => {
        const H = list.clientHeight;
        const W = list.clientWidth;
        const x0 = W - 26; // arc sits right of the bubbles
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        let d = '';
        for (let y = -H / 2; y <= H / 2; y += 6) {
          const x = x0 + (R - Math.sqrt(R * R - y * y));
          d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${(y + H / 2).toFixed(1)}`;
        }
        path.setAttribute('d', d);
      };

      const layout = () => {
        raf = 0;
        const H = list.clientHeight;
        const mid = list.scrollTop + H / 2;
        let best = null, bestD = Infinity;
        for (const it of items) {
          const y = it.offsetTop + it.offsetHeight / 2 - mid;
          const ay = Math.min(Math.abs(y), R * 0.98);
          const x = R - Math.sqrt(R * R - ay * ay);
          const t = Math.min(1, Math.abs(y) / (H / 2));
          it.style.transform = `translateX(${x.toFixed(1)}px) scale(${(1 - t * 0.1).toFixed(3)})`;
          it.style.opacity = (1 - t * 0.78).toFixed(3);
          if (Math.abs(y) < bestD) (bestD = Math.abs(y)), (best = it);
        }
        if (best) select(best);
      };
      const schedule = () => (raf ||= requestAnimationFrame(layout));

      const centerOn = (it, smooth = true) => {
        const top = it.offsetTop + it.offsetHeight / 2 - list.clientHeight / 2;
        list.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      };

      list.addEventListener('scroll', schedule, { passive: true });
      list.addEventListener('click', (e) => {
        const it = e.target.closest('.arc-item');
        if (!it) return;
        if (it === selected) el.querySelector('[data-go]').focus();
        centerOn(it);
      });
      list.addEventListener('keydown', (e) => {
        if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const i = items.indexOf(selected) + (e.key === 'ArrowDown' ? 1 : -1);
        if (items[i]) centerOn(items[i]);
      });
      const ro = new ResizeObserver(() => (drawArc(), schedule()));
      ro.observe(list);

      el.querySelector('[data-go]').addEventListener('click', () => {
        ro.disconnect();
        const phase = selected.dataset.key;
        close({ phase, revisionRound: phase === 'revisions' ? Number(roundInput.value) : null });
      });

      // Initial position (after layout pass).
      requestAnimationFrame(() => {
        drawArc();
        centerOn(items.find((i) => i.dataset.key === startKey) || items[0], false);
        layout();
      });
    },
  });
}

/** Asks for the round number when a revisions timer is started from a quick button. */
export function revisionDefaults(entries, included) {
  const max = entries.reduce((m, e) => (e.phase === 'revisions' ? Math.max(m, e.revisionRound || 1) : m), 0);
  return { round: Math.max(1, max), maxRound: max, included: included ?? null };
}
