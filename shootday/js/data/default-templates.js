// Shoot-type templates: base packlist + default recording share.
// recordShare = estimated share of the shoot duration actually recording (0..1),
// used by the power/storage calculator in phase 2. Editable later in settings.
// extras = items that are not inventory gear (personal stuff etc.).

export const DEFAULT_TEMPLATES = [
  {
    id: 'wedding', label: 'Hochzeit', recordShare: { photo: 0.3, video: 0.4 },
    items: ['cam-a', 'cam-b', 'lens-std', 'lens-tele', 'lens-35', 'lens-85', 'lav-kit', 'recorder', 'ontop-light',
      'cam-battery', 'charger', 'card-128', 'card-reader', 'gimbal', 'monopod', 'gaffer', 'cleaning-kit'],
    extras: [{ label: 'Ersatzkleidung', category: 'personal' }, { label: 'Ablaufplan / Kontakte Trauzeugen', category: 'personal' }, { label: 'Snacks & Wasser', category: 'personal' }],
  },
  {
    id: 'commercial', label: 'Commercial', recordShare: { photo: 0.2, video: 0.25 },
    items: ['cam-a', 'cam-b', 'lens-wide', 'lens-std', 'lens-85', 'shotgun', 'lav-kit', 'headphones', 'led-panel', 'light-stand',
      'softbox', 'cam-battery', 'light-battery', 'charger', 'card-128', 'ssd', 'card-reader', 'tripod', 'gimbal', 'sandbags', 'gaffer'],
    extras: [{ label: 'Shotlist / Storyboard', category: 'personal' }, { label: 'Model-Releases', category: 'personal' }],
  },
  {
    id: 'musicvideo', label: 'Musikvideo', recordShare: { photo: 0.15, video: 0.35 },
    items: ['cam-a', 'lens-wide', 'lens-35', 'lens-85', 'led-panel', 'light-stand', 'cam-battery', 'light-battery', 'charger',
      'card-128', 'ssd', 'gimbal', 'tripod', 'gaffer'],
    extras: [{ label: 'Playback-Box / Lautsprecher', category: 'personal' }, { label: 'Song offline auf dem Handy', category: 'personal' }],
  },
  {
    id: 'social', label: 'Social', recordShare: { photo: 0.2, video: 0.3 },
    items: ['cam-a', 'lens-wide', 'lens-35', 'lav-kit', 'ontop-light', 'cam-battery', 'charger', 'card-128', 'gimbal'],
    extras: [{ label: 'Hook-Ideen / Skript', category: 'personal' }],
  },
  {
    id: 'portrait', label: 'Porträt', recordShare: { photo: 0.35, video: 0.2 },
    items: ['cam-a', 'lens-35', 'lens-85', 'led-panel', 'light-stand', 'softbox', 'cam-battery', 'charger', 'card-64', 'cleaning-kit'],
    extras: [{ label: 'Moodboard', category: 'personal' }],
  },
  {
    id: 'event', label: 'Event', recordShare: { photo: 0.3, video: 0.35 },
    items: ['cam-a', 'cam-b', 'lens-wide', 'lens-std', 'lens-tele', 'shotgun', 'ontop-light', 'cam-battery', 'charger',
      'card-128', 'card-reader', 'monopod', 'gaffer'],
    extras: [{ label: 'Akkreditierung / Ansprechpartner', category: 'personal' }, { label: 'Ohrstöpsel', category: 'personal' }],
  },
  {
    id: 'custom', label: 'Sonstiges', recordShare: { photo: 0.25, video: 0.3 },
    items: ['cam-a', 'lens-std', 'cam-battery', 'charger', 'card-128'],
    extras: [],
  },
];
