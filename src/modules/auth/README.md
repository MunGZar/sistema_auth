# 📋 Módulo de Autenticación - Documentación Completa

## 🚀 Instalación de Dependencias (Para Compañeros)

**⚠️ IMPORTANTE**: Si clonas el repositorio o actualizas el código, debes instalar las dependencias.

### Comandos Necesarios

**⚠️ IMPORTANTE**: El `package.json` está dentro de la carpeta `sistema_auth`, NO en la raíz del proyecto.

```bash
# 1. Navegar a la carpeta del proyecto NestJS (OBLIGATORIO)
cd sistema_auth

# 2. Instalar todas las dependencias (OBLIGATORIO)
npm install
```

**Si estás en la raíz del proyecto (`P2`), primero debes entrar a `sistema_auth`:**
```powershell
# Windows PowerShell
cd sistema_auth
npm install
```

### Dependencias Agregadas para el Módulo Auth

Las siguientes dependencias ya están en `package.json` y se instalarán con `npm install`:

**Producción:**
- `@nestjs/jwt` - Módulo JWT de NestJS
- `@nestjs/passport` - Integración Passport con NestJS
- `passport` - Framework de autenticación
- `passport-jwt` - Estrategia JWT para Passport
- `nodemailer` - Para envío de correos (pendiente de usar)

**Desarrollo (tipos TypeScript):**
- `@types/passport-jwt` - Tipos para passport-jwt
- `@types/nodemailer` - Tipos para nodemailer

### Verificar Instalación

**⚠️ Asegúrate de estar en la carpeta `sistema_auth` antes de ejecutar estos comandos:**

```bash
# Verificar que estás en el directorio correcto (debe mostrar package.json)
ls package.json  # Linux/Mac
dir package.json  # Windows

# Verificar que no hay errores
npm run build

# O iniciar en modo desarrollo
npm run start:dev
```

### ⚠️ Si hay Errores

Si al ejecutar el proyecto hay errores de módulos no encontrados:

```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Verificación de Calidad

### Buenas Prácticas Implementadas

- ✅ **Separación de responsabilidades**: Controller → Service → Repository
- ✅ **Inyección de dependencias**: Uso correcto de `@Injectable()` y `@InjectRepository()`
- ✅ **Validación de datos**: DTOs con `class-validator`
- ✅ **Manejo de errores**: Excepciones específicas (`UnauthorizedException`, `BadRequestException`)
- ✅ **Seguridad**:
  - Contraseñas encriptadas con bcrypt
  - JWT con expiración
  - Validación de estado de usuario
  - Guards para proteger rutas
- ✅ **Auditoría**: Registro de eventos `login_ok` y `login_fail`
- ✅ **Normalización**: Inputs normalizados (trim, lowercase) en login
- ✅ **No exposición de datos sensibles**: Contraseñas nunca se retornan

### Estado del Código

- ✅ **Sin errores críticos**: Solo warnings menores de estilo (readonly)
- ✅ **TypeScript**: Tipado correcto en todos los archivos
- ✅ **Estructura modular**: Organización clara por carpetas

---

## 📁 Estructura Completa del Módulo Auth

```
src/modules/auth/
├── auth.controller.ts          # Controlador HTTP (endpoints)
├── auth.service.ts             # Lógica de negocio
├── auth.module.ts             # Configuración del módulo
├── dto/
│   ├── register.dto.ts       # Validaciones para registro
│   └── login.dto.ts           # Validaciones para login
├── guards/
│   └── jwt-auth.guard.ts     # Guard para proteger rutas con JWT
├── strategies/
│   └── jwt.strategy.ts       # Estrategia Passport JWT
└── templates/
    ├── reset-password.hbs     # Plantilla para recuperación de contraseña
    └── welcome.hbs            # Plantilla para correo de bienvenida
```

---

## 📄 Archivos y Responsabilidades

### 1. **auth.controller.ts**

**Ubicación**: `src/modules/auth/auth.controller.ts`

**Responsabilidad**: Maneja las peticiones HTTP y delega la lógica al servicio.

**Endpoints**:

- `POST /auth/register` - Registro de nuevos usuarios
- `POST /auth/login` - Inicio de sesión
- `GET /auth/perfil` - Obtener perfil del usuario autenticado (protegido con JWT)

**Flujo**:

```
Request → Controller → Service → Response
```

**Código clave**:

```typescript
@Controller('auth')  // Prefijo de ruta: /auth
export class AuthController {
  // Inyección del servicio
  constructor(private readonly authService: AuthService) {}
  
  // Endpoint público
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  
  // Endpoint protegido
  @Get('perfil')
  @UseGuards(JwtAuthGuard)  // Requiere token JWT válido
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
```

---

### 2. **auth.service.ts**

**Ubicación**: `src/modules/auth/auth.service.ts`

**Responsabilidad**: Contiene toda la lógica de negocio de autenticación.

**Métodos principales**:

#### `register(registerDto: RegisterDto)`

- **Qué hace**: Crea un nuevo usuario usando `UsersService`
- **Validaciones**: Realizadas por el DTO y `UsersService`
- **Seguridad**:
  - Contraseña encriptada con bcrypt (en UsersService)
  - Estado inicial: `ACTIVE`
  - Rol inicial: `USER`
- **Auditoría**: Registrada automáticamente por `UsersService`
- **Retorna**: Usuario sin contraseña

#### `login(loginDto: LoginDto)`

- **Qué hace**: Autentica usuario y genera JWT
- **Flujo**:
  1. Normaliza input (trim, lowercase)
  2. Busca usuario por email o nombreUsuario
  3. Verifica estado activo
  4. Compara contraseña con bcrypt
  5. Genera JWT con payload (userId, role, status)
  6. Registra evento en audit_logs
- **Auditoría**:
  - `login_ok` si es exitoso
  - `login_fail` si falla (usuario no existe, desactivado, contraseña incorrecta)
- **Retorna**: `{ accessToken, user }`

#### `getProfile(userId: number)`

- **Qué hace**: Obtiene datos del usuario autenticado
- **Seguridad**: Nunca retorna la contraseña
- **Retorna**: Todos los datos del usuario excepto password

**Dependencias inyectadas**:

- `usersRepository`: Para consultas directas a la BD
- `auditRepository`: Para registrar eventos
- `jwtService`: Para generar tokens JWT
- `usersService`: Para crear usuarios (reutiliza lógica existente)

---

### 3. **auth.module.ts**

**Ubicación**: `src/modules/auth/auth.module.ts`

**Responsabilidad**: Configura y registra todos los componentes del módulo.

**Configuraciones**:

- **TypeORM**: Registra repositorios de `User` y `AuditLog`
- **JWT**: Configuración del módulo JWT
  - Secret: `process.env.JWT_SECRET` o 'default-secret'
  - Expiración: 24 horas
- **Passport**: Módulo para estrategias de autenticación
- **UsersModule**: Importa para usar `UsersService`

**Providers**:

- `AuthService`: Servicio principal
- `JwtStrategy`: Estrategia Passport para JWT
- `JwtAuthGuard`: Guard para proteger rutas

**Exports**:

- `AuthService`: Para usar en otros módulos
- `JwtAuthGuard`: Para proteger rutas en otros módulos

---

### 4. **DTOs (Data Transfer Objects)**

#### **register.dto.ts**

**Ubicación**: `src/modules/auth/dto/register.dto.ts`

**Responsabilidad**: Define y valida los datos de entrada para registro.

**Campos validados**:

- `nombreUsuario`:
  - Requerido, string
  - Mínimo 3 caracteres
  - Máximo 30 caracteres
- `email`:
  - Requerido
  - Formato de email válido
- `password`:
  - Requerido
  - Mínimo 8 caracteres
  - Debe contener: mayúscula, minúscula, número, carácter especial

**Ejemplo de uso**:

```typescript
{
  "nombreUsuario": "juan123",
  "email": "juan@example.com",
  "password": "Password123!"
}
```

#### **login.dto.ts**

**Ubicación**: `src/modules/auth/dto/login.dto.ts`

**Responsabilidad**: Define y valida los datos de entrada para login.

**Campos validados**:

- `emailOrUsername`:
  - Requerido, string
  - Puede ser email o nombreUsuario
- `password`:
  - Requerido, string

**Ejemplo de uso**:

```typescript
{
  "emailOrUsername": "juan@example.com",  // o "juan123"
  "password": "Password123!"
}
```

---

### 5. **jwt-auth.guard.ts**

**Ubicación**: `src/modules/auth/guards/jwt-auth.guard.ts`

**Responsabilidad**: Protege rutas verificando que el usuario tenga un JWT válido.

**Flujo de validación**:

1. Extrae token del header `Authorization: Bearer <token>`
2. Verifica firma y expiración del token
3. Busca usuario en la BD por `userId` del payload
4. Verifica que el usuario existe
5. Verifica que el usuario está activo
6. Adjunta el usuario al `request` para uso en controladores

**Uso**:

```typescript
@Get('perfil')
@UseGuards(JwtAuthGuard)  // Protege esta ruta
async getProfile(@Request() req) {
  // req.user contiene el usuario autenticado
  return this.authService.getProfile(req.user.id);
}
```

**Errores que lanza**:

- `UnauthorizedException('Token no proporcionado')` - Si no hay token
- `UnauthorizedException('Usuario no encontrado')` - Si el usuario no existe
- `UnauthorizedException('Usuario desactivado')` - Si el usuario está inactivo
- `UnauthorizedException('Token inválido o expirado')` - Si el token es inválido

---

### 6. **jwt.strategy.ts**

**Ubicación**: `src/modules/auth/strategies/jwt.strategy.ts`

**Responsabilidad**: Estrategia Passport para validar tokens JWT.

**Interfaz JwtPayload**:

```typescript
interface JwtPayload {
  userId: number;
  role: string;
  status: string;
}
```

**Método validate**:

- Se ejecuta automáticamente cuando Passport valida un token
- Verifica que el usuario existe y está activo
- Retorna el usuario completo para adjuntarlo al request

**Nota**: Actualmente no se usa directamente, pero está disponible para uso futuro con `@UseGuards(AuthGuard('jwt'))`.

---

### 7. **Templates (.hbs)**

#### **reset-password.hbs**

**Ubicación**: `src/modules/auth/templates/reset-password.hbs`

**Responsabilidad**: Plantilla Handlebars para correo de recuperación de contraseña.

**Variables**:

- `{{name}}`: Nombre del usuario
- `{{resetPasswordCode}}`: Código OTP de 6 dígitos

**Uso futuro**: Para cuando se implemente la recuperación de contraseña.

#### **welcome.hbs**

**Ubicación**: `src/modules/auth/templates/welcome.hbs`

**Responsabilidad**: Plantilla Handlebars para correo de bienvenida.

**Variables**:

- `{{name}}`: Nombre del usuario

**Uso futuro**: Para cuando se implemente el envío de correo de bienvenida.

---

## 🔄 Flujos Completos

### Flujo de Registro

```
1. Cliente → POST /auth/register { nombreUsuario, email, password }
2. Controller → Valida DTO (class-validator)
3. Service.register() → Llama a UsersService.create()
4. UsersService → Valida duplicados, encripta password, crea usuario
5. UsersService → Registra evento en audit_logs
6. Service → Retorna usuario sin contraseña
7. Cliente ← Usuario creado
```

### Flujo de Login

```
1. Cliente → POST /auth/login { emailOrUsername, password }
2. Controller → Valida DTO
3. Service.login() → Normaliza input (trim, lowercase)
4. Service → Busca usuario por email o nombreUsuario
5. Service → Verifica estado activo
6. Service → Compara contraseña con bcrypt
7. Service → Genera JWT con payload (userId, role, status)
8. Service → Registra evento login_ok en audit_logs
9. Cliente ← { accessToken, user }
```

### Flujo de Perfil (Protegido)

```
1. Cliente → GET /auth/perfil
   Headers: { Authorization: "Bearer <token>" }
2. JwtAuthGuard → Extrae token del header
3. Guard → Verifica token con JwtService
4. Guard → Busca usuario en BD
5. Guard → Verifica usuario activo
6. Guard → Adjunta usuario a req.user
7. Controller → Llama a Service.getProfile(req.user.id)
8. Service → Busca usuario y retorna sin contraseña
9. Cliente ← Datos del usuario
```

---

## 🔒 Seguridad Implementada

1. **Encriptación de contraseñas**: bcrypt con salt rounds 10
2. **Tokens JWT**: Firmados y con expiración (24h)
3. **Validación de estado**: Usuarios desactivados no pueden hacer login
4. **Guards**: Rutas protegidas requieren token válido
5. **Validación de inputs**: DTOs con class-validator
6. **No exposición de datos**: Contraseñas nunca se retornan
7. **Auditoría**: Todos los eventos críticos se registran

---

## ⚠️ Puntos de Atención

### Warnings del Linter (No críticos)

- Propiedades marcadas como `readonly` (mejora de estilo, no afecta funcionalidad)

### TODOs Pendientes

- **Línea 43 de auth.service.ts**: Integración con EmailService para correo de bienvenida
  - Actualmente comentado: `// await this.emailService.sendWelcomeEmail(user);`
  - Se implementará cuando el módulo de Email esté listo

### Variables de Entorno Necesarias

```env
JWT_SECRET=tu-secret-key-super-segura  # OBLIGATORIO en producción
JWT_EXPIRES_IN=24h                     # Opcional (default: 24h)
```

---

## 🧪 Cómo Probar

### Registro

```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "nombreUsuario": "testuser",
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

### Login

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "emailOrUsername": "test@example.com",
  "password": "Test123!@#"
}
```

### Perfil (requiere token)

```bash
GET http://localhost:3000/auth/perfil
Authorization: Bearer <token-del-login>
```

---

### 📝 Notas para Compañeros

1. **No modificar user.service.ts**: El módulo auth usa `UsersService` pero no lo modifica

---

## 🧪 Testing y Calidad

### Tests Disponibles

El módulo auth cuenta con tests unitarios y de integración:

- **Tests Unitarios**: `src/modules/auth/**/*.spec.ts`
  - Controller
  - Service
  - Guards
  - Strategies

- **Tests e2e**: `test/auth.e2e-spec.ts`
  - Pruebas de integración
  - No requiere base de datos (usa mocks)

### Comandos de Testing

```bash
# Ejecutar TODOS los tests
npm test

# Solo tests del módulo auth
npm run test:auth

# Tests e2e (sin BD, usa mocks)
npm run test:e2e:mock

# Ver cobertura de código
npm run test:cov
```

### Modo Desarrollo

```bash
# Re-ejecuta tests al guardar cambios
npm run test:watch

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

Para más detalles sobre testing, ver: [TESTING.md](TESTING.md)
2. **Normalización**: Solo se normaliza en login, no en registro (UsersService maneja eso)
3. **Auditoría**: Los eventos `login_ok` y `login_fail` se registran automáticamente
4. **JWT**: El secret debe estar en `.env` en producción (nunca usar 'default-secret')
5. **Templates**: Los archivos `.hbs` están listos pero no se usan aún (pendiente EmailService)

---

## ✅ Checklist de Integración

- [X] Registro envía evento de auditoría (vía UsersService)
- [X] Login verifica estado === activo antes de emitir JWT
- [X] Login registra eventos login_ok/login_fail
- [X] JWT contiene userId, role, status
- [X] Ruta /auth/perfil protegida con JwtAuthGuard
- [X] Validaciones con class-validator en DTOs
- [X] Contraseñas encriptadas con bcrypt
- [ ] EmailService para correo de bienvenida (pendiente)
- [ ] Recuperación de contraseña (pendiente)

---

**Última actualización**: Código verificado y listo para producción (excepto integración de EmailService pendiente).
