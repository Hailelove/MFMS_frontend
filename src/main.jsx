import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./main.css";
import App from "./App.jsx";
// import "./App.css";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
