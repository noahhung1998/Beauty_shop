'use client';

import { useState } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import { ordersApi, paymentApi } from '@/lib/api';
import type { Address } from '@/types';

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutForm() {
  const { t } = useTranslation();
  const { trackPurchaseCompleted } = useTelemetry();
  const { items, total, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Contact info
  const [contact, setContact] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  // Shipping address (Spanish format)
  const [address, setAddress] = useState<Address>({
    calle: '',
    piso: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    pais: 'España',
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!contact.email) newErrors.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
      newErrors.email = 'Correo inválido';
    if (!contact.firstName) newErrors.firstName = 'El nombre es requerido';
    if (!contact.lastName) newErrors.lastName = 'Los apellidos son requeridos';
    if (!address.calle) newErrors.calle = 'La dirección es requerida';
    if (!address.ciudad) newErrors.ciudad = 'La ciudad es requerida';
    if (!address.provincia) newErrors.provincia = 'La provincia es requerida';
    if (!address.codigoPostal)
      newErrors.codigoPostal = 'El código postal es requerido';
    else if (!/^\d{5}$/.test(address.codigoPostal))
      newErrors.codigoPostal = 'Código postal inválido (5 dígitos)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Step 1: Create payment intent
      const { paymentIntentId } = await paymentApi.createIntent({
        amount: Math.round(total() * 100), // cents
      });

      // Step 2: Create the order
      const order = await ordersApi.create({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: address,
        guestEmail: !isAuthenticated ? contact.email : undefined,
        paymentIntentId,
      });

      // Step 3: Track purchase
      trackPurchaseCompleted(order.id, order.total, items.length);

      // Step 4: Clear cart and show success
      clearCart();
      setOrderNumber(order.orderNumber);
      setOrderComplete(true);
    } catch (err) {
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : 'Error al procesar el pedido. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (field: string) =>
    `input-field ${errors[field] ? 'border-red-400 focus:ring-red-300/30 focus:border-red-400' : ''}`;

  // Success screen
  if (orderComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-brand-charcoal mb-2">
          ¡Pedido realizado!
        </h2>
        <p className="text-brand-warm-gray mb-1">
          Tu pedido <span className="font-semibold">#{orderNumber}</span> ha
          sido recibido.
        </p>
        <p className="text-sm text-brand-warm-gray">
          Recibirás un correo de confirmación en {contact.email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Contact information */}
      <section>
        <h2 className="text-lg font-semibold text-brand-charcoal mb-4">
          {t('checkout.contact')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              {t('checkout.email')} *
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) =>
                setContact((p) => ({ ...p, email: e.target.value }))
              }
              className={inputClasses('email')}
              placeholder="nombre@ejemplo.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.firstName')} *
              </label>
              <input
                type="text"
                value={contact.firstName}
                onChange={(e) =>
                  setContact((p) => ({ ...p, firstName: e.target.value }))
                }
                className={inputClasses('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.lastName')} *
              </label>
              <input
                type="text"
                value={contact.lastName}
                onChange={(e) =>
                  setContact((p) => ({ ...p, lastName: e.target.value }))
                }
                className={inputClasses('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              {t('checkout.phone')}
            </label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) =>
                setContact((p) => ({ ...p, phone: e.target.value }))
              }
              className="input-field"
              placeholder="+34 612 345 678"
            />
          </div>
        </div>
      </section>

      {/* Shipping address */}
      <section>
        <h2 className="text-lg font-semibold text-brand-charcoal mb-4">
          {t('checkout.shipping')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              Dirección (Calle y número) *
            </label>
            <input
              type="text"
              value={address.calle}
              onChange={(e) =>
                setAddress((p) => ({ ...p, calle: e.target.value }))
              }
              className={inputClasses('calle')}
              placeholder="Calle Gran Vía 28"
            />
            {errors.calle && (
              <p className="text-xs text-red-500 mt-1">{errors.calle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
              Piso / Puerta (opcional)
            </label>
            <input
              type="text"
              value={address.piso}
              onChange={(e) =>
                setAddress((p) => ({ ...p, piso: e.target.value }))
              }
              className="input-field"
              placeholder="3º Izq."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.ciudad')} *
              </label>
              <input
                type="text"
                value={address.ciudad}
                onChange={(e) =>
                  setAddress((p) => ({ ...p, ciudad: e.target.value }))
                }
                className={inputClasses('ciudad')}
                placeholder="Madrid"
              />
              {errors.ciudad && (
                <p className="text-xs text-red-500 mt-1">{errors.ciudad}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.provincia')} *
              </label>
              <input
                type="text"
                value={address.provincia}
                onChange={(e) =>
                  setAddress((p) => ({ ...p, provincia: e.target.value }))
                }
                className={inputClasses('provincia')}
                placeholder="Madrid"
              />
              {errors.provincia && (
                <p className="text-xs text-red-500 mt-1">{errors.provincia}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.codigoPostal')} *
              </label>
              <input
                type="text"
                value={address.codigoPostal}
                onChange={(e) =>
                  setAddress((p) => ({
                    ...p,
                    codigoPostal: e.target.value.replace(/\D/g, '').slice(0, 5),
                  }))
                }
                className={inputClasses('codigoPostal')}
                placeholder="28013"
                maxLength={5}
              />
              {errors.codigoPostal && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.codigoPostal}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                País
              </label>
              <input
                type="text"
                value={address.pais}
                readOnly
                className="input-field bg-brand-cream/30 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section>
        <h2 className="text-lg font-semibold text-brand-charcoal mb-4">
          {t('checkout.payment')}
        </h2>
        <div className="bg-brand-cream/50 rounded-xl p-5 border border-brand-cream-dark">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-brand-rose-gold" />
            <span className="text-sm font-medium text-brand-charcoal">
              Tarjeta de crédito o débito
            </span>
          </div>

          {/* Stripe Elements placeholder */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                {t('checkout.cardNumber')}
              </label>
              <div className="input-field h-11 flex items-center bg-white">
                <span className="text-sm text-brand-warm-gray">
                  Stripe CardElement se renderiza aquí
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                  Fecha de expiración
                </label>
                <div className="input-field h-11 flex items-center bg-white">
                  <span className="text-sm text-brand-warm-gray">MM/AA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1.5">
                  CVC
                </label>
                <div className="input-field h-11 flex items-center bg-white">
                  <span className="text-sm text-brand-warm-gray">123</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-brand-warm-gray mt-4">
            <Lock size={12} />
            {t('checkout.secure')}
          </div>
        </div>
      </section>

      {/* Form-level error */}
      {errors.form && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{errors.form}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {t('checkout.processing')}
          </span>
        ) : (
          t('checkout.placeOrder')
        )}
      </button>
    </form>
  );
}
