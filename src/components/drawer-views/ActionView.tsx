import { motion } from "framer-motion";
import { getActionContent } from "./actionContent";

interface ActionViewProps {
  action: string;
  onBack: () => void;
  promptText?: string;
  responseText?: string;
}

export const ActionView = ({
  action,
  onBack,
  promptText,
  responseText,
}: ActionViewProps) => {
  if (responseText) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="bg-[hsl(var(--button-secondary))] text-white rounded-xl p-6">
          <h3 className="font-semibold mb-4">Respuesta de Navia</h3>
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Esto es lo que encontramos:</p>
            <p className="text-sm whitespace-pre-line italic opacity-90">
              {responseText}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            className="w-full px-6 py-3 bg-[hsl(var(--button-primary))] text-white rounded-full hover:bg-[hsl(var(--button-secondary))] transition-colors font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
          >
            Empezar un nuevo surf
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const content = getActionContent(action, promptText);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-[hsl(var(--button-secondary))] text-white rounded-xl p-6">
        <h3 className="font-semibold mb-4">{content.title}</h3>
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Aquí unas pistas para tu surfeo:</p>
          <p className="text-sm whitespace-pre-line italic opacity-90">
            {content.description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {content.buttons.map((buttonText, index) => {
          const isRestartButton = buttonText === "Empezar un nuevo surf";
          return (
            <motion.button
              key={index}
              className="w-full px-6 py-3 bg-[hsl(var(--button-primary))] text-white rounded-full hover:bg-[hsl(var(--button-secondary))] transition-colors font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={isRestartButton ? onBack : undefined}
            >
              {buttonText}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
