import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
