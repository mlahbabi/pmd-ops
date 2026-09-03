// État partagé (coches + fil terrain) : Supabase si configuré, sinon localStorage (« mode local »).
// Dans les deux cas tout est mis en cache localement : lecture hors ligne, file d'attente d'écriture.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type Check = { item_id: string; done: boolean; done_by: string; done_at: string }
export type NoteLevel = 'info' | 'alerte' | 'incident'
export type Note = { id: string; created_at: string; author: string; text: string; item_id: string | null; level: NoteLevel }
export type StoreState = { checks: Record<string, Check>; notes: Note[]; mode: 'supabase' | 'local'; online: boolean; syncing: boolean; queued: number; error: string | null }
type Op = { kind: 'check'; check: Check } | { kind: 'note'; note: Note }

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const LS = { checks: 'pmd:checks', notes: 'pmd:notes', queue: 'pmd:queue' }

function load<T>(k: string, def: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : def } catch { return def } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota */ } }

let queue: Op[] = load<Op[]>(LS.queue, [])
let state: StoreState = {
  checks: load<Record<string, Check>>(LS.checks, {}),
  notes: load<Note[]>(LS.notes, []),
  mode: URL && KEY ? 'supabase' : 'local',
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  queued: queue.length,
  error: null,
}
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const set = (patch: Partial<StoreState>) => { state = { ...state, ...patch }; emit() }
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getState = () => state

let sb: SupabaseClient | null = null
let started = false

export async function initStore() {
  if (started) return; started = true
  window.addEventListener('online', () => { set({ online: true }); void flush() })
  window.addEventListener('offline', () => set({ online: false }))
  if (state.mode === 'supabase' && URL && KEY) {
    try {
      sb = createClient(URL, KEY)
      await refresh()
      sb.channel('pmd-ops')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checks' }, payload => { const c = payload.new as Partial<Check>; if (c && c.item_id) applyCheck(c as Check, false) })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, payload => { const n = payload.new as Note; if (n && n.id) applyNote(n, false) })
        .subscribe()
      void flush()
    } catch (e) {
      set({ error: 'Supabase injoignable — mode local temporaire' })
    }
  }
}

export async function refresh() {
  if (!sb) return
  set({ syncing: true })
  try {
    const { data: cs, error: e1 } = await sb.from('checks').select('*')
    if (e1) throw e1
    const checks = { ...state.checks }
    ;(cs as Check[]).forEach(c => { checks[c.item_id] = c })
    const { data: ns, error: e2 } = await sb.from('notes').select('*').order('created_at', { ascending: false }).limit(300)
    if (e2) throw e2
    const notes = mergeNotes(state.notes, ns as Note[])
    set({ checks, notes, error: null }); save(LS.checks, checks); save(LS.notes, notes)
  } catch (e) {
    set({ error: 'Synchro Supabase impossible — données locales affichées' })
  } finally { set({ syncing: false }) }
}

function mergeNotes(a: Note[], b: Note[]) {
  const m = new Map<string, Note>()
  ;[...a, ...b].forEach(n => m.set(n.id, n))
  return [...m.values()].sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, 300)
}
function applyCheck(c: Check, persist = true) {
  const checks = { ...state.checks, [c.item_id]: c }
  set({ checks }); if (persist || true) save(LS.checks, checks)
}
function applyNote(n: Note, persist = true) {
  const notes = mergeNotes(state.notes, [n])
  set({ notes }); if (persist || true) save(LS.notes, notes)
}
function enqueue(op: Op) { queue.push(op); save(LS.queue, queue); set({ queued: queue.length }) }

let flushing = false
export async function flush() {
  if (!sb || flushing || !queue.length) return
  flushing = true
  try {
    while (queue.length) {
      const op = queue[0]
      const { error } = op.kind === 'check'
        ? await sb.from('checks').upsert(op.check, { onConflict: 'item_id' })
        : await sb.from('notes').upsert(op.note, { onConflict: 'id' })
      if (error) break
      queue.shift(); save(LS.queue, queue); set({ queued: queue.length })
    }
  } finally { flushing = false }
}

export function toggleCheck(item_id: string, done: boolean, done_by: string) {
  const check: Check = { item_id, done, done_by, done_at: new Date().toISOString() }
  applyCheck(check)
  if (state.mode === 'supabase') { enqueue({ kind: 'check', check }); void flush() }
}
export function addNote(text: string, level: NoteLevel, author: string, item_id: string | null = null) {
  const note: Note = { id: crypto.randomUUID(), created_at: new Date().toISOString(), author, text, item_id, level }
  applyNote(note)
  if (state.mode === 'supabase') { enqueue({ kind: 'note', note }); void flush() }
}
export function clearLocalState() {
  localStorage.removeItem(LS.checks); localStorage.removeItem(LS.notes); localStorage.removeItem(LS.queue)
  queue = []; set({ checks: {}, notes: [], queued: 0 })
}
