import { useCallback, useEffect, useState } from "react";

const KEY = "prode-champions-official-table";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// `officialOrder` es un array de 36 team ids (índice 0 = 1.º puesto) o
// `null` si el admin todavía no cargó ninguna tabla. Vive en
// localStorage por ahora — el día que se conecte Supabase, este hook
// es el único lugar a reemplazar por la fuente real (ver DESIGN.md /
// notas de arquitectura sobre `official_results`).
export function useOfficialTable() {
  const [officialOrder, setOfficialOrder] = useState(read);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setOfficialOrder(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveOrder = useCallback((order) => {
    localStorage.setItem(KEY, JSON.stringify(order));
    setOfficialOrder(order);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setOfficialOrder(null);
  }, []);

  return { officialOrder, saveOrder, reset };
}
