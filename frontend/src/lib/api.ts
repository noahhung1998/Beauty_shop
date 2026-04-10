import type {
  Product,
  Order,
  User,
  Shipment,
  TelemetryEvent,
  AnalyticsSummary,
  PaginatedResponse,
  ProductFilters,
  ConsentState,
  Address,
} from '@/types';

// ============================================================
// API client for the Beauty Shop backend
// ============================================================
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_ANALYTICS } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
// When MOCK_MODE is enabled (e.g. on GitHub Pages), the API calls return
// hardcoded sample data instead of hitting the real backend.
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorBody?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token ?? null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw new ApiError(
      response.status,
      `API error ${response.status}: ${response.statusText}`,
      errorBody,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ── Auth ─────────────────────────────────────────────────────

interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  country?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone || undefined,
    role: u.is_admin ? 'admin' : 'customer',
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'demo@beautyshop.es',
  firstName: 'María',
  lastName: 'García',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (MOCK_MODE) {
      return delay({ user: { ...MOCK_USER, email }, token: 'mock-token-' + Date.now() });
    }
    const tokenRes = await request<BackendTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Fetch user profile with the token
    const userRaw = await request<BackendUser>('/auth/me', {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });
    return { user: mapUser(userRaw), token: tokenRes.access_token };
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    if (MOCK_MODE) {
      return delay({
        user: {
          ...MOCK_USER,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'customer',
        },
        token: 'mock-token-' + Date.now(),
      });
    }
    // Register
    const userRaw = await request<BackendUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        gdpr_consent: true,
      }),
    });
    // Auto-login after register
    const tokenRes = await request<BackendTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    return { user: mapUser(userRaw), token: tokenRes.access_token };
  },

  async me(): Promise<User> {
    if (MOCK_MODE) return delay(MOCK_USER);
    const raw = await request<BackendUser>('/auth/me');
    return mapUser(raw);
  },

  logout() {
    if (MOCK_MODE) return delay(undefined as void);
    return request<void>('/auth/logout', { method: 'POST' });
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    if (MOCK_MODE) return delay({ ...MOCK_USER, ...data });
    const raw = await request<BackendUser>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      }),
    });
    return mapUser(raw);
  },
};

// ── Products ─────────────────────────────────────────────────

/**
 * Backend returns snake_case fields (price_net, image_urls, stock_quantity, ...).
 * Map them to the camelCase shape the frontend components expect.
 */
interface BackendProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  description_short?: string | null;
  price_net: string | number;
  tax_rate: string | number;
  price_gross: string | number;
  currency: string;
  stock_quantity: number;
  category: string;
  brand: string;
  image_urls?: string[] | null;
  is_active: boolean;
  weight_grams?: number | null;
  created_at: string;
  updated_at: string;
}

function mapProduct(p: BackendProduct): Product {
  const priceNet = Number(p.price_net);
  const priceGross = Number(p.price_gross);
  const taxRate = Number(p.tax_rate);
  const images = (p.image_urls || []).map((url, idx) => ({
    id: `${p.id}-img-${idx}`,
    url,
    alt: p.name,
    isPrimary: idx === 0,
    sortOrder: idx,
  }));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    shortDescription: p.description_short || undefined,
    price: priceGross,           // gross (with VAT) for display
    priceNeto: priceNet,
    ivaRate: taxRate / 100,
    category: p.category,
    images,
    stock: p.stock_quantity,
    sku: p.sku,
    tags: [],
    isActive: p.is_active,
    isFeatured: false,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

interface BackendProductList {
  items: BackendProduct[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const productsApi = {
  async list(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    if (MOCK_MODE) {
      let items = [...MOCK_PRODUCTS];
      if (filters?.category) {
        items = items.filter((p) => p.category === filters.category);
      }
      if (filters?.brand) {
        items = items.filter((p) => p.brand === filters.brand);
      }
      if (filters?.minPrice !== undefined) {
        items = items.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters?.maxPrice !== undefined) {
        items = items.filter((p) => p.price <= filters.maxPrice!);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
        );
      }
      // Sort
      switch (filters?.sortBy) {
        case 'price_asc': items.sort((a, b) => a.price - b.price); break;
        case 'price_desc': items.sort((a, b) => b.price - a.price); break;
        case 'name': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      }
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 12;
      const total = items.length;
      const start = (page - 1) * pageSize;
      const paginated = items.slice(start, start + pageSize);
      return delay({
        data: paginated,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      });
    }
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Map camelCase filter keys to snake_case query params
          const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
          params.append(snakeKey, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const raw = await request<BackendProductList>(`/products${query}`);
    return {
      data: (raw.items || []).map(mapProduct),
      total: raw.total,
      page: raw.page,
      pageSize: raw.page_size,
      totalPages: raw.pages,
    };
  },

  async getBySlug(slug: string): Promise<Product> {
    if (MOCK_MODE) {
      const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
      if (!found) throw new ApiError(404, `Product not found: ${slug}`);
      return delay(found);
    }
    const raw = await request<BackendProduct>(`/products/${slug}`);
    return mapProduct(raw);
  },

  async getFeatured(): Promise<Product[]> {
    if (MOCK_MODE) return delay(MOCK_PRODUCTS.slice(0, 8));
    return request<Product[]>('/products/featured');
  },

  async getCategories(): Promise<string[]> {
    if (MOCK_MODE) {
      return delay(Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category))));
    }
    return request<string[]>('/products/categories');
  },

  async getBrands(): Promise<string[]> {
    if (MOCK_MODE) {
      return delay(Array.from(new Set(MOCK_PRODUCTS.map((p) => p.brand))));
    }
    return request<string[]>('/products/brands');
  },

  async getRelated(productId: string): Promise<Product[]> {
    if (MOCK_MODE) {
      return delay(MOCK_PRODUCTS.filter((p) => p.id !== productId).slice(0, 4));
    }
    return request<Product[]>(`/products/${productId}/related`);
  },

  // Admin
  create(data: Partial<Product>) {
    return request<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Product>) {
    return request<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return request<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ── Orders ───────────────────────────────────────────────────

interface BackendOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_net: string;
  tax_rate: string;
  tax_amount: string;
  unit_price_gross: string;
  line_total_net: string;
  line_total_gross: string;
}

interface BackendOrder {
  id: string;
  order_number: string;
  user_id?: string | null;
  guest_email?: string | null;
  status: string;
  subtotal_net: string;
  total_tax: string;
  total_gross: string;
  currency: string;
  shipping_street?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_province?: string | null;
  shipping_country?: string;
  payment_method?: string | null;
  payment_intent_id?: string | null;
  notes?: string | null;
  items: BackendOrderItem[];
  created_at: string;
  updated_at: string;
}

function mapOrder(o: BackendOrder): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    userId: o.user_id || undefined,
    guestEmail: o.guest_email || undefined,
    status: o.status as Order['status'],
    items: (o.items || []).map((it) => ({
      id: it.id,
      productId: it.product_id,
      productName: it.product_name,
      productImage: '',
      sku: '',
      quantity: it.quantity,
      priceNeto: Number(it.unit_price_net),
      priceWithIva: Number(it.unit_price_gross),
      ivaRate: Number(it.tax_rate) / 100,
    })),
    shippingAddress: {
      calle: o.shipping_street || '',
      ciudad: o.shipping_city || '',
      provincia: o.shipping_province || '',
      codigoPostal: o.shipping_postal_code || '',
      pais: o.shipping_country || 'España',
    },
    subtotalNeto: Number(o.subtotal_net),
    ivaTotal: Number(o.total_tax),
    shippingCost: 0,
    total: Number(o.total_gross),
    paymentIntentId: o.payment_intent_id || undefined,
    paymentMethod: o.payment_method || undefined,
    notes: o.notes || undefined,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

export const ordersApi = {
  async create(data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: Address;
    guestEmail?: string;
    paymentIntentId?: string;
    notes?: string;
  }): Promise<Order> {
    if (MOCK_MODE) {
      const orderItems = data.items.map((it, idx) => {
        const product = MOCK_PRODUCTS.find((p) => p.id === it.productId);
        return {
          id: `mock-oi-${idx}`,
          productId: it.productId,
          productName: product?.name || 'Producto',
          productImage: '',
          sku: product?.sku || '',
          quantity: it.quantity,
          priceNeto: product?.priceNeto || 0,
          priceWithIva: product?.price || 0,
          ivaRate: 0.21,
        };
      });
      const subtotal = orderItems.reduce((s, i) => s + i.priceNeto * i.quantity, 0);
      const tax = orderItems.reduce((s, i) => s + (i.priceWithIva - i.priceNeto) * i.quantity, 0);
      const total = subtotal + tax;
      const now = new Date();
      return delay({
        id: 'mock-order-' + Date.now(),
        orderNumber: `BS-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        userId: 'mock-user-1',
        guestEmail: data.guestEmail,
        status: 'pending_payment' as Order['status'],
        items: orderItems,
        shippingAddress: data.shippingAddress,
        subtotalNeto: Math.round(subtotal * 100) / 100,
        ivaTotal: Math.round(tax * 100) / 100,
        shippingCost: 0,
        total: Math.round(total * 100) / 100,
        paymentMethod: 'stripe',
        notes: data.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    const raw = await request<BackendOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: data.items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        shipping_address: {
          street: `${data.shippingAddress.calle}${data.shippingAddress.piso ? ', ' + data.shippingAddress.piso : ''}`,
          city: data.shippingAddress.ciudad,
          postal_code: data.shippingAddress.codigoPostal,
          province: data.shippingAddress.provincia,
          country: 'ES',
        },
        guest_email: data.guestEmail,
        payment_method: 'stripe',
        notes: data.notes,
      }),
    });
    return mapOrder(raw);
  },

  async getMyOrders(): Promise<Order[]> {
    if (MOCK_MODE) return delay(MOCK_ORDERS);
    const raw = await request<BackendOrder[]>('/orders');
    return (raw || []).map(mapOrder);
  },

  async getById(id: string): Promise<Order> {
    if (MOCK_MODE) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      if (!found) throw new ApiError(404, 'Order not found');
      return delay(found);
    }
    const raw = await request<BackendOrder>(`/orders/${id}`);
    return mapOrder(raw);
  },

  // Admin
  async listAll(params?: { status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Order>> {
    if (MOCK_MODE) {
      let items = [...MOCK_ORDERS];
      if (params?.status) items = items.filter((o) => o.status === params.status);
      return delay({
        data: items,
        total: items.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: 1,
      });
    }
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
          query.append(snakeKey, String(value));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    const raw = await request<BackendOrder[]>(`/orders${qs}`);
    const orders = (raw || []).map(mapOrder);
    return {
      data: orders,
      total: orders.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
      totalPages: 1,
    };
  },

  async updateStatus(id: string, status: string): Promise<Order> {
    if (MOCK_MODE) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      if (!found) throw new ApiError(404, 'Order not found');
      return delay({ ...found, status: status as Order['status'] });
    }
    const raw = await request<BackendOrder>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return mapOrder(raw);
  },
};

// ── Shipments ────────────────────────────────────────────────

const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'ship-1',
    orderId: 'order-2',
    carrier: 'SEUR',
    trackingNumber: 'SEUR-2026040912345',
    status: 'in_transit' as Shipment['status'],
    currentLocation: 'Centro de distribución Madrid',
    estimatedDelivery: '2026-04-12',
    trackingHistory: [
      { timestamp: '2026-04-09T14:00:00Z', location: 'Centro logístico Barcelona', status: 'picked_up' as Shipment['status'], description: 'Paquete recogido' },
      { timestamp: '2026-04-10T08:00:00Z', location: 'Centro de distribución Madrid', status: 'in_transit' as Shipment['status'], description: 'En tránsito hacia destino final' },
    ],
    createdAt: '2026-04-09T13:00:00Z',
    updatedAt: '2026-04-10T08:00:00Z',
  },
];

export const shipmentsApi = {
  getByOrderId(orderId: string) {
    if (MOCK_MODE) {
      const found = MOCK_SHIPMENTS.find((s) => s.orderId === orderId);
      if (!found) throw new ApiError(404, 'Shipment not found');
      return delay(found);
    }
    return request<Shipment>(`/orders/${orderId}/shipment`);
  },

  // Admin
  listAll(params?: { status?: string; page?: number }) {
    if (MOCK_MODE) {
      return delay({
        data: MOCK_SHIPMENTS,
        total: MOCK_SHIPMENTS.length,
        page: params?.page || 1,
        pageSize: 20,
        totalPages: 1,
      });
    }
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PaginatedResponse<Shipment>>(`/admin/shipments${qs}`);
  },

  update(id: string, data: Partial<Shipment>) {
    if (MOCK_MODE) {
      const found = MOCK_SHIPMENTS.find((s) => s.id === id);
      if (!found) throw new ApiError(404, 'Shipment not found');
      return delay({ ...found, ...data });
    }
    return request<Shipment>(`/admin/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addTrackingEvent(
    id: string,
    event: { location: string; status: string; description: string },
  ) {
    if (MOCK_MODE) {
      const found = MOCK_SHIPMENTS.find((s) => s.id === id);
      if (!found) throw new ApiError(404, 'Shipment not found');
      return delay({
        ...found,
        currentLocation: event.location,
        trackingHistory: [
          ...found.trackingHistory,
          { timestamp: new Date().toISOString(), ...event, status: event.status as Shipment['status'] },
        ],
      });
    }
    return request<Shipment>(`/admin/shipments/${id}/tracking`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
};

// ── Telemetry ────────────────────────────────────────────────

export const telemetryApi = {
  sendEvents(events: TelemetryEvent[]) {
    if (MOCK_MODE) return delay(undefined as void);
    return request<void>('/telemetry/events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  },

  sendBeacon(events: TelemetryEvent[]): boolean {
    if (MOCK_MODE) return true;
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false;
    const url = `${API_BASE_URL}/telemetry/events`;
    const blob = new Blob([JSON.stringify({ events })], {
      type: 'application/json',
    });
    return navigator.sendBeacon(url, blob);
  },
};

// ── Analytics (Admin) ────────────────────────────────────────

export const analyticsApi = {
  async getSummary(params?: { from?: string; to?: string }): Promise<AnalyticsSummary> {
    if (MOCK_MODE) return delay(MOCK_ANALYTICS);
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<AnalyticsSummary>(`/admin/analytics/summary${qs}`);
  },

  exportCsv(type: 'orders' | 'products' | 'telemetry', params?: { from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qs = query.toString() ? `?${query.toString()}` : '';
    // Returns a download URL — actual download handled in component
    return `${API_BASE_URL}/admin/analytics/export/${type}${qs}`;
  },
};

// ── GDPR ─────────────────────────────────────────────────────

export const gdprApi = {
  exportData() {
    if (MOCK_MODE) {
      const data = JSON.stringify(
        { user: MOCK_USER, orders: MOCK_ORDERS, exported_at: new Date().toISOString() },
        null,
        2,
      );
      return delay(new Blob([data], { type: 'application/json' }));
    }
    return request<Blob>('/gdpr/export', {
      headers: { Accept: 'application/json' },
    });
  },

  deleteAccount() {
    if (MOCK_MODE) return delay(undefined as void);
    return request<void>('/gdpr/delete-account', {
      method: 'DELETE',
    });
  },

  updateConsent(consent: ConsentState) {
    if (MOCK_MODE) return delay(undefined as void);
    return request<void>('/gdpr/consent', {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  },
};

// ── Payment ──────────────────────────────────────────────────

export const paymentApi = {
  createIntent(data: {
    amount: number;
    currency?: string;
    orderId?: string;
  }) {
    if (MOCK_MODE) {
      return delay({
        clientSecret: 'mock_secret_' + Date.now(),
        paymentIntentId: 'mock_pi_' + Date.now(),
      });
    }
    return request<{ clientSecret: string; paymentIntentId: string }>(
      '/payments/create-intent',
      {
        method: 'POST',
        body: JSON.stringify({ ...data, currency: data.currency || 'eur' }),
      },
    );
  },
};

export { ApiError };
