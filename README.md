# Team Balance ⚽

Una aplicación móvil para armar equipos de fútbol parejos y balanceados.

## Características

### 🎮 Funcionalidades Principales

- **Crear Jugadores**: Crea jugadores con 5 habilidades (velocidad, defensa, pase, gambeta, pegada) valoradas del 1 al 10
- **Organizar en Carpetas**: Agrupa tus jugadores en carpetas personalizadas
- **Armar Partidos**: Selecciona jugadores y forma equipos balanceados automáticamente
- **Visualización en Cancha**: Ve los equipos formados en una cancha de fútbol
- **Historial de Partidos**: Guarda resultados, goleadores y highlights de cada partido

### ⚡ Características Especiales

- Algoritmo de balanceo inteligente que distribuye jugadores equitativamente
- Soporte para arqueros (máximo 2)
- Nombres de equipos graciosos generados automáticamente (personalizables)
- Almacenamiento local persistente
- Diseño responsive para móviles y tablets

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:3000`

## Construcción para Producción

```bash
npm run build
```

Los archivos optimizados estarán en la carpeta `dist/`.

## Tecnologías

- React 18
- Vite
- CSS modular
- LocalStorage para persistencia

## Uso

### Crear un Jugador

1. Ve a "Crear Jugador"
2. Ingresa el nombre del jugador (debe ser único)
3. Ajusta las 5 habilidades usando los sliders (1-10)
4. Opcionalmente, crea carpetas y agrega el jugador a ellas
5. Haz clic en "Crear Jugador"

### Armar un Partido

1. Ve a "Armar Partido"
2. Selecciona los jugadores (debe ser cantidad par)
3. Marca como arquero hasta 2 jugadores (opcional)
4. Haz clic en "Armar Equipos"
5. Los equipos se mostrarán balanceados en una cancha

### Guardar un Partido

1. Una vez en la vista de equipos, puedes editar los nombres
2. Haz clic en "Partido Jugado"
3. Ingresa el resultado
4. Agrega goleadores y highlights
5. Guarda el partido para que aparezca en el historial

## Estructura del Proyecto

```
team-balance/
├── src/
│   ├── components/
│   │   ├── Home.jsx              # Pantalla principal
│   │   ├── CreatePlayer.jsx      # Crear/editar jugadores
│   │   ├── CreateMatch.jsx       # Seleccionar jugadores
│   │   ├── Teams.jsx             # Visualizar equipos
│   │   └── MatchHistory.jsx      # Historial de partidos
│   ├── App.jsx                   # Componente principal
│   ├── App.css                   # Estilos globales
│   └── main.jsx                  # Punto de entrada
├── index.html
├── package.json
└── vite.config.js
```

## Licencia

MIT

---

Desarrollado con ⚽ para amantes del fútbol
