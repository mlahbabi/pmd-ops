import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { transport, wavesOfDay } from '../lib/data'
import { dayLabel, jOf, mParts } from '../lib/time'
import { useApp } from '../context'
import WaveCard from '../components/WaveCard'
import { Chips, Empty, PageTitle, Section } from '../components/ui'

const DAYS_T = [...new Set(transport.vagues.map(w => w.date))].sort()

export default function Transport() {
  const { now } = useApp()
  const [sp, setSp] = useSearchParams()
  const { hash } = useLocation()
  const today = mParts(now).date
  const initial = sp.get('d') && DAYS_T.includes(sp.get('d')!) ? sp.get('d')! : DAYS_T.includes(today) ? today : today < DAYS_T[0] ? DAYS_T[0] : DAYS_T[DAYS_T.length - 1]
  const [day, setDay] = useState(initial)
  const [rules, setRules] = useState(false)
  useEffect(() => { const d = sp.get('d'); if (d && DAYS_T.includes(d) && d !== day) setDay(d) }, [sp]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hash) { const el = document.getElementById(hash.slice(1)); el?.scrollIntoView({ block: 'start', behavior: 'smooth' }) } }, [hash, day])
  const waves = useMemo(() => wavesOfDay(day), [day])
  const arr = waves.filter(w => w.type === 'arrivee'), dep = waves.filter(w => w.type === 'depart'), prog = waves.filter(w => w.type === 'programme')
  const flotte = transport.flotte.find(f => f.date === day)
  const openId = hash.slice(1)
  return (
    <div>
      <PageTitle title="Transport" sub="Dispatch V4 du 03/09 · vagues aéroport + transferts programme" right={<a className="btn text-xs min-h-9 px-3" href={`tel:${transport.contactDispatch.tel}`}>📞 {transport.contactDispatch.nom}</a>} />
      <button type="button" onClick={() => setRules(r => !r)} className="w-full card border-alert-orange/50 px-3 py-2 text-left text-sm mb-2">
        <b>Règles d'or</b> · dépose aéroport H-2 minimum · pancarte « Partners’ Meeting » · ne jamais partir incomplet sans validation MRCO {rules ? '▾' : '▸'}
        {rules && <ul className="mt-2 space-y-1 text-xs text-ivory/85">{transport.regles.map(r => <li key={r}>• {r}</li>)}</ul>}
      </button>
      <Chips items={DAYS_T} value={day} onChange={d => { setDay(d); setSp({ d }) }} render={d => <span>{d.slice(8, 10)}/{d.slice(5, 7)}<span className="ml-1 text-[10px] opacity-70">{jOf(d)}</span></span>} />
      <h2 className="font-semibold text-lg my-2">{dayLabel(day)}</h2>
      {flotte && <div className="card p-3 text-sm mb-4"><b>Flotte du jour</b> · {flotte.pax} pax · {flotte.mouvements}<div className="text-lavender mt-0.5">{flotte.flotte}</div></div>}
      <Section title={`Arrivées · ${arr.length}`}>{arr.length ? <div className="space-y-2">{arr.map(w => <WaveCard key={w.id} wave={w} defaultOpen={w.id === openId} />)}</div> : <Empty>Aucune arrivée.</Empty>}</Section>
      <Section title={`Départs · ${dep.length}`}>{dep.length ? <div className="space-y-2">{dep.map(w => <WaveCard key={w.id} wave={w} defaultOpen={w.id === openId} />)}</div> : <Empty>Aucun départ aéroport.</Empty>}</Section>
      <Section title={`Transferts programme · ${prog.length}`}>{prog.length ? <div className="space-y-2">{prog.map(w => <WaveCard key={w.id} wave={w} defaultOpen={w.id === openId} />)}</div> : <Empty>Aucun transfert groupe.</Empty>}</Section>
      <Section title="Hors dispatch">
        <ul className="card p-3 text-sm space-y-1">{transport.horsDispatch.map(h => <li key={h}>• {h}</li>)}</ul>
      </Section>
      <Section title="Synthèse flotte">
        <div className="card overflow-hidden text-xs">
          {transport.flotte.map(f => <div key={f.date} className={`grid grid-cols-[52px_40px_1fr] gap-2 px-3 py-1.5 border-b border-line last:border-0 ${f.date === day ? 'bg-ink-3' : ''}`}><b>{f.date.slice(8, 10)}/{f.date.slice(5, 7)}</b><span>{f.pax}</span><span><span className="text-lavender">{f.flotte}</span> — {f.mouvements}</span></div>)}
        </div>
      </Section>
    </div>
  )
}
