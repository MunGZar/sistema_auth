# 🧪 Guía de Testing - Módulo Auth

## 📋 Resumen de Tests Disponibles

### Tests Unitarios
- `auth.controller.spec.ts`
- `auth.service.spec.ts`
- `jwt.strategy.spec.ts`
- `jwt-auth.guard.spec.ts`

### Tests e2e (Integración)
- `test/auth.e2e-spec.ts`

## 🚀 Comandos de Prueba

### Tests Completos
```bash
# Ejecutar TODOS los tests del proyecto
npm test

# Solo tests del módulo auth
npm run test:auth
```

### Tests e2e
```bash
# Tests e2e (sin BD, usa mocks)
npm run test:e2e:mock
```

### Cobertura de Código
```bash
# Ver informe de cobertura
npm run test:cov
```

## 🔄 Desarrollo con Tests

### Modo Watch
```bash
# Re-ejecuta tests al guardar cambios
npm run test:watch
```

### Debug Tests
```bash
# Permite usar debugger
npm run test:debug
```

### Tests Específicos
```bash
# Un archivo específico
npx jest src/modules/auth/auth.controller.spec.ts

# Tests que contengan "login"
npx jest -t "login"
```

## 🎯 Cobertura Mínima Requerida

- Líneas: > 80%
- Funciones: > 80%
- Branches: > 70%
- Statements: > 80%

## 📁 Directorios Generados

### /dist
- Contiene código compilado
- Se puede borrar seguramente
- Se regenera con `npm run build`

### /coverage
- Informes de cobertura de tests
- Se puede borrar seguramente
- Se regenera con `npm run test:cov`

## 🧾 Tests por Componente

### 1. AuthController
- **Archivo**: `auth.controller.spec.ts`
- **Tests principales**:
  - Registro de usuario exitoso
  - Login exitoso
  - Obtener perfil protegido
  - Manejo de errores

### 2. AuthService
- **Archivo**: `auth.service.spec.ts`
- **Tests principales**:
  - Validación de credenciales
  - Generación de JWT
  - Registro de auditoría
  - Estados de usuario

### 3. JwtStrategy
- **Archivo**: `jwt.strategy.spec.ts`
- **Tests principales**:
  - Validación de tokens
  - Extracción de payload
  - Usuarios inactivos

### 4. JwtAuthGuard
- **Archivo**: `jwt-auth.guard.spec.ts`
- **Tests principales**:
  - Protección de rutas
  - Validación de tokens
  - Manejo de errores

## 🔍 Verificación de Calidad

### Pre-commit
```bash
# Ejecutar antes de cada commit
npm run test:auth
npm run test:e2e:mock
npm run lint
```

### Integración Continua
```bash
# Verificación completa
npm run build
npm test
npm run test:e2e:mock
npm run lint
```

## 🐛 Debug de Tests

### VS Code Launch Config
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/jest/bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Break Points
1. Coloca break points en el código
2. Usa `npm run test:debug`
3. Adjunta el debugger

## 📊 Análisis de Cobertura

### Ver Informe Detallado
```bash
# Generar informe HTML
npm run test:cov

# Abrir coverage/lcov-report/index.html
```

### Áreas Críticas
- Validación de tokens
- Manejo de estados de usuario
- Auditoría de accesos
- Encriptación de contraseñas

## 🔄 Flujo de Trabajo Recomendado

1. Escribe tests primero (TDD)
2. Implementa la funcionalidad
3. Verifica cobertura
4. Refactoriza si es necesario
5. Actualiza documentación

## 📝 Notas Importantes

1. **NO skipear tests**: Usar `skip` o `only` solo en desarrollo
2. **Mantener mocks actualizados**
3. **Documentar cambios en tests**
4. **Verificar cobertura regularmente**
