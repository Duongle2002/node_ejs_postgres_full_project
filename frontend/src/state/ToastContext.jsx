import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

let idCounter = 1

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, opts = {}) => {
    const id = idCounter++
    const toast = { id, message, type: opts.type || 'info', timeout: opts.timeout ?? 3500 }
    setToasts(t => [...t, toast])
    if (toast.timeout > 0) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id))
      }, toast.timeout)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}
               onClick={() => removeToast(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
