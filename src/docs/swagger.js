// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API - Digital Delivery Notes',
      version: '1.0.0',
      description: 'API REST for managing clients, projects and digitally signed delivery notes.',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      },
      contact: {
        name: 'Guillermo',
        email: 'guillesdelr@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // --- User Model ---
        User: {
          type: 'object',
          required: ['email', 'password', 'name', 'lastName'],
          properties: {
            _id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
            email: { type: 'string', format: 'email', example: 'usuario@bildy.app' },
            password: { type: 'string', format: 'password', example: 'MyPassword123' },
            name: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            nif: { type: 'string', example: '12345678Z' },
            role: { type: 'string', enum: ['guest', 'admin'], default: 'admin' },
            status: { type: 'string', enum: ['pending', 'verified'], default: 'pending' },
            company: { type: 'string', description: 'ID de la compañía asociada' },
            address: { $ref: '#/components/schemas/Address' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // --- Company Model ---
        Company: {
          type: 'object',
          required: ['name', 'cif'],
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string', description: 'ID del usuario propietario' },
            name: { type: 'string', example: 'Bildy Construcciones S.L.' },
            cif: { type: 'string', example: 'B12345678' },
            logo: { type: 'string', format: 'uri' },
            isFreelance: { type: 'boolean', default: false },
            address: { $ref: '#/components/schemas/Address' }
          }
        },
        // --- Client Model ---
        Client: {
          type: 'object',
          required: ['name', 'cif', 'email'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Cliente Ejemplo S.A.' },
            cif: { type: 'string', example: 'A87654321' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+34600000000' },
            address: { $ref: '#/components/schemas/Address' },
            company: { type: 'string' },
            deleted: { type: 'boolean', default: false }
          }
        },
        // --- Project Model ---
        Project: {
          type: 'object',
          required: ['name', 'email', 'projectCode', 'client'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Reforma Hotel Centro' },
            projectCode: { type: 'string', example: 'PRJ-2024-001' },
            email: { type: 'string', format: 'email' },
            client: { type: 'string', description: 'ID del cliente asociado' },
            active: { type: 'boolean', default: true },
            notes: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' }
          }
        },
        // --- Delivery Note Model ---
        DeliveryNote: {
          type: 'object',
          required: ['project', 'format'],
          properties: {
            _id: { type: 'string' },
            project: { type: 'string' },
            client: { type: 'string' },
            description: { type: 'string', example: 'Instalación de tuberías planta 1' },
            workDate: { type: 'string', format: 'date' },
            format: { type: 'string', enum: ['material', 'hours'] },
            material: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            hours: { type: 'number' },
            workers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hours: { type: 'string' }
                }
              }
            },
            signed: { type: 'boolean', default: false },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string', format: 'uri' },
            pdfUrl: { type: 'string', format: 'uri' }
          }
        },
        // --- Common Address Schema ---
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string', example: 'Calle Falsa' },
            number: { type: 'string', example: '123' },
            postal: { type: 'string', example: '28001' },
            city: { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);