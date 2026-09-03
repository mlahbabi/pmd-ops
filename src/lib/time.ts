import type { Sequence } from './types'

export const TZ = 'Africa/Casablanca'
const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Date/heure au Maroc : { date: 'YYYY-MM-DD', time: 'HH:MM', ddmm } */
export function mParts(d: Date) {
  const p: Record<string, string> = {}
  fmt.formatToParts(d).forEach(x => { p[x.type] = x.value })
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, ddmm: `${p.day}/${p.month}` }
}
/** Construit une Date à partir d'une date et d'une heure Maroc (UTC+1 en septembre 2026) */
export const toDate = (date: string, time: string) => new Date(`${date}T${time}:00+01:00`)

export const J: Record<string, string> = {
  '2026-09-03': 'J-5', '2026-09-05': 'J-3', '2026-09-06': 'J-2', '2026-09-07': 'J-1', '2026-09-08': 'J1',
  '2026-09-09': 'J2', '2026-09-10': 'J3', '2026-09-11': 'J4', '2026-09-12': 'J+1', '2026-09-13': 'J+2',
}
export const DAYS = Object.keys(J)
const WD = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
export const ddmm = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`
export function dayShort(date: string) {
  const d = new Date(date + 'T12:00:00+01:00')
  return `${WD[d.getUTCDay()]} ${ddmm(date)}`
}
export const dayLabel = (date: string) => `${dayShort(date)}${J[date] ? ' — ' + J[date] : ''}`
export const jOf = (date: string) => J[date] || ''

export function fmtMins(mins: number) {
  const m = Math.abs(mins)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`
}
export function fmtIso(iso: string) {
  try { const p = mParts(new Date(iso)); return `${p.ddmm} ${p.time}` } catch { return iso }
}

export function seqWindow(s: Sequence) {
  const start = toDate(s.date, s.start)
  let end: Date
  if (s.end) { end = toDate(s.date, s.end); if (end <= start) end = new Date(end.getTime() + 86400000) }
  else end = new Date(start.getTime() + 45 * 60000)
  return { start, end }
}

export type Badge = 'MAINTENANT' | 'T-15' | 'T-30' | 'T-60' | null
export type SeqStatus = { state: 'past' | 'now' | 'future'; minsTo: number; badge: Badge; pinned: boolean; minsLeft: number }
export function seqStatus(s: Sequence, now: Date, checklistDone: boolean): SeqStatus {
  const { start, end } = seqWindow(s)
  const minsTo = Math.round((start.getTime() - now.getTime()) / 60000)
  const minsLeft = Math.round((end.getTime() - now.getTime()) / 60000)
  if (now >= end || (checklistDone && now >= start)) return { state: 'past', minsTo, badge: null, pinned: false, minsLeft }
  if (now >= start) return { state: 'now', minsTo, badge: 'MAINTENANT', pinned: s.level === 'critique', minsLeft }
  const badge: Badge = minsTo <= 15 ? 'T-15' : minsTo <= 30 ? 'T-30' : s.level === 'critique' && minsTo <= 60 ? 'T-60' : null
  return { state: 'future', minsTo, badge, pinned: s.level === 'critique' && minsTo <= 60, minsLeft }
}
