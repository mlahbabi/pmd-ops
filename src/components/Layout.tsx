import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context'

const TABS = [
  { to: '/', label: 'Maintenant', icon: '⏱️' },
  { to: '/programme', label: 'Programme', icon: '📅' },
  { to: '/personnes', label: 'Personnes', icon: '👥' },
  { to: '/transport', label: 'Transport', icon: '🚐' },
  { to: '/lieux', label: 'Lieux', icon: '📍' },
  { to: '/plus', label: 'Plus', icon: '☰' },
]

export default function Layout() {
  const { store, simulated } = useApp()
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="safe-top sticky top-0 z-30">
        {!store.online && <div className="bg-alert-orange text-ink text-xs font-semibold text-center px-3 py-1">Hors ligne — données en cache. Les coches partiront au retour du réseau.</div>}
        {store.online && store.mode === 'local' && <div className="bg-ink-3 text-warm text-xs text-center px-3 py-1 border-b border-line">Mode local — coches enregistrées sur cet appareil uniquement (Supabase non configuré)</div>}
        {store.online && store.mode === 'supabase' && store.queued > 0 && <div className="bg-alert-yellow text-ink text-xs font-semibold text-center px-3 py-1">{store.queued} modification(s) en attente de synchro…</div>}
        {store.error && store.online && <div className="bg-alert-red/80 text-white text-xs text-center px-3 py-1">{store.error}</div>}
        {simulated && <div className="bg-lavender text-ink text-xs font-semibold text-center px-3 py-1">Mode simulation de date — retour au temps réel depuis Maintenant</div>}
      </div>
      <main className="flex-1 px-4 pt-3 pb-24 max-w-2xl w-full mx-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-ink/95 backdrop-blur border-t border-line safe-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium min-h-14 ${isActive ? 'text-lavender' : 'text-warm'}`}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
