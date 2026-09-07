import { useCallback, useEffect, useState } from "react";
import { getTeamByName, TEAMS } from "../config/teams";
import { buildFullOrderFromTop8 } from "../lib/positioningScore";

const KEY = "prode-champions-test-participants";
const VALID_IDS = new Set(TEAMS.map((t) => t.id));

function preferredOrder(...names) {
  const top8 = names.map((n) => getTeamByName(n)?.id).filter(Boolean);
  return buildFullOrderFromTop8(top8);
}

// Semilla inicial — 10 participantes de prueba, editables desde /admin.
// `positioning` es la ÚNICA fuente de su predicción (36 equipos
// completos): de ahí se calcula el puntaje de Posicionamiento Y se
// derivan los 8 escudos que se muestran en el ranking. No existe un
// campo `top8` separado — evita tener el mismo dato en dos lugares.
const SEED = [
  { slug: "ezequiel", name: "Ezequiel", crystalBall: 116, positioning: preferredOrder("Real Madrid", "Manchester City", "Barcelona", "Bayern München", "Paris Saint-Germain", "Arsenal", "Inter", "Liverpool") },
  { slug: "nacho", name: "Nacho", crystalBall: 111, positioning: preferredOrder("Manchester City", "Real Madrid", "Bayern München", "Arsenal", "Barcelona", "Paris Saint-Germain", "Liverpool", "Inter") },
  { slug: "mati", name: "Mati", crystalBall: 76, positioning: preferredOrder("Bayern München", "Manchester City", "Real Madrid", "Barcelona", "Inter", "Paris Saint-Germain", "Arsenal", "Liverpool") },
  { slug: "lucas", name: "Lucas", crystalBall: 75, positioning: preferredOrder("Real Madrid", "Barcelona", "Manchester City", "Liverpool", "Bayern München", "Inter", "Paris Saint-Germain", "Arsenal") },
  { slug: "fede", name: "Fede", crystalBall: 45, positioning: preferredOrder("Manchester City", "Bayern München", "Barcelona", "Real Madrid", "Arsenal", "Liverpool", "Paris Saint-Germain", "Inter") },
  { slug: "juan", name: "Juan", crystalBall: 38, positioning: preferredOrder("Barcelona", "Real Madrid", "Manchester City", "Bayern München", "Inter", "Arsenal", "Paris Saint-Germain", "Liverpool") },
  { slug: "seba", name: "Seba", crystalBall: 36, positioning: preferredOrder("Arsenal", "Liverpool", "Real Madrid", "Manchester City", "Napoli", "Barcelona", "Inter", "Villarreal") },
  { slug: "gonza", name: "Gonza", crystalBall: 34, positioning: preferredOrder("Inter", "Napoli", "Real Madrid", "Manchester City", "Barcelona", "Arsenal", "Liverpool", "Roma") },
  { slug: "tomas", name: "Tomás", crystalBall: 31, positioning: preferredOrder("Barcelona", "Manchester City", "Arsenal", "Real Madrid", "Bayern München", "Villarreal", "Inter", "Napoli") },
  { slug: "agus", name: "Agus", crystalBall: 28, positioning: preferredOrder("Liverpool", "Real Madrid", "Barcelona", "Manchester City", "Inter", "Arsenal", "Napoli", "Bayern München") },
];

// `positioning` válido = exactamente 36 ids, todos existentes en TEAMS,
// sin repetidos. Cualquier otra cosa (undefined, longitud distinta,
// ids que ya no existen, duplicados) se considera inválido.
function isValidPositioning(arr) {
  if (!Array.isArray(arr) || arr.length !== TEAMS.length) return false;
  const unique = new Set(arr);
  if (unique.size !== TEAMS.length) return false;
  return arr.every((id) => VALID_IDS.has(id));
}

// Migra un participante crudo (posiblemente del formato viejo, con
// `top8` en vez de `positioning`) a la forma actual. Devuelve `null`
// si es irrecuperable.
function migrateParticipant(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.slug !== "string" || typeof raw.name !== "string") return null;

  let positioning = raw.positioning;

  if (!isValidPositioning(positioning) && Array.isArray(raw.top8)) {
    // Formato viejo: top8 (hasta 8 ids) → se completa a 36.
    const validTop8 = [...new Set(raw.top8.filter((id) => VALID_IDS.has(id)))];
    if (validTop8.length > 0) positioning = buildFullOrderFromTop8(validTop8);
  }

  if (!isValidPositioning(positioning)) return null;

  const crystalBall = typeof raw.crystalBall === "number" && Number.isFinite(raw.crystalBall)
    ? raw.crystalBall
    : 0;

  // Respuestas reales de Bola de Cristal (si vino de un envío real de
  // /jugar) — opcional, los participantes de prueba no la tienen.
  const crystalBallAnswers =
    raw.crystalBallAnswers && typeof raw.crystalBallAnswers === "object"
      ? raw.crystalBallAnswers
      : null;

  return { slug: raw.slug, name: raw.name, crystalBall, crystalBallAnswers, positioning };
}

// Migra la lista completa. Si un participante puntual no se puede
// recuperar, se reemplaza por el equivalente de SEED (por slug); si
// la estructura general es inválida (no es un array, está vacía, o
// terminó sin ningún participante recuperable), se usa SEED entero.
function migrate(list) {
  if (!Array.isArray(list) || list.length === 0) return SEED;

  const migrated = list.map((raw) => {
    const ok = migrateParticipant(raw);
    if (ok) return ok;
    return SEED.find((s) => s.slug === raw?.slug) ?? null;
  }).filter(Boolean);

  return migrated.length > 0 ? migrated : SEED;
}

function read() {
  let parsed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    parsed = JSON.parse(raw);
  } catch {
    return SEED;
  }

  const migrated = migrate(parsed);

  // Auto-reparación: si la migración cambió algo (formato viejo,
  // datos corruptos), se persiste ya arreglado para no repetir el
  // trabajo en cada lectura.
  if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
    persist(migrated);
  }

  return migrated;
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function useTestParticipants() {
  const [participants, setParticipants] = useState(read);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setParticipants(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateParticipant = useCallback((slug, patch) => {
    setParticipants((prev) => {
      const next = prev.map((p) => (p.slug === slug ? { ...p, ...patch } : p));
      persist(next);
      return next;
    });
  }, []);

  // Un Prode real enviado desde /jugar entra acá — mismo estado que
  // lee Home y Admin, no una lista separada. Si el slug ya existe
  // (nombre repetido), se le agrega un sufijo para no pisar a nadie;
  // devuelve el slug final con el que quedó guardado.
  const addParticipant = useCallback(
    (record) => {
      let finalSlug = record.slug;
      let n = 2;
      while (participants.some((p) => p.slug === finalSlug)) {
        finalSlug = `${record.slug}-${n}`;
        n++;
      }
      const next = [...participants, { ...record, slug: finalSlug }];
      persist(next);
      setParticipants(next);
      return finalSlug;
    },
    [participants]
  );

  const resetAll = useCallback(() => {
    persist(SEED);
    setParticipants(SEED);
  }, []);

  const deleteParticipant = useCallback((slug) => {
    setParticipants((prev) => {
      const next = prev.filter((p) => p.slug !== slug);
      persist(next);
      return next;
    });
  }, []);

  return { participants, updateParticipant, addParticipant, deleteParticipant, resetAll };
}
