// Inline-SVG charts. Bars use percentage geometry (no viewBox stretching), so rounded
// ends and stroke widths stay crisp at any width.

import { escapeHtml, fmtH } from '../format.js';
import { signedPct } from '../logic/calc.js';

const pctOf = (v, max) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

/**
 * Plan-vs-actual horizontal bars, one row per phase.
 * rows: [{ key, label, color, est, real, live? }] in hours.
 * Soll = ghost track with tick at the estimate; Ist = filled bar in the phase colour;
 * the part beyond the estimate is drawn in the "bad" status colour and labelled with the deviation.
 */
export function planVsActual(rows, { icon = () => '' } = {}) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.est, r.real)));
  const H = 12;
  const legend = `
    <div class="chart-legend" aria-hidden="true">
      <span><i class="lg-plan"></i>Soll (Kalkulation)</span>
      <span><i class="lg-real"></i>Ist</span>
      <span><i class="lg-over"></i>Überzogen</span>
    </div>`;
  const body = rows
    .map((r) => {
      const estP = pctOf(r.est, max);
      const realP = pctOf(r.real, max);
      const inPlan = r.est > 0 ? Math.min(realP, estP) : realP;
      const over = r.est > 0 && r.real > r.est;
      const dev = r.est > 0 && r.real > 0 ? (r.real - r.est) / r.est : null;
      const ratio = r.est > 0 ? r.real / r.est : null;
      const tone = ratio == null ? '' : ratio > 1 ? 'bad' : ratio >= 0.8 ? 'warn' : '';
      const tip = `${r.label}: Ist ${fmtH(r.real, 2)}${r.est ? ` · Soll ${fmtH(r.est, 2)} · ${signedPct(dev)}` : ' · keine Kalkulation'}`;
      return `
        <div class="pva-row ${tone}" role="listitem" aria-label="${escapeHtml(tip)}" title="${escapeHtml(tip)}">
          <div class="pva-head">
            <span class="pva-label">${icon(r.key)}${escapeHtml(r.label)}</span>
            <span class="pva-val"><b ${r.live ? `data-live-phase="${r.key}"` : ''}>${fmtH(r.real, 1)}</b><span class="muted"> / ${r.est ? fmtH(r.est, 1) : '–'}</span>${dev != null ? `<em class="pva-dev">${signedPct(dev, 0)}</em>` : ''}</span>
          </div>
          <svg class="pva-bar" width="100%" height="${H}" aria-hidden="true">
            ${r.est > 0 ? `<rect class="pva-plan" x="0" y="0" width="${estP}%" height="${H}" rx="${H / 2}"/>` : ''}
            ${inPlan > 0 ? `<rect x="0" y="0" width="${inPlan}%" height="${H}" rx="${H / 2}" fill="${r.color}"/>` : ''}
            ${over ? `<rect class="pva-over" x="${estP}%" y="0" width="${Math.max(0, realP - estP)}%" height="${H}" rx="${H / 2}"/>` : ''}
            ${r.est > 0 ? `<line class="pva-tick" x1="${estP}%" x2="${estP}%" y1="-2" y2="${H + 2}"/>` : ''}
          </svg>
        </div>`;
    })
    .join('');
  return `<div class="pva">${legend}<div role="list">${body}</div></div>`;
}
