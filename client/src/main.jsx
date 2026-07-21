import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ThemeModeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import App from "./App.jsx";


createRoot(document.getElementById("root")).render(

  <StrictMode>

    <ThemeModeProvider>

      <LanguageProvider>

        <AuthProvider>

          <App />

        </AuthProvider>

      </LanguageProvider>

    </ThemeModeProvider>

  </StrictMode>

);