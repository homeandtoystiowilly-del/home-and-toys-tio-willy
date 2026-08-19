import { cookies } from 'next/headers';
import { seedDatabase } from '@/lib/dbSeed';
import AdminClient from './AdminClient';
import { Metadata } from 'next';
import { verifySessionToken } from '@/lib/auth';

// Forzar renderizado dinámico en cada petición para evitar caché global en el CDN de Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Panel de Administración - Tío Willy',
  description: 'Panel privado para la gestión y creación de productos en el catálogo de Home and Toys Tío Willy.',
  robots: 'noindex, nofollow' // Evita que motores de búsqueda indexen esta página privada
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  const isAuthorized = verifySessionToken(session);

  // Obtener las categorías y productos dinámicos (creados en la base de datos o fallback)
  const { categorias, productos, mapUrl, currency } = await seedDatabase();

  return <AdminClient isAuthorized={isAuthorized} categories={categorias} initialProducts={productos} initialMapUrl={mapUrl} initialCurrency={currency || 'USD'} />;
}
