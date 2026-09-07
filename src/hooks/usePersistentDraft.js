import { useEffect, useRef, useState } from "react";

const KEY = "prode-champions-draft";

const EMPTY_DRAFT = {
  name: "",
  positioning: null, // array de team ids en orden, se completa en el paso 2
  crystalBall: {},   // { questionKey: value }
  step: 0,           // 0 identificación · 1 posicionamiento · 2 bola de cristal
  reviewing: false,  // dentro del paso 2: false = menú de categorías, true = revisión final
  submitted: false,
  finalSlug: null,   // slug con el que quedó guardado el participante (puede diferir del nombre si había un slug repetido)
};

export function usePersistentDraft() {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const loaded = useRef(false);

  // Cargar el borrador existente, una sola vez, al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft(JSON.parse(raw));
    } catch {
      // localStorage no disponible o corrupto — se sigue con el borrador vacío.
    } finally {
      loaded.current = true;
    }
  }, []);

  // Autoguardar en cada cambio, después de la carga inicial (para no
  // pisar un borrador real con el estado vacío del primer render).
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      // Sin espacio o sin acceso a localStorage — se sigue en memoria.
    }
  }, [draft]);

  function update(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    localStorage.removeItem(KEY);
    setDraft(EMPTY_DRAFT);
  }

  return { draft, update, reset };
}
