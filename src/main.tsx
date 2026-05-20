import App from "./App";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
