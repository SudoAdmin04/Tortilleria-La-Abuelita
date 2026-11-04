# DESIGN.md · Sistema de diseño de Capital Flow

Documento de referencia del lenguaje visual de la aplicación. Describe la paleta, los tokens
semánticos, la tipografía, el layout, los patrones de componentes y las reglas para que la interfaz
funcione correctamente en **modo claro y oscuro**.

> Este documento describe lo que **ya está implementado**. Si algo aquí no coincide con el código,
> el código tiene la razón: actualiza el documento.

---

## Tabla de contenido

1. [Principios](#1-principios)
2. [Paleta de marca](#2-paleta-de-marca)
3. [Cómo se conecta la marca a Nuxt UI](#3-cómo-se-conecta-la-marca-a-nuxt-ui)
4. [Tokens semánticos](#4-tokens-semánticos)
5. [Reglas de uso del color](#5-reglas-de-uso-del-color)
6. [Colores de estado](#6-colores-de-estado)
7. [Tipografía](#7-tipografía)
8. [Radios, bordes y sombras](#8-radios-bordes-y-sombras)
9. [Espaciado y layout](#9-espaciado-y-layout)
10. [Shell de la aplicación](#10-shell-de-la-aplicación)
11. [Patrones de componentes](#11-patrones-de-componentes)
12. [Estados de pantalla](#12-estados-de-pantalla)
13. [Iconografía](#13-iconografía)
14. [Gráficas](#14-gráficas)
15. [Modo claro y oscuro](#15-modo-claro-y-oscuro)
16. [Accesibilidad](#16-accesibilidad)
17. [Checklist para componentes nuevos](#17-checklist-para-componentes-nuevos)

---

## 1. Principios

1. **Un solo sistema de color.** La UI no tiene colores "de modo oscuro" y "de modo claro"
   separados: tiene **tokens semánticos** que Nuxt UI resuelve según el tema activo. Escribir
   `text-white` es un bug latente.
2. **Densidad informativa.** Es un panel financiero: tablas, cifras tabulares y KPIs manda. Se
   prefiere más información visible y menos decoración.
3. **Jerarquía por peso y tono, no por color.** El color se reserva para *significado* (marca,
   estado, alerta). La jerarquía se construye con `font-weight`, `text-highlighted` vs `text-toned`
   vs `text-muted`.
4. **Superficies en capas.** `bg-muted` (fondo de la app) → `bg-default` (tarjetas y shell) →
   `bg-elevated` (cabeceras, pies, bloques internos) → `bg-accented` (pistas de gráficas, chips).
5. **Cero radios grandes.** El sistema usa esquinas casi rectas (`--ui-radius: 0.180rem`). Es
   intencional: transmite precisión y sobriedad financiera.
6. **Marca con moderación.** El rojo de marca (`#97332d`) aparece en acentos, estados activos y
   acciones primarias, nunca como fondo de áreas extensas (excepto el login).

---

## 2. Paleta de marca

El color principal es **`#97332d`** (tono `500` de la escala `brand`), un rojo teja profundo.

| Token | Hex | Uso típico |
| --- | --- | --- |
| `--color-brand-50` | `#fcf6f5` | Fondos muy suaves, hover de filas de marca |
| `--color-brand-100` | `#f7e5e4` | Fondos de badge *soft* |
| `--color-brand-200` | `#efcbc8` | Bordes suaves |
| `--color-brand-300` | `#df9a95` | Texto sobre fondos oscuros de marca |
| `--color-brand-400` | `#ca574e` | **Color primario en modo oscuro** (`--ui-primary`) |
| `--color-brand-500` | `#97332d` | **Color primario en modo claro** (`--ui-primary`) |
| `--color-brand-600` | `#7a2a24` | Hover / pressed |
| `--color-brand-700` | `#62221d` | Texto de marca sobre fondo claro |
| `--color-brand-800` | `#511c18` | Fondo del login (degradado) |
| `--color-brand-900` | `#431714` | Fondo del login en oscuro |
| `--color-brand-950` | `#2b0f0d` | Extremo oscuro del degradado del login |

La escala vive en `app/assets/css/main.css` dentro de `@theme static`:

```css
@theme static {
  --color-brand-50:  #fcf6f5;
  --color-brand-100: #f7e5e4;
  --color-brand-200: #efcbc8;
  --color-brand-300: #df9a95;
  --color-brand-400: #ca574e;
  --color-brand-500: #97332d;
  --color-brand-600: #7a2a24;
  --color-brand-700: #62221d;
  --color-brand-800: #511c18;
  --color-brand-900: #431714;
  --color-brand-950: #2b0f0d;
}
```

> **`static` es obligatorio.** Nuxt UI resuelve los tonos en *runtime* mediante
> `var(--color-brand-*)`. Con un `@theme` normal, Tailwind solo emitiría las variables que ve usadas
> en el código y los tonos que Nuxt UI pide dinámicamente no existirían.

---

## 3. Cómo se conecta la marca a Nuxt UI

`app/app.config.ts`:

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      neutral: 'neutral',
    },
  },
})
```

Nuxt UI genera entonces:

```css
--ui-color-primary-50:  var(--color-brand-50, …);
/* … */
--ui-color-primary-500: var(--color-brand-500, …);
```

y define `--ui-primary` como el tono **500 en claro** y **400 en oscuro**. Por eso las utilidades
`text-primary`, `bg-primary`, `border-primary` y `ring-primary` **cambian solas** entre modos.

### Cambiar el color de la app

1. Edita los once valores de `--color-brand-*` en `main.css`.
2. Ajusta `--login-bg-from`, `--login-bg-to` y `--login-grid-line` (también en `main.css`) para que
   el login acompañe.
3. No toques `app.config.ts`: sigue apuntando a `brand`.

---

## 4. Tokens semánticos

Nuxt UI expone *namespaces* de color que se traducen a utilidades de Tailwind. **Estas son las
únicas clases de color que debes usar.**

### 4.1 Texto

| Utilidad | Variable | Claro | Oscuro | Cuándo |
| --- | --- | --- | --- | --- |
| `text-highlighted` | `--ui-text-highlighted` | `neutral-900` | `#fff` | Títulos, cifras principales, nombres |
| `text-default` | `--ui-text` | `neutral-700` | `neutral-200` | Texto de cuerpo por defecto |
| `text-toned` | `--ui-text-toned` | `neutral-600` | `neutral-300` | Texto secundario con peso |
| `text-muted` | `--ui-text-muted` | `neutral-500` | `neutral-400` | Etiquetas, metadatos, ayudas |
| `text-dimmed` | `--ui-text-dimmed` | `neutral-400` | `neutral-500` | Texto de muy bajo énfasis, placeholders |
| `text-inverted` | `--ui-text-inverted` | `#fff` | `neutral-900` | Texto sobre `bg-inverted` |
| `text-primary` | `--ui-primary` | `brand-500` | `brand-400` | Marca, enlaces, estado activo |

### 4.2 Superficies

| Utilidad | Variable | Claro | Oscuro | Cuándo |
| --- | --- | --- | --- | --- |
| `bg-default` | `--ui-bg` | `#fff` | `neutral-900` | Tarjetas, sidebar, navbar, drawers |
| `bg-muted` | `--ui-bg-muted` | `neutral-50` | `neutral-800` | Fondo de la aplicación, bloques hundidos |
| `bg-elevated` | `--ui-bg-elevated` | `neutral-100` | `neutral-800` | Cabeceras de tabla, pies, bloques internos |
| `bg-accented` | `--ui-bg-accented` | `neutral-200` | `neutral-700` | Pistas de gráficas, chips, separadores gruesos |
| `bg-inverted` | `--ui-bg-inverted` | `neutral-900` | `#fff` | Tooltips, badges invertidos |

### 4.3 Bordes

| Utilidad | Variable | Claro | Oscuro | Cuándo |
| --- | --- | --- | --- | --- |
| `border-default` | `--ui-border` | `neutral-200` | `neutral-800` | Borde estándar de tarjetas y separadores |
| `border-muted` | `--ui-border-muted` | `neutral-200` | `neutral-700` | Borde de muy bajo contraste |
| `border-accented` | `--ui-border-accented` | `neutral-300` | `neutral-700` | Borde de hover / énfasis |

### 4.4 Modificadores de opacidad

Los tokens aceptan opacidad de Tailwind y siguen siendo adaptativos:

```html
<div class="bg-elevated/60">     <!-- superficie tenue sobre bg-default -->
<div class="bg-primary/10">      <!-- tinte de marca, funciona en ambos modos -->
<div class="ring-primary/15">
```

---

## 5. Reglas de uso del color

### ✅ Correcto

```html
<h1 class="text-highlighted">Saldo neto</h1>
<p class="text-muted">Actualizado hace 2 min</p>
<div class="bg-default border border-default rounded-sm">
  <div class="border-b border-default bg-elevated/60 px-5 py-3.5">…</div>
</div>
<span class="text-primary">Ver detalle</span>
```

### ❌ Incorrecto

```html
<!-- Rompe el modo claro: invisible sobre blanco -->
<h1 class="text-white">Saldo neto</h1>

<!-- Fija un gris pensado solo para fondo oscuro -->
<p class="text-neutral-400">Actualizado hace 2 min</p>

<!-- Fondo oscuro hardcodeado sobre tarjeta clara -->
<div class="bg-neutral-900/80">…</div>

<!-- Blanco sobre blanco en modo claro -->
<span class="bg-white/10">…</span>
```

### Tabla de traducción

| Si vienes de… | Usa… |
| --- | --- |
| `text-white` | `text-highlighted` |
| `text-white/90`, `/85`, `/80`, `/70` | `text-toned` |
| `text-white/60`, `/50`, `/45`, `/40` | `text-muted` |
| `text-white/35`, `/30`, `/25`, `/20` | `text-dimmed` |
| `bg-white/[0.01…0.03]` | `bg-elevated/60` |
| `bg-white/5`, `bg-white/10` | `bg-elevated` |
| `border-white/10` | `border-default` |
| `border-white/5` | `border-muted` |
| `divide-white/*` | `divide-default` |
| `hover:border-white/15…30` | `hover:border-accented` |
| `bg-neutral-900/80` | `bg-default` |
| `text-neutral-400`, `text-neutral-500` | `text-muted` |
| `text-neutral-600`, `text-neutral-700` | `text-toned` |
| `text-neutral-100`, `text-neutral-200` | `text-highlighted` / `text-toned` |
| `text-primary-300…500` | `text-primary` |

### Las tres excepciones

Solo hay tres lugares donde el blanco es intencional:

1. **Texto sobre fondo de marca**: `bg-primary text-white` en
   `components/calendario/CalendarioPresupuestos.vue` (el día "hoy").
2. **Pantalla de login** (`pages/login/index.vue`): el texto vive sobre el degradado de marca.
3. **Marca de agua decorativa** en `components/app/AppStat.vue` (`dark:text-white`, ya protegido
   con `dark:`).

Si necesitas una cuarta, justifícala en el PR.

### `dark:` sí, pero solo para ajustes finos

Las clases con prefijo `dark:` son correctas **cuando el token no alcanza**. El caso típico son los
colores de estado:

```html
<!-- verde legible en claro, brillante en oscuro -->
<span class="text-emerald-600 dark:text-emerald-400">
```

Nunca uses `dark:` para "arreglar" un token semántico que ya existe.

---

## 6. Colores de estado

### 6.1 Paleta de estado de Nuxt UI

| Semántica | Color Nuxt UI | Uso |
| --- | --- | --- |
| Éxito | `success` (emerald) | Ingresos, montos positivos, "En orden", "Cumplido" |
| Advertencia | `warning` (amber) | "Cerca del límite", pendientes, saldo bajo |
| Error | `error` (red/rose) | Egresos, déficits, "Excedido", fallos |
| Información | `info` (sky) | Notas neutrales, "Por debajo" |
| Neutral | `neutral` | Todo lo demás |

### 6.2 Texto de estado: siempre doble tono

Los tonos `300` / `400` de las paletas de estado son **ilegibles sobre fondo claro**. La regla:

```
text-<color>-600 dark:text-<color>-300   (o 400)
```

| En claro | En oscuro |
| --- | --- |
| `text-emerald-600` | `dark:text-emerald-400` |
| `text-green-600` | `dark:text-green-300` |
| `text-rose-600` | `dark:text-rose-300` |
| `text-red-600` | `dark:text-red-400` |
| `text-amber-600` | `dark:text-amber-400` |
| `text-sky-600` | `dark:text-sky-400` |
| `text-blue-600` | `dark:text-blue-300` |
| `text-indigo-600` | `dark:text-indigo-300` |

### 6.3 Fondos de estado

Para fondos tintados, usa el color de Nuxt UI con opacidad baja. Funciona igual en ambos modos:

```html
<span class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">+12%</span>
<span class="bg-red-500/10 text-red-600 dark:text-red-400">−8%</span>
```

### 6.4 Estados de presupuesto

Definidos en `app/utils/budget-status.ts`:

| Estado | Etiqueta | Color |
| --- | --- | --- |
| `within` | En orden | `success` |
| `near` | Cerca del límite | `warning` |
| `exceeded` | Excedido | `error` |
| `unbudgeted` | Sin presupuesto | `neutral` |
| `met` | Cumplido | `success` |
| `below` | Por debajo | `info` |

---

## 7. Tipografía

### 7.1 Familias

| Rol | Familia | Estado |
| --- | --- | --- |
| Cuerpo / UI | **Roboto** | Activa: `--font-sans: 'Roboto', sans-serif` en `main.css`. |
| Display / títulos | **Plus Jakarta Sans** | Precargada en `nuxt.config.ts`, pero **sin token**. |

`nuxt.config.ts` precarga **Inter** y **Plus Jakarta Sans** desde Google Fonts. El cuerpo resuelve a
**Roboto** por la definición de `--font-sans`.

> ⚠️ **Inconsistencia conocida.** 25 componentes usan la clase `font-display` para títulos, pero
> `--font-display` **no está definida** en `@theme`. Tailwind no genera esa utilidad, así que los
> títulos caen a `--font-sans` (Roboto). Para activar Plus Jakarta Sans basta agregar en
> `app/assets/css/main.css`:
>
> ```css
> @theme {
>   --font-display: 'Plus Jakarta Sans', sans-serif;
> }
> ```
>
> No se aplicó en esta versión porque cambia la apariencia de todos los títulos. Decídelo como
> cambio de diseño aparte.

### 7.2 Escala en uso

| Rol | Clases típicas |
| --- | --- |
| Título de página (header) | `text-2xl font-bold text-highlighted` |
| Título de pantalla (toolbar) | `text-2xl font-semibold tracking-tight` |
| Título de tarjeta | `text-sm font-bold tracking-wide text-highlighted` |
| Encabezado de sección | `text-xs font-semibold uppercase tracking-widest text-highlighted` |
| Etiqueta de KPI | `text-[11px] font-bold uppercase tracking-wider text-muted` |
| Cifra KPI grande | `text-2xl` / `text-3xl` / `text-4xl` + `font-black` o `font-bold` + `tabular-nums` |
| Cuerpo | `text-sm text-default` |
| Metadato | `text-xs text-muted` |
| Micro-etiqueta | `text-[10px] uppercase tracking-wider text-dimmed` |

### 7.3 Números tabulares

**Toda cifra monetaria o porcentual lleva `tabular-nums`.** Evita el "baile" de dígitos al actualizar
y alinea las columnas.

```html
<span class="tabular-nums font-semibold">{{ formatMoney(total) }}</span>
```

### 7.4 Formato de valores

Usa siempre `app/utils/format.ts`:

| Función | Salida |
| --- | --- |
| `formatMoney(v, 'MXN')` | `$1,234.50` |
| `formatCompact(v, 'MXN')` | `$1.2K` |
| `formatExecution(rate)` | `85.3%` |
| `formatDate(v)` | `03/11/2026` |
| `formatVariance(v)` | `+$120` / `−$80` |
| `monthYearLabel(y, m)` | `Noviembre 2026` |

Locale: `es-MX`. Moneda: la del usuario (`auth.user?.currency`, por defecto `MXN`).

---

## 8. Radios, bordes y sombras

### 8.1 Radios

```css
:root {
  --ui-radius: 0.180rem;
}
.u-card {
  border-radius: 0rem;
}
```

| Elemento | Radio |
| --- | --- |
| Tarjetas (`UCard`) | `0` (rectas) |
| Contenedores y bloques | `rounded-sm` (casi recto) |
| Botones, inputs | Radio base de Nuxt UI (`0.180rem`) |
| Chips y avatares | `rounded-full` |
| Badges | `rounded-full` / `rounded-md` según tamaño |

La combinación "tarjeta recta + control casi recto" es deliberada. No introduzcas `rounded-xl` /
`rounded-2xl` en contenedores nuevos.

### 8.2 Bordes

- Borde estándar: `border border-default`.
- Separadores internos: `border-b border-default` / `border-t border-default`.
- Separador sutil: `border-muted`.
- Borde punteado para estados vacíos: `border-dashed border-default`.
- **Nunca** `border-white/10` ni `border-gray-800`.

### 8.3 Sombras

| Nivel | Clase | Uso |
| --- | --- | --- |
| 0 | — | Tarjetas en reposo (usan borde, no sombra) |
| 1 | `shadow-sm` | Elemento activo del sidebar |
| 2 | `shadow-xl` | Paneles flotantes, tooltips, popovers |
| 3 | `shadow-2xl` | Tarjeta del login |

La profundidad se comunica con **bordes y capas de superficie**, no con sombras.

---

## 9. Espaciado y layout

### 9.1 Ritmo

La app usa la escala de Tailwind de 4 px. Valores frecuentes:

| Contexto | Valor |
| --- | --- |
| Separación entre secciones de página | `space-y-6` (24 px) |
| Separación entre bloques de una tarjeta | `gap-4` (16 px) |
| Padding de tarjeta | `p-4` / `p-5` |
| Padding de cabecera de tabla | `px-5 py-3.5` |
| Gap de grid de KPIs | `gap-4` |
| Gap entre botones del toolbar | `gap-2` |

### 9.2 Grids de KPIs

| Tarjetas | Clases |
| --- | --- |
| 3 | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` |
| 4 | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |

Implementado en `AppStatCards.vue` con la prop `:columns="3 | 4"`.

### 9.3 Grids de contenido

| Patrón | Clases |
| --- | --- |
| Dos paneles iguales | `grid grid-cols-1 lg:grid-cols-2 gap-4` |
| Tres paneles (dashboard) | `grid grid-cols-1 lg:grid-cols-12 gap-4` con `lg:col-span-4` |
| Contenido + aside | `grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start` |
| Fugas + alertas | `grid grid-cols-1 lg:grid-cols-5 gap-4` con `lg:col-span-3` / `lg:col-span-2` |

### 9.4 Breakpoints

Los de Tailwind por defecto. El diseño se piensa **mobile-first**:

| Breakpoint | Comportamiento |
| --- | --- |
| `< lg` | Sidebar en drawer; header solo iconos; grids a 1 columna |
| `≥ lg` | Sidebar fijo; filtros de periodo visibles; grids a 2–4 columnas |
| `≥ xl` | Aside de 360 px en cuentas; grids de 3 |

---

## 10. Shell de la aplicación

`layouts/default.vue`:

```
div.min-h-screen.bg-muted
└── UDashboardGroup
    ├── LayoutAppSidebar          bg-default border-e border-default
    └── UDashboardPanel
        ├── LayoutAppHeader       bg-default (UDashboardNavbar)
        └── div.flex.flex-1
            ├── LayoutSubmenuSidebar   (solo en /configuracion)
            └── UDashboardPage.bg-muted.p-4
```

### 10.1 Sidebar

- Contenedor: `bg-default border-e border-default`.
- Ítem en reposo: `text-muted`, `rounded-xl`, `border-s-3 border-s-transparent`.
- Hover: `hover:bg-elevated hover:text-primary hover:border-s-primary/50`.
- **Activo**: `bg-primary/10 text-primary font-semibold border-s-primary shadow-sm`.
- Íconos: `size-5`, heredan el color del ítem.
- Logo: `h-20 w-auto object-contain`.
- Pie: avatar + nombre (`text-highlighted`) + correo (`text-muted`) + rol (`text-primary`).

### 10.2 Header

- `UDashboardNavbar` con `bg-default py-2`.
- Bloque izquierdo: cuadro de ícono `size-10` con
  `bg-primary/10 ring-1 ring-inset ring-primary/15` e ícono `text-primary`, seguido del título
  `text-2xl font-bold text-highlighted`.
- Bloque derecho: filtros (solo dashboard), **Descargar Reporte**, **Nueva Transacción** (con
  permiso), notificaciones, `UColorModeButton`, separador y avatar.

### 10.3 Submenú de configuración

`SubmenuSidebar.vue`, visible solo bajo `/configuracion`:

- Contenedor `bg-elevated`, ancho fijo.
- Encabezados de grupo: `bg-default border-default text-toned`.
- Ítems con los mismos estados de marca que el sidebar principal.

### 10.4 Login

`layouts/auth.vue` + `pages/login/index.vue`:

- Fondo: `login-shell` (`--ui-primary` + degradado radial `--login-bg-from` → `--login-bg-to`).
- Retícula: `login-grid` (líneas de 1 px, `40px × 40px`, color `--login-grid-line`).
- Viñeta: `login-vignette` (degradado radial oscuro al borde).
- Tarjeta: `bg-white/90 dark:bg-neutral-900/75 backdrop-blur-xl border border-white/40
  dark:border-white/10 shadow-2xl`.
- Botón de modo de color en la esquina superior derecha, en blanco.

El login es la **única** superficie donde el blanco y los `bg-white/*` son correctos, porque el fondo
es siempre de marca.

---

## 11. Patrones de componentes

### 11.1 `AppToolbar`

Encabezado estándar de pantalla.

```html
<AppToolbar
  v-model:search="search"
  title="Ventas"
  description="Ventas de productos al mostrador · 128 registros"
  search-placeholder="Buscar venta..."
  :create-label="puedeCrear ? 'Nueva Venta' : undefined"
  @create="openCreate"
/>
```

Props: `title`, `description`, `icon`, `searchPlaceholder`, `hideSearch`, `clearable`,
`searchDisabled`, `createLabel`, `createIcon`. Slots: `header`, `actions`, `create`.

### 11.2 `AppStatCards`

Rejilla de KPIs con esqueleto y barra de progreso opcional.

```ts
{
  label: 'Saldo total (activas)',
  value: formatMoney(saldo, currency),
  sub: '3 cuentas activas',
  icon: 'i-lucide-wallet',
  tone: 'success',       // primary | success | warning | danger | neutral
  progress: 82,          // opcional, 0–100
}
```

### 11.3 Tarjeta con cabecera y pie

Patrón dominante. La cabecera y el pie usan `bg-elevated/60` y bordes `default`:

```html
<UCard
  class="border border-default overflow-hidden"
  :ui="{
    header: 'py-3.5 px-5 border-b border-default bg-elevated/60',
    body: 'p-0 overflow-x-auto',
    footer: 'py-3 px-5 border-t border-default bg-elevated/60',
  }"
>
  <template #header>
    <span class="text-sm font-bold text-highlighted tracking-wide">Catálogo</span>
  </template>
</UCard>
```

### 11.4 Filtros

- Contenedor `UCard` con cabecera "Filtros" + `UBadge` con el número de filtros activos.
- Botón **Limpiar filtros** a la derecha, solo visible si hay filtros.
- Controles en `grid grid-cols-1 sm:grid-cols-2 gap-3`.
- Chips de selección rápida en `bg-elevated/60 border border-muted p-1.5 rounded-xl`.

### 11.5 Tablas

- `UTable` de Nuxt UI con columnas tipadas (`TableColumn<T>`).
- Celda primaria: nombre en `text-highlighted` + subtítulo en `text-muted`.
- Cifras: `tabular-nums`, alineadas a la derecha.
- Acciones: `UDropdownMenu` con ícono `i-lucide-ellipsis-vertical` en `text-dimmed`.
- Paginación: `UPagination` + texto `Mostrando X–Y de Z` en `text-muted`.
- Estado vacío: fila o bloque con `UEmpty`.

### 11.6 Drawers

`UDrawer` lateral derecho para alta y edición.

- Cabecera: cuadro de ícono de marca (`bg-primary-50 dark:bg-primary-950/50 text-primary`) +
  título `text-lg font-semibold text-highlighted` + subtítulo `text-xs text-muted`.
- Cuerpo: formulario `UForm` con `UFormField`.
- Pie: **Cancelar** (`neutral` / `ghost`) + **Guardar** (`primary` / `solid` con `:loading`).
- `DetailDrawer`: solo lectura, con bloques `rounded-xl border border-default bg-elevated/60 p-4`.

### 11.7 Badges

| Variante | Uso |
| --- | --- |
| `variant="soft"` | Estado general (activo, tipo, categoría) |
| `variant="subtle"` | Contadores y chips de marca |
| `variant="solid"` | Estado crítico o énfasis máximo |
| `variant="outline"` | Acción secundaria |

Tamaños: `xs` en tablas, `sm` en cabeceras, `lg` en el resumen del dashboard.

### 11.8 Botones

| Tipo | Clases |
| --- | --- |
| Primario | `color="primary" variant="solid"` |
| Secundario | `color="neutral" variant="outline"` |
| Terciario | `color="neutral" variant="ghost"` |
| Peligro | `color="error" variant="solid"` |
| Icono | `square` + `aria-label` |

---

## 12. Estados de pantalla

### 12.1 Cargando

`USkeleton` con la forma del contenido final. Nunca un spinner de página completa.

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <USkeleton v-for="i in 4" :key="i" class="h-44" />
</div>
```

### 12.2 Vacío

`UEmpty` con ícono, título contextual y descripción accionable.

```html
<UEmpty
  icon="i-lucide-wallet"
  title="Sin movimientos en Noviembre 2026"
  description="Registra tu primer movimiento o cambia de periodo."
/>
```

### 12.3 Error

`UAlert` con `color="error" variant="soft"`, título, descripción del backend y acción **Reintentar**.

```html
<UAlert color="error" variant="soft" title="No se pudo cargar" :description="getApiMessage(error)">
  <template #actions>
    <UButton color="error" variant="solid" @click="retry">Reintentar</UButton>
  </template>
</UAlert>
```

### 12.4 Sin permiso

No existe pantalla de "prohibido". El middleware lanza **404**. Es intencional: no revelar la
existencia de rutas no autorizadas.

---

## 13. Iconografía

- Librería: **Lucide**, vía Nuxt Icon.
- Prefijo: `i-lucide-` (el backend puede enviar el nombre sin prefijo; el frontend lo normaliza).
- Tamaños: `size-4` (inline), `size-5` (ítem de menú), `size-6` (cabecera de bloque), `size-7`
  (ícono de página), `size-10` (cuadro de ícono).

### Íconos por dominio

| Dominio | Ícono |
| --- | --- |
| Dashboard | `i-lucide-layout-dashboard` |
| Transacciones | `i-lucide-arrow-left-right` |
| Presupuestos | `i-lucide-target` / `i-lucide-wallet` |
| Calendario | `i-lucide-calendar-days` |
| Reportes | `i-lucide-chart-no-axes-combined` |
| Cuentas | `i-lucide-landmark` / `i-lucide-wallet` |
| Deudas | `i-lucide-hand-coins` |
| Metas de ahorro | `i-lucide-piggy-bank` |
| Ventas | `i-lucide-badge-dollar-sign` |
| Compras | `i-lucide-shopping-cart` |
| Producción | `i-lucide-factory` |
| Productos | `i-lucide-package` |
| Insumos | `i-lucide-wheat` |
| Inventario | `i-lucide-boxes` |
| Proveedores | `i-lucide-truck` |
| Configuración | `i-lucide-settings` |
| Usuarios | `i-lucide-users` |
| Roles | `i-lucide-shield` |
| Permisos | `i-lucide-lock` |
| Pantallas | `i-lucide-monitor` |
| Categorías | `i-lucide-tags` |
| Notificaciones | `i-lucide-bell` |
| Bitácora | `i-lucide-scroll-text` |

### Regla

Todo botón que muestre **solo un ícono** necesita `aria-label`. Sin excepción.

---

## 14. Gráficas

No hay librería de gráficas instalada (ECharts **no** está en dependencias; `AppChart.vue` es código
muerto). Las visualizaciones son **SVG nativo** o barras con `div`.

### 14.1 Dona

`dashboard/ExpenseDonut.vue` y `reportes/dashboard/DistributionChart.vue`:

```html
<circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--ui-bg-accented)" :stroke-width="12" />
```

La **pista** de la dona usa `var(--ui-bg-accented)` para adaptarse al tema. Nunca un hex fijo como
`#1c1f29` (se veía como un anillo negro en modo claro).

### 14.2 Barras

`div` con `height` o `width` porcentual y `bg-<color>-500`. La pista va en `bg-elevated` o
`bg-neutral-600` (barra de presupuesto, legible en ambos modos).

### 14.3 Paleta de series

Las series se dibujan con pares **punto/barra** y **texto**. El texto siempre es doble tono.

| Serie | Punto / barra | Texto |
| --- | --- | --- |
| Cheques (`checking`) | `bg-indigo-300` | `text-indigo-600 dark:text-indigo-300` |
| Ahorro (`savings`) | `bg-emerald-400` | `text-emerald-600 dark:text-emerald-400` |
| Efectivo (`cash`) | `bg-slate-400` | `text-muted` |
| Tarjeta (`credit_card`) | `bg-red-400` | `text-red-600 dark:text-red-400` |
| Ingreso | `bg-emerald-500` | `text-emerald-600 dark:text-emerald-400` |
| Egreso | `bg-rose-500` | `text-rose-600 dark:text-rose-300` |
| Marca / presupuesto | `bg-primary` | `text-primary` |
| Pista de presupuesto | `bg-neutral-600` | — |

Los puntos y barras usan tonos `300`/`400` porque son **formas**, no texto: se ven bien sobre ambos
fondos. Los porcentajes y etiquetas usan el par `600` / `dark:300-400`.

### 14.4 Cascada (waterfall)

Barras verticales con conectores; los valores positivos van en verde, los negativos en rojo y el
total en `bg-primary`. Altura mínima visible de 2 px para valores cercanos a cero.

---

## 15. Modo claro y oscuro

### 15.1 Configuración

```ts
// nuxt.config.ts
colorMode: { preference: 'dark', fallback: 'dark' }
```

- Preferencia inicial: **oscuro**.
- El usuario alterna con `UColorModeButton` (header y login).
- La elección se guarda en `localStorage` (`nuxt-color-mode`).
- `html { color-scheme: light dark }` para que los controles nativos acompañen.

### 15.2 Cómo se resuelve un token

```
Utilidad        →  Variable           →  Valor por tema
.bg-elevated    →  --ui-bg-elevated   →  neutral-100 (claro) / neutral-800 (oscuro)
```

Por eso **no hay que duplicar clases** para cada modo.

### 15.3 Excepciones del login

`main.css` define variables propias que cambian con `.dark`:

```css
:root {
  --login-bg-from: #a83a33;
  --login-bg-to: #6d2420;
  --login-grid-line: rgba(255, 255, 255, 0.18);
}

.dark {
  --login-bg-from: #7a2a24;
  --login-bg-to: #260d0b;
  --login-grid-line: rgba(255, 255, 255, 0.12);
}
```

### 15.4 Reglas

1. Si existe un token, úsalo. `dark:` solo para ajustes de estado o de marca de agua.
2. Nunca escribas `text-white` salvo en las tres excepciones documentadas.
3. Verifica **siempre** en ambos modos antes de dar por terminado un componente.
4. Las imágenes y logos deben funcionar sobre ambos fondos (los actuales son PNG con transparencia).

---

## 16. Accesibilidad

| Aspecto | Regla |
| --- | --- |
| **Contraste** | El texto principal usa `text-highlighted` / `text-default`, muy por encima del mínimo AA (4.5:1) en ambos modos. `text-dimmed` se reserva para texto no esencial. |
| **Foco** | Nuxt UI provee `focus-visible` en todos los interactivos. No lo elimines. |
| **Botones de icono** | Siempre `aria-label`. |
| **Estados** | No comuniques estado **solo** con color: acompaña con texto o ícono (badges con etiqueta). |
| **Tablas** | Usa `th` reales (lo hace `UTable`). |
| **Formularios** | Cada `UFormField` debe tener `label`; los requeridos llevan `required`. Los errores los muestra `UFormField`. |
| **Navegación** | El ítem activo del menú se marca con `data-[active=true]` y `aria-current="page"`. |
| **Movimiento** | Las transiciones son cortas (`duration-150` / `duration-200`). No hay animaciones de entrada largas. |
| **Zoom** | El layout soporta 200 % de zoom sin scroll horizontal en `≥ lg`. |

### Tamaños mínimos

- Área táctil: 32 × 32 px como mínimo (`size-8`).
- Texto: nunca menor a `text-[10px]`, y solo para micro-etiquetas decorativas.

---

## 17. Checklist para componentes nuevos

Antes de dar por terminado un componente:

- [ ] No usé `text-white`, `bg-white/*`, `border-white/*`, `bg-neutral-900`, `text-neutral-400`
      ni ningún gris/hex fijo.
- [ ] Usé tokens: `text-highlighted` / `text-toned` / `text-muted` / `text-dimmed`,
      `bg-default` / `bg-elevated` / `bg-muted`, `border-default` / `border-muted`.
- [ ] Las cifras llevan `tabular-nums` y `formatMoney` / `formatExecution`.
- [ ] Los colores de estado son dobles: `text-<c>-600 dark:text-<c>-300`.
- [ ] Verifiqué el componente en **modo claro y oscuro**.
- [ ] Verifiqué en **móvil** (1 columna) y en **desktop**.
- [ ] Tiene estado de **carga** (`USkeleton`) y de **vacío** (`UEmpty`).
- [ ] Tiene estado de **error** con `UAlert` + **Reintentar**.
- [ ] Los botones de acción respetan `permisos.can(ruta, 'canXxx')`.
- [ ] Todo botón de solo ícono tiene `aria-label`.
- [ ] Usé `AppToolbar`, `AppStatCards` y el patrón de `UCard` con cabecera/pie en lugar de inventar
      uno nuevo.
- [ ] Los textos están en español; los valores de API en inglés.
- [ ] No agregué `rounded-xl` / `rounded-2xl` a contenedores.

---

## Referencias

- [README.md](./README.md) — arquitectura, stack y mapa de pantallas.
- [MANUAL.md](./MANUAL.md) — instalación y uso.
- `app/assets/css/main.css` — paleta, tokens y clases del login.
- `app/app.config.ts` — alias de color primario.
- [Nuxt UI · Theme](https://ui.nuxt.com/getting-started/theme) — origen de los tokens semánticos.
- [Tailwind CSS v4 · Theme](https://tailwindcss.com/docs/theme) — directiva `@theme`.
