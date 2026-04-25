export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f172a",
        ocean: "#0f766e",
        sand: "#f8fafc",
        ember: "#f97316",
      },
      boxShadow: {
        panel: "0 20px 45px rgba(15, 23, 42, 0.14)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 30%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 28%), linear-gradient(135deg, rgba(248,250,252,1), rgba(241,245,249,1))",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(45,212,191,0.2), transparent 28%), radial-gradient(circle at top right, rgba(251,146,60,0.18), transparent 25%), linear-gradient(135deg, rgba(2,6,23,1), rgba(15,23,42,1))",
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
