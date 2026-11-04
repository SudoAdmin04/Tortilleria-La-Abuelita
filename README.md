# Capital Flow · Frontend

Interfaz web de **Capital Flow**, un sistema de gestión financiera y operativa para un negocio
de producción y venta (tortillería): controla cuentas, movimientos, presupuestos, deudas, metas de
ahorro, ventas, compras, producción, inventario e insumos, además de la administración de usuarios,
roles y permisos.

> **Sobre el nombre.** El producto se llama **Capital Flow** (así aparece en el logo del sidebar).
> El repositorio y el `<title>` del documento conservan el nombre histórico
> `Tortilleria La Abuelita`. El backend es el proyecto hermano
> [`../Tortilleria-La-Abuelita-Backend`](../Tortilleria-La-Abuelita-Backend) (NestJS + TypeORM + PostgreSQL).

---

## Tabla de contenido

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Mapa de pantallas](#mapa-de-pantallas)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Autenticación y permisos](#autenticación-y-permisos)
- [Convenciones de desarrollo](#convenciones-de-desarrollo)
- [Documentación relacionada](#documentación-relacionada)
- [Estado y limitaciones conocidas](#estado-y-limitaciones-conocidas)

---

## Características

### Finanzas personales / tesorería

| Módulo | Qué hace |
| --- | --- |
| **Dashboard** | Resumen ejecutivo del mes: KPIs (ingresos, egresos, saldo neto, patrimonio), dona de distribución de gasto, barras ingreso vs presupuesto, cascada de flujo, resúmenes de ingresos/egresos por rubro, desglose por categoría, snapshot de deudas y de metas de ahorro. |
| **Transacciones** | Alta, edición, borrado y conciliación de movimientos (`income` / `expense` / `transfer`). Filtros por tipo, estado (`pending` / `reconciled`), cuenta, categoría, método de pago y rango de fechas. Tarjetas de resumen, distribución de gastos y fuentes de ingreso. |
| **Presupuestos** | Planeado vs ejecutado por rubro y partida, con estado (`within`, `near`, `exceeded`, `unbudgeted`). Copia de presupuestos entre periodos, ajustes recientes e historial por rubro. |
| **Calendario de presupuestos** | Vista mensual de eventos presupuestales; alta, edición y borrado de eventos con color, monto y día. |
| **Cuentas** | Bancos, efectivo y tarjetas. Saldo calculado, cuenta principal, activar/desactivar, distribución de activos y panel de conciliación. |
| **Deudas** | Pasivos por pagar y por cobrar, estadísticas, liquidación (`settle`) y amortización. |
| **Metas de ahorro** | Objetivos con aportaciones y retiros, avance del mes, historial de movimientos por meta. |

### Operación del negocio

| Módulo | Qué hace |
| --- | --- |
| **Ventas** | Registro de ventas de producto al mostrador, detalle con líneas, cancelación. |
| **Compras** | Compras de insumos a proveedores, detalle con líneas, subtotal/impuestos/total, cancelación. |
| **Producción** | Lotes producidos, consumo de insumos según receta, detalle y cancelación. |
| **Productos** | Catálogo con costo, precio, margen, activación y **editor de receta** (insumos + cantidades). |
| **Insumos** | Materias primas con unidad, stock mínimo, costo promedio y activación. |
| **Inventario** | Kardex de movimientos, alertas de stock bajo y ajustes manuales de existencias. |
| **Proveedores** | Directorio de proveedores con datos de contacto y activación. |

### Reportería

| Reporte | Contenido |
| --- | --- |
| **Reportes · Resumen** | Ingresos, egresos, saldo neto y patrimonio del mes; dona de distribución, cascada y rubros real vs presupuesto. |
| **Reportes · Analíticas** | Cashflow multi-mes, tasa de ahorro vs meta, liquidez, meses de reserva, desviación de gasto, tabla de fugas y alertas. |
| **Reportes · Presupuesto** | Planeado, ejecutado, restante y rubros excedidos del periodo. |
| **Reportes · Negocio** | Ventas, compras, producción e inventario del periodo (dashboard de negocio). |
| **Reportes · Estado de resultados** | Ingresos, costo de ventas y utilidad del periodo. |

### Administración

| Módulo | Qué hace |
| --- | --- |
| **Usuarios** | Alta, edición, activación y asignación de rol. |
| **Roles** | Niveles de acceso del sistema, activación. |
| **Permisos** | Matriz rol × pantalla con `canRead` / `canCreate` / `canUpdate` / `canDelete`; activar/desactivar en bloque, guardar y descartar cambios. |
| **Pantallas** | Catálogo de pantallas que viajan dentro del JWT como permisos. |
| **Categorías** | Rubros y partidas (máximo 2 niveles), activación. |
| **Notificaciones** | Avisos del sistema con estado leído / no leído. |
| **Bitácora** | Registro de auditoría de acciones. |

### Transversal

- **Autenticación JWT** con `access_token` + `refresh_token`, refresco automático y reintento único por petición.
- **Navegación dirigida por backend**: el sidebar se construye desde los permisos embebidos en el JWT.
- **Gating de acciones**: los botones de crear / editar / eliminar se ocultan según `canCreate` / `canUpdate` / `canDelete`.
- **Modo claro y oscuro** con `UColorModeButton` (preferencia inicial: oscuro).
- **Exportación CSV** de movimientos del mes desde el header (con BOM para Excel).
- **Búsqueda global** en el header (solo dashboard) y búsqueda por página con *debounce*.
- **Paginación** server-side en los catálogos y listados de negocio.
- **Formularios validados con Zod** sobre `UForm`.

---

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | [Nuxt 4.5](https://nuxt.com) (Vue 3.5, Nitro 2, Vite 8) |
| UI | [Nuxt UI 4.11](https://ui.nuxt.com) sobre [Tailwind CSS 4](https://tailwindcss.com) |
| Estado | [Pinia 4](https://pinia.vuejs.org) |
| Validación | [Zod 4](https://zod.dev) |
| Tipos de API | [`openapi-typescript` 7](https://openapi-ts.dev) sobre el Swagger del backend |
| Lenguaje | TypeScript 5.9 |
| Gestor de paquetes | **pnpm** (lockfile v9) |
| Iconos | Lucide (`i-lucide-*`) vía Nuxt Icon |
| Fuentes | Roboto (cuerpo, `--font-sans`); Plus Jakarta Sans e Inter precargadas desde Google Fonts |

---

## Inicio rápido

```bash
# 1. Instalar dependencias (solo pnpm)
pnpm install

# 2. Crear el archivo .env (ver sección siguiente)

# 3. Levantar en desarrollo
pnpm dev
```

La app queda en **http://localhost:5002**.

> `pnpm dev` primero ejecuta `generate:types`, que descarga el Swagger del backend.
> Si el backend no está arriba o falta `.env`, ese paso falla. Para trabajar solo en la UI:

```bash
pnpm exec nuxt dev        # omite el codegen y usa app/types/api.d.ts ya versionado
```

Para la instalación detallada y el recorrido funcional completo, consulta
**[MANUAL.md](./MANUAL.md)**.

---

## Variables de entorno

El archivo `.env` está en `.gitignore` y **no** hay `.env.example` en el repositorio. Crea el tuyo
en la raíz:

```dotenv
# Swagger del backend, solo para `pnpm generate:types`
SWAGGER_URL=http://localhost:4002/api/docs-json

# URL base de la API. DEBE incluir el sufijo /api
NUXT_PUBLIC_API_URL=http://localhost:4002/api

# Puerto del servidor Nitro en build/preview (el dev usa 5002)
NITRO_PORT=5003

# Declaradas pero aún no consumidas por el código de la app
NUXT_PUBLIC_SOCKET_URL=http://localhost:4002
NUXT_PUBLIC_FILES=http://localhost:4002/files
```

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `SWAGGER_URL` | Solo para `generate:types` | Origen del OpenAPI JSON. |
| `NUXT_PUBLIC_API_URL` | **Sí** | Base de `$api`. **Debe terminar en `/api`**: los servicios envían rutas sin prefijo y el backend NestJS aplica un prefijo global `api`. Sin él, todas las llamadas dan 404. |
| `NITRO_PORT` | No | Puerto del servidor Nitro compilado (`preview`). |
| `NUXT_PUBLIC_SOCKET_URL` | No | Reservada para tiempo real; ningún código la lee todavía. |
| `NUXT_PUBLIC_FILES` | No | Reservada para archivos estáticos; ningún código la lee todavía. |

`runtimeConfig.public.apiUrl` se declara vacío en `nuxt.config.ts` y se rellena con
`NUXT_PUBLIC_API_URL`. **Nunca hardcodees URLs**: usa `useRuntimeConfig().public.apiUrl`.

---

## Scripts disponibles

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | `pnpm generate:types && nuxt dev` → desarrollo con tipos frescos. |
| `pnpm exec nuxt dev` | Desarrollo sin codegen (usa el `api.d.ts` versionado). |
| `pnpm generate:types` | Regenera `app/types/api.d.ts` desde `SWAGGER_URL`. **El archivo está versionado**; los diffs grandes son normales. |
| `pnpm build` | Build de producción. |
| `pnpm preview` | Sirve el build (respeta `NITRO_PORT`). |
| `pnpm generate` | Generación estática. |
| `pnpm postinstall` | Ejecuta `nuxt prepare` (tipos del editor). |

> **No hay** scripts de test, lint ni typecheck. `vue-tsc` está instalado pero no está cableado a
> ningún script. No inventes comandos que no existan.

Si pnpm bloquea scripts de instalación (`ERR_PNPM_IGNORED_BUILDS`), ejecuta `pnpm approve-builds`.
La lista blanca vive en `pnpm-workspace.yaml` (`allowBuilds`).

---

## Mapa de pantallas

Todas las rutas viven bajo `app/pages/`. La ruta **es** el identificador de permiso: el backend
expone una pantalla con ese `path` y `canRead` para que aparezca en el sidebar.

### Públicas

| Ruta | Archivo | Descripción |
| --- | --- | --- |
| `/login` | `pages/login/index.vue` | Acceso con correo y contraseña. Layout `auth`. |
| `/register` | `pages/register.vue` | Alta de cuenta (siembra el catálogo base). `middleware: 'guest'`. |

### Aplicación

| Ruta | Archivo | Módulo backend |
| --- | --- | --- |
| `/dashboard` | `pages/dashboard.vue` | `finanzas` |
| `/transacciones` | `pages/transacciones/index.vue` | `finanzas` |
| `/presupuestos` | `pages/presupuestos/index.vue` | `finanzas` |
| `/presupuestos/calendario` | `pages/presupuestos/calendario.vue` | `finanzas` |
| `/presupuestos/[id]` | `pages/presupuestos/[id].vue` | `finanzas` (dinámica, no aparece en el menú) |
| `/reportes` | `pages/reportes/index.vue` | `finanzas` |
| `/reportes/analiticas` | `pages/reportes/analiticas.vue` | `finanzas` |
| `/reportes/presupuestos` | `pages/reportes/presupuestos.vue` | `finanzas` |
| `/reportes/negocio` | `pages/reportes/negocio.vue` | `finanzas` |
| `/reportes/resultados` | `pages/reportes/resultados.vue` | `finanzas` |
| `/cuentas` | `pages/cuentas/index.vue` | `finanzas` |
| `/deudas` | `pages/deudas/index.vue` | `finanzas` |
| `/metas-ahorro` | `pages/metas-ahorro/index.vue` | `finanzas` |
| `/ventas` | `pages/ventas/index.vue` | `operacion` |
| `/compras` | `pages/compras/index.vue` | `operacion` |
| `/produccion` | `pages/produccion/index.vue` | `operacion` |
| `/productos` | `pages/productos/index.vue` | `inventario` |
| `/insumos` | `pages/insumos/index.vue` | `inventario` |
| `/inventario` | `pages/inventario/index.vue` | `inventario` |
| `/proveedores` | `pages/proveedores/index.vue` | `inventario` |
| `/configuracion` | `pages/configuracion/index.vue` | `configuracion` |
| `/configuracion/usuarios` | `pages/configuracion/usuarios/index.vue` | `administracion` |
| `/configuracion/roles` | `pages/configuracion/roles/index.vue` | `seguridad` |
| `/configuracion/permisos` | `pages/configuracion/permisos/index.vue` | `seguridad` |
| `/configuracion/pantallas` | `pages/configuracion/pantallas/index.vue` | `seguridad` |
| `/configuracion/categorias` | `pages/configuracion/categorias/index.vue` | `administracion` |
| `/configuracion/notificaciones` | `pages/configuracion/notificaciones/index.vue` | `sistema` |
| `/perfil` | `pages/perfil.vue` | Sin permiso (`skipPermissionCheck`) |

**Orden del menú principal** (`MAIN_ORDER` en `useMenu.ts` y `permisos.store.ts`):
`/dashboard`, `/transacciones`, `/presupuestos`, `/reportes`, `/cuentas`, `/ventas`, `/compras`,
`/produccion`, `/productos`, `/insumos`, `/inventario`, `/proveedores`, `/analiticas`,
`/configuracion`.

> Agregar una página **no** basta para que aparezca en el menú: el backend debe exponer una pantalla
> con esa ruta y `canRead`. Si no, el middleware lanza 404.

---

## Arquitectura del proyecto

```
.
├── app/
│   ├── app.vue                  # UApp + indicador de carga + NuxtLayout
│   ├── app.config.ts            # color primario 'brand', neutral 'neutral'
│   ├── assets/css/main.css      # Tailwind, paleta de marca, tokens claro/oscuro, login
│   ├── components/
│   │   ├── app/                 # AppToolbar, AppStatCards, AppCard, AppEmpty, AppSkeleton…
│   │   ├── layout/              # AppHeader, AppSidebar, SubmenuSidebar, Notifications, QuickTransaction
│   │   ├── dashboard/           # Widgets del dashboard
│   │   ├── calendario/          # Calendario de presupuestos
│   │   ├── configuracion/       # bitacora, categorias, notificaciones, pantallas, permisos, roles, usuarios
│   │   ├── reportes/            # dashboard, analiticas, presupuesto, negocio
│   │   └── <módulo>/            # Drawer, Filters, Table, DetailDrawer por módulo
│   ├── composables/             # use<X>.ts: estado, filtros, paginación y toasts
│   ├── layouts/
│   │   ├── default.vue          # shell con sidebar + header + (submenú de configuración)
│   │   ├── auth.vue             # login / registro
│   │   └── login.vue            # sin uso
│   ├── middleware/
│   │   ├── auth.global.ts       # sesión + verificación de permisos en cada ruta
│   │   └── guest.ts             # solo /register
│   ├── pages/                   # 30 páginas (ver mapa)
│   ├── plugins/
│   │   ├── api.ts               # $api: baseURL, Bearer, refresh y reintento 401
│   │   └── auth-init.ts         # rehidrata la sesión al arrancar
│   ├── schemas/                 # 17 esquemas Zod para UForm
│   ├── services/                # 23 módulos de funciones, una por endpoint
│   ├── stores/                  # auth, permisos, catálogos
│   ├── types/
│   │   ├── api.d.ts             # GENERADO — no editar a mano
│   │   └── dashboard.ts         # único módulo de tipos escrito a mano
│   └── utils/                   # api-error, budget-status, date-range, format, jwt, menu-tree, report-csv
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── img/Logo.png, LogoLogin.png
├── nuxt.config.ts
├── tsconfig.json                # "files": [] + referencias a .nuxt/tsconfig.*
└── pnpm-workspace.yaml
```

### Flujo de datos

```
Página (.vue)
   ↓ usa
Composable use<X>.ts  ── refs, filtros, paginación, toasts
   ↓ llama
Servicio app/services/*.service.ts  ── función por endpoint, sin clases
   ↓ usa
useApi().api<T>(ruta, opciones)  ── envuelve $api
   ↓
plugins/api.ts  ── baseURL, Bearer, refresh proactivo, reintento 401
   ↓
Backend NestJS  (prefijo global /api)
```

- Los servicios **lanzan** excepciones. Las páginas y composables las capturan con
  `getApiMessage` (`app/utils/api-error.ts`) y las muestran con `useToast()`.
- `useApi()` debe invocarse **dentro de funciones**, nunca en el nivel superior de un módulo
  (necesita contexto de Nuxt).
- Los tipos salen de `components['schemas'][...]` de `~/types/api`. No escribas DTOs a mano.
- Las respuestas se normalizan de forma defensiva: listados de negocio paginados
  `{ items, total, page, limit, pages }`, catálogos `{ items }` o `{ data }`, y objetos sueltos
  `{ message, ...entidad }` (el `TransformInterceptor` del backend los aplana).

### Dashboard compartido

`useDashboardData()` usa `useState` y claves globales de `useAsyncData`
(`dashboard-overview`, `dashboard-breakdown`, `dashboard-debts`, `dashboard-savings`).
Todos los llamadores comparten el mismo estado: **no vuelvas a pedir esos endpoints** en una página.

---

## Autenticación y permisos

Este es el punto más contraintuitivo del proyecto. Léelo antes de tocar el login.

### Almacenamiento del token

El `access_token` es un JWT que embebe el arreglo `permisos` (~4.8 KB), lo que **supera el límite de
~4 KB por cookie**. Por eso el navegador descarta `auth_token` y la cookie no es confiable.

Orden de resolución del token (`plugins/api.ts` → `resolveAccessToken`):

1. **Pinia** (`authStore.token`, en memoria)
2. **`localStorage.auth_token`**
3. **Cookie `auth_token`** (solo como respaldo de SSR)

Además existe la cookie liviana **`auth_flag`** (`'1'`), que le dice al middleware de SSR que hay
sesión. No la elimines ni "simplifiques" la autenticación a cookie-only: romperías el arranque.

### Refresco

- `plugins/api.ts` refresca **antes** de disparar la petición si el access ya expiró.
- Si aun así llega un `401`, reintenta **una sola vez** por petición.
- `refreshSession()` es *single-flight*: todas las peticiones concurrentes comparten la misma
  promesa. Sin esto, varios refrescos en paralelo + un `logout()` de un perdedor borrarían los
  tokens frescos de los demás.
- `auth.store.refreshSession()` usa `$fetch` crudo a propósito: pasar por `$api` provocaría
  recursión.

### Login y registro

- `authStore.login({ email, password })` aunque la etiqueta del formulario diga "Usuario".
- `login` y `register` **resuelven** `{ data, error }` en lugar de lanzar.
- Respuesta esperada: `{ access_token, refresh_token, usuario }`.

### Middleware global

`app/middleware/auth.global.ts` corre en **cada** ruta:

| Situación | Resultado |
| --- | --- |
| Sin sesión y ruta ≠ `/login` | `navigateTo('/login')` |
| Con sesión y ruta = `/login` | `navigateTo('/')` |
| `pantallas` cargadas y `!can(ruta)` | `createError({ statusCode: 404 })` |

- La verificación de permisos es **solo cliente** y ocurre **después** de que `pantallas` carga.
  Si la lista está vacía, no se verifica nada.
- Es **UX, no seguridad**. La autorización real vive en el backend.
- Para excluir una página: `definePageMeta({ skipPermissionCheck: true })` (solo `pages/perfil.vue`).
- `middleware: 'guest'` lo usa únicamente `pages/register.vue`.

### Gating de acciones

```ts
const permisos = usePermisosStore()
const puedeCrear = computed(() => permisos.can('/ventas', 'canCreate'))
const puedeEditar = computed(() => permisos.can('/ventas', 'canUpdate'))
const puedeEliminar = computed(() => permisos.can('/ventas', 'canDelete'))
```

`can()` acepta alias en español (`ver`, `crear`, `editar`, `eliminar`) además de los ingleses.
También resuelve patrones dinámicos (`/presupuestos/[id]`, `/presupuestos/:id`).

> Si un botón no aparece, casi siempre es porque el backend aún no sembró esa pantalla en el rol.

### Navegación

`useMenu()` + `permisos.store` construyen el sidebar desde el JWT:

- Agrupa por `parentId` o por prefijo de ruta (p. ej. `/presupuestos/calendario` bajo
  `/presupuestos`).
- Excluye rutas dinámicas (`[id]` / `:id`): no son navegables.
- `/configuracion` se separa al pie y sus hijas se muestran en `SubmenuSidebar`.
- El ícono se normaliza: si no empieza por `i-`, se le antepone `i-lucide-`.

---

## Convenciones de desarrollo

- **pnpm únicamente.** Nunca `npm` ni `yarn`.
- **Servicios**: funciones exportadas sueltas, una por endpoint, sin clases.
- **Composables**: `use<X>.ts` dueño de refs, filtros y toasts; las páginas solo consumen.
- **Esquemas**: `app/schemas/*.schema.ts` con Zod, alimentan `UForm`.
- **Páginas**: bajo `app/pages/`, componentes del módulo en `app/components/<módulo>/`.
- **Idioma**: la UI en español; campos y enums de la API en inglés
  (`income` / `expense` / `transfer`, `pending` / `reconciled`, `cash` / `debit_card` /
  `credit_card` / `bank_transfer`). Solo se traducen las etiquetas.
- **Colores**: usa tokens semánticos (`text-highlighted`, `text-toned`, `text-muted`,
  `text-dimmed`, `bg-default`, `bg-elevated`, `border-default`, `text-primary`). Evita
  `text-white`, `bg-neutral-900` y compañía: rompen el modo claro. Ver [DESIGN.md](./DESIGN.md).
- **Permisos**: envuelve siempre las acciones con `permisos.can(ruta, 'canXxx')`.
- **Tipos**: nunca edites `app/types/api.d.ts`; regenera con `pnpm generate:types`.
- **tsconfig raíz**: `"files": []` es intencional; referencia `.nuxt/tsconfig.*`. No agregues
  `paths` ahí. Si faltan tipos en el editor, ejecuta `nuxt prepare`.

---

## Documentación relacionada

| Documento | Contenido |
| --- | --- |
| **[MANUAL.md](./MANUAL.md)** | Instalación paso a paso, configuración, recorrido funcional por módulo, flujos típicos y solución de problemas. |
| **[DESIGN.md](./DESIGN.md)** | Sistema de diseño: paleta, tokens semánticos, tipografía, layout, componentes y reglas de modo claro/oscuro. |
| **[LICENSE.md](./LICENSE.md)** | Términos de licencia. |
| **[AGENTS.md](./AGENTS.md)** | Notas operativas para agentes de código que trabajen en este repositorio. |

---

## Estado y limitaciones conocidas

- **Sin tests, lint ni typecheck** configurados. `vue-tsc` está instalado pero sin cablear.
- `pnpm build` **no** se espera limpio: `.nuxt/tsconfig.app.json` arrastra errores preexistentes
  (`echarts`, `~/composables/useChartTheme`, `AppCard`, `Buffer`, etc.).
- `app/components/app/AppChart.vue` es código muerto (ECharts no está instalado). Los reportes
  dibujan SVG nativo.
- La clase `font-display` se usa en 25 componentes pero `--font-display` no está definida en
  `@theme`, así que hoy cae a Roboto. Ver [DESIGN.md § 7.1](./DESIGN.md#71-familias).
- `useSeed()` (`/seed`) es código muerto.
- `layouts/login.vue` no se usa.
- `NUXT_PUBLIC_SOCKET_URL` y `NUXT_PUBLIC_FILES` están declaradas pero ningún código las lee.
- `devServer.host` es el placeholder literal `[IP_ADDRESS]`; Nuxt avisa
  `Invalid hostname ... Using fallback` y sirve igual en `:5002`. Es inofensivo salvo que estés
  cambiando el *host binding*.
- Nuxt advierte sobre el auto-import duplicado de `MetodoPago`
  (`useDashboardData`, `useTransacciones`, `dashboard.service`). Es inofensivo; evita exportar otro
  símbolo con ese nombre.
- El backend expone endpoints de inventario, ventas y producción que esta UI **sí** implementa,
  pero también otros que no: no asumas que existe un servicio o página solo porque exista el tipo.
- La importación de extractos (CSV / OFX) está marcada como "Próximamente" en `/cuentas`.

---

## Créditos

Desarrollado por **sudoAdmin**. Ver [LICENSE.md](./LICENSE.md).
