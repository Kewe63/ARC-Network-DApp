import { createContext, useContext, useState } from 'react'
import { tr, en, zh, ja, hi, ru, pt, es, de, fr, ar } from './strings'

const langs = { tr, en, zh, ja, hi, ru, pt, es, de, fr, ar }

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState('tr')
  const t = (key, vars = {}) => {
    let str = langs[lang][key] ?? key
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
