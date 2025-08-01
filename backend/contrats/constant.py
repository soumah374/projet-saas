# Constante pour le template par défaut (utilisée dans le modèle Contrat)
DEFAULT_TEMPLATE_HTML = """<h3 style="color: #000000; font-size: 20px; font-weight: bold; margin: 25px 0 15px 0; border-bottom: 2px solid #000000; padding-bottom: 8px; font-family: Arial, Helvetica, sans-serif;">CONTRAT DE PRESTATION DE SERVICES</h3>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Entre les soussignés :</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[RAISON_SOCIALE_PRESTATAIRE]</strong>,<br>
Société [FORME_JURIDIQUE] au capital de [MONTANT_CAPITAL] GNF,<br>
immatriculée au RCS de [VILLE_RCS] sous le numéro [SIRET],<br>
dont le siège social est situé à [ADRESSE_PRESTATAIRE],<br>
représentée par [NOM_REPRESENTANT], en sa qualité de [FONCTION_REPRESENTANT],
ci-après dénommée "le Prestataire",
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">Et :</strong>
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[NOM_CLIENT]</strong>,<br>
[TYPE_CLIENT] domicilié(e) à [ADRESSE_CLIENT],<br>
immatriculé(e) sous le numéro [NUMERO_IDENTIFICATION],<br>
représenté(e) par [NOM_REPRESENTANT_CLIENT], en sa qualité de [FONCTION_REPRESENTANT_CLIENT],<br>
ci-après dénommé "le Client",
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">Il a été convenu ce qui suit :</strong>
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 1 – Objet du contrat</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le présent contrat a pour objet la réalisation des prestations définies dans le <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">devis n° [NUMERO_DEVIS]</strong> daté du [DATE_DEVIS], annexé au présent contrat et accepté par le Client.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 2 – Durée</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de [DUREE_ESTIMEE] à compter du début des travaux fixé au [DATE_DEBUT_PRESTATION].
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 3 – Description des prestations</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le Prestataire s'engage à réaliser les prestations suivantes :<br>
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[DESCRIPTION_PRESTATION]</strong><br>
Conformément au devis annexé.
</p>


<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 4 – Modalités d'exécution</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 5 – Prix et modalités de paiement</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000; list-style-type: none;">
Le montant total de la prestation est fixé à <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[MONTANT_TTC] GNF TTC</strong>, selon le devis accepté.<br>
Modalités de paiement :
</p>

<div style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
[MODALITES_PAIEMENT]
</div>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Paiement par virement bancaire aux coordonnées indiquées sur la facture.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 6 – Confidentialité</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 7 – Propriété intellectuelle</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 8 – Résiliation</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant [DELAI_RESILIATION] jours.
</p>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 9 – Litiges</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],<br>
En deux exemplaires originaux.
</p>
"""


DEFAULT_TEMPLATE_AVENANT_HTML = """<h3 style="color: #000000; font-size: 20px; font-weight: bold; margin: 25px 0 15px 0; border-bottom: 2px solid #000000; padding-bottom: 8px; font-family: Arial, Helvetica, sans-serif;">AVENANT N°[NUMERO_AVENANT] AU CONTRAT DE [INTITULE_CONTRAT]</h3>

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Entre les soussignés :</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[RAISON_SOCIALE_PRESTATAIRE]</strong>,<br>
[FORME_JURIDIQUE] dont le siège est situé à [ADRESSE_PRESTATAIRE],<br>
représenté(e) par [NOM_REPRESENTANT], [FONCTION_REPRESENTANT],<br>
ci-après dénommé(e) « le Prestataire »,
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">Et :</strong>
</p>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[NOM_CLIENT]</strong>,<br>
[TYPE_CLIENT] dont le siège / domicile est situé à [ADRESSE_CLIENT],<br>
représenté(e) par [NOM_REPRESENTANT_CLIENT], [FONCTION_REPRESENTANT_CLIENT],<br>
ci-après dénommé(e) « le Client »,
</p>

<hr style="border: 1px solid #000000; margin: 30px 0;">

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 1 – Rappel du contrat initial</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Les parties ont conclu un <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">contrat de [INTITULE_CONTRAT]</strong> en date du <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[DATE_CONTRAT_INITIAL]</strong>, portant sur <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[OBJET_CONTRAT]</strong>.
</p>

<hr style="border: 1px solid #000000; margin: 30px 0;">

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 2 – Objet du présent avenant</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le présent avenant a pour objet de <strong style="font-weight: bold; color: #000000; font-family: Arial, Helvetica, sans-serif;">[TYPE_MODIFICATION]</strong> les dispositions du contrat initial, comme suit :
</p>

<div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-family: Arial, Helvetica, sans-serif;">
<p style="margin: 10px 0; line-height: 1.7; color: #000000;">
<strong style="font-weight: bold; color: #000000;">Clause modifiée :</strong> [CLAUSE_MODIFIEE]<br>
<strong style="font-weight: bold; color: #000000;">Ancienne version :</strong> « [ANCIENNE_VERSION] »<br>
<strong style="font-weight: bold; color: #000000;">Nouvelle version :</strong> « [NOUVELLE_VERSION] »
</p>
</div>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
[Ajouter autant de modifications que nécessaire]
</p>

<hr style="border: 1px solid #000000; margin: 30px 0;">

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 3 – Dispositions inchangées</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Toutes les autres clauses du contrat initial non modifiées par le présent avenant restent inchangées et continuent de produire leurs effets.
</p>

<hr style="border: 1px solid #000000; margin: 30px 0;">

<h4 style="color: #000000; font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Article 4 – Entrée en vigueur</h4>

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Le présent avenant entre en vigueur à compter de sa date de signature.
</p>

<hr style="border: 1px solid #000000; margin: 30px 0;">

<p style="margin: 15px 0; text-align: justify; font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #000000;">
Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],<br>
En deux exemplaires originaux, un pour chaque partie.
</p>

<div style="margin: 30px 0; display: flex; justify-content: space-between; font-family: Arial, Helvetica, sans-serif;">
<div style="text-align: center; width: 45%;">
<p style="margin: 10px 0; font-weight: bold; color: #000000; border-top: 1px solid #000000; padding-top: 10px;">Le Prestataire</p>
<p style="margin: 5px 0; color: #000000;">(Signature + Nom)</p>
</div>
<div style="text-align: center; width: 45%;">
<p style="margin: 10px 0; font-weight: bold; color: #000000; border-top: 1px solid #000000; padding-top: 10px;">Le Client</p>
<p style="margin: 5px 0; color: #000000;">(Signature + Nom)</p>
</div>
</div>
"""
