// Insights dashboard. Phase 1 shows a simple week/month time summary;
// rankings, type comparison and learned estimate factors follow in phase 3.

import { escapeHtml, fmtDur } from '../format.js';
import { phaseColor } from '../config.js';
import { entryMs } from '../logic/timer.js';

export async function renderInsights(el, ctx) {
  const entries = await ctx.store.all('entries');
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = (d) => entries.filter((e) => Date.parse(e.start) >= d.getTime());
  const total = (list) => list.reduce((s, e) => s + entryMs(e), 0);
  const month = since(monthStart);
  const monthMs = total(month);
  const byPhase = {};
  for (const e of month) byPhase[e.phase] = (byPhase[e.phase] || 0) + entryMs(e);
  const rows = Object.entries(byPhase).sort((a, b) => b[1] - a[1]);

  el.innerHTML = `
    <header class="page-head">
      <div><p class="eyebrow">${now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p><h1>Insights</h1></div>
    </header>
    <div class="kpi-grid">
      <div class="card kpi-card"><span class="kpi-label">Diese Woche</span><span class="kpi-value">${fmtDur(total(since(weekStart)))}</span></div>
      <div class="card kpi-card"><span class="kpi-label">Dieser Monat</span><span class="kpi-value">${fmtDur(monthMs)}</span></div>
    </div>
    <section class="block">
      <div class="block-head"><h2>Wohin die Zeit diesen Monat ging</h2></div>
      ${rows.length ? `
        <div class="stack-bar" role="img" aria-label="Zeitverteilung nach Phasen">
          ${rows.map(([k, ms]) => `<span style="flex:${ms};background:${phaseColor(k)}" title="${escapeHtml(ctx.phaseLabel(k))}"></span>`).join('')}
        </div>
        <div class="card phase-list">
          ${rows.map(([k, ms]) => `<div class="phase-row"><span class="dot" style="background:${phaseColor(k)}"></span>
            <div class="phase-mid"><div class="phase-line"><span>${escapeHtml(ctx.phaseLabel(k))}</span>
            <span class="phase-val"><b>${fmtDur(ms)}</b><span class="muted"> · ${Math.round((ms / monthMs) * 100)} %</span></span></div></div></div>`).join('')}
        </div>` : '<p class="muted pad">Diesen Monat noch nichts getrackt.</p>'}
    </section>
    <div class="card teaser glow-card soft">
      <span class="eyebrow">Bald</span>
      <h3>Kalkuliert vs. real, über alle Projekte</h3>
      <p class="muted">Kunden-Ranking, Zeitfresser pro Projekttyp und Kalkulationsvorschläge aus deinen Erfahrungswerten.</p>
    </div>`;
}
