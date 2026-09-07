import Button from "./Button";

// Modal de confirmación genérico — se usa tanto para "enviar Prode"
// (Play.jsx) como para "eliminar participante" (Admin.jsx). El
// contenido lo define quien lo llama, no queda texto de un solo caso
// de uso hardcodeado acá.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
      <div className="w-full max-w-md stage-bezel rounded-2xl p-2 shadow-stage">
        <div className="stage-main rounded-xl border border-white/[0.04] px-6 py-7 text-center">
          <p className="font-serif italic font-semibold text-2xl text-bone">{title}</p>
          <p className="font-sans text-sm text-slate mt-3">{message}</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? "danger" : "solid"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
