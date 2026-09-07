# Sistema visual — Prode Champions 2026/27

Referencia para cualquier pantalla nueva. La idea rectora: **superficie
deportiva premium construida en capas, dentro de una atmósfera que también
está diseñada** — no dashboard, no cards flotando, no "componentes de
librería ensamblados". Cada decisión visual tiene que poder justificarse.

## Paleta (tailwind.config.js)

| Token        | Hex       | Uso                                                        |
|--------------|-----------|-------------------------------------------------------------|
| `ink`        | `#0B1440` | Fondo raíz de toda la app — el plano más lejano              |
| `bezel`      | `#101C52` | Marco exterior del stage — un tono por delante de `ink`      |
| `panel`      | `#132563` | Panel principal del stage — un tono por delante de `bezel`   |
| `panelLight` | `#1D3179` | Superficie del ranking / hover — el plano más cercano        |
| `electric`   | `#3D6BFF` | Acento primario — interacción, hover, CTA                    |
| `violet`     | `#5B6FE8` | Acento secundario — casi imperceptible, solo atmósfera        |
| `gold`       | `#E8C468` | Ver regla de uso abajo                                        |
| `silver`     | `#C7CCD8` | Exclusivo del 2.º puesto                                      |
| `bronze`     | `#B5793C` | Exclusivo del 3.º puesto                                      |
| `bone`       | `#F2F4FA` | Texto principal                                               |
| `slate`      | `#8891AA` | Texto secundario / metadatos                                  |
| `rust`       | `#B23B3B` | Estado "incorrecto / eliminado" (0 puntos)                    |

**Regla de dorado**: el líder del ranking (1.º puesto), el numeral "26/27"
del wordmark del header, y las marcas de "destacado" del Fixture (partido
destacado del usuario, opción más votada en el resultado de una fecha).
Ningún otro elemento lo usa — es siempre sinónimo de "esto es lo especial
acá", nunca decoración.

## Tipografía — tres roles, no una fuente en distintos tamaños

- **Fraunces** (`font-serif`, itálica) — **exclusivo del wordmark** del
  header. Aparece una sola vez en toda la interfaz.
- **Big Shoulders Display** (`font-head`) — **exclusivo de números**
  (posición, puntaje, "360"). Pesos 600–900; `font-black` en los números
  de máxima presencia.
- **Inter** (`font-sans`) — nav, nombres, labels, texto de apoyo.

Si algo necesita "más personalidad", la respuesta es ajustar peso/tracking/
tamaño dentro de estos tres roles — nunca sumar una cuarta familia.

## Atmósfera (fuera del stage)

`.atmosphere` (ver `Home.jsx`) es un contenedor propio, **no** `body` —
crece con el alto real de la página. Contiene formas enormes y de opacidad
muy baja (glows radiales, anillos orbitales de solo borde, un beam de luz,
una textura de spokes) parcialmente fuera de pantalla. Da textura a las
zonas sin contenido sin competir nunca con el stage. No agregar más de
estas piezas sin necesidad — la idea es "casi imperceptible en detalle,
notorio en conjunto", no un fondo llamativo.

## Composición: el "stage" en capas

Una única superficie horizontal, ancha (`max-w-7xl`), centrada, construida
en capas anidadas (ver `Home.jsx`):

0. **`.stage-back`** — estructura trasera: un plano más, apenas visible,
   detrás del marco — el stage tiene espesor, no es una tarjeta plana.
1. **`.stage-bezel`** — marco exterior, `rounded-2xl`, `shadow-stage`.
2. **`.stage-main`** (+ `.stage-light`, con tinte eléctrico además de
   blanco) — panel principal. Header, ranking, jugar, reglas, separados
   por divisores internos — nunca secciones de ancho completo con fondo
   propio.
3. **`.recede-panel`** — superficie del ranking (`RankingList`), `rounded-lg`.
4. **`.row-band-even`** — dentro de la lista, las filas pares quedan un
   tono casi imperceptible más cerca de la luz que las impares.

Escala de radios: `2xl` (marco) → `xl` (panel) → `lg` (ranking / placa de
reglas) → sin radio en filas y CTA.

## Componentes base

- `TeamBadge` — el escudo va directo sobre la superficie oscura, sin chip
  ni fondo. Legibilidad resuelta con `.crest-glow` (filter, no contenedor).
  `public/escudos/<nombre-exacto>.webp` — el `id` en `teams.js` es el
  nombre tal cual (no un slug). Sin escudo: un aro `border-white/[0.08]`
  sin relleno.
- `CrestStrip` — fila de escudos con **gap parejo, sin solape** (el
  solape se leía como choque de formas sin un disco de fondo detrás).
  Tamaño y `gap` configurables por contexto: más grande y airoso en
  desktop (`size="sm" gap="gap-3"`), compacto en mobile (`gap="gap-1.5"`).

## Botones / CTA

No usar el patrón `rounded-lg bg-color px-6 py-3` de librería de UI. El CTA
de Jugar se resuelve tipográficamente: texto + línea de acento (`electric`)
que crece al hover.

## Qué NO hacer (ya descartado, no reabrir)

- Podio / Top 1-2-3 en tarjetas separadas.
- Iniciales o letras como sustituto visual de un escudo.
- Chip o fondo claro detrás de un escudo — los `.webp` ya son transparentes.
- Glow/neón, glassmorphism pesado, animaciones decorativas.
- Hero grande o header espacioso — el header es una firma chica, no un héroe.
- Secciones de ancho completo apiladas con fondos distintos.
- Más de una familia tipográfica por rol.
- Dorado fuera de las dos excepciones documentadas arriba.
- Border-radius, sombra o color "porque el componente lo trae por default".
