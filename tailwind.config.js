/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1440",        // azul Champions saturado, fondo raíz — el plano más lejano
        bezel: "#101C52",      // marco exterior de la superficie — un tono por delante de ink
        panel: "#132563",      // panel principal — un tono por delante del marco
        panelLight: "#1D3179", // superficie del ranking / hover — el plano más cercano
        electric: "#3D6BFF", // acento primario, azul real (no indigo)
        violet: "#5B6FE8",     // acento secundario, apenas visible — no protagonismo
        gold: "#E8C468",       // exclusivo 1er puesto
        silver: "#C7CCD8",     // exclusivo 2do puesto
        bronze: "#B5793C",     // exclusivo 3er puesto
        bone: "#F2F4FA",       // texto principal
        slate: "#8891AA",      // texto secundario
        rust: "#B23B3B",       // estado "eliminado / 0 puntos"
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],                     // wordmark — la marca, aparece una sola vez
        head: ["'Big Shoulders Display'", "sans-serif"],  // exclusivo de números (posición, puntos)
        sans: ["Inter", "sans-serif"],                     // nav, nombres, texto de apoyo
      },
      boxShadow: {
        gold: "0 0 40px -12px rgba(232, 196, 104, 0.35)",
        silver: "0 0 32px -12px rgba(199, 204, 216, 0.25)",
        bronze: "0 0 32px -12px rgba(181, 121, 60, 0.25)",
        card: "0 8px 30px -12px rgba(8, 12, 32, 0.6)",
        stage: "0 40px 90px -30px rgba(2, 4, 14, 0.85)",
      },
    },
  },
  plugins: [],
}
