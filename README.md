# Informe de Auditoría Técnica & Avances de Ingeniería — Sistema Hauset

> **Página web interactiva y reporte técnico oficial de avances, arquitectura y diseño para el sistema Hauset.**

Este repositorio aloja el informe formal de auditoría y el panel de control interactivo para la evaluación técnica del sistema **Hauset** (Gestión de Campo e Ingeniería para Domótica, Automatización y Seguridad Electrónica).

---

## 📊 Vista Previa y Acceso al Dashboard

El informe ha sido diseñado como una Single Page Application (SPA) moderna en HTML5, CSS3 y JavaScript puro (sin frameworks pesados), optimizada para visualización interactiva y exportación para presentaciones o comités de ingeniería:

* **Visualización Local:** Abrir directamente [`index.html`](index.html) en cualquier navegador web.
* **Servidor Local Rápido:**
  ```bash
  python3 -m http.server 8080
  # Abrir http://localhost:8080
  ```
* **GitHub Pages:** Compatible para publicación directa en la raíz (`/`) de la rama `main`.

---

## 📋 Resumen del Estado del Sistema Hauset

```
Índice Global de Madurez: [ 78 / 100 ] — ESTADO: APROBADO CON OBSERVACIONES
├─ Infraestructura Docker & VPS: [ 95% ] Spring Boot, Nginx, PostgreSQL 15, MinIO
├─ Backend (Spring Boot 3.3.4):   [ 85% ] Auth, Catálogo, Precios y Archivos 100% listos
├─ Base de Datos (PostgreSQL 15): [ 100% ] 6 migraciones Flyway consolidadas sin drift
└─ Frontend Móvil (Flutter 3):    [ 55% ] Auth/Session validado en dispositivo físico
```

### Componentes Clave Auditados
1. **Identificadores UUID V4 Descentralizados (ADR-01):** Prevención de colisiones para sincronización offline en Flutter/SQLite.
2. **Control de Concurrencia Optimista (ADR-02):** Manejo de versión y respuestas `HTTP 409 Conflict` ante colisiones en campo.
3. **Multimedia Centralizada - Opción B (ADR-03):** Tabla `archivos_adjuntos` desacoplada, con control de hash SHA-256 e idempotencia móvil.
4. **Desacoplamiento Comercial vs Operativo (ADR-04):** Cotización fija para el cliente e instrucciones de trabajo versionadas en obra (v1..vN).
5. **Catálogo sin Precio Fijo (ADR-05):** Snapshots de precios por proveedor y cotización ágil ordenada de menor a mayor.
6. **Matriz RBAC Estricta:** 6 roles (`JEFE_SISTEMAS`, `JEFE_ELECTROMECANICO`, `INGENIERO_INDUSTRIAL`, `SECRETARIA`, `INSTALADOR`, `MARKETING`).

---

## 🗂️ Estructura del Repositorio

```
.
├── index.html        # Panel de auditoría interactivo con pestañas, filtros y métricas
├── styles.css        # Hoja de estilos moderna (diseño responsivo, tema oscuro y vista print/PDF)
├── app.js            # Lógica reactiva (explorador de base de datos, inventario de APIs, exportación JSON)
└── README.md         # Documentación general del informe
```

---

## 🛠️ Tecnologías del Ecosistema Hauset Auditado

* **Backend:** Java 17, Spring Boot 3.3.4, Spring Data JPA, Spring Security 6, JJWT 0.12.5, Flyway Core.
* **Frontend:** Flutter 3, Dart 3, Riverpod 2.6.1, GoRouter 14.8.1, Dio 5.7.0, Flutter Secure Storage.
* **Infraestructura:** Docker Compose, PostgreSQL 15, Nginx Alpine, MinIO Object Storage, Red Privada Tailscale.

---

*Emitido por la Auditoría de Calidad de Software y Arquitectura — Septiembre 2026.*
