// Alertes flash : apparaissent en haut de l'app (quel que soit l'écran) et disparaissent après 20 s.
// Déclencheurs : passages T-30 / T-15 / MAINTENANT des séquences du jour (T-60 pour les critiques),
// et notes de niveau alerte / incident publiées par un autre membre de l'équipe.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ckId, useApp } from '../context'
import { sequencesOfDay, waves } from '../lib/data'
import { fmtMins, mParts, seqStatus } from '../lib/time'
import { fetchStatus, flightCodes, isActive, statusLabel, useApiError, TTL as TTL_FLIGHT } from '../lib/flights'

const TTL = 20_000
type Toast = { id: string; title: string; body: string; tone: 'red' | 'orange' | 'yellow' | 'lav'; to?: string; at: number }
const LS_FIRED = 'pmd:fired'
const loadFired = (): string[] => { try { return JSON.parse(sessionStorage.getItem(LS_FIRED) || '[]') } catch { return [] } }
const saveFired = (s: Set<string>) => { try { sessionStorage.setItem(LS_FIRED, JSON.stringify([...s].slice(-500))) } catch { /* ignore */ } }

export default function Toasts() {
  const { now, store, user, simulated } = useApp()
  const [toasts, setToasts] = useState<Toast[]>([])
  const fired = useRef(new Set<string>(loadFired()))
  const seenNotes = useRef<Set<string> | null>(null)

  const push = (t: Omit<Toast, 'at'>) => {
    setToasts(list => [{ ...t, at: Date.now() }, ...list.filter(x => x.id !== t.id)].slice(0, 4))
    try { navigator.vibrate?.(t.tone === 'red' ? [250, 100, 250] : [150]) } catch { /* non supporté */ }
    window.setTimeout(() => setToasts(list => list.filter(x => x.id !== t.id)), TTL)
  }

  // Séquences du jour
  useEffect(() => {
    const today = mParts(now).date
    sequencesOfDay(today).forEach(s => {
      const all = s.checklist.length > 0 && s.checklist.every(c => store.checks[ckId(c.id)]?.done)
      const st = seqStatus(s, now, all)
      if (!st.badge) return
      if (st.badge === 'T-60' && s.level !== 'critique') return
      if (st.state === 'now' && st.minsLeft < 0) return
      // MAINTENANT : seulement dans les 5 premières minutes (évite une alerte à l'ouverture en plein milieu)
      if (st.badge === 'MAINTENANT' && st.minsTo < -5) return
      const key = `${simulated ? 'sim:' : ''}${s.id}:${st.badge}`
      if (fired.current.has(key)) return
      fired.current.add(key); saveFired(fired.current)
      const label = st.badge === 'MAINTENANT' ? 'MAINTENANT' : st.badge === 'T-15' ? `dans ${fmtMins(st.minsTo)}` : st.badge === 'T-30' ? `dans ${fmtMins(st.minsTo)}` : `dans ${fmtMins(st.minsTo)} · critique`
      push({ id: key, tone: st.badge === 'MAINTENANT' || st.badge === 'T-60' ? 'red' : st.badge === 'T-15' ? 'orange' : 'yellow', title: `${s.start} · ${label}`, body: `${s.title}${s.lieu ? ' — ' + s.lieu : ''}`, to: '/programme' })
    })
  }, [now, store.checks, simulated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Panne du suivi automatique (Flightradar24 et secours AirLabs en échec) : un seul flash par session.
  const apiError = useApiError()
  useEffect(() => {
    if (!apiError || fired.current.has('vol:api')) return
    fired.current.add('vol:api'); saveFired(fired.current)
    push({ id: 'vol:api', tone: 'orange', title: '✈️ Suivi automatique des vols indisponible', body: `${apiError} — utiliser les liens Flightradar24 sur chaque vague (Transport).`, to: '/transport' })
  }, [apiError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Vols du jour : statut automatique (Flightradar24, sans clé), même fenêtre et même cadence que les badges ETA (cache partagé),
  // jamais en arrière-plan.
  const flightBucket = useRef(new Map<string, string>())
  useEffect(() => {
    const today = mParts(now).date
    const due = waves.filter(w => w.date === today && w.type !== 'programme' && isActive(now, w.date, w.heure))
    let stop = false
    const run = async () => {
      if (document.visibilityState === 'hidden') return
      for (const w of due) {
        for (const code of flightCodes(w.vol)) {
          const st = await fetchStatus(code, w.date, w.heure, w.type === 'depart' ? 'depart' : 'arrivee')
          if (stop || !st) continue
          const delayed = st.status === 'cancelled' || (st.delay || 0) >= 10
          if (!delayed) continue
          const bucket = st.status === 'cancelled' ? 'annule' : String(Math.round((st.delay || 0) / 15))
          if (flightBucket.current.get(code) === bucket) continue
          flightBucket.current.set(code, bucket)
          const eta = st.arrEstimated || st.depActual
          push({ id: `vol:${code}:${bucket}`, tone: 'red', title: `✈️ ${code} · ${statusLabel(st)}${st.delay ? ` +${st.delay} min` : ''}`, body: `${w.type === 'arrivee' ? 'Arrivée' : 'Départ'} prévu ${w.heure}${eta ? ` → estimé ${eta}` : ''} — ${w.vol}`, to: `/transport?d=${w.date}#${w.id}` })
        }
      }
    }
    void run(); const t = setInterval(() => void run(), TTL_FLIGHT)
    return () => { stop = true; clearInterval(t) }
  }, [mParts(now).date, Math.floor(now.getTime() / TTL_FLIGHT)]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notes des autres (alerte / incident)
  useEffect(() => {
    if (seenNotes.current === null) { seenNotes.current = new Set(store.notes.map(n => n.id)); return }
    store.notes.forEach(n => {
      if (seenNotes.current!.has(n.id)) return
      seenNotes.current!.add(n.id)
      if (n.author === user || n.level === 'info') return
      push({ id: 'note:' + n.id, tone: n.level === 'incident' ? 'red' : 'orange', title: `${n.level === 'incident' ? '🚨 INCIDENT' : '⚠️ Alerte'} · ${n.author}`, body: n.text, to: '/' })
    })
  }, [store.notes, user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!toasts.length) return null
  const cls = { red: 'bg-alert-red text-white', orange: 'bg-alert-orange text-ink', yellow: 'bg-alert-yellow text-ink', lav: 'bg-lavender text-ink' }
  return (
    <div className="fixed inset-x-0 top-0 z-50 safe-top pointer-events-none">
      <div className="max-w-2xl mx-auto px-3 pt-2 space-y-2">
        {toasts.map(t => (
          <Link key={t.id} to={t.to || '/'} onClick={() => setToasts(l => l.filter(x => x.id !== t.id))} className={`pointer-events-auto block rounded-xl shadow-lg px-4 py-3 ${cls[t.tone]} animate-[toast-in_.25s_ease-out]`}>
            <div className="text-xs font-bold uppercase tracking-wide opacity-90">🔔 {t.title}</div>
            <div className="text-sm font-semibold leading-snug">{t.body}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
