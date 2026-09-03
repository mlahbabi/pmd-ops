import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import { contactsFile, signaletique, signaletiqueFile, team, sequenceById, pending, menus, express, personById, fullName, versions, DATA_VERSION, DATA_UPDATED } from '../lib/data'
import { ddmm, fmtIso } from '../lib/time'
import { IS_DEV_CODE, revokeAccess } from '../lib/auth'
import { clearLocalState, refresh } from '../lib/store'
import { Badge, CheckRow, Empty, PageTitle, PersonChip, Section, TelButtons, VipBadge, Warn } from '../components/ui'

const Back = () => { const nav = useNavigate(); return <button type="button" onClick={() => nav('/plus')} className="text-sm text-lavender mb-2">← Plus</button> }

export function PlusIndex() {
  const { user, store } = useApp()
  const open = pending.filter(p => !store.checks[`pending:${p.id}`]?.done).length
  const items = [
    { to: '/plus/contacts', icon: '📇', label: 'Contacts', sub: 'MRCO, client, transport, lieux, prestataires' },
    { to: '/plus/signaletique', icon: '🪧', label: 'Signalétique & matériel', sub: 'Inventaire à installer, coches partagées' },
    { to: '/plus/equipe', icon: '🧑‍🤝‍🧑', label: 'Équipe MRCO', sub: 'Qui fait quoi — à compléter' },
    { to: '/plus/points', icon: '⚠️', label: 'Points en attente', sub: `${open} ouvert(s)` },
    { to: '/plus/menus', icon: '🍽️', label: 'Menus', sub: 'Les 7 séquences de restauration' },
    { to: '/plus/express', icon: '🧭', label: 'Marrakech Express', sub: '7 équipes · navette 14h30' },
    { to: '/plus/reglages', icon: '⚙️', label: 'Réglages', sub: `Utilisateur : ${user} · ${store.mode === 'supabase' ? 'Supabase' : 'mode local'}` },
  ]
  return (
    <div>
      <PageTitle title="Plus" sub={`Données ${DATA_VERSION}`} />
      <div className="space-y-2">
        {items.map(i => <Link key={i.to} to={i.to} className="card p-3 flex items-center gap-3"><span className="text-2xl">{i.icon}</span><span className="flex-1"><span className="font-semibold block">{i.label}</span><span className="text-xs text-warm">{i.sub}</span></span><span className="text-warm">›</span></Link>)}
      </div>
    </div>
  )
}

export function Contacts() {
  return (
    <div>
      <Back /><PageTitle title="Contacts" />
      {contactsFile.groupes.map(g => (
        <Section key={g.nom} title={g.nom}>
          {g.note && <div className="text-xs text-warm px-1 mb-1">{g.note}</div>}
          <div className="space-y-2">
            {g.contacts.map(c => (
              <div key={c.nom} className="card p-3">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{c.nom}</span>{c.aConfirmer && <Warn />}</div>
                <div className="text-xs text-warm mb-2">{c.role}{c.note ? ` · ${c.note}` : ''}</div>
                {(c.tel || c.email) ? <TelButtons tel={c.tel || undefined} tel2={c.tel2} email={c.email || undefined} compact /> : <div className="text-xs text-warm">Pas de numéro renseigné</div>}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  )
}

export function Signaletique() {
  const dates = [...new Set(signaletique.map(s => s.date))].sort()
  return (
    <div>
      <Back /><PageTitle title="Signalétique & matériel" sub={signaletiqueFile.note} />
      {dates.map(d => (
        <Section key={d} title={`À installer le ${ddmm(d)}`}>
          <div className="space-y-1.5">
            {signaletique.filter(s => s.date === d).map(s => <CheckRow key={s.id} itemId={`sign:${s.id}`} label={<span>{s.label} <b className="text-lavender">× {s.qte}</b>{s.aConfirmer && <> <Warn /></>}</span>} sub={`${s.lieu}${s.note ? ' · ' + s.note : ''}`} />)}
          </div>
        </Section>
      ))}
    </div>
  )
}

export function Equipe() {
  return (
    <div>
      <Back /><PageTitle title="Équipe MRCO — qui fait quoi" sub="À compléter le 04/09 dans src/data/team.json (affectations)" />
      <div className="flex gap-2 mb-4">{team.membres.map(m => <span key={m} className="chip">{m}</span>)}</div>
      <Section title="Grands moments à affecter">
        <div className="space-y-2">
          {team.moments.map(m => {
            const aff = team.affectations.filter(a => a.sequenceId === m.sequenceId)
            const s = sequenceById.get(m.sequenceId)
            return (
              <div key={m.sequenceId} className="card p-3">
                <div className="font-semibold">{m.label}</div>
                {s && <div className="text-xs text-warm">{ddmm(s.date)} {s.start} · {s.title}</div>}
                <div className="mt-1 text-sm">{aff.length ? aff.map(a => <Badge key={a.owner} tone="lav" className="mr-1">👤 {a.owner}{a.role ? ` — ${a.role}` : ''}</Badge>) : <Warn label="à affecter" />}</div>
              </div>
            )
          })}
        </div>
      </Section>
      {team.affectations.length > 0 && (
        <Section title="Toutes les affectations">
          <div className="card divide-y divide-line text-sm">{team.affectations.map((a, i) => { const s = sequenceById.get(a.sequenceId); return <div key={i} className="px-3 py-2"><b>{a.owner}</b> — {a.role || ''} · {s ? `${ddmm(s.date)} ${s.start} ${s.title}` : a.sequenceId}{a.note ? <div className="text-xs text-warm">{a.note}</div> : null}</div> })}</div>
        </Section>
      )}
    </div>
  )
}

export function Points() {
  const { store } = useApp()
  const [show, setShow] = useState<'ouverts' | 'resolus' | 'tous'>('ouverts')
  const list = pending.filter(p => { const d = !!store.checks[`pending:${p.id}`]?.done; return show === 'tous' || (show === 'ouverts' ? !d : d) })
  return (
    <div>
      <Back /><PageTitle title="Points en attente" sub="État au 03/09 soir · coche partagée = résolu" />
      <div className="flex gap-2 mb-3">{(['ouverts', 'resolus', 'tous'] as const).map(s => <button key={s} type="button" className={`chip ${show === s ? 'chip-on' : ''}`} onClick={() => setShow(s)}>{s}</button>)}</div>
      {list.length ? (
        <div className="space-y-2">
          {list.map(p => (
            <div key={p.id} className={`card p-1 ${p.level === 'alerte' ? 'border-alert-yellow/60' : ''}`}>
              <CheckRow itemId={`pending:${p.id}`} label={<span>{p.level === 'alerte' && '⚠️ '}{p.sujet}</span>} sub={`${p.responsable} · échéance ${p.echeance.includes('-') ? ddmm(p.echeance) : p.echeance}`} />
              {p.persons?.length ? <div className="flex flex-wrap gap-1 px-3 pb-2">{p.persons.map(id => <PersonChip key={id} id={id} />)}</div> : null}
            </div>
          ))}
        </div>
      ) : <Empty>Rien ici.</Empty>}
    </div>
  )
}

export function Menus() {
  return (
    <div>
      <Back /><PageTitle title="Menus" sub="Régimes à croiser : Personnes → Régimes" />
      <div className="space-y-2">
        {menus.map(m => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center gap-2 flex-wrap"><b>{m.sequence}</b> <span className="text-warm text-xs">{ddmm(m.date)} · {m.lieu}</span>{m.aConfirmer && <Warn />}</div>
            <div className="text-sm mt-1">{m.menu}</div>
            <div className="text-xs text-lavender mt-1">🥂 {m.boissons}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Express() {
  const { store } = useApp()
  const waveId = 'p1009-1430'
  const done = express.retour1430.filter(id => store.checks[`wp:${waveId}:${id}`]?.done).length
  return (
    <div>
      <Back /><PageTitle title="Marrakech Express" sub={`${ddmm(express.date)} · ${express.prestataire}`} />
      <div className="card p-3 text-sm mb-4 space-y-1">
        <div>🚩 Départ : {express.depart}</div>
        <div>🏁 Arrivée : {express.arrivee}</div>
        {express.notes.map(n => <div key={n} className="text-warm">• {n}</div>)}
      </div>
      <Section title={`Navette retour Radisson 14:30 · ${done}/${express.retour1430.length}`} right={<Link to={`/transport?d=2026-09-10#${waveId}`} className="text-xs text-lavender underline">Transport</Link>}>
        <div className="space-y-1">
          {express.retour1430.map(id => { const p = personById.get(id); return p ? <CheckRow key={id} itemId={`wp:${waveId}:${id}`} label={<span className="flex items-center gap-2">{fullName(p)}<VipBadge vip={p.vip} /></span>} /> : null })}
        </div>
      </Section>
      <Section title="Équipes">
        <div className="space-y-2">
          {express.equipes.map(e => (
            <div key={e.n} className="card p-3">
              <div className="font-semibold mb-1">Équipe {e.n} · {e.membres.length} pax</div>
              <div className="flex flex-wrap gap-1.5">{e.membres.map(id => <PersonChip key={id} id={id} />)}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

export function Reglages() {
  const { user, setUser, store } = useApp()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  async function viderCache() {
    setBusy(true)
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.() || []
      await Promise.all(regs.map(r => r.unregister()))
      const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k)))
    } finally { location.reload() }
  }
  return (
    <div>
      <Back /><PageTitle title="Réglages" />
      <Section title="Utilisateur">
        <div className="card p-3 space-y-2">
          <div className="text-sm">Connecté en tant que <b>{user}</b></div>
          <div className="flex flex-wrap gap-2">{team.membres.map(m => <button key={m} type="button" className={`chip ${m === user ? 'chip-on' : ''}`} onClick={() => setUser(m)}>{m}</button>)}</div>
        </div>
      </Section>
      <Section title="Synchronisation">
        <div className="card p-3 space-y-2 text-sm">
          <div>Mode : <b>{store.mode === 'supabase' ? 'Supabase (partagé en temps réel)' : 'local (cet appareil uniquement)'}</b> · {store.online ? 'en ligne' : 'hors ligne'}{store.queued ? ` · ${store.queued} en attente` : ''}</div>
          {store.mode === 'supabase' && <button type="button" className="btn" onClick={() => void refresh()} disabled={store.syncing}>{store.syncing ? 'Synchro…' : '🔄 Resynchroniser'}</button>}
          {store.mode === 'local' && <div className="text-xs text-warm">Pour partager les coches entre les 4 téléphones : créer le projet Supabase, exécuter supabase/schema.sql, renseigner les secrets GitHub (voir README).</div>}
        </div>
      </Section>
      <Section title="Version">
        <div className="card p-3 text-xs space-y-1">
          <div>Données : <b>{DATA_VERSION}</b> · mises à jour le {fmtIso(DATA_UPDATED)}</div>
          <div>Build : {fmtIso(__BUILD_DATE__)}</div>
          {IS_DEV_CODE && <div className="text-alert-orange">⚠️ Code d'accès de développement actif (secret VITE_ACCESS_CODE_HASH absent au build).</div>}
          <details className="text-warm"><summary>Versions par fichier</summary>{versions.map(v => <div key={v.nom}>{v.nom} · {v.version}</div>)}</details>
        </div>
      </Section>
      <Section title="Maintenance">
        <div className="space-y-2">
          <button type="button" className="btn w-full" onClick={() => void viderCache()} disabled={busy}>🧹 Vider le cache de l'app et recharger</button>
          <button type="button" className="btn btn-danger w-full" onClick={() => { if (confirm('Effacer les coches et notes enregistrées sur cet appareil ?')) clearLocalState() }}>🗑️ Effacer les coches locales</button>
          <button type="button" className="btn w-full" onClick={() => { revokeAccess(); setUser(''); nav('/') ; location.reload() }}>🔒 Se déconnecter (code d'accès)</button>
        </div>
      </Section>
    </div>
  )
}
