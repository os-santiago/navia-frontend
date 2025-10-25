import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingView = () => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-muted-foreground">Cargando tus opciones...</p>
      </motion.div>

      {/* Skeleton loaders for action buttons */}
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}

      <Skeleton className="h-12 w-full rounded-full mt-6" />
    </div>
  );
};
