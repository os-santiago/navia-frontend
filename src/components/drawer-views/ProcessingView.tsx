import { motion } from "framer-motion";

interface ProcessingViewProps {
  promptText?: string;
}

export const ProcessingView = ({ promptText }: ProcessingViewProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Procesando tu solicitud...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Estamos preparando la mejor respuesta para tu prompt.
          </p>
        </div>
      </motion.div>

      {promptText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-sm rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground mb-1">Prompt recibido</p>
          <p className="italic">"{promptText}"</p>
        </motion.div>
      )}
    </div>
  );
};
