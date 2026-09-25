/**
 * Servicio para consultar las Tasas Oficiales en Vivo del Banco Central de Venezuela (BCV)
 * Proporciona el tipo de cambio oficial para DÓLAR (USD) y EURO (EUR).
 * 
 * Incluye:
 * - Consulta simultánea optimizada (ve.dolarapi.com/v1/cotizaciones)
 * - Endpoints de respaldo individuales para USD y EUR
 * - Caché inteligente en localStorage (15 minutos) con bypass para recarga manual
 * - Manejo robusto de contingencia y fallbacks sin caídas de la interfaz
 */

export interface BcvRates {
  usd: number;
  eur: number;
  usdDate?: string;
  eurDate?: string;
  updatedAt: string;
  isFallback?: boolean;
  fromCache?: boolean;
}

export const DEFAULT_BCV_USD = 854.46;
export const DEFAULT_BCV_EUR = 974.06;

const STORAGE_KEY = 'tio_willy_bcv_rates_v1';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutos de caché óptima

/**
 * Formatea un número al estándar monetario venezolano (ej. 854,46)
 */
export function formatBcvRate(rate?: number | null): string {
  const num = typeof rate === 'number' && !isNaN(rate) && rate > 0 ? rate : DEFAULT_BCV_USD;
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea la fecha de actualización de la tasa (ej. "24 sep, 2026")
 */
export function formatBcvDate(isoDate?: string): string {
  if (!isoDate) return 'Hoy';
  try {
    const d = new Date(isoDate);
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
            updatedAt: cached.updatedAt || new Date().toISOString(),
            isFallback: false,
            fromCache: true,
          };
        }
      }
    } catch (e) {
      console.warn('[BCV Service] Error al leer caché local:', e);
    }
  }

  // 2. Intentar endpoint consolidado (devuelve USD y EUR en una sola petición)
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
            isFallback: false,
            fromCache: false,
          };

          // Guardar en caché local
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ...rates, timestamp: Date.now() })
              );
            } catch (storageErr) {
              console.warn('[BCV Service] No se pudo guardar caché:', storageErr);
            }
          }

          return rates;
        }
      }
    }
  } catch (err) {
    console.warn('[BCV Service] Falló endpoint consolidado /cotizaciones:', err);
  }

  // 3. Fallback a endpoints individuales si el consolidado no respondió completo
  let usdFallback: { rate: number; date?: string } | null = null;
  let eurFallback: { rate: number; date?: string } | null = null;

  try {
    const [usdRes, eurRes] = await Promise.allSettled([
      fetch('https://ve.dolarapi.com/v1/dolares/oficial', { headers: { Accept: 'application/json' } }),
      fetch('https://ve.dolarapi.com/v1/euros/oficial', { headers: { Accept: 'application/json' } }),
    ]);

    if (usdRes.status === 'fulfilled' && usdRes.value.ok) {
      const uData = await usdRes.value.json();
      if (typeof uData?.promedio === 'number') {
        usdFallback = { rate: uData.promedio, date: uData.fechaActualizacion };
      }
    }

    if (eurRes.status === 'fulfilled' && eurRes.value.ok) {
      const eData = await eurRes.value.json();
      if (typeof eData?.promedio === 'number') {
        eurFallback = { rate: eData.promedio, date: eData.fechaActualizacion };
      }
    }
  } catch (err) {
    console.warn('[BCV Service] Falló fallback individual:', err);
  }

  if (usdFallback || eurFallback) {
    const rates: BcvRates = {
      usd: usdFallback ? usdFallback.rate : DEFAULT_BCV_USD,
      eur: eurFallback ? eurFallback.rate : DEFAULT_BCV_EUR,
      usdDate: usdFallback?.date,
      eurDate: eurFallback?.date,
      updatedAt: new Date().toISOString(),
      isFallback: !(usdFallback && eurFallback),
      fromCache: false,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rates, timestamp: Date.now() }));
      } catch {}
    }

    return rates;
  }

  // 4. Fallback a caché expirada anterior si existe
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
            updatedAt: stale.updatedAt || new Date().toISOString(),
            isFallback: true,
            fromCache: true,
          };
        }
      }
    } catch {}
  }

  // 5. Contingencia final fija
  return {
    usd: DEFAULT_BCV_USD,
    eur: DEFAULT_BCV_EUR,
    updatedAt: new Date().toISOString(),
    isFallback: true,
    fromCache: false,
  };
}
