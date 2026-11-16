# Novedades BioMar · TeleArseg

Dashboard del Centro de Monitoreo TeleArseg con las novedades de BioMar 2026, organizadas por **nivel de riesgo** (Alto, Medio, Bajo).

Incluye:

- Portada con el mosaico de cámaras y el logo de TeleArseg
- Indicadores: total, Alto, Medio, Bajo, novedades de madrugada y novedades con evidencia
- Tarjetas por nivel con sus tipos de novedad más frecuentes
- Gráficos por mes, por hora del día, por zona, por tipo, por operador CCTV y por involucrado
- Registro de novedades en tres vistas: línea de tiempo, por nivel y tabla, con descarga a CSV
- Galería con las 32 capturas de cámaras del informe

Todo funciona como página estática, sin servidor ni instalación.

## Abrirlo en la computadora

Abre `index.html` con doble clic.

## Publicarlo con GitHub Pages

1. En GitHub Desktop: **File → Add local repository…** y elige esta carpeta.
   Si dice que no es un repositorio, pulsa **create a repository** y luego **Create repository**.
2. Pulsa **Publish repository** y **desmarca "Keep this code private"**.
3. En github.com, abre el repositorio y ve a **Settings → Pages**.
4. En **Branch** elige `main` y la carpeta `/ (root)`, y pulsa **Save**.
5. En uno o dos minutos aparece el link, con la forma `https://<usuario>.github.io/<repositorio>/`.

## Actualizar las novedades

Todas las novedades están en `data/novedades.js`. Para agregar una, copia un bloque `{ ... }` y cambia sus valores:

```js
{ fecha: '2026-11-20', hora: '02:15', zona: 'Garita 1', categoria: 'rondas', nivel: 'ALTO', fuente: 'matriz',
  titulo: 'Ronda de las 02h00 no realizada',
  detalle: 'Acción adoptada…',
  involucrado: 'Patrulla de Reacción', operador: 'OSCAR ARTEAGA', fotos: ['ev-33'] },
```

- `nivel`: `ALTO`, `MEDIO` o `BAJO`
- `categoria`: `rondas`, `descanso`, `vehiculo`, `persona`, `procedimiento`, `logistica` o `infraestructura`
- `fotos`: nombres de archivo sin `.jpg`. Pon la foto grande en `img/evidencias/` y una copia pequeña (unos 520 px de ancho) en `img/evidencias/mini/`.

Después, en GitHub Desktop escribe un resumen, pulsa **Commit to main** y luego **Push origin**. La página se actualiza sola.

## Notas sobre los datos

- Fuentes: *Matriz de incidentes BioMar 2026* (48 novedades) y el informe *Novedades BioMar* (15 novedades más, con las fotos).
- Las novedades que solo están en el informe no traían nivel. Su nivel se asignó por similitud con las de la matriz y aparecen marcadas como **"Nivel estimado"**.
