// Bloc « suivi du vol » d'une vague ouverte : détail du statut par vol + lien Flightradar24 (aucune donnée chargée).
import { useApp } from '../context'
import { flightCodes, fr24Url, useFlightStatus, statusLabel, etaOf, deltaMin, isActive, useApiError, ACTIVE_LABEL } from '../lib/flights'
import type { Wave } from '../lib/types'

function Line({ code, wave, active }: { code: string; wave: Wave; active: boolean }) {
  const type = wave.type === 'depart' ? 'depart' : 'arrivee'
  const st = useFlightStatus(code, active, wave.date, wave.heure, type)
  const err = useApiError()
  const eta = st ? etaOf(st, type) : undefined
  const d = st && eta ? deltaMin(eta, wave.heure) : null
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <a href={fr24Url(code)} target="_blank" rel="noreferrer" className="chip text-xs min-h-8 py-1">✈️ {code} · Flightradar24</a>
      {st ? (
        <span className={d != null && d >= 30 ? 'text-alert-red font-semibold' : d != null && d >= 10 ? 'text-alert-orange font-semibold' : 'text-ok'}>
          {statusLabel(st)}{type === 'arrivee' ? (st.arrEstimated ? ` · arrivée estimée ${st.arrEstimated}` : '') : (st.depActual ? ` · décollé ${st.depActual}` : st.depEstimated ? ` · décollage estimé ${st.depEstimated}` : '')}
          {d != null ? (d > 4 ? ` (+${d} min)` : d < -4 ? ` (−${-d} min)` : ' (à l\'heure)') : ''}
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
  const active = isActive(now, wave.date, wave.heure)
  return (
    <div className="rounded-xl border border-line bg-ink-3/60 p-3 space-y-1.5">
      <div className="text-xs uppercase tracking-wider text-warm">Suivi du vol</div>
      {codes.map(c => <Line key={c} code={c} wave={wave} active={active} />)}
    </div>
  )
}
