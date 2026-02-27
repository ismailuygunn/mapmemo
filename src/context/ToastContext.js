'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext({})

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = ++toastId
        // Defensive: if message is an object, extract string from it
        const msg = (typeof message === 'object' && message !== null)
            ? (message.description || message.title || message.message || JSON.stringify(message))
            : String(message || '')
        setToasts(prev => [...prev, { id, message: msg, type: typeof message === 'object' && message.type ? message.type : type }])
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // toast function with convenience methods
    const toastFn = Object.assign(
        (msg, type) => addToast(msg, type),
        {
            success: (msg) => addToast(msg, 'success'),
            error: (msg) => addToast(msg, 'error', 5000),
            info: (msg) => addToast(msg, 'info'),
        }
    )

    const icons = {
        success: <CheckCircle2 size={18} />,
        error: <XCircle size={18} />,
        info: <Info size={18} />,
    }

    return (
        <ToastContext.Provider value={{ toast: toastFn }}>
            {children}

            {/* Toast Container */}
            <div className="toast-container">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            className={`toast toast-${t.type}`}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            layout
                        >
                            <span className={`toast-icon toast-icon-${t.type}`}>
                                {icons[t.type]}
                            </span>
                            <span className="toast-message">{t.message}</span>
                            <button
                                className="toast-close"
                                onClick={() => removeToast(t.id)}
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)
