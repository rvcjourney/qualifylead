import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ROLES = [
  { label: 'User Form',    path: '/',      icon: 'person' },
  { label: 'Admin Panel',  path: '/admin', icon: 'admin_panel_settings' },
]

const MI = ({ n, s = 18, style: sx = {} }) => (
  <span className="material-icons" style={{ fontSize: s, verticalAlign: 'middle', lineHeight: 1, ...sx }}>{n}</span>
)

export default function AppHeader({ onMenuToggle }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [open, setOpen] = useState(false)
  const dropRef    = useRef(null)

  const current = ROLES.find(r => r.path === location.pathname) || ROLES[0]

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav
      className="navbar px-3 px-md-4 d-flex align-items-center gap-2"
      style={{
        height: '56px',
        background: '#0f0a1a',
        borderBottom: '1px solid #2d1b3d',
        flexShrink: 0,
      }}
    >
      {/* Brand — always visible */}
      <span className="navbar-brand mb-0 h1 d-flex align-items-center gap-2 me-auto" style={{ fontSize: '17px' }}>
        <div
          className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
          style={{ width: 28, height: 28, background: '#c026d3', fontSize: 13 }}
        >
          Q
        </div>
        <span style={{ color: '#f1f5f9', fontWeight: 700, letterSpacing: '.01em' }}>
          QualifyLead
        </span>
      </span>

      {/* Role dropdown */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="d-flex align-items-center gap-2 fw-semibold"
          style={{
            background: open ? '#c026d3' : '#1a0d24',
            border: `1.5px solid ${open ? '#c026d3' : '#2d1b3d'}`,
            borderRadius: 20,
            padding: '5px 12px 5px 10px',
            color: '#f1f5f9',
            cursor: 'pointer',
            fontSize: 13,
            whiteSpace: 'nowrap',
            transition: 'all .15s',
          }}
        >
          <MI n={current.icon} s={15} />
          <span>{current.label}</span>
          <MI n={open ? 'expand_less' : 'expand_more'} s={16} />
        </button>

        {open && (
          <div
            className="rounded-3 overflow-hidden"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 160,
              background: '#1a0d24',
              border: '1px solid #2d1b3d',
              boxShadow: '0 8px 24px rgba(0,0,0,.5)',
              zIndex: 2000,
            }}
          >
            {ROLES.map(r => {
              const active = r.path === location.pathname
              return (
                <button
                  key={r.path}
                  className="w-100 border-0 d-flex align-items-center gap-2 px-3 py-3 fw-semibold"
                  style={{
                    background: active ? '#c026d344' : 'transparent',
                    color: active ? '#e879f9' : '#94a3b8',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderLeft: `3px solid ${active ? '#c026d3' : 'transparent'}`,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#2d1b3d' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { navigate(r.path); setOpen(false) }}
                >
                  <MI n={r.icon} s={16} />
                  {r.label}
                  {active && <MI n="check" s={14} style={{ marginLeft: 'auto', color: '#c026d3' }} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Hamburger — top-right, mobile only */}
      {onMenuToggle && (
        <button
          className="btn border-0 p-1 d-md-none"
          onClick={onMenuToggle}
          style={{ color: '#94a3b8', lineHeight: 1 }}
          aria-label="Open menu"
        >
          <MI n="menu" s={24} />
        </button>
      )}
    </nav>
  )
}
