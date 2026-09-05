import { MongoClient, MongoClientOptions } from 'mongodb';

// Reemplaza con tu URI de conexión o credenciales de Stitch/MongoDB Atlas
const URI = process.env.STITCH_DB_URI;

// Opciones de conexión ultra-rápidas para evitar cuelgues (Timeout estricto de 3.5s)
const OPTIONS: MongoClientOptions = {
  serverSelectionTimeoutMS: 3500, // Máximo 3.5 segundos para seleccionar servidor
  connectTimeoutMS: 3500,        // Máximo 3.5 segundos para conectar
  socketTimeoutMS: 5000,         // Máximo 5 segundos en operaciones de socket
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 15000
};

let clientPromise: Promise<MongoClient>;

// Validar que la cadena de conexión empiece con el esquema requerido por mongodb
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

  if (!globalWithMongo._mongoClientPromise) {
    try {
      const client = new MongoClient(URI, OPTIONS);
      globalWithMongo._mongoClientPromise = client.connect();
    } catch (error) {
      globalWithMongo._mongoClientPromise = Promise.reject(error);
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
}

export default clientPromise;
