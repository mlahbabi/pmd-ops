import { Link, useNavigate, useParams } from 'react-router-dom'
import { lieux, lieuById, diners, sequences } from '../lib/data'
import { ddmm } from '../lib/time'
import TablePlan from '../components/TablePlan'
import { Empty, PageTitle, Section, TelButtons, Warn } from '../components/ui'
import SequenceCard from '../components/SequenceCard'

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export function LieuxList() {
  return (
    <div>
      <PageTitle title="Lieux" sub="Adresses, contacts, ce qui s'y passe, setup MRCO" />
      <div className="flex gap-2 mb-3">
        {diners.map(d => <Link key={d.id} to={`/lieux/${d.id}#plan`} className="chip chip-on">🪑 Plan {d.nom.replace('Dîner ', '')}</Link>)}
      </div>
      <div className="space-y-2">
        {lieux.map(l => (
          <Link key={l.id} to={`/lieux/${l.id}`} className="card p-3 block">
            <div className="flex items-center gap-2"><span className="font-semibold">{l.nom}</span>{l.aConfirmer && <Warn />}</div>
            <div className="text-xs text-warm mt-0.5">{l.adresse}</div>
            <div className="text-xs mt-1">{(l.jours || []).map(ddmm).join(' · ')}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function LieuDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const l = id ? lieuById.get(id) : undefined
  if (!l) return <Empty>Lieu introuvable.</Empty>
  const diner = diners.find(d => d.id === l.plan)
  const seqs = sequences.filter(s => s.lieu.toLowerCase().includes(l.nom.split(' ')[0].toLowerCase()) || (l.id === 'rak' && s.type === 'transport' && s.lieu.includes('RAK')))
  return (
    <div>
      <button type="button" onClick={() => nav(-1)} className="text-sm text-lavender mb-2">← Retour</button>
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl font-bold">{l.nom}</h1>{l.aConfirmer && <Warn />}</div>
        <a href={maps(l.adresse.replace(/⚠️.*$/, '') + ' Marrakech')} target="_blank" rel="noreferrer" className="text-sm text-lavender underline block mt-1">📍 {l.adresse}</a>
        {l.contacts?.length ? <div className="text-xs text-warm mt-2">{l.contacts.join(' · ')}</div> : null}
        <div className="mt-3"><TelButtons tel={l.tel} tel2={l.tel2} email={l.email} /></div>
      </div>
      {l.acces && <Section title="Accès"><div className="card p-3 text-sm">{l.acces}</div></Section>}
      {l.quoi?.length ? <Section title="Ce qui s'y passe"><ul className="card p-3 text-sm space-y-1">{l.quoi.map(x => <li key={x}>• {x}</li>)}</ul></Section> : null}
      {l.setup?.length ? <Section title="Setup MRCO"><ul className="card p-3 text-sm space-y-1">{l.setup.map(x => <li key={x}>🛠️ {x}</li>)}</ul></Section> : null}
      {diner && <Section title={`Plan de table — ${diner.nom} · ${ddmm(diner.date)}`} className="scroll-mt-20"><div id="plan"><TablePlan diner={diner} /></div></Section>}
      {seqs.length > 0 && <Section title="Séquences liées"><div className="space-y-2">{seqs.map(s => <SequenceCard key={s.id} seq={s} showDate />)}</div></Section>}
    </div>
  )
}
