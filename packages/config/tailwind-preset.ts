import type { Config } from "tailwindcss";

/**
 * Design tokens ported 1:1 from the Clotya WordPress theme
 * (themereference/main-theme/clotya/clotya/assets/scss/_theme.scss,
 * _mixins.scss, _helper.scss, _form.scss, _woocommerce.scss).
 *
 * Source values are kept as named tokens here so every app
 * (web, admin, merchant) renders the same visual language without
 * duplicating the Bootstrap/SCSS source.
 */
const clotyaPreset: Partial<Config> = {
  darkMode: "class",
  theme: {
    screens: {
      xs: "420px",
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
      "2xl": "1400px",
    },
    extend: {
      colors: {
        background: {
          DEFAULT: "#ffffff",
          light: "#fafafa",
        },
        foreground: {
          DEFAULT: "#000000",
          muted: "#75767c",
        },
        primary: {
          DEFAULT: "#ee403d",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#47b486",
          dark: "#287c58",
          light: "#c9e3d8",
        },
        warning: {
          DEFAULT: "#f5af28",
          light: "#f4e3d1",
        },
        danger: {
          DEFAULT: "#f4344f",
        },
        info: {
          DEFAULT: "#aeb9be",
        },
        border: {
          DEFAULT: "#dee0ea",
          form: "#ddd",
          "form-active": "#8f8f8f",
        },
        placeholder: "#75767c",
      },
      fontFamily: {
        sans: ["Jost", "sans-serif"],
      },
      fontSize: {
        xs: ["0.625rem", { lineHeight: "1.4" }],
        sm: ["0.75rem", { lineHeight: "1.4" }],
        base: ["0.9375rem", { lineHeight: "1.6", letterSpacing: "-0.03px" }],
        lg: ["1.0625rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.4" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["1.875rem", { lineHeight: "1.25" }],
        "4xl": ["2.375rem", { lineHeight: "1.2" }],
        "5xl": ["3.75rem", { lineHeight: "1.1" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      maxWidth: {
        site: "1290px",
      },
      height: {
        form: "42px",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "4px",
        lg: "8px",
        pill: "3.75rem",
      },
      boxShadow: {
        card: "5px 5px 0 #f8f8f8",
        soft: "0 2px 3px rgba(0,0,0,0.07)",
        modal: "0 0 8px rgba(0,0,0,0.6)",
      },
      transitionTimingFunction: {
        theme: "cubic-bezier(0.28,0.12,0.22,1)",
        "theme-2": "cubic-bezier(0.17,0.62,0.44,0.99)",
      },
      spacing: {
        "gutter-sm": "0.625rem",
        gutter: "0.9375rem",
        "gutter-md": "1.25rem",
        "gutter-lg": "1.875rem",
      },
      keyframes: {
        "toast-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "toast-out": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        "toast-out": "toast-out 0.2s ease-in forwards",
      },
    },
  },
};

export default clotyaPreset;
