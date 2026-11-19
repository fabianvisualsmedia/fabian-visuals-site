// Settings: rates, timer guard, rounding, §19 switch, phases, accent.

import { ACCENTS, DEFAULT_PHASES } from '../config.js';
import { escapeHtml, centsToInput, parseEUR, parseHours, hoursToInput } from '../format.js';
import { icon, phaseIcon } from '../icons.js';
import { toast, segmented } from '../ui.js';

export async function renderSettings(el, ctx) {
  const s = await ctx.store.getSettings();
  const entries = await ctx.store.all('entries');
  const usedPhases = new Set(entries.map((e) => e.phase));
  const builtin = new Set(DEFAULT_PHASES.map((p) => p.key));

  el.innerHTML = `
    <header class="page-head compact">
      <a class="icon-btn" href="#/" aria-label="Zurück">${icon('back', 20)}</a>
      <h1 class="page-title-sm">Einstellungen</h1>
      <span class="icon-btn-spacer"></span>
    </header>
    <form class="form" novalidate>
      <section class="card form-card">
        <h2 class="card-title">Stundensätze</h2>
        <div class="field-row">
          <label class="field"><span>Ziel</span><div class="input-unit"><input name="targetHourlyRate" inputmode="decimal" value="${centsToInput(s.targetHourlyRate)}"><em>€/h</em></div></label>
          <label class="field"><span>Schmerzgrenze</span><div class="input-unit"><input name="minHourlyRate" inputmode="decimal" value="${centsToInput(s.minHourlyRate)}"><em>€/h</em></div></label>
        </div>
        <p class="hint">Steuern die Ampel: grün ab Ziel, rot unter der Schmerzgrenze.</p>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Timer & Nachweis</h2>
        <label class="field inline"><span>Nachfragen, wenn ein Timer länger läuft als</span>
          <div class="input-unit short"><input name="timerWarnHours" inputmode="decimal" value="${hoursToInput(s.timerWarnHours)}"><em>h</em></div>
        </label>
        <div class="field"><span>Rundung im Leistungsnachweis (aufrunden)</span>
          ${segmented('roundingMinutes', [0, 5, 15, 30, 60].map((m) => ({ key: String(m), label: m ? `${m} min` : 'keine' })), String(s.roundingMinutes))}
        </div>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Steuer</h2>
        <label class="switch"><input type="checkbox" name="smallBusiness" ${s.smallBusiness ? 'checked' : ''}><span class="track"></span>
          <span>Kleinunternehmer nach §19 UStG<small class="muted">Beträge sind Endbeträge, keine USt-Felder.</small></span></label>
      </section>

      <section class="card form-card">
        <div class="card-title-row"><h2 class="card-title">Phasen</h2><button type="button" class="link" data-add-phase>+ Phase</button></div>
        <p class="hint">Umbenennen und Reihenfolge ändern. Eigene Phasen lassen sich löschen, solange sie keine Einträge haben.</p>
        <ol class="phase-edit">
          ${s.phases.map((p, i) => `
            <li data-key="${p.key}">
              <span class="phase-ic">${phaseIcon(p.key, 16)}</span>
              <input value="${escapeHtml(p.label)}" aria-label="Name der Phase" data-label>
              <button type="button" class="icon-btn xs" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${icon('back', 14, 'style="transform:rotate(90deg)"')}</button>
              <button type="button" class="icon-btn xs" data-move="1" ${i === s.phases.length - 1 ? 'disabled' : ''} aria-label="Nach unten">${icon('back', 14, 'style="transform:rotate(-90deg)"')}</button>
              ${!builtin.has(p.key) && !usedPhases.has(p.key) ? `<button type="button" class="icon-btn xs" data-remove aria-label="Phase löschen">${icon('x', 14)}</button>` : '<span class="icon-btn-spacer xs"></span>'}
            </li>`).join('')}
        </ol>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Look</h2>
        <div class="accent-row">
          ${ACCENTS.map((a) => `<label class="accent-opt"><input type="radio" name="accent" value="${a.key}" ${a.key === s.accent ? 'checked' : ''}>
            <span class="swatch" style="--a:${a.swatch[0]};--b:${a.swatch[1]}"></span><em>${a.label}</em></label>`).join('')}
        </div>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Daten</h2>
        <p class="hint">Alles liegt nur lokal in diesem Browser. JSON-Backup, Import und CSV-Export kommen in Phase 4 – bis dahin nicht die Browserdaten löschen.</p>
      </section>
    </form>`;

  const form = el.querySelector('form');
  const F = form.elements;

  const collectPhases = () =>
    [...form.querySelectorAll('.phase-edit li')].map((li) => ({
      key: li.dataset.key,
      label: li.querySelector('[data-label]').value.trim() || s.phases.find((p) => p.key === li.dataset.key)?.label || li.dataset.key,
    }));

  const save = async (rerender = false) => {
    const target = parseEUR(F.targetHourlyRate.value);
    const min = parseEUR(F.minHourlyRate.value);
    const warn = parseHours(F.timerWarnHours.value);
    if ([target, min].some((v) => Number.isNaN(v) || v < 0) || Number.isNaN(warn) || warn <= 0) {
      toast('Wert nicht lesbar – bitte prüfen', { tone: 'bad' });
      return;
    }
    const next = await ctx.store.saveSettings({
      targetHourlyRate: target,
      minHourlyRate: min,
      timerWarnHours: warn,
      roundingMinutes: Number(form.querySelector('[name="roundingMinutes"]:checked').value),
      smallBusiness: F.smallBusiness.checked,
      accent: form.querySelector('[name="accent"]:checked').value,
      phases: collectPhases(),
    });
    document.documentElement.dataset.accent = next.accent;
    ctx.settings = next;
    toast(min > target ? 'Gespeichert – Schmerzgrenze liegt über dem Ziel?' : 'Gespeichert');
    if (rerender) ctx.refresh();
  };

  form.addEventListener('change', (e) => save(false));

  form.addEventListener('click', async (e) => {
    const mv = e.target.closest('[data-move]');
    const rm = e.target.closest('[data-remove]');
    const add = e.target.closest('[data-add-phase]');
    if (mv) {
      const li = mv.closest('li');
      const dir = Number(mv.dataset.move);
      const sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (sib) dir < 0 ? sib.before(li) : sib.after(li);
      await save(true);
    }
    if (rm) {
      rm.closest('li').remove();
      await save(true);
    }
    if (add) {
      const key = `custom_${Date.now().toString(36)}`;
      await ctx.store.saveSettings({ phases: [...collectPhases(), { key, label: 'Neue Phase' }] });
      await ctx.refresh();
      const input = document.querySelector(`li[data-key="${key}"] [data-label]`);
      input?.focus();
      input?.select();
    }
  });
}
