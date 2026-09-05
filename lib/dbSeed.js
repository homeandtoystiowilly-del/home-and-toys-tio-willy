import clientPromise from './stitch';

const MOCK_CATEGORIAS = [
  { _id: 'juguetes', name: 'Juguetes y Diversión' },
  { _id: 'hogar', name: 'Hogar y Decoración' },
  { _id: 'tecnologia', name: 'Tecnología y Gadgets' }
];

const MOCK_PRODUCTOS = [
  {
    _id: 'prod_1',
    name: 'Silla Gamer Ergonómica Tío Willy',
    description: 'Silla ergonómica de alto rendimiento con soporte lumbar, cojines ajustables y reclinación completa. Perfecta para largas jornadas de juego o trabajo.',
    category: 'hogar',
    priceDetal: 180.00,
    priceMayor: 145.00,
    minMayor: 3,
    images: ['/images/chair_red.jpg', '/images/chair_blue.jpg'],
    varieties: ['Rojo y Negro', 'Azul y Negro'],
    currency: 'USD'
  },
  {
    _id: 'prod_2',
    name: 'Auriculares Inalámbricos Pro',
    description: 'Auriculares inalámbricos con cancelación activa de ruido (ANC), sonido Hi-Fi de alta resolución y batería de hasta 40 horas de duración con carga rápida.',
    category: 'tecnologia',
    priceDetal: 75.00,
    priceMayor: 55.00,
    minMayor: 5,
    images: ['/images/headphones_black.jpg', '/images/headphones_red.jpg'],
    varieties: ['Negro Mate', 'Rojo Carmín'],
    currency: 'USD'
  },
  {
    _id: 'prod_3',
    name: 'Juguete Robot Interactivo Smarty',
    description: 'Robot inteligente educativo para niños. Canta, baila, responde a comandos de voz sencillos y enseña conceptos básicos de programación y lógica.',
    category: 'juguetes',
    priceDetal: 45.00,
    priceMayor: 32.00,
    minMayor: 6,
    images: ['/images/robot_red.jpg', '/images/robot_blue.jpg'],
    varieties: ['Rojo Metálico', 'Azul Eléctrico'],
    currency: 'USD'
  },
  {
    _id: 'prod_4',
    name: 'Lámpara de Escritorio LED Smart',
    description: 'Lámpara de diseño minimalista con regulación de brillo táctil, 5 temperaturas de color, temporizador de apagado y base con cargador inalámbrico Qi.',
    category: 'hogar',
    priceDetal: 35.00,
    priceMayor: 24.99,
    minMayor: 4,
    images: ['/images/chair_blue.jpg', '/images/chair_red.jpg'],
    varieties: ['Negro Minimalista', 'Blanco Glaciar'],
    currency: 'USD'
  },
  {
    _id: 'prod_5',
    name: 'Teclado Mecánico RGB Compacto',
    description: 'Teclado mecánico con formato 60%, switches mecánicos silenciosos y retroiluminación RGB configurable con múltiples modos dinámicos de luz.',
    category: 'tecnologia',
    priceDetal: 65.00,
    priceMayor: 48.00,
    minMayor: 3,
    images: ['/images/headphones_black.jpg', '/images/headphones_red.jpg'],
    varieties: ['Negro Nocturno', 'Gris Espacial'],
    currency: 'USD'
  }
];

export async function seedDatabase() {
  const fallbackResult = {
    categorias: MOCK_CATEGORIAS,
    productos: MOCK_PRODUCTOS,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve',
    currency: 'USD',
    isFallback: true
  };

  const dbFetchPromise = (async () => {
    try {
      // Intentar conectar con la base de datos
      const client = await clientPromise;
      const db = client.db('tio_willy_db');

      // Retornar los datos cargados desde la base de datos y configuraciones en un solo paso paralelo (1 sola ronda de red)
      let [categorias, productos, configDoc, currencyDoc] = await Promise.all([
        db.collection('categorias').find({}).toArray(),
        db.collection('productos').find({}).toArray(),
        db.collection('configuracion').findOne({ _id: 'mapa' }),
        db.collection('configuracion').findOne({ _id: 'moneda' })
      ]);

      // Sembrar categorías si la colección está vacía (solo ocurre en el primer inicio)
      if (categorias.length === 0) {
        console.log('Sembrando categorías iniciales en la base de datos...');
        await db.collection('categorias').insertMany(MOCK_CATEGORIAS);
        categorias = await db.collection('categorias').find({}).toArray();
      }

      // Sembrar productos si la colección está vacía (solo ocurre en el primer inicio)
      if (productos.length === 0) {
        console.log('Sembrando productos iniciales en la base de datos...');
        await db.collection('productos').insertMany(MOCK_PRODUCTOS);
        productos = await db.collection('productos').find({}).toArray();
      }

      // Procesar la configuración del mapa
      let mapUrl = 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve';
      if (configDoc && configDoc.url) {
        mapUrl = configDoc.url;
      } else {
        // Guardar de forma asíncrona no bloqueante
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
        // Guardar de forma asíncrona no bloqueante
        db.collection('configuracion').updateOne(
          { _id: 'moneda' },
          { $set: { value: currency } },
          { upsert: true }
        ).catch((err) => console.warn('Error al sembrar moneda por defecto:', err.message));
      }

      return {
        categorias: JSON.parse(JSON.stringify(categorias)),
        productos: JSON.parse(JSON.stringify(productos)),
        mapUrl,
        currency,
        isFallback: false
      };
    } catch (error) {
      console.warn(
        'Aviso: No se pudo conectar a MongoDB. Usando datos locales de respaldo (fallback). Detalle:',
        error.message
      );
      return fallbackResult;
    }
  })();

  // Timeout de seguridad de 2.0 segundos para no colgar la renderización bajo ninguna circunstancia
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.warn('Timeout de 2s alcanzado al conectar a MongoDB. Sirviendo fallback local instantáneo.');
      resolve(fallbackResult);
    }, 2000);
  });

  return Promise.race([dbFetchPromise, timeoutPromise]);
}
