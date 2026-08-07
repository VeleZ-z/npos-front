# Nativ POS System - Frontend (`npos-front`)

Interfaz de usuario moderna y rápida para la gestión operativa de restaurantes y facturación, desarrollada con **React, Vite, Redux Toolkit y TanStack Query**.

## Descripción

`npos-front` es el cliente SPA (Single Page Application) del sistema **Nativ POS**. Ofrece una interfaz intuitiva y adaptable para administradores, cajeros y meseros, permitiendo la creación rápida de órdenes, asignación visual de mesas, control de usuarios y seguimiento del flujo de ventas en tiempo real.

---

## Características Principales

- **Gestión de Sesión y Autenticación:**
  - Login y registro con persistencia de usuario mediante `Redux Toolkit`.
  - Control de acceso y renderizado condicional según el rol (`Administrador`, `Cajero`, `Mesero`).
- **Mapeo y Distribución de Mesas (`Tables.jsx`):**
  - Vista gráfica del estado de las mesas (disponible, ocupada, reservada).
- **Control de Comandas y Pedidos (`Orders.jsx`):**
  - Creación rápida de órdenes con actualización de estados en tiempo real.
- **Panel de Control y Menú (`Dashboard.jsx`, `Menu.jsx`):**
  - Visualización del menú de productos y métricas iniciales del negocio.
- **Manejo Eficiente de Datos Asíncronos:**
  - Uso de `TanStack Query` (React Query) para almacenamiento en caché, revalidación en segundo plano y actualización optimista de datos.
- **Experiencia de Usuario (UX):**
  - Notificaciones flotantes en tiempo real mediante `Notistack`.
  - Estilos responsivos optimizados con `Tailwind CSS`.
- **Cliente HTTP Modular:**
  - Wrapper personalizado sobre `Axios` (`axiosWrapper.js`) para la inyección automática de credenciales y manejo global de errores.

---

## Stack Tecnológico

- **Framework / Bundler:** React 18 + Vite
- **Enrutamiento:** React Router DOM v6
- **Estado Global:** Redux Toolkit (`@reduxjs/toolkit`)
- **Gestión de Estado Asíncrono:** TanStack Query v5 (`@tanstack/react-query`)
- **Cliente HTTP:** Axios
- **Estilos UI:** Tailwind CSS
- **Notificaciones UI:** Notistack

---

## Estructura del Proyecto

```text
pos-frontend/
├── src/
│   ├── components/
│   │   └── shared/          # Componentes reutilizables (Botones, Modales, Nabvar)
│   ├── hooks/
│   │   └── useLoadData.js   # Custom hook para carga de datos iniciales
│   ├── https/
│   │   ├── axiosWrapper.js  # Instancia configurada de Axios
│   │   └── index.js         # Funciones de petición a la API REST
│   ├── pages/
│   │   ├── Auth.jsx         # Pantalla de Login / Registro
│   │   ├── Home.jsx         # Vista principal
│   │   ├── Orders.jsx       # Gestión de comandas y pedidos
│   │   ├── Tables.jsx       # Mapeo y estado de mesas
│   │   ├── Menu.jsx         # Catálogo de productos
│   │   └── Dashboard.jsx    # Métricas y administración
│   ├── redux/
│   │   └── slices/
│   │       └── userSlice.js # Slice de Redux para autenticación y usuario
│   ├── App.jsx              # Enrutador principal y Providers
│   └── main.jsx             # Punto de entrada React
├── .env.example
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Configuración e Instalación

### Prerrequisitos
- Node.js (v16.x o superior)
- Servidor backend (`n-back`) en ejecución

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/VeleZ-z/npos-front.git
cd npos-front
npm install
```

### 2. Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz del proyecto:

```env
BACKEND_URL
```

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Integración con el Backend
`n-back` a través del módulo HTTP ubicado en `src/https/axiosWrapper.js`.
