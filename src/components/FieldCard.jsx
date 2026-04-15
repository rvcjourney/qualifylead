import { useState } from 'react'

// ── Field type metadata ────────────────────────────────────
const TYPE_META = {
  text:     { label: 'Text',     color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  number:   { label: 'Number',   color: '#c026d3', bg: '#fdf4ff', border: '#f0abfc' },
  dropdown: { label: 'Dropdown', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  yes_no:   { label: 'Yes / No', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
}

// ── Single option row — score is click-to-edit ─────────────
function OptionRow({ opt, onDelete, onUpdateScore }) {
  const [editing,  setEditing]  = useState(false)
  const [scoreVal, setScoreVal] = useState(String(opt.score ?? 0))
  const [saving,   setSaving]   = useState(false)

  const startEdit = () => {
    setScoreVal(String(opt.score ?? 0))
    setEditing(true)
  }

  const commit = async () => {
    const next = parseInt(scoreVal, 10)
    setEditing(false)
    if (isNaN(next) || next === (opt.score ?? 0)) return
    setSaving(true)
    await onUpdateScore(opt.id, Math.max(0, next))
    setSaving(false)
  }

  const cancel = () => {
    setEditing(false)
    setScoreVal(String(opt.score ?? 0))
  }

  return (
    <div
      className="d-flex align-items-center gap-2 px-3 py-2 rounded-2 mb-2"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      {/* Option value */}
      <span className="flex-grow-1 fw-medium text-dark" style={{ fontSize: '13px' }}>
        {opt.option_value}
      </span>
      <span className="text-muted" style={{ fontSize: '12px' }}>→</span>

      {/* Score — click to edit */}
      {editing ? (
        <input
          type="number"
          className="form-control form-control-sm text-center fw-bold"
          value={scoreVal}
          autoFocus
          min="0"
          style={{ width: '80px', borderColor: '#c026d3', outline: 'none', boxShadow: '0 0 0 3px #f0abfc' }}
          onChange={e => setScoreVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter')  commit()
            if (e.key === 'Escape') cancel()
          }}
        />
      ) : (
        <button
          onClick={startEdit}
          disabled={saving}
          title="Click to edit score"
          style={{
            background: '#fdf4ff',
            color: '#a21caf',
            border: '1px solid #f0abfc',
            borderRadius: '6px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            minWidth: '68px',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? '…' : <>{opt.score ?? 0} pts <span className="material-icons" style={{ fontSize: 12, verticalAlign: 'middle' }}>edit</span></>}
        </button>
      )}

      {/* Delete */}
      <button
        className="btn border-0 p-0 lh-1"
        style={{ color: '#cbd5e1', fontSize: '18px' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
        onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
        onClick={() => onDelete(opt.id)}
        title="Delete option"
      >
        ×
      </button>
    </div>
  )
}

// ── Field card ─────────────────────────────────────────────
export default function FieldCard({
  field,
  onDelete,
  onOptionAdd,
  onOptionDelete,
  onToggleMandatory,
  onUpdateScore,
}) {
  const [optVal,   setOptVal]   = useState('')
  const [optScore, setOptScore] = useState('')
  const [adding,   setAdding]   = useState(false)

  const meta        = TYPE_META[field.field_type] || TYPE_META.text
  const hasOptions  = field.field_type === 'dropdown' || field.field_type === 'yes_no'
  const isMandatory = field.is_mandatory !== false   // null/undefined/true → required

  const handleAdd = async () => {
    if (!optVal.trim()) return
    const score = optScore === '' ? 0 : parseInt(optScore, 10)
    if (isNaN(score) || score < 0) return
    setAdding(true)
    await onOptionAdd(field.id, optVal.trim(), score)
    setOptVal('')
    setOptScore('')
    setAdding(false)
  }

  return (
    <div
      className="mb-3 rounded-3 overflow-hidden"
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
    >
      {/* Left-accent bar + content */}
      <div className="d-flex">
        {/* Colored accent bar (field type colour) */}
        <div style={{ width: '4px', background: meta.color, flexShrink: 0 }} />

        <div className="flex-grow-1">

          {/* ── Card header ── */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 flex-wrap"
            style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
          >
            {/* Type-colour dot */}
            <div
              className="rounded-circle flex-shrink-0"
              style={{ width: '10px', height: '10px', background: meta.color }}
            />

            <span className="fw-semibold flex-grow-1 text-dark" style={{ fontSize: '14px' }}>
              {field.field_name}
            </span>

            {/* Type badge */}
            <span
              className="fw-medium"
              style={{
                background: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.border}`,
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '11px',
                letterSpacing: '.03em',
              }}
            >
              {meta.label}
            </span>

            {/* Mandatory / Optional toggle */}
            <div className="form-check form-switch mb-0 d-flex align-items-center gap-1 ms-1">
              <input
                type="checkbox"
                role="switch"
                className="form-check-input"
                id={`mand-${field.id}`}
                checked={isMandatory}
                onChange={() => onToggleMandatory(field.id, !isMandatory)}
                style={{ cursor: 'pointer' }}
              />
              <label
                htmlFor={`mand-${field.id}`}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: isMandatory ? '#dc2626' : '#94a3b8',
                }}
              >
                {isMandatory ? 'Required' : 'Optional'}
              </label>
            </div>

            {/* Delete */}
            <button
              className="btn border-0 p-1 lh-1"
              style={{ color: '#94a3b8', fontSize: '16px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              onClick={() => onDelete(field.id)}
              title="Delete field"
            >
              <span className="material-icons" style={{ fontSize: 18, verticalAlign: 'middle' }}>delete</span>
            </button>
          </div>

          {/* ── Card body ── */}
          <div className="px-3 py-3" style={{ background: '#fff' }}>
            {hasOptions ? (
              <>
                <div
                  className="mb-2"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: '#94a3b8',
                  }}
                >
                  Options &amp; Scores
                  <span className="ms-2 fw-normal normal-case" style={{ textTransform: 'none', color: '#cbd5e1' }}>
                    — click any score to edit it
                  </span>
                </div>

                {field.options.length === 0 ? (
                  <p className="text-muted small fst-italic mb-3">No options yet.</p>
                ) : (
                  field.options.map(opt => (
                    <OptionRow
                      key={opt.id}
                      opt={opt}
                      onDelete={onOptionDelete}
                      onUpdateScore={onUpdateScore}
                    />
                  ))
                )}

                {/* Add option row */}
                <div
                  className="d-flex gap-0 mt-3 rounded-2 overflow-hidden"
                  style={{ border: '1px solid #e2e8f0' }}
                >
                  <input
                    type="text"
                    className="form-control border-0 rounded-0"
                    placeholder="Option value (e.g. 100–200)"
                    value={optVal}
                    style={{ boxShadow: 'none', fontSize: '13px' }}
                    onChange={e => setOptVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <div style={{ width: '1px', background: '#e2e8f0', flexShrink: 0 }} />
                  <input
                    type="number"
                    className="form-control border-0 rounded-0 text-center"
                    placeholder="pts"
                    value={optScore}
                    style={{ width: '72px', boxShadow: 'none', fontSize: '13px', flexShrink: 0 }}
                    min="0"
                    onChange={e => setOptScore(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <button
                    className="btn btn-primary border-0 rounded-0 px-3"
                    style={{ borderRadius: 0, fontSize: '13px', whiteSpace: 'nowrap' }}
                    onClick={handleAdd}
                    disabled={adding || !optVal.trim()}
                  >
                    {adding ? '…' : '+ Add'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Score is optional — leave blank to default to 0 pts
                </div>
              </>
            ) : (
              <p className="text-muted small fst-italic mb-0">
                Informational field — responses are stored but do not contribute to the score.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
