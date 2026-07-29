# Integra One RCA

Aplicación de **Rendición de Cuentas Aplicada (RCA)** para Los Pioneros Cremería:
compromisos, indicadores (KPIs) y reuniones de dirección, con permisos por alcance.

Reconstrucción en producción del prototipo `prototype_61.html`. Ver el brief técnico
para reglas de negocio y modelo de datos.

## Stack

- **Next.js 15** (App Router) + TypeScript — UI y API en un solo proyecto full-stack
- **Prisma + PostgreSQL**
- **Auth propia**: sesión en BD + cookie httpOnly + bcrypt (patrón de la suite INTEGRA)
- **Tailwind CSS** con el sistema de diseño del §7 (degradados de marca, semáforo)
- Deploy objetivo: **Vercel** + Postgres gestionado (Neon)

## Puesta en marcha (local)

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Levanta una base de datos PostgreSQL. Dos opciones:

   - **Docker** (recomendado): `docker compose up -d`
   - **Neon / Supabase**: crea una base gratis y copia su cadena de conexión.

3. Configura el entorno: copia `.env.example` a `.env` y ajusta `DATABASE_URL`.

4. Migra y siembra:

   ```bash
   npm run setup
   ```

5. Arranca:

   ```bash
   npm run dev
   ```

## Usuarios de prueba (tras el seed)

| Usuario     | Contraseña        | Puesto                   | Alcance |
| ----------- | ----------------- | ------------------------ | ------- |
| `guillermo` | `Directorio#2026` | Director General         | global  |
| `maria`     | `Operaciones#25`  | Directora de Operaciones | área    |
| `jose`      | `Admin#2025`      | Director Administrativo  | área    |
| `luis`      | `Ventas#2025`     | Director Comercial       | área    |
| `ana`       | `Proyectos#25`    | Líder de Proyectos       | propio  |

## Estado por fases

- **Fase 0 (hecha):** esqueleto, `schema.prisma`, seed, auth + sesión, layout con menú por alcance, Inicio con datos reales filtrados por alcance.
- Fase 1: Personas · Fase 2: Compromisos · Fase 3: KPIs · Fase 4: Inicio completo · Fase 5: Reuniones + PDF · Fase 6: Avance + Configuración · Fase 7 (post-v1): Reconocimientos-muro + Documentos.
