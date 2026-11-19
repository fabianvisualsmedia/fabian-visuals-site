// Starter inventory. Generic on purpose – no manufacturer specs hardcoded.
// Every numeric profile value is a placeholder and flagged with needsCheck: true
// until the user confirms it in the gear view.
// Item ids are stable slugs; templates and packlist rules reference them.

export const DEFAULT_GEAR = [
  // Camera
  { id: 'cam-a', name: 'Hauptkamera (A-Cam)', category: 'camera', quantity: 1, bitrateMbps: 200, needsCheck: true, tags: [] },
  { id: 'cam-b', name: 'Zweitkamera (B-Cam)', category: 'camera', quantity: 1, bitrateMbps: 150, needsCheck: true, tags: [] },

  // Lenses
  { id: 'lens-wide', name: 'Weitwinkel-Zoom 16–35 mm', category: 'lens', quantity: 1, tags: [] },
  { id: 'lens-std', name: 'Standard-Zoom 24–70 mm', category: 'lens', quantity: 1, tags: [] },
  { id: 'lens-tele', name: 'Tele-Zoom 70–200 mm', category: 'lens', quantity: 1, tags: [] },
  { id: 'lens-35', name: 'Festbrennweite 35 mm', category: 'lens', quantity: 1, tags: [] },
  { id: 'lens-85', name: 'Festbrennweite 85 mm', category: 'lens', quantity: 1, tags: [] },

  // Audio
  { id: 'lav-kit', name: 'Funkstrecke / Lavalier-Set', category: 'audio', quantity: 2, tags: ['audio-interview'] },
  { id: 'shotgun', name: 'Richtmikrofon', category: 'audio', quantity: 1, tags: [] },
  { id: 'recorder', name: 'Audio-Recorder', category: 'audio', quantity: 1, tags: [] },
  { id: 'deadcat', name: 'Fell-Windschutz', category: 'audio', quantity: 1, tags: ['wind'] },
  { id: 'headphones', name: 'Kopfhörer', category: 'audio', quantity: 1, tags: [] },

  // Light
  { id: 'led-panel', name: 'LED-Panel', category: 'light', quantity: 2, tags: ['night'] },
  { id: 'light-stand', name: 'Lichtstativ', category: 'light', quantity: 2, tags: ['night'] },
  { id: 'softbox', name: 'Softbox / Diffusor', category: 'light', quantity: 1, tags: [] },
  { id: 'ontop-light', name: 'Aufsteck-LED / Blitz', category: 'light', quantity: 1, tags: ['night'] },
  { id: 'headlamp', name: 'Stirnlampe', category: 'light', quantity: 1, tags: ['night'] },

  // Power
  { id: 'cam-battery', name: 'Kamera-Akku', category: 'power', quantity: 6, batteryRuntimeMin: 70, needsCheck: true, tags: ['camera'] },
  { id: 'light-battery', name: 'Licht-Akku', category: 'power', quantity: 4, batteryRuntimeMin: 90, needsCheck: true, tags: ['night'] },
  { id: 'charger', name: 'Ladegerät (Kamera)', category: 'power', quantity: 1, tags: [] },
  { id: 'powerbank', name: 'Powerbank', category: 'power', quantity: 1, tags: ['long-day'] },

  // Storage
  { id: 'card-128', name: 'Speicherkarte 128 GB', category: 'storage', quantity: 4, capacityGB: 128, tags: [] },
  { id: 'card-64', name: 'Speicherkarte 64 GB', category: 'storage', quantity: 2, capacityGB: 64, tags: [] },
  { id: 'ssd', name: 'Externe SSD', category: 'storage', quantity: 1, capacityGB: 1000, needsCheck: true, tags: ['backup'] },
  { id: 'card-reader', name: 'Kartenleser', category: 'storage', quantity: 1, tags: [] },

  // Grip
  { id: 'tripod', name: 'Videostativ', category: 'grip', quantity: 1, tags: [] },
  { id: 'gimbal', name: 'Gimbal', category: 'grip', quantity: 1, tags: [] },
  { id: 'monopod', name: 'Einbeinstativ', category: 'grip', quantity: 1, tags: [] },
  { id: 'sandbags', name: 'Sandsäcke', category: 'grip', quantity: 2, tags: ['wind'] },
  { id: 'nd-filter', name: 'ND-Filter-Set', category: 'grip', quantity: 1, tags: ['sun'] },

  // Misc
  { id: 'rain-cover', name: 'Regencover', category: 'misc', quantity: 2, tags: ['rain'] },
  { id: 'towel', name: 'Mikrofaser-Handtuch', category: 'misc', quantity: 2, tags: ['rain'] },
  { id: 'umbrella', name: 'Schirm', category: 'misc', quantity: 1, tags: ['rain'] },
  { id: 'gaffer', name: 'Gaffer Tape', category: 'misc', quantity: 1, tags: [] },
  { id: 'cleaning-kit', name: 'Reinigungsset', category: 'misc', quantity: 1, tags: [] },
  { id: 'hand-warmers', name: 'Handwärmer', category: 'misc', quantity: 4, tags: ['cold'] },
  { id: 'sunscreen', name: 'Sonnencreme', category: 'misc', quantity: 1, tags: ['sun'] },
];
