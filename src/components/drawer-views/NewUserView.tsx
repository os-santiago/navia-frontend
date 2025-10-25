import { motion } from "framer-motion";

interface NewUserViewProps {
  onActionSelect: (actionId: string, actionLabel: string) => void;
  onShowFeatureUnavailable: () => void;
}

const actionButtons = [
  {
    id: "event-date",
    label: "Ver cuando es el evento [Nombre del Evento]",
  },
  {
    id: "buy-tickets",
    label: "Comprar entradas para el evento [Nombre del Evento]",
  },
  {
    id: "discover-event",
    label: "Descubrir evento de [Tipo de Evento] en el mes de [Mes]",
  },
];

export const NewUserView = ({ onActionSelect, onShowFeatureUnavailable }: NewUserViewProps) => {
  return (
    <div className="space-y-4">
      {actionButtons.map((button, index) => (
        <motion.button
          key={button.id}
          onClick={() => onActionSelect(button.id, button.label)}
          className="w-full px-6 py-4 bg-[hsl(var(--button-secondary))] text-white rounded-xl hover:bg-[hsl(var(--button-primary))] transition-colors text-left font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {button.label}
        </motion.button>
      ))}

      <motion.button
        type="button"
        onClick={onShowFeatureUnavailable}
        className="w-full px-6 py-3 bg-[hsl(var(--button-primary))] text-white rounded-full hover:bg-[hsl(var(--button-secondary))] transition-colors font-medium mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        title="Funcionalidad aún no implementada"
      >
        Mostrar más alternativas
      </motion.button>
    </div>
  );
};
