// Code d'accès : comparaison SHA-256 avec VITE_ACCESS_CODE_HASH (injecté au build via GitHub Secrets).
// Sans variable d'environnement : valeur de développement 240826 (cf. README « Changer le code d'accès »).
const DEV_HASH = '2855ba8a437ec065752dcc5f1d9311fe4ce7fd0239dd633b1c991fe6d6bce614' // sha256('240826')
export const CODE_HASH = ((import.meta.env.VITE_ACCESS_CODE_HASH as string | undefined) || '').trim().toLowerCase() || DEV_HASH
export const IS_DEV_CODE = CODE_HASH === DEV_HASH

export async function sha256(s: string) {
  if (!crypto?.subtle) throw new Error('Contexte non sécurisé : ouvrir l’app en https')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

const K = { access: 'pmd:access', fails: 'pmd:fails', lock: 'pmd:lock' }
export const hasAccess = () => localStorage.getItem(K.access) === '1'
export const grantAccess = () => { localStorage.setItem(K.access, '1'); localStorage.removeItem(K.fails); localStorage.removeItem(K.lock) }
export const revokeAccess = () => localStorage.removeItem(K.access)
export const lockUntil = () => Number(localStorage.getItem(K.lock) || 0)
export function registerFail() {
  const n = Number(localStorage.getItem(K.fails) || 0) + 1
  if (n >= 3) { localStorage.setItem(K.lock, String(Date.now() + 30_000)); localStorage.setItem(K.fails, '0'); return { locked: true, n } }
  localStorage.setItem(K.fails, String(n)); return { locked: false, n }
}
