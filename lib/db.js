import clientPromise from './stitch';

export async function getProductos() {
  const client = await clientPromise;
  const db = client.db('tio_willy_db'); // Asegúrate de usar el nombre de tu base de datos
  const productos = await db.collection('productos').find({}).toArray();
  return JSON.parse(JSON.stringify(productos));
}

export async function getCategorias() {
  const client = await clientPromise;
  const db = client.db('tio_willy_db');
  const categorias = await db.collection('categorias').find({}).toArray();
  return JSON.parse(JSON.stringify(categorias));
}

// Aquí agregaremos luego las funciones para crear, editar y eliminar desde el admin
