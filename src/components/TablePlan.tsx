import { useState } from 'react'
import { Link } from 'react-router-dom'
import { people, fullName, isPlaced, civ } from '../lib/data'
import type { Diner, Person } from '../lib/types'
import { Badge, VipBadge } from './ui'

export default function TablePlan({ diner }: { diner: Diner }) {
  const [view, setView] = useState<'table' | 'alpha'>('table')
  const placed = people.filter(p => isPlaced(p[diner.champTable]))
  const absents = people.filter(p => p[diner.champTable] === 'absent')
  const tables = Array.from({ length: diner.tables }, (_, i) => i + 1).map(n => {
    const guests = placed.filter(p => p[diner.champTable] === n).sort((a, b) => (a[diner.champPlace] || 0) - (b[diner.champPlace] || 0))
    const seen = new Map<number, number>()
    guests.forEach(g => { const pl = g[diner.champPlace] || 0; seen.set(pl, (seen.get(pl) || 0) + 1) })
    const dups = new Set([...seen.entries()].filter(([, c]) => c > 1).map(([pl]) => pl))
    return { n, guests, dups }
  })
  const Row = ({ p, showTable }: { p: Person; showTable?: boolean }) => {
    const t = p[diner.champTable] as number; const pl = p[diner.champPlace] || 0
    const dup = tables[t - 1]?.dups.has(pl)
    return (
      <Link to={`/personnes/${p.id}`} className={`flex items-center gap-2 px-3 py-2 border-b border-line last:border-0 ${dup ? 'bg-alert-red/15' : ''}`}>
        <span className={`w-9 shrink-0 text-center font-bold rounded-md text-sm py-0.5 ${dup ? 'bg-alert-red text-white' : 'bg-ink-3'}`}>{showTable ? `T${t}` : pl}</span>
        {showTable && <span className="w-8 text-xs text-warm">pl. {pl}</span>}
        <span className="flex-1 min-w-0 truncate"><span className="text-warm text-xs mr-1">{civ(p)}</span>{fullName(p)}</span>
        <VipBadge vip={p.vip} />
        {p.regime && <Badge tone="red">🥗</Badge>}
        {dup && <Badge tone="red">doublon</Badge>}
      </Link>
    )
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-warm">{placed.length} convives · {diner.tables} tables{absents.length ? ` · ${absents.length} absents` : ''}</div>
        <div className="flex gap-1">
          <button type="button" className={`chip ${view === 'table' ? 'chip-on' : ''}`} onClick={() => setView('table')}>Par table</button>
          <button type="button" className={`chip ${view === 'alpha' ? 'chip-on' : ''}`} onClick={() => setView('alpha')}>A → Z</button>
        </div>
      </div>
      {view === 'table' ? (
        <div className="space-y-3">
          {tables.map(t => (
            <div key={t.n} className="card overflow-hidden">
              <div className="px-3 py-2 bg-ink-3 flex items-center justify-between">
                <span className="font-bold">Table {t.n}</span>
                <span className="text-xs text-warm">{t.guests.length} pax{t.dups.size ? ' · ⚠️ doublon place ' + [...t.dups].join(', ') : ''}</span>
              </div>
              {t.guests.map(p => <Row key={p.id} p={p} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {[...placed].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(p => <Row key={p.id} p={p} showTable />)}
        </div>
      )}
      {absents.length > 0 && <p className="text-xs text-warm mt-2">Absents : {absents.map(fullName).join(', ')}</p>}
      <p className="text-xs text-warm mt-1">Régime 🥗 : voir la fiche personne. Doublons de place : signalés en rouge (fichier client, sans impact impression).</p>
    </div>
  )
}
