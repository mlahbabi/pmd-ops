// Suivi des vols : liens externes + statut automatique.
// Source principale : Flightradar24 (point de données du site, sans clé, CORS ouvert — non officiel, peut changer sans préavis).
// Secours : AirLabs si une clé est configurée (compte gratuit, 1 000 requêtes / mois).
import { useEffect, useState, useSyncExternalStore } from 'react'
import { mParts, toDate } from './time'

/** Extrait les numéros de vol d'un libellé (« AF1876 (CDG) ×16 + TO3018 (Orly) ×2 » → AF1876, TO3018). */
export function flightCodes(label: string | null | undefined): string[] {
  if (!label) return []
  const out: string[] = []
  const re = /\b([A-Z][A-Z0-9]\d{2,4}[A-Z]?)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(label))) { if (!out.includes(m[1])) out.push(m[1]) }
  return out
}
export const fr24Url = (code: string) => `https://www.flightradar24.com/data/flights/${code.toLowerCase()}`
export const flightAwareUrl = (code: string) => `https://www.flightaware.com/live/flight/${code.toUpperCase()}`

export type FlightType = 'arrivee' | 'depart'
export type FlightStatus = { code: string; status: string; source: 'fr24' | 'airlabs'; depSched?: string; depEstimated?: string; depActual?: string; arrSched?: string; arrEstimated?: string; delay?: number; fetchedAt: number }
/** Heure utile pour l'équipe : arrivée → estimée/réelle d'atterrissage ; départ → décollage estimé/réel. */
export const addMin = (t: string, d: number) => { const m = ((Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + d) % 1440 + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
/** Heure utile : estimée / réelle si connue, sinon horaire prévu décalé du retard annoncé, sinon horaire prévu. */
export const etaOf = (s: FlightStatus, type: FlightType) => {
  const est = type === 'arrivee' ? s.arrEstimated : s.depActual || s.depEstimated
  if (est) return est
  const sched = type === 'arrivee' ? s.arrSched : s.depSched
  return sched && s.delay ? addMin(sched, s.delay) : sched
}
/** Écart en minutes entre « HH:MM » réel et « HH:MM » prévu (positif = retard). */
export function deltaMin(eta: string, sched: string) {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  let d = m(eta) - m(sched); if (d > 720) d -= 1440; if (d < -720) d += 1440; return d
}

// Fenêtre de suivi automatique : de 5 h avant à 1 h après l'horaire prévu, le jour même (le retard au départ
// d'un Paris → Marrakech se voit ~3 h 30 avant l'atterrissage). Rafraîchi toutes les 5 min, jamais en arrière-plan.
export const ACTIVE_BEFORE_MS = 5 * 3600_000
export const ACTIVE_AFTER_MS = 1 * 3600_000
export const ACTIVE_LABEL = 'de 5 h avant à 1 h après l\'horaire'
export const isActive = (now: Date, date: string, heure: string) => {
  const ref = toDate(date, heure).getTime() - now.getTime()
  return mParts(now).date === date && ref < ACTIVE_BEFORE_MS && ref > -ACTIVE_AFTER_MS
}
export const TTL = 5 * 60_000

// ---- Clé AirLabs (secours) : saisie sur l'appareil (Plus → Réglages), configuration partagée Supabase, variable de build.
import { getState } from './store'
export const AIRLABS_LS = 'pmd:airlabs'
const envKey = (import.meta.env.VITE_AIRLABS_KEY as string | undefined) || '09a1fc3f-c1ef-4336-9b26-2961d0cdc229'
const readKey = () => { try { return (localStorage.getItem(AIRLABS_LS) || getState().config.airlabs_key || envKey).trim() } catch { return envKey } }
let KEY = readKey()
export const setAirlabsKey = (k: string) => { try { if (k.trim()) localStorage.setItem(AIRLABS_LS, k.trim()); else localStorage.removeItem(AIRLABS_LS) } catch { /* ignore */ } KEY = readKey(); cache.clear(); setApiError(null); airlabsErrorAt = 0 }
/** Le suivi automatique est toujours disponible (Flightradar24 sans clé). */
export const hasLiveKey = () => true
export const hasAirlabsKey = () => { KEY = readKey(); return !!KEY }
export const LIVE_ENABLED = true
const cache = new Map<string, FlightStatus | null>()

// Dernière erreur du suivi automatique (les deux sources en échec) : visible dans l'app au lieu d'un silence.
const AIRLABS_ERRORS: Record<string, string> = { month_limit_exceeded: 'quota mensuel AirLabs dépassé', unknown_api_key: 'clé AirLabs invalide', not_found: 'clé AirLabs invalide' }
let apiError: string | null = null
let airlabsErrorAt = 0
const AIRLABS_BACKOFF = 30 * 60_000
const errListeners = new Set<() => void>()
const setApiError = (e: string | null) => { if (e === apiError) return; apiError = e; errListeners.forEach(l => l()) }
export const getApiError = () => apiError
/** Erreur courante du suivi automatique (null si tout va bien), réactive. */
export function useApiError() { return useSyncExternalStore(l => { errListeners.add(l); return () => { errListeners.delete(l) } }, getApiError, getApiError) }

// ---- Flightradar24 : liste des rotations d'un numéro de vol (futures et passées), on retient celle dont l'horaire
// prévu est le plus proche de l'horaire de la vague. Heures converties en heure du Maroc.
const fmtMa = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hour12: false })
const hmEpoch = (e?: number | null) => (e ? fmtMa.format(new Date(e * 1000)).replace('h', ':') : undefined)
type Fr24Item = { identification?: { number?: { default?: string } }; status?: { live?: boolean; text?: string; generic?: { status?: { text?: string; type?: string } } }; time?: { scheduled?: { departure?: number | null; arrival?: number | null }; estimated?: { departure?: number | null; arrival?: number | null }; real?: { departure?: number | null; arrival?: number | null }; other?: { eta?: number | null } } }
async function fetchFr24(code: string, ref: Date, type: FlightType): Promise<FlightStatus | null> {
  const r = await fetch(`https://api.flightradar24.com/common/v1/flight/list.json?query=${encodeURIComponent(code)}&fetchBy=flight&limit=25`)
  if (!r.ok) throw new Error(`FR24 ${r.status}`)
  const j = await r.json()
  const data: Fr24Item[] = j?.result?.response?.data || []
  if (!data.length) return null
  const refS = ref.getTime() / 1000
  const key = (x: Fr24Item) => (type === 'arrivee' ? x.time?.scheduled?.arrival : x.time?.scheduled?.departure) || 0
  const best = data.slice().sort((a, b) => Math.abs(key(a) - refS) - Math.abs(key(b) - refS))[0]
  if (!best || Math.abs(key(best) - refS) > 12 * 3600) return null
  const t = best.time || {}
  const g = (best.status?.generic?.status?.text || '').toLowerCase()
  const depSched = t.scheduled?.departure, arrSched = t.scheduled?.arrival
  const depReal = t.real?.departure, arrReal = t.real?.arrival
  const arrEst = arrReal || t.estimated?.arrival || (best.status?.live ? t.other?.eta : null)
  const depEst = t.estimated?.departure
  let status = 'scheduled'
  if (g === 'canceled' || g === 'cancelled') status = 'cancelled'
  else if (g === 'diverted') status = 'diverted'
  else if (g === 'landed' || arrReal) status = 'landed'
  else if (best.status?.live || depReal) status = 'active'
  else if (depEst && depSched && depEst - depSched >= 10 * 60) status = 'delayed'
  let delay: number | undefined
  if (arrEst && arrSched) delay = Math.round((arrEst - arrSched) / 60)
  else if ((depReal || depEst) && depSched) delay = Math.round(((depReal || depEst)! - depSched) / 60)
  return { code, status, source: 'fr24', depSched: hmEpoch(depSched), depEstimated: hmEpoch(depEst), depActual: hmEpoch(depReal), arrSched: hmEpoch(arrSched), arrEstimated: hmEpoch(arrEst), delay, fetchedAt: Date.now() }
}

// ---- AirLabs (secours, heures locales « YYYY-MM-DD HH:MM »)
const hm = (s?: string | null) => (s ? s.slice(11, 16) : undefined)
async function fetchAirlabs(code: string): Promise<FlightStatus | null> {
  KEY = readKey()
  if (!KEY || (airlabsErrorAt && Date.now() - airlabsErrorAt < AIRLABS_BACKOFF)) return null
  const r = await fetch(`https://airlabs.co/api/v9/flight?flight_iata=${encodeURIComponent(code)}&api_key=${KEY}`)
  if (!r.ok) throw new Error(String(r.status))
  const j = await r.json()
  if (j?.error) { airlabsErrorAt = Date.now(); throw new Error(AIRLABS_ERRORS[j.error.code] || `AirLabs : ${j.error.message || j.error.code || 'erreur'}`) }
  const d = j?.response
  if (!d) return null
  return { code, status: d.status || '', source: 'airlabs', depSched: hm(d.dep_time), depEstimated: hm(d.dep_estimated), depActual: hm(d.dep_actual), arrSched: hm(d.arr_time), arrEstimated: hm(d.arr_actual || d.arr_estimated), delay: typeof d.delayed === 'number' ? d.delayed : undefined, fetchedAt: Date.now() }
}

/** Statut d'un vol pour une vague donnée (date + heure prévue). Cache 5 min par vol et par jour. */
export async function fetchStatus(code: string, date: string, heure: string, type: FlightType = 'arrivee'): Promise<FlightStatus | null> {
  const ck = `${code}|${date}`
  const hit = cache.get(ck)
  if (hit !== undefined && hit && Date.now() - hit.fetchedAt < TTL) return hit
  const ref = toDate(date, heure)
  try {
    const st = await fetchFr24(code, ref, type)
    if (st) { setApiError(null); cache.set(ck, st); return st }
  } catch { /* on tente le secours */ }
  try {
    const st = await fetchAirlabs(code)
    if (st) { setApiError(null); cache.set(ck, st); return st }
    if (!hit) setApiError('Flightradar24 inaccessible' + (hasAirlabsKey() ? ', AirLabs sans réponse' : ''))
  } catch (e) {
    setApiError(`Flightradar24 inaccessible — secours AirLabs : ${e instanceof Error ? e.message : 'erreur'}`)
  }
  return hit ?? null
}

/** Statut en direct d'un vol, si `active` (vol du jour, dans la fenêtre utile).
 *  Pas de requête tant que l'app est en arrière-plan ; rafraîchi au retour au premier plan. */
export function useFlightStatus(code: string | null, active: boolean, date?: string, heure?: string, type: FlightType = 'arrivee') {
  const [st, setSt] = useState<FlightStatus | null>(null)
  useEffect(() => {
    if (!code || !active || !date || !heure) return
    let stop = false
    const run = () => { if (document.visibilityState === 'hidden') return; void fetchStatus(code, date, heure, type).then(s => { if (!stop) setSt(s) }) }
    run(); const t = setInterval(run, TTL)
    document.addEventListener('visibilitychange', run)
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', run) }
  }, [code, active, date, heure, type])
  return st
}
export const statusLabel = (s: FlightStatus) => ({ scheduled: 'prévu', active: 'en vol', landed: 'atterri', cancelled: 'ANNULÉ', diverted: 'dérouté', delayed: 'retardé' } as Record<string, string>)[s.status] || s.status
