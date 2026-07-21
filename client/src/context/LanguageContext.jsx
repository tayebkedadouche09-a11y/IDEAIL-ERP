import { createContext, useContext, useState, useEffect } from "react";

import ar from "../locales/ar";
import fr from "../locales/fr";
import en from "../locales/en";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("ideal_lang") || "fr";
  });

  const translations = {
    ar,
    fr,
    en
  };

  function changeLanguage(lang) {
    setLanguage(lang);
    localStorage.setItem("ideal_lang", lang);
  }

  // Apply RTL direction when Arabic is selected
  useEffect(() => {
    if (language === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  // Translation function - looks up key in current language, falls back to key
  function t(key) {
    const currentTranslations = translations[language] || translations.fr;
    return currentTranslations[key] || key;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}