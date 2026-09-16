import { seedDatabase } from '@/lib/dbSeed';
import Catalog from '@/components/Catalog';
import { Metadata } from 'next';

// ISR (Incremental Static Regeneration): Vercel sirve la página desde Edge CDN en <100ms
// y se revalida automáticamente en segundo plano o al editar/crear productos desde el admin.
export const revalidate = 30;

// Configuración dinámica de SEO y Metadatos OpenGraph (genera preview con foto para WhatsApp)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const productId = typeof params?.p === 'string' ? params.p : undefined;
  const varietyStr = typeof params?.v === 'string' ? params.v : undefined;
  const vIdx = varietyStr ? parseInt(varietyStr, 10) || 0 : 0;

  if (productId) {
    try {
      const { seedDatabase } = await import('@/lib/dbSeed');
      const { productos, currency } = await seedDatabase();
      const product = productos.find((item: any) => item._id === productId);

      if (product) {
        const symbol = currency === 'EUR' ? '€' : '$';
        const prodImg = product.images?.[vIdx] || product.images?.[0];
        const imgUrl = (prodImg && (prodImg.startsWith('http://') || prodImg.startsWith('https://')) && !prodImg.startsWith('data:'))
          ? prodImg
          : `/api/product-image?id=${encodeURIComponent(productId)}&v=${vIdx}`;

        return {
          title: `${product.name} - Home and Toys Tío Willy`,
          description: `Consulta por ${product.name}. Precio al detal: ${symbol}${product.priceDetal.toFixed(2)}, precio al mayor: ${symbol}${product.priceMayor.toFixed(2)}.`,
          openGraph: {
            title: `${product.name} - Home and Toys Tío Willy`,
            description: product.description || `Catálogo exclusivo de Home and Toys Tío Willy.`,
            type: 'website',
            images: [
              {
                url: imgUrl,
                width: 800,
                height: 800,
                alt: product.name,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: `${product.name} - Home and Toys Tío Willy`,
            description: product.description || `Catálogo de Home and Toys Tío Willy.`,
            images: [imgUrl],
          },
        };
      }
    } catch {}
  }

  return {
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
          url: '/images/logo.jpg',
          width: 800,
          height: 800,
          alt: 'Home and Toys Tío Willy Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Home and Toys Tío Willy - Catálogo Premium',
      description: 'Explora nuestro catálogo exclusivo de productos para el hogar, juguetes y tecnología.',
      images: ['/images/logo.jpg'],
    },
  };
}

export default async function Home() {
  // Intentar sembrar y obtener los datos de la base de datos (con fallback automático)
  const { productos, categorias, mapUrl, currency, isFallback } = await seedDatabase();

  return (
    <>
      {/* Mensaje sutil en consola del servidor para depuración */}
      {isFallback && (
        <span className="hidden">Cargado con datos locales de respaldo</span>
      )}
      
      {/* Componente de catálogo interactivo */}
      <Catalog initialProductos={productos} initialCategorias={categorias} mapUrl={mapUrl} currency={currency || 'USD'} />
    </>
  );
}
