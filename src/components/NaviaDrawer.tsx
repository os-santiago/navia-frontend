import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NewUserView } from "./drawer-views/NewUserView";
import { RecentPrompts } from "./drawer-views/RecentPrompts";
import { ActionView } from "./drawer-views/ActionView";
import { getActionContent } from "./drawer-views/actionContent";
import { LoadingView } from "./drawer-views/LoadingView";
import { ProcessingView } from "./drawer-views/ProcessingView";
import { FeatureNotAvailableModal } from "./FeatureNotAvailableModal";

interface NaviaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isNewUser?: boolean;
}

export type DrawerView = "loading" | "initial" | "processing" | "action";

type FeatureModalConfig = {
  title?: string;
  description?: string;
  confirmLabel?: string;
};

interface PromptRecord {
  prompt: string;
  response: string;
  actionId: string;
  timestamp: string;
}

const SurfboardIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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

export const NaviaDrawer = ({ isOpen, onClose, isNewUser = true }: NaviaDrawerProps) => {
  const [currentView, setCurrentView] = useState<DrawerView>("loading");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [prefilledPrompt, setPrefilledPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptRecord[]>([]);
  const [featureModalConfig, setFeatureModalConfig] = useState<FeatureModalConfig | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInputDisabled = currentView === "processing";
  const hasPromptHistory = promptHistory.length > 0;
  const effectiveIsNewUser = !hasPromptHistory && isNewUser;
  const promptPlaceholder =
    currentView === "action"
      ? "A dónde quieres que nos lleve la ola ahora ..."
      : effectiveIsNewUser
        ? "Hacia donde quieres surfear hoy ..."
        : "A dónde quieres que nos lleve la ola ahora ...";
  const headerTitle =
    currentView === "loading"
      ? "Analizando página web"
      : currentView === "initial"
        ? effectiveIsNewUser
          ? "¿Dónde vamos a surfear hoy?" // "Opciones de surf para hoy"
          : "Tus surfeos anteriores"
        : currentView === "processing"
          ? "Procesando tu prompt"
          : "Ya estás surfeando en la web";

  // Simulate backend data fetch when drawer opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!isDataLoaded) {
      if (currentView !== "loading") {
        setCurrentView("loading");
      }

      // Simulate API call
      setTimeout(() => {
        // Mock backend response
        console.log("Data fetched from backend:", {
          userId: effectiveIsNewUser ? "new-user-123" : "returning-user-456",
          preferences: ["surf", "events"],
          timestamp: new Date().toISOString(),
        });

        setIsDataLoaded(true);
        setCurrentView("initial");
      }, 2000); // 2 second delay to simulate network request
    } else if (currentView === "loading") {
      setCurrentView("initial");
    }
  }, [isOpen, isDataLoaded, isNewUser, effectiveIsNewUser, currentView]);

  const clearProcessingTimeout = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  const handleActionSelect = (actionId: string, actionLabel: string) => {
    setSelectedActionId(actionId);
    setPrefilledPrompt(actionLabel);
    setInputValue(actionLabel);
    setPromptError(null);
  };

  const showFeatureNotAvailable = (config?: FeatureModalConfig) => {
    setFeatureModalConfig(config ?? {});
  };

  const handleBackToInitial = () => {
    clearProcessingTimeout();
    setCurrentView("initial");
    setSubmittedPrompt("");
    setPromptError(null);
  };

  const handleClearHistory = () => {
    setPromptHistory([]);
    setSelectedActionId(null);
    setPrefilledPrompt("");
    setSubmittedPrompt("");
    setInputValue("");
    setPromptError(null);
  };

  const handleSendPrompt = () => {
    const trimmedPrompt = inputValue.trim();
    if (!trimmedPrompt) {
      return;
    }

    const tokenPattern = /\[[^\]]+\]/g;
    if (tokenPattern.test(trimmedPrompt)) {
      setPromptError("Reemplaza los campos entre corchetes antes de enviar el prompt.");
      return;
    }

    const actionIdToUse = selectedActionId ?? "custom";

    setSubmittedPrompt(trimmedPrompt);
    if (selectedActionId !== actionIdToUse) {
      setSelectedActionId(actionIdToUse);
    }
    setInputValue("");
    clearProcessingTimeout();
    setCurrentView("processing");
    processingTimeoutRef.current = setTimeout(() => {
      const content = getActionContent(actionIdToUse, trimmedPrompt);
      setPromptHistory((prev) => [
        ...prev,
        {
          prompt: trimmedPrompt,
          response: content.description,
          actionId: actionIdToUse,
          timestamp: new Date().toISOString(),
        },
      ]);
      setCurrentView("action");
      processingTimeoutRef.current = null;
    }, 1200);
    setPromptError(null);
  };

  const handlePromptChange = (value: string) => {
    setInputValue(value);
    if (promptError) {
      setPromptError(null);
    }

    if (value === "") {
      setSelectedActionId(null);
      setPrefilledPrompt("");
      return;
    }

    if (prefilledPrompt && value !== prefilledPrompt) {
      setSelectedActionId(null);
      setPrefilledPrompt("");
    }
  };

  const handleClose = () => {
    onClose();
    setFeatureModalConfig(null);
    setPromptError(null);
  };

  useEffect(() => {
    return () => {
      clearProcessingTimeout();
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 z-[2147483646]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[hsl(var(--drawer-bg))] shadow-2xl z-[2147483647] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {headerTitle}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentView === "loading" && <LoadingView />}
              {/* {currentView === "initial" && (
                effectiveIsNewUser ? (
                <NewUserView
                  onActionSelect={handleActionSelect}
                  onShowFeatureUnavailable={() =>
                    showFeatureNotAvailable({
                      description:
                        "La opción de mostrar más alternativas estará disponible pronto. Sigue explorando otras acciones mientras tanto.",
                    })
                  }
                />
              ) : ( */}
              { effectiveIsNewUser &&
                <div className="space-y-6">
                  <RecentPrompts
                    prompts={promptHistory.slice(-3).reverse()}
                    onSelectPrompt={(prompt) => {
                      setInputValue(prompt);
                      setPrefilledPrompt(prompt);
                      setPromptError(null);
                      setSelectedActionId(null);
                    }}
                    onClear={handleClearHistory}
                  />
                </div>
              }
            {/*  )
            )} */}
              {currentView === "processing" && (
                <ProcessingView promptText={submittedPrompt || inputValue} />
              )}
              {currentView === "action" && (
                <ActionView
                  action={selectedActionId ?? "custom"}
                  onBack={handleBackToInitial}
                  promptText={submittedPrompt}
                />
              )}
            </div>

            {/* Footer with Surfboard Icon and Input */}
            {currentView !== "loading" && currentView !== "processing" && (
              <div className="border-t border-border p-6 space-y-4">
                {/* Surfboard Icon with Arrows */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1 h-0.5 bg-foreground"></div>
                  <div className="text-foreground">
                    <SurfboardIcon />
                  </div>
                  <div className="flex-1 h-0.5 bg-foreground"></div>
                </div>

                {/* Input Field */}
                <div className="relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    aria-invalid={promptError ? "true" : "false"}
                    aria-describedby={promptError ? "prompt-error" : undefined}
                    placeholder={promptPlaceholder}
                    disabled={isInputDisabled}
                    className="w-full min-h-32 max-h-64 px-4 py-4 pr-24 rounded-2xl border-2 border-foreground bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      onClick={() =>
                        showFeatureNotAvailable({
                          description:
                            "La funcionalidad de micrófono aún no está implementada. Próximamente podrás dictar tus instrucciones desde aquí.",
                        })
                      }
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendPrompt}
                      disabled={isInputDisabled}
                      className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {promptError && (
                  <p id="prompt-error" className="text-sm text-destructive">
                    {promptError}
                  </p>
                )}
              </div>
            )}
          </motion.div>
          <FeatureNotAvailableModal
            isOpen={!!featureModalConfig}
            onClose={() => setFeatureModalConfig(null)}
            {...(featureModalConfig ?? {})}
          />
        </>
      )}
    </AnimatePresence>
  );
};
