import { motion } from "framer-motion";

interface ActionViewProps {
  action: string;
  onBack: () => void;
  promptText?: string;
}

const actionContent: Record<string, { title: string; description: string; buttons: string[] }> = {
  "ticket-types": {
    title: "Quiere ver los tipos de entradas para el Mundo Rural",
    description:
      "Aquí unas pistas para tu surfeo:\n\nAhora te estamos mostrando en pantalla el evento que mencionaste, al hacer click en el surfearás a la página del evento donde podrás encontrar la información de las entradas que buscas.",
    buttons: ["¿Quieres que lleve allí?", "Empezar un nuevo surf"],
  },
  "event-date": {
    title: "Ver cuando es el evento",
    description:
      "Te mostraré la información sobre la fecha del evento que buscas. Aquí encontrarás todos los detalles.",
    buttons: ["Ver más detalles", "Empezar un nuevo surf"],
  },
  "buy-tickets": {
    title: "Comprar entradas para el evento",
    description:
      "Te ayudaré a encontrar las mejores entradas para el evento que te interesa.",
    buttons: ["Ver opciones de compra", "Empezar un nuevo surf"],
  },
  "discover-event": {
    title: "Descubrir eventos",
    description:
      "Explora eventos según tus preferencias. Te mostraremos las mejores opciones disponibles.",
    buttons: ["Ver eventos", "Empezar un nuevo surf"],
  },
  "cancel-ticket": {
    title: "Cancelar compra de entrada",
    description:
      "Aquí te ayudaremos con el proceso de cancelación de tu entrada.",
    buttons: ["Ir a cancelación", "Empezar un nuevo surf"],
  },
  "rock-shows": {
    title: "Shows de rock en Santiago",
    description:
      "Te mostraré todos los shows de rock programados para Santiago en 2026.",
    buttons: ["Ver calendario", "Empezar un nuevo surf"],
  },
};

export const ActionView = ({ action, onBack, promptText }: ActionViewProps) => {
  const content =
    actionContent[action] ||
    {
      title: promptText || "Acción seleccionada",
      description: promptText
        ? `Estamos procesando tu solicitud:\n\n"${promptText}"`
        : "Contenido de la acción en proceso...",
      buttons: ["Continuar", "Empezar un nuevo surf"],
    };

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
