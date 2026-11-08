# FUMICAN – Sistema de Control de Plagas

Aplicación web para gestionar clientes, técnicos, insumos químicos y órdenes de servicio de una empresa de control de plagas.

- **Frontend:** HTML + Tailwind CSS + JavaScript (carpeta `frontend/`)
- **Backend:** Node.js + Express 5 (carpeta `backend/`)
- **Base de datos:** MySQL (Aiven) (carpeta `database/`)

## Funcionalidades

- Registro y consulta de clientes
- Alta de técnicos (contraseña temporal cifrada con scrypt)
- Control de inventario de insumos con registro INVIMA
- Creación y asignación de órdenes de servicio
- Vista de campo para el técnico, con ruta directa en Google Maps y botón para completar la orden
- Certificado de servicio por orden (`GET /api/ordenes/:id/certificado`)

## Estructura

```
FUMICAN/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql
├── frontend/
│   ├── index.html
│   └── img/logo.jpg
├── .gitignore
└── README.md
```

## Cómo ejecutarlo en tu computador

Requisitos: Node.js 20 o superior y una base MySQL (por ejemplo la de Aiven).

1. **Base de datos:** ejecuta `database/schema.sql` en tu base de datos.
2. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env     # y completa tus datos reales
   npm run dev              # o: npm start
   ```
   Comprueba que funciona abriendo http://localhost:3000/api/health
3. **Frontend:** abre `frontend/index.html` en el navegador (o usa la extensión *Live Server* de VS Code).

## Variables de entorno (`backend/.env`)

| Variable      | Descripción                                   |
|---------------|-----------------------------------------------|
| `DB_HOST`     | Host de la base de datos                      |
| `DB_PORT`     | Puerto                                        |
| `DB_USER`     | Usuario                                       |
| `DB_PASSWORD` | Contraseña (**nunca** la subas a GitHub)      |
| `DB_NAME`     | Nombre de la base (en Aiven: `defaultdb`)     |
| `DB_SSL`      | `true` para Aiven                             |
| `PORT`        | Puerto del servidor (por defecto 3000)        |
| `CORS_ORIGIN` | Dominios permitidos, separados por coma       |

## API

| Método | Ruta                          | Descripción                       |
|--------|-------------------------------|-----------------------------------|
| GET    | `/api/health`                 | Estado del servidor y la base     |
| GET/POST | `/api/clientes`             | Listar / crear clientes           |
| GET/POST | `/api/tecnicos`             | Listar / crear técnicos           |
| GET/POST | `/api/insumos`              | Listar / crear insumos            |
| GET/POST | `/api/ordenes`              | Listar / crear órdenes            |
| GET    | `/api/ordenes/tecnico/:id`    | Órdenes de un técnico             |
| PUT    | `/api/ordenes/:id/completar`  | Completar una orden               |
| GET    | `/api/ordenes/:id/certificado`| Datos para el certificado         |

## Despliegue

GitHub Pages solo sirve el frontend; **no puede ejecutar el backend**. Para publicarlo:

1. Despliega `backend/` en un servicio como Render o Railway y configura allí las variables de entorno.
2. En el frontend cambia `API_URL` en `index.html` por la URL del backend desplegado.
3. Activa GitHub Pages sobre la carpeta `frontend/`.

## Próximos pasos sugeridos

- Inicio de sesión con roles (admin / técnico) y tokens JWT
- Generación del certificado de servicio en PDF
- Descuento automático del inventario al completar una orden
- Pruebas automáticas de la API
