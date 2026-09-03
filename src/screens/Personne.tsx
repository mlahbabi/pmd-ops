import { Link, useNavigate, useParams } from 'react-router-dom'
import { personById, fullName, civ, waveById, diners, isPlaced, express, pending } from '../lib/data'
import type { Leg } from '../lib/types'
import { Badge, CheckRow, Empty, Section, VipBadge, Warn } from '../components/ui'
import { useApp } from '../context'

function LegView({ leg, kind }: { leg?: Leg; kind: 'Aller' | 'Retour' }) {
  if (!leg) return <div className="text-sm text-warm">{kind} : non communiqué <Warn /></div>
  if (leg.mode === 'vol') return <div className="text-sm"><b>{kind}</b> · {leg.date} {leg.heure} · <b>{leg.vol}</b> · {kind === 'Aller' ? `depuis ${leg.de}` : `vers ${leg.vers}`} · {leg.cie}</div>
  if (leg.mode === 'non communiqué') return <div className="text-sm"><b>{kind}</b> · {leg.date || ''} non communiqué <Warn /></div>
  return <div className="text-sm"><b>{kind}</b> · {leg.date || ''} · {leg.mode}</div>
}

export default function Personne() {
  const { id } = useParams()
  const nav = useNavigate()
  const { store } = useApp()
  const p = id ? personById.get(id) : undefined
  if (!p) return <Empty>Personne introuvable. <Link to="/personnes" className="underline">Retour</Link></Empty>
  const waves = (p.transferts || []).map(w => waveById.get(w)).filter(Boolean)
  const team = express.equipes.find(e => e.membres.includes(p.id))
  const pts = pending.filter(x => x.persons?.includes(p.id) && !store.checks[`pending:${x.id}`]?.done)
  const nuits = p.arrivee && p.depart ? `${p.nuitees ?? ''} nuit(s) · ${p.arrivee} → ${p.depart}` : 'séjour non communiqué'
  return (
    <div>
      <button type="button" onClick={() => nav(-1)} className="text-sm text-lavender mb-2">← Retour</button>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <VipBadge vip={p.vip} />
          <Badge tone="muted">{p.statut}</Badge>
          {p.categorie && p.categorie !== p.vip && <Badge tone="muted">{p.categorie}</Badge>}
        </div>
        <h1 className="text-2xl font-bold leading-tight"><span className="text-warm text-base font-medium mr-1">{civ(p) || '⚠️'}</span>{p.nom} <span className="font-medium">{p.prenom}</span></h1>
        <div className="text-sm text-warm mt-1">{[p.fonction, p.metier_tb, p.bureau, p.pays].filter(Boolean).join(' · ') || '—'}</div>
        {p.regime && <div className="mt-3 rounded-xl bg-alert-red/15 border border-alert-red px-3 py-2 font-semibold">🥗 Régime : {p.regime}</div>}
        {(p.a_confirmer?.length || 0) > 0 && (
          <div className="mt-3 rounded-xl bg-alert-yellow/10 border border-alert-yellow/60 px-3 py-2 text-sm">
            <div className="font-semibold mb-1">⚠️ À confirmer</div>
            <ul>{p.a_confirmer!.map(x => <li key={x}>• {x}</li>)}</ul>
          </div>
        )}
      </div>

      <Section title="Coches partagées">
        <div className="space-y-1.5">
          <CheckRow itemId={`pa:${p.id}`} label="Arrivé(e) à l'hôtel" sub={p.arrivee ? `prévu le ${p.arrivee}` : undefined} />
          <CheckRow itemId={`pd:${p.id}`} label="Parti(e)" sub={p.depart ? `prévu le ${p.depart}` : undefined} />
        </div>
      </Section>

      <Section title="Séjour">
        <div className="card p-3 text-sm space-y-1">
          <div>🛏️ {nuits}</div>
          {p.note_hotel && <div className="text-lavender">🏨 {p.note_hotel}</div>}
          {p.statut === 'invité externe' && !p.arrivee && <div className="text-warm">Pas d'hébergement (dîner Diaffa uniquement)</div>}
        </div>
      </Section>

      <Section title="Vols & transferts">
        <div className="card p-3 space-y-2">
          <LegView leg={p.arr} kind="Aller" />
          <LegView leg={p.dep} kind="Retour" />
          {waves.length ? waves.map(w => w && (
            <Link key={w.id} to={`/transport?d=${w.date}#${w.id}`} className="block rounded-xl bg-ink-3 border border-line px-3 py-2 text-sm">
              🚐 <b>{w.date.slice(8, 10)}/{w.date.slice(5, 7)} {w.heure}</b> — {w.type === 'arrivee' ? 'Arrivée' : 'Départ'} {w.vol} · {w.vehicule} · {w.origine} → {w.destination}
              {w.note && <div className="text-xs text-warm mt-0.5">{w.note}</div>}
            </Link>
          )) : <div className="text-sm text-warm">Aucune vague de transfert (arrivée / départ autonome ou non communiqué).</div>}
        </div>
      </Section>

      <Section title="Dîners">
        <div className="card p-3 text-sm space-y-1">
          {diners.map(d => { const t = p[d.champTable]; return (
            <div key={d.id} className="flex items-center justify-between">
              <span>{d.nom} · {d.date.slice(8, 10)}/09</span>
              {isPlaced(t) ? <Link to={`/lieux/${d.id}#plan`} className="font-semibold text-lavender">Table {t} · place {p[d.champPlace]}</Link> : <span className="text-warm">{t === 'absent' ? 'absent' : 'non placé'}</span>}
            </div>
          ) })}
        </div>
      </Section>

      <Section title="Marrakech Express — 10/09">
        <div className="card p-3 text-sm">
          {team ? <Link to="/plus/express" className="font-semibold text-lavender">Équipe {team.n} ({team.membres.length} pax)</Link>
            : p.retour_radisson_1430 ? <span>Navette retour Radisson <b>14:30</b> (liste des 18)</span>
            : <span className="text-warm">Ne participe pas (ni équipe, ni navette 14:30)</span>}
        </div>
      </Section>

      {(p.note_app || pts.length > 0) && (
        <Section title="Notes">
          <div className="card p-3 text-sm space-y-2">
            {p.note_app && <div>{p.note_app}</div>}
            {pts.map(x => <div key={x.id} className="text-warm">⚠️ Point en attente : {x.sujet} <span className="text-xs">({x.responsable}, {x.echeance})</span></div>)}
          </div>
        </Section>
      )}
    </div>
  )
}
export { fullName }
