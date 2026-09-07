// Reglas de puntuación — centralizadas para poder ajustar sin tocar lógica.

export const POSITIONING = {
  exactMatch: 5,
  zoneMatch: 3,
  zones: [
    { key: "top8", label: "Top 8", from: 1, to: 8 },
    { key: "playoff", label: "Playoff", from: 9, to: 24 },
    { key: "eliminado", label: "Eliminado", from: 25, to: 36 },
  ],
};

export const CRYSTAL_BALL_MAX = {
  equipos: 40,
  jugadores: 40,
  estadisticas: 45,
  falopa: 55,
};

export const TOTAL_MAX = {
  positioning: 180,
  crystalBall: 180,
  overall: 360,
};
