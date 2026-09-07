// Suivi des vols : liens externes (aucune donnée chargée) + statut automatique optionnel (AirLabs, clé VITE_AIRLABS_KEY).
import { useEffect, useState } from 'react'

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

export type FlightStatus = { code: string; status: string; depSched?: string; depActual?: string; arrSched?: string; arrEstimated?: string; delay?: number; fetchedAt: number }
// Clé, par ordre de priorité : saisie sur l'appareil (Plus → Réglages), configuration partagée Supabase (table config,
// clé « airlabs_key » → automatique sur tous les téléphones), variable de build VITE_AIRLABS_KEY.
import { getState } from './store'
export const AIRLABS_LS = 'pmd:airlabs'
const envKey = (import.meta.env.VITE_AIRLABS_KEY as string | undefined) || ''
const readKey = () => { try { return (localStorage.getItem(AIRLABS_LS) || getState().config.airlabs_key || envKey).trim() } catch { return envKey } }
let KEY = readKey()
export const setAirlabsKey = (k: string) => { try { if (k.trim()) localStorage.setItem(AIRLABS_LS, k.trim()); else localStorage.removeItem(AIRLABS_LS) } catch { /* ignore */ } KEY = readKey(); cache.clear() }
export const hasLiveKey = () => { KEY = readKey(); return !!KEY }
export const LIVE_ENABLED = !!KEY
const cache = new Map<string, FlightStatus | null>()
const TTL = 10 * 60_000
const hm = (s?: string | null) => (s ? s.slice(11, 16) : undefined)

export async function fetchStatus(code: string): Promise<FlightStatus | null> {
  KEY = readKey()
  const hit = cache.get(code)
  if (hit !== undefined && hit && Date.now() - hit.fetchedAt < TTL) return hit
  try {
    const r = await fetch(`https://airlabs.co/api/v9/flight?flight_iata=${encodeURIComponent(code)}&api_key=${KEY}`)
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const d = j?.response
    if (!d) { cache.set(code, null); return null }
    const st: FlightStatus = { code, status: d.status || '', depSched: hm(d.dep_time), depActual: hm(d.dep_actual), arrSched: hm(d.arr_time), arrEstimated: hm(d.arr_estimated || d.arr_actual), delay: typeof d.delayed === 'number' ? d.delayed : undefined, fetchedAt: Date.now() }
    cache.set(code, st); return st
  } catch { return cache.get(code) ?? null }
}

/** Statut en direct d'un vol, uniquement si une clé est configurée et si `active` (vol du jour, dans la fenêtre utile). */
export function useFlightStatus(code: string | null, active: boolean) {
  const [st, setSt] = useState<FlightStatus | null>(null)
  useEffect(() => {
    if (!hasLiveKey() || !code || !active) return
    let stop = false
    const run = () => { void fetchStatus(code).then(s => { if (!stop) setSt(s) }) }
    run(); const t = setInterval(run, TTL)
    return () => { stop = true; clearInterval(t) }
  }, [code, active])
  return st
}
export const statusLabel = (s: FlightStatus) => ({ scheduled: 'prévu', active: 'en vol', landed: 'atterri', cancelled: 'ANNULÉ', diverted: 'dérouté', delayed: 'retardé' } as Record<string, string>)[s.status] || s.status
