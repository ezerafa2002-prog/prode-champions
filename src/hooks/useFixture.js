import { useCallback, useEffect, useState } from "react";
import {
  fetchDays,
  fetchClosedPredictions,
  checkFixtureAccountExists,
  registerFixtureAccount,
  loginFixtureAccount,
  getMyDay,
  setPick as remoteSetPick,
  submitPrediction as remoteSubmitPrediction,
} from "../lib/fixtureRemote";
import { isSupabaseConfigured } from "../lib/supabase";

const SESSION_KEY = "prode-champions-fixture-session";

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.slug && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

// Reemplaza la versión de localStorage: mismo tipo de datos que
// devolvía antes (matchdays / predictions / currentMatchday) para no
// tener que tocar Home.jsx, MatchdayResult.jsx ni fixtureScoring.js —
// solo cambia de dónde salen. Lo nuevo (auth por PIN, pronóstico
// propio del día activo) se agrega sin romper esa forma.
export function useFixture() {
  const [matchdays, setMatchdays] = useState([]);
  const [predictions, setPredictions] = useState({}); // solo fechas cerradas, todos los participantes
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(readSession);
  const [myPrediction, setMyPrediction] = useState(null);
  const [authError, setAuthError] = useState(null);

  const currentMatchday = matchdays.find((md) => md.status === "current") ?? null;
  const locked = currentMatchday?.locksAt ? new Date(currentMatchday.locksAt).getTime() <= Date.now() : false;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const days = await fetchDays();
      setMatchdays(days);
      const closedIds = days.filter((d) => d.status === "closed").map((d) => d.id);
      setPredictions(await fetchClosedPredictions(closedIds));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // El estado en vivo (marcadores, cierre de fecha) cambia server-side
    // por el cron — se refresca solo, sin depender de que alguien esté
    // mirando la pantalla en ese momento.
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const loadMyPrediction = useCallback(async (token) => {
    const result = await getMyDay(token);
    setMyPrediction(result.myPrediction);
    return result;
  }, []);

  // Se llama apenas hay un día activo y una sesión activa — crea la
  // fila de predicción (con destacado sorteado) si es la primera vez.
  useEffect(() => {
    if (session && currentMatchday) {
      loadMyPrediction(session.token).catch(() => setMyPrediction(null));
    } else {
      setMyPrediction(null);
    }
  }, [session, currentMatchday, loadMyPrediction]);

  const hasAccount = useCallback((slug) => checkFixtureAccountExists(slug), []);

  const register = useCallback(async (slug, name, pin) => {
    setAuthError(null);
    try {
      const token = await registerFixtureAccount(slug, name, pin);
      const next = { slug, token };
      persistSession(next);
      setSession(next);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  }, []);

  const login = useCallback(async (slug, pin) => {
    setAuthError(null);
    try {
      const token = await loginFixtureAccount(slug, pin);
      const next = { slug, token };
      persistSession(next);
      setSession(next);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
    setSession(null);
    setMyPrediction(null);
  }, []);

  const setPick = useCallback(
    async (matchId, home, away) => {
      if (!session) return;
      await remoteSetPick(session.token, matchId, home, away);
      setMyPrediction((prev) => ({
        ...(prev ?? { featuredMatchId: null, submitted: false, picks: {} }),
        picks: { ...(prev?.picks ?? {}), [matchId]: { home, away } },
      }));
    },
    [session]
  );

  const submitPrediction = useCallback(async () => {
    if (!session) return;
    await remoteSubmitPrediction(session.token);
    setMyPrediction((prev) => (prev ? { ...prev, submitted: true } : prev));
  }, [session]);

  return {
    configured: isSupabaseConfigured,
    loading,
    matchdays,
    predictions,
    currentMatchday,
    locked,
    session,
    authError,
    myPrediction,
    hasAccount,
    register,
    login,
    logout,
    setPick,
    submitPrediction,
    refresh,
  };
}
