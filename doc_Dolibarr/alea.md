manambotra page vaovao mgenerer salaire de ny parametre mois et annee dia misy champs miaraka amin'ny mois sy annees:
1 salaire par jour 
2 pourcentage: majoration jour férié
rehefa makao amin'io page io de miteny mois sy année de miteny oe ty ny salaire par jour de majoration jour férié
mifidy employe de jour (intervalle) mbola tss karama no générer ohatra 1 a 10 de 11 a 31 
dia raha misy jour ferie ao anatiny de apina ny pourcentage ao ny salaire par jour
intervalle + somme montant rehetra any amin'ny base
montant misaraka par jour fa mila averina montant total ray (manisa andro * salaire par jour de + poucentage raha jour férié) 
atao copie colle le page genere salaire satria meme filtre de generation en masse fona ihany fa page vaovao no hanaovana anle generation salaire par jour


manambotra page vaovao mgenerer paiement dia mitovy filtre amin'ny filtre salaires:genre, poste, heure min/max
 -champs montant avec bouton payer qui suit cette règle selon cette ordre
 -filtre: mois et annee (ohatra oe salaire ao amin'ny fevrier 2024)
 -date aloha ndrindra no payena voalohany(debut intervalle) (day/mois/annee)
 -champs poste prioritaire(priorite alohan'ny date raha misy) iny poste iny no payerna voalohany
 -date aloha ndrindra fona(rakoto 1er lou zay vo rakoto 3) suivant le poste prioritaire (day(ze kely ndrindra)/mois/annee)
 zay vo olona ny poste tsy prioritaire

rehefa vita de avoka eo ambany eo ny liste salaries ny montant de salaire sy paiement tamin'iny mois iny

nouvelle page "paiement par mois" (otranle salaire par mois) avec:
    - filtre: mois et année
    - champs poste prioritaire
    - champs montant (total ny tokony aloha entre les salariés)
    - bouton payer
    -liste salaries avec montant salaire, le montant paye et le reste à payer
# ordre de priorité pour le paiement:
1. le poste est prioritaire (le poste selectionner est prioritaire au paiement) -> à payer en premier
2. date le plus ancien (reference date debut d'intervalle) -> jour/mois/annee 
3. tant que le montant > salaire à payer de mandoa salaire fona jusqu'à montant = 0
# ordre: 
poste prioritaire -> date le plus ancien (01/02/2024 avant 12/02/2024)
poste prioritaire -> poste non prioritaire(avec date le plus ancien)

# ex:
-poste prioritaire: technicien, montant à payer: 1600 avec Rasoabe et Ranjenja au poste technicien et Rakotobe au poste comptable:
- Prioritaire: Rasoabe et Ranjenja
- non prioritaire: Rakotobe
-comparaison entre le debut d'intevalle de Rasoabe et Ranjenja: ze plus ancien no aloha voalohany 

-> donc le 1600 diviser entre Rasoabe, Ranjenja et Rakotobe.





dans la page "Salaires par mois" on ajoute 2 check-box(à cocher):
- 1 check-box pour samedi
- 1 check-box pour dimanche
- 1 champs de majoration en %

règle de gestion:
- quand un check-box est coché -> un champs de majoration ( en %) apparait
- quand un check-box est coché -> ça signifie que l'employé travail le samedi/dimanche (ou les 2)
- quand un check-box est non coché -> le champs de majoration ( en %) n'apparait pas
- quand un check-box est non coché -> ça signifie que l'employé ne travail pas le samedi/dimanche (ou les 2)
- si samedi/dimanche = jour ferié donc 2 majorations existantes:
    - 1 majoration pour le jour férié
    - 1 majoration pour samedi/dimanche
    -> donc on prend celui qui à le plus grande majoration

