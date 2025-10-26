import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Conversation } from "@elevenlabs/client";
import { NewUserView } from "./drawer-views/NewUserView";
import { RecentPrompts } from "./drawer-views/RecentPrompts";
import { ActionView } from "./drawer-views/ActionView";
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

type ConversationSession = Awaited<ReturnType<typeof Conversation.startSession>>;

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
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isAgentConnecting, setIsAgentConnecting] = useState(false);
  const conversationRef = useRef<ConversationSession | null>(null);
  const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const isInputDisabled = currentView === "processing" || isAgentConnecting;
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
          ? "Opciones de surf para hoy"
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

  const handleActionSelect = (actionId: string, actionLabel: string) => {
    setSelectedActionId(actionId);
    setPrefilledPrompt(actionLabel);
    setInputValue(actionLabel);
    setPromptError(null);
  };

  const showFeatureNotAvailable = (config?: FeatureModalConfig) => {
    setFeatureModalConfig(config ?? {});
  };

  const extractAgentMessage = (message: unknown): { role: string | null; text: string | null } => {
    if (message == null) {
      return { role: null, text: null };
    }

    if (typeof message === "string") {
      const trimmed = message.trim();
      return { role: null, text: trimmed.length > 0 ? trimmed : null };
    }

    const payload = message as Record<string, unknown>;
    const nested = (payload.message as Record<string, unknown> | undefined) ?? undefined;

    const collectFromUnknown = (value: unknown): string | null => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }

      if (Array.isArray(value)) {
        const aggregated = value
          .map((item) => collectFromUnknown(item))
          .filter((segment): segment is string => Boolean(segment))
          .join("\n")
          .trim();

        return aggregated.length > 0 ? aggregated : null;
      }

      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const directKeys = ["text", "value", "message", "response", "transcript"];

        for (const key of directKeys) {
          const candidate = record[key];
          if (typeof candidate === "string") {
            const trimmed = candidate.trim();
            if (trimmed.length > 0) {
              return trimmed;
            }
          }
        }

        if (Array.isArray(record.content)) {
          const aggregated = record.content
            .map((item) => collectFromUnknown(item))
            .filter((segment): segment is string => Boolean(segment))
            .join("\n")
            .trim();

          if (aggregated.length > 0) {
            return aggregated;
          }
        }
      }

      return null;
    };

    const roleCandidate = (() => {
      if (typeof payload.role === "string") {
        return payload.role;
      }
      if (typeof payload.from === "string") {
        return payload.from;
      }
      if (nested && typeof nested.role === "string") {
        return nested.role;
      }
      return null;
    })();

    const candidates: unknown[] = [
      payload,
      payload.text,
      payload.response,
      payload.content,
      payload.data,
      nested,
      nested?.text,
      nested?.response,
      nested?.content,
    ];

    for (const candidate of candidates) {
      const text = collectFromUnknown(candidate);
      if (text) {
        return { role: roleCandidate, text };
      }
    }

    return { role: roleCandidate, text: null };
  };

  const handleAgentMessage = useCallback(
    (message: unknown) => {
      const { role, text } = extractAgentMessage(message);
      if (!text) {
        return;
      }

      const normalizedRole = role?.toLowerCase();
      if (normalizedRole && ["user", "input"].includes(normalizedRole)) {
        return;
      }

      setPromptHistory((prev) => {
        if (prev.length === 0) {
          return [
            {
              prompt: submittedPrompt,
              response: text,
              actionId: "agent",
              timestamp: new Date().toISOString(),
            },
          ];
        }

        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          response: text,
          actionId: updated[lastIndex].actionId || "agent",
        };

        return updated;
      });

      setPromptError(null);
      setAgentError(null);
      setCurrentView("action");
    },
    [submittedPrompt],
  );

  const initializeConversation = useCallback(async () => {
    if (conversationRef.current || isAgentConnecting) {
      return;
    }

    if (!agentId) {
      setAgentError(
        "No se ha configurado el agente de Navia. Revisa las variables de entorno antes de continuar.",
      );
      return;
    }

    if (!elevenLabsApiKey) {
      setAgentError(
        "Falta la API Key de ElevenLabs. Añádela a las variables de entorno para continuar.",
      );
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setAgentError("Tu navegador no soporta acceso al micrófono requerido para conectar con Navia.");
      return;
    }

    try {
      setIsAgentConnecting(true);
      setAgentError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const authorizationHeader = elevenLabsApiKey.startsWith("Bearer ")
        ? elevenLabsApiKey
        : `Bearer ${elevenLabsApiKey}`;

      const session = await Conversation.startSession({
        agentId,
        connectionType: "webrtc",
        authorization: authorizationHeader,
        onConnect: () => {
          setAgentError(null);
        },
        onDisconnect: () => {
          conversationRef.current = null;
        },
        onMessage: (message) => {
          handleAgentMessage(message);
        },
        onModeChange: (mode) => {
          console.log("Estado del agente de Navia:", mode.mode);
        },
        onError: (error) => {
          console.error("Error en la sesión de Navia", error);
          setAgentError("Ocurrió un problema con la conexión al agente de Navia. Intenta nuevamente.");
          conversationRef.current = null;
        },
      });

      conversationRef.current = session;
    } catch (error) {
      console.error("No fue posible iniciar la conversación con Navia", error);
      setAgentError(
        "No pudimos conectar con Navia. Verifica los permisos del micrófono e inténtalo otra vez.",
      );
    } finally {
      setIsAgentConnecting(false);
    }
  }, [agentId, elevenLabsApiKey, handleAgentMessage, isAgentConnecting]);

  const handleBackToInitial = () => {
    setCurrentView("initial");
    setSubmittedPrompt("");
    setPromptError(null);
    setAgentError(null);
  };

  const handleClearHistory = () => {
    setPromptHistory([]);
    setSelectedActionId(null);
    setPrefilledPrompt("");
    setSubmittedPrompt("");
    setInputValue("");
    setPromptError(null);
    setAgentError(null);
  };

  const handleSendPrompt = async () => {
    const trimmedPrompt = inputValue.trim();
    if (!trimmedPrompt) {
      return;
    }

    const tokenPattern = /\[[^\]]+\]/g;
    if (tokenPattern.test(trimmedPrompt)) {
      setPromptError("Reemplaza los campos entre corchetes antes de enviar el prompt.");
      return;
    }

    setAgentError(null);
    if (!conversationRef.current) {
      if (!isAgentConnecting) {
        void initializeConversation();
      }
      setPromptError(
        "Estamos conectando con Navia. Intenta enviar tu consulta nuevamente en unos segundos.",
      );
      return;
    }

    const actionIdToUse = selectedActionId ?? "custom";

    setSubmittedPrompt(trimmedPrompt);
    if (selectedActionId !== actionIdToUse) {
      setSelectedActionId(actionIdToUse);
    }
    setPrefilledPrompt("");
    setInputValue("");
    setCurrentView("processing");
    setPromptError(null);
    setPromptHistory((prev) => [
      ...prev,
      {
        prompt: trimmedPrompt,
        response: "",
        actionId: actionIdToUse,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      await conversationRef.current.sendUserMessage(trimmedPrompt);
    } catch (error) {
      console.error("No se pudo enviar el mensaje a Navia", error);
      setAgentError("No pudimos enviar tu mensaje a Navia. Revisa tu conexión e inténtalo nuevamente.");
      setPromptHistory((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          response:
            "No pudimos enviar tu mensaje a Navia. Revisa tu conexión e inténtalo nuevamente.",
        };
        return updated;
      });
      setCurrentView("action");
    }
  };

  const handlePromptChange = (value: string) => {
    setInputValue(value);
    if (promptError) {
      setPromptError(null);
    }
    if (agentError) {
      setAgentError(null);
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
    setAgentError(null);
    setIsAgentConnecting(false);
    if (conversationRef.current) {
      void conversationRef.current.endSession();
      conversationRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (conversationRef.current) {
        void conversationRef.current.endSession();
        conversationRef.current = null;
      }
      return;
    }

    if (!conversationRef.current && !isAgentConnecting) {
      void initializeConversation();
    }
  }, [initializeConversation, isAgentConnecting, isOpen]);

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        void conversationRef.current.endSession();
        conversationRef.current = null;
      }
    };
  }, []);

  const latestPromptRecord = promptHistory[promptHistory.length - 1];
  const latestResponseText = latestPromptRecord?.response?.trim()
    ? latestPromptRecord.response
    : undefined;

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
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[hsl(var(--drawer-bg))] shadow-2xl z-50 flex flex-col"
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
              {currentView === "initial" && (
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
              ) : (
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
              )
            )}
              {currentView === "processing" && (
                <ProcessingView promptText={submittedPrompt || inputValue} />
              )}
              {currentView === "action" && (
                <ActionView
                  action={selectedActionId ?? "custom"}
                  onBack={handleBackToInitial}
                  promptText={latestPromptRecord?.prompt ?? submittedPrompt}
                  responseText={latestResponseText}
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
                      type="button"
                      className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => void initializeConversation()}
                      disabled={isAgentConnecting}
                      aria-label="Reconectar con Navia"
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
                {isAgentConnecting && (
                  <p className="text-xs text-muted-foreground">
                    Conectando con Navia...
                  </p>
                )}
                {agentError && (
                  <p className="text-sm text-destructive">{agentError}</p>
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
