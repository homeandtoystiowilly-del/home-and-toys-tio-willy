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

// Función auxiliar para normalizar respuestas de seguridad (sin tildes, minúsculas, sin espacios extras)
function normalizeAnswer(ans: string): string {
  return (ans || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Acción para verificar la contraseña y crear la sesión del administrador
export async function verifyPasswordAction(password: string) {
  const defaultPassword = process.env.ADMIN_PASSWORD || 'adminwilly';
  let validPassword = defaultPassword;

  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const secDoc = await (db.collection('configuracion') as any).findOne({ _id: 'seguridad' });
    if (secDoc && secDoc.password) {
      validPassword = secDoc.password;
    }
  } catch (err) {
    console.warn('No se pudo verificar contraseña en BD, usando respaldo:', err);
  }

  if (password === validPassword) {
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

// Acción para obtener la pregunta de seguridad configurada (sin revelar la respuesta)
export async function getSecurityQuestionAction() {
  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const secDoc = await (db.collection('configuracion') as any).findOne({ _id: 'seguridad' });

    if (secDoc && secDoc.securityQuestion) {
      return { 
        success: true, 
        hasSecurityQuestion: true, 
        question: secDoc.securityQuestion 
      };
    }

    return { 
      success: true, 
      hasSecurityQuestion: false, 
      question: '¿Cuál es la clave maestra de respaldo de la tienda?' 
    };
  } catch (err: any) {
    console.error('Error al obtener pregunta de seguridad:', err);
    return { 
      success: false, 
      hasSecurityQuestion: false, 
      question: '¿Cuál es la clave maestra de respaldo de la tienda?',
      error: 'Error al conectar con la base de datos' 
    };
  }
}

// Acción para recuperar la contraseña respondiendo a la pregunta de seguridad
export async function recoverPasswordAction(answer: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const secDoc = await (db.collection('configuracion') as any).findOne({ _id: 'seguridad' });

    const normalizedInput = normalizeAnswer(answer);
    let isAnswerCorrect = false;

    if (secDoc && secDoc.securityAnswer) {
      isAnswerCorrect = normalizedInput === secDoc.securityAnswer;
    } else {
      // Fallback si no ha configurado respuesta aún: clave por defecto o 'adminwilly'
      const defaultPassword = process.env.ADMIN_PASSWORD || 'adminwilly';
      isAnswerCorrect = normalizedInput === normalizeAnswer(defaultPassword);
    }

    if (!isAnswerCorrect) {
      return { success: false, error: 'La respuesta de seguridad es incorrecta.' };
    }

    // Actualizar contraseña en MongoDB
    await (db.collection('configuracion') as any).updateOne(
      { _id: 'seguridad' },
      { 
        $set: { 
          password: newPassword.trim(),
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    // Iniciar sesión automáticamente
    const token = generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

    return { success: true, message: 'Contraseña restablecida con éxito.' };
  } catch (err: any) {
    console.error('Error al recuperar contraseña:', err);
    return { success: false, error: getFriendlyError(err, 'Error al restablecer la contraseña.') };
  }
}

// Acción para actualizar contraseña y pregunta de seguridad desde el panel de admin
export async function updateSecurityConfigAction(formData: FormData) {
  try {
    // 1. Validar autenticación
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' };
    }

    const currentPassword = (formData.get('currentPassword') as string) || '';
    const newPassword = (formData.get('newPassword') as string) || '';
    const securityQuestion = (formData.get('securityQuestion') as string) || '';
    const securityAnswer = (formData.get('securityAnswer') as string) || '';

    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const secDoc = await (db.collection('configuracion') as any).findOne({ _id: 'seguridad' });

    const activePassword = (secDoc && secDoc.password) ? secDoc.password : (process.env.ADMIN_PASSWORD || 'adminwilly');

    if (currentPassword !== activePassword) {
      return { success: false, error: 'La contraseña actual no es correcta.' };
    }

    const updateFields: any = {
      updatedAt: new Date()
    };

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 4) {
        return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
      }
      updateFields.password = newPassword.trim();
    }

    if (securityQuestion && securityQuestion.trim().length > 0) {
      updateFields.securityQuestion = securityQuestion.trim();
    }

    if (securityAnswer && securityAnswer.trim().length > 0) {
      updateFields.securityAnswer = normalizeAnswer(securityAnswer);
    }

    const autoLockRaw = formData.get('autoLockSeconds');
    if (autoLockRaw !== null && autoLockRaw !== undefined) {
      const lockSeconds = Math.max(0, Math.floor(Number(autoLockRaw) || 0));
      updateFields.autoLockSeconds = lockSeconds;
    }

    await (db.collection('configuracion') as any).updateOne(
      { _id: 'seguridad' },
      { $set: updateFields },
      { upsert: true }
    );

    revalidatePath('/admin');
    return { success: true, message: 'Configuración de seguridad actualizada correctamente.' };
  } catch (err: any) {
    console.error('Error al actualizar configuración de seguridad:', err);
    return { success: false, error: getFriendlyError(err, 'Error al actualizar seguridad.') };
  }
}

// Acción para actualizar el tiempo de bloqueo automático por inactividad
export async function updateAutoLockAction(seconds: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' };
    }

    const lockSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    await (db.collection('configuracion') as any).updateOne(
      { _id: 'seguridad' },
      { 
        $set: { 
          autoLockSeconds: lockSeconds,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    revalidatePath('/admin');
    let friendlyDuration = `${lockSeconds} segundos`;
    if (lockSeconds === 60) friendlyDuration = '1 minuto';
    else if (lockSeconds === 90) friendlyDuration = '1 minuto y medio';
    else if (lockSeconds >= 60) friendlyDuration = `${lockSeconds / 60} minutos`;

    return { 
      success: true, 
      seconds: lockSeconds,
      message: lockSeconds === 0 
        ? 'Bloqueo automático desactivado.' 
        : `Bloqueo automático configurado a ${friendlyDuration}.`
    };
  } catch (err: any) {
    console.error('Error al actualizar tiempo de bloqueo:', err);
    return { success: false, error: getFriendlyError(err, 'Error al actualizar tiempo de bloqueo.') };
  }
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
    const isOffer = formData.get('isOffer') === 'true';
    const offerPriceRaw = formData.get('offerPrice') as string;
    const offerPrice = offerPriceRaw && !isNaN(parseFloat(offerPriceRaw)) ? parseFloat(offerPriceRaw) : undefined;

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
      isOffer: isOffer || false,
      offerPrice: isOffer && offerPrice ? offerPrice : undefined,
      status: 'active',
      pausedVarieties: [],
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

// Acción para crear una subcategoría dentro de una categoría
export async function createSubcategoryAction(categoryId: string, subcategoryName: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' };
    }

    const trimmedName = subcategoryName ? subcategoryName.trim() : '';
    if (!trimmedName) {
      return { success: false, error: 'El nombre de la subcategoría no puede estar vacío.' };
    }

    if (!categoryId) {
      return { success: false, error: 'ID de categoría no especificado.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    // Añadir al conjunto de subcategorías sin duplicados
    await (db.collection('categorias') as any).updateOne(
      { _id: categoryId },
      { $addToSet: { subcategories: trimmedName } }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: `Subcategoría "${trimmedName}" agregada con éxito.` };
  } catch (error: any) {
    console.error('Error al crear subcategoría:', error);
    return { success: false, error: getFriendlyError(error, 'Error al guardar la subcategoría.') };
  }
}

// Acción para eliminar una subcategoría de una categoría
export async function deleteSubcategoryAction(categoryId: string, subcategoryName: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' };
    }

    const trimmedName = subcategoryName ? subcategoryName.trim() : '';
    if (!trimmedName || !categoryId) {
      return { success: false, error: 'Parámetros inválidos para eliminar la subcategoría.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    // Remover la subcategoría de la categoría
    const catDoc = await (db.collection('categorias') as any).findOne({ _id: categoryId });
    if (catDoc && Array.isArray(catDoc.subcategories)) {
      const remaining = catDoc.subcategories.filter((s: string) => s && s.toLowerCase() !== trimmedName.toLowerCase());
      await (db.collection('categorias') as any).updateOne(
        { _id: categoryId },
        { $set: { subcategories: remaining } }
      );
    } else {
      await (db.collection('categorias') as any).updateOne(
        { _id: categoryId },
        { $pull: { subcategories: trimmedName } }
      );
    }

    // Desvincular de los productos asociados a esta categoría y subcategoría
    await db.collection('productos').updateMany(
      { 
        category: categoryId, 
        subcategory: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      },
      { $unset: { subcategory: '' } }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: `Subcategoría "${trimmedName}" eliminada con éxito.` };
  } catch (error: any) {
    console.error('Error al eliminar subcategoría:', error);
    return { success: false, error: getFriendlyError(error, 'Error al eliminar la subcategoría.') };
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

    if (isNaN(priceDetal) || isNaN(priceMayor) || priceDetal < 0 || priceMayor < 0) {
      return { success: false, error: 'Precios inválidos. Deben ser valores numéricos mayores o iguales a cero.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const queryId = ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : id;
    let res = await db.collection('productos').updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          priceDetal: Number(priceDetal), 
          priceMayor: Number(priceMayor),
          updatedAt: new Date()
        } 
      }
    );

    if (res.matchedCount === 0 && typeof queryId !== 'string') {
      res = await db.collection('productos').updateOne(
        { _id: id as any },
        { 
          $set: { 
            priceDetal: Number(priceDetal), 
            priceMayor: Number(priceMayor),
            updatedAt: new Date()
          } 
        }
      );
    }

    if (res.matchedCount === 0) {
      return { success: false, error: 'Producto no encontrado en la base de datos.' };
    }

    revalidatePath('/');
    revalidatePath('/admin');

    return { 
      success: true, 
      message: 'Precios actualizados con éxito.',
      priceDetal: Number(priceDetal),
      priceMayor: Number(priceMayor)
    };
  } catch (error: any) {
    console.error('Error al actualizar precios:', error);
    return { success: false, error: getFriendlyError(error, 'Error al actualizar precios.') };
  }
}

// Acción para actualizar la subcategoría de un producto directamente
export async function updateProductSubcategoryAction(id: string, subcategory: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!verifySessionToken(session)) {
      return { success: false, error: 'No autorizado.' };
    }

    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    const cleanSubcat = (subcategory || '').trim();
    const queryId = ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : id;
    await db.collection('productos').updateOne(
      { _id: queryId as any },
      { 
        $set: { 
          subcategory: cleanSubcat
        } 
      }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true, message: 'Subcategoría actualizada.' };
  } catch (error: any) {
    console.error('Error al actualizar subcategoría:', error);
    return { success: false, error: getFriendlyError(error, 'Error al actualizar subcategoría.') };
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
    const isOffer = formData.get('isOffer') === 'true';
    const offerPriceRaw = formData.get('offerPrice') as string;
    const offerPrice = offerPriceRaw && !isNaN(parseFloat(offerPriceRaw)) ? parseFloat(offerPriceRaw) : undefined;

    const existingProduct = await db.collection('productos').findOne({ _id: queryId as any });
    const pausedVarietiesRaw = formData.get('pausedVarieties') as string;
    let finalPausedVarieties: string[] = [];
    if (pausedVarietiesRaw) {
      try {
        finalPausedVarieties = JSON.parse(pausedVarietiesRaw).filter((v: string) => varieties.includes(v));
      } catch {
        finalPausedVarieties = [];
      }
    } else if (existingProduct && Array.isArray(existingProduct.pausedVarieties)) {
      finalPausedVarieties = existingProduct.pausedVarieties.filter((v: string) => varieties.includes(v));
    }

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
          isOffer: isOffer || false,
          offerPrice: isOffer && offerPrice ? offerPrice : undefined,
          pausedVarieties: finalPausedVarieties,
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

// Acción ligera para registrar visitas y clics de WhatsApp (Cero autenticación requerida)
export async function trackEventAction(type: 'visit' | 'whatsapp_click', productId?: string) {
  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');

    if (type === 'visit') {
      await (db.collection('metricas') as any).updateOne(
        { _id: 'general' },
        { $inc: { visitas: 1 } },
        { upsert: true }
      );
    } else if (type === 'whatsapp_click') {
      await (db.collection('metricas') as any).updateOne(
        { _id: 'general' },
        { $inc: { whatsapp: 1 } },
        { upsert: true }
      );

      if (productId) {
        const queryId = ObjectId.isValid(productId) && productId.length === 24 ? new ObjectId(productId) : productId;
        await (db.collection('productos') as any).updateOne(
          { _id: queryId as any },
          { $inc: { clicks: 1 } }
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false };
  }
}

export async function toggleProductStatusAction(
  productId: string,
  status: 'active' | 'paused'
): Promise<{ success: boolean; error?: string; message?: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  if (!verifySessionToken(session)) {
    return { success: false, error: 'No autorizado. La sesión ha expirado.' };
  }

  if (!productId) {
    return { success: false, error: 'ID de producto no válido.' };
  }

  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const queryId = ObjectId.isValid(productId) && productId.length === 24 ? new ObjectId(productId) : productId;

    await db.collection('productos').updateOne(
      { _id: queryId as any },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { 
      success: true, 
      message: status === 'paused' 
        ? 'Publicación pausada (oculta de la tienda).' 
        : 'Publicación reanudada (visible en la tienda).' 
    };
  } catch (error: any) {
    console.error('Error al cambiar el estado del producto:', error);
    return { success: false, error: getFriendlyError(error, 'Error interno al cambiar el estado del producto.') };
  }
}

export async function toggleProductVarietyStatusAction(
  productId: string,
  varietyName: string
): Promise<{ success: boolean; error?: string; pausedVarieties?: string[]; message?: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  if (!verifySessionToken(session)) {
    return { success: false, error: 'No autorizado. La sesión ha expirado.' };
  }

  if (!productId || !varietyName) {
    return { success: false, error: 'ID de producto o nombre de variedad no válido.' };
  }

  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const queryId = ObjectId.isValid(productId) && productId.length === 24 ? new ObjectId(productId) : productId;

    const prod = await db.collection('productos').findOne({ _id: queryId as any });
    if (!prod) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    const currentPaused: string[] = Array.isArray(prod.pausedVarieties) ? prod.pausedVarieties : [];
    let updatedPaused: string[];

    if (currentPaused.includes(varietyName)) {
      // Si ya estaba en la lista de pausadas, se reactiva (se quita)
      updatedPaused = currentPaused.filter((v: string) => v !== varietyName);
    } else {
      // Se agrega a la lista de pausadas (se agota)
      updatedPaused = [...currentPaused, varietyName];
    }

    await db.collection('productos').updateOne(
      { _id: queryId as any },
      {
        $set: {
          pausedVarieties: updatedPaused,
          updatedAt: new Date()
        }
      }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    const isNowPaused = updatedPaused.includes(varietyName);
    return {
      success: true,
      pausedVarieties: updatedPaused,
      message: isNowPaused
        ? `Variedad "${varietyName}" marcada como agotada.`
        : `Variedad "${varietyName}" reactivada con éxito.`
    };
  } catch (error: any) {
    console.error('Error al cambiar estado de la variedad:', error);
    return { success: false, error: getFriendlyError(error, 'Error al actualizar la disponibilidad de la variedad.') };
  }
}
