/**
 * Servicio para consultar las Tasas Oficiales en Vivo del Banco Central de Venezuela (BCV)
 * Proporciona el tipo de cambio oficial para DÓLAR (USD) y EURO (EUR).
 * 
 * Prioridad de fuentes:
 * 1. Endpoint interno /api/bcv (Scraping directo en tiempo real desde la web oficial www.bcv.org.ve)
 * 2. ve.dolarapi.com/v1/cotizaciones (Respaldo en caso de caída temporal del portal del BCV)
 * 3. Endpoints de contingencia secundaria
 * 4. Caché inteligente en localStorage con bypass manual inmediato
 */

export interface BcvRates {
  usd: number;
  eur: number;
  usdDate?: string;
  eurDate?: string;
  dateText?: string;
  updatedAt: string;
  source?: string;
  isFallback?: boolean;
  fromCache?: boolean;
}

// Tasas oficiales vigentes publicadas por el BCV
export const DEFAULT_BCV_USD = 855.66;
export const DEFAULT_BCV_EUR = 972.65;

const STORAGE_KEY = 'tio_willy_bcv_rates_v2';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos de caché óptima

/**
 * Formatea un número al estándar monetario venezolano (ej. 855,66)
 */
export function formatBcvRate(rate?: number | null): string {
  const num = typeof rate === 'number' && !isNaN(rate) && rate > 0 ? rate : DEFAULT_BCV_USD;
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea la fecha de actualización de la tasa (ej. "25 Sep" o texto directo del BCV)
 */
export function formatBcvDate(isoOrText?: string): string {
  if (!isoOrText) return 'Hoy';

  // Si ya es un texto legible como "Viernes, 25 Septiembre 2026"
  if (isoOrText.toLowerCase().includes('septiembre') || isoOrText.toLowerCase().includes('octubre') || isoOrText.includes(',')) {
    // Extraer número de día y mes
    const clean = isoOrText.replace(/\s+/g, ' ').trim();
    const parts = clean.split(' ');
    if (parts.length >= 3) {
      // Tomar "25 Sep"
      return `${parts[1]} ${parts[2].slice(0, 3)}`;
    }
    return clean;
  }

  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) return 'Hoy';
    return d.toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Hoy';
  }
}

/**
 * Calcula el monto equivalente en Bolívares (Bs.)
 */
export function calculateBs(amountInCurrency: number, rate: number): string {
  const total = (amountInCurrency || 0) * (rate || 0);
  return formatBcvRate(total);
}

/**
 * Consulta las tasas oficiales de USD y EUR del BCV
 */
export async function fetchBcvRates(forceRefresh = false): Promise<BcvRates> {
  // 1. Revisar caché en localStorage si no se fuerza la recarga
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedRaw = localStorage.getItem(STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_DURATION_MS && cached.usd > 0 && cached.eur > 0) {
          return {
            usd: cached.usd,
            eur: cached.eur,
            usdDate: cached.usdDate,
            eurDate: cached.eurDate,
            dateText: cached.dateText,
            updatedAt: cached.updatedAt || new Date().toISOString(),
            source: cached.source || 'cache',
            isFallback: false,
            fromCache: true,
          };
        }
      }
    } catch (e) {
      console.warn('[BCV Service] Error al leer caché local:', e);
    }
  }

  // 2. Prioridad 1: Consultar endpoint interno /api/bcv (conexión directa con bcv.org.ve)
  if (typeof window !== 'undefined') {
    try {
      const url = forceRefresh ? `/api/bcv?t=${Date.now()}` : '/api/bcv';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (typeof data?.usd === 'number' && typeof data?.eur === 'number' && data.usd > 0 && data.eur > 0) {
          const rates: BcvRates = {
            usd: data.usd,
            eur: data.eur,
            usdDate: data.dateIso || data.dateText,
            eurDate: data.dateIso || data.dateText,
            dateText: data.dateText,
            updatedAt: data.updatedAt || new Date().toISOString(),
            source: data.source || 'bcv-direct',
            isFallback: false,
            fromCache: false,
          };

          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...rates, timestamp: Date.now() })
            );
          } catch {}

          return rates;
        }
      }
    } catch (err) {
      console.warn('[BCV Service] Falló consulta a /api/bcv, intentando dolarapi:', err);
    }
  }

  // 3. Prioridad 2: Fallback externo a DolarApi
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://ve.dolarapi.com/v1/cotizaciones', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const usdItem = data.find(
          (item) => item.moneda === 'USD' || (item.nombre && item.nombre.toLowerCase().includes('dólar'))
        );
        const eurItem = data.find(
          (item) => item.moneda === 'EUR' || (item.nombre && item.nombre.toLowerCase().includes('euro'))
        );

        const usdRate = usdItem && typeof usdItem.promedio === 'number' ? usdItem.promedio : null;
        const eurRate = eurItem && typeof eurItem.promedio === 'number' ? eurItem.promedio : null;

        if (usdRate && eurRate) {
          const rates: BcvRates = {
            usd: usdRate,
            eur: eurRate,
            usdDate: usdItem.fechaActualizacion,
            eurDate: eurItem.fechaActualizacion,
            updatedAt: new Date().toISOString(),
            source: 'dolarapi-fallback',
            isFallback: false,
            fromCache: false,
          };

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ...rates, timestamp: Date.now() })
              );
            } catch {}
          }

          return rates;
        }
      }
    }
  } catch (err) {
    console.warn('[BCV Service] Falló endpoint /cotizaciones:', err);
  }

  // 4. Prioridad 3: Respaldo a última caché válida
  if (typeof window !== 'undefined') {
    try {
      const staleRaw = localStorage.getItem(STORAGE_KEY);
      if (staleRaw) {
        const stale = JSON.parse(staleRaw);
        if (stale.usd > 0 && stale.eur > 0) {
          return {
            usd: stale.usd,
            eur: stale.eur,
            usdDate: stale.usdDate,
            eurDate: stale.eurDate,
            dateText: stale.dateText,
            updatedAt: stale.updatedAt || new Date().toISOString(),
            source: 'stale-cache',
            isFallback: true,
            fromCache: true,
          };
        }
      }
    } catch {}
  }

  // 5. Contingencia final garantizada con el tipo de cambio oficial del BCV
  return {
    usd: DEFAULT_BCV_USD,
    eur: DEFAULT_BCV_EUR,
    dateText: '25 Sep',
    updatedAt: new Date().toISOString(),
    source: 'hardcoded-contingency',
    isFallback: true,
    fromCache: false,
  };
}
