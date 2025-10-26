import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Allow mounting on an alternate element so the bundle can be embedded into another page.
const mountPoint =
  document.getElementById("navia-root") ?? document.getElementById("root");

if (!mountPoint) {
  throw new Error("Unable to locate mount point for Navia application.");
}

createRoot(mountPoint).render(<App />);
