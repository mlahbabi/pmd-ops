// Bloc « suivi du vol » d'une vague ouverte : détail du statut par vol + lien Flightradar24.
import { useApp } from '../context'
import { flightCodes, fr24Url, useFlightStatus, statusLabel, etaOf, deltaOf, schedOf, isActive, isUnknown, useApiError, ACTIVE_LABEL, type FlightType } from '../lib/flights'
import type { Wave } from '../lib/types'

function Line({ code, wave, active, type }: { code: string; wave: Wave; active: boolean; type: FlightType }) {
  const st = useFlightStatus(code, active, wave.date, wave.heure, type)
  const err = useApiError()
  const eta = st && !isUnknown(st) ? etaOf(st, type) : undefined
  const d = st && !isUnknown(st) ? deltaOf(st, type, wave.heure) : null
  const sched = st ? schedOf(st, type) : undefined
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <a href={fr24Url(code)} target="_blank" rel="noreferrer" className="chip text-xs min-h-8 py-1">✈️ {code} · Flightradar24</a>
      {st && isUnknown(st) ? <span className="text-xs text-alert-yellow font-semibold">⚠️ vol introuvable à cette date sur Flightradar24 — vérifier le billet</span>
        : st ? (
          <span className={st.status === 'cancelled' || (d != null && d >= 30) ? 'text-alert-red font-semibold' : d != null && (d >= 10 || d <= -15) ? 'text-alert-orange font-semibold' : 'text-ok'}>
            {statusLabel(st)}
            {sched ? ` · prévu ${sched}` : ''}
            {type === 'arrivee' ? (st.arrEstimated ? ` · ${st.status === 'landed' ? 'atterri' : 'arrivée estimée'} ${st.arrEstimated}` : '') : (st.depActual ? ` · décollé ${st.depActual}` : st.depEstimated ? ` · décollage estimé ${st.depEstimated}` : '')}
            {d != null ? (d > 4 ? ` (+${d} min)` : d < -4 ? ` (−${-d} min)` : ' (à l\'heure)') : ''}
            {!eta && st.delay ? ` (+${st.delay} min annoncé)` : ''}
          </span>
        ) : active && err ? <span className="text-xs text-alert-orange font-semibold">⚠️ suivi automatique indisponible : {err} — ouvrir le lien Flightradar24</span>
          : active ? <span className="text-xs text-warm">statut en attente…</span> : <span className="text-xs text-warm">suivi actif {ACTIVE_LABEL}</span>}
    </div>
  )
}

export default function FlightPanel({ wave }: { wave: Wave }) {
  const { now } = useApp()
  const codes = flightCodes(wave.vol)
  if (!codes.length) return null
  const type: FlightType = wave.type === 'depart' ? 'depart' : 'arrivee'
  const active = isActive(now, wave.date, wave.heure, type)
  return (
    <div className="rounded-xl border border-line bg-ink-3/60 p-3 space-y-1.5">
      <div className="text-xs uppercase tracking-wider text-warm">Suivi du vol{type === 'depart' ? ' · retard mesuré sur le décollage prévu' : ''}</div>
      {codes.map(c => <Line key={c} code={c} wave={wave} active={active} type={type} />)}
    </div>
  )
}
