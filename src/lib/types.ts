export type Leg = { date: string | null; heure: string | null; vol: string | null; de?: string | null; vers?: string | null; cie: string | null; mode: string }

export type Person = {
  id: string; nom: string; prenom: string; genre?: string; statut: string; vip?: string; categorie?: string
  bureau?: string; metier_tb?: string; fonction?: string; pays?: string
  arrivee?: string; depart?: string; nuitees?: number; regime?: string; note_hotel?: string; note_app?: string
  equipe_tb?: number | null; retour_radisson_1430?: boolean
  diaffa_table?: number | string | null; diaffa_place?: number | null
  rotisserie_table?: number | string | null; rotisserie_place?: number | null
  arr?: Leg; dep?: Leg; transferts?: string[]; a_confirmer?: string[]
}

export type Level = 'normal' | 'important' | 'critique'
export type SeqType = 'transport' | 'salle' | 'restauration' | 'setup' | 'activite' | 'vip' | 'orga'
export type ChecklistItem = { id: string; label: string }
export type Sequence = {
  id: string; date: string; start: string; end: string | null; title: string; lieu: string; effectif: string
  type: SeqType; level: Level; details: string; checklist: ChecklistItem[]; persons: string[]; owner: string
  waveId?: string; aConfirmer?: boolean
}

export type Wave = {
  id: string; date: string; heure: string; type: 'arrivee' | 'depart' | 'programme'; vol: string; pax: string[]
  paxEstime?: string; vehicule: string; note: string; origine: string; destination: string; level: Level
}
export type Flotte = { date: string; pax: string; mouvements: string; flotte: string }
export type TransportFile = { version: string; updatedAt: string; regles: string[]; contactDispatch: { nom: string; role: string; tel: string }; vagues: Wave[]; horsDispatch: string[]; flotte: Flotte[] }

export type Lieu = { id: string; nom: string; adresse: string; tel?: string; tel2?: string; email?: string; contacts?: string[]; acces?: string; quoi?: string[]; setup?: string[]; plan?: 'diaffa' | 'rotisserie'; jours?: string[]; aConfirmer?: boolean }
export type Diner = { id: 'diaffa' | 'rotisserie'; nom: string; date: string; tables: number; champTable: 'diaffa_table' | 'rotisserie_table'; champPlace: 'diaffa_place' | 'rotisserie_place' }
export type Menu = { id: string; date: string; sequence: string; lieu: string; menu: string; boissons: string; aConfirmer?: boolean }
export type Contact = { nom: string; role: string; tel: string; tel2?: string; email: string; aConfirmer?: boolean; note?: string }
export type ContactGroup = { nom: string; note?: string; contacts: Contact[] }
export type SignItem = { id: string; label: string; qte: number | string; lieu: string; date: string; note?: string; aConfirmer?: boolean }
export type Affectation = { sequenceId: string; owner: string; role?: string; note?: string }
export type Moment = { sequenceId: string; label: string }
export type TeamFile = { version: string; updatedAt: string; membres: string[]; affectations: Affectation[]; moments: Moment[] }
export type Pending = { id: string; sujet: string; responsable: string; echeance: string; level: 'normal' | 'alerte'; persons?: string[] }
export type Equipe = { n: number; membres: string[] }
export type ExpressFile = { version: string; updatedAt: string; nom: string; date: string; prestataire: string; depart: string; arrivee: string; equipes: Equipe[]; retour1430: string[]; notes: string[] }
export type Meta = { version: string; updatedAt: string }
