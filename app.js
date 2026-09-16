/**
 * Hauset Engineering Audit Dashboard Application Logic
 * Interactive Tabs, Data Dictionary Explorer, Endpoint Catalog, and Audit Export
 */

// --- DATASETS ---

const DATABASE_DICTIONARY = [
    {
        name: "usuarios",
        category: "auth",
        flyway: "V1 / V4",
        desc: "Almacén maestro de usuarios del sistema con credenciales BCrypt y roles.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "Clave primaria universal generada con gen_random_uuid()" },
            { name: "nombre", type: "VARCHAR(150)", pk: false, fk: false, desc: "Nombre y apellido del funcionario" },
            { name: "rol", type: "VARCHAR(50)", pk: false, fk: false, desc: "Enum de rol (JEFE_SISTEMAS, INSTALADOR, etc.)" },
            { name: "telefono", type: "VARCHAR(30)", pk: false, fk: false, desc: "Identificador único para autenticación móvil" },
            { name: "password_hash", type: "VARCHAR(255)", pk: false, fk: false, desc: "Hash BCrypt con factor de costo 10" },
            { name: "activo", type: "BOOLEAN", pk: false, fk: false, desc: "Flag de baja lógica (Soft delete)" },
            { name: "created_at", type: "TIMESTAMPTZ", pk: false, fk: false, desc: "Marca temporal de creación" }
        ]
    },
    {
        name: "refresh_tokens",
        category: "auth",
        flyway: "V2",
        desc: "Tokens de refresco persistidos para sesión prolongada en apps móviles.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "Identificador del registro" },
            { name: "usuario_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id)" },
            { name: "token", type: "VARCHAR(255)", pk: false, fk: false, desc: "UUID secreto de refresco" },
            { name: "expiry_date", type: "TIMESTAMPTZ", pk: false, fk: false, desc: "Fecha de caducidad (30 días)" }
        ]
    },
    {
        name: "proveedores",
        category: "catalogo",
        flyway: "V1 / V4 / V5",
        desc: "Directorio de proveedores y distribuidores autorizados de domótica y seguridad.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "nombre", type: "VARCHAR(200)", pk: false, fk: false, desc: "Razón social del proveedor" },
            { name: "categorias_asociadas", type: "VARCHAR(255)", pk: false, fk: false, desc: "Etiquetas separadas por coma" },
            { name: "contacto", type: "VARCHAR(150)", pk: false, fk: false, desc: "Teléfono / email de contacto" },
            { name: "activo", type: "BOOLEAN", pk: false, fk: false, desc: "Soft delete para catálogo" }
        ]
    },
    {
        name: "catalogo_productos",
        category: "catalogo",
        flyway: "V1 / V4 / V5",
        desc: "Catálogo de artículos y hardware disponible para instalación sin precio fijo.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "nombre", type: "VARCHAR(200)", pk: false, fk: false, desc: "Nombre comercial del equipo" },
            { name: "categoria", type: "VARCHAR(50)", pk: false, fk: false, desc: "SEGURIDAD, ILUMINACION, CONTROL_ACCESO, AUDIO_AUTOMATIZACION" },
            { name: "especificacion", type: "TEXT", pk: false, fk: false, desc: "Ficha técnica y características" },
            { name: "activo", type: "BOOLEAN", pk: false, fk: false, desc: "Soft delete" }
        ]
    },
    {
        name: "precios_historial",
        category: "catalogo",
        flyway: "V1 / V5",
        desc: "Historial y snapshots de cotización de proveedores con auditoría.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "producto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; catalogo_productos(id)" },
            { name: "proveedor_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; proveedores(id)" },
            { name: "precio_neto", type: "DECIMAL(12,2)", pk: false, fk: false, desc: "Precio de compra neto" },
            { name: "disponible", type: "BOOLEAN", pk: false, fk: false, desc: "Indica stock disponible con el proveedor" },
            { name: "registrado_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id)" },
            { name: "fecha", type: "TIMESTAMPTZ", pk: false, fk: false, desc: "Fecha exacta del snapshot" }
        ]
    },
    {
        name: "clientes",
        category: "comercial",
        flyway: "V1 / V5",
        desc: "Maestro de clientes residenciales y corporativos.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "nombre", type: "VARCHAR(150)", pk: false, fk: false, desc: "Nombre completo del titular" },
            { name: "telefono", type: "VARCHAR(30)", pk: false, fk: false, desc: "Teléfono de WhatsApp" },
            { name: "direccion", type: "VARCHAR(255)", pk: false, fk: false, desc: "Ubicación física del inmueble" },
            { name: "activo", type: "BOOLEAN", pk: false, fk: false, desc: "Soft delete" }
        ]
    },
    {
        name: "cotizaciones",
        category: "comercial",
        flyway: "V1 / V5",
        desc: "Cotizaciones comerciales congeladas para el cliente con control de concurrencia optimista.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "cliente_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; clientes(id)" },
            { name: "informe_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; informes_tecnicos(id)" },
            { name: "armada_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Secretaria]" },
            { name: "margen_definido_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Jefe]" },
            { name: "total", type: "DECIMAL(12,2)", pk: false, fk: false, desc: "Importe total comercial congelado" },
            { name: "estado", type: "VARCHAR(30)", pk: false, fk: false, desc: "ENVIADA, ACEPTADA, RECHAZADA" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Optimistic locking (@Version) para control 409" }
        ]
    },
    {
        name: "cotizacion_extras",
        category: "comercial",
        flyway: "V1 / V5",
        desc: "Adendas de materiales adicionales en sitio sin reescribir la cotización principal.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "cotizacion_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; cotizaciones(id)" },
            { name: "motivo", type: "TEXT", pk: false, fk: false, desc: "Justificación técnica del extra" },
            { name: "confirmado_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Jefe]" },
            { name: "total_extra", type: "DECIMAL(12,2)", pk: false, fk: false, desc: "Monto adicional aprobado" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Optimistic locking" }
        ]
    },
    {
        name: "proyectos",
        category: "obra",
        flyway: "V6",
        desc: "Proyectos en ejecución originados tras la aceptación formal de una cotización.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "cotizacion_id", type: "UUID", pk: false, fk: true, desc: "FK UNIQUE &rarr; cotizaciones(id)" },
            { name: "estado", type: "VARCHAR(50)", pk: false, fk: false, desc: "COTIZADO, EN_INSTALACION, REQUIERE_RETORNO, CERRADO" },
            { name: "fecha_creacion", type: "TIMESTAMPTZ", pk: false, fk: false, desc: "Fecha de inicio" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Optimistic locking" }
        ]
    },
    {
        name: "instrucciones_version",
        category: "obra",
        flyway: "V6",
        desc: "Versiones operativas de trabajo en sitio (v1, v2, v3...) independientes del documento comercial.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "proyecto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; proyectos(id)" },
            { name: "numero_version", type: "INTEGER", pk: false, fk: false, desc: "Número correlativo de versión" },
            { name: "generada_desde", type: "VARCHAR(50)", pk: false, fk: false, desc: "COTIZACION o CAMBIO_SITIO" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Control de concurrencia" }
        ]
    },
    {
        name: "cambios_instruccion",
        category: "obra",
        flyway: "V6",
        desc: "Solicitudes de cambio propuestas por el instalador ante imprevistos en sitio.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "proyecto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; proyectos(id)" },
            { name: "propuesto_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Instalador]" },
            { name: "descripcion", type: "TEXT", pk: false, fk: false, desc: "Detalle del obstáculo o ajuste" },
            { name: "requiere_material", type: "BOOLEAN", pk: false, fk: false, desc: "Si true, vincula un cotizacion_extras" },
            { name: "estado", type: "VARCHAR(50)", pk: false, fk: false, desc: "PENDIENTE_CONFIRMACION, CONFIRMADO, RECHAZADO" },
            { name: "confirmado_por", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Jefe]" }
        ]
    },
    {
        name: "checklist_tareas",
        category: "obra",
        flyway: "V6",
        desc: "Lista de verificación de tareas ejecutadas por el instalador en campo.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "instruccion_version_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; instrucciones_version(id)" },
            { name: "descripcion", type: "VARCHAR(300)", pk: false, fk: false, desc: "Texto de la tarea operativa" },
            { name: "estado", type: "VARCHAR(50)", pk: false, fk: false, desc: "PENDIENTE, COMPLETADA, NO_APLICA" },
            { name: "orden", type: "INTEGER", pk: false, fk: false, desc: "Secuencia de ejecución en UI móvil" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Optimistic locking" }
        ]
    },
    {
        name: "visitas",
        category: "obra",
        flyway: "V6",
        desc: "Agenda de visitas técnicas a obra con técnico asignado y estado de terminación.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "proyecto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; proyectos(id)" },
            { name: "numero_visita", type: "INTEGER", pk: false, fk: false, desc: "Correlativo de visita (1, 2...)" },
            { name: "asignado_a", type: "UUID", pk: false, fk: true, desc: "FK &rarr; usuarios(id) [Instalador]" },
            { name: "fecha_hora", type: "TIMESTAMPTZ", pk: false, fk: false, desc: "Momento programado" },
            { name: "estado", type: "VARCHAR(50)", pk: false, fk: false, desc: "AGENDADA, COMPLETADA, REQUIERE_RETORNO" },
            { name: "motivo_retorno", type: "TEXT", pk: false, fk: false, desc: "Causa en caso de requerir nueva visita" }
        ]
    },
    {
        name: "equipos_instalados",
        category: "postventa",
        flyway: "V6",
        desc: "Inventario físico de hardware instalado en el domicilio del cliente.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "proyecto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; proyectos(id)" },
            { name: "producto_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; catalogo_productos(id)" },
            { name: "nombre_referencia", type: "VARCHAR(200)", pk: false, fk: false, desc: "Ej: 'Cámara domo garaje principal'" },
            { name: "numero_serie", type: "VARCHAR(100)", pk: false, fk: false, desc: "Serial físico del fabricante" },
            { name: "direccion_mac", type: "VARCHAR(50)", pk: false, fk: false, desc: "Dirección MAC para soporte de red" },
            { name: "fecha_instalacion", type: "DATE", pk: false, fk: false, desc: "Fecha de puesta en marcha" }
        ]
    },
    {
        name: "credenciales_equipo",
        category: "postventa",
        flyway: "V6",
        desc: "Almacenamiento de contraseñas de red y dispositivos con cifrado y auditoría.",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "equipo_id", type: "UUID", pk: false, fk: true, desc: "FK &rarr; equipos_instalados(id)" },
            { name: "tipo", type: "VARCHAR(50)", pk: false, fk: false, desc: "WIFI, APP_DISPOSITIVO, PANEL_ADMIN" },
            { name: "usuario", type: "VARCHAR(150)", pk: false, fk: false, desc: "Nombre de usuario o login" },
            { name: "contrasena_cifrada", type: "VARCHAR(500)", pk: false, fk: false, desc: "Contraseña cifrada en reposo" },
            { name: "version", type: "BIGINT", pk: false, fk: false, desc: "Optimistic locking" }
        ]
    },
    {
        name: "archivos_adjuntos",
        category: "multimedia",
        flyway: "V5",
        desc: "Tabla maestra centralizada de archivos, fotos de obra, firmas y PDFs (Opción B).",
        columns: [
            { name: "id", type: "UUID", pk: true, fk: false, desc: "PK UUID" },
            { name: "entidad_tipo", type: "VARCHAR(50)", pk: false, fk: false, desc: "INFORME_TECNICO, CHECKLIST_TAREA, FIRMA_CONFORMIDAD..." },
            { name: "entidad_id", type: "UUID", pk: false, fk: false, desc: "UUID de la entidad asociada" },
            { name: "categoria", type: "VARCHAR(50)", pk: false, fk: false, desc: "EVIDENCIA_ANTES, EVIDENCIA_DESPUES, FIRMA_CLIENTE..." },
            { name: "storage_key", type: "VARCHAR(500)", pk: false, fk: false, desc: "Ruta de almacenamiento relativa en disco duro del servidor" },
            { name: "checksum_sha256", type: "VARCHAR(64)", pk: false, fk: false, desc: "Hash SHA-256 para idempotencia móvil" },
            { name: "mime_type", type: "VARCHAR(100)", pk: false, fk: false, desc: "image/webp, image/jpeg, application/pdf" },
            { name: "tamano_bytes", type: "BIGINT", pk: false, fk: false, desc: "Tamaño físico en bytes" },
            { name: "estado", type: "VARCHAR(30)", pk: false, fk: false, desc: "PENDIENTE_SUBIDA, DISPONIBLE, ERROR" }
        ]
    }
];

const ENDPOINTS_CATALOG = [
    {
        method: "POST",
        path: "/api/usuarios/login",
        roles: "Público (Anónimo)",
        desc: "Autenticación móvil mediante teléfono y contraseña.",
        request: { telefono: "88888888", password: "••••••" },
        response: { token: "eyJhbGciOiJIUzI1NiJ9...", refreshToken: "f18b5727-64e3-4dfe-8d1a-8c29994aa248" },
        status: "200 OK / 401 Unauthorized"
    },
    {
        method: "POST",
        path: "/api/usuarios/refresh-token",
        roles: "Público con UUID",
        desc: "Renovación de token JWT preservando claims de usuario.",
        request: { refreshToken: "f18b5727-64e3-4dfe-8d1a-8c29994aa248" },
        response: { token: "eyJhbGciOiJIUzI1NiJ9...", refreshToken: "nuevo-uuid" },
        status: "200 OK / 403 Forbidden"
    },
    {
        method: "GET",
        path: "/api/usuarios/me",
        roles: "Cualquier usuario autenticado",
        desc: "Consulta de identidad y rol de la sesión activa.",
        request: null,
        response: { id: "a0000000-0000-0000-0000-000000000001", nombre: "Administrador Prueba", rol: "JEFE_SISTEMAS", telefono: "88888888", activo: true },
        status: "200 OK / 401 Unauthorized"
    },
    {
        method: "GET",
        path: "/api/usuarios/admin",
        roles: "JEFE_SISTEMAS, JEFE_ELECTROMECANICO",
        desc: "Listado de usuarios con filtros opcionales por rol y estado.",
        request: null,
        response: [{ id: "...", nombre: "Carlos Electro", rol: "JEFE_ELECTROMECANICO", activo: true }],
        status: "200 OK / 403 Forbidden"
    },
    {
        method: "POST",
        path: "/api/usuarios/admin",
        roles: "JEFE_SISTEMAS, JEFE_ELECTROMECANICO",
        desc: "Alta de nuevo personal con encriptación BCrypt.",
        request: { nombre: "Nuevo Tecnico", rol: "INSTALADOR", telefono: "71234567", password: "password123" },
        response: { id: "uuid...", nombre: "Nuevo Tecnico", rol: "INSTALADOR" },
        status: "201 Created / 400 Bad Request"
    },
    {
        method: "GET",
        path: "/api/proveedores",
        roles: "Autenticado (Todos los roles)",
        desc: "Directorio de proveedores paginado con búsqueda por texto.",
        request: null,
        response: { content: [{ id: "b0000000-...", nombre: "Seguridad Total S.A.", categoriasAsociadas: "seguridad, control_acceso", contacto: "+591 70011223", activo: true }], totalElements: 2, totalPages: 1 },
        status: "200 OK"
    },
    {
        method: "GET",
        path: "/api/proveedores/todos",
        roles: "Autenticado (Todos los roles)",
        desc: "Lista plana de proveedores activos para dropdowns en Flutter.",
        request: null,
        response: [{ id: "b0000000-...", nombre: "Seguridad Total S.A." }],
        status: "200 OK"
    },
    {
        method: "POST",
        path: "/api/proveedores",
        roles: "JEFE_*, SECRETARIA, INGENIERO_INDUSTRIAL",
        desc: "Creación de nuevo proveedor en el sistema.",
        request: { nombre: "Distribuidora Domo SRL", categoriasAsociadas: "seguridad", contacto: "+591 71002233" },
        response: { id: "uuid...", nombre: "Distribuidora Domo SRL", activo: true },
        status: "201 Created / 400 Bad Request"
    },
    {
        method: "DELETE",
        path: "/api/proveedores/{id}",
        roles: "JEFE_SISTEMAS, JEFE_ELECTROMECANICO",
        desc: "Baja lógica (soft delete) del proveedor.",
        request: null,
        response: null,
        status: "204 No Content / 404 Not Found"
    },
    {
        method: "GET",
        path: "/api/catalogo/productos",
        roles: "Autenticado (Todos los roles)",
        desc: "Listado paginado de productos con filtros por categoría y búsqueda.",
        request: null,
        response: { content: [{ id: "c0000000-...", nombre: "Cámara Domo IP 4K", categoria: "SEGURIDAD", especificacion: "Cámara antivandálica...", activo: true }], totalElements: 3 },
        status: "200 OK"
    },
    {
        method: "POST",
        path: "/api/catalogo/productos",
        roles: "JEFE_*, INGENIERO_INDUSTRIAL",
        desc: "Alta de nuevo producto en el catálogo.",
        request: { nombre: "Sensor Humo Smart", categoria: "SEGURIDAD", especificacion: "Protocolo Zigbee 3.0" },
        response: { id: "uuid...", nombre: "Sensor Humo Smart", categoria: "SEGURIDAD" },
        status: "201 Created"
    },
    {
        method: "POST",
        path: "/api/catalogo/precios",
        roles: "SECRETARIA, JEFE_ELECTROMECANICO, JEFE_SISTEMAS",
        desc: "Registro de snapshot de precio neto con auditoría automática.",
        request: { productoId: "c0000000-...", proveedorId: "b0000000-...", precioNeto: 250.50, disponible: true },
        response: { id: "uuid...", productoNombre: "Cámara Domo IP 4K", precioNeto: 250.5, registradoPorNombre: "Ana Secretaria", fecha: "2026-09-16T..." },
        status: "201 Created / 403 Forbidden (otros roles)"
    },
    {
        method: "GET",
        path: "/api/catalogo/precios/producto/{id}/ultimos",
        roles: "Autenticado (Todos los roles)",
        desc: "Cotización rápida: último precio de cada proveedor ordenado de menor a mayor.",
        request: null,
        response: [{ proveedorNombre: "Seguridad Total S.A.", precioNeto: 240.00, disponible: true }, { proveedorNombre: "Importadora X", precioNeto: 255.00, disponible: true }],
        status: "200 OK"
    },
    {
        method: "GET",
        path: "/api/catalogo/precios/producto/{id}",
        roles: "Autenticado (Todos los roles)",
        desc: "Historial cronológico paginado de fluctuación de precios del producto.",
        request: null,
        response: { content: [{ precioNeto: 250.50, fecha: "2026-09-15...", registradoPorNombre: "Ana Secretaria" }], totalElements: 5 },
        status: "200 OK"
    },
    {
        method: "POST",
        path: "/api/v1/archivos/upload",
        roles: "Autenticado (Multipart Form)",
        desc: "Subida de evidencia fotográfica, firma o plano con SHA-256 e idempotencia.",
        request: { file: "(binary WebP/JPEG/PDF)", entidadTipo: "CHECKLIST_TAREA", entidadId: "uuid...", categoria: "EVIDENCIA_ANTES" },
        response: { id: "uuid...", storageKey: "CHECKLIST_TAREA/2026/09/uuid.webp", checksumSha256: "e3b0c442...", estado: "DISPONIBLE" },
        status: "200 OK"
    },
    {
        method: "GET",
        path: "/api/v1/archivos/entidad/{tipo}/{id}",
        roles: "Autenticado",
        desc: "Obtención de todas las fotos o documentos vinculados a una tarea o entidad.",
        request: null,
        response: [{ id: "uuid...", categoria: "EVIDENCIA_ANTES", mimeType: "image/webp", storageKey: "..." }],
        status: "200 OK"
    },
    {
        method: "GET",
        path: "/api/v1/archivos/{id}/descargar",
        roles: "Autenticado",
        desc: "Streaming del binario con Content-Type, Content-Disposition y Cache-Control.",
        request: null,
        response: "(Streaming de archivo)",
        status: "200 OK"
    },
    {
        method: "GET",
        path: "/actuator/health",
        roles: "Público / Monitoreo",
        desc: "Healthcheck de Spring Boot y estado de conexión con PostgreSQL.",
        request: null,
        response: { status: "UP" },
        status: "200 OK"
    }
];

// --- INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    renderDictionary("all", "");
    renderEndpoints("all", "");
    initFilters();
    initModal();
});

// --- NAVIGATION & TABS ---

function initNavigation() {
    const navLinks = document.querySelectorAll(".nav-item");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const btnMobileMenu = document.getElementById("btn-mobile-menu");
    const btnCloseSidebar = document.getElementById("btn-close-sidebar");

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("open");
        document.body.classList.add("no-scroll");
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("open");
        document.body.classList.remove("no-scroll");
    }

    if (btnMobileMenu) btnMobileMenu.addEventListener("click", openMobileSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener("click", closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeMobileSidebar);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMobileSidebar();
    });

    function switchTab(tabId) {
        navLinks.forEach(link => {
            if (link.getAttribute("data-tab") === tabId) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === `section-${tabId}`) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        });

        closeMobileSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = link.getAttribute("data-tab");
            switchTab(tabId);
            window.location.hash = tabId;
        });
    });

    // Check if initial hash exists
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (document.getElementById(`section-${hash}`)) {
            switchTab(hash);
        }
    }
}

// --- DATA DICTIONARY RENDERING ---

function renderDictionary(category, searchTerm) {
    const container = document.getElementById("dictionary-container");
    if (!container) return;

    const term = searchTerm.toLowerCase().trim();
    const filtered = DATABASE_DICTIONARY.filter(table => {
        const matchesCategory = category === "all" || table.category === category;
        const matchesSearch = !term || 
            table.name.toLowerCase().includes(term) || 
            table.desc.toLowerCase().includes(term) ||
            table.columns.some(col => col.name.toLowerCase().includes(term) || col.desc.toLowerCase().includes(term));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="detail-box" style="text-align: center; color: var(--text-muted);">No se encontraron tablas coincidentes con el criterio de búsqueda.</div>`;
        return;
    }

    container.innerHTML = filtered.map((table, idx) => `
        <div class="table-acc-item" id="table-acc-${idx}">
            <div class="table-acc-header" onclick="toggleAccordion('table-acc-${idx}')">
                <div class="table-acc-title-group">
                    <span class="t-name">${table.name}</span>
                    <span class="t-desc">${table.desc}</span>
                </div>
                <div class="t-meta">
                    <span class="t-badge">${table.flyway}</span>
                    <span class="t-badge">${table.columns.length} cols</span>
                    <span class="acc-chevron">▼</span>
                </div>
            </div>
            <div class="table-acc-body">
                <div class="table-responsive">
                    <table class="columns-table">
                        <thead>
                            <tr>
                                <th>Columna</th>
                                <th>Tipo SQL</th>
                                <th>Modificador</th>
                                <th>Descripción / Propósito</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${table.columns.map(c => `
                                <tr>
                                    <td><code>${c.name}</code></td>
                                    <td><span class="col-type-tag">${c.type}</span></td>
                                    <td>
                                        ${c.pk ? '<span class="col-pk">PRIMARY KEY</span>' : ''}
                                        ${c.fk ? '<span class="col-fk">FOREIGN KEY</span>' : ''}
                                        ${!c.pk && !c.fk ? '<span style="color: var(--text-muted);">NOT NULL / DEFAULT</span>' : ''}
                                    </td>
                                    <td>${c.desc}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `).join("");
}

function toggleAccordion(id) {
    const item = document.getElementById(id);
    if (!item) return;
    const body = item.querySelector(".table-acc-body");
    const chevron = item.querySelector(".acc-chevron");
    if (body) {
        const isOpen = body.classList.toggle("open");
        if (chevron) chevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    }
}

// --- ENDPOINTS RENDERING ---

function renderEndpoints(methodFilter, searchTerm) {
    const container = document.getElementById("endpoints-container");
    if (!container) return;

    const term = searchTerm.toLowerCase().trim();
    const filtered = ENDPOINTS_CATALOG.filter(ep => {
        const matchesMethod = methodFilter === "all" || ep.method === methodFilter;
        const matchesSearch = !term ||
            ep.path.toLowerCase().includes(term) ||
            ep.desc.toLowerCase().includes(term) ||
            ep.roles.toLowerCase().includes(term);
        return matchesMethod && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="detail-box" style="text-align: center; color: var(--text-muted);">No se encontraron endpoints coincidentes.</div>`;
        return;
    }

    container.innerHTML = filtered.map((ep, idx) => `
        <div class="endpoint-card" id="ep-card-${idx}">
            <div class="endpoint-header" onclick="toggleEndpointCard('ep-card-${idx}')">
                <div class="ep-header-main">
                    <span class="http-method ${ep.method.toLowerCase()}">${ep.method}</span>
                    <span class="endpoint-path">${ep.path}</span>
                </div>
                <div class="ep-header-meta">
                    <span class="endpoint-desc">${ep.desc}</span>
                    <span class="badge badge-primary ep-role-badge">${ep.roles}</span>
                    <span class="ep-chevron">▼</span>
                </div>
            </div>
            <div class="endpoint-body">
                <div class="endpoint-meta-grid">
                    <div><strong>Roles Autorizados:</strong> <span style="color: #38bdf8;">${ep.roles}</span></div>
                    <div><strong>Códigos HTTP Esperados:</strong> <span style="color: var(--color-success); font-family: var(--font-mono);">${ep.status}</span></div>
                </div>
                ${ep.request ? `
                    <div style="margin-top: 10px;">
                        <strong style="font-size: 0.8rem; color: var(--text-secondary);">Cuerpo de Solicitud (Payload JSON / Form):</strong>
                        <pre class="json-block"><code>${JSON.stringify(ep.request, null, 2)}</code></pre>
                    </div>
                ` : ''}
                ${ep.response ? `
                    <div style="margin-top: 10px;">
                        <strong style="font-size: 0.8rem; color: var(--text-secondary);">Respuesta Típica (JSON 200/201):</strong>
                        <pre class="json-block"><code>${JSON.stringify(ep.response, null, 2)}</code></pre>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join("");
}

function toggleEndpointCard(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const body = card.querySelector(".endpoint-body");
    const chevron = card.querySelector(".ep-chevron");
    if (body) {
        const isOpen = body.classList.toggle("open");
        if (chevron) chevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    }
}

// --- FILTERS & SEARCH ---

function initFilters() {
    // DB Dictionary Category Pills
    const catPills = document.querySelectorAll(".cat-pill");
    const dbSearchInput = document.getElementById("db-search-input");

    catPills.forEach(pill => {
        pill.addEventListener("click", () => {
            catPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const cat = pill.getAttribute("data-cat");
            renderDictionary(cat, dbSearchInput ? dbSearchInput.value : "");
        });
    });

    if (dbSearchInput) {
        dbSearchInput.addEventListener("input", (e) => {
            const activeCat = document.querySelector(".cat-pill.active");
            const cat = activeCat ? activeCat.getAttribute("data-cat") : "all";
            renderDictionary(cat, e.target.value);
        });
    }

    // Endpoints Method Filters
    const methodBadges = document.querySelectorAll(".method-filters .method-badge");
    const apiSearchInput = document.getElementById("api-search-input");

    methodBadges.forEach(badge => {
        badge.addEventListener("click", () => {
            methodBadges.forEach(b => b.classList.remove("active"));
            badge.classList.add("active");
            const method = badge.getAttribute("data-method");
            renderEndpoints(method, apiSearchInput ? apiSearchInput.value : "");
        });
    });

    if (apiSearchInput) {
        apiSearchInput.addEventListener("input", (e) => {
            const activeMethod = document.querySelector(".method-filters .method-badge.active");
            const method = activeMethod ? activeMethod.getAttribute("data-method") : "all";
            renderEndpoints(method, e.target.value);
        });
    }

    // Export Button
    const btnExport = document.getElementById("btn-export-json");
    if (btnExport) {
        btnExport.addEventListener("click", exportAuditJson);
    }
}

// --- MODAL & EXPORT LOGIC ---

function initModal() {
    window.closeModal = function() {
        const modal = document.getElementById("modal-container");
        if (modal) modal.classList.add("hidden");
    };

    const copyBtn = document.getElementById("modal-copy-btn");
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            const content = document.getElementById("modal-content").innerText;
            navigator.clipboard.writeText(content).then(() => {
                copyBtn.innerText = "¡Copiado!";
                setTimeout(() => { copyBtn.innerText = "Copiar"; }, 2000);
            });
        });
    }
}

function showModal(title, content) {
    const modal = document.getElementById("modal-container");
    const titleEl = document.getElementById("modal-title");
    const contentEl = document.getElementById("modal-content");
    if (!modal || !titleEl || !contentEl) return;

    titleEl.innerText = title;
    contentEl.innerHTML = `<code>${typeof content === "object" ? JSON.stringify(content, null, 2) : content}</code>`;
    modal.classList.remove("hidden");
}

function exportAuditJson() {
    const auditPayload = {
        metadata: {
            proyecto: "Hauset — Sistema de Gestión de Campo para Domótica",
            fechaAuditoria: "2026-09-16",
            auditor: "Antigravity Software Quality Audit",
            estadoGlobal: "Fase de Desarrollo — Calificación 70/100"
        },
        metricas: {
            backendAvancePct: 85,
            frontendAvancePct: 20,
            databaseMigracionesPct: 100,
            tablasModeladas: DATABASE_DICTIONARY.length,
            endpointsOperativos: ENDPOINTS_CATALOG.length
        },
        decisionesArquitectura: [
            "ADR-01: Identificadores UUID V4 descentralizados para soporte Offline",
            "ADR-02: Control de Concurrencia Optimista (columna version con HTTP 409 Conflict)",
            "ADR-03: Arquitectura Multimedia Centralizada (Opción B) con almacenamiento en disco duro del servidor y hash SHA-256",
            "ADR-04: Desacoplamiento de Cotización Comercial vs Instrucciones de Trabajo",
            "ADR-05: Catálogo Dinámico sin Precio Fijo con Historial de Snapshots",
            "ADR-06: Cifrado y Auditoría de Lectura de Credenciales de Dispositivos"
        ],
        diccionarioDatos: DATABASE_DICTIONARY,
        endpointsCatalogo: ENDPOINTS_CATALOG,
        recomendacionesPrioritarias: [
            "H-01 (Alta): Implementar servicio de cifrado simétrico AES-256 para contrasena_cifrada en JPA",
            "H-02 (Media): Desarrollar controladores y servicios REST para módulos de campo V6 (Proyectos, Visitas, Checklist)",
            "H-03 (Media): Habilitar sqflite en Flutter y configurar sincronización diferida offline",
            "H-04 (Baja): Implementar monitoreo de almacenamiento en disco duro del servidor y compresión WebP"
        ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "auditoria_hauset_2026.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
