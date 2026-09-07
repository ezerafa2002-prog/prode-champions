import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import PositioningBoard from "../components/PositioningBoard";
import ParticipantEditor from "../components/ParticipantEditor";
import ConfirmModal from "../components/ConfirmModal";
import AdminFixtureSection from "../components/AdminFixtureSection";
import { useOfficialTable } from "../hooks/useOfficialTable";
import { useTestParticipants } from "../hooks/useTestParticipants";
import { useFixture } from "../hooks/useFixture";
import { TEAMS } from "../config/teams";

const DEFAULT_ORDER = TEAMS.map((t) => t.id);

export default function Admin() {
  const { officialOrder, saveOrder, reset } = useOfficialTable();
  const { participants, updateParticipant, deleteParticipant, resetAll } = useTestParticipants();
  const fixture = useFixture();

  const [draftIds, setDraftIds] = useState(officialOrder ?? DEFAULT_ORDER);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // slug pendiente de confirmar

  // Si la tabla oficial cambia desde afuera (otra pestaña), el borrador
  // en edición se actualiza para no pisarla sin querer.
  useEffect(() => {
    setDraftIds(officialOrder ?? DEFAULT_ORDER);
  }, [officialOrder]);

  const draftTeams = draftIds.map((id) => TEAMS.find((t) => t.id === id)).filter(Boolean);
  const targetParticipant = participants.find((p) => p.slug === deleteTarget);

  function handleChange(newOrderTeams) {
    setDraftIds(newOrderTeams.map((t) => t.id));
  }

  function handleSave() {
    saveOrder(draftIds);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  function handleReset() {
    reset();
    setDraftIds(DEFAULT_ORDER);
  }

  function confirmDelete() {
    if (deleteTarget) deleteParticipant(deleteTarget);
    setDeleteTarget(null);
  }

  return (
    <Layout>
      <div className="pt-8 pb-10">
        <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-1">
          Admin
        </p>
        <h1 className="font-serif italic font-semibold text-2xl sm:text-3xl text-bone mb-2">
          Tabla oficial
        </h1>
        <p className="font-sans text-sm text-slate max-w-lg">
          Ordená los 36 equipos según cómo terminó (o va terminando) la fase de liga. Al guardar,
          el ranking de la Home recalcula el Posicionamiento de todos los participantes contra
          esta tabla.
        </p>

        <div className="mt-6">
          <PositioningBoard order={draftTeams} onChange={handleChange} />
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={handleReset}>
            Resetear
          </Button>

          <div className="flex items-center gap-4">
            {savedFlash && (
              <span className="font-sans text-sm text-electric">Tabla guardada</span>
            )}
            <Button variant="solid" onClick={handleSave}>
              Guardar tabla
            </Button>
          </div>
        </div>

        {!officialOrder && (
          <p className="font-sans text-xs text-slate/70 mt-4">
            Todavía no hay tabla oficial guardada — el ranking de la Home muestra 0 puntos de
            Posicionamiento hasta que guardes una.
          </p>
        )}
      </div>

      <div className="pb-12 border-t border-panelLight/40 pt-8">
        <h2 className="font-serif italic font-semibold text-2xl sm:text-3xl text-bone mb-2">
          Participantes
        </h2>
        <p className="font-sans text-sm text-slate max-w-lg mb-6">
          Incluye tanto los Prodes reales enviados desde /jugar como los participantes de prueba
          iniciales. Editá nombre y puntos de Bola de Cristal, o eliminá duplicados — la Home lee
          este mismo estado y recalcula el ranking al instante.
        </p>

        {participants.length === 0 ? (
          <p className="font-sans text-sm text-slate/70">Todavía no hay ningún participante.</p>
        ) : (
          <div className="recede-panel rounded-lg border border-panelLight shadow-card overflow-hidden">
            {participants.map((p) => (
              <ParticipantEditor
                key={p.slug}
                participant={p}
                onChange={(patch) => updateParticipant(p.slug, patch)}
                onRequestDelete={() => setDeleteTarget(p.slug)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="ghost" onClick={resetAll}>
            Restablecer participantes de prueba
          </Button>
        </div>
      </div>

      <AdminFixtureSection fixture={fixture} />

      <ConfirmModal
        open={!!deleteTarget}
        title="¿Eliminar participante?"
        message={
          targetParticipant
            ? `Esto va a borrar el Prode de ${targetParticipant.name} de forma permanente. No se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
