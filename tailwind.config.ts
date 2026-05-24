import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn/ui 標準（globals.css の HSL 変数を参照）
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // 今回のリデザイン用パレット
        paper: {
          DEFAULT: "#F7F4EE",
          50: "#FBF9F4",
          100: "#F7F4EE",
          200: "#EFEAE0",
          300: "#E5E0D8",
        },
        ink: {
          DEFAULT: "#2A2826",
          500: "#8A8580",
          600: "#5A554F",
          900: "#2A2826",
        },
        coral: {
          DEFAULT: "#C8856B",
          50: "#FBF3EE",
          100: "#F2DDD0",
          300: "#DCA88E",
          500: "#C8856B",
          700: "#A66A52",
          900: "#7A4B39",
        },
        sage: {
          DEFAULT: "#6B7A5A",
          50: "#F1F2EC",
          100: "#DDE1D2",
          300: "#A8B196",
          500: "#6B7A5A",
          700: "#525E45",
        },
        line: "#E5E0D8",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["var(--font-noto-serif-jp)", "serif"],
        sans: ["var(--font-noto-sans-jp)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
      },
      letterSpacing: {
        widest2: "0.3em",
      },
      lineHeight: {
        loose2: "2.0",
      },
    },
  },
  plugins: [],
};

export default config;
