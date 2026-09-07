import { useState } from "react";
import Button from "./Button";
import TeamBadge from "./TeamBadge";
import { syncNow, overrideResult } from "../lib/fixtureRemote";

const STATUS_LABEL = { current: "Actual", closed: "Cerrada" };

// Los partidos ya no se cargan a mano: los trae la sincronización
// automática con API-Football (cron cada 15 min, ver supabase/CRON.sql).
// Lo que queda acá es: forzar una sincronización ya mismo, y un
// override manual por si la API tarda o un resultado sale mal — las
// dos únicas acciones que de verdad escriben sobre datos en vivo,
// protegidas con la contraseña de admin.
export default function AdminFixtureSection({ fixture }) {
  const { matchdays, refresh } = fixture;

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [drafts, setDrafts] = useState({}); // matchId -> { home, away }

  async function handleSyncNow() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await syncNow(password);
      setMessage(
        `Sincronizado — ${result.matchesImported} partido(s) importado(s), ${result.matchesRefreshed} actualizado(s).` +
          (result.unmatched?.length ? ` Sin matchear: ${result.unmatched.join(", ")}` : "")
      );
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOverride(matchId) {
    const draft = drafts[matchId];
    if (!draft || draft.home === "" || draft.away === "") return;
    setBusy(true);
    setMessage(null);
    try {
      await overrideResult(password, matchId, Number(draft.home), Number(draft.away));
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  function updateDraft(matchId, key, value) {
    setDrafts((prev) => ({ ...prev, [matchId]: { ...(prev[matchId] ?? { home: "", away: "" }), [key]: value } }));
  }

  return (
    <div className="pb-12 border-t border-panelLight/40 pt-8">
      <h2 className="font-serif italic font-semibold text-2xl sm:text-3xl text-bone mb-2">Fixture</h2>
      <p className="font-sans text-sm text-slate max-w-lg mb-6">
        Los partidos de cada día se importan solos desde API-Football. Acá podés forzar una
        sincronización ya mismo o corregir un resultado a mano si hace falta.
      </p>

      <div className="recede-panel rounded-lg border border-panelLight p-4 sm:p-5 mb-8">
        <label className="font-sans text-xs tracking-widest uppercase text-slate">
          Contraseña de admin
        </label>
        <div className="flex items-center gap-3 mt-1.5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-black/20 border border-panelLight rounded px-3 py-2 font-sans text-sm text-bone focus:outline-none focus:border-electric"
          />
          <Button variant="solid" disabled={busy || !password} onClick={handleSyncNow}>
            Sincronizar ahora
          </Button>
        </div>
        {message && <p className="font-sans text-xs text-slate mt-3">{message}</p>}
      </div>

      <div className="flex flex-col gap-4">
        {matchdays.length === 0 && (
          <p className="font-sans text-sm text-slate/70">
            Todavía no se importó ningún día — probá "Sincronizar ahora" o esperá al próximo cron.
          </p>
        )}

        {matchdays.map((md) => (
          <div key={md.id} className="recede-panel rounded-lg border border-panelLight p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <p className="font-sans font-bold text-sm text-bone">{md.label}</p>
                <span
                  className={`font-sans text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                    md.status === "current" ? "border-electric text-electric" : "border-panelLight text-slate/70"
                  }`}
                >
                  {STATUS_LABEL[md.status]}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {md.matches.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <TeamBadge teamId={m.home} name={m.home} size="xs" />
                  <span className="font-sans text-bone flex-1 truncate">{m.home}</span>

                  {md.status === "closed" ? (
                    <span className="font-head font-bold tabular-nums text-bone w-16 text-center">
                      {m.realHome ?? "-"} : {m.realAway ?? "-"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-head font-bold tabular-nums text-bone w-12 text-center">
                        {m.realHome ?? "-"} : {m.realAway ?? "-"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="H"
                        value={drafts[m.id]?.home ?? ""}
                        onChange={(e) => updateDraft(m.id, "home", e.target.value)}
                        className="w-12 bg-black/20 border border-panelLight rounded px-1 py-1 text-center font-sans text-sm text-bone"
                      />
                      <span className="text-slate">:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="A"
                        value={drafts[m.id]?.away ?? ""}
                        onChange={(e) => updateDraft(m.id, "away", e.target.value)}
                        className="w-12 bg-black/20 border border-panelLight rounded px-1 py-1 text-center font-sans text-sm text-bone"
                      />
                      <button
                        type="button"
                        disabled={busy || !password}
                        onClick={() => handleOverride(m.id)}
                        className="font-sans text-[11px] text-electric disabled:opacity-40 px-1"
                      >
                        Forzar
                      </button>
                    </div>
                  )}

                  <span className="font-sans text-bone flex-1 truncate text-right">{m.away}</span>
                  <TeamBadge teamId={m.away} name={m.away} size="xs" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
