
# DeployManager - Clean Architecture + React SPA Specs

## Objetivo

Construir una plataforma web profesional para automatizar despliegues ASP.NET hacia:

- IIS Windows Servers
- Azure App Services
- FTPS
- UNC Paths
- futuros conectores

El sistema debe ser:

- mantenible
- escalable
- desacoplado
- extensible
- configurable sin recompilar
- alineado a buenas prácticas modernas

---

# Arquitectura General

## Principios obligatorios

- Clean Architecture
- SOLID
- CQRS
- Repository Pattern
- Dependency Injection
- Separation of Concerns
- Feature Based Frontend Architecture
- Backend desacoplado
- Frontend SPA desacoplado
- Configuración externalizada
- Async/Await obligatorio
- Logging centralizado
- Manejo global de excepciones

---

# Stack Tecnológico

## Backend

- ASP.NET Core 8 Web API
- Entity Framework Core
- SQL Server
- MediatR
- FluentValidation
- NLog
- FluentFTP

## Frontend

- React
- TypeScript
- Vite
- React Router
- React Query
- Axios
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod

---

# Estructura de Solución

## Backend

- DeployManager.Api
- DeployManager.Application
- DeployManager.Domain
- DeployManager.Infrastructure
- DeployManager.Worker

## Frontend

- DeployManager.Client

---

# Arquitectura Esperada

React SPA
↓
ASP.NET Core REST API
↓
Application Layer
↓
Domain Layer
↓
Infrastructure Layer
↓
Deploy Worker

---

# Reglas Arquitectónicas

## Domain

NO puede depender de:

- Infrastructure
- EF Core
- ASP.NET
- SQL

## Application

Debe contener:

- Commands
- Queries
- Handlers
- Validators
- DTOs
- Interfaces

## Infrastructure

Debe contener:

- EF Core
- SQL
- FTP
- Azure Deploy
- FileSystem
- Logging
- Encryption

## API

Debe contener:

- Controllers
- Middleware
- Swagger
- JWT
- DI
- Exception Handling

## Frontend

NO debe contener lógica de negocio.

React solo debe:

- renderizar UI
- manejar estado visual
- consumir APIs
- validar formularios básicos

Toda lógica debe residir en Backend.

---

# Arquitectura Frontend

src/
├── app/
├── features/
│   ├── auth/
│   ├── deploy-sites/
│   ├── deploy-rules/
│   ├── deploy-history/
│   ├── rollback/
│   └── dashboard/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── types/
│   ├── utils/
│   └── constants/
├── routes/
├── providers/
└── main.tsx

---

# Flujo Profesional de Despliegue

1. Usuario sube ZIP
2. API crea DeployJob
3. Worker consume DeployJob
4. Worker analiza reglas
5. Worker crea backup
6. Worker ejecuta despliegue
7. Worker registra logs
8. Frontend consulta progreso
9. Usuario puede hacer rollback

---

# Reglas Configurables

El sistema NO debe requerir recompilación.

Las reglas deben almacenarse en:

- SQL Server
o
- JSON configurable

Ejemplo:

```json
{
  "rules": [
    {
      "pattern": "bin/**/*.dll",
      "action": "copy_overwrite"
    },
    {
      "pattern": "VIEW/**/*.aspx",
      "action": "copy_overwrite"
    },
    {
      "pattern": "VIEW/**/*.master",
      "action": "copy_if_not_exists"
    }
  ]
}
```

---

# Módulos MVP

- Autenticación JWT
- Roles
- Ambientes
- Sitios
- Reglas de despliegue
- Upload ZIP
- Preview despliegue
- Backup
- Despliegue
- Historial
- Rollback
- Logs

---

# Worker Obligatorio

La lógica de despliegue NO debe ejecutarse dentro de la API.

Debe existir:

- DeployManager.Worker

Responsabilidades:

- ejecutar despliegues
- copiar archivos
- conectar FTPS
- rollback
- backups
- logging

---

# Prompt Inicial OpenCode

Lee completamente todos los archivos contenidos en /docs/specs y /docs/architecture.

Construye la solución inicial siguiendo estrictamente:

- Clean Architecture
- SOLID
- CQRS
- Repository Pattern
- Dependency Injection
- Arquitectura desacoplada
- Arquitectura mantenible y extensible
- Frontend desacoplado SPA
- Backend REST API

Tecnologías Backend:

- ASP.NET Core 8 Web API
- SQL Server
- Entity Framework Core
- FluentFTP
- NLog
- MediatR
- FluentValidation

Tecnologías Frontend:

- React
- TypeScript
- Vite
- React Router
- React Query
- Axios
- TailwindCSS
- shadcn/ui

La solución debe quedar separada en proyectos:

Backend:
- DeployManager.Api
- DeployManager.Application
- DeployManager.Domain
- DeployManager.Infrastructure
- DeployManager.Worker

Frontend:
- DeployManager.Client

Genera:

Backend:
- estructura Clean Architecture
- csproj
- Program.cs
- configuración DI
- base entities
- interfaces
- repositories
- configuración EF Core
- migración inicial
- autenticación JWT
- middleware global de excepciones
- logging
- swagger

Frontend:
- estructura React profesional
- configuración Vite
- TypeScript
- React Router
- Layout principal
- sistema de rutas
- autenticación JWT
- Axios client
- manejo global de errores
- React Query provider
- TailwindCSS
- componentes base UI
- estructura modular por features

No implementes aún lógica de despliegue.
Solo crea la base arquitectónica profesional del sistema.

---

# AI_RULES.md

- Nunca acceder directamente a DbContext desde Web/API
- Toda lógica debe pasar por Application
- No usar lógica en Controllers
- Toda operación debe ser async
- No usar lógica hardcodeada
- Toda configuración debe ser configurable
- Logging obligatorio
- Manejo global de excepciones
- No generar dependencias circulares
- Domain jamás depende de Infrastructure
