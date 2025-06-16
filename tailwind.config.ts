import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
			fontWeight: {
				light: '300',
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700',
				extrabold: '800',
				black: '900',
			},
			backgroundImage: {
				'hero-pattern': "url('/img/hero-pattern.svg')",
        'footer-texture': "url('/img/footer-texture.png')",
				'neon-radial': 'radial-gradient(circle, #01FBA1 10%, #06CF82 14%, #164622 59%, #000000 100%)',
				'neon-radial-2': 'radial-gradient(circle, #01FBA1 0%, #000000 100%)',
				'neon-radial-alt': 'radial-gradient(circle, #FFFFFF 0%, #FFFFFFDD 14%, #5F5F5F 59%, #000000 100%)',
				'neon-radial-about': 'radial-gradient(circle, #01FBA1 0%, #01FBA1 100%)',
				'neon-radial-Competitive-advantages': 'radial-gradient(circle, #181818 0%, #181818 100%)',
				'linear-green': 'linear-gradient(90deg, #A3A3A3 0%, #01FBA1 100%)',
				'linear-green-mission': 'linear-gradient(90deg, #FFFFFF 0%, #01FBA1 100%)',
				'linear-green-mission-2': 'linear-gradient(90deg, #01FBA1 0%, #ffffff 100%)',
      },
			fontFamily: {
        clash: ["var(--font-clash-display)", "sans-serif"],
				inter: ["var(--font-inter)", "sans-serif"],
      },
			fontSize: {
        'h1': ['52px', '52px'],   // Título h1
        'h2': ['32px', '32px'],   // Título h2
        'h3': ['28px', '20px'],   // Título h3
      },
  		colors: {
        primary: "#01FBA1",     // Tom principal de verde-água (inovação)
        secondary: "#22CF90",   // Verde mais vivo para destacar CTAs ou hover
        support1: "#3D7A64",    // Estabilidade
        support2: "#355046",    // Resiliência
				background : {
					default: "#181818",
					black: "#010201",
					green: "#22CF90",
					gray: "#434343",
					white: "#EAEAEA",
					card: "#242424",
					cardFeature: "#181818",
					cardAdvantages: "#2D2D2D",
					missionAndValues: "#1e1e1e",
					QA: "#2D2D2D",
					QA2: "#222222"
				},
				foreground: {
					default: "#EAEAEA",
					gray: "#434343",
					card: "#A3A3A3",
					white: "#CDD0CF",
					pureWhite: "#ffffff",
					green: "#01FBA1",
					black: "#181818",
					about: "#3C7A63",
					aboutBlack: "#2D2D2D",
					footer: "#737373"
				},
				systemColor: {
					default: "#01FBA1",
					blue: "#2A30E0",
					red: "#E70000"
				},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				selected: 'hsl(var(--primary))',
  				border: 'hsl(var(--primary-foreground))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			button: {
  				DEFAULT: "#01FBA1",
					foreground: "#2D2D2D",
					dark: "#3C7A63"
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
				border: {
					default: 'hsl(var(--border))',
					white: '#ffffff',
					about: '#3C7A63',
					black: '#000000',
					green: '#01FBA1',
				},
  			// 	DEFAULT: 'hsl(var(--primary))',
  			// 	foreground: 'hsl(var(--primary-foreground))'
  			// },
  			// secondary: {
  			// 	DEFAULT: 'hsl(var(--secondary))',
  			// 	foreground: 'hsl(var(--secondary-foreground))'
  			// },
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			// border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		animation: {
  			// pulse: 'pulse var(--duration) ease-out infinite',
				// ping: 'ping var(--duration) cubic-bezier(0, 0, 0.2, 1) infinite',
  		},
  		keyframes: {
  			// pulse: {
  			// 	'0%, 100%': {
  			// 		boxShadow: '0 0 0 0 var(--pulse-color)'
  			// 	},
  			// 	'50%': {
  			// 		boxShadow: '0 0 0 8px var(--pulse-color)'
  			// 	}
  			// },
				// ping: {
				// 	'75%, 100%': {
				// 		transform: 'scale(2)',
				// 		opacity: '0'
				// 	}
				// }
  		},
			dropShadow: {
				'3xl': '0 35px 35px rgba(0, 0, 0, 0.25)',
				'4xl': [
					'0 35px 35px rgba(0, 0, 0, 0.25)',
					'0 45px 65px rgba(0, 0, 0, 0.15)'
				]
			}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
