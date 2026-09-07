import { useMemo, useState } from "react";
import Layout from "../components/Layout";
import PlayHeader from "../components/PlayHeader";
import Button from "../components/Button";
import PositioningBoard from "../components/PositioningBoard";
import CrystalBallMenu from "../components/CrystalBallMenu";
import CrystalBallModal from "../components/CrystalBallModal";
import ConfirmModal from "../components/ConfirmModal";
import { usePersistentDraft } from "../hooks/usePersistentDraft";
import { useTestParticipants } from "../hooks/useTestParticipants";
import { TEAMS } from "../config/teams";
import { CRYSTAL_BALL } from "../config/crystalBall";
import { slugify } from "../lib/slugify";

const DEFAULT_ORDER = TEAMS.map((t) => t.id);

function isAnswered(v) {
  return v !== undefined && v !== null && v !== "";
}

export default function Play() {
  const { draft, update } = usePersistentDraft();
  const { addParticipant } = useTestParticipants();
  const [cbCategory, setCbCategory] = useState(null); // null = menú de categorías (modal cerrado)
  const [confirmOpen, setConfirmOpen] = useState(false);

  const orderedTeams = useMemo(() => {
    const ids = draft.positioning ?? DEFAULT_ORDER;
    return ids.map((id) => TEAMS.find((t) => t.id === id)).filter(Boolean);
  }, [draft.positioning]);

  // ── Validación completa, para habilitar el envío ──────────────────
  const nameOk = draft.name.trim().length > 0;
  const positioningOk = Array.isArray(draft.positioning) && draft.positioning.length === TEAMS.length;

  const crystalBallAnswered = CRYSTAL_BALL.reduce((sum, cat) => {
    const catAnswers = draft.crystalBall[cat.key] ?? {};
    return sum + cat.questions.filter((q) => isAnswered(catAnswers[q.key])).length;
  }, 0);
  const crystalBallTotal = CRYSTAL_BALL.reduce((sum, cat) => sum + cat.questions.length, 0);
  const crystalBallOk = crystalBallAnswered === crystalBallTotal;

  const canSubmit = nameOk && positioningOk && crystalBallOk;

  function handlePositioningChange(newOrderTeams) {
    update({ positioning: newOrderTeams.map((t) => t.id) });
  }

  function handleAnswer(categoryKey, questionKey, value) {
    update({
      crystalBall: {
        ...draft.crystalBall,
        [categoryKey]: { ...(draft.crystalBall[categoryKey] ?? {}), [questionKey]: value },
      },
    });
  }

  function confirmSubmit() {
    if (!canSubmit) return;

    const finalSlug = addParticipant({
      slug: slugify(draft.name),
      name: draft.name,
      crystalBall: 0, // sin resolver todavía — lo carga el admin más adelante
      crystalBallAnswers: draft.crystalBall,
      positioning: draft.positioning,
    });

    update({ submitted: true, finalSlug });
    setConfirmOpen(false);
  }

  const profileSlug = draft.finalSlug ?? slugify(draft.name || "");

  // ── Ya enviado: confirmación con navegación real ─────────────────
  if (draft.submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center text-center py-16 px-4">
          <p className="font-serif italic font-semibold text-3xl text-bone">Prode enviado</p>
          <p className="font-sans text-sm text-slate mt-3 max-w-sm">
            {draft.name ? `${draft.name}, tu` : "Tu"} predicción quedó registrada y ya no se puede
            editar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button variant="ghost" to={`/jugador/${profileSlug}`}>
              Ver mi perfil
            </Button>
            <Button variant="solid" to="/">
              Volver al ranking
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 0: identificación ───────────────────────────────────────
  if (draft.step === 0) {
    return (
      <Layout>
        <PlayHeader step={0} />
        <div className="max-w-md mx-auto pb-12">
          <p className="font-sans text-sm text-slate text-center mb-6">
            Elegí cómo creés que terminará la fase de liga. Una sola predicción.
          </p>

          <label className="font-sans text-xs tracking-widest uppercase text-slate">
            Nombre
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Tu nombre"
            className="w-full mt-2 bg-black/20 border border-panelLight rounded px-3 py-3 font-sans text-bone placeholder:text-slate/60 focus:outline-none focus:border-electric"
          />

          <div className="flex justify-end mt-6">
            <Button variant="solid" disabled={!nameOk} onClick={() => update({ step: 1 })}>
              Continuar
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 1: posicionamiento ───────────────────────────────────────
  if (draft.step === 1) {
    return (
      <Layout>
        <PlayHeader step={1} />
        <div className="pb-10">
          <p className="font-sans text-sm text-slate text-center mb-6 max-w-md mx-auto">
            Ordená los 36 equipos del 1.º al 36.º, según cómo creés que va a terminar cada uno la
            fase de liga.
          </p>

          <PositioningBoard order={orderedTeams} onChange={handlePositioningChange} />

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => update({ step: 0 })}>
              Atrás
            </Button>
            <Button variant="solid" onClick={() => update({ step: 2 })}>
              Continuar
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 2: bola de cristal — menú de categorías + modal ─────────
  const category = CRYSTAL_BALL.find((c) => c.key === cbCategory);

  return (
    <Layout>
      <PlayHeader step={2} />
      <div className="max-w-2xl mx-auto pb-12">
        {!draft.reviewing && (
          <>
            <p className="font-sans text-sm text-slate text-center mb-6">
              Elegí una categoría para responder sus preguntas.
            </p>

            <CrystalBallMenu
              categories={CRYSTAL_BALL}
              answers={draft.crystalBall}
              onSelect={setCbCategory}
            />

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => update({ step: 1 })}>
                Atrás
              </Button>
              <Button variant="solid" onClick={() => update({ reviewing: true })}>
                Continuar
              </Button>
            </div>
          </>
        )}

        {draft.reviewing && (
          <div className="rounded-lg bg-black/[0.12] border border-panelLight/40 px-6 py-8 text-center mt-6">
            <p className="font-serif italic font-semibold text-2xl text-bone">
              Listo, {draft.name}
            </p>
            <p className="font-sans text-sm text-slate mt-3">
              Revisá que esté todo como querés. Una vez que envíes el Prode, queda bloqueado.
            </p>

            <div className="flex flex-col gap-2 mt-6 text-left max-w-xs mx-auto">
              <div className="flex items-center justify-between font-sans text-sm">
                <span className={nameOk ? "text-bone" : "text-slate"}>Nombre</span>
                <span className={nameOk ? "text-electric" : "text-slate"}>{nameOk ? "Listo" : "Falta"}</span>
              </div>
              <div className="flex items-center justify-between font-sans text-sm">
                <span className={positioningOk ? "text-bone" : "text-slate"}>Posicionamiento</span>
                <span className={positioningOk ? "text-electric" : "text-slate"}>
                  {(draft.positioning ?? []).length}/{TEAMS.length}
                </span>
              </div>
              <div className="flex items-center justify-between font-sans text-sm">
                <span className={crystalBallOk ? "text-bone" : "text-slate"}>Bola de Cristal</span>
                <span className={crystalBallOk ? "text-electric" : "text-slate"}>
                  {crystalBallAnswered}/{crystalBallTotal}
                </span>
              </div>
            </div>

            {!canSubmit && (
              <p className="font-sans text-xs text-slate/70 mt-4">
                Completá lo que falta antes de poder enviar el Prode.
              </p>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <Button variant="ghost" onClick={() => update({ reviewing: false })}>
                Seguir revisando
              </Button>
              <Button variant="solid" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
                Enviar Prode
              </Button>
            </div>
          </div>
        )}
      </div>

      <CrystalBallModal
        category={category}
        answers={draft.crystalBall[cbCategory] ?? {}}
        onAnswer={(qKey, val) => handleAnswer(cbCategory, qKey, val)}
        onClose={() => setCbCategory(null)}
      />

      <ConfirmModal
        open={confirmOpen}
        title="¿Enviar tu Prode?"
        message="Una vez enviado no vas a poder editarlo. Vas a poder ver tu perfil y tus predicciones en cualquier momento."
        confirmLabel="Enviar Prode"
        cancelLabel="Seguir editando"
        onConfirm={confirmSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}
