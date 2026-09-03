import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ckId, useApp } from '../context'
import { DATA_VERSION, pending, sequences, sequencesOfDay } from '../lib/data'
import { DAYS, dayLabel, fmtIso, jOf, mParts, seqStatus, toDate } from '../lib/time'
import type { NoteLevel } from '../lib/store'
import SequenceCard from '../components/SequenceCard'
import { Badge, Empty, Section } from '../components/ui'

export default function Now() {
  const { now, simulated, setSimulated, user, store, addNote } = useApp()
  const parts = mParts(now)
  const today = parts.date
  const [simOpen, setSimOpen] = useState(false)
  const [simVal, setSimVal] = useState(`${today}T${parts.time}`)

  const daySeqs = useMemo(() => sequencesOfDay(today), [today])
  const statuses = useMemo(() => daySeqs.map(s => {
    const all = s.checklist.length > 0 && s.checklist.every(c => store.checks[ckId(c.id)]?.done)
    return { s, st: seqStatus(s, now, all) }
  }), [daySeqs, now, store.checks])
  const enCours = statuses.filter(x => x.st.state === 'now')
  const future = statuses.filter(x => x.st.state === 'future').sort((a, b) => a.st.minsTo - b.st.minsTo)
  const pinned = future.filter(x => x.st.pinned)
  const upcoming = [...pinned, ...future.filter(x => !x.st.pinned)].slice(0, Math.max(3, pinned.length))
  const critToday = daySeqs.filter(s => s.level === 'critique')
  const pendingDue = pending.filter(p => !store.checks[`pending:${p.id}`]?.done && (p.echeance <= today || p.echeance === 'sur place'))
  const nextDay = DAYS.find(d => d > today)
  const nextSeqs = !daySeqs.length && nextDay ? sequences.filter(s => s.date === nextDay).slice(0, 3) : []

  // Vibration à T-15 (une fois par séquence)
  const vibrated = useRef(new Set<string>())
  useEffect(() => {
    future.forEach(({ s, st }) => {
      if (st.badge === 'T-15' && s.level !== 'normal' && !vibrated.current.has(s.id)) {
        vibrated.current.add(s.id); try { navigator.vibrate?.([200, 100, 200]) } catch { /* non supporté */ }
      }
    })
  }, [future])

  const [noteText, setNoteText] = useState('')
  const [noteLevel, setNoteLevel] = useState<NoteLevel>('info')
  const [noteOpen, setNoteOpen] = useState(false)
  const notes = store.notes.slice(0, 30)

  return (
    <div>
      <header className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-warm uppercase tracking-wider">Partners’ Meeting · Marrakech</div>
            <h1 className="text-2xl font-bold leading-tight">{dayLabel(today).replace(/ — /, ' · ')}{!jOf(today) && ''}</h1>
            <div className="text-sm text-warm">{parts.time} heure du Maroc · Paris = +1h · 👤 {user}</div>
          </div>
          <button type="button" className="chip" onClick={() => setSimOpen(o => !o)}>🗓️ {simulated ? 'Simulation' : 'Simuler'}</button>
        </div>
        <div className="text-[11px] text-warm mt-1">Données {DATA_VERSION}</div>
        {simOpen && (
          <div className="card p-3 mt-3 space-y-2">
            <div className="text-xs text-warm">Simuler une date et une heure (heure du Maroc) pour préparer la veille.</div>
            <input type="datetime-local" className="input" value={simVal} onChange={e => setSimVal(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary flex-1" onClick={() => { const [d, t] = simVal.split('T'); if (d && t) setSimulated(toDate(d, t.slice(0, 5))) }}>Appliquer</button>
              <button type="button" className="btn flex-1" onClick={() => { setSimulated(null); setSimOpen(false) }}>Temps réel</button>
            </div>
          </div>
        )}
      </header>

      {pendingDue.length > 0 && (
        <div className="card border-alert-yellow/60 bg-alert-yellow/10 p-3 mb-4">
          <div className="text-sm font-semibold mb-1">⚠️ {pendingDue.length} point(s) en attente échus</div>
          <ul className="text-sm space-y-1">
            {pendingDue.slice(0, 5).map(p => <li key={p.id}>• {p.sujet} <span className="text-warm">({p.responsable})</span></li>)}
          </ul>
          <Link to="/plus/points" className="text-xs underline text-lavender mt-1 inline-block">Voir les points en attente</Link>
        </div>
      )}

      <Section title="En cours">
        {enCours.length ? <div className="space-y-2">{enCours.map(x => <SequenceCard key={x.s.id} seq={x.s} defaultOpen />)}</div> : <Empty>Rien en cours{daySeqs.length ? '' : ' — aucune séquence ce jour'}.</Empty>}
      </Section>

      <Section title="À venir" right={<Link to="/programme" className="text-xs text-lavender underline">Programme complet</Link>}>
        {upcoming.length ? <div className="space-y-2">{upcoming.map(x => <SequenceCard key={x.s.id} seq={x.s} />)}</div>
          : nextSeqs.length ? <div className="space-y-2"><div className="text-xs text-warm px-1">Prochaine journée : {dayLabel(nextDay!)}</div>{nextSeqs.map(s => <SequenceCard key={s.id} seq={s} showDate />)}</div>
          : <Empty>Plus rien à venir aujourd'hui.</Empty>}
      </Section>

      <Section title="Alertes du jour">
        {critToday.length || pendingDue.length ? (
          <div className="card divide-y divide-line">
            {critToday.map(s => {
              const x = statuses.find(y => y.s.id === s.id)!
              return (
                <div key={s.id} className="px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="font-bold w-12">{s.start}</span>
                  <span className="flex-1 min-w-0 truncate">{s.title}</span>
                  <Badge tone={x.st.state === 'past' ? 'muted' : 'red'}>{x.st.state === 'past' ? 'fait' : x.st.state === 'now' ? 'MAINTENANT' : 'critique'}</Badge>
                </div>
              )
            })}
          </div>
        ) : <Empty>Aucune alerte critique aujourd'hui.</Empty>}
      </Section>

      <Section title="Fil terrain" right={<button type="button" className="chip chip-on" onClick={() => setNoteOpen(o => !o)}>+ Note</button>}>
        {noteOpen && (
          <form className="card p-3 mb-3 space-y-2" onSubmit={e => { e.preventDefault(); if (noteText.trim()) { addNote(noteText.trim(), noteLevel); setNoteText(''); setNoteOpen(false) } }}>
            <textarea className="input" rows={3} placeholder="Info terrain, alerte, incident…" value={noteText} onChange={e => setNoteText(e.target.value)} />
            <div className="flex gap-2">
              {(['info', 'alerte', 'incident'] as NoteLevel[]).map(l => <button key={l} type="button" onClick={() => setNoteLevel(l)} className={`chip ${noteLevel === l ? 'chip-on' : ''}`}>{l}</button>)}
              <button className="btn btn-primary ml-auto" disabled={!noteText.trim()}>Publier</button>
            </div>
          </form>
        )}
        {notes.length ? (
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className={`card p-3 text-sm ${n.level === 'incident' ? 'border-alert-red bg-alert-red/10' : n.level === 'alerte' ? 'border-alert-orange/60' : ''}`}>
                <div className="flex items-center gap-2 text-xs text-warm mb-1">
                  <b className="text-ivory">{n.author}</b> · {fmtIso(n.created_at)}
                  {n.level !== 'info' && <Badge tone={n.level === 'incident' ? 'red' : 'orange'}>{n.level.toUpperCase()}</Badge>}
                </div>
                <div className="whitespace-pre-line">{n.text}</div>
              </div>
            ))}
          </div>
        ) : <Empty>Aucune note. {store.mode === 'local' ? 'Mode local : les notes restent sur cet appareil.' : ''}</Empty>}
      </Section>
    </div>
  )
}
