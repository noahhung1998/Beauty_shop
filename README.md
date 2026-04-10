# Beauty Shop - Plataforma E-commerce para Belleza (Spain)

Plataforma de comercio electrónico de alta calidad para productos de belleza y cosmética, enfocada al mercado español. Cumplimiento estricto con GDPR, IVA español y preferencias de pago locales.

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#step-1-arquitectura-del-sistema)
2. [Esquema de Base de Datos](#step-2-esquema-de-base-de-datos)
3. [API Backend (Endpoints)](#step-3-api-backend)
4. [Arquitectura de Pagos](#step-4-arquitectura-de-pagos)
5. [Storefront Frontend](#step-5-storefront-frontend)
6. [GDPR y Localización](#step-6-gdpr-y-localización)
7. [Admin Dashboard](#step-7-admin-dashboard)
8. [Sistema de Telemetría](#step-8-sistema-de-telemetría)
9. [Autenticación de Usuarios](#step-9-autenticación-de-usuarios)
10. [Guía de Instalación Local](#guía-de-instalación-local)
11. [Despliegue a Producción](#despliegue-a-producción)

---

## Step 1: Arquitectura del Sistema

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend (Storefront)** | Next.js 14 (App Router), React 18, Tailwind CSS, Zustand |
| **Backend (API)** | Python FastAPI, SQLAlchemy (async), Alembic |
| **Base de Datos** | PostgreSQL 16 |
| **Cache / Cola de Tareas** | Redis 7, Celery |
| **Pagos** | Stripe (+ Redsys / Bizum preparados) |
| **Contenedores** | Docker Compose |

### Flujo Arquitectónico

```
┌─────────────────────┐     ┌──────────────────────┐     ┌────────────────┐
│   Next.js Frontend  │────▶│  FastAPI Backend      │────▶│  PostgreSQL    │
│   (puerto 3000)     │     │  (puerto 8000)        │     │  (puerto 5432) │
│                     │     │                       │     └────────────────┘
│  - Storefront       │     │  - /api/v1/auth       │
│  - Admin Dashboard  │     │  - /api/v1/products   │     ┌────────────────┐
│  - Checkout         │     │  - /api/v1/orders     │────▶│  Redis         │
│  - GDPR Consent     │     │  - /api/v1/logistics  │     │  (puerto 6379) │
└─────────────────────┘     │  - /api/v1/telemetry  │     └────────────────┘
                            │  - /api/v1/analytics  │
                            │  - /api/v1/gdpr       │     ┌────────────────┐
                            │                       │────▶│  Stripe API    │
                            └──────────────────────┘     └────────────────┘
```

### Estructura del Monorepo

```
Beauty_shop/
├── docker-compose.yml          # Orquestación de todos los servicios
├── .env.example                # Variables de entorno (copiar a .env)
├── .gitignore
│
├── backend/                    # FastAPI (Python)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                # Migraciones de base de datos
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py             # Entrada FastAPI + CORS + rutas
│       ├── config.py           # Configuración (Pydantic Settings)
│       ├── database.py         # SQLAlchemy async engine
│       ├── models/             # 6 modelos ORM
│       │   ├── user.py         # Usuario + campos GDPR
│       │   ├── product.py      # Producto con price_net / tax_rate
│       │   ├── order.py        # Pedido + OrderItem (máquina de estados)
│       │   ├── shipment.py     # Envío con tracking JSON
│       │   ├── telemetry.py    # Eventos de comportamiento
│       │   └── consent.py      # Registros de consentimiento GDPR
│       ├── schemas/            # Validación Pydantic (request/response)
│       ├── services/           # Lógica de negocio
│       │   ├── order_service.py      # Creación de pedidos + IVA
│       │   ├── logistics_service.py  # Tracking de envíos
│       │   ├── gdpr_service.py       # Anonimización + exportación
│       │   └── payment/              # Abstract Factory de pagos
│       │       ├── base.py           # PaymentGateway ABC
│       │       ├── stripe_gateway.py # Implementación Stripe
│       │       ├── redsys_gateway.py # Stub para Redsys
│       │       └── bizum_gateway.py  # Stub para Bizum
│       ├── api/v1/             # 7 grupos de endpoints REST
│       ├── middleware/auth.py  # JWT autenticación
│       └── utils/tax.py        # Calculadora IVA español
│
└── frontend/                   # Next.js 14 App Router
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js      # Colores marca (rosa dorado, crema)
    └── src/
        ├── app/                # 12 páginas
        │   ├── page.tsx              # Inicio (Hero + productos destacados)
        │   ├── productos/            # Catálogo + detalle [slug]
        │   ├── checkout/             # Pago en una página
        │   ├── cuenta/               # Mi cuenta + pedidos
        │   └── admin/                # Panel de administración (5 págs)
        ├── components/         # 9 componentes UI
        │   ├── layout/               # Header, Footer, CartDrawer
        │   ├── product/              # ProductCard, ProductGallery
        │   ├── checkout/             # CheckoutForm
        │   ├── gdpr/                 # CookieConsent
        │   └── admin/                # LogisticsTracker, AnalyticsDashboard
        ├── store/              # Estado global (Zustand)
        │   ├── cartStore.ts          # Carrito con IVA 21%
        │   └── authStore.ts          # Autenticación JWT
        ├── hooks/              # Custom hooks
        │   ├── useTelemetry.ts       # Tracking de comportamiento
        │   └── useConsent.ts         # Gestión de consentimiento
        ├── lib/
        │   ├── api.ts                # Cliente API (fetch wrapper)
        │   └── i18n.ts              # Traducciones español
        └── types/index.ts      # Interfaces TypeScript
```

---

## Step 2: Esquema de Base de Datos

### Modelos y sus campos clave

#### Users (Usuarios)
- `id` UUID, `email`, `hashed_password`, `first_name`, `last_name`
- Dirección: `street`, `city`, `postal_code`, `province`, `country` (default "ES")
- GDPR: `is_anonymized`, `gdpr_consent_at`, `gdpr_consent_ip`

#### Products (Productos)
- `id` UUID, `sku`, `name`, `slug` (único), `description`
- **Precios separados**: `price_net` (Numeric 10,2), `tax_rate` (default 21%), `price_gross` (calculado)
- `stock_quantity`, `category`, `brand`, `image_urls` (JSON), `weight_grams`

#### Orders (Pedidos) - Máquina de Estados
```
pending_payment → processing → ready_for_pickup → shipped → in_transit → delivered
                      ↓              ↓                ↓           ↓
                  cancelled      cancelled        cancelled   cancelled → refunded
                                                                         delivered → refunded
```

#### OrderItems (Líneas de pedido) - Precisión contable
| Campo | Descripción |
|-------|------------|
| `unit_price_net` | Precio unitario sin IVA |
| `tax_rate` | Tasa IVA (ej: 21.00%) |
| `tax_amount` | IVA por unidad (calculado) |
| `unit_price_gross` | Precio con IVA (calculado) |
| `line_total_net` | Total línea sin IVA |
| `line_total_gross` | Total línea con IVA |

#### Shipments (Envíos)
- Transportistas: `correos`, `seur`, `dhl`, `other`
- `current_location`, `estimated_delivery_date`, `actual_delivery_date`
- `tracking_history` JSON: array de `{timestamp, location, status, detail}`

#### UserEvents (Telemetría)
- `event_type`: page_view, item_clicked, add_to_cart, checkout_started, purchase_completed
- `dwell_time_ms`, `event_data` (JSON), `session_id`, indexado por `created_at`

#### ConsentRecords (Consentimiento GDPR)
- `consent_type`: analytics, marketing, necessary
- `is_granted`, `ip_address`, `granted_at`, `revoked_at`

---

## Step 3: API Backend

### Endpoints principales (`/api/v1/`)

| Método | Ruta | Descripción |
|--------|------|------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login (devuelve JWT) |
| GET | `/auth/me` | Perfil del usuario actual |
| GET | `/products` | Listado paginado + filtros |
| GET | `/products/{slug}` | Detalle de producto |
| POST | `/orders` | **Crear pedido** (cálculo automático de IVA) |
| PUT | `/orders/{id}/status` | Actualizar estado (admin, con validación de transiciones) |
| POST | `/orders/{id}/cancel` | Cancelar pedido (restaura stock) |
| PUT | `/shipments/{id}/tracking` | Actualizar ubicación y ETA (admin) |
| POST | `/webhooks/carrier/{name}` | Webhook para Correos/SEUR/DHL |
| POST | `/telemetry/events` | Ingesta batch de eventos |
| GET | `/analytics/sales` | Ventas agregadas por fecha |
| GET | `/analytics/products/top` | Productos más vendidos |
| GET | `/analytics/behavior/cart-abandonment` | Tasa de abandono |
| GET | `/analytics/export` | Exportar CSV |
| POST | `/gdpr/export-my-data` | Exportar datos personales |
| POST | `/gdpr/delete-my-account` | Anonimizar cuenta (Right to be Forgotten) |

---

## Step 4: Arquitectura de Pagos

Patrón **Abstract Factory** para desacoplar la lógica de negocio del proveedor de pago:

```python
PaymentGateway (ABC)
├── create_payment_intent(amount, currency)
├── confirm_payment(payment_intent_id)
├── refund_payment(payment_intent_id, amount?)
└── handle_webhook(payload, headers)

Implementaciones:
├── StripeGateway    ✅ Completo (test + producción)
├── RedsysGateway    🔧 Stub preparado (TPV virtual español)
└── BizumGateway     🔧 Stub preparado (pago móvil P2P)
```

---

## Step 5: Storefront Frontend

- **Mobile-first** inspirado en beautylash.mx
- Hero banner + productos destacados + categorías
- **CartDrawer**: carrito lateral con animación, "IVA incluido"
- **Checkout en una página**: dirección española, desglose neto + IVA 21% + total
- Colores: rosa dorado, crema, carbón suave

---

## Step 6: GDPR y Localización

- **Cookie Consent Banner**: bloquea tracking hasta aceptar
- Tres opciones: "Aceptar todas", "Solo necesarias", "Configurar"
- Modal granular: necessary (siempre on), analytics, marketing
- Almacena timestamp + IP del consentimiento
- **i18n**: Español como idioma predeterminado (100+ traducciones)
- Todos los precios muestran "IVA incluido"

---

## Step 7: Admin Dashboard

- **Estadísticas**: pedidos totales, ingresos, productos activos
- **Gestión de pedidos**: tabla con badges de estado, transiciones válidas
- **Logística**: actualizar ubicación, ETA, timeline visual del tracking
- **Analíticas**: gráficos Recharts (ventas, top productos, dwell time, abandono)
- **Exportar CSV**: datos estructurados para data science

---

## Step 8: Sistema de Telemetría

Hook `useTelemetry()`:
- Calcula **dwell time** (tiempo de permanencia) automáticamente
- Eventos: `page_view`, `item_clicked`, `add_to_cart`, `checkout_started`, `purchase_completed`
- **Batch cada 5 segundos** para no saturar el backend
- `navigator.sendBeacon` al cerrar pestaña (no pierde datos)
- **Solo envía si GDPR analytics consent está aceptado**

---

## Step 9: Autenticación de Usuarios

- **JWT**: registro, login, token en Authorization header
- **Guest Checkout**: permite comprar sin cuenta (`user_id` nullable)
- **Mi Cuenta**: perfil, historial de pedidos, tracking de envíos
- **GDPR**: "Exportar mis datos" y "Eliminar mi cuenta" (anonimiza PII, conserva datos financieros por ley española 4-6 años)

---

## Guía de Instalación Local

### Prerrequisitos

- **Docker Desktop** (recomendado) — https://www.docker.com/products/docker-desktop
- O bien, instalación manual:
  - Python 3.12+
  - Node.js 20+
  - PostgreSQL 16
  - Redis 7

### Opción A: Docker Compose (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd Beauty_shop

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves de Stripe (test keys) si quieres probar pagos

# 3. Levantar todos los servicios
docker-compose up -d

# 4. Verificar que todo está corriendo
docker-compose ps

# 5. Crear las tablas en la base de datos
docker-compose exec backend alembic upgrade head
```

Acceder a:
- **Tienda**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Opción B: Sin Docker (desarrollo manual)

#### Terminal 1 — Base de datos (si no tienes PostgreSQL corriendo)

```bash
# Instalar PostgreSQL y crear la base de datos
createdb beautyshop
```

#### Terminal 2 — Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
# .venv\Scripts\activate    # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export DATABASE_URL="postgresql+asyncpg://localhost:5432/beautyshop"
export SECRET_KEY="dev-secret-key-change-in-production"
export ALLOWED_ORIGINS="http://localhost:3000"

# Ejecutar migraciones
alembic upgrade head

# Iniciar el servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 3 — Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variable de entorno
export NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# Iniciar en modo desarrollo
npm run dev
```

### Datos de prueba (Seed)

Para tener productos de ejemplo, puedes usar la API Swagger en http://localhost:8000/docs:

1. **Crear un usuario admin**: `POST /api/v1/auth/register` con datos de prueba
2. **Crear productos**: `POST /api/v1/products` (requiere autenticación admin)

---

## Despliegue a Producción

### Para mostrar al cliente

Hay varias opciones según el nivel de fidelidad que necesites:

### Opción 1: Demo en tu máquina local (presentación en persona)

La forma más rápida. Solo necesitas Docker.

```bash
docker-compose up -d
# Abrir http://localhost:3000 en el navegador
# Compartir pantalla con el cliente
```

### Opción 2: Desplegar en un VPS (demo online compartible)

Servicios económicos para demo: **Railway**, **Render**, **DigitalOcean App Platform**, **Fly.io**.

#### Ejemplo con Railway (más sencillo)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Agregar PostgreSQL y Redis como servicios
railway add --plugin postgresql
railway add --plugin redis

# 5. Desplegar backend
cd backend
railway up

# 6. Desplegar frontend
cd ../frontend
railway up
```

#### Ejemplo con Vercel (frontend) + Railway (backend)

```bash
# Frontend en Vercel (gratis)
cd frontend
npx vercel --prod
# Configurar NEXT_PUBLIC_API_URL apuntando al backend en Railway

# Backend en Railway
cd backend
railway up
```

### Opción 3: Despliegue completo en AWS / GCP

Para producción real:

| Servicio | AWS | GCP |
|----------|-----|-----|
| Frontend | Amplify / CloudFront + S3 | Cloud Run / Firebase Hosting |
| Backend | ECS Fargate / App Runner | Cloud Run |
| Base de datos | RDS PostgreSQL | Cloud SQL |
| Cache | ElastiCache Redis | Memorystore |
| CDN | CloudFront | Cloud CDN |
| Dominio | Route 53 | Cloud DNS |

### Variables de entorno para producción

```bash
# .env (producción)
DATABASE_URL=postgresql+asyncpg://user:pass@db-host:5432/beautyshop
SECRET_KEY=<clave-segura-de-32-caracteres>
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
ALLOWED_ORIGINS=https://tu-dominio.es
NEXT_PUBLIC_API_URL=https://api.tu-dominio.es/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Checklist antes de mostrar al cliente

- [ ] Docker Compose levantado y funcionando
- [ ] Productos de ejemplo creados via API
- [ ] Navegar por la tienda (inicio → catálogo → producto → carrito)
- [ ] Probar el flujo de checkout (usar Stripe test card: `4242 4242 4242 4242`)
- [ ] Mostrar el admin dashboard con datos
- [ ] Mostrar el banner de cookies GDPR
- [ ] Demostrar la documentación API en `/docs`

---

## Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos totales | 85 |
| Líneas de código | 10,673 |
| Python (backend) | 4,057 líneas |
| TypeScript/TSX (frontend) | 6,549 líneas |
| Modelos de datos | 6 |
| Endpoints API | 17+ |
| Páginas frontend | 12 |
| Componentes UI | 9 |

---

## Licencia

Proyecto privado. Todos los derechos reservados.
