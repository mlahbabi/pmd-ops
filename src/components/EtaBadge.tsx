// ETA d'un vol, visible sans ouvrir la carte : « ETA 16:38 · −2 min » (vert), « +25 min » (orange), « +30 min et plus / annulé » (rouge).
import { useApp } from '../context'
import { useFlightStatus, etaOf, deltaMin, statusLabel } from '../lib/flights'
import { mParts, toDate } from '../lib/time'
import { Badge } from './ui'

export default function EtaBadge({ code, date, heure, type }: { code: string; date: string; heure: string; type: 'arrivee' | 'depart' }) {
  const { now } = useApp()
  const ref = toDate(date, heure).getTime() - now.getTime()
  const active = mParts(now).date === date && ref < 5 * 3600_000 && ref > -2 * 3600_000
  const st = useFlightStatus(code, active)
  if (!st) return null
  if (st.status === 'cancelled') return <Badge tone="red">✈️ {code} ANNULÉ</Badge>
  const eta = etaOf(st, type)
  const d = eta ? deltaMin(eta, heure) : (st.delay ?? null)
  const tone = d == null ? 'muted' : d >= 30 ? 'red' : d >= 10 ? 'orange' : 'ok'
  const label = d == null ? '' : d > 4 ? ` · +${d} min` : d < -4 ? ` · −${-d} min` : ' · à l\'heure'
  return <Badge tone={tone}>✈️ {code} {eta ? `ETA ${eta}` : statusLabel(st)}{label}{st.status === 'landed' ? ' · atterri' : st.status === 'active' ? ' · en vol' : ''}</Badge>
}
