// Create / edit a project incl. client, fee and per-phase estimate.

import { PROJECT_TYPES, STATUSES, FEE_TYPES } from '../config.js';
import { uid } from '../db.js';
import { escapeHtml, parseEUR, centsToInput, parseHours, hoursToInput, fmtH, fmtEUR } from '../format.js';
import { icon, phaseIcon } from '../icons.js';
import { segmented, stepper, wireSteppers, confirmDialog, toast } from '../ui.js';

export async function renderProjectEdit(el, ctx, id) {
  const { store, settings } = ctx;
  const existing = id ? await store.get('projects', id) : null;
  if (id && !existing) throw new Error('Projekt nicht gefunden.');
  const clients = (await store.all('clients')).filter((c) => !c.archived || c.id === existing?.clientId)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const p = existing || {
    id: uid(),
    clientId: clients[0]?.id || '',
    title: '',
    type: 'commercial',
    status: 'active',
    fee: 0,
    feeType: 'fixed',
    hourlyRate: settings.targetHourlyRate,
    dailyRate: 0,
    days: 1,
    includedRevisions: 2,
    estimate: {},
    costs: [],
    startDate: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    notes: '',
  };
  const net = settings.smallBusiness ? '' : ' (netto)';

  el.innerHTML = `
    <header class="page-head compact">
      <a class="icon-btn" href="${existing ? `#/project/${p.id}` : '#/'}" aria-label="Zurück">${icon('back', 20)}</a>
      <h1 class="page-title-sm">${existing ? 'Projekt bearbeiten' : 'Neues Projekt'}</h1>
      <span class="icon-btn-spacer"></span>
    </header>

    <form class="form" novalidate>
      <section class="card form-card">
        <label class="field"><span>Titel</span>
          <input name="title" required value="${escapeHtml(p.title)}" placeholder="z. B. Musikvideo „Neon Nights“" autocomplete="off">
        </label>
        <label class="field"><span>Kunde</span>
          <select name="clientId">
            <option value="">Ohne Kunde</option>
            ${clients.map((c) => `<option value="${c.id}" ${c.id === p.clientId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            <option value="__new" ${!clients.length ? 'selected' : ''}>+ Neuer Kunde …</option>
          </select>
        </label>
        <label class="field" data-newclient ${clients.length ? 'hidden' : ''}><span>Name des neuen Kunden</span>
          <input name="newClient" placeholder="z. B. Hair by SK" autocomplete="off">
        </label>
        <div class="field"><span>Projekttyp</span>
          <div class="chip-row wrap">
            ${PROJECT_TYPES.map((t) => `<label class="chip radio"><input type="radio" name="type" value="${t.key}" ${t.key === p.type ? 'checked' : ''}><span>${escapeHtml(t.label)}</span></label>`).join('')}
          </div>
        </div>
        <div class="field"><span>Status</span>
          <div class="chip-row wrap">
            ${STATUSES.map((s) => `<label class="chip radio"><input type="radio" name="status" value="${s.key}" ${s.key === p.status ? 'checked' : ''}><span>${escapeHtml(s.label)}</span></label>`).join('')}
          </div>
        </div>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Honorar</h2>
        ${segmented('feeType', FEE_TYPES, p.feeType)}
        <div data-fee="fixed">
          <label class="field"><span>Honorar${net}</span>
            <div class="input-unit"><input name="fee" inputmode="decimal" value="${centsToInput(p.fee)}" placeholder="0"><em>€</em></div>
          </label>
        </div>
        <div data-fee="hourly">
          <label class="field"><span>Stundensatz${net}</span>
            <div class="input-unit"><input name="hourlyRate" inputmode="decimal" value="${centsToInput(p.hourlyRate)}" placeholder="0"><em>€/h</em></div>
          </label>
          <label class="field"><span>Angebotssumme (optional, zum Vergleich)</span>
            <div class="input-unit"><input name="feeHourly" inputmode="decimal" value="${p.feeType === 'hourly' ? centsToInput(p.fee) : ''}" placeholder="0"><em>€</em></div>
          </label>
        </div>
        <div data-fee="daily">
          <div class="field-row">
            <label class="field"><span>Tagessatz${net}</span>
              <div class="input-unit"><input name="dailyRate" inputmode="decimal" value="${centsToInput(p.dailyRate)}" placeholder="0"><em>€</em></div>
            </label>
            <label class="field"><span>Tage</span>
              <input name="days" inputmode="decimal" value="${hoursToInput(p.days)}" placeholder="1">
            </label>
          </div>
          <p class="hint" data-daily-sum></p>
        </div>
        <div class="field inline">
          <span>Korrekturschleifen inklusive</span>
          ${stepper('includedRevisions', p.includedRevisions ?? 2, { min: 0, max: 10 })}
        </div>
        ${settings.smallBusiness ? '<p class="hint">Kleinunternehmer nach §19 UStG – alle Beträge sind Endbeträge.</p>' : ''}
      </section>

      <section class="card form-card">
        <div class="card-title-row">
          <h2 class="card-title">Kalkulation</h2>
          <span class="sum" data-est-sum></span>
        </div>
        <p class="hint">Stunden pro Phase – alles optional. „1,5“ oder „1:30“.</p>
        <div class="est-grid">
          ${settings.phases.map((ph) => `
            <label class="est">
              <span class="est-ic">${phaseIcon(ph.key, 18)}</span>
              <span class="est-label">${escapeHtml(ph.label)}</span>
              <input name="est_${ph.key}" inputmode="decimal" value="${hoursToInput(p.estimate?.[ph.key])}" placeholder="0" aria-label="${escapeHtml(ph.label)} in Stunden">
              <em>h</em>
            </label>`).join('')}
        </div>
      </section>

      <section class="card form-card">
        <h2 class="card-title">Zeitraum & Notizen</h2>
        <div class="field-row">
          <label class="field"><span>Start</span><input type="date" name="startDate" value="${p.startDate || ''}"></label>
          <label class="field"><span>Lieferung</span><input type="date" name="deliveryDate" value="${p.deliveryDate || ''}"></label>
        </div>
        <label class="field"><span>Notizen</span><textarea name="notes" rows="3" placeholder="Deliverables, Absprachen, Musiklizenz …">${escapeHtml(p.notes)}</textarea></label>
      </section>

      ${existing ? `<button type="button" class="btn danger-ghost block" data-delete>${icon('trash', 18)}Projekt löschen</button>` : ''}

      <div class="save-bar">
        <p class="field-error" data-err hidden></p>
        <button type="submit" class="btn primary glow-btn block">${existing ? 'Speichern' : 'Projekt anlegen'}</button>
      </div>
    </form>`;

  const form = el.querySelector('form');
  const F = form.elements;
  wireSteppers(form);

  const sel = F.clientId;
  const newClientField = form.querySelector('[data-newclient]');
  sel.addEventListener('change', () => {
    newClientField.hidden = sel.value !== '__new';
    if (!newClientField.hidden) F.newClient.focus();
  });

  const syncFee = () => {
    const t = form.querySelector('[name="feeType"]:checked').value;
    form.querySelectorAll('[data-fee]').forEach((b) => (b.hidden = b.dataset.fee !== t));
    const rate = parseEUR(F.dailyRate.value), days = parseHours(F.days.value);
    form.querySelector('[data-daily-sum]').textContent =
      rate > 0 && days > 0 ? `Honorar: ${fmtEUR(Math.round(rate * days))}` : '';
  };
  form.addEventListener('change', syncFee);
  F.dailyRate.addEventListener('input', syncFee);
  F.days.addEventListener('input', syncFee);
  syncFee();

  const syncEst = () => {
    const sum = settings.phases.reduce((s, ph) => s + (parseHours(F[`est_${ph.key}`].value) || 0), 0);
    form.querySelector('[data-est-sum]').textContent = sum ? `Σ ${fmtH(sum, 2)}` : '';
  };
  form.addEventListener('input', (e) => e.target.name?.startsWith('est_') && syncEst());
  syncEst();

  form.querySelector('[data-delete]')?.addEventListener('click', async () => {
    const entries = await store.byIndex('entries', 'projectId', p.id);
    const ok = await confirmDialog(
      `„${p.title}“ und ${entries.length} Zeiteinträge werden endgültig gelöscht.`,
      { title: 'Projekt löschen?', confirmLabel: 'Löschen', danger: true },
    );
    if (!ok) return;
    await store.delMany('entries', entries.map((e) => e.id));
    await store.del('projects', p.id);
    toast('Projekt gelöscht');
    ctx.navigate('#/projects');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('[data-err]');
    const fail = (msg, field) => {
      err.hidden = false;
      err.textContent = msg;
      field?.focus();
      field?.setAttribute('aria-invalid', 'true');
    };
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    err.hidden = true;

    const title = F.title.value.trim();
    if (!title) return fail('Bitte gib dem Projekt einen Titel.', F.title);

    let clientId = sel.value;
    if (clientId === '__new') {
      const name = F.newClient.value.trim();
      if (!name) return fail('Name für den neuen Kunden fehlt.', F.newClient);
      clientId = null;
    }

    const feeType = form.querySelector('[name="feeType"]:checked').value;
    const money = (input) => {
      const v = parseEUR(input.value);
      if (Number.isNaN(v) || v < 0) throw Object.assign(new Error('Betrag nicht lesbar – z. B. 1.200 oder 1200,50.'), { field: input });
      return v;
    };
    const estimate = {};
    try {
      for (const ph of settings.phases) {
        const input = F[`est_${ph.key}`];
        const h = parseHours(input.value);
        if (Number.isNaN(h)) throw Object.assign(new Error(`Stunden für „${ph.label}“ nicht lesbar.`), { field: input });
        if (h) estimate[ph.key] = Math.round(h * 100) / 100;
      }
      var fee = feeType === 'fixed' ? money(F.fee) : feeType === 'hourly' ? money(F.feeHourly) : 0;
      var hourlyRate = money(F.hourlyRate);
      var dailyRate = money(F.dailyRate);
      var days = parseHours(F.days.value);
      if (Number.isNaN(days)) throw Object.assign(new Error('Anzahl Tage nicht lesbar.'), { field: F.days });
    } catch (ex) {
      return fail(ex.message, ex.field);
    }
    if (feeType === 'daily') fee = Math.round(dailyRate * days);

    if (clientId === null) {
      const client = { id: uid(), name: F.newClient.value.trim(), notes: '', archived: false };
      await store.put('clients', client);
      clientId = client.id;
    }

    const project = {
      ...p,
      title,
      clientId,
      type: form.querySelector('[name="type"]:checked').value,
      status: form.querySelector('[name="status"]:checked').value,
      feeType,
      fee,
      hourlyRate: feeType === 'hourly' ? hourlyRate : p.hourlyRate,
      dailyRate: feeType === 'daily' ? dailyRate : p.dailyRate,
      days: feeType === 'daily' ? days : p.days,
      includedRevisions: Number(F.includedRevisions.value),
      estimate,
      startDate: F.startDate.value,
      deliveryDate: F.deliveryDate.value,
      notes: F.notes.value.trim(),
    };
    await store.put('projects', project);
    toast(existing ? 'Gespeichert' : 'Projekt angelegt');
    ctx.navigate(`#/project/${project.id}`);
  });
}
