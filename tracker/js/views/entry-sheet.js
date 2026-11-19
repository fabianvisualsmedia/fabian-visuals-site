// Bottom sheet to add (nachtragen) or edit a time entry, with overlap detection.

import { uid } from '../db.js';
import { escapeHtml, dayKey, fmtTime, fmtDay, parseHours, hoursToInput, fmtDur } from '../format.js';
import { phaseIcon, icon } from '../icons.js';
import { openSheet, segmented, stepper, wireSteppers, confirmDialog, toast } from '../ui.js';
import { buildInterval, findOverlaps, isRunning, maxRevisionRound } from '../logic/timer.js';

const roundTo15 = (d) => new Date(Math.round(d.getTime() / 900_000) * 900_000);

/**
 * @param ctx app context
 * @param project the project the entry belongs to
 * @param entry existing entry or null for a new manual entry
 * @returns Promise<boolean> true if something changed
 */
export async function openEntrySheet(ctx, project, entry = null) {
  const { store, settings } = ctx;
  const all = await store.all('entries');
  const projects = await store.all('projects');
  const projectEntries = all.filter((e) => e.projectId === project.id);
  const running = entry && isRunning(entry);

  const end0 = entry?.end ? new Date(entry.end) : roundTo15(new Date());
  const start0 = entry ? new Date(entry.start) : new Date(end0.getTime() - 3600_000);
  const spanMs = end0 - start0;
  const mode0 = spanMs >= 24 * 3600_000 ? 'duration' : 'range';
  const phase0 = entry?.phase || 'edit';
  const round0 = entry?.revisionRound || Math.max(1, maxRevisionRound(projectEntries));

  const body = `
    <form class="form entry-form" novalidate>
      <div class="field"><span>Phase</span>
        <div class="phase-grid">
          ${settings.phases
            .map(
              (p) => `<label class="phase-opt"><input type="radio" name="phase" value="${p.key}" ${p.key === phase0 ? 'checked' : ''}>
                <span>${phaseIcon(p.key, 18)}<em>${escapeHtml(p.label)}</em></span></label>`,
            )
            .join('')}
        </div>
      </div>
      <div class="field inline" data-round>
        <span>Korrekturrunde${project.includedRevisions != null ? ` <small class="muted">(${project.includedRevisions} inklusive)</small>` : ''}</span>
        ${stepper('round', round0, { min: 1, max: 20 })}
      </div>
      ${running ? '' : segmented('mode', [{ key: 'range', label: 'Von – bis' }, { key: 'duration', label: 'Dauer' }], mode0)}
      <div class="field-row three">
        <label class="field"><span>Datum</span><input type="date" name="date" value="${dayKey(start0)}" required></label>
        <label class="field"><span>${running ? 'Gestartet' : 'Von'}</span><input type="time" name="from" value="${fmtTime(start0)}" required></label>
        ${running ? '' : `
        <label class="field" data-mode="range"><span>Bis</span><input type="time" name="to" value="${fmtTime(end0)}"></label>
        <label class="field" data-mode="duration"><span>Dauer (h)</span><input name="duration" inputmode="decimal" value="${hoursToInput(Math.round((spanMs / 3600_000) * 100) / 100)}" placeholder="1,5 oder 1:30"></label>`}
      </div>
      <p class="hint" data-preview></p>
      <label class="field"><span>Notiz</span><input name="note" value="${escapeHtml(entry?.note || '')}" placeholder="optional, z. B. „Rohschnitt Akt 2“" autocomplete="off"></label>
      <div class="overlap" data-overlap hidden></div>
      <p class="field-error" data-err hidden></p>
      <div class="btn-row">
        ${entry ? `<button type="button" class="btn danger-ghost" data-delete aria-label="Eintrag löschen">${icon('trash', 18)}</button>` : ''}
        <button type="submit" class="btn primary block" data-save>${entry ? 'Speichern' : 'Nachtragen'}</button>
      </div>
    </form>`;

  return openSheet({
    title: entry ? (running ? 'Laufenden Eintrag bearbeiten' : 'Eintrag bearbeiten') : 'Zeit nachtragen',
    subtitle: project.title,
    body,
    onMount(el, close) {
      const form = el.querySelector('form');
      const F = form.elements;
      const err = el.querySelector('[data-err]');
      const overlapBox = el.querySelector('[data-overlap]');
      const saveBtn = el.querySelector('[data-save]');
      let confirmedOverlap = false;
      wireSteppers(form);

      const mode = () => (running ? 'running' : form.querySelector('[name="mode"]:checked').value);
      const phase = () => form.querySelector('[name="phase"]:checked').value;

      const interval = () => {
        if (!F.date.value || !F.from.value) return null;
        if (mode() === 'running') {
          const { start } = buildInterval({ dateStr: F.date.value, fromStr: F.from.value, durationHours: 0 });
          return { start, end: null };
        }
        if (mode() === 'duration') {
          const h = parseHours(F.duration.value);
          if (!h || Number.isNaN(h)) return null;
          return buildInterval({ dateStr: F.date.value, fromStr: F.from.value, durationHours: h });
        }
        if (!F.to.value) return null;
        return buildInterval({ dateStr: F.date.value, fromStr: F.from.value, toStr: F.to.value });
      };

      const sync = () => {
        form.querySelector('[data-round]').hidden = phase() !== 'revisions';
        form.querySelectorAll('[data-mode]').forEach((f) => (f.hidden = f.dataset.mode !== mode()));
        const iv = interval();
        const prev = el.querySelector('[data-preview]');
        if (iv && iv.end) {
          const nextDay = dayKey(iv.end) !== dayKey(iv.start);
          prev.textContent = `${fmtDur(Date.parse(iv.end) - Date.parse(iv.start))}${nextDay ? ` · endet ${fmtDay(iv.end)}, ${fmtTime(iv.end)}` : ''}`;
        } else prev.textContent = '';
        confirmedOverlap = false;
        overlapBox.hidden = true;
        saveBtn.textContent = entry ? 'Speichern' : 'Nachtragen';
      };
      form.addEventListener('input', sync);
      form.addEventListener('change', sync);
      sync();

      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        const ok = await confirmDialog(running ? 'Der laufende Timer wird verworfen.' : 'Dieser Eintrag wird gelöscht.', {
          title: 'Eintrag löschen?', confirmLabel: 'Löschen', danger: true,
        });
        if (!ok) return;
        await store.del('entries', entry.id);
        toast('Eintrag gelöscht');
        close(true);
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.hidden = true;
        const iv = interval();
        if (!iv) {
          err.hidden = false;
          err.textContent = mode() === 'duration' ? 'Dauer fehlt oder ist nicht lesbar.' : 'Bitte Datum und Uhrzeiten ausfüllen.';
          return;
        }
        const now = Date.now();
        if (Date.parse(iv.start) > now || (iv.end && Date.parse(iv.end) > now + 60_000)) {
          err.hidden = false;
          err.textContent = 'Der Eintrag liegt in der Zukunft.';
          return;
        }
        const ph = phase();
        const candidate = {
          id: entry?.id || uid(),
          projectId: project.id,
          phase: ph,
          start: iv.start,
          end: iv.end,
          revisionRound: ph === 'revisions' ? Number(F.round.value) : null,
          note: F.note.value.trim(),
          manual: entry ? entry.manual || (!running && (iv.start !== entry.start || iv.end !== entry.end)) : true,
        };
        const clashes = findOverlaps(all, candidate);
        if (clashes.length && !confirmedOverlap) {
          const pName = (id) => projects.find((p) => p.id === id)?.title || 'Projekt';
          overlapBox.hidden = false;
          overlapBox.innerHTML = `
            <strong>${icon('alert', 16)} Überschneidung mit ${clashes.length === 1 ? 'einem Eintrag' : `${clashes.length} Einträgen`}</strong>
            <ul>${clashes.slice(0, 4).map((c) => `<li>${escapeHtml(pName(c.projectId))} · ${escapeHtml(ctx.phaseLabel(c.phase))} · ${fmtDay(c.start)} ${fmtTime(c.start)}–${c.end ? fmtTime(c.end) : 'läuft'}</li>`).join('')}</ul>
            <p class="muted">Doppelt gezählte Zeit verfälscht deinen echten Stundensatz.</p>`;
          confirmedOverlap = true;
          saveBtn.textContent = 'Trotzdem speichern';
          return;
        }
        await store.put('entries', candidate);
        toast(entry ? 'Eintrag gespeichert' : 'Zeit nachgetragen');
        close(true);
      });
    },
  });
}
