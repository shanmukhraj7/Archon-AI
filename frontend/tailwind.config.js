/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      "colors": {
        "surface-variant": "#353434",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        "background": "#141313",
        "secondary-fixed-dim": "#c8c6c6",
        "on-primary-fixed-variant": "#454747",
        "surface-dim": "#141313",
        "on-primary-container": "#636565",
        "secondary-container": "#474747",
        "error": "#ffb4ab",
        "on-surface-variant": "#c4c7c8",
        "surface-container-highest": "#353434",
        "on-secondary-fixed": "#1b1c1c",
        "tertiary": "#ffffff",
        "surface-container-low": "#1c1b1b",
        "on-primary": "#141313",
        "surface-container-lowest": "#0e0e0e",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-primary-fixed": "#1a1c1c",
        "on-background": "#e5e2e1",
        "outline-variant": "#444748",
        "on-tertiary-fixed-variant": "#454747",
        "on-error": "#690005",
        "surface-bright": "#3a3939",
        "outline": "#8e9192",
        "inverse-on-surface": "#313030",
        "on-secondary": "#303030",
        "primary-fixed-dim": "#c6c6c7",
        "on-tertiary-container": "#636565",
        "surface-tint": "#c6c6c7",
        "primary-fixed": "#e2e2e2",
        "tertiary-container": "#e2e2e2",
        "inverse-primary": "#5d5f5f",
        "primary": "#ffffff",
        "on-secondary-fixed-variant": "#474747",
        "on-secondary-container": "#b6b5b4",
        "tertiary-fixed": "#e2e2e2",
        "surface-container-high": "#2a2a2a",
        "surface-container": "#201f1f",
        "surface": "#141313",
        "on-surface": "#e5e2e1",
        "secondary": "#c8c6c6",
        "on-tertiary": "#2f3131",
        "primary-container": "#e2e2e2",
        "inverse-surface": "#e5e2e1",
        "on-tertiary-fixed": "#1a1c1c",
        "secondary-fixed": "#e4e2e1"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "margin-desktop": "32px",
        "container-max": "1440px",
        "unit": "4px",
        "margin-mobile": "16px",
        "gutter": "16px"
      },
      "fontFamily": {
        "body-lg": ["Inter"],
        "display": ["Inter"],
        "headline-md": ["Inter"],
        "headline-lg-mobile": ["Inter"],
        "label-caps": ["JetBrains Mono"],
        "headline-lg": ["Inter"],
        "body-sm": ["Inter"]
      },
      "fontSize": {
        "body-lg": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "display": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["20px", { "lineHeight": "1.4", "fontWeight": "600" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "1.2", "fontWeight": "600" }],
        "label-caps": ["12px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "500" }],
        "headline-lg": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "body-sm": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }]
      }
    }
  }
};