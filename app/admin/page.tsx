import { cookies } from 'next/headers';
import { seedDatabase } from '@/lib/dbSeed';
import AdminClient from './AdminClient';
import { Metadata } from 'next';
import { verifySessionToken } from '@/lib/auth';
import clientPromise from '@/lib/stitch';

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

  // Si no está autorizado, renderizar el panel de login inmediatamente sin consultar la base de datos
  if (!isAuthorized) {
    return (
      <AdminClient 
        isAuthorized={false} 
        categories={[]} 
        initialProducts={[]} 
        initialMapUrl="" 
        initialCurrency="USD" 
        initialStats={{ visitas: 0, whatsapp: 0 }} 
      />
    );
  }

  // Obtener las categorías y productos dinámicos (creados en la base de datos o fallback)
  const { categorias, productos, mapUrl, currency } = await seedDatabase();

  // Obtener estadísticas de tráfico desde MongoDB de forma segura
  let stats = { visitas: 0, whatsapp: 0 };
  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const doc = await (db.collection('metricas') as any).findOne({ _id: 'general' });
    if (doc) {
      stats = {
        visitas: doc.visitas || 0,
        whatsapp: doc.whatsapp || 0,
      };
    }
  } catch (err) {
    console.error('Error al cargar estadísticas en panel:', err);
  }

  return (
    <AdminClient 
      isAuthorized={isAuthorized} 
      categories={categorias} 
      initialProducts={productos} 
      initialMapUrl={mapUrl} 
      initialCurrency={currency || 'USD'} 
      initialStats={stats} 
    />
  );
}
