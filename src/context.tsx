import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import * as store from './lib/store'
import type { NoteLevel, StoreState } from './lib/store'
import type { Sequence } from './lib/types'

type Ctx = {
  user: string; setUser: (u: string) => void
  now: Date; simulated: boolean; setSimulated: (d: Date | null) => void
  store: StoreState
  toggle: (itemId: string, done: boolean) => void
  addNote: (text: string, level: NoteLevel, itemId?: string | null) => void
}
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState(() => localStorage.getItem('pmd:user') || '')
  const [sim, setSim] = useState<{ base: number; at: number } | null>(null)
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setTick(Date.now()), 10_000); return () => clearInterval(t) }, [])
  useEffect(() => { void store.initStore() }, [])
  const st = useSyncExternalStore(store.subscribe, store.getState)
  const now = useMemo(() => (sim ? new Date(sim.base + (tick - sim.at)) : new Date(tick)), [sim, tick])
  const setUser = useCallback((u: string) => { localStorage.setItem('pmd:user', u); setUserState(u) }, [])
  const setSimulated = useCallback((d: Date | null) => { const t = Date.now(); setTick(t); setSim(d ? { base: d.getTime(), at: t } : null) }, [])
  const toggle = useCallback((itemId: string, done: boolean) => store.toggleCheck(itemId, done, user || '?'), [user])
  const addNote = useCallback((text: string, level: NoteLevel, itemId: string | null = null) => store.addNote(text, level, user || '?', itemId), [user])
  const value = useMemo<Ctx>(() => ({ user, setUser, now, simulated: !!sim, setSimulated, store: st, toggle, addNote }), [user, setUser, now, sim, setSimulated, st, toggle, addNote])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() { const c = useContext(AppCtx); if (!c) throw new Error('AppProvider manquant'); return c }
export function useCheck(itemId: string) {
  const { store: st, toggle } = useApp()
  const c = st.checks[itemId]
  return { done: !!c?.done, by: c?.done_by || '', at: c?.done_at || '', toggle: () => toggle(itemId, !c?.done) }
}
export const ckId = (checklistItemId: string) => `ck:${checklistItemId}`
export function useChecklistDone(seq: Sequence) {
  const { store: st } = useApp()
  if (!seq.checklist.length) return { done: 0, total: 0, all: false }
  const done = seq.checklist.filter(c => st.checks[ckId(c.id)]?.done).length
  return { done, total: seq.checklist.length, all: done === seq.checklist.length }
}
