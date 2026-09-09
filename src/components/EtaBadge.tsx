// ETA d'un vol, visible sans ouvrir la carte : « ETA 16:38 · −2 min » (vert), « +25 min » (orange), « +30 min et plus / annulé » (rouge).
// Si le suivi automatique est en panne (quota, clé), un badge discret le dit au lieu de ne rien afficher.
import { useApp } from '../context'
import { useFlightStatus, etaOf, deltaMin, statusLabel, isActive, useApiError } from '../lib/flights'
import { Badge } from './ui'

export default function EtaBadge({ code, date, heure, type }: { code: string; date: string; heure: string; type: 'arrivee' | 'depart' }) {
  const { now } = useApp()
  const active = isActive(now, date, heure)
  const st = useFlightStatus(code, active)
  const err = useApiError()
  if (!st) return active && err ? <Badge tone="muted">✈️ {code} · suivi auto indisponible</Badge> : null
  if (st.status === 'cancelled') return <Badge tone="red">✈️ {code} ANNULÉ</Badge>
  const eta = etaOf(st, type)
  const d = eta ? deltaMin(eta, heure) : (st.delay ?? null)
  const tone = d == null ? 'muted' : d >= 30 ? 'red' : d >= 10 ? 'orange' : 'ok'
  const label = d == null ? '' : d > 4 ? ` · +${d} min` : d < -4 ? ` · −${-d} min` : ' · à l\'heure'
  return <Badge tone={tone}>✈️ {code} {eta ? `ETA ${eta}` : statusLabel(st)}{label}{st.status === 'landed' ? ' · atterri' : st.status === 'active' ? ' · en vol' : ''}</Badge>
}
