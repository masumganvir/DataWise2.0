import React, { useState } from 'react'
import { X, Search, Copy, Check, BookOpen, Binary, FileSpreadsheet, BarChart2, Brain, Sparkles, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DOC_ITEMS } from '../../pages/docs/DocumentationHub'

interface DocsDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: 'numpy' | 'pandas' | 'matplotlib' | 'sklearn' | 'all'
}

export const DocsDrawer: React.FC<DocsDrawerProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all',
}) => {
  const [activeCat, setActiveCat] = useState<string>(initialCategory)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const filtered = DOC_ITEMS.filter((item) => {
    if (activeCat !== 'all' && item.category !== activeCat) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.syntax.toLowerCase().includes(q) || item.exampleCode.toLowerCase().includes(q)
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 9, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          background: '#0a0f1d',
          borderLeft: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '-10px 0 50px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Top Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Python Data Science Quick Reference
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                NumPy · Pandas · Matplotlib · Scikit-Learn Cheatsheets
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/docs"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: '#818cf8',
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(99,102,241,0.1)',
              }}
            >
              <span>Full Hub</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search functions, syntax, methods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All', icon: BookOpen },
              { id: 'numpy', label: 'NumPy', icon: Binary },
              { id: 'pandas', label: 'Pandas', icon: FileSpreadsheet },
              { id: 'matplotlib', label: 'Matplotlib', icon: BarChart2 },
              { id: 'sklearn', label: 'Scikit-Learn', icon: Brain },
            ].map((t) => {
              const Icon = t.icon
              const isA = activeCat === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveCat(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: isA ? 700 : 500,
                    cursor: 'pointer',
                    background: isA ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                    border: isA ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: isA ? '#fff' : '#94a3b8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cheatsheet Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((item) => {
            const isCopied = copiedId === item.id
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      {item.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopy(item.id, item.exampleCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: isCopied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.06)',
                      border: isCopied ? '1px solid #34d399' : '1px solid var(--border-subtle)',
                      color: isCopied ? '#34d399' : '#cbd5e1',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {item.summary}
                </div>

                <pre
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#070b14',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: 'auto',
                    maxHeight: '180px',
                  }}
                >
                  <code>{item.exampleCode}</code>
                </pre>

                {item.datawiseTip && (
                  <div style={{ fontSize: '0.73rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                    💡 <strong>Tip: </strong>{item.datawiseTip}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default DocsDrawer
