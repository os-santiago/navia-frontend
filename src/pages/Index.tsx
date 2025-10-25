import { useState } from "react";
import { FloatingButton } from "@/components/FloatingButton";
import { NaviaDrawer } from "@/components/NaviaDrawer";

const Index = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Simula el estado del usuario (true = nuevo, false = antiguo)
  const [isNewUser] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Contenido principal de la página */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Bienvenido a Navia
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tu asistente inteligente para navegar eventos y experiencias
          </p>
          <div className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg">
            Haz clic en el botón flotante para comenzar
          </div>
        </div>
      </div>

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
