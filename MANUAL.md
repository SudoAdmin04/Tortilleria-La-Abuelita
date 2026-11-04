# Manual de instalación y uso · Capital Flow

Guía completa para instalar, configurar, arrancar y operar el frontend de **Capital Flow**.

Si solo quieres el resumen técnico, ve al [README.md](./README.md).
Si buscas reglas visuales, ve a [DESIGN.md](./DESIGN.md).

---

## Tabla de contenido

1. [Antes de empezar](#1-antes-de-empezar)
2. [Instalación paso a paso](#2-instalación-paso-a-paso)
3. [Configuración del entorno](#3-configuración-del-entorno)
4. [Arranque](#4-arranque)
5. [Primer acceso](#5-primer-acceso)
6. [La interfaz de un vistazo](#6-la-interfaz-de-un-vistazo)
7. [Manual de uso por módulo](#7-manual-de-uso-por-módulo)
8. [Flujos típicos (recetas)](#8-flujos-típicos-recetas)
9. [Administración de usuarios y permisos](#9-administración-de-usuarios-y-permisos)
10. [Solución de problemas](#10-solución-de-problemas)
11. [Compilar y desplegar](#11-compilar-y-desplegar)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Antes de empezar

### 1.1 Qué es Capital Flow

Aplicación web para llevar la contabilidad y la operación de un negocio que produce y vende
(tortillería). Se compone de **dos proyectos separados**:

```
TortilleriaApp/
├── Tortilleria-La-Abuelita-Backend/     # NestJS + TypeORM + PostgreSQL  → API en :4002
└── Tortilleria-La-Abuelita-Frontend/    # Nuxt 4 (este repo)             → UI en :5002
```

Este manual cubre el **frontend**. El backend debe estar corriendo para que la app funcione.

### 1.2 Requisitos

| Herramienta | Versión mínima | Verificar con |
| --- | --- | --- |
| **Node.js** | 20 LTS o superior (probado en 22/24) | `node -v` |
| **pnpm** | 9 o superior | `pnpm -v` |
| **Git** | Cualquiera reciente | `git --version` |
| **PostgreSQL** | 14+ (lo usa el backend) | `psql --version` |

Si no tienes pnpm:

```bash
npm install -g pnpm
```

> **Usa siempre pnpm.** El repositorio tiene `pnpm-lock.yaml` (v9) y `pnpm-workspace.yaml`.
> Instalar con `npm` o `yarn` produce un árbol de dependencias distinto y errores difíciles de
> rastrear.

### 1.3 Puertos que se usan

| Servicio | Puerto | De dónde sale |
| --- | --- | --- |
| Frontend (desarrollo) | `5002` | `nuxt.config.ts` → `devServer.port` |
| Frontend (build/preview) | `5003` | `.env` → `NITRO_PORT` |
| Backend (API + Swagger) | `4002` | Proyecto backend |

---

## 2. Instalación paso a paso

### Paso 1 · Clonar el repositorio

```bash
git clone <url-del-repositorio> Tortilleria-La-Abuelita-Frontend
cd Tortilleria-La-Abuelita-Frontend
```

### Paso 2 · Instalar dependencias

```bash
pnpm install
```

Al terminar se ejecuta automáticamente `nuxt prepare` (`postinstall`), que genera los tipos del
editor en `.nuxt/`.

Si aparece:

```
ERR_PNPM_IGNORED_BUILDS  Ignored build scripts: ...
```

Ejecuta:

```bash
pnpm approve-builds
```

y acepta los paquetes que necesites. La lista blanca vive en `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  core-js: false
  esbuild: false
  vue-demi: false
```

### Paso 3 · Preparar el backend

En otra terminal:

```bash
cd ../Tortilleria-La-Abuelita-Backend
pnpm install
# configura su .env (base de datos, JWT, etc.)
pnpm start:dev
```

Verifica que responde:

- API: <http://localhost:4002/api>
- Swagger: <http://localhost:4002/api/docs>
- OpenAPI JSON: <http://localhost:4002/api/docs-json>

### Paso 4 · Crear el archivo `.env` del frontend

En la raíz de **este** repositorio crea un archivo llamado `.env`:

```dotenv
SWAGGER_URL=http://localhost:4002/api/docs-json
NUXT_PUBLIC_API_URL=http://localhost:4002/api
NITRO_PORT=5003
NUXT_PUBLIC_SOCKET_URL=http://localhost:4002
NUXT_PUBLIC_FILES=http://localhost:4002/files
```

Detalle de cada variable en la [sección 3](#3-configuración-del-entorno).

### Paso 5 · Generar los tipos de la API

```bash
pnpm generate:types
```

Esto descarga el OpenAPI del backend y escribe `app/types/api.d.ts`.

- El archivo **está versionado**, así que ya viene con tipos. Solo necesitas regenerarlo cuando el
  backend cambie.
- Los diffs grandes son normales: el backend expone muchos más endpoints de los que la UI usa.

### Paso 6 · Arrancar

```bash
pnpm dev
```

Abre <http://localhost:5002>.

---

## 3. Configuración del entorno

Todas las variables viven en `.env` (ignorado por Git). No hay `.env.example` en el repositorio.

| Variable | Obligatoria | Valor típico | Para qué sirve |
| --- | --- | --- | --- |
| `SWAGGER_URL` | Solo para `generate:types` | `http://localhost:4002/api/docs-json` | Origen del OpenAPI JSON. |
| `NUXT_PUBLIC_API_URL` | **Sí** | `http://localhost:4002/api` | Base de todas las llamadas. **Debe terminar en `/api`.** |
| `NITRO_PORT` | No | `5003` | Puerto del servidor compilado (`pnpm preview`). El dev sigue en 5002. |
| `NUXT_PUBLIC_SOCKET_URL` | No | `http://localhost:4002` | Reservada para tiempo real. Ningún código la lee aún. |
| `NUXT_PUBLIC_FILES` | No | `http://localhost:4002/files` | Reservada para archivos. Ningún código la lee aún. |

### ⚠️ El detalle que rompe todo: el sufijo `/api`

El backend NestJS aplica un **prefijo global `api`**. Los servicios del frontend envían rutas sin
prefijo:

```ts
useApi().api<Account>('/accounts')   // → GET {NUXT_PUBLIC_API_URL}/accounts
```

Por eso:

```dotenv
NUXT_PUBLIC_API_URL=http://localhost:4002/api     # ✅ correcto
NUXT_PUBLIC_API_URL=http://localhost:4002         # ❌ todas las llamadas dan 404
```

Nunca hardcodees la URL en el código: usa `useRuntimeConfig().public.apiUrl`.

### Cambiar de backend

Solo edita `.env` y reinicia:

```dotenv
NUXT_PUBLIC_API_URL=https://api.midominio.com/api
```

---

## 4. Arranque

### 4.1 Desarrollo normal

```bash
pnpm dev
```

Equivale a `pnpm generate:types && nuxt dev`. Necesita el backend arriba porque primero regenera los
tipos.

### 4.2 Desarrollo sin backend / sin codegen

```bash
pnpm exec nuxt dev
```

Usa el `app/types/api.d.ts` ya versionado. Útil si estás trabajando solo en estilos o componentes y
el backend está caído.

### 4.3 Qué esperar en consola

Verás algo así:

```
Nuxt 4.5.2 (with Nitro 2.13.4, Vite 8.3.2 and Vue 3.5.43)
WARN [listhen] Invalid hostname [IP_ADDRESS]. Using `` as fallback.
➜ Local:   http://localhost:5002/
WARN Duplicated imports "MetodoPago" ...
```

- El **WARN del hostname** es inofensivo: `devServer.host` es el placeholder literal
  `[IP_ADDRESS]`. Nuxt cae a `localhost` y sirve igual.
- El **WARN de `MetodoPago`** también es inofensivo: tres módulos exportan el mismo tipo
  auto-importado y Nuxt elige uno. No agregues otro export con ese nombre.

### 4.4 Detener el servidor

`Ctrl + C` en la terminal.

---

## 5. Primer acceso

### 5.1 Iniciar sesión

1. Abre <http://localhost:5002>. Te redirige a `/login`.
2. Escribe tu **correo** y **contraseña**.
   - La etiqueta dice "Usuario", pero el campo envía `email`. Usa el correo completo.
3. Pulsa **Entrar**.

Si las credenciales son correctas verás el aviso *"Acceso Autorizado"* y entrarás a `/dashboard`.

### 5.2 Crear una cuenta nueva

1. En `/login`, usa el enlace de registro (o ve a `/register`).
2. Captura nombre, correo y contraseña.
3. Al registrarte, el backend **siembra tu catálogo base de categorías** y te deja con sesión
   iniciada.

### 5.3 Credenciales de ejemplo

Las define el *seed* del backend. Consulta su documentación o su carpeta
`src/modules/seed/data/`. Típicamente hay un usuario administrador con rol completo.

### 5.4 Si no ves el menú completo

El sidebar se construye desde los permisos que viajan en tu JWT. Un usuario nuevo puede tener pocas
pantallas. Pide a un administrador que ajuste tu rol en
**Configuración → Permisos**, o entra con una cuenta administradora.

### 5.5 Cerrar sesión

Menú del avatar (arriba a la derecha o al pie del sidebar) → **Cerrar Sesión**.

---

## 6. La interfaz de un vistazo

```
┌──────────────────────────────────────────────────────────────────────┐
│  SIDEBAR          │  HEADER                                          │
│                   │  [icono] Título de pantalla   [filtros] [CSV]    │
│  ▸ Dashboard      │                               [Nueva] [🔔] [🌗]  │
│  ▸ Transacciones  ├──────────────────────────────────────────────────┤
│  ▸ Presupuestos   │                                                  │
│  ▸ Reportes       │   CONTENIDO DE LA PÁGINA                         │
│  ▸ Cuentas        │                                                  │
│  ▸ Ventas         │   Toolbar (título, descripción, buscador, botón)  │
│  ▸ Compras        │   Tarjetas de estadísticas                        │
│  ▸ Producción     │   Filtros                                         │
│  ▸ Productos      │   Tabla / tarjetas                                │
│  ▸ Insumos        │   Gráficas y paneles                              │
│  ▸ Inventario     │                                                  │
│  ▸ Proveedores    │                                                  │
│                   │                                                  │
│  ─────────────    │                                                  │
│  ⚙ Configuración  │                                                  │
│  [avatar] Usuario │                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.1 Sidebar

- **Colapsable**: botón de panel en la cabecera del sidebar. Colapsado muestra solo iconos con
  tooltip.
- **Grupos**: si una pantalla tiene hijas (p. ej. Presupuestos → Calendario), el padre navega a su
  página y el chevron despliega las hijas.
- **Configuración** va al pie y abre un **submenú lateral** con las secciones agrupadas por módulo
  (Administración, Seguridad, Sistema).
- Al pie: avatar, nombre, correo y rol.

### 6.2 Header

| Elemento | Función |
| --- | --- |
| Icono + título | Se resuelve desde la pantalla del JWT. |
| Selector de mes | Solo en `/dashboard`. Elige año y mes. |
| Selector de cuenta | Solo en `/dashboard`. Filtra por cuenta. |
| **Descargar Reporte** | Exporta a CSV los movimientos del mes y filtros activos. |
| **Nueva Transacción** | Abre el drawer rápido. Solo si tienes `canCreate` en `/transacciones`. |
| 🔔 Notificaciones | Panel lateral con avisos. |
| 🌗 Color mode | Alterna claro / oscuro. |
| Avatar | Perfil de Usuario / Cerrar Sesión. |

### 6.3 Patrón de página

Casi todas las pantallas siguen el mismo orden:

1. **`AppToolbar`** — título, descripción, buscador y botón de creación (si tienes permiso).
2. **`AppStatCards`** — 3 o 4 tarjetas de KPIs.
3. **`<Módulo>Filters`** — filtros colapsables con contador de filtros activos.
4. **`<Módulo>Table`** o tarjetas — listado con paginación.
5. **`<Módulo>Drawer`** — formulario lateral de alta/edición.
6. **`<Módulo>DetailDrawer`** — detalle de solo lectura (ventas, compras, producción).

### 6.4 Estados de cada pantalla

| Estado | Cómo se ve |
| --- | --- |
| **Cargando** | Esqueletos (`USkeleton`) con la forma del contenido. |
| **Vacío** | `UEmpty` con icono, título y una acción sugerida. |
| **Error** | `UAlert` rojo con el mensaje del backend y botón **Reintentar**. |
| **Sin permiso** | La ruta lanza 404 (no hay pantalla "prohibido"). |

### 6.5 Notificaciones (toasts)

Aparecen abajo a la derecha:

- ✅ verde — operación exitosa.
- ⚠️ ámbar — advertencia (p. ej. "Sin movimientos para exportar").
- ❌ rojo — error, con el mensaje del backend.

---

## 7. Manual de uso por módulo

### 7.1 Dashboard (`/dashboard`)

Vista ejecutiva del mes. No se edita desde aquí.

**Qué muestra**

- **KPIs**: saldo neto del mes, ingresos vs presupuesto, egresos vs presupuesto, liquidez.
- **Dona de distribución de gasto** por categoría.
- **Barras ingreso vs presupuesto** por rubro.
- **Cascada de flujo**: cómo se pasa del ingreso al saldo neto.
- **Resumen Ingresos / Resumen Egresos**: tablas por rubro con real, presupuesto y desviación.
- **Desglose por categoría**, **snapshot de deudas** y **snapshot de metas de ahorro**.

**Cómo usarlo**

1. Usa el selector de mes del header para moverte entre periodos.
2. Usa el selector de cuenta para aislar una sola cuenta.
3. Usa el buscador del bloque de filtros para filtrar rubros por nombre.
4. **Limpiar filtros** restablece todo.
5. Los botones `‹` / `›` navegan mes a mes; **Mes actual** vuelve a hoy.

**Nota**: si no hay movimientos en el periodo verás un estado vacío con la sugerencia de registrar
el primero.

### 7.2 Transacciones (`/transacciones`)

El corazón del sistema: ingresos, egresos y traspasos.

**Registrar un movimiento**

1. Pulsa **Registrar Movimiento** (requiere `canCreate`).
2. Elige el **tipo**: Ingreso, Egreso o Traspaso.
3. Completa:
   - **Concepto** (obligatorio).
   - **Monto**.
   - **Fecha**.
   - **Cuenta** de origen. En un traspaso, también la **cuenta destino**.
   - **Categoría** (para ingresos y egresos).
   - **Método de pago**: `cash`, `debit_card`, `credit_card`, `bank_transfer`.
   - **Estado**: `pending` (pendiente) o `reconciled` (conciliado).
4. Guarda. La lista y las tarjetas se refrescan solas.

**Editar**: menú de la fila → **Editar**. **Eliminar**: menú → **Eliminar** (pide confirmación).

**Conciliar**: menú de la fila → **Conciliar**. Pasa el movimiento de `pending` a `reconciled`.

**Filtrar**

- Buscador por concepto (con retardo de 350 ms).
- Tipo, estado, cuenta, categoría, método de pago y rango de fechas.
- Los contadores de las pestañas muestran cuántos hay de cada tipo.
- **Limpiar filtros** restablece todo y vuelve a la página 1.

**Exportar**

El botón **Descargar Reporte** del header genera un CSV con los movimientos del mes y los filtros
activos. Incluye BOM para que Excel abra bien los acentos. Columnas:
`Fecha, Concepto, Tipo, Monto, Cuenta origen, Cuenta destino, Categoría, Estado`.

### 7.3 Presupuestos (`/presupuestos`)

Planeado vs ejecutado por rubro.

**Qué muestra**

- **Planeado**: total presupuestado del periodo.
- **Ejecutado**: lo realmente gastado/ingresado, con % de ejecución.
- **Restante** y aviso de sobregiro.
- **Excedidos / en orden / cerca del límite**.
- Tabla por rubro con estado: `En orden`, `Cerca del límite`, `Excedido`, `Sin presupuesto`.

**Acciones**

1. **Nuevo presupuesto** — elige categoría, periodo y monto.
2. **Editar** — ajusta el monto planificado.
3. **Copiar presupuestos** — replica el plan de un periodo a otro.
4. **Historial** — abre la línea de tiempo de ajustes de un rubro.

### 7.4 Calendario de presupuestos (`/presupuestos/calendario`)

Vista mensual de eventos presupuestales.

1. Navega entre meses con las flechas.
2. Pulsa un día para seleccionarlo.
3. **Nuevo evento**: título, monto, color y día.
4. Pulsa un evento para editarlo o eliminarlo.

La cabecera muestra el mes, el número de eventos y el monto total.

### 7.5 Cuentas (`/cuentas`)

Bancos, efectivo y tarjetas.

**Qué muestra**

- **Saldo total (activas)** y número de cuentas.
- **Cuenta principal** con su saldo.
- Tarjetas por cuenta con tipo, institución, moneda y saldo calculado.
- **Distribución de activos** (efectivo, débito, crédito, transferencia, cheques).
- **Panel de conciliación** con pendientes.

**Acciones**

| Acción | Dónde |
| --- | --- |
| **Nueva Cuenta** | Botón superior (requiere `canCreate`). |
| **Editar** | Menú de la tarjeta. |
| **Eliminar** | Menú de la tarjeta. |
| **Activar / Desactivar** | Menú de la tarjeta. |
| **Marcar como principal** | Menú de la tarjeta (icono estrella). |
| **Importar extracto** | Botón del panel de conciliación — *Próximamente*. |

**Filtros**: tipo de cuenta (Cheques, Ahorro, Efectivo, Tarjeta), *Solo activas* y buscador por
nombre o institución.

> El saldo es **calculado**: se deriva de los movimientos. No se edita a mano.

### 7.6 Deudas (`/deudas`)

Pasivos por pagar y por cobrar.

1. **Nueva deuda**: contraparte, tipo (por pagar / por cobrar), monto, fecha y método.
2. Filtra por estado.
3. **Liquidar** marca la deuda como saldada.
4. Las tarjetas superiores resumen el total por pagar, por cobrar y lo amortizado.

### 7.7 Metas de ahorro (`/metas-ahorro`)

Objetivos de ahorro con aportaciones y retiros.

1. **Nueva meta**: nombre, objetivo total, objetivo mensual y cuenta asociada.
2. **Aportar** (icono verde): registra un depósito.
3. **Retirar** (icono ámbar): registra un retiro.
4. **Historial**: consulta todos los movimientos de la meta.
5. La tabla muestra aportado vs objetivo, faltante y % de ejecución.

El encabezado indica el avance del mes en curso.

### 7.8 Ventas (`/ventas`)

Ventas de producto al mostrador.

**Registrar una venta**

1. **Nueva Venta**.
2. Elige fecha, método de pago y cliente (opcional).
3. Agrega **líneas**: producto + cantidad. El precio se toma del catálogo.
4. Revisa el total y guarda.

**Detalle**: pulsa una fila para abrir el `DetailDrawer` con las líneas, totales y estado.

**Cancelar**: desde el detalle o el menú de la fila. Una venta cancelada no cuenta en reportes.

### 7.9 Compras (`/compras`)

Compras de insumos a proveedores.

1. **Registrar Compra**.
2. Elige **proveedor**, fecha y método de pago.
3. Agrega **insumos**: insumo + cantidad + costo unitario.
4. El panel derecho calcula **subtotal**, **impuestos** y **total** en vivo.
5. Guarda.

Al confirmar, el inventario de los insumos se incrementa según el backend.

**Cancelar** una compra revierte el efecto en inventario.

### 7.10 Producción (`/produccion`)

Lotes producidos y consumo de insumos.

1. **Nuevo Lote**.
2. Elige **producto** y **cantidad a producir**.
3. El sistema propone el **consumo de insumos** según la receta del producto. Puedes ajustarlo.
4. Guarda. Se descuentan insumos y se incrementa el stock del producto.

**Detalle**: muestra insumos consumidos, costo y rendimiento.
**Cancelar**: revierte el lote.

> Si un producto no tiene receta, no podrás producir. Configúrala primero en **Productos →
> Receta**.

### 7.11 Productos (`/productos`)

Catálogo con costo, precio y margen.

| Campo | Nota |
| --- | --- |
| Nombre, SKU, unidad | Identificación. |
| Precio de venta | Lo que cobras. |
| Costo | Se calcula desde la receta o se captura. |
| Margen | Derivado de precio y costo. |
| Stock mínimo | Umbral para alertas de inventario. |
| Activo | Los inactivos no aparecen al vender. |

**Editor de receta** (botón de receta en la fila)

1. Agrega insumos con su cantidad.
2. El costo total de la receta se calcula automáticamente.
3. Guarda. La receta alimenta el módulo de Producción.

> Al editar un producto, el formulario **siempre** envía `minStock` porque el DTO del backend lo
> exige. No lo dejes vacío.

### 7.12 Insumos (`/insumos`)

Materias primas.

| Campo | Nota |
| --- | --- |
| Nombre, SKU, unidad | Unidad: kg, g, l, ml, pieza, etc. |
| Stock mínimo | Umbral de alerta. |
| Costo promedio | Se actualiza con las compras. |
| Activo | Los inactivos no se pueden comprar ni consumir. |

**Filtros**: búsqueda, estado, unidad y *solo stock bajo*.

### 7.13 Inventario (`/inventario`)

Kardex y control de existencias.

- **Resumen**: total de insumos, valor del inventario, alertas.
- **Stock bajo**: insumos por debajo del mínimo.
- **Movimientos (Kardex)**: entradas, salidas y ajustes con fecha, motivo y usuario.
- **Ajuste manual**: selecciona insumo, tipo (entrada / salida), cantidad y motivo. Requiere
  `canCreate`.

**Filtros**: insumo, tipo de movimiento y rango de fechas.

> Usa los ajustes solo para corregir diferencias físicas. Las entradas normales llegan por
> **Compras** y las salidas por **Producción**.

### 7.14 Proveedores (`/proveedores`)

Directorio de proveedores.

1. **Nuevo Proveedor**: nombre, contacto, teléfono, correo, dirección y RFC.
2. Activa o desactiva desde el menú de la fila.
3. Los proveedores activos aparecen en el formulario de **Compras**.

### 7.15 Reportes

Cuatro vistas independientes, accesibles desde el sidebar o desde los botones del toolbar.

#### Reportes · Resumen (`/reportes`)

- Ingresos, egresos, saldo neto y patrimonio del mes.
- Dona de distribución y cascada de flujo.
- Tablas de ingresos y egresos por rubro (real vs presupuesto).

Filtros: año y mes.

#### Reportes · Analíticas (`/reportes/analiticas`)

- **Tasa de ahorro** vs meta y brecha.
- **Liquidez** y egreso promedio mensual.
- **Meses de reserva** (runway).
- **Desviación de gasto** y variación mes a mes.
- **Cashflow** multi-mes.
- **Tabla de fugas** (gastos que se escapan).
- **Alertas** automáticas.

Filtros: año, mes, número de meses y meta de ahorro (%).

#### Reportes · Presupuesto (`/reportes/presupuestos`)

- Planeado, ejecutado, restante y % de ejecución.
- Rubros excedidos / en orden / cerca del límite.
- Tabla detallada por rubro y partida.

#### Reportes · Negocio (`/reportes/negocio`)

Ventas, compras, producción e inventario del periodo:

- Ventas: total, número, ticket promedio.
- Compras: total, número, proveedores.
- Producción: lotes, unidades, costo.
- Inventario: valor, alertas.

#### Reportes · Estado de resultados (`/reportes/resultados`)

Ingresos − costo de ventas = utilidad del periodo, con desglose por concepto.

### 7.16 Configuración (`/configuracion`)

Al entrar se abre un **submenú lateral** con las secciones agrupadas por módulo.

#### Usuarios (`/configuracion/usuarios`)

- Lista con nombre, correo, rol y estado.
- **Nuevo usuario**: nombre, correo, contraseña y rol.
- **Editar**: datos y rol.
- **Activar / Desactivar**.

#### Roles (`/configuracion/roles`)

- Lista de roles con estado.
- **Nuevo rol**: nombre y descripción.
- **Activar / Desactivar**.
- Eliminar un rol solo si no tiene usuarios asignados.

#### Permisos (`/configuracion/permisos`)

La matriz rol × pantalla.

1. Selecciona un **rol** en el filtro superior.
2. Verás todas las pantallas con cuatro interruptores: **Leer**, **Crear**, **Editar**, **Eliminar**.
3. Usa el buscador para encontrar una pantalla.
4. **Activar todos** / **Desactivar todos** aplican sobre las pantallas filtradas.
5. **Guardar** persiste. **Descartar** revierte.
6. El contador muestra `asignadas / total` y un indicador de cambios sin guardar.

> Marcar **Crear** activa automáticamente **Leer** (no tiene sentido crear lo que no puedes ver).
>
> Los cambios afectan al usuario en su **siguiente inicio de sesión**, porque los permisos viajan
> dentro del JWT.

#### Pantallas (`/configuracion/pantallas`)

Catálogo de pantallas del sistema. Cada registro define:

- Nombre, ruta (`path`), icono (`i-lucide-*`), módulo y `parentId`.
- Orden y estado activo.

Estas pantallas son las que se embeben en el JWT y alimentan el sidebar.

#### Categorías (`/configuracion/categorias`)

Rubros y partidas, máximo **2 niveles**.

1. **Nueva categoría**: nombre, tipo (ingreso / egreso), color y padre (opcional).
2. Las hijas se muestran indentadas bajo el padre.
3. **Activar / Desactivar**: las inactivas no aparecen en transacciones ni presupuestos.

#### Notificaciones (`/configuracion/notificaciones`)

- Lista con estado leído / no leído.
- **Nueva notificación**: título, mensaje y usuario destino.
- **Editar** y **Eliminar**.

#### Bitácora (`/configuracion/bitacora`)

Registro de auditoría: quién hizo qué y cuándo. Solo lectura. Se puede alternar entre vista de
tarjetas y de tabla.

### 7.17 Perfil (`/perfil`)

- Avatar con iniciales y estado (Activo / Inactivo).
- Nombre, correo, rol y `roleId`.
- Datos de la cuenta y fecha de alta.

Es la **única** página con `skipPermissionCheck: true`: siempre es accesible con sesión.

---

## 8. Flujos típicos (recetas)

### 8.1 Configurar el sistema desde cero

```
1. Entra como administrador.
2. Configuración → Categorías      → crea tus rubros de ingreso y egreso.
3. Configuración → Pantallas       → verifica que existan todas las rutas.
4. Configuración → Roles           → crea los roles (Admin, Operador, Consulta…).
5. Configuración → Permisos        → asigna pantallas y acciones a cada rol.
6. Configuración → Usuarios        → da de alta al equipo con su rol.
7. Cuentas                         → registra bancos, efectivo y tarjetas.
8. Proveedores                     → carga el directorio.
9. Insumos                         → carga materias primas con stock mínimo.
10. Productos                      → carga el catálogo y define recetas.
```

### 8.2 Registrar el día de operación

```
1. Compras      → registra lo que llegó de proveedores.
2. Producción   → registra los lotes del día.
3. Ventas       → registra las ventas del mostrador.
4. Inventario   → revisa el kardex y ajusta diferencias físicas.
5. Transacciones→ registra gastos operativos (renta, luz, nómina…).
```

### 8.3 Cerrar el mes

```
1. Transacciones → concilia todos los movimientos pendientes.
2. Cuentas       → revisa el panel de conciliación y el saldo calculado.
3. Reportes      → revisa el resumen del mes.
4. Reportes/Analíticas → revisa fugas y alertas.
5. Presupuestos  → copia el plan al mes siguiente.
6. Reportes/Negocio    → revisa el desempeño operativo.
```

### 8.4 Empezar un mes nuevo

```
1. Presupuestos → "Copiar presupuestos" desde el mes anterior.
2. Ajusta los montos que cambien.
3. Metas de ahorro → revisa el objetivo mensual.
```

### 8.5 Corregir un error de captura

- **Movimiento**: Transacciones → menú de la fila → **Editar** (o **Eliminar** si fue duplicado).
- **Venta / Compra / Lote**: abre el detalle → **Cancelar**. Luego registra el correcto.
- **Stock**: Inventario → **Ajuste manual** con el motivo.

> Prefiere **cancelar** antes que eliminar cuando el documento ya afectó inventario o reportes.

---

## 9. Administración de usuarios y permisos

### 9.1 Modelo

```
Usuario ──(1)──> Rol ──(N)──> Pantalla
                              ├── canRead
                              ├── canCreate
                              ├── canUpdate
                              └── canDelete
```

- Un usuario tiene **un** rol.
- Un rol tiene **N** pantallas con cuatro permisos cada una.
- Al iniciar sesión, el backend embebe esos permisos en el JWT.
- El frontend los lee del token y construye el menú y los botones.

### 9.2 Alta de un usuario

1. **Configuración → Usuarios → Nuevo usuario**.
2. Nombre, correo, contraseña y **rol**.
3. Guarda.
4. El usuario ya puede iniciar sesión con esas credenciales.

### 9.3 Cambiar los permisos de un rol

1. **Configuración → Permisos**.
2. Selecciona el rol.
3. Activa/desactiva los interruptores.
4. **Guardar**.
5. Pide a los usuarios afectados que **cierren sesión y vuelvan a entrar** para que el nuevo JWT
   traiga los permisos actualizados.

### 9.4 Por qué un botón no aparece

Ordena las causas así:

1. El rol no tiene ese permiso (`canCreate` / `canUpdate` / `canDelete`) en esa pantalla.
2. La pantalla no existe en el catálogo o no está activa.
3. El usuario no ha vuelto a iniciar sesión desde el cambio.
4. La ruta no está en `permisos.pantallas` y el middleware lanzó 404.

### 9.5 Nota de seguridad

La verificación de permisos en el frontend es **de experiencia de usuario**, no de seguridad.
Cualquiera puede manipular el navegador. La autorización real la aplica el backend en cada
endpoint. No confíes en el gating del cliente para proteger datos.

---

## 10. Solución de problemas

### La app no arranca y `pnpm dev` falla en `generate:types`

**Causa**: el backend está caído, `SWAGGER_URL` es incorrecto o falta `.env`.

**Solución**:

```bash
# comprueba que responde
curl http://localhost:4002/api/docs-json

# o arranca sin codegen
pnpm exec nuxt dev
```

### Todas las llamadas dan 404

**Causa**: `NUXT_PUBLIC_API_URL` no termina en `/api`.

**Solución**: corrígelo en `.env` y reinicia.

```dotenv
NUXT_PUBLIC_API_URL=http://localhost:4002/api
```

### Entro y me regresa a `/login` en bucle

**Causas posibles**:

1. El token expiró y el refresh falló → revisa la pestaña Network buscando `/auth/refresh`.
2. `localStorage` bloqueado (modo incógnito estricto, políticas del navegador).
3. Reloj del sistema desfasado: el JWT se considera expirado.

**Solución**: borra los datos del sitio (Application → Local Storage y Cookies) y vuelve a entrar.

### El menú está vacío o incompleto

**Causa**: el JWT no trae `permisos`, o el rol no tiene pantallas con `canRead`.

**Solución**:

1. Revisa en DevTools → Application → Local Storage el valor de `auth_screens`.
2. Verifica en **Configuración → Permisos** que el rol tenga pantallas.
3. Cierra sesión y vuelve a entrar.

### Un botón de crear/editar no aparece

Es el *gating* por permisos. Revisa `canCreate` / `canUpdate` / `canDelete` del rol en esa pantalla.
No es un bug.

### Veo 404 en una ruta que existe

El middleware solo permite rutas presentes en `permisos.pantallas`. Agrega la pantalla en el
catálogo (backend o **Configuración → Pantallas**) y asígnala al rol.

### La tabla está vacía pero hay datos

1. Revisa los filtros activos (el contador junto a "Filtros").
2. Pulsa **Limpiar filtros**.
3. Verifica que el periodo seleccionado contenga datos.

### Los acentos del CSV salen mal en Excel

No debería: el archivo se genera con BOM UTF-8. Si persiste, abre con
*Datos → Desde texto/CSV* y elige UTF-8.

### `ERR_PNPM_IGNORED_BUILDS`

```bash
pnpm approve-builds
```

### `Invalid hostname [IP_ADDRESS]` en consola

Es un warning esperado. `devServer.host` es un placeholder. Nuxt cae a `localhost` y sirve en
`:5002`. Solo importa si estás cambiando el *host binding*.

### `Duplicated imports "MetodoPago"`

Warning inofensivo: tres módulos exportan el mismo tipo auto-importado. No agregues otro.

### Errores de tipos en el editor

```bash
pnpm exec nuxt prepare
```

Esto regenera `.nuxt/tsconfig.*`. El `tsconfig.json` raíz tiene `"files": []` a propósito.

### El puerto 5002 está ocupado

```bash
pnpm exec nuxt dev --port 5071
```

### Quiero trabajar sin backend

```bash
pnpm exec nuxt dev
```

La UI carga, pero las pantallas con datos mostrarán el estado de error hasta que la API responda.

---

## 11. Compilar y desplegar

### 11.1 Build de producción

```bash
pnpm build
```

Genera `.output/`. **No se espera que termine limpio**: `.nuxt/tsconfig.app.json` arrastra errores
preexistentes (`echarts`, `~/composables/useChartTheme`, `AppCard`, `Buffer`, etc.). El build de
Vite/Nitro sí completa.

### 11.2 Previsualizar

```bash
pnpm preview
```

Sirve el build en `NITRO_PORT` (5003 por defecto).

### 11.3 Generación estática

```bash
pnpm generate
```

Salida en `.output/public/`. Útil para hosting estático, pero recuerda que la app depende de una API
externa en tiempo de ejecución.

### 11.4 Checklist antes de publicar

- [ ] `NUXT_PUBLIC_API_URL` apunta al backend de producción y **termina en `/api`**.
- [ ] El backend tiene CORS configurado para el dominio del frontend.
- [ ] `NUXT_PUBLIC_API_URL` usa **HTTPS** (el token viaja en el header `Authorization`).
- [ ] `pnpm generate:types` se ejecutó contra el Swagger de producción (o el contrato es idéntico).
- [ ] Las pantallas y permisos están sembrados en la base de datos de producción.
- [ ] Existe al menos un usuario administrador.
- [ ] `NITRO_PORT` coincide con el que expone tu proxy inverso.

### 11.5 Variables en el servidor

Nuxt lee `NUXT_PUBLIC_*` en tiempo de ejecución. Puedes definirlas como variables de entorno del
proceso en lugar de un `.env`, lo cual es lo recomendado en producción.

---

## 12. Preguntas frecuentes

**¿Puedo usar npm o yarn?**
No. Usa pnpm. El lockfile es de pnpm v9.

**¿Dónde cambio el color principal?**
En `app/assets/css/main.css` (paleta `--color-brand-*`) y `app/app.config.ts` (`primary: 'brand'`).
Ver [DESIGN.md](./DESIGN.md).

**¿Cómo agrego una pantalla nueva?**
1. Crea el `.vue` en `app/pages/`.
2. Agrega el servicio y el composable si aplica.
3. Registra la pantalla en el catálogo del backend con su `path`, icono y módulo.
4. Asígnala al rol en **Configuración → Permisos**.
5. Si quieres ordenarla en el menú, ajusta `MAIN_ORDER` en `useMenu.ts` y `permisos.store.ts`.

**¿Por qué el sidebar no muestra mi página nueva?**
Porque el menú se construye desde el JWT, no desde los archivos de `pages/`.

**¿Dónde están los tipos de la API?**
`app/types/api.d.ts`, generado por `pnpm generate:types`. No lo edites a mano.

**¿Cómo funciona el modo claro/oscuro?**
`UColorModeButton` en el header y en el login. Preferencia inicial: oscuro
(`nuxt.config.ts` → `colorMode`). Se guarda en `localStorage`.

**¿Se pueden exportar reportes?**
Sí, a CSV desde el header (**Descargar Reporte**). No hay exportación a PDF ni a Excel nativo.

**¿Hay app móvil?**
No. La UI es responsiva: el sidebar se colapsa y el header muestra solo iconos en pantallas
pequeñas.

**¿Dónde reporto un bug?**
Al mantenedor del repositorio. Incluye ruta, pasos para reproducir, mensaje de consola y la
respuesta de la petición fallida.

**¿Cómo restablezco todo?**
Borra el almacenamiento del sitio y vuelve a iniciar sesión. Si el problema es de datos, es del
backend.

---

## Anexo · Referencia rápida

| Necesito… | Voy a… |
| --- | --- |
| Registrar un gasto | Transacciones → Registrar Movimiento → Egreso |
| Registrar una venta | Ventas → Nueva Venta |
| Registrar una compra | Compras → Registrar Compra |
| Producir un lote | Producción → Nuevo Lote |
| Ajustar stock | Inventario → Ajuste manual |
| Ver el kardex | Inventario → Movimientos |
| Cambiar mi contraseña | *(no implementado en la UI)* |
| Dar acceso a alguien | Configuración → Usuarios |
| Cambiar permisos | Configuración → Permisos |
| Crear una categoría | Configuración → Categorías |
| Ver auditoría | Configuración → Bitácora |
| Exportar movimientos | Header → Descargar Reporte |
| Cambiar de mes en el dashboard | Header → selector de mes |
| Cambiar a modo claro | Header → icono 🌗 |

---

**Siguiente lectura**: [README.md](./README.md) para la arquitectura técnica,
[DESIGN.md](./DESIGN.md) para el sistema visual y [LICENSE.md](./LICENSE.md) para los términos de uso.
