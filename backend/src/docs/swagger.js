import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/app.js';

const apiBaseUrl = `${config.baseUrl.replace(/\/+$/, '')}${config.apiPrefix}/${config.apiVersion}`;
const docsPath = join(dirname(fileURLToPath(import.meta.url)), 'openapi.js');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ProFixGabon API',
      version: '1.0.0',
      description: 'API REST de ProFixGabon pour les comptes, prestataires, demandes, devis, avis et conversations.',
    },
    servers: [{ url: apiBaseUrl, description: 'API configurée pour cette instance' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Jeton JWT retourné à la connexion. Saisir uniquement le jeton.',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          required: ['success', 'message', 'statusCode', 'timestamp'],
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {},
            errors: { nullable: true },
            statusCode: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'message', 'statusCode', 'timestamp'],
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { nullable: true },
            statusCode: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
      responses: {
        Success: {
          description: 'Opération réussie.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
        Created: {
          description: 'Ressource créée.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
        BadRequest: {
          description: 'Requête invalide ou données incorrectes.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Unauthorized: {
          description: 'Authentification requise ou jeton invalide.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Accès refusé pour cet utilisateur.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Ressource introuvable.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Échec de validation des données.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        TooManyRequests: {
          description: 'Limite de requêtes atteinte.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  apis: [docsPath],
};

export const swaggerSpec = swaggerJsdoc(options);