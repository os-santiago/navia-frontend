# Navia Web App

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb?style=flat-square)
![Pruebas](https://img.shields.io/badge/tests-node--test-blue?style=flat-square)

Interfaz web de Navia, el asistente que ayuda a usuarios a descubrir y navegar eventos mediante una experiencia conversacional soportada en un drawer interactivo.

## Vision general

- Boton flotante siempre visible que activa el drawer de Navia.
- Flujos diferenciados para primera visita y usuarios recurrentes.
- Acciones guiadas con contenido dinamico y pistas contextuales para cada consulta.
- Animaciones con framer-motion para brindar una experiencia fluida.
- Integracion lista para consultas asincronas mediante React Query.

## Stack principal

- Vite + React 18 + TypeScript.
- Tailwind CSS y componentes shadcn UI para el sistema visual.
- framer-motion para animaciones y transiciones.
- React Router para enrutamiento y vistas.
- TanStack Query para manejo futuro de datos remotos.

## Requisitos previos

- Node.js 20+ y npm 10+ (recomendado gestionar con [nvm](https://github.com/nvm-sh/nvm)).
- Acceso al repositorio y permisos de lectura.
- Opcional: bun instalado si prefieres su gestor, aunque los comandos documentados usan npm.

## Instalacion

```bash
git clone <url-del-repo>
cd navia-frontend
npm install
```

Si trabajas con bun:

```bash
bun install
```

## Desarrollo local

```bash
npm run dev
```

Esto levanta Vite con recarga en caliente (por defecto en http://localhost:5173). El codigo fuente principal vive en `src/`, con `src/pages/Index.tsx` como punto de entrada de la experiencia y componentes compartidos dentro de `src/components/`.

### Scripts utiles

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con Vite y HMR. |
| `npm run build` | Compilacion de produccion optimizada. |
| `npm run build:dev` | Compilacion en modo development para depurar bundle. |
| `npm run preview` | Sirve el build generado para pruebas manuales. |

## Pruebas y calidad

- `npm run lint`: analiza el repositorio con ESLint.
- `npm run typecheck`: valida los tipos con TypeScript sin emitir codigo.
- `npm run test`: ejecuta las suites unitarias (`tests/unit/*.mjs`) y funcionales (`tests/functional/*.mjs`) usando node test.
- `npm run test:unit`: solo pruebas unitarias.
- `npm run test:functional`: solo pruebas funcionales.

Se recomienda correr `lint`, `typecheck` y `test` antes de abrir un pull request.

## Estructura del proyecto

```
src/
  components/        // UI reutilizable, drawer de Navia y boton flotante
  pages/             // Vistas de la aplicacion (Index y NotFound)
  hooks/             // Hooks personalizados
  lib/               // Utilidades como helpers de estilos
```

`App.tsx` configura el arbol principal: React Router controla las rutas, TanStack Query prepara la cache y los proveedores de tooltips y toasts envuelven la experiencia.

## Flujo de trabajo sugerido

1. Crear una rama de feature o fix.
2. Implementar cambios y cubrirlos con pruebas cuando aplique.
3. Ejecutar `npm run lint && npm run typecheck && npm run test`.
4. Abrir pull request describiendo el impacto en la experiencia de Navia.

## Futuras mejoras propuestas

- Integrar fuentes reales de datos para las acciones del drawer.
- Conectar autenticacion para personalizar el flujo de usuarios recurrentes.
- Añadir pruebas e2e que cubran el drawer y las interacciones principales.

## Licencia

Este repositorio no declara una licencia publica. Consulta al equipo de Navia antes de compartir o reutilizar el codigo fuera de la organizacion.
