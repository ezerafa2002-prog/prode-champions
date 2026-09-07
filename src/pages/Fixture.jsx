import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import TeamBadge from "../components/TeamBadge";
import MatchdayResult from "../components/MatchdayResult";
import { useFixture } from "../hooks/useFixture";
import { useTestParticipants } from "../hooks/useTestParticipants";
import { TEAMS } from "../config/teams";

const SELECTED_KEY = "prode-champions-fixture-selected";

function teamLabel(id) {
  return TEAMS.find((t) => t.id === id)?.name ?? id;
}

// Puerta de PIN: se muestra cuando el slug elegido en el selector
// todavía no tiene sesión activa en este dispositivo. Mismo lenguaje
// visual que el resto del Fixture (mismos inputs/paneles), no un
// componente nuevo de diseño.
function PinGate({ slug, hasAccount, register, login, authError }) {
  const [exists, setExists] = useState(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setExists(null);
    setPin("");
    hasAccount(slug).then(setExists);
  }, [slug, hasAccount]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return;
    setBusy(true);
    const participantName = slug; // el nombre real ya lo eligió arriba en el <select>
    if (exists) await login(slug, pin);
    else await register(slug, participantName, pin);
    setBusy(false);
  }

  if (exists === null) {
    return <p className="font-sans text-sm text-slate pb-12">Revisando tu cuenta de Fixture…</p>;
  }

  return (
    <div className="max-w-xs pb-12">
      <p className="font-sans text-sm text-bone mb-1">
        {exists ? "Ingresá tu PIN" : "Creá un PIN de 4 dígitos"}
      </p>
      <p className="font-sans text-xs text-slate mb-4">
        {exists
          ? "Protege tus pronósticos de esta fecha."
          : "Lo vas a usar cada vez que vuelvas a cargar pronósticos."}
      </p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-20 bg-black/20 border border-panelLight rounded px-3 py-2.5 text-center font-sans text-sm text-bone focus:outline-none focus:border-electric"
        />
        <Button type="submit" variant="solid" disabled={busy || pin.length !== 4}>
          {exists ? "Ingresar" : "Crear PIN"}
        </Button>
      </form>
      {authError && <p className="font-sans text-xs text-rust mt-2">{authError}</p>}
    </div>
  );
}

export default function Fixture() {
  const fixture = useFixture();
  const { participants } = useTestParticipants();

  const [slug, setSlug] = useState(() => localStorage.getItem(SELECTED_KEY) ?? "");
  const [openClosedId, setOpenClosedId] = useState(null);

  useEffect(() => {
    if (slug) localStorage.setItem(SELECTED_KEY, slug);
  }, [slug]);

  const {
    configured,
    currentMatchday,
    matchdays,
    predictions,
    locked,
    session,
    myPrediction,
    hasAccount,
    register,
    login,
    logout,
    authError,
    setPick,
    submitPrediction,
  } = fixture;

  const closedMatchdays = matchdays.filter((md) => md.status === "closed");
  const authenticated = session?.slug === slug;

  function handlePickChange(matchId, field, value) {
    const existing = myPrediction?.picks?.[matchId] ?? { home: 0, away: 0 };
    const home = field === "home" ? value : existing.home;
    const away = field === "away" ? value : existing.away;
    setPick(matchId, home, away);
  }

  const allAnswered =
    currentMatchday && myPrediction
      ? currentMatchday.matches.every((m) => myPrediction.picks?.[m.id])
      : false;

  return (
    <Layout>
      <div className="pt-8 pb-6">
        <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-1">
          Fixture
        </p>
        <h1 className="font-serif italic font-semibold text-2xl sm:text-3xl text-bone">
          Pronósticos por fecha
        </h1>
      </div>

      {!configured && (
        <p className="font-sans text-sm text-slate pb-12">
          El Fixture todavía no está disponible en este entorno — falta configuración del lado del
          servidor. El resto de la app funciona con normalidad.
        </p>
      )}

      {configured && (
      <>
      <div className="max-w-md mb-8">
        <label className="font-sans text-xs tracking-widest uppercase text-slate">
          ¿Quién sos?
        </label>
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            if (session && session.slug !== e.target.value) logout();
          }}
          className="w-full mt-1.5 bg-black/20 border border-panelLight rounded px-3 py-2.5 font-sans text-sm text-bone focus:outline-none focus:border-electric"
        >
          <option value="" disabled>
            Elegí tu nombre…
          </option>
          {participants.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!slug && (
        <p className="font-sans text-sm text-slate pb-12">
          Elegí tu participante para ver la fecha actual.
        </p>
      )}

      {slug && !authenticated && (
        <PinGate slug={slug} hasAccount={hasAccount} register={register} login={login} authError={authError} />
      )}

      {slug && authenticated && !currentMatchday && (
        <p className="font-sans text-sm text-slate pb-12">
          No hay ninguna fecha abierta para pronosticar en este momento.
        </p>
      )}

      {slug && authenticated && currentMatchday && (
        <section className="pb-12">
          <div className="flex items-center justify-between mb-1">
            <p className="font-sans font-bold text-sm text-bone">{currentMatchday.label}</p>
            <button type="button" onClick={logout} className="font-sans text-xs text-slate hover:text-electric">
              Salir
            </button>
          </div>
          <p className="font-sans text-xs text-slate mb-4">
            {myPrediction?.submitted
              ? "Ya enviaste tu pronóstico para esta fecha."
              : locked
                ? "Las predicciones de esta fecha ya cerraron — empezó el primer partido."
                : "Cargá el marcador de cada partido. Tenés un partido destacado (puntos duplicados)."}
          </p>

          <div className="recede-panel rounded-lg border border-panelLight p-4 sm:p-5 flex flex-col gap-4">
            {currentMatchday.matches.map((m) => {
              const pick = myPrediction?.picks?.[m.id];
              const isFeatured = myPrediction?.featuredMatchId === m.id;
              const inputsDisabled = myPrediction?.submitted || locked;

              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamBadge teamId={m.home} name={teamLabel(m.home)} size="sm" />
                    <span className="font-sans text-sm text-bone truncate">{teamLabel(m.home)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      disabled={inputsDisabled}
                      value={pick?.home ?? ""}
                      onChange={(e) => handlePickChange(m.id, "home", Number(e.target.value))}
                      className="w-12 bg-black/20 border border-panelLight rounded px-1 py-1.5 text-center font-sans text-sm text-bone disabled:opacity-50"
                    />
                    <span className="text-slate">-</span>
                    <input
                      type="number"
                      min="0"
                      disabled={inputsDisabled}
                      value={pick?.away ?? ""}
                      onChange={(e) => handlePickChange(m.id, "away", Number(e.target.value))}
                      className="w-12 bg-black/20 border border-panelLight rounded px-1 py-1.5 text-center font-sans text-sm text-bone disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="font-sans text-sm text-bone truncate">{teamLabel(m.away)}</span>
                    <TeamBadge teamId={m.away} name={teamLabel(m.away)} size="sm" />
                  </div>

                  {isFeatured && (
                    <span className="font-sans text-[10px] tracking-widest uppercase text-gold shrink-0">
                      ★ destacado
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {!myPrediction?.submitted && !locked && (
            <div className="flex justify-end mt-4">
              <Button variant="solid" disabled={!allAnswered} onClick={submitPrediction}>
                Enviar pronósticos de la fecha
              </Button>
            </div>
          )}
        </section>
      )}

      {closedMatchdays.length > 0 && (
        <section className="pb-12">
          <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-3">
            Fechas cerradas
          </p>

          <div className="flex flex-col gap-3">
            {closedMatchdays.map((md) => (
              <div key={md.id}>
                <button
                  type="button"
                  onClick={() => setOpenClosedId((id) => (id === md.id ? null : md.id))}
                  className="font-sans text-sm text-bone hover:text-electric transition-colors"
                >
                  {openClosedId === md.id ? "▾" : "▸"} {md.label}
                </button>

                {openClosedId === md.id && slug && (
                  <div className="mt-3">
                    <MatchdayResult
                      matchday={md}
                      prediction={predictions[slug]?.[md.id]}
                      predictions={predictions}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </Layout>
  );
}
