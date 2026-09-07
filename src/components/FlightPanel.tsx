// Bloc « suivi du vol » d'une vague : liens Flightradar24 (aucune donnée chargée), statut automatique si clé AirLabs,
// et « heure réelle » partagée saisie par l'équipe (note Supabase liée à la vague → visible par les 4, flash si retard).
import { useState } from 'react'
import { useApp } from '../context'
import { flightCodes, fr24Url, useFlightStatus, hasLiveKey, statusLabel } from '../lib/flights'
import { fmtIso, mParts, toDate } from '../lib/time'
import type { Wave } from '../lib/types'
import { Badge } from './ui'

function LiveStatus({ code, active }: { code: string; active: boolean }) {
  const st = useFlightStatus(code, active)
  if (!st) return null
  const t = st.arrEstimated || st.depActual || st.arrSched
  const tone = st.status === 'cancelled' ? 'red' : (st.delay || 0) >= 30 ? 'red' : (st.delay || 0) >= 10 ? 'orange' : 'ok'
  return <Badge tone={tone}>📡 {code} {statusLabel(st)}{t ? ` · ${t}` : ''}{st.delay ? ` (+${st.delay} min)` : ''}</Badge>
}

export default function FlightPanel({ wave }: { wave: Wave }) {
  const { now, store, addNote } = useApp()
  const codes = flightCodes(wave.vol)
  const [txt, setTxt] = useState('')
  const [late, setLate] = useState(false)
  const itemId = `eta:${wave.id}`
  const notes = store.notes.filter(n => n.item_id === itemId).slice(0, 3)
  const ref = toDate(wave.date, wave.heure)
  const active = mParts(now).date === wave.date && Math.abs(ref.getTime() - now.getTime()) < 5 * 3600_000
  if (!codes.length && wave.type === 'programme') return null
  return (
    <div className="rounded-xl border border-line bg-ink-3/60 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs uppercase tracking-wider text-warm mr-1">Suivi du vol</span>
        {codes.map(c => (
          <a key={c} href={fr24Url(c)} target="_blank" rel="noreferrer" className="chip text-xs min-h-8 py-1">✈️ {c} · Flightradar24</a>
        ))}
      </div>
      {hasLiveKey() && active && <div className="flex flex-wrap gap-1.5">{codes.map(c => <LiveStatus key={c} code={c} active={active} />)}</div>}
      {notes.length > 0 && (
        <div className="space-y-1">
          {notes.map(n => (
            <div key={n.id} className={`text-sm rounded-lg px-2 py-1 ${n.level === 'alerte' ? 'bg-alert-orange/20 border border-alert-orange/60' : 'bg-ink-2'}`}>
              🕒 <b>{n.text}</b> <span className="text-xs text-warm">— {n.author}, {fmtIso(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
      <form className="flex gap-2 items-center" onSubmit={e => { e.preventDefault(); if (!txt.trim()) return; addNote(`${codes[0] ? codes[0] + ' : ' : ''}${txt.trim()}`, late ? 'alerte' : 'info', itemId); setTxt(''); setLate(false) }}>
        <input className="input min-h-10 text-sm flex-1" placeholder="Heure réelle / retard (ex. atterri 18:12, +40 min)" value={txt} onChange={e => setTxt(e.target.value)} />
        <button type="button" onClick={() => setLate(l => !l)} className={`chip text-xs min-h-10 ${late ? 'bg-alert-orange text-ink border-alert-orange' : ''}`}>Retard</button>
        <button className="btn btn-primary min-h-10 px-3 text-sm" disabled={!txt.trim()}>OK</button>
      </form>
    </div>
  )
}
