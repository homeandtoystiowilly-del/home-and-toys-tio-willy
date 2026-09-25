import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache en servidor de 5 minutos

interface BcvData {
  usd: number;
  eur: number;
  dateText?: string;
  dateIso?: string;
  source: 'bcv-direct' | 'dolarapi-fallback';
}

function fetchBcvDirect(): Promise<BcvData> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.get(
      'https://www.bcv.org.ve',
      {
        agent,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        timeout: 6000,
      },
      (res) => {
        let html = '';
        res.on('data', (chunk) => (html += chunk));
        res.on('end', () => {
          try {
            const usdMatch = html.match(
              /id=["']dolar["'][\s\S]*?<strong[^>]*>\s*([0-9.,]+)\s*<\/strong>/i
            );
            const eurMatch = html.match(
              /id=["']euro["'][\s\S]*?<strong[^>]*>\s*([0-9.,]+)\s*<\/strong>/i
            );
            const dateMatch =
              html.match(
                /Fecha\s+Valor:\s*<span[^>]*content=["']([^"']+)["'][^>]*>([^<]+)<\/span>/i
              ) ||
              html.match(
                /<span[^>]*class=["'][^"']*date-display-single[^"']*["'][^>]*content=["']([^"']+)["'][^>]*>([^<]+)<\/span>/i
              );

            const parseNum = (str: string) => {
              if (!str) return null;
              return parseFloat(str.replace(/\./g, '').replace(',', '.'));
            };

            const usd = usdMatch ? parseNum(usdMatch[1]) : null;
            const eur = eurMatch ? parseNum(eurMatch[1]) : null;
            const dateIso = dateMatch ? dateMatch[1] : undefined;
            const dateText = dateMatch ? dateMatch[2].replace(/\s+/g, ' ').trim() : undefined;

            if (usd && eur && usd > 0 && eur > 0) {
              return resolve({
                usd,
                eur,
                dateText,
                dateIso,
                source: 'bcv-direct',
              });
            }

            reject(new Error('No se pudieron extraer las tasas del HTML del BCV'));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout al consultar bcv.org.ve'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function fetchDolarApiFallback(): Promise<BcvData> {
  const res = await fetch('https://ve.dolarapi.com/v1/cotizaciones', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DolarApi status: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) {
    const usdItem = data.find(
      (item) => item.moneda === 'USD' || (item.nombre && item.nombre.toLowerCase().includes('dólar'))
    );
    const eurItem = data.find(
      (item) => item.moneda === 'EUR' || (item.nombre && item.nombre.toLowerCase().includes('euro'))
    );

    if (usdItem?.promedio && eurItem?.promedio) {
      return {
        usd: usdItem.promedio,
        eur: eurItem.promedio,
        dateIso: usdItem.fechaActualizacion,
        source: 'dolarapi-fallback',
      };
    }
  }
  throw new Error('DolarApi no devolvió los datos requeridos');
}

export async function GET() {
  try {
    // 1. Intentar consulta directa a la web oficial del Banco Central de Venezuela
    try {
      const directData = await fetchBcvDirect();
      return NextResponse.json(
        {
          success: true,
          ...directData,
          updatedAt: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    } catch (directErr) {
      console.warn('[API /api/bcv] Falló consulta directa al BCV, usando fallback:', directErr);
    }

    // 2. Respaldo a DolarApi
    const fallbackData = await fetchDolarApiFallback();
    return NextResponse.json(
      {
        success: true,
        ...fallbackData,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/bcv] Fallaron todas las fuentes:', error);
    // 3. Fallback de contingencia con los valores del día
    return NextResponse.json(
      {
        success: false,
        usd: 855.6625,
        eur: 972.648677,
        dateText: '25 Septiembre 2026',
        source: 'hardcoded-contingency',
        updatedAt: new Date().toISOString(),
        error: error?.message || 'Error al obtener tasas',
      },
      { status: 200 }
    );
  }
}
