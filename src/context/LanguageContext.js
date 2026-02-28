'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '@/lib/i18n/translations'

const LanguageContext = createContext({})

const STORAGE_KEY = 'umae-lang'

export function LanguageProvider({ children }) {
    const [locale, setLocaleState] = useState('en')

    // Load saved language on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && translations[saved]) {
            setLocaleState(saved)
        } else {
            // Auto-detect browser language
            const browserLang = navigator.language?.toLowerCase()
            if (browserLang?.startsWith('tr')) {
                setLocaleState('tr')
                localStorage.setItem(STORAGE_KEY, 'tr')
            }
        }
    }, [])

    const setLocale = useCallback((lang) => {
        if (translations[lang]) {
            setLocaleState(lang)
            localStorage.setItem(STORAGE_KEY, lang)
        }
    }, [])

    // Translation function
    const t = useCallback((key) => {
        return translations[locale]?.[key] || translations['en']?.[key] || key
    }, [locale])

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => useContext(LanguageContext)
