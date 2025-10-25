# Arquitectura de la aplicación Navia Drawer

## Visión general
La aplicación es una SPA construida con **React**, **TypeScript** y **Vite**. El objetivo es ofrecer una experiencia de asistente conversacional centrada en un *drawer* lateral que guía al usuario por diferentes acciones relacionadas con eventos. La arquitectura está pensada para ser modular, favoreciendo la extensión futura de vistas y rutas.

## Entrypoint y composición de proveedores
- `src/main.tsx` monta la aplicación en el nodo `#root` e importa los estilos globales de Tailwind (`src/index.css`).
- `src/App.tsx` orquesta los proveedores globales:
  - `QueryClientProvider` de **@tanstack/react-query** para preparar llamadas a APIs reactivas (aunque hoy no se consumen endpoints).
  - `TooltipProvider`, `Toaster` y `Sonner` de la librería de componentes shadcn-ui para habilitar tooltips y notificaciones.
  - `BrowserRouter` configura el enrutamiento declarativo de React Router.

Esta capa define dos rutas: la página principal (`/`, `Index.tsx`) y una página de 404 (`NotFound.tsx`). Todas las páginas futuras deben declararse aquí antes de la ruta comodín.

## Páginas principales
### `src/pages/Index.tsx`
- Administra el estado de apertura del *drawer* mediante `useState`.
- Renderiza el contenido hero y un `FloatingButton` que dispara la apertura del *drawer*.
- Inyecta el componente `NaviaDrawer`, pasándole:
  - `isOpen` para controlar la visibilidad.
  - `onClose` para cerrar y resetear estados.
  - `isNewUser` para determinar qué vista inicial mostrar (nuevo vs. recurrente).

### `src/pages/NotFound.tsx`
- Usa `useLocation` para registrar en consola intentos de navegación a rutas inexistentes.
- Muestra un mensaje simple con enlace de regreso al inicio.

## Componentes clave
### `FloatingButton`
- Componente fijo en la esquina inferior derecha animado con **framer-motion**.
- Expone la prop `onClick` para abrir el *drawer*.

### `NaviaDrawer`
- Responsabilidad: manejar transiciones del *drawer*, vistas internas y campo de entrada.
- Usa `AnimatePresence` y `motion.div` de framer-motion para animaciones de entrada/salida.
- Estado interno:
  - `currentView`: controla si se muestra la vista inicial (`"initial"`) o el detalle de una acción (`"action"`).
  - `selectedAction`: identifica la acción seleccionada por el usuario.
  - `inputValue`: refleja el texto ingresado en el campo inferior.
- Callbacks públicos:
  - `onClose`: recibido desde `Index`, permite cerrar el *drawer* y, tras 300 ms, resetea el estado interno.
- Renderiza un encabezado, el contenido variable y un pie con campo de texto y acciones (`Mic`, `Send`).

### Vistas del drawer (`src/components/drawer-views`)
- `NewUserView`: lista de acciones sugeridas para usuarios nuevos.
- `ReturningUserView`: lista adaptada a usuarios recurrentes.
- `ActionView`: muestra contenido contextual según la acción elegida. Se alimenta del diccionario `actionContent` que define título, descripción y CTA para cada acción.

Cada vista usa framer-motion para animaciones suaves y comunica al `NaviaDrawer` mediante callbacks (`onActionSelect`, `onBack`). La incorporación de nuevas acciones requiere añadir un objeto en `actionContent` y, si aplica, botones en las vistas iniciales.

## Librería de interfaz (`src/components/ui`)
El directorio contiene una colección de componentes reutilizables importados de **shadcn-ui**, tales como `button`, `dialog`, `toast`, etc. Aunque no todos se usan en la pantalla actual, conforman la base del sistema de diseño y pueden aprovecharse en nuevas vistas o flujos.

## Estilos y diseño
- `src/index.css` define los tokens de diseño en HSL: colores base, variantes para modo claro/oscuro, radios, etc. Estas variables alimentan las utilidades Tailwind (`bg-[hsl(var(--...))]`).
- `tailwind.config.ts` (no modificado en esta descripción) habilita la extracción de clases bajo `src/**/*.{ts,tsx}` y permite personalizar el tema según las variables anteriores.
- `App.css` contiene estilos heredados del boilerplate Vite; la UI actual se apoya principalmente en Tailwind.

## Hooks y utilidades
- `useIsMobile` (`src/hooks/use-mobile.tsx`): detecta si la ventana está por debajo de 768 px usando `matchMedia`. Útil para adaptar comportamientos del *drawer* en móviles.
- `cn` (`src/lib/utils.ts`): combina clases condicionales mezclando `clsx` y `tailwind-merge` para evitar conflictos.

## Flujo de interacción
1. El usuario aterriza en `/` y ve el hero informativo.
2. Al pulsar el `FloatingButton`, `isDrawerOpen` pasa a `true` y aparece el *drawer*.
3. `NaviaDrawer` muestra `NewUserView` o `ReturningUserView` según `isNewUser`.
4. Al seleccionar una acción, `handleActionSelect` cambia la vista a `ActionView`, donde se despliega contenido descriptivo y CTA.
5. El usuario puede volver con el botón "Volver" o cerrar el *drawer*, lo que resetea el estado.

## Extensibilidad
- **Nuevas acciones**: agregar entradas en `actionContent` y exponerlas desde las vistas iniciales.
- **Integración con APIs**: usar `react-query` (ya inicializado) para obtener información dinámica (ej. eventos reales) y mostrarla en `ActionView`.
- **Nuevas páginas**: definir componentes en `src/pages` y registrar rutas adicionales en `App.tsx` antes del comodín `*`.
- **Soporte multiusuario**: derivar `isNewUser` desde autenticación o contexto global.

Esta documentación sirve como guía para entender la estructura actual y como punto de partida para futuras iteraciones sobre la experiencia del asistente Navia.
