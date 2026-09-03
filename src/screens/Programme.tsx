import { useMemo, useState } from 'react'
import { useApp } from '../context'
import { ownerOf, sequencesOfDay } from '../lib/data'
import { DAYS, dayLabel, jOf, mParts } from '../lib/time'
import SequenceCard from '../components/SequenceCard'
import { Chips, Empty, PageTitle } from '../components/ui'

export default function Programme() {
  const { now, user } = useApp()
  const today = mParts(now).date
  const [day, setDay] = useState(DAYS.includes(today) ? today : today < DAYS[0] ? DAYS[0] : DAYS[DAYS.length - 1])
  const [mine, setMine] = useState(false)
  const [filter, setFilter] = useState<'tous' | 'critique' | 'transport' | 'setup'>('tous')
  const seqs = useMemo(() => sequencesOfDay(day).filter(s => {
    if (mine && (s.owner || ownerOf(s.id)) !== user) return false
    if (filter === 'critique') return s.level === 'critique'
    if (filter === 'transport') return s.type === 'transport'
    if (filter === 'setup') return s.type === 'setup'
    return true
  }), [day, mine, filter, user])
  return (
    <div>
      <PageTitle title="Programme" sub="Timeline minute par minute · 03 → 13/09" />
      <Chips items={DAYS} value={day} onChange={setDay} render={d => <span>{d.slice(8, 10)}/{d.slice(5, 7)}<span className="ml-1 text-[10px] opacity-70">{jOf(d)}</span></span>} />
      <div className="flex flex-wrap gap-2 py-2">
        <button type="button" className={`chip ${mine ? 'chip-on' : ''}`} onClick={() => setMine(m => !m)}>👤 Mon planning</button>
        {(['tous', 'critique', 'transport', 'setup'] as const).map(f => <button key={f} type="button" className={`chip ${filter === f ? 'chip-on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <h2 className="font-semibold text-lg mb-2">{dayLabel(day)}</h2>
      {seqs.length ? <div className="space-y-2">{seqs.map(s => <SequenceCard key={s.id} seq={s} />)}</div>
        : <Empty>{mine ? 'Aucune séquence affectée à ' + user + ' ce jour (affectations dans Plus → Équipe).' : 'Aucune séquence.'}</Empty>}
    </div>
  )
}
