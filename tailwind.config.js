/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tt: {
          blue: "#4772fa",
          bluehover: "#3a63e0",
          bluefaint: "#eef2ff",
          rail: "#ebedf1",
          sidebar: "#f6f7f9",
          panel: "#fbfbfc",
          border: "#ebebeb",
          divider: "#f0f0f0",
          text: "#1f2329",
          sub: "#5c5f66",
          muted: "#8c9099",
          faint: "#b6bac2",
          hover: "#eceef2",
          active: "#e4ebff",
          red: "#e8494a",
          amber: "#f5a623",
          green: "#39b54a",
          soft: "#eef0f4",
          line: "#f1f2f5",
          surface: "#fcfcfd",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.03), 0 6px 16px -6px rgba(16,24,40,0.08)",
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px -1px rgba(16,24,40,0.04)",
        panel: "0 1px 30px -12px rgba(16,24,40,0.14)",
        lift: "0 4px 16px -4px rgba(16,24,40,0.10), 0 2px 6px -2px rgba(16,24,40,0.06)",
      },
      borderRadius: {
        "2.5xl": "18px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "13": ["13px", "20px"],
      },
    },
  },
  plugins: [],
};
