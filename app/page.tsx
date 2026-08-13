import { seedDatabase } from '@/lib/dbSeed';
import Catalog from '@/components/Catalog';
import { Metadata } from 'next';

// Configuración de SEO y Metadatos para la landing page
export const metadata: Metadata = {
  title: 'Home and Toys Tío Willy - Catálogo Premium de Hogar y Juguetes',
  description: 'Explora nuestro catálogo exclusivo de productos para el hogar, juguetes y tecnología. Precios al detal y tarifas especiales para mayoristas. Pedidos directos vía WhatsApp.',
  keywords: ['Home and Toys', 'Tío Willy', 'Juguetes', 'Hogar', 'Tecnología', 'Mayorista', 'Catálogo de productos', 'WhatsApp'],
  authors: [{ name: 'Tío Willy' }],
  openGraph: {
    title: 'Home and Toys Tío Willy - Catálogo Premium',
    description: 'Explora nuestro catálogo exclusivo de productos para el hogar, juguetes y tecnología. Precios especiales al detal y al mayor.',
    type: 'website',
    images: [
      {
        url: '/images/chair_red.jpg',
        width: 800,
        height: 800,
        alt: 'Silla Gamer Ergonómica Tío Willy'
      }
    ]
  }
};

export default async function Home() {
  // Intentar sembrar y obtener los datos de la base de datos (con fallback automático)
  const { productos, categorias, mapUrl, isFallback } = await seedDatabase();

  return (
    <>
      {/* Mensaje sutil en consola del servidor para depuración */}
      {isFallback && (
        <span className="hidden">Cargado con datos locales de respaldo</span>
      )}
      
      {/* Componente de catálogo interactivo */}
      <Catalog initialProductos={productos} initialCategorias={categorias} mapUrl={mapUrl} />
    </>
  );
}
