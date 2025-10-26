import { motion } from "framer-motion";

interface FloatingButtonProps {
  onClick: () => void;
}

const SurfboardIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2"
  >
    <path
      d="M5 19L19 5M7 17L17 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3"
      transform="rotate(45 12 12)"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const FloatingButton = ({ onClick }: FloatingButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-[hsl(var(--floating-button))] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-[2147483645] hover:shadow-xl transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SurfboardIcon />
      <span className="font-medium text-lg">Navia</span>
    </motion.button>
  );
};
