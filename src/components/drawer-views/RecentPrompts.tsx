import { motion } from "framer-motion";

interface RecentPromptsProps {
  prompts: Array<{
    prompt: string;
    response: string;
    timestamp: string;
  }>;
  onSelectPrompt: (prompt: string) => void;
  onClear?: () => void;
}

export const RecentPrompts = ({ prompts, onSelectPrompt, onClear }: RecentPromptsProps) => {
  if (prompts.length === 0) {
    return null;
  }

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Tus últimos surfeos
        </h3>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Borrar historial
          </button>
        )}
      </div>
      <div className="space-y-2">
        {prompts.map((item, index) => (
          <motion.button
            key={`${item.timestamp}-${index}`}
            onClick={() => onSelectPrompt(item.prompt)}
            className="w-full text-left p-4 bg-[hsl(var(--button-secondary))] text-white rounded-xl hover:bg-[hsl(var(--button-primary))] transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <p className="font-medium">{item.prompt}</p>
            <p className="text-xs opacity-80 mt-2 line-clamp-2">
              {item.response}
            </p>
            <p className="text-[10px] mt-2 uppercase tracking-wide text-white/60">
              {formatDate(item.timestamp)}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
