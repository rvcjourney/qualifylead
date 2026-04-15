import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/AppHeader'
import Toast from '../components/Toast'
import FieldCard from '../components/FieldCard'
import { ADMIN_PASSWORD } from '../lib/adminConfig'

// ── Material Icon helper ───────────────────────────────────
const MI = ({ n, s = 20, style: sx = {} }) => (
  <span className="material-icons" style={{ fontSize: s, verticalAlign: 'middle', lineHeight: 1, ...sx }}>{n}</span>
)

// ── Helpers ────────────────────────────────────────────────
const AVATAR_PALETTE = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#db2777']


function avatarColor(id) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Avatar circle ──────────────────────────────────────────
function Avatar({ name, id, size = 36, fontSize = 13 }) {
  const bg = avatarColor(id)
  return (
    <div
      className="d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 rounded-2"
      style={{ width: size, height: size, background: bg, fontSize }}
    >
      {initials(name)}
    </div>
  )
}

// ── Section label ──────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      className="fw-semibold mb-3"
      style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8' }}
    >
      {children}
    </div>
  )
}

// ── Stat box ───────────────────────────────────────────────
function StatBox({ value, label, color, border }) {
  return (
    <div
      className="flex-grow-1 p-3 text-center"
      style={{ borderRight: border ? '1px solid #f1f5f9' : 'none' }}
    >
      <div className="fw-bold" style={{ fontSize: '22px', lineHeight: 1, color }}>
        {value}
      </div>
      <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
        {label}
      </div>
    </div>
  )
}

// ── Password Gate ──────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw,    setPw]    = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef          = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) {
      onAuth()
    } else {
      setError(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 600)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      <AppHeader />
      <div
        className="d-flex align-items-center justify-content-center min-vh-100"
        style={{ background: '#0f0a1a' }}
      >
        <div
          className="rounded-4 p-4 p-md-5"
          style={{
            background: '#1a0d24',
            border: '1px solid #2d1b3d',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            width: '100%',
            maxWidth: '380px',
          }}
        >
          {/* Icon */}
          <div className="text-center mb-4">
            <div
              className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 56, height: 56, background: '#c026d322', border: '1px solid #c026d344' }}
            >
              <MI n="admin_panel_settings" s={28} style={{ color: '#c026d3' }} />
            </div>
            <div className="fw-bold text-white" style={{ fontSize: 20 }}>Admin Access</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Enter the 8-digit admin password</div>
          </div>

          {/* Input */}
          <div className={shake ? 'animate-shake' : ''} style={{ marginBottom: 16 }}>
            <input
              ref={inputRef}
              type="password"
              maxLength={8}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              onKeyDown={e => e.key === 'Enter' && pw.length === 8 && attempt()}
              placeholder="••••••••"
              className="form-control text-center fw-bold"
              style={{
                background: '#110818',
                border: `1.5px solid ${error ? '#dc2626' : '#2d1b3d'}`,
                color: '#f1f5f9',
                fontSize: 22,
                letterSpacing: '0.25em',
                borderRadius: 10,
                height: 52,
                boxShadow: error ? '0 0 0 3px #dc262633' : 'none',
                transition: 'border-color .15s, box-shadow .15s',
              }}
            />
            {error && (
              <div className="text-center mt-2" style={{ fontSize: 13, color: '#ef4444' }}>
                <MI n="error_outline" s={14} style={{ marginRight: 4 }} />
                Incorrect password. Try again.
              </div>
            )}
          </div>

          {/* Button */}
          <button
            className="btn w-100 fw-semibold text-white"
            style={{
              background: pw.length === 8 ? '#c026d3' : '#2d1b3d',
              border: 'none',
              borderRadius: 10,
              height: 44,
              fontSize: 15,
              transition: 'background .2s',
              cursor: pw.length === 8 ? 'pointer' : 'not-allowed',
            }}
            disabled={pw.length !== 8}
            onClick={attempt}
          >
            <MI n="lock_open" s={17} style={{ marginRight: 6 }} />
            Unlock Admin Panel
          </button>

          {/* Hint */}
          {/* <div className="text-center mt-3" style={{ fontSize: 11, color: '#334155' }}>
            Password is stored in <code style={{ color: '#7c3aed' }}>src/lib/adminConfig.js</code>
          </div> */}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.55s ease; }
      `}</style>
    </>
  )
}

// ── Main component ─────────────────────────────────────────
export default function AdminPage() {
  const [authed,           setAuthed]           = useState(false)
  const [companies,        setCompanies]        = useState([])
  const [currentCo,        setCurrentCo]        = useState(null)
  const [fields,           setFields]           = useState([])
  const [loadingFields,    setLoadingFields]    = useState(false)
  const [thresholdHot,     setThresholdHot]     = useState(80)
  const [thresholdWarm,    setThresholdWarm]    = useState(60)
  const [savingThresholds, setSavingThresholds] = useState(false)
  const [toast,            setToast]            = useState({ show: false, message: '', type: 'success' })

  // Create-company form
  const [cId,    setCId]    = useState('')
  const [cName,  setCName]  = useState('')
  const [saving, setSaving] = useState(false)

  // Sidebar tab
  const [activeTab,    setActiveTab]    = useState('companies')  // 'companies' | 'lookup'
  const [sidebarOpen,  setSidebarOpen]  = useState(false)

  // Company search
  const [coSearch,     setCoSearch]     = useState('')
  const [coDropdown,   setCoDropdown]   = useState(false)

  // User lookup by email
  const [lookupEmail,   setLookupEmail]   = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResults, setLookupResults] = useState(null)   // null = not searched yet
  const [expandedId,    setExpandedId]    = useState(null)
  const [expandedRows,  setExpandedRows]  = useState({})

  // Unified search filters (sent to DB)
  const [searchCompany,  setSearchCompany]  = useState('')
  const [searchDateFrom, setSearchDateFrom] = useState('')
  const [searchDateTo,   setSearchDateTo]   = useState('')

  // Add-field form
  const [fName,       setFName]       = useState('')
  const [fType,       setFType]       = useState('text')
  const [fTypeOpen,   setFTypeOpen]   = useState(false)
  const [addingField, setAddingField] = useState(false)

  // Computed: sum of the highest score in each scored field (capped at 100)
  const { rawMaxPoints, maxPoints, overLimit } = useMemo(() => {
    const raw = fields.reduce((total, f) => {
      if (!f.options || f.options.length === 0) return total
      return total + Math.max(0, ...f.options.map(o => o.score ?? 0))
    }, 0)
    return { rawMaxPoints: raw, maxPoints: Math.min(100, raw), overLimit: raw > 100 }
  }, [fields])

  // ── Helpers ──────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
  }, [])

  // ── Load companies ───────────────────────────────────────
  const loadCompanies = useCallback(async () => {
    const { data, error } = await supabase
      .from('lead_qualify_companies')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) { showToast('Error loading companies', 'error'); return }
    setCompanies(data || [])
  }, [showToast])

  // ── Load fields + options ────────────────────────────────
  const loadFields = useCallback(async (company) => {
    if (!company) return
    setLoadingFields(true)
    const { data: rawFields, error } = await supabase
      .from('lead_qualify_fields')
      .select('*')
      .eq('company_id', company.company_id)
      .order('created_at', { ascending: true })

    if (error) { showToast('Error loading fields', 'error'); setLoadingFields(false); return }

    const enriched = await Promise.all(
      (rawFields || []).map(async f => {
        if (f.field_type === 'dropdown' || f.field_type === 'yes_no') {
          const { data: opts, error: optErr } = await supabase
            .from('lead_qualify_options').select('*')
            .eq('field_id', f.id).order('created_at', { ascending: true })
          if (optErr) return { ...f, options: [] }
          return { ...f, options: opts || [] }
        }
        return { ...f, options: [] }
      })
    )
    setFields(enriched)
    setLoadingFields(false)
  }, [showToast])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  // ── Select company ───────────────────────────────────────
  const selectCompany = useCallback((company) => {
    setCurrentCo(company)
    setThresholdHot(company.threshold_hot ?? 80)
    setThresholdWarm(company.threshold_warm ?? 60)
    loadFields(company)
  }, [loadFields])

  // ── Create company ───────────────────────────────────────
  const createCompany = async (e) => {
    e.preventDefault()
    const id = cId.trim()
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      showToast('Company ID: letters and numbers only (no spaces or special characters)', 'error')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('lead_qualify_companies')
      .insert({ company_id: id, company_name: cName.trim() })
      .select().single()
    setSaving(false)
    if (error) {
      showToast(error.code === '23505' ? 'Company ID already exists.' : error.message, 'error')
      return
    }
    setCId(''); setCName('')
    showToast('Company created!')
    await loadCompanies()
    selectCompany(data)
  }

  // ── Save thresholds ──────────────────────────────────────
  const saveThresholds = async () => {
    if (thresholdHot <= thresholdWarm) {
      showToast('Hot threshold must be higher than Warm threshold.', 'error')
      return
    }
    setSavingThresholds(true)
    const { error } = await supabase
      .from('lead_qualify_companies')
      .update({ threshold_hot: thresholdHot, threshold_warm: thresholdWarm })
      .eq('company_id', currentCo.company_id)
    setSavingThresholds(false)
    if (error) { showToast(error.message, 'error'); return }
    setCurrentCo(co => ({ ...co, threshold_hot: thresholdHot, threshold_warm: thresholdWarm }))
    showToast('Thresholds saved!')
  }

  // ── Add field ────────────────────────────────────────────
  const addField = async (e) => {
    e.preventDefault()
    if (!fName.trim()) return
    setAddingField(true)
    const { data: newField, error } = await supabase
      .from('lead_qualify_fields')
      .insert({ company_id: currentCo.company_id, field_name: fName.trim(), field_type: fType, is_mandatory: true })
      .select().single()

    if (error) { showToast(error.message, 'error'); setAddingField(false); return }

    // Auto-create Yes / No for yes_no fields
    if (fType === 'yes_no') {
      await supabase.from('lead_qualify_options').insert([
        { field_id: newField.id, option_value: 'Yes', score: 0 },
        { field_id: newField.id, option_value: 'No',  score: 0 },
      ])
    }
    setAddingField(false)
    setFName(''); setFType('text')
    showToast('Field added!')
    loadFields(currentCo)
  }

  // ── Delete field ─────────────────────────────────────────
  const deleteField = async (fieldId) => {
    if (!window.confirm('Delete this field and all its options?')) return
    const { error } = await supabase.from('lead_qualify_fields').delete().eq('id', fieldId)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Field deleted.')
    loadFields(currentCo)
  }

  // ── Toggle mandatory ─────────────────────────────────────
  const toggleFieldMandatory = async (fieldId, isMandatory) => {
    const { error } = await supabase
      .from('lead_qualify_fields').update({ is_mandatory: isMandatory }).eq('id', fieldId)
    if (error) { showToast(error.message, 'error'); return }
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_mandatory: isMandatory } : f))
  }

  // ── Add option ───────────────────────────────────────────
  const addOption = async (fieldId, value, score) => {
    // Check if adding this score would push max beyond 100
    const currentFieldMax = fields.find(f => f.id === fieldId)
      ?.options?.reduce((m, o) => Math.max(m, o.score ?? 0), 0) ?? 0
    const otherMax = fields.reduce((total, f) => {
      if (f.id === fieldId || !f.options?.length) return total
      return total + Math.max(0, ...f.options.map(o => o.score ?? 0))
    }, 0)
    const newFieldMax = Math.max(currentFieldMax, score)
    if (otherMax + newFieldMax > 100) {
      showToast(`Adding this score (${score} pts) would push the max total to ${otherMax + newFieldMax} pts — exceeds 100.`, 'error')
      return
    }
    const { error } = await supabase.from('lead_qualify_options')
      .insert({ field_id: fieldId, option_value: value, score })
    if (error) { showToast(error.message, 'error'); return }
    showToast('Option added!')
    loadFields(currentCo)
  }

  // ── Update option score (inline edit) ───────────────────
  const updateOption = async (optionId, score) => {
    // Check if new score would push max beyond 100
    const parentField = fields.find(f => f.options?.some(o => o.id === optionId))
    if (parentField) {
      const otherFieldsMax = fields.reduce((total, f) => {
        if (f.id === parentField.id || !f.options?.length) return total
        return total + Math.max(0, ...f.options.map(o => o.score ?? 0))
      }, 0)
      const newFieldMax = Math.max(
        score,
        ...parentField.options.filter(o => o.id !== optionId).map(o => o.score ?? 0)
      )
      if (otherFieldsMax + newFieldMax > 100) {
        showToast(`Score of ${score} pts would push the max total to ${otherFieldsMax + newFieldMax} pts — exceeds 100.`, 'error')
        return
      }
    }
    const { error } = await supabase.from('lead_qualify_options')
      .update({ score }).eq('id', optionId)
    if (error) { showToast(error.message, 'error'); return }
    // Optimistic local update — no full reload
    setFields(prev => prev.map(f => ({
      ...f,
      options: f.options?.map(o => o.id === optionId ? { ...o, score } : o),
    })))
  }

  // ── Delete option ────────────────────────────────────────
  const deleteOption = async (optionId) => {
    if (!window.confirm('Delete this option?')) return
    const { error } = await supabase.from('lead_qualify_options').delete().eq('id', optionId)
    if (error) { showToast(error.message, 'error'); return }
    loadFields(currentCo)
  }

  // ── User lookup (dynamic — email + company + date range) ─
  const handleLookup = async (e) => {
    e.preventDefault()
    const email   = lookupEmail.trim().toLowerCase()
    const company = searchCompany.trim()

    if (!email && !company && !searchDateFrom && !searchDateTo) {
      showToast('Enter at least one search field — email, company, or date', 'error')
      return
    }

    setLookupLoading(true)
    setLookupResults(null)
    setExpandedId(null)
    setExpandedRows({})

    let query = supabase
      .from('lead_qualify_lead_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (email)   query = query.eq('user_email', email)

    if (company) {
      const matchIds = companies
        .filter(c =>
          c.company_name.toLowerCase().includes(company.toLowerCase()) ||
          c.company_id.toLowerCase().includes(company.toLowerCase())
        )
        .map(c => c.company_id)

      if (matchIds.length === 0) {
        setLookupResults([])
        setLookupLoading(false)
        return
      }
      query = query.in('company_id', matchIds)
    }

    if (searchDateFrom) query = query.gte('created_at', searchDateFrom)
    if (searchDateTo)   query = query.lte('created_at', searchDateTo + 'T23:59:59.999Z')

    const { data, error } = await query
    setLookupLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setLookupResults(data || [])
  }

  const toggleExpand = async (submissionId) => {
    if (expandedId === submissionId) { setExpandedId(null); return }
    setExpandedId(submissionId)
    if (expandedRows[submissionId]) return   // already loaded
    const { data } = await supabase
      .from('lead_qualify_responses')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true })
    setExpandedRows(prev => ({ ...prev, [submissionId]: data || [] }))
  }

  // Results are already filtered at query time — just alias for render
  const filteredResults = lookupResults || []

  // ── Render ───────────────────────────────────────────────
  const accentCol = currentCo ? avatarColor(currentCo.company_id) : '#c026d3'

  // Magenta palette
  const M = {
    primary:   '#c026d3',
    dark:      '#a21caf',
    light:     '#fdf4ff',
    border:    '#f0abfc',
    sideBg:    '#110818',
    sidePanel: '#1a0d24',
    sideLine:  '#2d1b3d',
  }

  // filtered company list for search
  const coFiltered = coSearch.trim()
    ? companies.filter(c =>
        c.company_name.toLowerCase().includes(coSearch.toLowerCase()) ||
        c.company_id.toLowerCase().includes(coSearch.toLowerCase())
      )
    : companies

  const CAT = {
    'Hot Lead':  { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626', icon: 'local_fire_department' },
    'Warm Lead': { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', icon: 'device_thermostat' },
    'Cold Lead': { bg: '#fdf4ff', border: '#f0abfc', accent: '#c026d3', icon: 'ac_unit' },
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  return (
    <>
      <AppHeader onMenuToggle={() => setSidebarOpen(o => !o)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="d-md-none"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1040, top: 56 }}
        />
      )}

      <div className="container-fluid p-0 admin-layout">

        {/* ══════════════════════════ SIDEBAR ══════════════════════════ */}
        <aside
          className={`d-flex flex-column admin-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
          style={{ background: M.sideBg, borderRight: `1px solid ${M.sideLine}`, overflow: 'hidden' }}
        >

          {/* Logo strip */}
          <div
            className="px-4 py-3 d-flex align-items-center gap-2 flex-shrink-0"
            style={{ borderBottom: `1px solid ${M.sideLine}` }}
          >
          </div>

          {/* Tab pills */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="d-flex rounded-3 p-1" style={{ background: M.sidePanel }}>
              {[
                { key: 'companies', icon: 'business',     label: 'Companies' },
                { key: 'lookup',    icon: 'manage_search', label: 'User Lookup' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className="flex-grow-1 border-0 rounded-2 py-2 fw-semibold"
                  style={{
                    background:    activeTab === tab.key ? M.primary : 'transparent',
                    color:         activeTab === tab.key ? '#fff' : '#64748b',
                    fontSize:      11,
                    cursor:        'pointer',
                    transition:    'all .15s',
                    letterSpacing: '.02em',
                  }}
                  onClick={() => { setActiveTab(tab.key); setSidebarOpen(false) }}
                >
                  <MI n={tab.icon} s={14} style={{ marginRight: 4 }} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Companies tab ── */}
          {activeTab === 'companies' && (
            <div className="d-flex flex-column flex-grow-1 overflow-auto">

              {/* ── Searchable company picker ── */}
              <div className="px-3 pb-3" style={{ borderBottom: `1px solid ${M.sideLine}` }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: M.primary, textTransform: 'uppercase' }}>
                    Select Company
                  </div>
                  {/* Close sidebar — mobile only */}
                  <button
                    className="btn border-0 p-1 d-md-none"
                    onClick={() => setSidebarOpen(false)}
                    style={{ color: '#475569', lineHeight: 1 }}
                    aria-label="Close menu"
                  >
                    <MI n="close" s={20} />
                  </button>
                </div>

                {/* Search input */}
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                    color: '#475569', pointerEvents: 'none', lineHeight: 1,
                  }}><MI n="search" s={16} /></span>
                  <input
                    type="text"
                    className="form-control form-control-sm sidebar-input"
                    placeholder="Search name or ID…"
                    value={coSearch}
                    autoComplete="off"
                    onChange={e => { setCoSearch(e.target.value); setCoDropdown(true) }}
                    onFocus={() => setCoDropdown(true)}
                    onBlur={() => setTimeout(() => setCoDropdown(false), 150)}
                    style={{
                      background: M.sidePanel,
                      border: `1px solid ${coDropdown ? M.primary : M.sideLine}`,
                      color: '#ffffff',
                      fontSize: 12,
                      paddingLeft: 28,
                      borderRadius: 8,
                      boxShadow: coDropdown ? `0 0 0 2px ${M.primary}44` : 'none',
                      transition: 'all .15s',
                    }}
                  />
                </div>

                {/* Dropdown list */}
                {coDropdown && companies.length > 0 && (
                  <div
                    className="rounded-3 mt-1 overflow-auto"
                    style={{
                      background: '#1a0d24',
                      border: `1px solid ${M.primary}66`,
                      maxHeight: 240,
                      boxShadow: '0 8px 24px rgba(0,0,0,.4)',
                    }}
                  >
                    {coFiltered.length === 0 ? (
                      <div className="px-3 py-3 text-center fst-italic" style={{ fontSize: 12, color: '#475569' }}>
                        No match found
                      </div>
                    ) : coFiltered.map(c => {
                      const isActive = currentCo?.company_id === c.company_id
                      return (
                        <button
                          key={c.company_id}
                          className="w-100 border-0 text-start d-flex align-items-center gap-2 px-3 py-1"
                          style={{
                            background: isActive ? `${M.primary}22` : 'transparent',
                            cursor: 'pointer',
                            transition: 'background .1s',
                            borderLeft: isActive ? `3px solid ${M.primary}` : '3px solid transparent',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#2d1b3d' }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                          onMouseDown={() => {
                            selectCompany(c)
                            setCoSearch('')
                            setCoDropdown(false)
                            setSidebarOpen(false)
                          }}
                        >
                          <div
                            className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                            style={{ width: 24, height: 24, background: avatarColor(c.company_id), fontSize: 9 }}
                          >
                            {initials(c.company_name)}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-truncate fw-semibold" style={{ fontSize: 13, color: '#f1f5f9' }}>
                              {c.company_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                              {c.company_id}
                            </div>
                          </div>
                          {isActive && (
                            <span className="ms-auto" style={{ color: M.primary }}><MI n="check" s={14} /></span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Active company chip */}
                {currentCo && (
                  <div
                    className="d-flex align-items-center gap-2 mt-2 px-3 py-3 rounded-3"
                    style={{ background: `${M.primary}18`, border: `1px solid ${M.primary}55` }}
                  >
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 32, height: 32, background: accentCol, fontSize: 11 }}
                    >
                      {initials(currentCo.company_name)}
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                      <div style={{ fontSize: 10, color: M.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 1 }}>
                        Selected
                      </div>
                      <div className="text-truncate fw-semibold" style={{ fontSize: 13, color: '#f1f5f9' }}>
                        {currentCo.company_name}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {currentCo.company_id}
                      </div>
                    </div>
                    <div className="rounded-pill flex-shrink-0" style={{ width: 8, height: 8, background: '#22c55e' }} />
                  </div>
                )}
              </div>

              {/* ── New company form ── */}
              <div className="px-3 py-3">
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: M.primary, textTransform: 'uppercase', marginBottom: 12 }}>
                  + New Company
                </div>

                <form onSubmit={createCompany} className="d-flex flex-column gap-2">
                  {/* Company ID */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, display: 'block' }}>
                      Company ID
                    </label>
                    <input
                      className="form-control form-control-sm sidebar-input"
                      placeholder="e.g. 12345df"
                      value={cId}
                      onChange={e => setCId(e.target.value)}
                      required
                      style={{
                        background: M.sidePanel,
                        border: `1px solid ${M.sideLine}`,
                        color: '#e2e8f0',
                        fontSize: 13,
                        borderRadius: 8,
                        fontFamily: 'monospace',
                      }}
                    />
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                      Letters &amp; numbers only
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, display: 'block' }}>
                      Company Name
                    </label>
                    <input
                      className="form-control form-control-sm sidebar-input"
                      placeholder="e.g. MOTM Technologies"
                      value={cName}
                      onChange={e => setCName(e.target.value)}
                      required
                      style={{
                        background: M.sidePanel,
                        border: `1px solid ${M.sideLine}`,
                        color: '#ffffff',
                        fontSize: 13,
                        borderRadius: 8,
                      }}
                    />
                  </div>

                  <button
                    className="btn w-100 fw-semibold mt-1"
                    type="submit"
                    disabled={saving}
                    style={{ background: M.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, height: 38 }}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Creating…</>
                      : '+ Create Company'
                    }
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── User Lookup sidebar hint ── */}
          {activeTab === 'lookup' && (
            <div className="px-3 py-4 flex-grow-1 d-flex flex-column align-items-center justify-content-start">
              <div className="w-100 p-4 rounded-3 text-center" style={{ background: M.sidePanel, border: `1px solid ${M.sideLine}` }}>
                <div style={{ marginBottom: 10, color: M.primary }}><MI n="manage_search" s={36} /></div>
                <div className="fw-bold mb-1" style={{ fontSize: 13, color: '#e2e8f0' }}>User Lookup</div>
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
                  Search by email, company, date range, or any combination on the right
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ══════════════════════════ MAIN ══════════════════════════ */}
        <main
          className="admin-main"
          style={{ background: '#f8f0fc', padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 32px)' }}
        >

          {/* ════ USER LOOKUP PANEL ════ */}
          {activeTab === 'lookup' && (
            <div style={{ maxWidth: 820 }}>

              {/* Header */}
              <div className="mb-4">
                <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>User Lookup</h5>
                <p className="text-muted small mb-0">Search by email, company name / ID, date range, or any combination</p>
              </div>

              {/* ── Unified Search card ── */}
              <div
                className="bg-white rounded-4 mb-4 p-3 p-md-4"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,.08)' }}
              >
                <form onSubmit={handleLookup}>
                  <div className="row g-2 mb-3">

                    {/* Email */}
                    <div className="col-12 col-md-6">
                      <label className="form-label mb-1" style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Email
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', lineHeight: 1 }}>
                          <MI n="email" s={18} />
                        </span>
                        <input
                          type="email"
                          className="form-control ps-5"
                          placeholder="user@example.com"
                          value={lookupEmail}
                          onChange={e => setLookupEmail(e.target.value)}
                          style={{ fontSize: 13, borderColor: lookupEmail ? M.primary : '#e2e8f0', height: 44 }}
                        />
                      </div>
                    </div>

                    {/* Company Name / ID */}
                    <div className="col-12 col-md-6">
                      <label className="form-label mb-1" style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Company Name / ID
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', lineHeight: 1 }}>
                          <MI n="business" s={18} />
                        </span>
                        <input
                          type="text"
                          className="form-control ps-5"
                          placeholder="MOTM or motm_tech"
                          value={searchCompany}
                          onChange={e => setSearchCompany(e.target.value)}
                          style={{ fontSize: 13, borderColor: searchCompany ? M.primary : '#e2e8f0', height: 44 }}
                        />
                      </div>
                    </div>

                    {/* Date From */}
                    <div className="col-6">
                      <label className="form-label mb-1" style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Date From
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={searchDateFrom}
                        onChange={e => setSearchDateFrom(e.target.value)}
                        style={{ fontSize: 13, borderColor: searchDateFrom ? M.primary : '#e2e8f0', height: 44 }}
                      />
                    </div>

                    {/* Date To */}
                    <div className="col-6">
                      <label className="form-label mb-1" style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Date To
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={searchDateTo}
                        onChange={e => setSearchDateTo(e.target.value)}
                        style={{ fontSize: 13, borderColor: searchDateTo ? M.primary : '#e2e8f0', height: 44 }}
                      />
                    </div>

                  </div>

                  {/* Action row — always at bottom */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn fw-semibold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      type="submit"
                      disabled={lookupLoading || (!lookupEmail.trim() && !searchCompany.trim() && !searchDateFrom && !searchDateTo)}
                      style={{ background: M.primary, color: '#fff', border: 'none', borderRadius: 10, height: 46, fontSize: 14 }}
                    >
                      {lookupLoading
                        ? <><span className="spinner-border spinner-border-sm" role="status" />Searching…</>
                        : <><MI n="search" s={18} />Search</>
                      }
                    </button>
                    {(lookupEmail || searchCompany || searchDateFrom || searchDateTo) && (
                      <button
                        type="button"
                        className="btn d-flex align-items-center gap-1"
                        style={{ fontSize: 13, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, height: 46, whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setLookupEmail(''); setSearchCompany('')
                          setSearchDateFrom(''); setSearchDateTo('')
                          setLookupResults(null)
                        }}
                      >
                        <MI n="close" s={16} />Clear
                      </button>
                    )}
                  </div>

                  <p className="text-muted mt-2 mb-0" style={{ fontSize: 11 }}>
                    Search by email, company, date range, or any combination
                  </p>
                </form>
              </div>

              {/* Results */}
              {lookupResults === null ? (
                <div
                  className="text-center py-5 rounded-4"
                  style={{ background: '#fff', border: '1px dashed #cbd5e1', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}
                >
                  <div style={{ opacity: .3, color: '#64748b' }}><MI n="inbox" s={44} /></div>
                  <p className="text-muted small mt-2 mb-0">Fill in at least one field above and click Search</p>
                </div>
              ) : lookupResults.length === 0 ? (
                <div
                  className="text-center py-5 rounded-4"
                  style={{ background: '#fff', border: '1px solid #fecaca', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}
                >
                  <div style={{ color: '#fca5a5' }}><MI n="search_off" s={44} /></div>
                  <p className="fw-semibold mt-2 mb-1" style={{ color: '#0f172a' }}>No submissions found</p>
                  <p className="text-muted small mb-0">No records match your search criteria</p>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2 mb-3 px-1 flex-wrap">
                    <span className="fw-bold" style={{ fontSize: 13, color: '#0f172a' }}>
                      {filteredResults.length} submission{filteredResults.length !== 1 ? 's' : ''}
                    </span>
                    {lookupEmail && (
                      <span className="rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: M.light, color: M.primary, fontSize: 12 }}>
                        <MI n="email" s={13} />{lookupEmail}
                      </span>
                    )}
                    {searchCompany && (
                      <span className="rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: '#f0f9ff', color: '#0369a1', fontSize: 12 }}>
                        <MI n="business" s={13} />{searchCompany}
                      </span>
                    )}
                    {(searchDateFrom || searchDateTo) && (
                      <span className="rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1" style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12 }}>
                        <MI n="calendar_today" s={13} />{searchDateFrom || '…'} → {searchDateTo || '…'}
                      </span>
                    )}
                  </div>

                  {filteredResults.length === 0 ? (
                    <div
                      className="text-center py-5 rounded-4"
                      style={{ background: '#fff', border: '1px dashed #e2e8f0' }}
                    >
                      <div style={{ opacity: .4, color: '#94a3b8' }}><MI n="search_off" s={40} /></div>
                      <p className="text-muted small mt-2 mb-0">No submissions found for this search</p>
                    </div>
                  ) : filteredResults.map(row => {
                    const cc = CAT[row.category] || CAT['Cold Lead']
                    const isExpanded = expandedId === row.submission_id
                    const detailRows = expandedRows[row.submission_id]

                    return (
                      <div
                        key={row.submission_id}
                        className="mb-3 rounded-4 overflow-hidden"
                        style={{
                          background: '#fff',
                          border: `1px solid ${isExpanded ? cc.accent : '#e8edf3'}`,
                          boxShadow: isExpanded ? `0 4px 20px ${cc.accent}22` : '0 1px 6px rgba(0,0,0,.06)',
                          transition: 'all .15s',
                        }}
                      >
                        {/* Left accent bar */}
                        <div className="d-flex">
                          <div style={{ width: 4, background: cc.accent, flexShrink: 0 }} />
                          <div className="flex-grow-1">

                            {/* Summary row */}
                            <button
                              className="w-100 border-0 d-flex align-items-center gap-3 px-4 py-3 text-start"
                              style={{ background: 'transparent', cursor: 'pointer' }}
                              onClick={() => toggleExpand(row.submission_id)}
                            >
                              {/* Category pill */}
                              <span
                                className="rounded-pill px-3 py-1 fw-bold flex-shrink-0 d-flex align-items-center gap-1"
                                style={{ background: cc.accent, color: '#fff', fontSize: 11, whiteSpace: 'nowrap' }}
                              >
                                <MI n={cc.icon} s={13} />{row.category}
                              </span>

                              <div className="flex-grow-1 overflow-hidden">
                                <div className="fw-semibold text-truncate" style={{ fontSize: 14, color: '#0f172a' }}>
                                  {companies.find(c => c.company_id === row.company_id)?.company_name || row.company_id}
                                  <span className="ms-2 fw-normal" style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                                    {row.company_id}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                  {row.user_email && (
                                    <span className="d-flex align-items-center gap-1" style={{ fontSize: 11, color: '#c026d3', fontWeight: 500 }}>
                                      <MI n="email" s={12} />{row.user_email}
                                    </span>
                                  )}
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                    {new Date(row.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Score ring */}
                              <div
                                className="d-flex flex-column align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                  width: 52, height: 52,
                                  border: `3px solid ${cc.accent}`,
                                  background: cc.bg,
                                }}
                              >
                                <div className="fw-bold" style={{ fontSize: 16, color: cc.accent, lineHeight: 1 }}>
                                  {row.total_score}
                                </div>
                                <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '.04em' }}>PTS</div>
                              </div>

                              <span style={{ color: '#cbd5e1', flexShrink: 0 }}>
                                <MI n={isExpanded ? 'expand_less' : 'expand_more'} s={20} />
                              </span>
                            </button>

                            {/* Expanded detail */}
                            {isExpanded && (
                              <div
                                className="px-3 px-md-4 pb-3 pb-md-4"
                                style={{ borderTop: `1px solid ${cc.accent}22` }}
                              >
                                {!detailRows ? (
                                  <div className="text-center py-3 text-muted small">
                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                    Loading responses…
                                  </div>
                                ) : detailRows.length === 0 ? (
                                  <p className="text-muted small fst-italic mb-0 mt-3">No field responses recorded.</p>
                                ) : (
                                  <div className="mt-3">
                                    {detailRows.map(r => (
                                      <div
                                        key={r.id}
                                        className="d-flex align-items-start justify-content-between gap-2 py-2"
                                        style={{ borderBottom: '1px solid #f8fafc', fontSize: 13 }}
                                      >
                                        <div className="flex-grow-1">
                                          <div className="fw-medium" style={{ color: '#1e293b' }}>{r.field_name}</div>
                                          <div style={{ color: '#64748b', fontSize: 12 }}>{r.value || '—'}</div>
                                        </div>
                                        <span
                                          className="fw-bold flex-shrink-0"
                                          style={{ fontSize: 13, color: (r.score || 0) > 0 ? '#059669' : '#94a3b8' }}
                                        >
                                          +{r.score || 0} pts
                                        </span>
                                      </div>
                                    ))}
                                    <div
                                      className="d-flex justify-content-end pt-2 fw-bold"
                                      style={{ fontSize: 13, color: cc.accent }}
                                    >
                                      Total: {row.total_score} pts
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* ════ COMPANIES PANEL ════ */}
          {activeTab === 'companies' && (!currentCo ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
              <div
                className="rounded-4 d-flex align-items-center justify-content-center mb-4"
                style={{ width: 88, height: 88, background: '#e2e8f0', color: '#94a3b8' }}
              >
                <MI n="business" s={44} />
              </div>
              <h5 className="fw-bold mb-2" style={{ color: '#0f172a' }}>No Company Selected</h5>
              <p className="text-muted small mb-0" style={{ maxWidth: 300 }}>
                Choose a company from the dropdown in the sidebar, or create a new one to get started.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 820 }}>

              {/* ── Company banner ── */}
              <div
                className="rounded-4 mb-4 overflow-hidden"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,.13)' }}
              >
                <div
                  className="d-flex align-items-center gap-4 px-5 py-4"
                  style={{ background: `linear-gradient(130deg, ${accentCol} 0%, ${accentCol}cc 100%)` }}
                >
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 60, height: 60, background: 'rgba(255,255,255,.18)', fontSize: 24, letterSpacing: '.02em' }}
                  >
                    {initials(currentCo.company_name)}
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="mb-1 fw-bold text-white" style={{ fontSize: 22 }}>{currentCo.company_name}</h4>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="rounded-pill px-2 py-0 fw-semibold"
                        style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: 11, fontFamily: 'monospace' }}
                      >
                        {currentCo.company_id}
                      </span>
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      Max Score
                    </div>
                    <div className="fw-bold text-white d-flex align-items-center justify-content-end gap-1" style={{ fontSize: 40, lineHeight: 1.1 }}>
                      {maxPoints}
                      {overLimit && (
                        <span title={`Configured scores total ${rawMaxPoints} pts — capped at 100`}>
                          <MI n="warning" s={20} style={{ color: '#fde68a', verticalAlign: 'middle' }} />
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>
                      {overLimit ? `of 100 (configured: ${rawMaxPoints})` : 'points'}
                    </div>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="d-flex bg-white">
                  {[
                    { value: fields.length, label: 'Form Fields',       color: '#1e293b', icon: 'list_alt' },
                    { value: `≥ ${thresholdHot}`,  label: 'Hot Lead Threshold',  color: '#dc2626', icon: 'local_fire_department' },
                    { value: `≥ ${thresholdWarm}`, label: 'Warm Lead Threshold', color: '#d97706', icon: 'device_thermostat' },
                  ].map((s, i, arr) => (
                    <div
                      key={i}
                      className="flex-grow-1 px-4 py-3 d-flex align-items-center gap-3"
                      style={{ borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      <MI n={s.icon} s={22} style={{ color: s.color }} />
                      <div>
                        <div className="fw-bold" style={{ fontSize: 20, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Thresholds ── */}
              <div
                className="bg-white rounded-4 mb-4"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,.07)', overflow: 'hidden' }}
              >
                <div className="d-flex align-items-center px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div className="fw-bold" style={{ fontSize: 15, color: '#0f172a' }}>Scoring Thresholds</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Minimum score required to qualify for each category</div>
                  </div>
                  <button
                    className="btn fw-semibold ms-auto px-4"
                    onClick={saveThresholds}
                    disabled={savingThresholds}
                    style={{ background: M.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13 }}
                  >
                    {savingThresholds
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Saving…</>
                      : 'Save Thresholds'
                    }
                  </button>
                </div>

                <div className="px-5 py-4">
                  <div className="row g-3">
                    {/* Hot */}
                    <div className="col-md-4">
                      <div className="rounded-3 p-3 h-100" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <MI n="local_fire_department" s={22} style={{ color: '#dc2626' }} />
                          <span className="fw-bold text-danger" style={{ fontSize: 13 }}>Hot Lead</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted fw-semibold">≥</span>
                          <input
                            type="number"
                            className="form-control form-control-sm text-center fw-bold"
                            value={thresholdHot}
                            min="1"
                            onChange={e => setThresholdHot(Number(e.target.value))}
                            style={{ borderColor: '#fca5a5', color: '#dc2626', fontSize: 18, width: 80, borderRadius: 8 }}
                          />
                          <span className="text-muted small">pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Warm */}
                    <div className="col-md-4">
                      <div className="rounded-3 p-3 h-100" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <MI n="device_thermostat" s={22} style={{ color: '#d97706' }} />
                          <span className="fw-bold" style={{ fontSize: 13, color: '#d97706' }}>Warm Lead</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted fw-semibold">≥</span>
                          <input
                            type="number"
                            className="form-control form-control-sm text-center fw-bold"
                            value={thresholdWarm}
                            min="1"
                            onChange={e => setThresholdWarm(Number(e.target.value))}
                            style={{ borderColor: '#fcd34d', color: '#d97706', fontSize: 18, width: 80, borderRadius: 8 }}
                          />
                          <span className="text-muted small">pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Cold — read-only */}
                    <div className="col-md-4">
                      <div className="rounded-3 p-3 h-100" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <MI n="ac_unit" s={22} style={{ color: '#2563eb' }} />
                          <span className="fw-bold text-primary" style={{ fontSize: 13 }}>Cold Lead</span>
                          <span
                            className="ms-auto rounded-pill px-2"
                            style={{ background: '#dbeafe', color: '#2563eb', fontSize: 10, fontWeight: 600 }}
                          >
                            auto
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted fw-semibold">&lt;</span>
                          <div
                            className="fw-bold text-primary text-center"
                            style={{ fontSize: 22, width: 80, lineHeight: '32px' }}
                          >
                            {thresholdWarm}
                          </div>
                          <span className="text-muted small">pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Form Fields ── */}
              <div
                className="bg-white rounded-4"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,.07)' }}
              >
                {/* Header */}
                <div
                  className="d-flex align-items-center px-5 py-3"
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <div>
                    <div className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: 15, color: '#0f172a' }}>
                      Form Fields
                      <span
                        className="rounded-pill px-2"
                        style={{ background: M.light, color: M.primary, fontSize: 11, fontWeight: 700 }}
                      >
                        {fields.length}
                      </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Build and configure qualification questions</div>
                  </div>
                </div>

                <div className="px-5 py-4">

                  {/* Field list */}
                  {loadingFields ? (
                    <div className="d-flex align-items-center gap-2 text-muted py-4 justify-content-center">
                      <div className="spinner-border spinner-border-sm" role="status" />
                      <span className="small">Loading fields…</span>
                    </div>
                  ) : fields.length === 0 ? (
                    <div
                      className="text-center py-5 rounded-3 mb-4"
                      style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}
                    >
                      <div style={{ opacity: .4, color: '#94a3b8' }}><MI n="list_alt" s={40} /></div>
                      <div className="text-muted small mt-2">No fields yet — add your first one below.</div>
                    </div>
                  ) : (
                    fields.map(f => (
                      <FieldCard
                        key={f.id}
                        field={f}
                        onDelete={deleteField}
                        onOptionAdd={addOption}
                        onOptionDelete={deleteOption}
                        onToggleMandatory={toggleFieldMandatory}
                        onUpdateScore={updateOption}
                      />
                    ))
                  )}

                  {/* ── Add field ── */}
                  <div
                    className="rounded-3 p-4"
                    style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}
                  >
                    <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b' }}>
                      <span style={{ fontSize: 14 }}>➕</span> Add New Field
                    </div>
                    <form onSubmit={addField}>
                      {(() => {
                        const FIELD_TYPES = [
                          { value: 'text',     icon: 'notes',        label: 'Text' },
                          { value: 'number',   icon: 'pin',          label: 'Number' },
                          { value: 'dropdown', icon: 'list',         label: 'Dropdown' },
                          { value: 'yes_no',   icon: 'check_circle', label: 'Yes / No' },
                        ]
                        const activeType = FIELD_TYPES.find(t => t.value === fType)
                        return (
                          <div className="d-flex flex-column gap-2">

                            {/* Row 1 — Field Name (full width) */}
                            <div>
                              <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: 11 }}>Field Name</label>
                              <input
                                className="form-control"
                                placeholder="e.g. Employee Size, Industry…"
                                value={fName}
                                onChange={e => setFName(e.target.value)}
                                required
                                style={{ borderRadius: 8, fontSize: 14, height: 42 }}
                              />
                            </div>

                            {/* Row 2 — Field Type + Add Field button side by side */}
                            <div className="d-flex gap-2 align-items-end">

                            {/* Field Type — custom dropdown */}
                            <div className="flex-grow-1" style={{ position: 'relative' }}>
                              <label className="form-label small fw-semibold text-muted mb-1" style={{ fontSize: 11 }}>Field Type</label>
                              <button
                                type="button"
                                onClick={() => setFTypeOpen(o => !o)}
                                onBlur={() => setTimeout(() => setFTypeOpen(false), 150)}
                                className="d-flex align-items-center gap-2 fw-semibold"
                                style={{
                                  height: 42,
                                  padding: '0 12px',
                                  border: `1.5px solid ${fTypeOpen ? M.primary : '#e2e8f0'}`,
                                  borderRadius: 8,
                                  background: fTypeOpen ? M.light : '#fff',
                                  color: fTypeOpen ? M.primary : '#374151',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  minWidth: 140,
                                  boxShadow: fTypeOpen ? `0 0 0 3px ${M.border}` : 'none',
                                  transition: 'all .12s',
                                }}
                              >
                                <MI n={activeType.icon} s={16} style={{ color: M.primary }} />
                                {activeType.label}
                                <MI n="expand_more" s={18} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                              </button>

                              {fTypeOpen && (
                                <div
                                  className="rounded-3 overflow-hidden"
                                  style={{
                                    position: 'absolute',
                                    bottom: 'calc(100% + 4px)',
                                    left: 0,
                                    right: 0,
                                    background: '#fff',
                                    border: `1px solid ${M.border}`,
                                    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                                    zIndex: 999,
                                  }}
                                >
                                  {FIELD_TYPES.map(t => {
                                    const sel = fType === t.value
                                    return (
                                      <button
                                        key={t.value}
                                        type="button"
                                        onMouseDown={() => { setFType(t.value); setFTypeOpen(false) }}
                                        className="w-100 border-0 d-flex align-items-center gap-2 px-3 py-2 fw-medium"
                                        style={{
                                          background: sel ? M.light : '#fff',
                                          color: sel ? M.primary : '#374151',
                                          fontSize: 13,
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = '#fff' }}
                                      >
                                        <MI n={t.icon} s={16} style={{ color: sel ? M.primary : '#94a3b8' }} />
                                        {t.label}
                                        {sel && <MI n="check" s={14} style={{ marginLeft: 'auto', color: M.primary }} />}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Add button */}
                            <div style={{ flexShrink: 0 }}>
                              <button
                                className="btn fw-semibold"
                                type="submit"
                                disabled={addingField}
                                style={{ background: M.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, height: 42 }}
                              >
                                {addingField
                                  ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Adding…</>
                                  : 'Add Field'
                                }
                              </button>
                            </div>

                            </div>
                          </div>
                        )
                      })()}


                      {fType === 'yes_no' && (
                        <div
                          className="d-flex align-items-center gap-2 p-2 rounded-2 mt-3 small"
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
                        >
                          <MI n="info" s={16} />
                          <span>
                            <strong>Yes</strong> and <strong>No</strong> options are created automatically —
                            click their scores to edit them.
                          </span>
                        </div>
                      )}
                      {(fType === 'text' || fType === 'number') && (
                        <div
                          className="d-flex align-items-center gap-2 p-2 rounded-2 mt-3 small"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                        >
                          <MI n="info" s={16} />
                          <span>This field type is informational and does not affect the lead score.</span>
                        </div>
                      )}
                    </form>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </main>
      </div>

      <Toast {...toast} onClose={() => setToast(t => ({ ...t, show: false }))} />
    </>
  )
}
