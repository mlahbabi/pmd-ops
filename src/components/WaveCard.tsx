import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ckId, useApp } from '../context'
import { personById, fullName, transport } from '../lib/data'
import type { Wave } from '../lib/types'
import { Badge, CheckRow, LevelBadge, VipBadge } from './ui'

export default function WaveCard({ wave, defaultOpen = false }: { wave: Wave; defaultOpen?: boolean }) {
  const { store } = useApp()
  const [open, setOpen] = useState(defaultOpen)
  const paxDone = wave.pax.filter(id => store.checks[`wp:${wave.id}:${id}`]?.done).length
  const steps = ['Chauffeur en place', 'Passagers complets', 'Parti']
  const stepsDone = steps.filter((_, i) => store.checks[ckId(`${wave.id}-c${i + 1}`)]?.done).length
  const label = wave.type === 'arrivee' ? 'Arrivée' : wave.type === 'depart' ? 'Départ' : 'Transfert'
  const tone = wave.type === 'arrivee' ? 'ok' : wave.type === 'depart' ? 'red' : 'lav'
  const count = wave.pax.length || wave.paxEstime || '?'
  return (
    <div id={wave.id} className={`card overflow-hidden ${wave.level === 'critique' ? 'border-alert-red/50' : ''}`}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-3 flex gap-3">
        <div className="shrink-0 w-14">
          <div className="font-bold text-base">{wave.heure}</div>
          <Badge tone={tone}>{label}</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-snug">{wave.vol}</div>
          <div className="text-xs text-warm mt-0.5">{wave.origine} → {wave.destination || '—'} · <b className="text-ivory">{count} pax</b> · {wave.vehicule}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <LevelBadge level={wave.level} />
            <Badge tone={stepsDone === 3 ? 'ok' : 'muted'}>étapes {stepsDone}/3</Badge>
            {wave.pax.length > 0 && <Badge tone={paxDone === wave.pax.length ? 'ok' : 'muted'}>pax {paxDone}/{wave.pax.length}</Badge>}
          </div>
        </div>
        <div className="text-warm self-center">{open ? '▾' : '▸'}</div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-line pt-3">
          {wave.note && <p className="text-sm">{wave.note}</p>}
          {wave.type === 'arrivee' && <p className="text-xs text-warm">Pancarte « Partners’ Meeting » en zone arrivées · sortie passagers +30 à 40 min.</p>}
          {wave.type === 'depart' && <p className="text-xs text-warm">Dépose aéroport au minimum 2h00 avant le décollage.</p>}
          <div className="space-y-1.5">
            {steps.map((s, i) => <CheckRow key={s} itemId={ckId(`${wave.id}-c${i + 1}`)} label={s} />)}
          </div>
          {wave.pax.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-warm mb-1.5">Liste nominative · {paxDone}/{wave.pax.length}</div>
              <div className="space-y-1">
                {wave.pax.map(id => {
                  const p = personById.get(id)
                  if (!p) return null
                  return (
                    <CheckRow key={id} itemId={`wp:${wave.id}:${id}`}
                      label={<span className="flex items-center gap-2"><Link to={`/personnes/${id}`} className="underline decoration-warm/50">{fullName(p)}</Link><VipBadge vip={p.vip} />{p.regime && <span title={p.regime}>🥗</span>}</span>}
                      sub={p.dep?.vol && wave.type === 'depart' ? `${p.dep.vol} ${p.dep.heure || ''} → ${p.dep.vers || ''}` : p.arr?.vol && wave.type === 'arrivee' ? `${p.arr.vol} depuis ${p.arr.de || ''}` : undefined} />
                  )
                })}
              </div>
            </div>
          )}
          <a className="btn w-full" href={`tel:${transport.contactDispatch.tel}`}>📞 Appeler {transport.contactDispatch.nom} (dispatch)</a>
        </div>
      )}
    </div>
  )
}
