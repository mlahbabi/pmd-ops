# DATA_CHECK — PMD Ops (Partners’ Meeting, Marrakech, 07 → 13 septembre 2026)

Vérification du 03/09/2026 (soir) de `participants.json` (66 entrées, source principale) contre les fichiers sources datés 030926, par script Node (xlsx + mammoth). Règle de conflit appliquée : `participants.json` > xlsx/docx du 03/09 > reste.

## 1. Sources vérifiées

| Source | Rôle | Résultat |
|---|---|---|
| `participants.json` (fourni) | 66 entrées : 62 rooming + 1 invité chambre + 3 invités externes Diaffa | Base de l'app, enrichie des vols et des vagues de transfert |
| Deloitte_Radisson_Rooming_Nuitees_V6_030926.xlsx | Séjours, nuitées, régimes, notes hôtel | 62 pax + 1 invité, 199 nuitées — **conforme** |
| Liste participants VF - 030926.xlsx | Séjour client, teambuilding, contraintes | 62 lignes — **conforme** (écart Righi, §2) |
| Teambuilding liste du 030926.xlsx | 7 équipes / 41 pax ; navette 14h30 (18 pax) | **conforme** |
| Plan de table des diners - 030926 def.xlsx | Onglet « mercredi 8 » = Diaffa 09/09 (65 cartes, 8 tables) ; onglet « jeudi 9 » = Rôtisserie 10/09 (59 cartes, 6 tables) | **conforme** (2 doublons de place dans la source, §2) |
| Conso Plans-de-Vol … -030926.xlsx | Vols arrivée/départ, provenance | 62 lignes — **conforme** (écart Kopp) |
| MRCO_Dispatch_Transport_Sept2026_V4_030926.docx | 29 vagues aéroport + 6 transferts programme | Tous les pax avec vol ont une vague — **conforme** |
| Deloitte_Radisson_Fiche_Fonction_V5_030926.docx | Salles, restauration, contingent, contacts hôtel | Programme ops ; **tarif, taxe de séjour et intitulé « séminaire des dirigeants » exclus** |
| Deloitte_PushMail_Programme_Participants_020926.docx | Programme officiel participants | Libellés des séquences de travail repris (plénière, ateliers Design thinking, formation IA, pitchs, AG/closing) ; horaires cohérents avec la spec §6 |
| PMD_Signaletique_Imprimeur_V3 - 030926 B.zip | Signalétique | Dézippé : contenu interne nommé **V2** (`PMD_Signaletique_Imprimeur_V2/…`). Menus 65+5 / 59+5, 10 prismes, 5 roll-ups, 500 sous-verres, 6 pancartes |
| Logos PMD Black / White | Identité | Redimensionnés (900 px) + icônes PWA 192/512/180 |

## 2. Écarts relevés

| # | Objet | Écart | Traitement dans l'app |
|---|---|---|---|
| 1 | KOPP Julien | Vols : arrivée 08/09 ; rooming V6 et participants.json : nuit 09→10, départ 10/09 ; plan de table : placé Rôtisserie T6/P8 le 10 au soir ; vol de départ non communiqué. | participants.json fait foi (09→10). Badge ⚠️ « à confirmer » sur la fiche, point en attente n°1. |
| 2 | BENJELLOUN TOUIMI, EL HABTI, FIKRAT | Au plan Diaffa (T1/P4, T5/P2, T6/P2) mais absents rooming et liste client ; `statut: participant` dans participants.json alors que la spec §2 les définit comme invités externes. | Statut **invité externe** (spec > JSON sur ce point), pas d'hébergement, mode d'arrivée ⚠️. Genre inconnu pour Benjelloun Touimi et Fikrat (civilité vide). |
| 3 | INVITÉ DÎNER 09/09 | Chambre 09→10 « nom à communiquer » (rooming V6). | Entrée conservée telle quelle, ⚠️, point en attente n°4. Non fusionnée avec l'un des 3 invités (pas de source). |
| 4 | Plan Diaffa T8 | Place 8 attribuée deux fois (Chaghil Brasseur, N'Guessan), place 2 vide. | Conservé tel quel, **signalé en rouge** dans le plan de table, ⚠️ sur les 2 fiches, point n°15. |
| 5 | Plan Rôtisserie T2 | Place 9 attribuée deux fois (Sayam, Sall Plantagenet), place 8 vide. | Idem. |
| 6 | Plan Rôtisserie T5 | 9 convives, place 9 vide. | Affiché tel quel (10·10·10·10·9·10 = 59). La spec §6 dit « 58 convives » : le plan client donne 59 cartes. |
| 7 | VILLEMINOT Julien | Genre « F » dans le plan client ; intervenant homme (`genre: H` dans participants.json). | H, ⚠️ civilité du menu Diaffa, point n°16. |
| 8 | RIGHI Jonathan | « Sans agneau » dans la rooming V6 (03/09), absent de la liste client. | Rooming fait foi ; régime affiché en rouge, plat alternatif Diaffa + Beldi. |
| 9 | Rôtisserie, lignes « KO » | Courivaud, « El hatbti », PDG1, PDG2 = lignes annulées/doublons de la source. | Ignorées. |
| 10 | Dispatch V4 vs fiche transport V2 (28/08) | N'Goran sans transfert, Gourd décalé au 09/09 17:50, Wafeu / Ondias / Courivaud retirées, Sayam sur AF1876 17:50. | V4 fait foi. |
| 11 | Beldi 11/09 | 50 pax confirmés au Beldi vs ~52 dans le dispatch. | Affiché « 50 confirmés (dispatch ~52 ⚠️) », point n°14. |
| 12 | Nuit 12→13 | Rooming : 2 chambres (Mavungu, Queron) ; fiche fonction V5 : 1. | 2 affiché, ⚠️ à aligner avec l'hôtel. |
| 13 | Fiche fonction V5 | Contient un tarif (déjeuner VIP), la taxe de séjour, l'intitulé « Séminaire des dirigeants ». | **Exclus** de l'app (règles absolues). |
| 14 | Lieux | Aucune adresse fournie pour Le Grand Bazar et le Riad Dar Essalam. | « ⚠️ à confirmer » sur les fiches lieux. |
| 15 | Contacts | Farid : numéro absent ; Clémence / Hajer : pas de numéro dans la spec §8 (celui de Hajer figure dans le push-mail participants, non repris car document client) ; photographe non identifié. | ⚠️ sur les contacts concernés. |

## 3. Éléments affichés « à confirmer » ⚠️ dans l'app

Kopp (vol retour / Rôtisserie) · mode d'arrivée des 3 invités externes · nom de l'invité chambre 09→10 · civilité Villeminot · doublons de place T8 Diaffa et T2 Rôtisserie · dîner orga du 07/09 (lieu) · rooftop Diaffa (confirmation écrite Imane) · effectif Beldi · nuit 12→13 · buffets Lila et menu VIP Boisselier · adresses Grand Bazar / Dar Essalam · numéros Farid, Clémence, Hajer · photographe · impression signalétique.

## 4. Totaux de contrôle

| Indicateur | Valeur | Source |
|---|---|---|
| Fiches | 66 (56 participants, 2 organisation Deloitte, 4 intervenants, 4 invités externes dont 1 chambre sans nom) | participants.json |
| Nuitées | 199 | Rooming V6 |
| Marrakech Express | 41 pax, 7 équipes (6·6·6·6·6·6·5) | Teambuilding liste |
| Dîner Diaffa 09/09 | 65 convives, 8 tables (9·8·7·8·9·8·8·8) | Plan de table |
| Dîner Rôtisserie 10/09 | 59 convives, 6 tables (10·10·10·10·9·10) | Plan de table |
| Navette retour 14h30 le 10/09 | 18 pax | Teambuilding liste / Dispatch V4 |
| Vagues transport | 29 aéroport + 6 programme | Dispatch V4 |
| Séquences timeline | 68 (03 → 12/09) | Spec §6 |
| Régimes alimentaires | 7 | Rooming V6 |
| Points en attente | 19 | Spec §9 |

## 5. Hypothèses prises

1. Les 3 invités externes ont le statut « invité externe » (spec §2 et §5.3) bien que `participants.json` les marque « participant » ; l'entrée « INVITÉ DÎNER 09/09 » reste distincte tant que le client n'a pas donné le nom.
2. Les doublons de place sont conservés tels quels (fichier client) et signalés en rouge, plutôt que réattribués.
3. Une séquence sans heure de fin est considérée « en cours » pendant 45 min après son début (ou jusqu'à ce que sa checklist soit cochée à 100 %) ; tous les départs aéroport et transferts groupés sont de niveau `critique` (spec §12).
