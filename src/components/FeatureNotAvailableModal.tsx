import { FC } from "react";

interface FeatureNotAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export const FeatureNotAvailableModal: FC<FeatureNotAvailableModalProps> = ({
  isOpen,
  onClose,
  title = "Funcionalidad no disponible",
  description = "Esta funcionalidad aún no está implementada. Próximamente podrás usarla desde aquí.",
  confirmLabel = "Entendido",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-not-available-title"
        className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl border border-border"
      >
        <h3 id="feature-not-available-title" className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
