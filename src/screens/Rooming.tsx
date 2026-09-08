// Desk d'accueil & rooming list : arrivées du jour par vol, liste des chambres par nuit, départs du jour.
// Mêmes coches partagées que la fiche personne (pa:/pd:) — aucune redondance de saisie.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context'
import { people, wavesOfDay, sleepsOn, participantsFile } from '../lib/data'
import { DAYS, ddmm, mParts } from '../lib/time'
import type { Person, Wave } from '../lib/types'
import { Badge, CheckRow, Chips, Empty, PageTitle, Section, VipBadge, Warn } from '../components/ui'
import EtaBadge from '../components/EtaBadge'
import { flightCodes } from '../lib/flights'

const residents = people.filter(p => p.arrivee && p.depart).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
const nightOf = (day: string) => `${ddmm(day).slice(0, 2)}→${String(Number(day.slice(8, 10)) + 1).padStart(2, '0')}`
const NIGHTS = DAYS.filter(d => d !== '2026-09-13')

function Row({ p, check, sub }: { p: Person; check?: { id: string; label: string }; sub: string }) {
  const label = (
    <span className="flex items-center gap-2 flex-wrap">
      <Link to={`/personnes/${p.id}`} className="font-semibold">{p.nom} <span className="font-normal">{p.prenom}</span></Link>
      <VipBadge vip={p.vip} />
      {p.regime && <Badge tone="red">🥗 {p.regime}</Badge>}
      {p.a_confirmer?.length ? <Warn /> : null}
    </span>
  )
  if (check) return <CheckRow itemId={check.id} label={label} sub={sub} />
  return <div className="px-3 py-2 border-b border-line last:border-0"><div>{label}</div><div className="text-xs text-warm">{sub}</div></div>
}
const stay = (p: Person) => `${p.arrivee} → ${p.depart} · ${p.nuitees} nuit${(p.nuitees || 0) > 1 ? 's' : ''}${p.note_hotel ? ' · 🏨 ' + p.note_hotel : ''}`

export default function Rooming() {
  const { now } = useApp()
  const today = mParts(now).date
  const [view, setView] = useState<'arrivees' | 'rooming' | 'departs'>('arrivees')
  const [day, setDay] = useState(DAYS.includes(today) ? today : today < DAYS[0] ? DAYS[0] : DAYS[DAYS.length - 1])
  const [night, setNight] = useState<string>(DAYS.includes(today) && today !== '2026-09-13' ? today : '2026-09-09')
  const [q, setQ] = useState('')

  const arrivals = useMemo(() => residents.filter(p => p.arrivee === ddmm(day)), [day])
  const departures = useMemo(() => residents.filter(p => p.depart === ddmm(day)), [day])
  const waves = wavesOfDay(day)
  const groupBy = (list: Person[], type: 'arrivee' | 'depart') => {
    const ws = waves.filter(w => w.type === type)
    const groups: { wave: Wave | null; persons: Person[] }[] = ws.map(w => ({ wave: w, persons: list.filter(p => w.pax.includes(p.id)) })).filter(g => g.persons.length)
    const inWave = new Set(groups.flatMap(g => g.persons.map(p => p.id)))
    const rest = list.filter(p => !inWave.has(p.id))
    if (rest.length) groups.push({ wave: null, persons: rest })
    return groups
  }
  const occupied = residents.filter(p => sleepsOn(p, day)).length
  const nightList = residents.filter(p => sleepsOn(p, night) && (!q || `${p.nom} ${p.prenom}`.toLowerCase().includes(q.toLowerCase())))
  const nightsTotal = residents.reduce((s, p) => s + (p.nuitees || 0), 0)

  return (
    <div>
      <PageTitle title="Desk & Rooming" sub={`Radisson Blu Carré Eden · rooming ${participantsFile.version.split(' — ')[1]} · ${residents.length} hébergés · ${nightsTotal} nuitées`} />
      <Chips items={['arrivees', 'rooming', 'departs'] as const} value={view} onChange={setView} render={v => v === 'arrivees' ? '🛬 Arrivées' : v === 'rooming' ? '🛏️ Rooming' : '🛫 Départs'} />

      {view !== 'rooming' && (
        <>
          <Chips items={DAYS} value={day} onChange={setDay} render={d => <span>{ddmm(d)}<span className="ml-1 text-[10px] opacity-70">{view === 'arrivees' ? residents.filter(p => p.arrivee === ddmm(d)).length : residents.filter(p => p.depart === ddmm(d)).length}</span></span>} />
          <div className="card p-3 my-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
            <span>🛬 <b>{arrivals.length}</b> arrivée{arrivals.length > 1 ? 's' : ''}</span>
            <span>🛫 <b>{departures.length}</b> départ{departures.length > 1 ? 's' : ''}</span>
            <span>🛏️ <b>{occupied}</b> chambres la nuit du {nightOf(day)}</span>
          </div>
        </>
      )}

      {view === 'arrivees' && (arrivals.length ? groupBy(arrivals, 'arrivee').map((g, i) => (
        <Section key={g.wave?.id || 'route'} title={g.wave ? <span>{g.wave.heure} · {g.wave.vol} · {g.persons.length} pax</span> : <span>Par la route / autonomes · {g.persons.length} pax</span>}
          right={g.wave ? <span className="flex gap-1">{flightCodes(g.wave.vol).map(c => <EtaBadge key={c} code={c} date={g.wave!.date} heure={g.wave!.heure} type="arrivee" />)}</span> : undefined}>
          {g.wave?.note && i >= 0 && <div className="text-xs text-warm px-1 mb-1">{g.wave.note}</div>}
          <div className="space-y-1">
            {g.persons.map(p => <Row key={p.id} p={p} check={{ id: `pa:${p.id}`, label: 'Arrivé' }} sub={`${stay(p)}${!g.wave && p.arr?.mode && p.arr.mode !== 'vol' ? ' · ' + p.arr.mode : ''}${!g.wave && p.arr?.mode === 'vol' ? ` · ${p.arr.vol} ${p.arr.heure || ''} (sans transfert MRCO)` : ''}`} />)}
          </div>
        </Section>
      )) : <Empty>Aucune arrivée ce jour.</Empty>)}

      {view === 'departs' && (departures.length ? groupBy(departures, 'depart').map(g => (
        <Section key={g.wave?.id || 'auto'} title={g.wave ? <span>Prise en charge {g.wave.heure} · {g.wave.vol} · {g.persons.length} pax</span> : <span>Départs autonomes / sans transfert · {g.persons.length} pax</span>}
          right={g.wave ? <span className="text-xs text-warm">{g.wave.origine}</span> : undefined}>
          <div className="space-y-1">
            {g.persons.map(p => <Row key={p.id} p={p} check={{ id: `pd:${p.id}`, label: 'Parti' }} sub={`Check-out ${p.depart}${p.dep?.vol ? ` · ${p.dep.vol} ${p.dep.heure || ''} → ${p.dep.vers || ''}` : p.dep?.mode ? ` · ${p.dep.mode}` : ''}`} />)}
          </div>
        </Section>
      )) : <Empty>Aucun départ ce jour.</Empty>)}

      {view === 'rooming' && (
        <>
          <Chips items={NIGHTS} value={night} onChange={setNight} render={d => <span>Nuit {nightOf(d)}<span className="ml-1 text-[10px] opacity-70">{residents.filter(p => sleepsOn(p, d)).length}</span></span>} />
          <input className="input my-2" placeholder="Rechercher un nom…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="text-xs text-warm px-1 mb-1">{nightList.length} chambre{nightList.length > 1 ? 's' : ''} occupée{nightList.length > 1 ? 's' : ''} la nuit du {nightOf(night)} · chambres Supérieures single, petit-déjeuner inclus</div>
          <div className="card overflow-hidden">
            {nightList.map(p => <Row key={p.id} p={p} sub={stay(p)} />)}
            {!nightList.length && <div className="p-3 text-warm text-sm">Personne.</div>}
          </div>
          <div className="card p-3 mt-3 text-xs">
            <div className="font-semibold mb-1">Chambres par nuit</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">{NIGHTS.map(d => <span key={d}><span className="text-warm">{nightOf(d)}</span> <b>{residents.filter(p => sleepsOn(p, d)).length}</b></span>)}</div>
          </div>
        </>
      )}
    </div>
  )
}
