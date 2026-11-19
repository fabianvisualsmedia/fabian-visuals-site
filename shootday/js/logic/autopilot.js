// Glue: takes a shoot + inventory + settings + weather and computes everything
// the shoot-day view shows. Pure function (no I/O) so it is easy to test.

import { durationMin, parseDateTime } from '../ui.js';
import { sunTimes, sunPosition } from './sun.js';
import { hoursForShoot, summarize } from './weather.js';
import { calcStorage, calcBatteries } from './power-storage.js';
import { departure } from './travel.js';
import { autoItems, mergeChecklist } from './packlist.js';

export function defaultShare(shoot, template) {
  const t = template?.recordShare || { photo: 0.25, video: 0.3 };
  return shoot.mode === 'photo' ? t.photo : t.video;
}

/** Camera battery profile: tagged "camera", else any power item with a runtime that isn't for lights. */
export function cameraBattery(gear) {
  const withRuntime = gear.filter((g) => g.category === 'power' && g.batteryRuntimeMin > 0);
  return withRuntime.find((g) => g.tags?.includes('camera')) || withRuntime.find((g) => !g.tags?.includes('night')) || null;
}

export const mediaCards = (gear) => gear.filter((g) => g.category === 'storage' && g.capacityGB > 0 && !g.tags?.includes('backup'));

export function computeAutopilot({ shoot, gear, template, settings, weatherHours = [] }) {
  const dur = durationMin(shoot.callTime, shoot.wrapTime);
  const callAt = parseDateTime(shoot.date, shoot.callTime);
  const wrapAt = new Date(callAt.getTime() + dur * 60000);
  const { lat, lon } = shoot.location || {};
  const hasCoords = lat != null && lon != null;

  const sun = hasCoords ? sunTimes(parseDateTime(shoot.date, '12:00'), lat, lon) : null;
  const sunAtCall = hasCoords ? sunPosition(callAt, lat, lon) : null;

  const shootHours = hoursForShoot(weatherHours, shoot);
  const weather = summarize(shootHours);

  const share = shoot.recordShare ?? defaultShare(shoot, template);
  const base = { shoot, template, gear, weather, sun, wrapAt, durationMin: dur };

  // First pass: which bodies end up in the list?
  const first = autoItems(base);
  const gearById = new Map(gear.map((g) => [g.id, g]));
  const excluded = new Set(shoot.excluded || []);
  // bodies the user removed from the list don't record, so they don't need cards/batteries
  const bodies = first.items
    .filter((i) => i.category === 'camera' && i.itemId && !excluded.has(i.itemId))
    .map((i) => gearById.get(i.itemId));

  const storage = calcStorage({
    durationMin: dur, share, mode: shoot.mode, cameras: bodies,
    photoGBPerHour: settings.photoGBPerHour, cards: mediaCards(gear),
  });
  const battery = cameraBattery(gear);
  const batteries = battery
    ? calcBatteries({
      durationMin: dur, share, bodies: bodies.length || 1,
      runtimeMin: battery.batteryRuntimeMin, cold: !!weather && weather.tempMin < 5, available: battery.quantity,
    })
    : null;

  const quantities = {};
  if (battery && batteries) quantities[battery.id] = batteries.need;
  storage.plan.picks.forEach((p) => { quantities[p.card.id] = p.count; });

  const second = autoItems({ ...base, quantities });
  const checklist = mergeChecklist(second.items, shoot.checklist, shoot.excluded);

  const placeholders = [...bodies, battery].filter((g) => g?.needsCheck).map((g) => g.name);

  return {
    durationMin: dur, callAt, wrapAt, share,
    sun, sunAtCall, shootHours, weather,
    storage, batteries, battery, bodies,
    hints: second.hints, checklist, placeholders,
    departure: departure(shoot, shoot.travel?.driveMin, settings),
  };
}
