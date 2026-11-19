// Clients: list, create, edit, archive. (Ranking by real hourly rate follows in phase 3.)

import { uid } from '../db.js';
import { escapeHtml, fmtDur, fmtEUR } from '../format.js';
import { icon } from '../icons.js';
import { openSheet, confirmDialog, toast, delegate } from '../ui.js';
import { sumMs, projectFee } from '../logic/calc.js';
import { loadAll, emptyState } from './shared.js';

let showArchived = false;

export async function renderClients(el, ctx) {
  const { clients, projects, entriesByProject } = await loadAll(ctx.store);
  const stats = (c) => {
    const ps = projects.filter((p) => p.clientId === c.id);
    const ms = ps.reduce((s, p) => s + sumMs(entriesByProject.get(p.id) || []), 0);
    const revenue = ps.filter((p) => ['delivered', 'paid', 'archived'].includes(p.status)).reduce((s, p) => s + projectFee(p), 0);
    return { count: ps.length, ms, revenue };
  };
  const list = clients
    .filter((c) => showArchived || !c.archived)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const archivedCount = clients.filter((c) => c.archived).length;

  el.innerHTML = `
    <header class="page-head">
      <div><p class="eyebrow">${clients.length - archivedCount} aktiv</p><h1>Kunden</h1></div>
      <button class="icon-btn accent" data-action="new" aria-label="Neuer Kunde">${icon('plus', 20)}</button>
    </header>
    ${list.length
      ? `<div class="list">${list.map((c) => {
          const s = stats(c);
          return `<button class="row ${c.archived ? 'is-archived' : ''}" data-action="edit" data-id="${c.id}">
            <span class="avatar" aria-hidden="true">${escapeHtml(c.name.trim().slice(0, 1).toUpperCase())}</span>
            <div class="row-main">
              <strong>${escapeHtml(c.name)}${c.archived ? ' <span class="tag">archiviert</span>' : ''}</strong>
              <span class="muted">${s.count} ${s.count === 1 ? 'Projekt' : 'Projekte'} · ${fmtDur(s.ms)}</span>
            </div>
            <div class="row-side"><span>${s.revenue ? fmtEUR(s.revenue) : ''}</span><span class="muted">${s.revenue ? 'abgeschlossen' : ''}</span></div>
            ${icon('chevron', 18)}
          </button>`;
        }).join('')}</div>`
      : emptyState('Noch keine Kunden', 'Kunden kannst du hier oder direkt beim Projekt anlegen.', `<button class="btn primary" data-action="new">${icon('plus', 16)}Kunde anlegen</button>`)}
    ${archivedCount ? `<button class="btn link-btn" data-action="toggle">${showArchived ? 'Archivierte ausblenden' : `${archivedCount} archivierte anzeigen`}</button>` : ''}
    <div class="card teaser">
      <span class="eyebrow">Bald</span>
      <h3>Kunden-Ranking nach echtem Stundensatz</h3>
      <p class="muted">Sobald Kennzahlen & Insights stehen, siehst du hier, welche Kunden sich wirklich lohnen.</p>
    </div>`;

  delegate(el, {
    new: async () => (await clientSheet(ctx, null, 0)) && ctx.refresh(),
    edit: async (b) => {
      const c = clients.find((x) => x.id === b.dataset.id);
      if (await clientSheet(ctx, c, stats(c).count)) ctx.refresh();
    },
    toggle: () => {
      showArchived = !showArchived;
      ctx.refresh();
    },
  });
}

function clientSheet(ctx, client, projectCount) {
  const c = client || { id: uid(), name: '', notes: '', archived: false };
  return openSheet({
    title: client ? 'Kunde bearbeiten' : 'Neuer Kunde',
    body: `
      <form class="form" novalidate>
        <label class="field"><span>Name</span><input name="name" value="${escapeHtml(c.name)}" required autofocus autocomplete="off"></label>
        <label class="field"><span>Notizen</span><textarea name="notes" rows="3" placeholder="Ansprechpartner, Eigenheiten, Zahlungsmoral …">${escapeHtml(c.notes)}</textarea></label>
        ${client ? `<label class="switch"><input type="checkbox" name="archived" ${c.archived ? 'checked' : ''}><span class="track"></span><span>Archiviert</span></label>` : ''}
        <p class="field-error" data-err hidden></p>
        <div class="btn-row">
          ${client ? `<button type="button" class="btn danger-ghost" data-delete aria-label="Kunde löschen">${icon('trash', 18)}</button>` : ''}
          <button type="submit" class="btn primary block">${client ? 'Speichern' : 'Anlegen'}</button>
        </div>
      </form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const F = form.elements;
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (projectCount) {
          const err = el.querySelector('[data-err]');
          err.hidden = false;
          err.textContent = `Hat noch ${projectCount} ${projectCount === 1 ? 'Projekt' : 'Projekte'} – archiviere den Kunden stattdessen.`;
          return;
        }
        if (await confirmDialog(`„${c.name}“ wird gelöscht.`, { title: 'Kunde löschen?', confirmLabel: 'Löschen', danger: true })) {
          await ctx.store.del('clients', c.id);
          toast('Kunde gelöscht');
          close(true);
        }
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = F.name.value.trim();
        if (!name) {
          const err = el.querySelector('[data-err]');
          err.hidden = false;
          err.textContent = 'Name fehlt.';
          F.name.focus();
          return;
        }
        await ctx.store.put('clients', { ...c, name, notes: F.notes.value.trim(), archived: !!F.archived?.checked });
        toast(client ? 'Gespeichert' : 'Kunde angelegt');
        close(true);
      });
    },
  });
}
