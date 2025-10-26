import { useEffect, useMemo, useState } from "react";
import { FloatingButton } from "@/components/FloatingButton";
import { NaviaDrawer } from "@/components/NaviaDrawer";

const NAVIA_UI_STATE_KEY = "navia-ui-state";

type NaviaUiState = {
  drawerOpen?: boolean;
};

const readUiState = (): NaviaUiState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(NAVIA_UI_STATE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as NaviaUiState) : null;
  } catch {
    return null;
  }
};

const writeUiState = (partial: NaviaUiState) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = readUiState() ?? {};
    const next = { ...existing, ...partial };
    window.localStorage.setItem(NAVIA_UI_STATE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write failures (e.g., in private browsing).
  }
};

const Index = () => {
  const initialUiState = useMemo(() => readUiState(), []);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(initialUiState?.drawerOpen ?? false);
  // Simula el estado del usuario (true = nuevo, false = antiguo)
  const [isNewUser] = useState(true);

  useEffect(() => {
    writeUiState({ drawerOpen: isDrawerOpen });
  }, [isDrawerOpen]);

  return (
    <div>
      {/* Botón flotante */}
      <FloatingButton onClick={() => setIsDrawerOpen(true)} />

      {/* Drawer lateral */}
      <NaviaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isNewUser={isNewUser}
      />
    </div>
  );
};

export default Index;
