import { useState } from "react";
import { FloatingButton } from "@/components/FloatingButton";
import { NaviaDrawer } from "@/components/NaviaDrawer";

const Index = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Simula el estado del usuario (true = nuevo, false = antiguo)
  const [isNewUser] = useState(true);

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
