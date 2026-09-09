// Suivi des vols : liens externes (aucune donnée chargée) + statut automatique optionnel (AirLabs, clé VITE_AIRLABS_KEY).
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

export type FlightStatus = { code: string; status: string; depSched?: string; depEstimated?: string; depActual?: string; arrSched?: string; arrEstimated?: string; delay?: number; fetchedAt: number }
/** Heure utile pour l'équipe : arrivée → estimée/réelle d'atterrissage ; départ → décollage estimé/réel. */
export const addMin = (t: string, d: number) => { const m = ((Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + d) % 1440 + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
/** Heure utile : estimée / réelle si connue, sinon horaire prévu décalé du retard annoncé, sinon horaire prévu. */
export const etaOf = (s: FlightStatus, type: 'arrivee' | 'depart') => {
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

// Fenêtre de suivi automatique : de 2 h 30 avant à 30 min après l'horaire prévu, le jour même.
// Budget : compte AirLabs gratuit = 1 000 requêtes / mois. 24 vols restent à suivre sur 4 téléphones →
// ≤ 10 requêtes par vol et par téléphone : fenêtre 3 h, rafraîchissement toutes les 20 min, pause quand l'app est en arrière-plan.
export const ACTIVE_BEFORE_MS = 2.5 * 3600_000
export const ACTIVE_AFTER_MS = 0.5 * 3600_000
export const ACTIVE_LABEL = 'de 2 h 30 avant à 30 min après l\'horaire'
export const isActive = (now: Date, date: string, heure: string) => {
  const ref = toDate(date, heure).getTime() - now.getTime()
  return mParts(now).date === date && ref < ACTIVE_BEFORE_MS && ref > -ACTIVE_AFTER_MS
}

// Clé, par ordre de priorité : saisie sur l'appareil (Plus → Réglages), configuration partagée Supabase (table config,
// clé « airlabs_key » → automatique sur tous les téléphones), variable de build VITE_AIRLABS_KEY.
import { getState } from './store'
export const AIRLABS_LS = 'pmd:airlabs'
// Clé AirLabs de MRCO (compte gratuit, 1 000 requêtes/mois) — outil interne, remplaçable par VITE_AIRLABS_KEY ou la table config.
const envKey = (import.meta.env.VITE_AIRLABS_KEY as string | undefined) || '09a1fc3f-c1ef-4336-9b26-2961d0cdc229'
const readKey = () => { try { return (localStorage.getItem(AIRLABS_LS) || getState().config.airlabs_key || envKey).trim() } catch { return envKey } }
let KEY = readKey()
export const setAirlabsKey = (k: string) => { try { if (k.trim()) localStorage.setItem(AIRLABS_LS, k.trim()); else localStorage.removeItem(AIRLABS_LS) } catch { /* ignore */ } KEY = readKey(); cache.clear(); setApiError(null); errorAt = 0 }
export const hasLiveKey = () => { KEY = readKey(); return !!KEY }
export const LIVE_ENABLED = !!KEY
const cache = new Map<string, FlightStatus | null>()
export const TTL = 20 * 60_000
const hm = (s?: string | null) => (s ? s.slice(11, 16) : undefined)

// Dernière erreur de l'API (quota dépassé, clé invalide…) : visible dans l'app au lieu d'un silence.
const ERRORS: Record<string, string> = { month_limit_exceeded: 'quota mensuel AirLabs dépassé', unknown_api_key: 'clé AirLabs invalide', not_found: 'clé AirLabs invalide' }
let apiError: string | null = null
let errorAt = 0
const ERROR_BACKOFF = 30 * 60_000
const errListeners = new Set<() => void>()
const setApiError = (e: string | null) => { if (e === apiError) return; apiError = e; errListeners.forEach(l => l()) }
export const getApiError = () => apiError
/** Erreur courante du suivi automatique (null si tout va bien), réactive. */
export function useApiError() { return useSyncExternalStore(l => { errListeners.add(l); return () => { errListeners.delete(l) } }, getApiError, getApiError) }

export async function fetchStatus(code: string): Promise<FlightStatus | null> {
  KEY = readKey()
  const hit = cache.get(code)
  if (hit !== undefined && hit && Date.now() - hit.fetchedAt < TTL) return hit
  // Quota dépassé ou clé invalide : on n'insiste pas pendant 30 min (chaque appel compterait).
  if (apiError && Date.now() - errorAt < ERROR_BACKOFF) return hit ?? null
  try {
    const r = await fetch(`https://airlabs.co/api/v9/flight?flight_iata=${encodeURIComponent(code)}&api_key=${KEY}`)
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    if (j?.error) { errorAt = Date.now(); setApiError(ERRORS[j.error.code] || `AirLabs : ${j.error.message || j.error.code || 'erreur'}`); return hit ?? null }
    setApiError(null)
    const d = j?.response
    if (!d) { cache.set(code, null); return null }
    const st: FlightStatus = { code, status: d.status || '', depSched: hm(d.dep_time), depEstimated: hm(d.dep_estimated), depActual: hm(d.dep_actual), arrSched: hm(d.arr_time), arrEstimated: hm(d.arr_actual || d.arr_estimated), delay: typeof d.delayed === 'number' ? d.delayed : undefined, fetchedAt: Date.now() }
    cache.set(code, st); return st
  } catch (e) {
    // Réseau / HTTP : erreur signalée mais courte, sans bloquer les prochains essais.
    if (!apiError) setApiError(`suivi indisponible (${e instanceof Error ? e.message : 'réseau'})`)
    return cache.get(code) ?? null
  }
}

/** Statut en direct d'un vol, uniquement si une clé est configurée et si `active` (vol du jour, dans la fenêtre utile).
 *  Pas de requête tant que l'app est en arrière-plan ; rafraîchi au retour au premier plan. */
export function useFlightStatus(code: string | null, active: boolean) {
  const [st, setSt] = useState<FlightStatus | null>(null)
  useEffect(() => {
    if (!hasLiveKey() || !code || !active) return
    let stop = false
    const run = () => { if (document.visibilityState === 'hidden') return; void fetchStatus(code).then(s => { if (!stop) setSt(s) }) }
    run(); const t = setInterval(run, TTL)
    document.addEventListener('visibilitychange', run)
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', run) }
  }, [code, active])
  return st
}
export const statusLabel = (s: FlightStatus) => ({ scheduled: 'prévu', active: 'en vol', landed: 'atterri', cancelled: 'ANNULÉ', diverted: 'dérouté', delayed: 'retardé' } as Record<string, string>)[s.status] || s.status
