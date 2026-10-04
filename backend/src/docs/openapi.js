/**
 * @openapi
 * tags:
 *   - name: Authentification
 *   - name: Prestataires
 *   - name: Demandes
 *   - name: Devis
 *   - name: Conversations
 *   - name: Avis
 *   - name: Uploads
 *   - name: Référentiels
 * paths:
 *   /:
 *     get:
 *       tags: [Référentiels]
 *       summary: Découvrir l’API et ses routes
 *       description: Retourne les URLs des groupes de routes, de Swagger UI, du document OpenAPI et du health check.
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *   /auth/register:
 *     post:
 *       tags: [Authentification]
 *       summary: Créer un compte client
 *       description: Le type de compte est attribué côté serveur. Une candidature prestataire se fait ensuite via POST /prestataires.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [name, email, password]
 *               properties:
 *                 name: { type: string, minLength: 2, maxLength: 100 }
 *                 email: { type: string, format: email }
 *                 password: { type: string, minLength: 8, description: Majuscule, minuscule et chiffre requis. }
 *                 phone: { type: string, nullable: true }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '409': { description: Un compte existe déjà avec cet email. }
 *         '429': { $ref: '#/components/responses/TooManyRequests' }
 *   /auth/login:
 *     post:
 *       tags: [Authentification]
 *       summary: Se connecter et obtenir un JWT
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [email, password]
 *               properties:
 *                 email: { type: string, format: email }
 *                 password: { type: string, format: password }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { description: Email ou mot de passe incorrect. }
 *         '409': { description: Mot de passe à réinitialiser pour un compte migré. }
 *         '429': { $ref: '#/components/responses/TooManyRequests' }
 *   /auth/request-password-reset:
 *     post:
 *       tags: [Authentification]
 *       summary: Demander une réinitialisation du mot de passe
 *       description: La réponse est identique que l’email existe ou non. L’envoi d’email n’est pas encore configuré.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [email]
 *               properties:
 *                 email: { type: string, format: email }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *   /auth/reset-password:
 *     post:
 *       tags: [Authentification]
 *       summary: Réinitialiser un mot de passe avec un jeton
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [token, newPassword]
 *               properties:
 *                 token: { type: string }
 *                 newPassword: { type: string, minLength: 8, format: password }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '400': { $ref: '#/components/responses/BadRequest' }
 *   /auth/me:
 *     get:
 *       tags: [Authentification]
 *       summary: Récupérer le compte connecté
 *       security: [{ BearerAuth: [] }]
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /auth/profile:
 *     put:
 *       tags: [Authentification]
 *       summary: Mettre à jour le profil du compte connecté
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name: { type: string, minLength: 2, maxLength: 100 }
 *                 phone: { type: string, nullable: true }
 *                 profileImage: { type: string, format: uri, nullable: true }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /auth/change-password:
 *     put:
 *       tags: [Authentification]
 *       summary: Changer le mot de passe
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [currentPassword, newPassword]
 *               properties:
 *                 currentPassword: { type: string, format: password }
 *                 newPassword: { type: string, minLength: 8, format: password }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /auth/mode:
 *     put:
 *       tags: [Authentification]
 *       summary: Changer le mode du compte
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [mode]
 *               properties:
 *                 mode: { type: string, enum: [client, prestataire] }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /auth/logout:
 *     post:
 *       tags: [Authentification]
 *       summary: Se déconnecter
 *       description: Le client doit supprimer localement son JWT après cet appel.
 *       security: [{ BearerAuth: [] }]
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *
 *   /prestataires:
 *     get:
 *       tags: [Prestataires]
 *       summary: Lister les prestataires publics
 *       description: Par défaut, seuls les profils validés et disponibles sont retournés.
 *       parameters:
 *         - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 15 } }
 *         - { in: query, name: categorie, schema: { type: string } }
 *         - { in: query, name: ville, schema: { type: string } }
 *         - { in: query, name: search, schema: { type: string } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *     post:
 *       tags: [Prestataires]
 *       summary: Soumettre une candidature prestataire
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [nom, categorie, ville, description]
 *               properties:
 *                 nom: { type: string, minLength: 2, maxLength: 150 }
 *                 categorie: { type: string, minLength: 2, maxLength: 100 }
 *                 ville: { type: string, minLength: 2, maxLength: 100 }
 *                 description: { type: string, minLength: 10, maxLength: 2000 }
 *                 experience: { type: string, maxLength: 100 }
 *                 skills: { type: array, items: { type: string } }
 *                 photo: { type: string, format: uri }
 *                 galerie: { type: array, items: { type: string, format: uri } }
 *                 pieceIdentite: { type: string, format: uri }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '409': { description: Un profil existe déjà pour ce compte. }
 *   /prestataires/me/profile:
 *     get:
 *       tags: [Prestataires]
 *       summary: Récupérer son profil prestataire
 *       security: [{ BearerAuth: [] }]
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /prestataires/admin/pending:
 *     get:
 *       tags: [Prestataires]
 *       summary: Lister les candidatures à valider
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, maximum: 100 } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /prestataires/admin/all:
 *     get:
 *       tags: [Prestataires]
 *       summary: Lister tous les profils prestataires (admin)
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, maximum: 100 } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /prestataires/{id}:
 *     get:
 *       tags: [Prestataires]
 *       summary: Récupérer un prestataire par identifiant
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     put:
 *       tags: [Prestataires]
 *       summary: Modifier son profil prestataire
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nom: { type: string }
 *                 categorie: { type: string }
 *                 ville: { type: string }
 *                 description: { type: string, maxLength: 2000 }
 *                 experience: { type: string, nullable: true }
 *                 skills: { type: array, items: { type: string } }
 *                 photo: { type: string, format: uri, nullable: true }
 *                 galerie: { type: array, items: { type: string, format: uri } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *     patch:
 *       tags: [Prestataires]
 *       summary: Modifier sa disponibilité
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [available]
 *               properties:
 *                 available: { type: boolean }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /prestataires/{id}/validate:
 *     post:
 *       tags: [Prestataires]
 *       summary: Valider un profil prestataire (admin)
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /prestataires/{id}/reject:
 *     post:
 *       tags: [Prestataires]
 *       summary: Rejeter une candidature prestataire (admin)
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *
 *   /demandes:
 *     get:
 *       tags: [Demandes]
 *       summary: Lister ses demandes
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, maximum: 100 } }
 *         - { in: query, name: as, schema: { type: string, enum: [client, prestataire] } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *     post:
 *       tags: [Demandes]
 *       summary: Créer une demande de service
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [prestataireId, description]
 *               properties:
 *                 prestataireId: { type: integer }
 *                 categorie: { type: string, maxLength: 100 }
 *                 description: { type: string, minLength: 10, maxLength: 2000 }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /demandes/{id}:
 *     get:
 *       tags: [Demandes]
 *       summary: Récupérer une demande
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *
 *   /devis:
 *     get:
 *       tags: [Devis]
 *       summary: Lister ses devis
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, maximum: 100 } }
 *         - { in: query, name: as, schema: { type: string, enum: [client, prestataire] } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *     post:
 *       tags: [Devis]
 *       summary: Créer un devis (prestataire)
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [clientId, montant]
 *               properties:
 *                 demandeId: { type: integer, nullable: true }
 *                 clientId: { type: integer }
 *                 montant: { type: number, minimum: 0, exclusiveMinimum: true, maximum: 999999999 }
 *                 description: { type: string, maxLength: 2000, nullable: true }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /devis/{id}:
 *     get:
 *       tags: [Devis]
 *       summary: Récupérer un devis
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /devis/{id}/accepter:
 *     post:
 *       tags: [Devis]
 *       summary: Accepter un devis (client destinataire)
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /devis/{id}/refuser:
 *     post:
 *       tags: [Devis]
 *       summary: Refuser un devis (client destinataire)
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *
 *   /conversations:
 *     get:
 *       tags: [Conversations]
 *       summary: Lister ses conversations
 *       security: [{ BearerAuth: [] }]
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *     post:
 *       tags: [Conversations]
 *       summary: Récupérer ou créer une conversation avec un prestataire
 *       security: [{ BearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [prestataireUserId]
 *               properties:
 *                 prestataireUserId: { type: integer }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '400': { $ref: '#/components/responses/BadRequest' }
 *   /conversations/{id}/messages:
 *     get:
 *       tags: [Conversations]
 *       summary: Lister les messages d’une conversation
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *         - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *         - { in: query, name: limit, schema: { type: integer, maximum: 100 } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     post:
 *       tags: [Conversations]
 *       summary: Envoyer un message
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [contenu]
 *               properties:
 *                 contenu: { type: string, minLength: 1, maxLength: 2000 }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /conversations/{id}/read:
 *     post:
 *       tags: [Conversations]
 *       summary: Marquer les messages comme lus
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: id, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *
 *   /avis/{prestataireId}:
 *     get:
 *       tags: [Avis]
 *       summary: Lister les avis d’un prestataire
 *       parameters:
 *         - { in: path, name: prestataireId, required: true, schema: { type: integer } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *     post:
 *       tags: [Avis]
 *       summary: Publier un avis
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: path, name: prestataireId, required: true, schema: { type: integer } }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [note, commentaire]
 *               properties:
 *                 note: { type: integer, minimum: 1, maximum: 5 }
 *                 commentaire: { type: string, minLength: 10, maxLength: 500 }
 *       responses:
 *         '201': { $ref: '#/components/responses/Created' }
 *         '400': { $ref: '#/components/responses/BadRequest' }
 *
 *   /uploads/signature:
 *     get:
 *       tags: [Uploads]
 *       summary: Générer une signature d’upload Cloudinary
 *       security: [{ BearerAuth: [] }]
 *       parameters:
 *         - { in: query, name: folder, schema: { type: string, enum: [general, identite] } }
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *
 *   /reference/villes:
 *     get:
 *       tags: [Référentiels]
 *       summary: Lister les villes disponibles
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 *   /reference/categories:
 *     get:
 *       tags: [Référentiels]
 *       summary: Lister les catégories de services
 *       responses:
 *         '200': { $ref: '#/components/responses/Success' }
 */
export {};