// Applies the persisted (or system) color scheme before first paint to avoid a
// flash of light mode. Kept as an external file (not inline) so the app can ship
// a strict `script-src 'self'` CSP without `'unsafe-inline'`.
try {
	var t = localStorage.getItem('theme');
	if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
		document.documentElement.classList.add('dark');
	}
} catch (e) {}
