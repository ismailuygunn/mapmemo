'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('dark')

    useEffect(() => {
        const saved = localStorage.getItem('umae-theme') || 'dark'
        setThemeState(saved)
        document.documentElement.setAttribute('data-theme', saved)
    }, [])

    const setTheme = (newTheme) => {
        setThemeState(newTheme)
        localStorage.setItem('umae-theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
