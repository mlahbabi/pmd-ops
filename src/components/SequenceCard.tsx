import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ckId, useApp, useChecklistDone } from '../context'
import { ownerOf, waveById } from '../lib/data'
import { fmtMins, seqStatus, type SeqStatus } from '../lib/time'
import type { Sequence } from '../lib/types'
import { Badge, CheckRow, LevelBadge, PersonChip, TYPE_ICON, Warn } from './ui'

export function StatusBadge({ st }: { st: SeqStatus }) {
  if (st.state === 'past') return <Badge tone="muted">terminé</Badge>
  if (st.badge === 'MAINTENANT') return <Badge tone="red" className="pulse-red">MAINTENANT</Badge>
  if (st.badge === 'T-15') return <Badge tone="orange">🟠 T-15 · {fmtMins(st.minsTo)}</Badge>
  if (st.badge === 'T-30') return <Badge tone="yellow">🟡 T-30 · {fmtMins(st.minsTo)}</Badge>
  if (st.badge === 'T-60') return <Badge tone="red">🔴 dans {fmtMins(st.minsTo)}</Badge>
  return <Badge tone="muted">dans {fmtMins(st.minsTo)}</Badge>
}

export default function SequenceCard({ seq, defaultOpen = false, showDate = false }: { seq: Sequence; defaultOpen?: boolean; showDate?: boolean }) {
  const { now } = useApp()
  const cl = useChecklistDone(seq)
  const st = seqStatus(seq, now, cl.all)
  const [open, setOpen] = useState(defaultOpen)
  const owner = seq.owner || ownerOf(seq.id)
  const wave = seq.waveId ? waveById.get(seq.waveId) : undefined
  const border = st.state === 'now' ? 'border-alert-red' : st.pinned ? 'border-alert-red' : seq.level === 'critique' ? 'border-alert-red/40' : seq.level === 'important' ? 'border-alert-orange/40' : 'border-line'
  const dim = st.state === 'past' ? 'opacity-60' : ''
  return (
    <div className={`card border ${border} ${dim} overflow-hidden`}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-3 flex gap-3">
        <div className="shrink-0 w-14">
          <div className="font-bold text-base leading-tight">{seq.start}</div>
          {seq.end && <div className="text-[11px] text-warm">→ {seq.end}</div>}
          {showDate && <div className="text-[11px] text-warm">{seq.date.slice(8, 10)}/{seq.date.slice(5, 7)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <StatusBadge st={st} />
            <LevelBadge level={seq.level} />
            {seq.aConfirmer && <Warn />}
          </div>
          <div className="font-semibold leading-snug">{TYPE_ICON[seq.type] || ''} {seq.title}</div>
          <div className="text-xs text-warm mt-0.5">
            {seq.lieu}{seq.effectif ? ` · ${seq.effectif} pax` : ''}{owner ? ` · 👤 ${owner}` : ''}
            {cl.total > 0 && <span className={cl.all ? 'text-ok' : ''}> · ✓ {cl.done}/{cl.total}</span>}
          </div>
        </div>
        <div className="text-warm self-center">{open ? '▾' : '▸'}</div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-line pt-3">
          {seq.details && <p className="text-sm leading-relaxed whitespace-pre-line">{seq.details}</p>}
          {seq.checklist.length > 0 && (
            <div className="space-y-1.5">
              {seq.checklist.map(c => <CheckRow key={c.id} itemId={ckId(c.id)} label={c.label} />)}
            </div>
          )}
          {seq.persons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{seq.persons.map(id => <PersonChip key={id} id={id} />)}</div>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {wave && <Link className="btn text-xs min-h-9 px-3" to={`/transport?d=${wave.date}#${wave.id}`}>🚐 Voir la vague transport</Link>}
            {!owner && <span className="text-warm self-center">Responsable MRCO : à affecter (Plus → Équipe)</span>}
          </div>
        </div>
      )}
    </div>
  )
}
