import { MongoClient, MongoClientOptions } from 'mongodb';

// Reemplaza con tu URI de conexión o credenciales de Stitch/MongoDB Atlas
const URI = process.env.STITCH_DB_URI;
const OPTIONS: MongoClientOptions = {};

let clientPromise: Promise<MongoClient>;

// Validar que la cadena de conexión empiece con el esquema requerido por de mongodb
const isValidUri = URI && (URI.startsWith('mongodb://') || URI.startsWith('mongodb+srv://'));

if (!isValidUri) {
  console.warn(
    'Advertencia: La variable STITCH_DB_URI no está configurada o no tiene un formato válido (debe iniciar con mongodb:// o mongodb+srv://). Se usarán datos de respaldo locales.'
  );
  clientPromise = Promise.reject(
    new Error('STITCH_DB_URI no configurado o esquema inválido.')
  );
} else {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClientPromise) {
      try {
        const client = new MongoClient(URI, OPTIONS);
        globalWithMongo._mongoClientPromise = client.connect();
      } catch (error) {
        globalWithMongo._mongoClientPromise = Promise.reject(error);
      }
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    try {
      const client = new MongoClient(URI, OPTIONS);
      clientPromise = client.connect();
    } catch (error) {
      clientPromise = Promise.reject(error);
    }
  }
}

export default clientPromise;
