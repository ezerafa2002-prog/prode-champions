// Estructura de Bola de Cristal — 4 categorías, 180 puntos totales.
// `type` determina qué control se renderiza en CrystalBallStep:
//   "team"    → selector de equipo (de TEAMS)
//   "player"  → texto libre (jugadores de la competición, sin API)
//   "boolean" → Sí / No
//   "options" → un set fijo de opciones

export const CRYSTAL_BALL = [
  {
    key: "equipos",
    label: "Equipos",
    points: 40,
    questions: [
      { key: "primero", label: "1.º de la fase de liga", type: "team", points: 5 },
      { key: "ultimo", label: "Último de la fase de liga", type: "team", points: 5 },
      { key: "revelacion", label: "Revelación", type: "team", points: 10 },
      { key: "decepcion", label: "Decepción", type: "team", points: 10 },
      { key: "mejorDiferenciaGol", label: "Mejor diferencia de gol", type: "team", points: 10 },
    ],
  },
  {
    key: "jugadores",
    label: "Jugadores",
    points: 40,
    questions: [
      { key: "maxGoleador", label: "Máximo goleador", type: "player", points: 10 },
      { key: "maxAsistidor", label: "Máximo asistidor", type: "player", points: 10 },
      { key: "mejorJugadorSofascore", label: "Mejor jugador según SofaScore", type: "player", points: 5 },
      { key: "mejorArqueroSofascore", label: "Mejor arquero según SofaScore", type: "player", points: 5 },
      { key: "jugadorRevelacion", label: "Jugador revelación", type: "player", points: 10 },
    ],
  },
  {
    key: "estadisticas",
    label: "Estadísticas",
    points: 45,
    questions: [
      { key: "masGoles", label: "Equipo con más goles", type: "team", points: 9 },
      { key: "masGolesRecibidos", label: "Equipo con más goles recibidos", type: "team", points: 9 },
      { key: "menosGolesRecibidos", label: "Equipo con menos goles recibidos", type: "team", points: 9 },
      { key: "masExpulsados", label: "Equipo con más expulsados", type: "team", points: 9 },
      { key: "masPenalesFavor", label: "Equipo con más penales a favor", type: "team", points: 9 },
    ],
  },
  {
    key: "falopa",
    label: "Falopa",
    points: 55,
    questions: [
      {
        key: "golOlimpico",
        label: "¿Habrá un gol olímpico?",
        type: "boolean",
        points: 20, // puntaje máximo posible de la pregunta (ver reglas: NO=5, SÍ=20, según acierto)
      },
      {
        key: "diferenciaPuntos1y8",
        label: "¿Cuál será la diferencia de puntos entre el 1.º y el 8.º?",
        type: "options",
        points: 20,
        // Rangos de ejemplo — ajustar acá cuando estén definidos.
        options: ["0–5", "6–10", "11–15", "16–20", "21+"],
      },
      {
        key: "equiposInvictos",
        label: "¿Cuántos equipos terminarán invictos?",
        type: "options",
        points: 10,
        options: ["0", "1", "2", "3+"],
      },
      {
        key: "equipoConCeroVictorias",
        label: "¿Habrá algún equipo con 0 victorias?",
        type: "boolean",
        points: 10,
      },
      {
        key: "equipoNegativoEnTop8",
        label: "¿Habrá algún equipo con diferencia de gol negativa en el Top 8?",
        type: "boolean",
        points: 10,
      },
    ],
  },
];
