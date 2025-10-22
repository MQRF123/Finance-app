import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    },
  },
  plugins: [],
} satisfies Config;
