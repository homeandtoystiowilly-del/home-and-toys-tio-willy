'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '@/lib/stitch';
import { ObjectId } from 'mongodb';
import { verifySessionToken, generateSessionToken } from '@/lib/auth';

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
    const token = generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
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
    if (!verifySessionToken(session)) {
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
          // Si no está Cloudinary, convertimos la imagen a Base64 para guardarla directamente en MongoDB
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          uploadedUrls.push(dataUrl);
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

    // Asegurar que haya al menos tantas imágenes como variedades, sin recortar el exceso
    const finalImages: string[] = [...uploadedUrls];
    while (finalImages.length < varieties.length) {
      finalImages.push(uploadedUrls[0] || '/images/chair_red.jpg');
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

    const currency = (formData.get('currency') as string) || 'USD';
    const subcategory = (formData.get('subcategory') as string || '').trim();
    const featured = formData.get('featured') === 'true';

    const newProduct = {
      name,
      description,
      category,
      priceDetal,
      priceMayor,
      minMayor,
      images: finalImages,
      varieties,
      currency,
      subcategory: subcategory || undefined,
      featured,
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
    if (!verifySessionToken(session)) {
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
    if (!verifySessionToken(session)) {
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
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const queryId = ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : id;
    await db.collection('productos').deleteOne({ _id: queryId as any });

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
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado.' };
    }

    if (isNaN(priceDetal) || isNaN(priceMayor)) {
      return { success: false, error: 'Precios inválidos.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const queryId = ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : id;
    await db.collection('productos').updateOne(
      { _id: queryId as any },
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

// Acción para actualizar un producto existente
export async function updateProductAction(productId: string, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado.' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const priceDetal = parseFloat(formData.get('priceDetal') as string);
    const priceMayor = parseFloat(formData.get('priceMayor') as string);
    const minMayor = parseInt(formData.get('minMayor') as string, 10);
    
    const varietiesRaw = formData.get('varieties') as string;
    const varieties = varietiesRaw 
      ? varietiesRaw.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
      : ['Estándar'];

    const existingImagesRaw = formData.get('existingImages') as string;
    const existingImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : [];

    const imageFiles = formData.getAll('images') as File[];

    if (!productId) {
      return { success: false, error: 'ID de producto no proporcionado.' };
    }

    if (!name || !description || !category || isNaN(priceDetal) || isNaN(priceMayor) || isNaN(minMayor)) {
      return { success: false, error: 'Por favor rellene todos los campos obligatorios con valores válidos.' };
    }

    // Procesar las nuevas imágenes (Subida a Cloudinary o Fallback de desarrollo a Base64)
    const uploadedUrls: string[] = [];
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'tu_cloud_name' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'tu_api_key';

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file && file.size > 0) {
        if (isCloudinaryConfigured) {
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
          // Fallback a Base64
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          uploadedUrls.push(dataUrl);
        }
      }
    }

    // Combinar imágenes conservadas del producto con las nuevas subidas
    const mergedImages = [...existingImages, ...uploadedUrls];

    // Asegurar que haya al menos tantas imágenes como variedades, sin recortar el exceso
    const finalImages: string[] = [...mergedImages];
    while (finalImages.length < varieties.length) {
      finalImages.push(mergedImages[0] || '/images/chair_red.jpg');
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const queryId = ObjectId.isValid(productId) && productId.length === 24 ? new ObjectId(productId) : productId;

    const currency = (formData.get('currency') as string) || 'USD';
    const subcategory = (formData.get('subcategory') as string || '').trim();
    const featured = formData.get('featured') === 'true';

    await db.collection('productos').updateOne(
      { _id: queryId as any },
      {
        $set: {
          name,
          description,
          category,
          priceDetal,
          priceMayor,
          minMayor,
          images: finalImages,
          varieties,
          currency,
          subcategory: subcategory || undefined,
          featured,
          updatedAt: new Date()
        }
      }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Producto actualizado con éxito.' };
  } catch (error: any) {
    console.error('Error al actualizar el producto:', error);
    return { success: false, error: getFriendlyError(error, 'Error interno del servidor al actualizar el producto.') };
  }
}

// Helper para parsear cualquier enlace o coordenadas de Google Maps y convertirlo en un iframe de inserción seguro (output=embed)
function parseGoogleMapsUrl(inputUrl: string): string {
  const url = inputUrl.trim();

  // Caso 1: El usuario pegó el código iframe completo (ej: <iframe src="https://www.google.com/maps/embed... "></iframe>)
  if (url.includes('<iframe')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }

  // Caso 2: El usuario pegó una URL estándar con coordenadas (ej: https://www.google.com/maps/...@10.5061957,-66.913273,15z...)
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch && coordMatch[1] && coordMatch[2]) {
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d${coordMatch[2]}!3d${coordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve`;
  }

  // Caso 3: El usuario pegó coordenadas simples (ej: 10.5061957,-66.913273)
  const simpleCoordMatch = url.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (simpleCoordMatch && simpleCoordMatch[1] && simpleCoordMatch[2]) {
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d${simpleCoordMatch[2]}!3d${simpleCoordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve`;
  }

  // Caso 4: Si ya es un enlace de inserción de Google Maps o tiene output=embed, lo dejamos tal cual
  if (url.includes('/maps/embed') || url.includes('output=embed')) {
    return url;
  }

  // Caso 5: URL de Google Maps normal, intentamos convertirla agregando output=embed
  if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
    if (url.includes('q=')) {
      return url.includes('?') ? `${url}&output=embed` : `${url}?output=embed`;
    }
  }

  return url;
}

// Acción para actualizar la configuración de ubicación (Google Maps embed URL)
export async function updateMapUrlAction(url: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'Acceso no autorizado.' };
    }

    const formattedUrl = parseGoogleMapsUrl(url);

    if (!formattedUrl || !formattedUrl.startsWith('https://')) {
      return { success: false, error: 'Por favor, ingrese un enlace de inserción, dirección o coordenadas de Google Maps válidas.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    await (db.collection('configuracion') as any).updateOne(
      { _id: 'mapa' },
      { $set: { url: formattedUrl } },
      { upsert: true }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Ubicación de Google Maps actualizada con éxito.' };
  } catch (error: any) {
    console.error('Error al actualizar el enlace del mapa:', error);
    return { success: false, error: getFriendlyError(error, 'Error interno al actualizar la ubicación.') };
  }
}

// Acción para actualizar la moneda global en la configuración de la tienda
export async function updateGlobalCurrencyAction(currency: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'Acceso no autorizado.' };
    }

    if (currency !== 'USD' && currency !== 'EUR') {
      return { success: false, error: 'Moneda no soportada.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    await (db.collection('configuracion') as any).updateOne(
      { _id: 'moneda' },
      { $set: { value: currency } },
      { upsert: true }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: `Moneda global actualizada a ${currency === 'EUR' ? 'Euros (€)' : 'Dólares ($)'} con éxito.` };
  } catch (error: any) {
    console.error('Error al actualizar la moneda global:', error);
    return { success: false, error: getFriendlyError(error, 'Error al actualizar la moneda global.') };
  }
}
