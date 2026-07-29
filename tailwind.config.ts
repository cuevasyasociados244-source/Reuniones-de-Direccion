import type { Config } from "tailwindcss";

// Sistema de diseño de Integra One RCA (ver §7 del brief y :root del prototipo).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Estados semánticos
        info: "#2563eb",
        "info-dark": "#1d4ed8",
        success: "#16a34a",
        "success-bg": "#e7f6ec",
        warning: "#d97706",
        "warning-bg": "#fef3e0",
        danger: "#dc2626",
        "danger-bg": "#fde9e9",
        // Marca
        navy: "#0f172a",
        purple: "#8b5cf6",
        "purple-dark": "#6d28d9",
        "purple-bg": "#f1eaff",
        gold: "#c9a227",
        // Escala de grises del prototipo
        gray: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          400: "#94a3b8",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a",
        },
      },
      backgroundImage: {
        // Sidebar: degradado azul marino → morado (§7)
        "brand-sidebar":
          "linear-gradient(160deg, #0d0e2b 0%, #2c1c72 45%, #6d3ff0 100%)",
        // Encabezados/tarjetas destacadas: degradado tropical (§7)
        "brand-tropical":
          "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #22c55e 100%)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
