import React from 'react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel' }){
  if (!open) return null
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        {title && <h3>{title}</h3>}
        <p style={{color:'var(--muted)'}}>{message}</p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          <button className="btn secondary" onClick={onCancel}>{cancelText}</button>
          <button className="btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
