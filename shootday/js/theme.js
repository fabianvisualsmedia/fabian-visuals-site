// Theme handling: "system" follows the OS, otherwise forced dark/light.

const media = matchMedia('(prefers-color-scheme: light)');
let themePref = 'system';

export function applyTheme(pref = themePref) {
  themePref = pref;
  try { localStorage.setItem('sd-theme', pref); } catch (e) { /* storage blocked */ }
  const dark = pref === 'dark' || (pref === 'system' && !media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#050608' : '#eceef4';
}

media.addEventListener('change', () => themePref === 'system' && applyTheme());
