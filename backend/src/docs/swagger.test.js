import { swaggerSpec } from './swagger.js';

describe('OpenAPI documentation', () => {
  it('generates the complete versioned API specification', () => {
    const operationCount = Object.values(swaggerSpec.paths)
      .reduce((total, path) => total + Object.keys(path).length, 0);

    expect(swaggerSpec.openapi).toBe('3.0.3');
    expect(swaggerSpec.info.title).toBe('ProFixGabon API');
    expect(Object.keys(swaggerSpec.paths)).toHaveLength(30);
    expect(operationCount).toBe(38);
    expect(swaggerSpec.paths['/'].get.summary).toContain('Découvrir');
    expect(swaggerSpec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
  });
});