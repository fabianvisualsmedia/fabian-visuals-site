// Battery + storage calculator. All inputs come from the user's gear profiles.

export const STORAGE_BUFFER = 0.3; // +30 % safety margin

/** Minutes actually recording = shoot duration × recording share. */
export const recordMinutes = (durationMin, share) => Math.round(durationMin * share);

/** Video data in GB: Mbit/s × minutes × 60 s ÷ 8 bit ÷ 1000 MB. */
export const videoGB = (bitrateMbps, minutes) => (bitrateMbps * minutes * 60) / 8 / 1000;

/**
 * Pick cards from the inventory to cover `needGB`: largest cards first,
 * then swap the last card for the smallest single card that still covers the rest.
 * cards: [{ id, name, capacityGB, quantity }]
 */
export function planCards(needGB, cards) {
  const pool = cards.filter((c) => c.capacityGB > 0 && c.quantity > 0).sort((a, b) => b.capacityGB - a.capacityGB);
  const picks = new Map();
  let remaining = needGB;
  for (const c of pool) {
    while (remaining > 0 && (picks.get(c.id)?.count || 0) < c.quantity) {
      // if a smaller card type alone covers what is left, prefer it for the last slot
      const smaller = pool.filter((s) => s.capacityGB < c.capacityGB && s.capacityGB >= remaining && (picks.get(s.id)?.count || 0) < s.quantity)
        .sort((a, b) => a.capacityGB - b.capacityGB)[0];
      const take = smaller || c;
      const p = picks.get(take.id) || { card: take, count: 0 };
      p.count += 1;
      picks.set(take.id, p);
      remaining -= take.capacityGB;
    }
    if (remaining <= 0) break;
  }
  const list = [...picks.values()].sort((a, b) => b.card.capacityGB - a.card.capacityGB);
  return {
    picks: list,
    coveredGB: list.reduce((n, p) => n + p.count * p.card.capacityGB, 0),
    enough: remaining <= 0,
    totalInventoryGB: pool.reduce((n, c) => n + c.capacityGB * c.quantity, 0),
  };
}

/**
 * Storage need for a shoot.
 * cameras: [{ bitrateMbps }] – each body assumed recording the full record time (safe side)
 * photoGBPerHour: user estimate for photo mode
 */
export function calcStorage({ durationMin, share, mode, cameras, photoGBPerHour, cards }) {
  const minutes = recordMinutes(durationMin, share);
  const bitrate = cameras.reduce((n, c) => n + (c.bitrateMbps || 0), 0);
  const video = mode === 'photo' ? 0 : videoGB(bitrate, minutes);
  const photo = mode === 'video' ? 0 : (photoGBPerHour * minutes) / 60;
  const rawGB = video + photo;
  const needGB = Math.ceil(rawGB * (1 + STORAGE_BUFFER));
  return { minutes, bitrate, rawGB, needGB, plan: planCards(needGB, cards) };
}

/**
 * Battery need: per body ceil(recordMin / runtime), plus 1 reserve, plus 1 more when cold.
 */
export function calcBatteries({ durationMin, share, bodies, runtimeMin, cold, available }) {
  if (!runtimeMin) return null;
  const minutes = recordMinutes(durationMin, share);
  const perBody = Math.ceil(minutes / runtimeMin);
  const reserve = 1 + (cold ? 1 : 0);
  const need = Math.max(1, bodies) * perBody + reserve;
  return { minutes, perBody, reserve, need, available, enough: available == null || available >= need };
}

/** Human readable summary, e.g. "≈ 180 GB → 2× 128 GB". */
export function storageLabel(plan) {
  return plan.picks.map((p) => `${p.count}× ${p.card.capacityGB} GB`).join(' + ');
}
