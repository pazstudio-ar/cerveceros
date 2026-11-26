# Cómo se carga la web de Cerveceros

Para actualizar la web no hace falta tocar el HTML. Todo sale de los archivos de la carpeta `data/`.

| Archivo | Qué tiene |
| --- | --- |
| `config.json` | Nombre, frase, torneo, división, temporada, fecha de inicio e Instagram |
| `jugadores.json` | El plantel |
| `partidos.json` | El fixture y los resultados. Con esto se calculan solos "Así venimos", las estadísticas y los goleadores |
| `posiciones.json` | Las tablas oficiales (del torneo y la anual, de las divisiones A, B y C) |
| `convocados.json` | La lista de convocados para la próxima fecha |
| `noticias.json` | Las crónicas y novedades |

## jugadores.json
```json
[
  { "id": "piñeiro", "nombre": "Agustín Piñeiro", "numero": 12, "posicion": "Delantero", "foto": "img/jugadores/pineiro.jpg", "apodo": "" }
]
```
- `id` es un nombre corto, sin espacios, que se usa en los partidos.
- `posicion` puede ser Arquero, Defensor, Mediocampista o Delantero.
- `foto` es opcional. Si no hay foto, la tarjeta muestra el número.

## partidos.json
```json
[
  {
    "torneo": "Apertura 2027", "fecha": 1, "dia": "2027-03-14", "hora": "09:30", "cancha": "Cancha 3",
    "rival": "Pancuca", "local": true, "estado": "proximo"
  },
  {
    "torneo": "Apertura 2027", "fecha": 2, "dia": "2027-03-21", "hora": "11:10", "cancha": "Cancha 3",
    "rival": "Jamaica", "local": false, "estado": "jugado",
    "golesFavor": 2, "golesContra": 1,
    "goles": { "piñeiro": 1, "herrera": 1 },
    "asistencias": { "paz": 1 },
    "jugaron": ["lodigiani", "paz", "piñeiro", "herrera"],
    "amarillas": [], "rojas": [],
    "figura": "piñeiro", "arquero": "lodigiani",
    "noticia": "cronica-fecha-2"
  }
]
```
- `local: false` pone a Cerveceros a la derecha.
- Para cargar un resultado, se cambia `estado` a `"jugado"` y se completan los goles.
- El torneo que figura último en el archivo es el que se muestra en la portada.

## posiciones.json
Se copia la tabla oficial tal como sale, en el mismo orden. Así se respetan los descuentos de puntos.
```json
[
  {
    "torneo": "Apertura 2027", "division": "B", "fecha": 3,
    "equipos": [
      { "equipo": "Aston Birra", "pts": 9, "pj": 3, "g": 3, "e": 0, "p": 0, "gf": 8, "gc": 2 }
    ]
  },
  { "torneo": "Anual 2027", "division": "B", "anual": true, "fecha": 3, "equipos": [] }
]
```
- Si en `config.json` se completa `"descienden": { "B": 2 }`, la tabla anual marca la zona de descenso.

## convocados.json
```json
{ "titulo": "Lista vs Jamaica · Fecha 2", "lista": ["lodigiani", "paz", "piñeiro"] }
```

## noticias.json
```json
[
  {
    "id": "cronica-fecha-2", "titulo": "Triunfo en la segunda fecha", "fecha": "2027-03-21",
    "categoria": "Crónica", "imagen": "img/noticias/fecha-2.jpg",
    "resumen": "Una línea que se ve en la tarjeta.",
    "contenido": ["Primer párrafo.", "Segundo párrafo."]
  }
]
```
