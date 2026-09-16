import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/stitch';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const vStr = searchParams.get('v');
  const varietyIndex = vStr ? parseInt(vStr, 10) || 0 : 0;

  if (!id) {
    return NextResponse.redirect(new URL('/images/logo.jpg', request.url), 302);
  }

  let imageUrl: string | null = null;

  // 1. Buscar en la base de datos MongoDB
  try {
    const client = await clientPromise;
    const db = client.db('tio_willy_db');
    const collection = db.collection('productos');

    let prod: any = null;
    if (ObjectId.isValid(id)) {
      prod = await collection.findOne({ _id: new ObjectId(id) } as any);
    }
    if (!prod) {
      prod = await collection.findOne({ _id: id } as any);
    }

    if (prod && Array.isArray(prod.images) && prod.images.length > 0) {
      imageUrl = prod.images[varietyIndex] || prod.images[0];
    }
  } catch {
    // Si falla la BD, continuamos con el fallback
  }

  // 2. Si no se encontro en MongoDB o fallo la conexion, buscar en datos de respaldo
  if (!imageUrl) {
    try {
      const { seedDatabase } = await import('@/lib/dbSeed');
      const { productos } = await seedDatabase();
      const found = productos.find((p: any) => p._id === id);
      if (found && Array.isArray(found.images) && found.images.length > 0) {
        imageUrl = found.images[varietyIndex] || found.images[0];
      }
    } catch {}
  }

  // 3. Si aun no hay imagen, devolver el logo de la tienda como fallback
  if (!imageUrl) {
    return NextResponse.redirect(new URL('/images/logo.jpg', request.url), 302);
  }

  // Caso A: Imagen guardada como Base64 (data:image/...)
  if (imageUrl.startsWith('data:image/')) {
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    }
  }

  // Caso B: Imagen remota publica (ej. Cloudinary https://res.cloudinary.com/...)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return NextResponse.redirect(imageUrl, 302);
  }

  // Caso C: Ruta relativa local (ej. /images/chair_red.jpg)
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return NextResponse.redirect(new URL(cleanPath, request.url), 302);
}
