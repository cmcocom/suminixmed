import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./hooks/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}',
		'./types/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			// NO sobrescribir spacing completamente, solo extender
			// Tailwind v3 ya tiene spacing correcto por defecto
		},
	},
	plugins: [],
	// Configuración específica para Next.js 15 + Turbopack
	future: {
		hoverOnlyWhenSupported: true,
	},
}

export default config
