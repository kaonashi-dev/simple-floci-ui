import { browser } from '$app/environment';

function createTheme() {
	let dark = $state(
		browser
			? (localStorage.getItem('theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'
			: false
	);

	return {
		get dark() {
			return dark;
		},
		toggle() {
			dark = !dark;
			if (browser) {
				localStorage.setItem('theme', dark ? 'dark' : 'light');
				document.documentElement.classList.toggle('dark', dark);
			}
		},
		init() {
			if (browser) {
				document.documentElement.classList.toggle('dark', dark);
			}
		}
	};
}

export const theme = createTheme();
