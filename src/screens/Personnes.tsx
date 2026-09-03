import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { people, fullName, REGIMES, sleepsOn, vipRank, diners, isPlaced } from '../lib/data'
import { DAYS } from '../lib/time'
import type { Person } from '../lib/types'
import { Badge, Chips, Empty, PageTitle, VipBadge, Warn } from '../components/ui'

const STATUTS = ['tous', 'participant', 'organisation Deloitte', 'intervenant', 'invité externe'] as const
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Row({ p }: { p: Person }) {
  return (
    <Link to={`/personnes/${p.id}`} className="card p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{p.nom} <span className="font-normal">{p.prenom}</span></div>
        <div className="text-xs text-warm truncate">
          {[p.bureau, p.metier_tb, p.statut !== 'participant' ? p.statut : ''].filter(Boolean).join(' · ')}
          {p.arrivee && ` · ${p.arrivee} → ${p.depart}`}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1"><VipBadge vip={p.vip} />{p.regime && <Badge tone="red">🥗</Badge>}</div>
        {(p.a_confirmer?.length || p.statut === 'invité externe' && !p.arr?.vol) ? <Warn /> : null}
      </div>
    </Link>
  )
}

export default function Personnes() {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'liste' | 'regimes' | 'vip'>('liste')
  const [statut, setStatut] = useState<(typeof STATUTS)[number]>('tous')
  const [vip, setVip] = useState(false)
  const [regime, setRegime] = useState(false)
  const [ret, setRet] = useState(false)
  const [equipe, setEquipe] = useState<number | 0>(0)
  const [bureau, setBureau] = useState('')
  const [nuit, setNuit] = useState('')
  const bureaux = useMemo(() => [...new Set(people.map(p => p.bureau).filter(Boolean) as string[])].sort(), [])

  const list = useMemo(() => {
    const nq = norm(q.trim())
    return people.filter(p => {
      if (nq && !norm(`${p.nom} ${p.prenom} ${p.bureau || ''}`).includes(nq)) return false
      if (statut !== 'tous' && p.statut !== statut) return false
      if (vip && !p.vip) return false
      if (regime && !p.regime) return false
      if (ret && !p.retour_radisson_1430) return false
      if (equipe && p.equipe_tb !== equipe) return false
      if (bureau && p.bureau !== bureau) return false
      if (nuit && !sleepsOn(p, nuit)) return false
      return true
    })
  }, [q, statut, vip, regime, ret, equipe, bureau, nuit])

  return (
    <div>
      <PageTitle title="Personnes" sub={`${people.length} entrées · ${people.filter(p => p.statut === 'participant').length} participants`} />
      <Chips items={['liste', 'regimes', 'vip'] as const} value={view} onChange={setView} render={v => v === 'liste' ? '👥 Liste' : v === 'regimes' ? `🥗 Régimes (${REGIMES.length})` : '⭐ VIP'} />

      {view === 'liste' && (
        <>
          <input className="input my-2" placeholder="Rechercher nom, prénom, bureau…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="scroll-x flex gap-2 py-1 -mx-4 px-4">
            <select className="chip" value={statut} onChange={e => setStatut(e.target.value as (typeof STATUTS)[number])}>{STATUTS.map(s => <option key={s} value={s}>{s === 'tous' ? 'Statut : tous' : s}</option>)}</select>
            <button type="button" className={`chip ${vip ? 'chip-on' : ''}`} onClick={() => setVip(v => !v)}>VIP</button>
            <button type="button" className={`chip ${regime ? 'chip-on' : ''}`} onClick={() => setRegime(v => !v)}>Régime</button>
            <button type="button" className={`chip ${ret ? 'chip-on' : ''}`} onClick={() => setRet(v => !v)}>Retour 14h30</button>
            <select className="chip" value={equipe} onChange={e => setEquipe(Number(e.target.value))}><option value={0}>Équipe TB</option>{[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>Équipe {n}</option>)}</select>
            <select className="chip" value={bureau} onChange={e => setBureau(e.target.value)}><option value="">Bureau</option>{bureaux.map(b => <option key={b} value={b}>{b}</option>)}</select>
            <select className="chip" value={nuit} onChange={e => setNuit(e.target.value)}><option value="">Nuit du…</option>{DAYS.filter(d => d !== '2026-09-13').map(d => <option key={d} value={d}>Nuit du {d.slice(8, 10)}/09</option>)}</select>
          </div>
          <div className="text-xs text-warm px-1 py-1">{list.length} résultat(s)</div>
          {list.length ? <div className="space-y-2">{list.map(p => <Row key={p.id} p={p} />)}</div> : <Empty>Aucun résultat.</Empty>}
        </>
      )}

      {view === 'regimes' && (
        <div className="space-y-2 mt-2">
          <p className="text-xs text-warm px-1">Contraintes recensées dans la rooming V6, croisées avec les tables de chaque dîner.</p>
          {REGIMES.map(p => (
            <Link key={p.id} to={`/personnes/${p.id}`} className="card p-3 block">
              <div className="flex items-center gap-2"><span className="font-semibold">{fullName(p)}</span><VipBadge vip={p.vip} /></div>
              <div className="text-alert-red font-semibold text-sm mt-0.5">🥗 {p.regime}</div>
              <div className="text-xs text-warm mt-1">
                {diners.map(d => { const t = p[d.champTable]; return <span key={d.id} className="mr-3">{d.nom.replace('Dîner ', '')} : {isPlaced(t) ? `T${t} · pl. ${p[d.champPlace]}` : t === 'absent' ? 'absent' : '—'}</span> })}
              </div>
              {p.note_app && <div className="text-xs mt-1">{p.note_app}</div>}
            </Link>
          ))}
        </div>
      )}

      {view === 'vip' && (
        <div className="space-y-4 mt-2">
          {(['VIP', 'VIP+1', 'VIP+2'] as const).map(level => {
            const l = people.filter(p => p.vip === level).sort((a, b) => vipRank(a) - vipRank(b) || a.nom.localeCompare(b.nom, 'fr'))
            return (
              <div key={level}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-warm mb-2 px-1">{level} · {l.length}</h3>
                <div className="space-y-2">{l.map(p => <Row key={p.id} p={p} />)}</div>
              </div>
            )
          })}
          <p className="text-xs text-warm px-1">Priorité : VIP &gt; VIP+1 &gt; VIP+2. M. Boisselier = président du CA France, « VIP ++++ » (réunion privée 10/09).</p>
        </div>
      )}
    </div>
  )
}
