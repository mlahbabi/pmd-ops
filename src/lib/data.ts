import type { Person, Sequence, TransportFile, Lieu, Diner, Menu, ContactGroup, SignItem, TeamFile, Pending, ExpressFile, Meta, Wave } from './types'
import participantsJson from '../data/participants.json'
import timelineJson from '../data/timeline.json'
import transportJson from '../data/transport.json'
import lieuxJson from '../data/lieux.json'
import menusJson from '../data/menus.json'
import contactsJson from '../data/contacts.json'
import signaletiqueJson from '../data/signaletique.json'
import teamJson from '../data/team.json'
import pendingJson from '../data/pending.json'
import expressJson from '../data/express.json'

type File<T> = Meta & T

export const participantsFile = participantsJson as unknown as File<{ items: Person[] }>
export const timelineFile = timelineJson as unknown as File<{ sequences: Sequence[] }>
export const transport = transportJson as unknown as TransportFile
export const lieuxFile = lieuxJson as unknown as File<{ items: Lieu[]; diners: Diner[] }>
export const menusFile = menusJson as unknown as File<{ items: Menu[] }>
export const contactsFile = contactsJson as unknown as File<{ groupes: ContactGroup[] }>
export const signaletiqueFile = signaletiqueJson as unknown as File<{ note: string; items: SignItem[] }>
export const team = teamJson as unknown as TeamFile
export const pendingFile = pendingJson as unknown as File<{ items: Pending[] }>
export const express = expressJson as unknown as ExpressFile

export const people: Person[] = participantsFile.items
export const personById = new Map(people.map(p => [p.id, p]))
export const sequences: Sequence[] = timelineFile.sequences
export const sequenceById = new Map(sequences.map(s => [s.id, s]))
export const waves: Wave[] = transport.vagues
export const waveById = new Map(waves.map(w => [w.id, w]))
export const lieux = lieuxFile.items
export const lieuById = new Map(lieux.map(l => [l.id, l]))
export const diners = lieuxFile.diners
export const menus = menusFile.items
export const pending = pendingFile.items
export const signaletique = signaletiqueFile.items

export const DATA_VERSION = participantsFile.version
export const DATA_UPDATED = participantsFile.updatedAt
const V = (nom: string, f: Meta) => ({ nom, version: f.version, updatedAt: f.updatedAt })
export const versions = [V('participants', participantsFile), V('timeline', timelineFile), V('transport', transport), V('lieux', lieuxFile), V('menus', menusFile), V('contacts', contactsFile), V('signaletique', signaletiqueFile), V('team', team), V('pending', pendingFile), V('express', express)]

export const fullName = (p: Person) => `${p.prenom} ${p.nom}`.trim()
export const civ = (p: Person) => (p.genre === 'F' ? 'Mme' : p.genre === 'H' ? 'M.' : '')
export const isPlaced = (v: unknown): v is number => typeof v === 'number'
export const ownerOf = (seqId: string) => team.affectations.find(a => a.sequenceId === seqId)?.owner || ''
export const sequencesOfDay = (date: string) => sequences.filter(s => s.date === date)
export const wavesOfDay = (date: string) => waves.filter(w => w.date === date)

/** Jour (numéro) à partir de « 08/09 » */
export const dayNum = (ddmm?: string | null) => (ddmm ? Number(ddmm.slice(0, 2)) : NaN)
/** Vrai si la personne dort à l'hôtel la nuit du <date> (YYYY-MM-DD) au lendemain */
export function sleepsOn(p: Person, date: string) {
  const d = Number(date.slice(8, 10)); const a = dayNum(p.arrivee); const b = dayNum(p.depart)
  return !isNaN(a) && !isNaN(b) && a <= d && d < b
}
export const REGIMES = people.filter(p => p.regime && p.regime.trim())
export const vipRank = (p: Person) => (p.vip === 'VIP' ? 0 : p.vip === 'VIP+1' ? 1 : p.vip === 'VIP+2' ? 2 : 9)
