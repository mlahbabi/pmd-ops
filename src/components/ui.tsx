import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCheck } from '../context'
import { personById, fullName } from '../lib/data'
import type { Level } from '../lib/types'
import { fmtIso } from '../lib/time'

export function Badge({ tone = 'muted', children, className = '' }: { tone?: 'muted' | 'red' | 'orange' | 'yellow' | 'ok' | 'lav' | 'ivory'; children: ReactNode; className?: string }) {
  const cls = {
    muted: 'bg-ink-3 text-ivory/80 border border-line',
    red: 'bg-alert-red text-white',
    orange: 'bg-alert-orange text-ink',
    yellow: 'bg-alert-yellow text-ink',
    ok: 'bg-ok text-white',
    lav: 'bg-lavender text-ink',
    ivory: 'bg-ivory text-ink',
  }[tone]
  return <span className={`badge ${cls} ${className}`}>{children}</span>
}
export const Warn = ({ label = 'à confirmer' }: { label?: string }) => <Badge tone="yellow">⚠️ {label}</Badge>
export function LevelBadge({ level }: { level: Level }) {
  if (level === 'critique') return <Badge tone="red">CRITIQUE</Badge>
  if (level === 'important') return <Badge tone="orange">important</Badge>
  return null
}
export function VipBadge({ vip }: { vip?: string }) {
  if (!vip) return null
  return <Badge tone={vip === 'VIP' ? 'ivory' : 'lav'}>{vip}</Badge>
}
export const TYPE_ICON: Record<string, string> = { transport: '🚐', salle: '🏛️', restauration: '🍽️', setup: '🛠️', activite: '🧭', vip: '⭐', orga: '📋' }

export function CheckRow({ itemId, label, sub }: { itemId: string; label: ReactNode; sub?: ReactNode }) {
  const c = useCheck(itemId)
  return (
    <button type="button" onClick={c.toggle} className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-xl border ${c.done ? 'border-ok/50 bg-ok/10' : 'border-line bg-ink-3'}`}>
      <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm font-bold ${c.done ? 'bg-ok border-ok text-white' : 'border-warm'}`}>{c.done ? '✓' : ''}</span>
      <span className="flex-1 min-w-0">
        <span className={`block ${c.done ? 'line-through text-ivory/60' : ''}`}>{label}</span>
        {sub && <span className="block text-xs text-warm">{sub}</span>}
        {c.done && <span className="block text-xs text-ok">{c.by} · {fmtIso(c.at)}</span>}
      </span>
    </button>
  )
}

export function PersonChip({ id }: { id: string }) {
  const p = personById.get(id)
  if (!p) return <span className="chip">{id}</span>
  return (
    <Link to={`/personnes/${p.id}`} className="chip">
      {fullName(p)}
      {p.vip && <span className="text-[10px] font-bold text-lavender">{p.vip}</span>}
      {p.regime && <span title={p.regime}>🥗</span>}
    </Link>
  )
}

export function Section({ title, right, children, className = '' }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-5 ${className}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warm">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Chips<T extends string>({ items, value, onChange, render }: { items: T[]; value: T; onChange: (v: T) => void; render?: (v: T) => ReactNode }) {
  return (
    <div className="scroll-x flex gap-2 py-1 -mx-4 px-4">
      {items.map(it => (
        <button key={it} type="button" onClick={() => onChange(it)} className={`chip ${value === it ? 'chip-on' : ''}`}>{render ? render(it) : it}</button>
      ))}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-4 text-center text-warm text-sm">{children}</div>
}

export function TelButtons({ tel, tel2, email, compact = false }: { tel?: string; tel2?: string; email?: string; compact?: boolean }) {
  const wa = tel ? tel.replace(/[^\d]/g, '') : ''
  return (
    <div className="flex flex-wrap gap-2">
      {tel && <a className={`btn ${compact ? 'text-xs px-3 min-h-9' : ''}`} href={`tel:${tel}`}>📞 {compact ? '' : 'Appel'}</a>}
      {tel && <a className={`btn ${compact ? 'text-xs px-3 min-h-9' : ''}`} href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">💬 {compact ? '' : 'WhatsApp'}</a>}
      {tel2 && <a className={`btn ${compact ? 'text-xs px-3 min-h-9' : ''}`} href={`tel:${tel2}`}>📞 {compact ? '2' : 'Fixe'}</a>}
      {email && <a className={`btn ${compact ? 'text-xs px-3 min-h-9' : ''}`} href={`mailto:${email}`}>✉️ {compact ? '' : 'Email'}</a>}
    </div>
  )
}

export function PageTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {sub && <div className="text-xs text-warm mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  )
}
