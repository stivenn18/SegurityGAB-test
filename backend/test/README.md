# Guía de Pruebas - SegurityGAB Backend

Este directorio contiene una suite completa de pruebas organizadas por tipo. Cada tipo de prueba tiene un propósito específico y se ejecuta en diferentes etapas del desarrollo y despliegue.

## 📁 Estructura de Carpetas

```
test/
├── black-box/          # Pruebas de Caja Negra
├── white-box/          # Pruebas de Caja Blanca
├── integration/        # Pruebas de Integración
├── unit/               # Pruebas Unitarias
├── regression/         # Pruebas de Regresión
├── smoke/              # Pruebas de Smoke (Sanidad)
└── performance/        # Pruebas de Performance
```

## 🧪 Tipos de Pruebas

### 1. Pruebas de Caja Negra (`black-box/`)

**¿Qué son?**
Pruebas que validan el comportamiento del sistema desde la perspectiva del usuario, sin conocer la implementación interna.

**Características:**
- Se enfocan en entradas y salidas
- No conocen el código interno
- Validan requisitos funcionales
- Prueban la API como un usuario externo

**Archivos:**
- `auth.e2e-spec.ts` - Pruebas del módulo de autenticación
- `products.e2e-spec.ts` - Pruebas del CRUD de productos

**Ejecutar:**
```bash
npm run test:e2e -- black-box/
```

### 2. Pruebas de Caja Blanca (`white-box/`)

**¿Qué son?**
Pruebas que examinan la estructura interna del código, incluyendo rutas de ejecución, condiciones y lógica.

**Características:**
- Conocen la implementación interna
- Prueban todas las rutas de código
- Verifican cobertura de branches y statements
- Analizan complejidad ciclomática

**Archivos:**
- `auth-service.spec.ts` - Análisis interno de AuthService

**Ejecutar:**
```bash
npm test -- white-box/
```

### 3. Pruebas de Integración (`integration/`)

**¿Qué son?**
Pruebas que verifican que múltiples módulos funcionen correctamente cuando se combinan.

**Características:**
- Prueban interacciones entre módulos
- Verifican flujos completos
- Validan integración de base de datos
- Prueban transacciones y atomicidad

**Archivos:**
- `auth-products-flow.spec.ts` - Integración entre Auth, Users y Products

**Ejecutar:**
```bash
npm run test:e2e -- integration/
```

### 4. Pruebas Unitarias (`unit/`)

**¿Qué son?**
Pruebas de unidades individuales de código en completo aislamiento usando mocks.

**Características:**
- Aíslan componentes usando mocks
- Prueban una función/método a la vez
- Son rápidas de ejecutar
- No dependen de servicios externos

**Archivos:**
- `products-service.spec.ts` - Pruebas unitarias de ProductsService

**Ejecutar:**
```bash
npm test -- unit/
```

### 5. Pruebas de Regresión (`regression/`)

**¿Qué son?**
Pruebas que verifican que funcionalidades previamente corregidas no vuelvan a fallar.

**Características:**
- Documentan bugs previos
- Previenen reintroducción de errores
- Mantienen estabilidad del sistema
- Incluyen casos de bugs conocidos

**Archivos:**
- `critical-flows.spec.ts` - Verificación de bugs corregidos y flujos críticos

**Ejecutar:**
```bash
npm run test:e2e -- regression/
```

### 6. Pruebas de Smoke (`smoke/`)

**¿Qué son?**
Pruebas básicas y rápidas que verifican que las funcionalidades principales estén operativas.

**Características:**
- Son las primeras en ejecutarse después de un deploy
- Verifican que el sistema "prende"
- Rápidas de ejecutar
- Si fallan, detienen todo el proceso

**Archivos:**
- `api-health.spec.ts` - Verificación de salud de la API

**Ejecutar:**
```bash
npm run test:e2e -- smoke/
```

**Cuándo usarlas:**
- Después de cada despliegue
- Antes de ejecutar suite completa
- En pipelines de CI/CD como primer paso

### 7. Pruebas de Performance (`performance/`)

**¿Qué son?**
Pruebas que evalúan el comportamiento del sistema bajo carga y estrés.

**Características:**
- Miden tiempos de respuesta
- Prueban con múltiples usuarios concurrentes
- Identifican límites del sistema
- Calculan throughput

**Archivos:**
- `load-stress.spec.ts` - Pruebas de carga y estrés

**Ejecutar:**
```bash
npm run test:e2e -- performance/
```

## 🚀 Comandos de Ejecución

### Ejecutar todas las pruebas E2E
```bash
npm run test:e2e
```

### Ejecutar pruebas unitarias
```bash
npm test
```

### Ejecutar con cobertura
```bash
npm run test:cov
```

### Ejecutar un tipo específico
```bash
npm run test:e2e -- black-box/
npm run test:e2e -- smoke/
npm test -- unit/
```

### Ejecutar un archivo específico
```bash
npm run test:e2e -- black-box/auth.e2e-spec.ts
npm test -- unit/products-service.spec.ts
```

### Modo watch (desarrollo)
```bash
npm run test:watch
```

## 📊 Orden Recomendado de Ejecución

1. **Smoke Tests** - Verificar que el sistema funciona básicamente
2. **Unit Tests** - Probar unidades aisladas
3. **Integration Tests** - Verificar integración entre módulos
4. **Black-box Tests** - Validar funcionalidad completa
5. **Regression Tests** - Asegurar que bugs no regresen
6. **Performance Tests** - Validar rendimiento

## 🎯 Mejores Prácticas

### General
- Mantener pruebas independientes entre sí
- Usar nombres descriptivos para las pruebas
- Un concepto por prueba
- Limpiar datos después de cada prueba

### Caja Negra
- No asumir implementación interna
- Probar casos válidos e inválidos
- Verificar códigos de estado HTTP
- Validar estructura de respuestas

### Caja Blanca
- Cubrir todas las ramas del código
- Probar condiciones límite
- Verificar manejo de errores
- Usar mocks apropiadamente

### Integración
- Probar flujos completos de usuario
- Verificar transacciones
- Probar rollbacks
- Validar consistencia de datos

### Performance
- Establecer baselines claros
- Medir múltiples veces
- Documentar resultados
- No ejecutar en paralelo con otras pruebas

## 🔍 Cobertura de Código

Para generar reporte de cobertura:

```bash
npm run test:cov
```

El reporte se generará en `coverage/` y puede verse en el navegador:

```bash
open coverage/lcov-report/index.html
```

## 📈 Métricas de Calidad

### Objetivos de Cobertura
- **Líneas:** > 80%
- **Funciones:** > 80%
- **Branches:** > 75%
- **Statements:** > 80%

### Performance Targets
- **GET requests:** < 100ms
- **POST requests:** < 500ms
- **Login:** < 300ms
- **Throughput:** > 10 req/s

## 🐛 Reportar Problemas

Si una prueba falla:

1. Verificar que el ambiente esté configurado correctamente
2. Revisar logs de la prueba
3. Ejecutar la prueba individualmente
4. Verificar que no sea un problema de timing
5. Reportar bug con reproducción clara

## 📚 Referencias

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## 🎓 Conceptos Clave

### Pirámide de Pruebas
```
        /\
       /  \  E2E
      /____\
     /      \ Integration
    /________\
   /          \ Unit
  /____________\
```

- **Base:** Muchas pruebas unitarias (rápidas, específicas)
- **Medio:** Algunas pruebas de integración (validan colaboración)
- **Cima:** Pocas pruebas E2E (lentas, validan flujos completos)

### AAA Pattern (Arrange-Act-Assert)
```typescript
it('should do something', () => {
  // Arrange: Preparar datos y mocks
  const data = { name: 'Test' };
  
  // Act: Ejecutar la acción
  const result = service.method(data);
  
  // Assert: Verificar resultado
  expect(result).toBe(expected);
});
```

### Tipos de Mocks
- **Mock:** Objeto simulado con comportamiento predefinido
- **Stub:** Respuesta fija a llamadas
- **Spy:** Observa llamadas sin modificar comportamiento
- **Fake:** Implementación simplificada funcional

## 🛠️ Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Port already in use"
- Las pruebas E2E usan un servidor de prueba
- No debe estar corriendo otra instancia

### "Timeout exceeded"
- Aumentar timeout en jest.config.js
- O en la prueba específica: `it('...', async () => {...}, 30000)`

### "Database connection failed"
- Las pruebas usan base de datos en memoria (sqljs)
- No requieren MySQL corriendo

## 📝 Notas Adicionales

- Todas las pruebas E2E usan base de datos en memoria
- Los mocks permiten pruebas rápidas sin dependencias
- Las pruebas están diseñadas para ejecutarse en CI/CD
- Se recomienda ejecutar smoke tests antes de commit
