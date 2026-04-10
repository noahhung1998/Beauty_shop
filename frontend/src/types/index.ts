// ============================================================
// Domain types for the Beauty Shop e-commerce platform
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  calle: string;       // Street name and number
  piso?: string;       // Floor / door (e.g. "3º Izq.")
  ciudad: string;      // City
  provincia: string;   // Province
  codigoPostal: string; // 5-digit postal code
  pais: string;        // Country (default "España")
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  shortDescription?: string;
  price: number; // Price with IVA included
  priceNeto: number; // Price without IVA
  ivaRate: number; // e.g. 0.21 for 21%
  category: string;
  subcategory?: string;
  images: ProductImage[];
  stock: number;
  sku: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  priceNeto: number;
  priceWithIva: number;
  ivaRate: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  subtotalNeto: number;
  ivaTotal: number;
  shippingCost: number;
  total: number;
  paymentIntentId?: string;
  paymentMethod?: string;
  notes?: string;
  shipment?: Shipment;
  createdAt: string;
  updatedAt: string;
}

export enum ShipmentStatus {
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
  RETURNED = 'returned',
}

export interface ShipmentTrackingEvent {
  timestamp: string;
  location: string;
  status: ShipmentStatus;
  description: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  currentLocation: string;
  estimatedDelivery: string;
  trackingHistory: ShipmentTrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryEvent {
  eventType:
    | 'page_view'
    | 'item_clicked'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout_started'
    | 'purchase_completed'
    | 'search'
    | 'filter_applied';
  timestamp: string;
  sessionId: string;
  userId?: string;
  payload: Record<string, unknown>;
  dwellTimeMs?: number;
  pageUrl: string;
  referrer?: string;
  userAgent?: string;
}

export interface ConsentState {
  necessary: boolean; // Always true, cannot be declined
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Analytics types for admin dashboard
export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface DwellTimeData {
  productSlug: string;
  productName: string;
  avgDwellTimeMs: number;
  views: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  cartAbandonmentRate: number;
  averageOrderValue: number;
  salesOverTime: SalesDataPoint[];
  topProducts: TopProduct[];
  dwellTimeByProduct: DwellTimeData[];
  orderStatusDistribution: Record<OrderStatus, number>;
}

// Filter / query types
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name' | 'popular';
  page?: number;
  pageSize?: number;
}
