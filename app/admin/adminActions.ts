'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '@/lib/stitch';
import { ObjectId } from 'mongodb';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DB_ERROR_FRIENDLY = 'No se pudo conectar a la base de datos MongoDB. Asegúrate de configurar la variable de entorno STITCH_DB_URI en tu panel de control de Vercel con tu cadena de conexión real.';

function getFriendlyError(error: any, defaultMsg: string) {
  const errMsg = error?.message || '';
  if (errMsg.includes('STITCH_DB_URI') || errMsg.includes('ConnectionString') || errMsg.includes('scheme') || errMsg.includes('MongoParseError') || errMsg.includes('connect')) {
    return DB_ERROR_FRIENDLY;
  }
  return errMsg || defaultMsg;
}

// Acción para verificar la contraseña y crear la sesión del administrador
export async function verifyPasswordAction(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminwilly';

  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'session_active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 día
      path: '/'
    });
    return { success: true };
  }

  return { success: false, error: 'Contraseña incorrecta' };
}

// Acción para cerrar sesión
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return { success: true };
}

// Acción para guardar el producto en la base de datos de MongoDB
export async function createProductAction(formData: FormData) {
  try {
    // 1. Validar autenticación
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (session !== 'session_active') {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' };
    }

    // 2. Extraer datos del formulario
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    let category = formData.get('category') as string;
    const isNewCategory = formData.get('isNewCategory') === 'true';
    const newCategoryName = formData.get('newCategoryName') as string;
    const priceDetal = parseFloat(formData.get('priceDetal') as string);
    const priceMayor = parseFloat(formData.get('priceMayor') as string);
    const minMayor = parseInt(formData.get('minMayor') as string);
    
    // Variedades (separadas por comas)
    const varietiesRaw = formData.get('varieties') as string;
    const varieties = varietiesRaw 
      ? varietiesRaw.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
      : ['Estándar'];

    const imageFiles = formData.getAll('images') as File[];

    if (isNewCategory && (!newCategoryName || newCategoryName.trim().length === 0)) {
      return { success: false, error: 'Por favor, escriba el nombre de la nueva categoría.' };
    }

    if (!name || !description || (!category && !isNewCategory) || isNaN(priceDetal) || isNaN(priceMayor) || isNaN(minMayor)) {
      return { success: false, error: 'Por favor rellene todos los campos obligatorios con valores válidos.' };
    }

    // 3. Procesar las imágenes (Subida a Cloudinary o Fallback de desarrollo)
    const uploadedUrls: string[] = [];
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'tu_cloud_name' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'tu_api_key';

    let usingFallbackImages = false;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file && file.size > 0) {
        if (isCloudinaryConfigured) {
          // Subida real a Cloudinary
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'tio_willy_catalogo' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
          uploadedUrls.push(result.secure_url);
        } else {
          usingFallbackImages = true;
        }
      }
    }

    // Si no se configuró Cloudinary o no se subieron imágenes válidas, usamos imágenes locales de mockup según la categoría
    if (uploadedUrls.length === 0) {
      usingFallbackImages = true;
      if (category === 'juguetes') {
        uploadedUrls.push('/images/robot_red.jpg', '/images/robot_blue.jpg');
      } else if (category === 'tecnologia') {
        uploadedUrls.push('/images/headphones_black.jpg', '/images/headphones_red.jpg');
      } else {
        // hogar u otros
        uploadedUrls.push('/images/chair_red.jpg', '/images/chair_blue.jpg');
      }
    }

    // Asegurar que el número de imágenes coincida con el número de variedades
    // Si hay más variedades que imágenes, rellenar con la primera imagen
    const finalImages: string[] = [];
    for (let i = 0; i < varieties.length; i++) {
      finalImages.push(uploadedUrls[i] || uploadedUrls[0]);
    }

    // 4. Guardar en MongoDB
    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    if (isNewCategory) {
      const newCategoryId = newCategoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
      const existingCategory = await (db.collection('categorias') as any).findOne({ _id: newCategoryId });
      if (!existingCategory) {
        await (db.collection('categorias') as any).insertOne({
          _id: newCategoryId,
          name: newCategoryName.trim()
        });
      }
      category = newCategoryId;
    }

    const newProduct = {
      name,
      description,
      category,
      priceDetal,
      priceMayor,
      minMayor,
      images: finalImages,
      varieties,
      createdAt: new Date()
    };

    const insertResult = await db.collection('productos').insertOne(newProduct);

    // 5. Revalidar la página principal
    revalidatePath('/');

    return { 
      success: true, 
      productId: insertResult.insertedId.toString(),
      message: usingFallbackImages 
        ? 'Producto guardado con éxito. Nota: Se usaron imágenes de prueba porque las credenciales de Cloudinary no están configuradas.'
        : 'Producto guardado y publicado con éxito.'
    };

  } catch (error: any) {
    console.error('Error al guardar el producto:', error);
    return { success: false, error: getFriendlyError(error, 'Error interno del servidor al crear el producto.') };
  }
}

// Acción para crear una categoría manualmente
export async function createCategoryAction(name: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (session !== 'session_active') {
      return { success: false, error: 'No autorizado.' };
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'El nombre de la categoría no puede estar vacío.' };
    }

    const newCategoryId = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    
    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const existingCategory = await (db.collection('categorias') as any).findOne({ _id: newCategoryId });
    if (existingCategory) {
      return { success: false, error: 'La categoría ya existe.' };
    }

    await (db.collection('categorias') as any).insertOne({
      _id: newCategoryId,
      name: name.trim()
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, categoryId: newCategoryId, message: 'Categoría agregada con éxito.' };
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return { success: false, error: getFriendlyError(error, 'Error al guardar la categoría.') };
  }
}

// Acción para eliminar una categoría
export async function deleteCategoryAction(id: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (session !== 'session_active') {
      return { success: false, error: 'No autorizado.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    // Eliminar la categoría
    await (db.collection('categorias') as any).deleteOne({ _id: id });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Categoría eliminada con éxito.' };
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    return { success: false, error: getFriendlyError(error, 'Error al eliminar la categoría.') };
  }
}

// Acción para eliminar un producto
export async function deleteProductAction(id: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (session !== 'session_active') {
      return { success: false, error: 'No autorizado.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    await db.collection('productos').deleteOne({ _id: new ObjectId(id) });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Producto eliminado con éxito.' };
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return { success: false, error: getFriendlyError(error, 'Error al eliminar el producto.') };
  }
}

// Acción para actualizar los precios de un producto de forma in-line
export async function updateProductPricesAction(id: string, priceDetal: number, priceMayor: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (session !== 'session_active') {
      return { success: false, error: 'No autorizado.' };
    }

    if (isNaN(priceDetal) || isNaN(priceMayor)) {
      return { success: false, error: 'Precios inválidos.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    await db.collection('productos').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          priceDetal: priceDetal, 
          priceMayor: priceMayor 
        } 
      }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Precios actualizados con éxito.' };
  } catch (error: any) {
    console.error('Error al actualizar precios:', error);
    return { success: false, error: getFriendlyError(error, 'Error al actualizar precios.') };
  }
}
