import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import CookieConsent from '@/components/gdpr/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Beauty Shop | Cosméticos y Belleza',
    template: '%s | Beauty Shop',
  },
  description:
    'Tu tienda online de cosméticos, maquillaje y productos de belleza. Envíos a toda España. Precios con IVA incluido.',
  keywords: [
    'cosméticos',
    'belleza',
    'maquillaje',
    'skincare',
    'beauty shop',
    'tienda online',
    'España',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Beauty Shop',
    title: 'Beauty Shop | Cosméticos y Belleza',
    description:
      'Tu tienda online de cosméticos, maquillaje y productos de belleza.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieConsent />
      </body>
    </html>
  );
}
