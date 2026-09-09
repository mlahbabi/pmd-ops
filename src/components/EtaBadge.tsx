// ETA d'un vol, visible sans ouvrir la carte. Arrivée : « ETA 16:38 · −2 min » ; départ : « décollage 10:52 · +12 min ».
// Vert à l'heure, orange ≥ 10 min, rouge ≥ 30 min ou annulé. Le retard est mesuré sur l'horaire du vol lui-même
// (pour un départ, l'heure de la vague est la prise en charge, pas le décollage).
// Si le suivi automatique est en panne (ou le vol introuvable à cette date), un badge discret le dit au lieu de ne rien afficher.
import { useApp } from '../context'
import { useFlightStatus, etaOf, deltaOf, statusLabel, isActive, isUnknown, isTransit, useApiError, type FlightType } from '../lib/flights'
import { Badge } from './ui'

export default function EtaBadge({ code, date, heure, type }: { code: string; date: string; heure: string; type: FlightType }) {
  const { now } = useApp()
  const active = isActive(now, date, heure, type)
  const st = useFlightStatus(code, active, date, heure, type)
  const err = useApiError()
  if (!st) return active && err ? <Badge tone="muted">✈️ {code} · suivi auto indisponible</Badge> : null
  if (isTransit(st)) return null
  if (isUnknown(st)) return <Badge tone="yellow">✈️ {code} · introuvable à cette date ⚠️</Badge>
  if (st.status === 'cancelled') return <Badge tone="red">✈️ {code} ANNULÉ</Badge>
  const eta = etaOf(st, type)
  const d = deltaOf(st, type, heure)
  const tone = d == null ? 'muted' : d >= 30 ? 'red' : d >= 10 ? 'orange' : d <= -15 ? 'orange' : 'ok'
  const label = d == null ? '' : d > 4 ? ` · +${d} min` : d < -4 ? ` · −${-d} min` : ' · à l\'heure'
  const word = type === 'depart' ? (st.depActual ? 'décollé' : 'décollage') : 'ETA'
  return <Badge tone={tone}>✈️ {code} {eta ? `${word} ${eta}` : statusLabel(st)}{label}{st.status === 'landed' ? ' · atterri' : st.status === 'active' && type === 'arrivee' ? ' · en vol' : ''}</Badge>
}
