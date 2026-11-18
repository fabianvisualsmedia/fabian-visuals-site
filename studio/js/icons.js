// Outline-Icons (1.6px Stroke) – passend zum dünnen Linien-Look der Referenzen.
const s = (d, size = 22, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icon = {
  home: (z) => s('<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>', z),
  sun: (z) => s('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>', z),
  sunset: (z) => s('<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 4v4M5 9l1.6 1.6M19 9l-1.6 1.6M2 21h20"/>', z),
  folder: (z) => s('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>', z),
  gear: (z) => s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', z),
  mic: (z) => s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', z),
  plus: (z) => s('<path d="M12 5v14M5 12h14"/>', z),
  back: (z) => s('<path d="M15 5l-7 7 7 7"/>', z),
  close: (z) => s('<path d="M6 6l12 12M18 6 6 18"/>', z),
  more: (z) => s('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>', z),
  arrowUp: (z) => s('<path d="M12 19V5M6 11l6-6 6 6"/>', z),
  arrowRight: (z) => s('<path d="M5 12h14M13 6l6 6-6 6"/>', z),
  check: (z) => s('<path d="M5 12.5l4.5 4.5L19 7.5"/>', z, 'stroke-width="2.4"'),
  pin: (z) => s('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', z),
  locate: (z) => s('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', z),
  calendar: (z) => s('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', z),
  user: (z) => s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', z),
  speaker: (z) => s('<path d="M4 9.5h3l4.5-4v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>', z || 16),
  copy: (z) => s('<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', z),
  share: (z) => s('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>', z),
  edit: (z) => s('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>', z),
  trash: (z) => s('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', z),
  sparkle: (z) => s('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>', z),
  doc: (z) => s('<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', z),
  keyboard: (z) => s('<rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>', z),
  download: (z) => s('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', z),
  upload: (z) => s('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>', z),
  key: (z) => s('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>', z),
  wind: (z) => s('<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>', z),
  drop: (z) => s('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', z),
  cloud: (z) => s('<path d="M7 18a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 11 3.5 3.5 0 0 1 18 18z"/>', z),
  film: (z) => s('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>', z),
  install: (z) => s('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/>', z),
  logo: (z = 18) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none"><path d="M2 15c3 0 4-8 7-8s3.5 10 6.5 10S19 9 22 9" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="17" r="1.6" fill="#fff"/></svg>`,
};

export function weatherGlyph(kind, z = 20) {
  const m = {
    sun: icon.sun(z),
    'cloud-sun': s('<path d="M8 3v1.5M3.5 8H2M4.8 4.8l1 1M12 6.2A4 4 0 0 0 5.4 10"/><path d="M8.5 20a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 20 13.6 3.2 3.2 0 0 1 19 20z"/>', z),
    cloud: icon.cloud(z),
    fog: s('<path d="M4 9h16M3 13h18M5 17h14"/>', z),
    drizzle: s('<path d="M7 15a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 8 3.5 3.5 0 0 1 18 15M8 18v1M12 19v1M16 18v1"/>', z),
    rain: s('<path d="M7 14a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 7 3.5 3.5 0 0 1 18 14M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>', z),
    snow: s('<path d="M7 14a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 7 3.5 3.5 0 0 1 18 14M8 18h.01M12 20h.01M16 18h.01"/>', z),
    storm: s('<path d="M7 14a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 7 3.5 3.5 0 0 1 18 14M12 14l-2 4h4l-2 4"/>', z),
  };
  return m[kind] || icon.cloud(z);
}
