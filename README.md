# soporte.ops — Panel de gestión de tickets de soporte técnico

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chart.js&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat&logo=github&logoColor=white)

Demo de portfolio de **Mariano De Greef** para postulaciones a roles de Soporte Técnico (Tier 2/3), Help Desk y QA.

---

## 🔗 Demo en vivo

> **[https://degreefmariano.github.io/soporte-ops](https://degreefmariano.github.io/soporte-ops)**
>
> Abre en el navegador, sin instalación, sin registro.

---

## ¿Qué es esto?

Simula el flujo de trabajo de un equipo de soporte de alta demanda: cola de tickets priorizada con seguimiento de SLA, diagnóstico de incidentes con causa raíz y logs, base de conocimiento interna y un dashboard de tendencias para detectar patrones recurrentes.

**No se conecta a ningún sistema real.** Todo corre en el navegador con datos de ejemplo, pensado para representar de forma realista el tipo de trabajo de un puesto de Soporte Técnico Semi Senior.

---

## Para quien revisa este portfolio

Este proyecto demuestra comprensión práctica de los procesos de soporte técnico, no solo código:

| Competencia | Cómo se refleja en el proyecto |
|---|---|
| Priorización bajo alto volumen | Cola ordenada por prioridad P1–P4 e impacto en SLA, con filtros por estado y búsqueda libre |
| Seguimiento de SLAs | Anillo de progreso por ticket (cumplido / en riesgo / vencido), calculado dinámicamente |
| Documentación de incidentes | Cada ticket incluye diagnóstico, causa raíz, solución aplicada y acciones preventivas |
| Análisis de logs | Consola de logs simulada por ticket para diagnóstico técnico |
| Criterio de escalamiento | Flujo de escalado a Nivel 3 con estado diferenciado en la cola |
| Base de conocimiento (Confluence-style) | Artículos buscables organizados por categoría |
| Detección de patrones y mejora continua | Vista de tendencias: volumen, cumplimiento de SLA y categorías recurrentes |
| Alta de casos | Formulario de nuevo ticket que reordena la cola en tiempo real |

---

## Funcionalidades

- **Cola priorizada (P1–P4):** ordenamiento automático por prioridad e impacto en SLA.
- **Seguimiento de SLA en tiempo real:** calculado dinámicamente según la antigüedad del ticket.
- **Diagnóstico de incidentes:** formato de reporte estructurado (diagnóstico → causa raíz → solución → prevención).
- **Logs simulados:** consola de logs por ticket para análisis técnico.
- **Escalamiento:** flujo de escalado a Nivel 3 con estado diferenciado en la cola.
- **Base de conocimiento:** artículos buscables, estilo Confluence.
- **Tendencias:** métricas de volumen, SLA y categorías recurrentes.
- **Alta de tickets:** formulario que reordena la cola automáticamente.

---

## Stack técnico

HTML, CSS y JavaScript vanilla (sin frameworks ni build step) + [Chart.js](https://www.chartjs.org/) vía CDN para los gráficos.

**Por qué este stack:** corre como sitio estático, se publica gratis en GitHub Pages en minutos, y es fácil de leer/auditar sin necesidad de levantar entorno de desarrollo.

Los datos se persisten en `localStorage`, así que los cambios (escalar, resolver, crear tickets) se mantienen entre visitas en el mismo navegador.

---

## Estructura del proyecto

```
soporte-ops/
├── index.html          # Estructura de las 3 vistas (cola, conocimiento, tendencias) + modales
└── assets/
    ├── styles.css      # Estilos (tema oscuro tipo consola de operaciones)
    ├── data.js         # Datos de ejemplo: tickets y artículos de KB
    └── app.js          # Lógica: filtros, render de cola, drawer de detalle, KB, gráficos
```

---

## Correrlo localmente

No requiere instalación. Abrí `index.html` directamente en el navegador, o servilo con cualquier servidor estático:

```bash
npx serve .
# o
python3 -m http.server 8080
```

---

## Notas

- Las fechas de los tickets se calculan en relación al momento de apertura de la página (no son fechas fijas), así que el estado de los SLA siempre se ve realista.
- Es un proyecto de portfolio, no un producto en producción: la prioridad fue mostrar comprensión del flujo de trabajo de soporte (triage, SLA, escalamiento, documentación, base de conocimiento) con código simple y legible.

---

*Mariano De Greef — [degreefmariano@gmail.com](mailto:degreefmariano@gmail.com) — [github.com/degreefmariano](https://github.com/degreefmariano)*
