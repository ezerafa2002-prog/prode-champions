import CrystalBallStep from "./CrystalBallStep";
import Button from "./Button";

export default function CrystalBallModal({ category, answers, onAnswer, onClose }) {
  if (!category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl stage-bezel rounded-2xl p-2 shadow-stage max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stage-main rounded-xl border border-white/[0.04] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-8 pt-6 pb-2 shrink-0">
            <p className="font-serif italic font-semibold text-2xl text-bone">{category.label}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 flex items-center justify-center text-slate hover:text-bone transition-colors font-sans text-xl"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-5 sm:px-8 pb-6">
            <CrystalBallStep category={category} answers={answers} onAnswer={onAnswer} noSurface />
          </div>

          <div className="px-5 sm:px-8 pb-6 pt-2 border-t border-panelLight/40 flex justify-end shrink-0">
            <Button variant="ghost" onClick={onClose}>
              Volver a categorías
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
