// ============================================================
// i18n with locale switching - Spanish (default) + English
// ============================================================
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'es' | 'en';

const translations = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.products': 'Productos',
    'nav.account': 'Cuenta',
    'nav.cart': 'Carrito',
    'nav.admin': 'Administración',
    'nav.search': 'Buscar productos...',

    // Homepage
    'home.hero.title': 'Belleza que inspira confianza',
    'home.hero.subtitle': 'Descubre nuestra colección exclusiva de cosméticos y productos de belleza',
    'home.hero.cta': 'Explorar Colección',
    'home.featured': 'Productos Destacados',
    'home.categories': 'Categorías',
    'home.newsletter.title': 'Únete a nuestra comunidad',
    'home.newsletter.subtitle': 'Recibe ofertas exclusivas y novedades directamente en tu correo',
    'home.newsletter.placeholder': 'Tu correo electrónico',
    'home.newsletter.button': 'Suscribirse',
    'home.newsletter.success': '¡Gracias por suscribirte!',

    // Product
    'product.addToCart': 'Añadir al Carrito',
    'product.added': 'Añadido',
    'product.outOfStock': 'Agotado',
    'product.ivaIncluded': 'IVA incluido',
    'product.quantity': 'Cantidad',
    'product.description': 'Descripción',
    'product.related': 'Productos Relacionados',
    'product.filters': 'Filtros',
    'product.category': 'Categoría',
    'product.brand': 'Marca',
    'product.priceRange': 'Rango de precio',
    'product.sortBy': 'Ordenar por',
    'product.sort.priceAsc': 'Precio: menor a mayor',
    'product.sort.priceDesc': 'Precio: mayor a menor',
    'product.sort.newest': 'Más recientes',
    'product.sort.name': 'Nombre A-Z',
    'product.sort.popular': 'Más populares',
    'product.noResults': 'No se encontraron productos',
    'product.showing': 'Mostrando {count} productos',

    // Cart
    'cart.title': 'Tu Carrito',
    'cart.empty': 'Tu carrito está vacío',
    'cart.emptyMessage': 'Añade productos para empezar a comprar',
    'cart.subtotal': 'Subtotal (sin IVA)',
    'cart.iva': 'IVA (21%)',
    'cart.shipping': 'Envío',
    'cart.shippingFree': 'Gratis',
    'cart.total': 'Total',
    'cart.checkout': 'Finalizar Compra',
    'cart.continueShopping': 'Seguir Comprando',
    'cart.remove': 'Eliminar',
    'cart.itemCount': '{count} artículo(s)',

    // Checkout
    'checkout.title': 'Finalizar Compra',
    'checkout.contact': 'Información de Contacto',
    'checkout.email': 'Correo electrónico',
    'checkout.firstName': 'Nombre',
    'checkout.lastName': 'Apellidos',
    'checkout.phone': 'Teléfono',
    'checkout.shipping': 'Dirección de Envío',
    'checkout.calle': 'Calle y número',
    'checkout.numExterior': 'Número',
    'checkout.numInterior': 'Piso / Puerta (opcional)',
    'checkout.colonia': 'Barrio',
    'checkout.ciudad': 'Ciudad',
    'checkout.provincia': 'Provincia',
    'checkout.codigoPostal': 'Código Postal',
    'checkout.pais': 'País',
    'checkout.payment': 'Método de Pago',
    'checkout.cardNumber': 'Número de tarjeta',
    'checkout.summary': 'Resumen del Pedido',
    'checkout.subtotalNeto': 'Subtotal (sin IVA)',
    'checkout.ivaAmount': 'IVA (21%)',
    'checkout.shippingCost': 'Coste de envío',
    'checkout.totalAmount': 'Total a Pagar',
    'checkout.placeOrder': 'Realizar Pedido',
    'checkout.processing': 'Procesando...',
    'checkout.secure': 'Pago seguro encriptado',

    // Account
    'account.title': 'Mi Cuenta',
    'account.profile': 'Perfil',
    'account.orders': 'Mis Pedidos',
    'account.privacy': 'Privacidad y Datos',
    'account.logout': 'Cerrar Sesión',
    'account.login': 'Iniciar Sesión',
    'account.register': 'Crear Cuenta',
    'account.email': 'Correo electrónico',
    'account.password': 'Contraseña',
    'account.confirmPassword': 'Confirmar contraseña',
    'account.noOrders': 'Aún no tienes pedidos',
    'account.exportData': 'Exportar mis datos',
    'account.deleteAccount': 'Eliminar mi cuenta',
    'account.deleteWarning': 'Esta acción es irreversible. Se eliminarán todos tus datos.',
    'account.consent': 'Gestión de Consentimiento',

    // Orders
    'order.number': 'Pedido #{number}',
    'order.date': 'Fecha',
    'order.status': 'Estado',
    'order.total': 'Total',
    'order.items': 'Artículos',
    'order.tracking': 'Seguimiento',
    'order.carrier': 'Transportista',
    'order.trackingNumber': 'Número de seguimiento',
    'order.estimatedDelivery': 'Entrega estimada',
    'order.currentLocation': 'Ubicación actual',
    'order.status.pending': 'Pendiente',
    'order.status.confirmed': 'Confirmado',
    'order.status.processing': 'En proceso',
    'order.status.shipped': 'Enviado',
    'order.status.in_transit': 'En tránsito',
    'order.status.delivered': 'Entregado',
    'order.status.cancelled': 'Cancelado',
    'order.status.refunded': 'Reembolsado',

    // Shipment
    'shipment.status.label_created': 'Etiqueta creada',
    'shipment.status.picked_up': 'Recogido',
    'shipment.status.in_transit': 'En tránsito',
    'shipment.status.out_for_delivery': 'En reparto',
    'shipment.status.delivered': 'Entregado',
    'shipment.status.exception': 'Excepción',
    'shipment.status.returned': 'Devuelto',

    // GDPR / Consent
    'gdpr.banner.title': 'Este sitio usa cookies',
    'gdpr.banner.message':
      'Utilizamos cookies para mejorar tu experiencia. Puedes aceptar todas, solo las necesarias, o configurar tus preferencias.',
    'gdpr.acceptAll': 'Aceptar todas',
    'gdpr.rejectAll': 'Solo necesarias',
    'gdpr.configure': 'Configurar',
    'gdpr.save': 'Guardar preferencias',
    'gdpr.necessary': 'Cookies necesarias',
    'gdpr.necessaryDesc': 'Imprescindibles para el funcionamiento del sitio. No se pueden desactivar.',
    'gdpr.analytics': 'Cookies de analítica',
    'gdpr.analyticsDesc': 'Nos ayudan a entender cómo usas el sitio para mejorarlo.',
    'gdpr.marketing': 'Cookies de marketing',
    'gdpr.marketingDesc': 'Permiten mostrarte publicidad personalizada.',
    'gdpr.privacyPolicy': 'Política de Privacidad',
    'gdpr.cookiePolicy': 'Política de Cookies',

    // Admin
    'admin.dashboard': 'Panel de Control',
    'admin.orders': 'Pedidos',
    'admin.logistics': 'Logística',
    'admin.analytics': 'Analíticas',
    'admin.products': 'Productos',
    'admin.totalOrders': 'Total Pedidos',
    'admin.revenue': 'Ingresos',
    'admin.activeProducts': 'Productos Activos',
    'admin.recentOrders': 'Pedidos Recientes',
    'admin.salesThisWeek': 'Ventas esta Semana',
    'admin.avgOrderValue': 'Valor Promedio',
    'admin.cartAbandonment': 'Abandono de Carrito',
    'admin.topProducts': 'Productos Más Vendidos',
    'admin.dwellTime': 'Tiempo de Permanencia',
    'admin.exportCsv': 'Exportar CSV',
    'admin.updateStatus': 'Actualizar Estado',
    'admin.shipmentDetails': 'Detalles de Envío',
    'admin.location': 'Ubicación',
    'admin.eta': 'Fecha Estimada',
    'admin.addEvent': 'Agregar Evento',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.retry': 'Reintentar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.page': 'Página',
    'common.of': 'de',
    'common.currency': 'EUR',

    // Footer
    'footer.company': 'Beauty Shop',
    'footer.about': 'Sobre Nosotros',
    'footer.contact': 'Contacto',
    'footer.help': 'Centro de Ayuda',
    'footer.terms': 'Términos y Condiciones',
    'footer.returns': 'Devoluciones',
    'footer.faq': 'Preguntas Frecuentes',
    'footer.rights': '© 2026 Beauty Shop. Todos los derechos reservados.',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.account': 'Account',
    'nav.cart': 'Cart',
    'nav.admin': 'Admin',
    'nav.search': 'Search products...',

    // Homepage
    'home.hero.title': 'Beauty that inspires confidence',
    'home.hero.subtitle': 'Discover our exclusive collection of cosmetics and beauty products',
    'home.hero.cta': 'Explore Collection',
    'home.featured': 'Featured Products',
    'home.categories': 'Categories',
    'home.newsletter.title': 'Join our community',
    'home.newsletter.subtitle': 'Get exclusive offers and news delivered to your inbox',
    'home.newsletter.placeholder': 'Your email address',
    'home.newsletter.button': 'Subscribe',
    'home.newsletter.success': 'Thanks for subscribing!',

    // Product
    'product.addToCart': 'Add to Cart',
    'product.added': 'Added',
    'product.outOfStock': 'Out of Stock',
    'product.ivaIncluded': 'VAT included',
    'product.quantity': 'Quantity',
    'product.description': 'Description',
    'product.related': 'Related Products',
    'product.filters': 'Filters',
    'product.category': 'Category',
    'product.brand': 'Brand',
    'product.priceRange': 'Price range',
    'product.sortBy': 'Sort by',
    'product.sort.priceAsc': 'Price: low to high',
    'product.sort.priceDesc': 'Price: high to low',
    'product.sort.newest': 'Newest',
    'product.sort.name': 'Name A-Z',
    'product.sort.popular': 'Most popular',
    'product.noResults': 'No products found',
    'product.showing': 'Showing {count} products',

    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyMessage': 'Add products to start shopping',
    'cart.subtotal': 'Subtotal (excl. VAT)',
    'cart.iva': 'VAT (21%)',
    'cart.shipping': 'Shipping',
    'cart.shippingFree': 'Free',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.continueShopping': 'Continue Shopping',
    'cart.remove': 'Remove',
    'cart.itemCount': '{count} item(s)',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.contact': 'Contact Information',
    'checkout.email': 'Email',
    'checkout.firstName': 'First Name',
    'checkout.lastName': 'Last Name',
    'checkout.phone': 'Phone',
    'checkout.shipping': 'Shipping Address',
    'checkout.calle': 'Street and number',
    'checkout.numExterior': 'Number',
    'checkout.numInterior': 'Floor / Door (optional)',
    'checkout.colonia': 'Neighborhood',
    'checkout.ciudad': 'City',
    'checkout.provincia': 'Province',
    'checkout.codigoPostal': 'Postal Code',
    'checkout.pais': 'Country',
    'checkout.payment': 'Payment Method',
    'checkout.cardNumber': 'Card Number',
    'checkout.summary': 'Order Summary',
    'checkout.subtotalNeto': 'Subtotal (excl. VAT)',
    'checkout.ivaAmount': 'VAT (21%)',
    'checkout.shippingCost': 'Shipping cost',
    'checkout.totalAmount': 'Total to Pay',
    'checkout.placeOrder': 'Place Order',
    'checkout.processing': 'Processing...',
    'checkout.secure': 'Secure encrypted payment',

    // Account
    'account.title': 'My Account',
    'account.profile': 'Profile',
    'account.orders': 'My Orders',
    'account.privacy': 'Privacy & Data',
    'account.logout': 'Log Out',
    'account.login': 'Log In',
    'account.register': 'Sign Up',
    'account.email': 'Email',
    'account.password': 'Password',
    'account.confirmPassword': 'Confirm password',
    'account.noOrders': 'You have no orders yet',
    'account.exportData': 'Export my data',
    'account.deleteAccount': 'Delete my account',
    'account.deleteWarning': 'This action is irreversible. All your data will be deleted.',
    'account.consent': 'Consent Management',

    // Orders
    'order.number': 'Order #{number}',
    'order.date': 'Date',
    'order.status': 'Status',
    'order.total': 'Total',
    'order.items': 'Items',
    'order.tracking': 'Tracking',
    'order.carrier': 'Carrier',
    'order.trackingNumber': 'Tracking number',
    'order.estimatedDelivery': 'Estimated delivery',
    'order.currentLocation': 'Current location',
    'order.status.pending': 'Pending',
    'order.status.confirmed': 'Confirmed',
    'order.status.processing': 'Processing',
    'order.status.shipped': 'Shipped',
    'order.status.in_transit': 'In transit',
    'order.status.delivered': 'Delivered',
    'order.status.cancelled': 'Cancelled',
    'order.status.refunded': 'Refunded',

    // Shipment
    'shipment.status.label_created': 'Label created',
    'shipment.status.picked_up': 'Picked up',
    'shipment.status.in_transit': 'In transit',
    'shipment.status.out_for_delivery': 'Out for delivery',
    'shipment.status.delivered': 'Delivered',
    'shipment.status.exception': 'Exception',
    'shipment.status.returned': 'Returned',

    // GDPR / Consent
    'gdpr.banner.title': 'This site uses cookies',
    'gdpr.banner.message':
      'We use cookies to improve your experience. You can accept all, only the necessary ones, or configure your preferences.',
    'gdpr.acceptAll': 'Accept all',
    'gdpr.rejectAll': 'Necessary only',
    'gdpr.configure': 'Configure',
    'gdpr.save': 'Save preferences',
    'gdpr.necessary': 'Necessary cookies',
    'gdpr.necessaryDesc': 'Essential for the site to function. Cannot be disabled.',
    'gdpr.analytics': 'Analytics cookies',
    'gdpr.analyticsDesc': 'Help us understand how you use the site to improve it.',
    'gdpr.marketing': 'Marketing cookies',
    'gdpr.marketingDesc': 'Allow us to show you personalized ads.',
    'gdpr.privacyPolicy': 'Privacy Policy',
    'gdpr.cookiePolicy': 'Cookie Policy',

    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.orders': 'Orders',
    'admin.logistics': 'Logistics',
    'admin.analytics': 'Analytics',
    'admin.products': 'Products',
    'admin.totalOrders': 'Total Orders',
    'admin.revenue': 'Revenue',
    'admin.activeProducts': 'Active Products',
    'admin.recentOrders': 'Recent Orders',
    'admin.salesThisWeek': 'Sales This Week',
    'admin.avgOrderValue': 'Avg. Order Value',
    'admin.cartAbandonment': 'Cart Abandonment',
    'admin.topProducts': 'Top Selling Products',
    'admin.dwellTime': 'Dwell Time',
    'admin.exportCsv': 'Export CSV',
    'admin.updateStatus': 'Update Status',
    'admin.shipmentDetails': 'Shipment Details',
    'admin.location': 'Location',
    'admin.eta': 'Estimated Date',
    'admin.addEvent': 'Add Event',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.page': 'Page',
    'common.of': 'of',
    'common.currency': 'EUR',

    // Footer
    'footer.company': 'Beauty Shop',
    'footer.about': 'About Us',
    'footer.contact': 'Contact',
    'footer.help': 'Help Center',
    'footer.terms': 'Terms & Conditions',
    'footer.returns': 'Returns',
    'footer.faq': 'FAQ',
    'footer.rights': '© 2026 Beauty Shop. All rights reserved.',
  },
} as const;

type TranslationKey = keyof (typeof translations)['es'];

// ------------------------------------------------------------
// Locale store (Zustand) - persists user choice in localStorage
// ------------------------------------------------------------
interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'beauty-shop-locale',
    },
  ),
);

/**
 * Translation hook that returns a `t` function for the current locale.
 * Supports basic interpolation with `{key}` placeholders.
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let value: string = (translations[locale] as Record<string, string>)[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    return value;
  }

  return { t, locale, setLocale };
}

export type { TranslationKey };
export default translations;
