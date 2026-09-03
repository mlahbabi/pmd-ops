import { useState } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context'
import { hasAccess } from './lib/auth'
import Layout from './components/Layout'
import Access from './screens/Access'
import Now from './screens/Now'
import Programme from './screens/Programme'
import Personnes from './screens/Personnes'
import Personne from './screens/Personne'
import Transport from './screens/Transport'
import { LieuxList, LieuDetail } from './screens/Lieux'
import { PlusIndex, Contacts, Signaletique, Equipe, Points, Menus, Express, Reglages } from './screens/Plus'

function Gate() {
  const { user } = useApp()
  const [ok, setOk] = useState(() => hasAccess() && !!user)
  if (!ok || !user) return <Access onDone={() => setOk(true)} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Now />} />
        <Route path="programme" element={<Programme />} />
        <Route path="personnes" element={<Personnes />} />
        <Route path="personnes/:id" element={<Personne />} />
        <Route path="transport" element={<Transport />} />
        <Route path="lieux" element={<LieuxList />} />
        <Route path="lieux/:id" element={<LieuDetail />} />
        <Route path="plus" element={<PlusIndex />} />
        <Route path="plus/contacts" element={<Contacts />} />
        <Route path="plus/signaletique" element={<Signaletique />} />
        <Route path="plus/equipe" element={<Equipe />} />
        <Route path="plus/points" element={<Points />} />
        <Route path="plus/menus" element={<Menus />} />
        <Route path="plus/express" element={<Express />} />
        <Route path="plus/reglages" element={<Reglages />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AppProvider>
  )
}
