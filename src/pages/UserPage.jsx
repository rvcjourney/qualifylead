import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/AppHeader'

// ── Magenta theme ──────────────────────────────────────────
const MG = '#c026d3'
const MG_LIGHT = '#fdf4ff'
const MG_BORDER = '#f0abfc'

// ── Category config ────────────────────────────────────────
const CATEGORY_CFG = {
  'Hot Lead':  { bg: 'danger',  textDark: false, icon: 'local_fire_department', desc: 'High-priority prospect — follow up immediately.' },
  'Warm Lead': { bg: 'warning', textDark: true,  icon: 'device_thermostat',    desc: 'Good potential — nurture with targeted content.' },
  'Cold Lead': { bg: 'primary', textDark: false, icon: 'ac_unit',              desc: 'Low priority — add to long-term nurture campaign.' },
}

// ── Material Icon helper ───────────────────────────────────
const MI = ({ n, s = 20, style: sx = {} }) => (
  <span className="material-icons" style={{ fontSize: s, verticalAlign: 'middle', lineHeight: 1, ...sx }}>{n}</span>
)

// ── Avatar helpers ─────────────────────────────────────────
const AVATAR_PALETTE = ['#c026d3', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#db2777']
function avatarColor(id) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}
function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Main component ─────────────────────────────────────────
export default function UserPage() {
  const [companies,      setCompanies]      = useState([])
  const [companyId,      setCompanyId]      = useState('')
  const [selectedCo,     setSelectedCo]     = useState(null)   // full company object
  const [searchQuery,    setSearchQuery]    = useState('')
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [formFields,     setFormFields]     = useState([])
  const [loadingForm,    setLoadingForm]    = useState(false)
  const [answers,        setAnswers]        = useState({})
  const [thresholds,     setThresholds]     = useState({ hot: 80, warm: 60 })
  const [userEmail,      setUserEmail]      = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [result,         setResult]         = useState(null)
  const [formError,      setFormError]      = useState('')
  const [notFound,       setNotFound]       = useState(false)

  const searchRef = useRef(null)

  // Load all companies on mount
  useEffect(() => {
    supabase
      .from('lead_qualify_companies')
      .select('*')
      .order('company_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setFormError('Failed to load companies. Please refresh.'); return }
        setCompanies(data || [])
      })
  }, [])

  // Filter companies by search query (name OR id, case-insensitive)
  // Returns empty array when nothing typed — dropdown only appears after typing
  const searchResults = searchQuery.trim()
    ? companies.filter(c => {
        const q = searchQuery.trim().toLowerCase()
        return (
          c.company_name.toLowerCase() === q ||
          c.company_id.toLowerCase() === q
        )
      })
    : []

  // When company is selected from dropdown
  const handleSelect = useCallback(async (company) => {
    setSelectedCo(company)
    setCompanyId(company.company_id)
    setSearchQuery('')
    setShowDropdown(false)
    setNotFound(false)
    setResult(null)
    setAnswers({})
    setUserEmail('')
    setFormError('')
    setFormFields([])

    setThresholds({
      hot:  company.threshold_hot  ?? 80,
      warm: company.threshold_warm ?? 60,
    })

    setLoadingForm(true)
    const { data: rawFields, error } = await supabase
      .from('lead_qualify_fields')
      .select('*')
      .eq('company_id', company.company_id)
      .order('created_at', { ascending: true })

    if (error) { setFormError('Error loading form.'); setLoadingForm(false); return }

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
    setFormFields(enriched)
    setLoadingForm(false)
  }, [])

  // Clear selected company
  const handleClear = () => {
    setSelectedCo(null)
    setCompanyId('')
    setSearchQuery('')
    setShowDropdown(false)
    setNotFound(false)
    setFormFields([])
    setUserEmail('')
    setAnswers({})
    setFormError('')
    setResult(null)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  // Check if no match when user presses Enter or blurs with text
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowDropdown(false)
      if (searchQuery.trim() && searchResults.length === 0) {
        setNotFound(true)
      } else {
        setNotFound(false)
      }
    }, 160)   // slight delay so dropdown click fires first
  }

  // Answer setter
  const setAnswer = (fieldId, patch) =>
    setAnswers(prev => ({ ...prev, [fieldId]: { ...(prev[fieldId] || {}), ...patch } }))

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const emailTrimmed = userEmail.trim().toLowerCase()
    if (!emailTrimmed) { setFormError('Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) { setFormError('Please enter a valid email address.'); return }
    if (formFields.length === 0) { setFormError('No form fields available.'); return }

    // Validate mandatory fields
    const missing = formFields.filter(f => {
      if (f.is_mandatory === false) return false
      const ans = answers[f.id]
      if (f.field_type === 'dropdown' || f.field_type === 'yes_no') return !ans?.value
      if (f.field_type === 'text' || f.field_type === 'number')     return !ans?.value?.toString().trim()
      return false
    })
    if (missing.length > 0) {
      setFormError(`Please complete: ${missing.map(f => f.field_name).join(', ')}`)
      return
    }

    let totalScore = 0
    const submissionId = crypto.randomUUID()

    const responses = formFields.map(f => {
      const ans   = answers[f.id] || {}
      const score = ans.score || 0
      totalScore += score
      return {
        submission_id:     submissionId,
        user_email:        emailTrimmed,
        lead_company_name: '',
        company_id:        companyId,
        field_id:          f.id,
        field_name:        f.field_name,
        value:             ans.value || '',
        score,
      }
    })

    const category =
      totalScore >= thresholds.hot  ? 'Hot Lead' :
      totalScore >= thresholds.warm ? 'Warm Lead' :
      'Cold Lead'

    setSubmitting(true)
    const { error: rErr } = await supabase.from('lead_qualify_responses').insert(responses)
    if (rErr) { setFormError('Error saving responses: ' + rErr.message); setSubmitting(false); return }

    const { error: sErr } = await supabase.from('lead_qualify_lead_scores').insert({
      submission_id:     submissionId,
      user_email:        emailTrimmed,
      lead_company_name: '',
      company_id:        companyId,
      total_score:       totalScore,
      category,
    })
    if (sErr) { setFormError('Error saving score: ' + sErr.message); setSubmitting(false); return }

    setSubmitting(false)
    setResult({
      userEmail: emailTrimmed,
      totalScore,
      category,
      thresholds,
      breakdown: formFields
        .filter(f => f.field_type === 'dropdown' || f.field_type === 'yes_no')
        .map(f => {
          const ans = answers[f.id] || {}
          return { fieldName: f.field_name, value: ans.value || '—', score: ans.score || 0 }
        }),
    })
  }

  const handleReset = () => {
    setResult(null)
    handleClear()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cfg = result ? (CATEGORY_CFG[result.category] || CATEGORY_CFG['Cold Lead']) : null
  const isRequired = (field) => field.is_mandatory !== false

  return (
    <>
      <AppHeader />

      <div className="py-3 py-md-5 min-vh-100" style={{ background: '#f8f0fc' }}>
        <div className="container px-3 px-md-4" style={{ maxWidth: '600px' }}>

          {/* ── STEP 1: Find Company ── */}
          <div
            className="bg-white rounded-4 mb-4"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,.07)', overflow: 'visible' }}
          >
            <div
              className="d-flex align-items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{ width: '26px', height: '26px', background: selectedCo ? '#059669' : MG, fontSize: '13px' }}
              >
                {selectedCo ? <MI n="check" s={14} /> : '1'}
              </div>
              <span className="fw-semibold" style={{ fontSize: '14px' }}>Find Company</span>
              {selectedCo && (
                <span className="ms-auto text-success small fw-medium">Company selected</span>
              )}
            </div>

            <div className="p-4">
              {/* ── Selected chip ── */}
              {selectedCo ? (
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-3"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{
                      width: '40px', height: '40px',
                      background: avatarColor(selectedCo.company_id),
                      fontSize: '14px',
                    }}
                  >
                    {initials(selectedCo.company_name)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      {selectedCo.company_name}
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>
                      {selectedCo.company_id}
                    </div>
                  </div>
                  <button
                    className="btn border-0 p-1 lh-1"
                    style={{ color: '#94a3b8', fontSize: '20px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    onClick={handleClear}
                    title="Change company"
                  >
                    ×
                  </button>
                </div>
              ) : (
                /* ── Search input + dropdown ── */
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute', left: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8', fontSize: '20px', pointerEvents: 'none',
                      }}
                    >
                      <MI n="search" s={20} />
                    </span>
                    <input
                      ref={searchRef}
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search by company name or ID…"
                      value={searchQuery}
                      autoComplete="off"
                      onChange={e => {
                        const val = e.target.value
                        setSearchQuery(val)
                        setShowDropdown(val.trim().length > 0)  // only open when there is text
                        setNotFound(false)
                      }}
                      onFocus={() => { if (searchQuery.trim()) setShowDropdown(true) }}
                      onBlur={handleSearchBlur}
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  {/* Not found message */}
                  {notFound && (
                    <div
                      className="d-flex align-items-center gap-2 mt-2 p-2 rounded-2 small"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                    >
                      <span>⚠️</span>
                      <span>
                        No company found for <strong>"{searchQuery}"</strong>.
                        Please check the ID or name and try again.
                      </span>
                    </div>
                  )}

                  {/* Dropdown results — only shown after user starts typing */}
                  {showDropdown && searchQuery.trim().length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0, right: 0,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                        zIndex: 100,
                        maxHeight: '260px',
                        overflowY: 'auto',
                      }}
                    >
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-muted small text-center fst-italic">
                          No companies match "{searchQuery}"
                        </div>
                      ) : (
                        searchResults.map(c => (
                          <button
                            key={c.company_id}
                            className="w-100 border-0 text-start d-flex align-items-center gap-3 px-3 py-2"
                            style={{ background: 'transparent', cursor: 'pointer', transition: 'background .1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onMouseDown={() => handleSelect(c)}  // mouseDown fires before blur
                          >
                            <div
                              className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                              style={{
                                width: '36px', height: '36px',
                                background: avatarColor(c.company_id),
                                fontSize: '13px',
                              }}
                            >
                              {initials(c.company_name)}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
                                {c.company_name}
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                {c.company_id}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 2: Form (no header) ── */}
          {companyId && !result && (
            <div
              className="bg-white rounded-4 mb-4"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}
            >
              <div className="p-4">
                {loadingForm ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading form…
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>

                    {/* Your email — always first */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                        Your Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. you@company.com"
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        style={{ fontSize: '14px' }}
                      />
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Used to track your submission history
                      </div>
                    </div>
                    <hr/>
                    {formFields.length === 0 && (
                      <p className="text-muted fst-italic small">No fields configured for this company yet.</p>
                    )}

                    {/* Dynamic fields */}
                    {formFields.map(field => (
                      <div key={field.id} className="mb-4">
                        <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                          {field.field_name}
                          {isRequired(field)
                            ? <span className="text-danger ms-1">*</span>
                            : <span className="text-muted fw-normal small ms-2">(optional)</span>
                          }
                        </label>

                        {/* Text */}
                        {field.field_type === 'text' && (
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`Enter ${field.field_name.toLowerCase()}`}
                            value={answers[field.id]?.value || ''}
                            style={{ fontSize: '14px' }}
                            onChange={e => setAnswer(field.id, { value: e.target.value, score: 0 })}
                          />
                        )}

                        {/* Number */}
                        {field.field_type === 'number' && (
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter a number"
                            value={answers[field.id]?.value || ''}
                            style={{ fontSize: '14px' }}
                            onChange={e => setAnswer(field.id, { value: e.target.value, score: 0 })}
                          />
                        )}

                        {/* Dropdown */}
                        {field.field_type === 'dropdown' && (
                          <select
                            className="form-select"
                            value={answers[field.id]?.optId || ''}
                            style={{ fontSize: '14px' }}
                            onChange={e => {
                              const opt = field.options.find(o => String(o.id) === e.target.value)
                              setAnswer(field.id, opt
                                ? { value: opt.option_value, score: opt.score || 0, optId: String(opt.id) }
                                : { value: '', score: 0, optId: '' }
                              )
                            }}
                          >
                            <option value="">— Select an option —</option>
                            {field.options.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.option_value}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Yes / No */}
                        {field.field_type === 'yes_no' && (
                          <div className="d-flex gap-2 flex-wrap">
                            {field.options.map(opt => {
                              const selected = answers[field.id]?.value === opt.option_value
                              return (
                                <label
                                  key={opt.id}
                                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-2 border flex-grow-1"
                                  style={{
                                    cursor: 'pointer',
                                    background:   selected ? MG_LIGHT : '#fff',
                                    borderColor:  selected ? MG : '#e2e8f0',
                                    transition: 'all .12s',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`field-${field.id}`}
                                    className="form-check-input mt-0 flex-shrink-0"
                                    checked={selected}
                                    onChange={() =>
                                      setAnswer(field.id, { value: opt.option_value, score: opt.score || 0 })
                                    }
                                  />
                                  <span className="fw-medium" style={{ fontSize: '14px' }}>
                                    {opt.option_value}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {formError && (
                      <div
                        className="d-flex align-items-center gap-2 p-3 rounded-2 mb-3 small"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                      >
                        <span>⚠️</span> {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn w-100 fw-semibold text-white"
                      style={{ background: MG, border: 'none', borderRadius: 8,height: '44px', fontSize: '15px' }}
                      disabled={submitting || formFields.length === 0}
                    >
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Submitting…</>
                        : 'Submit & Qualify Lead'
                      }
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Result ── */}
          {result && cfg && (
            <div
              className="bg-white rounded-4 overflow-hidden"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
            >
              {/* Score hero */}
              <div className="text-center py-5 px-4">
                <p className="mb-3" style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {result.userEmail}
                </p>

                {/* Score ring */}
                <div
                  className={`border border-4 border-${cfg.bg} rounded-circle d-inline-flex flex-column align-items-center justify-content-center mb-4`}
                  style={{ width: '130px', height: '130px' }}
                >
                  <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                    {result.totalScore}
                  </div>
                  <div className="text-muted fw-semibold" style={{ fontSize: '11px', letterSpacing: '.05em' }}>
                    POINTS
                  </div>
                </div>

                <div className="mb-2">
                  <span className={`badge bg-${cfg.bg} ${cfg.textDark ? 'text-dark' : ''} fs-5 px-4 py-2`}>
                    <MI n={cfg.icon} s={22} sx={{ marginRight: 6 }} />{result.category}
                  </span>
                </div>
                <p className="text-muted small mb-0">{cfg.desc}</p>
              </div>

              {/* Thresholds used */}
              <div
                className="d-flex flex-wrap gap-2 justify-content-center py-2 px-3"
                style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}
              >
                <span className="badge bg-danger"><MI n="local_fire_department" s={13} sx={{ marginRight: 3 }} />Hot ≥ {result.thresholds.hot} pts</span>
                <span className="badge bg-warning text-dark"><MI n="device_thermostat" s={13} sx={{ marginRight: 3 }} />Warm ≥ {result.thresholds.warm} pts</span>
                <span className="badge bg-primary"><MI n="ac_unit" s={13} sx={{ marginRight: 3 }} />Cold &lt; {result.thresholds.warm} pts</span>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column flex-sm-row gap-2 p-3 p-md-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  className="btn btn-outline-primary flex-grow-1 fw-semibold"
                  onClick={handleReset}
                >
                  Qualify Another Lead
                </button>
                <button
                  className="btn flex-grow-1 fw-semibold text-white"
                  style={{ background: MG, border: 'none', borderRadius: 8 }}
                  onClick={() => window.print()}
                >
                  Print / Save
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
