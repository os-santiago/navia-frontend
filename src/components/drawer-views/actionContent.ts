export interface ActionContent {
  title: string;
  description: string;
  buttons: string[];
}

const ACTION_CONTENT: Record<string, ActionContent> = {
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

export const getActionContent = (action: string, promptText?: string): ActionContent => {
  return (
    ACTION_CONTENT[action] || {
      title: promptText || "Acción seleccionada",
      description: promptText
        ? `Estamos procesando tu solicitud:\n\n"${promptText}"`
        : "Contenido de la acción en proceso...",
      buttons: ["Llevame allá", "Empezar un nuevo surf"],
    }
  );
};
