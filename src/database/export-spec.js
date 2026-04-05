import swaggerJsdoc from 'swagger-jsdoc';
import { writeFileSync } from 'node:fs';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinTrack API',
      version: '1.0.0',
      description: 'API for Finance Data Processing and Access Control',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.js'],
};

const spec = swaggerJsdoc(swaggerOptions);

writeFileSync('./docs/openapi.json', JSON.stringify(spec, null, 2));
console.log('OpenAPI spec exported to docs/openapi.json');
