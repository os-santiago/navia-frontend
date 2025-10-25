import { motion } from "framer-motion";

interface ReturningUserViewProps {
  onActionSelect: (actionId: string, actionLabel: string) => void;
}

const actionButtons = [
  {
    id: "ticket-types",
    label: "Quiere ver los tipos de entradas para el Mundo Rural",
  },
  {
    id: "cancel-ticket",
    label: "Donde puedo cancelar la compra de mi entrada",
  },
  {
    id: "rock-shows",
    label: "Que shows de rock hay en Santiago el 2026",
  },
];

export const ReturningUserView = ({ onActionSelect }: ReturningUserViewProps) => {
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
        className="w-full px-6 py-3 bg-[hsl(var(--button-primary))] text-white rounded-full hover:bg-[hsl(var(--button-secondary))] transition-colors font-medium mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Mostrar que no he surfeado aún
      </motion.button>
    </div>
  );
};
