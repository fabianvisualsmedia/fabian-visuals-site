// Departure time = call time − setup − drive − buffer.
// Buffer = max(minimum, drive × percent). Done with real Date arithmetic,
// so crossing midnight or a DST switch is handled correctly.

import { parseDateTime } from '../ui.js';

export function bufferMinutes(driveMin, settings) {
  return Math.max(settings.bufferMinMin, Math.ceil((driveMin * settings.bufferPct) / 100));
}

export function departure(shoot, driveMin, settings) {
  if (driveMin == null || driveMin === '' || Number.isNaN(Number(driveMin))) return null;
  const drive = Number(driveMin);
  const buffer = bufferMinutes(drive, settings);
  const setup = settings.setupMin;
  const call = parseDateTime(shoot.date, shoot.callTime);
  const at = new Date(call.getTime() - (setup + drive + buffer) * 60000);
  return { at, drive, buffer, setup, total: setup + drive + buffer };
}

export function routeUrl(shoot, startAddress) {
  const loc = shoot.location || {};
  const dest = loc.lat != null && loc.lon != null ? `${loc.lat},${loc.lon}` : [loc.label, loc.address].filter(Boolean).join(', ');
  const params = new URLSearchParams({ api: '1', destination: dest, travelmode: 'driving' });
  if (startAddress) params.set('origin', startAddress);
  return `https://www.google.com/maps/dir/?${params}`;
}
