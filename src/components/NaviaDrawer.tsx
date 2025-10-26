import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io";

type DocumentMetadata = Record<string, unknown> & {
  name?: string;
  source?: string;
  source_url?: string;
  url?: string;
  anchor?: string | number;
  anchor_id?: string | number;
  fragment?: string | number;
  chunk_index?: string | number;
  chunkIndex?: string | number;
  chunk_id?: string;
  chunkId?: string;
  title?: string;
  title_guess?: string;
};

interface DocumentSuggestion {
  docId: string;
  chunkId?: string | null;
  label: string;
  url?: string | null;
  metadata?: DocumentMetadata | null;
}

interface RawDocumentReference {
  docId: string;
  chunkId?: string | null;
}

interface PromptRecord {
  prompt: string;
  response: string;
  actionId: string;
  timestamp: string;
  references?: DocumentSuggestion[];
  destinationUrl?: string | null;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const collectTextFromUnknown = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const aggregated = value
      .map((item) => collectTextFromUnknown(item))
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
        .map((item) => collectTextFromUnknown(item))
        .filter((segment): segment is string => Boolean(segment))
        .join("\n")
        .trim();

      if (aggregated.length > 0) {
        return aggregated;
      }
    }

    const nestedMessage = record.message;
    if (nestedMessage && typeof nestedMessage === "object") {
      const nested = collectTextFromUnknown(nestedMessage);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

const latestAgentMessageFromTranscript = (transcript: unknown[]): string | null => {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const entry = transcript[index];
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const role = record.role ?? record.from;
    if (typeof role !== "string" || role.toLowerCase() !== "agent") {
      continue;
    }

    const candidates = [record.message, record.response, record.content, record.data, record];
    for (const candidate of candidates) {
      const text = collectTextFromUnknown(candidate);
      if (text) {
        return text;
      }
    }
  }

  return null;
};

const extractTrailingUrl = (text: string | null | undefined): string | null => {
  if (!text) {
    return null;
  }

  const trimmed = text.trim();
  const match = trimmed.match(/(https?:\/\/[^\s)]+)\s*$/i);
  if (!match) {
    return null;
  }

  const raw = match[1];
  const cleaned = raw.replace(/[.,!?)]*$/, "");
  return cleaned.length > 0 ? cleaned : null;
};

const extractDocumentReferencesFromTranscript = (
  transcript: unknown[],
): RawDocumentReference[] => {
  const references: RawDocumentReference[] = [];

  for (const entry of transcript) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const ragInfo = (record.rag_retrieval_info ?? record.ragRetrievalInfo) as
      | Record<string, unknown>
      | undefined;

    const chunks = ragInfo?.chunks;
    if (!Array.isArray(chunks)) {
      continue;
    }

    for (const chunk of chunks) {
      if (!chunk || typeof chunk !== "object") {
        continue;
      }

      const chunkRecord = chunk as Record<string, unknown>;
      const documentIdRaw =
        chunkRecord.document_id ?? chunkRecord.documentId ?? chunkRecord.doc_id;
      const docId = typeof documentIdRaw === "string" ? documentIdRaw : null;
      if (!docId) {
        continue;
      }

      const chunkIdRaw = chunkRecord.chunk_id ?? chunkRecord.chunkId;
      const chunkId =
        typeof chunkIdRaw === "string" || typeof chunkIdRaw === "number"
          ? String(chunkIdRaw)
          : null;

      references.push({
        docId,
        chunkId,
      });
    }
  }

  return references;
};

const normalizeDocumentMetadata = (payload: unknown): DocumentMetadata | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const baseMetadata: DocumentMetadata = {
    ...(typeof record.metadata === "object" && record.metadata
      ? (record.metadata as Record<string, unknown>)
      : {}),
  };

  for (const [key, value] of Object.entries(record)) {
    if (baseMetadata[key] === undefined) {
      baseMetadata[key] = value;
    }
  }

  if (baseMetadata.doc_id === undefined && typeof record.id === "string") {
    baseMetadata.doc_id = record.id;
  }

  if (baseMetadata.source_url === undefined && typeof record.url === "string") {
    baseMetadata.source_url = record.url;
  }

  return baseMetadata;
};

const createNavigationHint = (
  metadata: DocumentMetadata | null | undefined,
  fallback: string,
): { label: string; url: string | null } => {
  if (!metadata || typeof metadata !== "object") {
    return { label: fallback, url: null };
  }

  const record = metadata as Record<string, unknown>;
  const rawUrlValue =
    record.source_url ?? record.source ?? record.url ?? record.link ?? record.href;
  const rawUrl = typeof rawUrlValue === "string" ? rawUrlValue : null;

  const rawAnchorValue =
    record.anchor ?? record.anchor_id ?? record.fragment ?? record.anchorId;
  let anchor: string | null = null;
  if (typeof rawAnchorValue === "string" || typeof rawAnchorValue === "number") {
    const normalized = String(rawAnchorValue).trim();
    if (normalized.length > 0) {
      anchor = normalized.startsWith("#") ? normalized.slice(1) : normalized;
    }
  }

  let finalUrl = rawUrl;
  if (rawUrl && anchor) {
    const baseUrl = rawUrl.split("#", 1)[0];
    finalUrl = `${baseUrl}#${anchor}`;
  }

  const chunkIndexRaw = record.chunk_index ?? record.chunkIndex;
  const chunkIndex =
    typeof chunkIndexRaw === "string" || typeof chunkIndexRaw === "number"
      ? String(chunkIndexRaw)
      : null;

  const chunkIdRaw = record.chunk_id ?? record.chunkId;
  const chunkId = typeof chunkIdRaw === "string" ? chunkIdRaw : null;

  const titleRaw = record.title ?? record.title_guess ?? record.name;
  const title = typeof titleRaw === "string" ? titleRaw : null;

  const parts: string[] = [];
  if (title) {
    parts.push(title);
  }
  if (finalUrl) {
    parts.push(`Visita ${finalUrl}`);
  }
  if (chunkIndex) {
    parts.push(`Chunk #${chunkIndex}`);
  }
  if (chunkId) {
    parts.push(`Chunk id: ${chunkId}`);
  }

  if (parts.length === 0) {
    return { label: fallback, url: finalUrl ?? rawUrl ?? null };
  }

  return { label: parts.join(" — "), url: finalUrl ?? rawUrl ?? null };
};

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
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [featureModalConfig, setFeatureModalConfig] = useState<FeatureModalConfig | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isAgentConnecting, setIsAgentConnecting] = useState(false);
  const conversationRef = useRef<ConversationSession | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const metadataCacheRef = useRef<Map<string, DocumentMetadata | null>>(new Map());
  const transcriptRequestIdRef = useRef(0);
  const lastRedirectUrlRef = useRef<string | null>(null);
  const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const authorizationHeader = useMemo(() => {
    if (!elevenLabsApiKey) {
      return null;
    }

    return elevenLabsApiKey.startsWith("Bearer ")
      ? elevenLabsApiKey
      : `${elevenLabsApiKey}`;
  }, [elevenLabsApiKey]);
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

  const fetchDocumentMetadata = useCallback(
    async (docIds: string[]) => {
      const metadataMap = new Map<string, DocumentMetadata | null>();

      if (!agentId || !authorizationHeader || docIds.length === 0) {
        return metadataMap;
      }

      const uniqueDocIds = Array.from(
        new Set(docIds.filter((docId) => isNonEmptyString(docId))),
      );

      await Promise.all(
        uniqueDocIds.map(async (docId) => {
          if (!docId) {
            return;
          }

          if (metadataCacheRef.current.has(docId)) {
            const cached = metadataCacheRef.current.get(docId) ?? null;
            metadataMap.set(docId, cached);
            return;
          }

          try {
            const response = await fetch(
              `${ELEVENLABS_API_BASE_URL}/v1/convai/knowledge-base/documents/${encodeURIComponent(docId)}?agent_id=${encodeURIComponent(agentId)}`,
              {
                headers: {
                  // 'Access-Control-Allow-Origin': '',
                  Authorization: authorizationHeader,
                  Accept: "application/json",
                },
              },
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const metadata = normalizeDocumentMetadata(payload);
            metadataCacheRef.current.set(docId, metadata);
            metadataMap.set(docId, metadata);
          } catch (error) {
            console.error(`No se pudo obtener los metadatos del documento ${docId}`, error);
            metadataCacheRef.current.set(docId, null);
          }
        }),
      );

      for (const docId of uniqueDocIds) {
        if (!metadataMap.has(docId) && metadataCacheRef.current.has(docId)) {
          metadataMap.set(docId, metadataCacheRef.current.get(docId) ?? null);
        }
      }

      return metadataMap;
    },
    [agentId, authorizationHeader],
  );

  const refreshConversationState = useCallback(async () => {
    const conversationId = conversationIdRef.current;

    if (!conversationId || !authorizationHeader) {
      return;
    }

    const requestId = transcriptRequestIdRef.current + 1;
    transcriptRequestIdRef.current = requestId;

    try {
      const response = await fetch(
        `${ELEVENLABS_API_BASE_URL}/v1/convai/conversations/${conversationId}`,
        {
          headers: {
            // 'Access-Control-Allow-Origin': '*',
            Authorization: authorizationHeader,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const transcript: unknown[] = Array.isArray(payload?.transcript)
        ? payload.transcript
        : [];

      const agentText = latestAgentMessageFromTranscript(transcript);
      const references = extractDocumentReferencesFromTranscript(transcript);
      const metadataMap = await fetchDocumentMetadata(
        references.map((reference) => reference.docId),
      );

      setPromptHistory((prev) => {
        if (requestId !== transcriptRequestIdRef.current || prev.length === 0) {
          return prev;
        }

        const updated = [...prev];
        const lastIndex = updated.length - 1;
        const current = updated[lastIndex];

        const seenDocIds = new Set<string>();
        const suggestions: DocumentSuggestion[] = [];

        for (const { docId, chunkId } of references) {
          if (!docId || seenDocIds.has(docId)) {
            continue;
          }

          seenDocIds.add(docId);
          const metadata =
            metadataMap.get(docId) ?? metadataCacheRef.current.get(docId) ?? null;
          const fallback = chunkId ? `${docId} (chunk ${chunkId})` : docId;
          const { label, url } = createNavigationHint(metadata, fallback);

          suggestions.push({
            docId,
            chunkId,
            label,
            url,
            metadata,
          });
        }

        const trailingUrl = extractTrailingUrl(agentText ?? current.response);
        console.log("Url extraída:", trailingUrl);
        updated[lastIndex] = {
          ...current,
          response: agentText ?? current.response,
          references: suggestions,
          destinationUrl: trailingUrl ?? current.destinationUrl ?? null,
        };

        return updated;
      });
    } catch (error) {
      console.error("No se pudo actualizar la conversación de Navia", error);
    }
  }, [authorizationHeader, fetchDocumentMetadata]);

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
      const text = collectTextFromUnknown(candidate);
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

      if (!conversationIdRef.current && conversationRef.current) {
        const sessionId = conversationRef.current.getId();
        if (isNonEmptyString(sessionId)) {
          conversationIdRef.current = sessionId;
        }
      }

      const urlCandidate = extractTrailingUrl(text);

      setPromptHistory((prev) => {
        if (prev.length === 0 && submittedPrompt.trim().length === 0) {
          setWelcomeMessage(text);
          return prev;
        }

        if (prev.length === 0) {
          return [
            {
              prompt: submittedPrompt,
              response: text,
              actionId: "agent",
              timestamp: new Date().toISOString(),
              references: [],
              destinationUrl: urlCandidate ?? null,
            },
          ];
        }

        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          response: text,
          actionId: updated[lastIndex].actionId || "agent",
          references: updated[lastIndex].references,
          destinationUrl: urlCandidate ?? updated[lastIndex].destinationUrl ?? null,
        };

        return updated;
      });

      setPromptError(null);
      setAgentError(null);
      setCurrentView("action");
      // void refreshConversationState();
    },
    [refreshConversationState, submittedPrompt],
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

    if (!authorizationHeader) {
      setAgentError(
        "Falta la API Key de ElevenLabs. Añádela a las variables de entorno para continuar.",
      );
      return;
    }

    try {
      setWelcomeMessage(null);
      setIsAgentConnecting(true);
      setAgentError(null);
      metadataCacheRef.current.clear();
      transcriptRequestIdRef.current += 1;
      const authorizationToken = authorizationHeader.replace(/^Bearer\s+/i, "");

      const session = await Conversation.startSession({
        agentId,
        connectionType: "websocket",
        // authorization: authorizationToken,
        origin: "https://api.elevenlabs.io",
        textOnly: true,
        overrides: {
          conversation: {
            textOnly: true,
          },
        },
        onConnect: () => {
          setAgentError(null);
        },
        onDisconnect: () => {
          conversationRef.current = null;
          conversationIdRef.current = null;
          transcriptRequestIdRef.current += 1;
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
      const sessionId = session.getId();
      if (isNonEmptyString(sessionId)) {
        conversationIdRef.current = sessionId;
      }
    } catch (error) {
      console.error("No fue posible iniciar la conversación con Navia", error);
      setAgentError(
        "No pudimos conectar con Navia. Intenta nuevamente en unos segundos.",
      );
    } finally {
      setIsAgentConnecting(false);
    }
  }, [agentId, authorizationHeader, handleAgentMessage, isAgentConnecting]);

  const handleBackToInitial = () => {
    setCurrentView("initial");
    setSubmittedPrompt("");
    setPromptError(null);
    setAgentError(null);
    lastRedirectUrlRef.current = null;
  };

  const handleClearHistory = () => {
    setPromptHistory([]);
    setSelectedActionId(null);
    setPrefilledPrompt("");
    setSubmittedPrompt("");
    setInputValue("");
    setPromptError(null);
    setAgentError(null);
    lastRedirectUrlRef.current = null;
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
        references: [],
        destinationUrl: null,
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
    conversationIdRef.current = null;
    metadataCacheRef.current.clear();
    transcriptRequestIdRef.current += 1;
    lastRedirectUrlRef.current = null;
    if (conversationRef.current) {
      void conversationRef.current.endSession();
      conversationRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      conversationIdRef.current = null;
      metadataCacheRef.current.clear();
      transcriptRequestIdRef.current += 1;
      lastRedirectUrlRef.current = null;
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
    const metadataCache = metadataCacheRef.current;

    return () => {
      conversationIdRef.current = null;
      metadataCache.clear();
      transcriptRequestIdRef.current += 1;
      lastRedirectUrlRef.current = null;
      if (conversationRef.current) {
        void conversationRef.current.endSession();
        conversationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isOpen) {
      lastRedirectUrlRef.current = null;
      return;
    }

    if (currentView !== "action") {
      return;
    }

    const latest = promptHistory[promptHistory.length - 1];
    if (!latest || !isNonEmptyString(latest.destinationUrl)) {
      return;
    }

    const url = latest.destinationUrl.trim();
    if (lastRedirectUrlRef.current === url) {
      return;
    }

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1"
      ) {
        console.warn("Redirección omitida: destino apunta a localhost", url);
        lastRedirectUrlRef.current = url;
        return;
      }
      // TODO: forzando ir a localhost.local para resolver la navegación local, reemplazar esto después
      lastRedirectUrlRef.current = url;
      console.log("Redireccionando automáticamente a Navia", url, parsed, parsed.pathname);
      console.log("Url de redirección: ", "http://localhost.local:8080" + parsed.pathname);
      lastRedirectUrlRef.current = "http://localhost.local:8080" + parsed.pathname;// url;
      console.log("Redireccionando automáticamente a Navia", url);
      window.location.href = "http://localhost.local:8080" + parsed.pathname;// url;
    } catch (error) {
      console.error("No se pudo redirigir automáticamente a Navia", error);
    }
  }, [currentView, isOpen, promptHistory]);

  const latestPromptRecord = promptHistory[promptHistory.length - 1];
  const latestResponseText = latestPromptRecord?.response?.trim()
    ? latestPromptRecord.response
    : undefined;
  const latestReferences = latestPromptRecord?.references?.map((reference) => ({
    label: reference.label,
    url: reference.url ?? undefined,
  }));

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
                <div className="space-y-6">
                  {welcomeMessage && (
                    <div className="rounded-2xl bg-[hsl(var(--button-secondary))] p-6 text-white shadow-lg">
                      <h3 className="text-lg font-semibold mb-2">Bienvenido a Navia</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line opacity-90">
                        {welcomeMessage}
                      </p>
                    </div>
                  )}
                  {effectiveIsNewUser ? (
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
                  )}
                </div>
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
                  references={latestReferences}
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
                      <RefreshCw className="w-5 h-5" />
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
