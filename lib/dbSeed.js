import clientPromise from './stitch';
import initialData from './initialData.json';

const REAL_CATEGORIAS = initialData.cleanSeedCategorias;
const REAL_PRODUCTOS = initialData.cleanSeedProductos;

export async function seedDatabase() {
  const fallbackResult = {
    categorias: REAL_CATEGORIAS,
    productos: REAL_PRODUCTOS,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve',
    currency: 'USD',
    isFallback: true
  };

  const dbFetchPromise = (async () => {
    try {
      // Intentar conectar con la base de datos MongoDB Atlas
      const client = await clientPromise;
      const db = client.db('tio_willy_db');

      // OPTIMIZACIÓN ULTRA-RÁPIDA (1.4s en vez de 36s):
      // No transferir los 25 MB de Base64 por la red.
      // Proyectamos todos los campos del producto (incluyendo subcategorías, ofertas, rines, etc.)
      // y convertimos las imágenes a URLs servidas bajo demanda por el CDN de Vercel.
      const productPipeline = [
        {
          $project: {
            name: 1,
            description: 1,
            category: 1,
            subcategory: 1,
            priceDetal: 1,
            priceMayor: 1,
            minMayor: 1,
            varieties: 1,
            currency: 1,
            isOffer: 1,
            offerPrice: 1,
            clicks: 1,
            status: 1,
            pausedVarieties: 1,
            createdAt: 1,
            updatedAt: 1,
            imageCount: { $size: { $ifNull: ['$images', []] } }
          }
        }
      ];

      let [categorias, productos, configDoc, currencyDoc] = await Promise.all([
        db.collection('categorias').find({}).toArray(),
        db.collection('productos').aggregate(productPipeline).toArray(),
        db.collection('configuracion').findOne({ _id: 'mapa' }),
        db.collection('configuracion').findOne({ _id: 'moneda' })
      ]);

      // Si la base de datos estuviera vacía, sembramos el catálogo real
      if (!categorias || categorias.length === 0) {
        console.log('Sembrando categorías en la base de datos...');
        await db.collection('categorias').insertMany(REAL_CATEGORIAS);
        categorias = await db.collection('categorias').find({}).toArray();
      }

      if (!productos || productos.length === 0) {
        console.log('Sembrando productos en la base de datos...');
        await db.collection('productos').insertMany(REAL_PRODUCTOS);
        productos = await db.collection('productos').aggregate(productPipeline).toArray();
      }

      // Procesar la configuración del mapa
      let mapUrl = 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve';
      if (configDoc && configDoc.url) {
        mapUrl = configDoc.url;
      } else {
        db.collection('configuracion').updateOne(
          { _id: 'mapa' },
          { $set: { url: mapUrl } },
          { upsert: true }
        ).catch((err) => console.warn('Error al sembrar mapa por defecto:', err.message));
      }

      // Procesar la configuración de moneda global
      let currency = 'USD';
      if (currencyDoc && currencyDoc.value) {
        currency = currencyDoc.value;
      } else {
        db.collection('configuracion').updateOne(
          { _id: 'moneda' },
          { $set: { value: currency } },
          { upsert: true }
        ).catch((err) => console.warn('Error al sembrar moneda por defecto:', err.message));
      }

      const rawCategorias = JSON.parse(JSON.stringify(categorias));

      // Mapear cada producto a sus endpoints livianos /api/product-image
      const optimizedProductos = productos.map((prod) => {
        const prodId = prod._id?.toString() || prod._id;
        const count = prod.imageCount || (Array.isArray(prod.images) ? prod.images.length : 1);
        const cleanImages = Array.from({ length: count }, (_, idx) => 
          `/api/product-image?id=${encodeURIComponent(prodId)}&v=${idx}`
        );
        return {
          ...prod,
          _id: prodId,
          images: cleanImages,
        };
      });

      return {
        categorias: rawCategorias,
        productos: optimizedProductos,
        mapUrl,
        currency,
        isFallback: false
      };
    } catch (error) {
      console.warn(
        'Aviso: Error o timeout al consultar MongoDB. Sirviendo catálogo seguro de respaldo:',
        error.message
      );
      return fallbackResult;
    }
  })();

  // Timeout de seguridad generoso de 12 segundos
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.warn('Timeout alcanzado al conectar a MongoDB. Sirviendo catálogo seguro de respaldo.');
      resolve(fallbackResult);
    }, 12000);
  });

  return Promise.race([dbFetchPromise, timeoutPromise]);
}
