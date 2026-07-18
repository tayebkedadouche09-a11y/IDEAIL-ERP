import { createContext, useContext, useState } from "react";

import ar from "../locales/ar";
import fr from "../locales/fr";


const LanguageContext = createContext();


export function LanguageProvider({ children }) {


  const [language, setLanguage] = useState("fr");


  const translations = {
    ar,
    fr
  };


  function changeLanguage(lang){

    setLanguage(lang);

  }


  return (

    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t: translations[language]
      }}
    >

      {children}

    </LanguageContext.Provider>

  );

}



export function useLanguage(){

  return useContext(LanguageContext);

}