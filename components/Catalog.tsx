'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { trackEventAction } from '../app/admin/adminActions';

// Interfaces para TypeScript
export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  priceDetal: number;
  priceMayor: number;
  minMayor: number;
  images: string[];
  varieties: string[];
  currency?: string;
  subcategory?: string;
  clicks?: number;
  offerPrice?: number;
  isOffer?: boolean;
  status?: 'active' | 'paused';
  pausedVarieties?: string[];
}

export interface Category {
  _id: string;
  name: string;
  subcategories?: string[];
}

// Helper para construir enlaces de WhatsApp universales y 100% compatibles, evitando el error 4xx de Cloudflare
export function buildWhatsAppLink(phone: string, text?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!text) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}

// Helpers para construir URLs limpias y seguras tanto en SSR como en Cliente
export function getProductCatalogUrl(productId: string, varietyIndex: number = 0, explicitOrigin?: string): string {
  const vParam = varietyIndex > 0 ? `&v=${varietyIndex}` : '';
  const origin = explicitOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  if (origin) {
    return `${origin}/?p=${encodeURIComponent(productId)}${vParam}`;
  }
  return `/?p=${encodeURIComponent(productId)}${vParam}`;
}

export function getAbsolutePhotoUrl(imgUrl?: string, productId?: string, varietyIndex: number = 0, explicitOrigin?: string): string {
  const origin = explicitOrigin || (typeof window !== 'undefined' ? window.location.origin : '');

  // Si ya es una URL pública externa (ej. Cloudinary https://res.cloudinary.com/...)
  if (imgUrl && (imgUrl.startsWith('https://') || imgUrl.startsWith('http://')) && !imgUrl.startsWith('data:')) {
    return imgUrl;
  }

  // Si no hay imagen, o si es Base64 (data:image/...) o una ruta relativa (/images/...)
  // Usamos el endpoint API dedicado /api/product-image para generar un enlace ligero y accesible
  if (origin && productId) {
    const vParam = varietyIndex > 0 ? `&v=${varietyIndex}` : '';
    return `${origin}/api/product-image?id=${encodeURIComponent(productId)}${vParam}`;
  }

  // Fallback si no hay productId pero hay ruta relativa local
  if (imgUrl && imgUrl.startsWith('/') && origin) {
    return `${origin}${imgUrl}`;
  }

  return '';
}

export function buildProductWhatsAppMessage({
  productName,
  variety,
  priceDetal,
  priceMayor,
  minMayor,
  isOffer,
  offerPrice,
  symbol = '$',
  productId,
  varietyIndex = 0,
  imageUrl,
  origin,
  isVarietyPaused = false,
}: {
  productName: string;
  variety?: string;
  priceDetal: number;
  priceMayor: number;
  minMayor: number;
  isOffer?: boolean;
  offerPrice?: number;
  symbol?: string;
  productId: string;
  varietyIndex?: number;
  imageUrl?: string;
  origin?: string;
  isVarietyPaused?: boolean;
}): string {
  const isOfferActive = !!(isOffer && offerPrice && offerPrice > 0);
  const photoUrl = getAbsolutePhotoUrl(imageUrl, productId, varietyIndex, origin);
  const catalogUrl = getProductCatalogUrl(productId, varietyIndex, origin);

  const lines: string[] = [];

  if (isVarietyPaused) {
    lines.push('¡Hola Tío Willy! 👋');
    lines.push('Deseo consultar por este producto del catálogo (Color/Variedad actualmente agotado):');
    lines.push('');
    lines.push(`📌 *${productName}*`);
    if (variety) lines.push(`▫️ *Variedad solicitada:* ${variety} ⚠️ *(Agotado temporalmente)*`);
    lines.push(`🏷️ *Precio Detal:* ${symbol}${priceDetal.toFixed(2)}`);
    lines.push(`📦 *Precio al Mayor:* ${symbol}${priceMayor.toFixed(2)} (A partir de ${minMayor} uds.)`);
  } else if (isOfferActive) {
    lines.push('¡Hola Tío Willy! 👋');
    lines.push('Deseo consultar por la *OFERTA ESPECIAL* del catálogo:');
    lines.push('');
    lines.push(`📌 *${productName}*`);
    if (variety) lines.push(`▫️ *Variedad:* ${variety}`);
    lines.push(`🔥 *Precio Oferta:* ${symbol}${offerPrice!.toFixed(2)} (Antes ${symbol}${priceDetal.toFixed(2)})`);
    lines.push(`📦 *Precio al Mayor:* ${symbol}${priceMayor.toFixed(2)} (A partir de ${minMayor} uds.)`);
  } else {
    lines.push('¡Hola Tío Willy! 👋');
    lines.push('Deseo consultar por este producto del catálogo:');
    lines.push('');
    lines.push(`📌 *${productName}*`);
    if (variety) lines.push(`▫️ *Variedad:* ${variety}`);
    lines.push(`🏷️ *Precio Detal:* ${symbol}${priceDetal.toFixed(2)}`);
    lines.push(`📦 *Precio al Mayor:* ${symbol}${priceMayor.toFixed(2)} (A partir de ${minMayor} uds.)`);
  }

  if (catalogUrl) {
    lines.push('');
    lines.push('🔗 *Ver en Tienda:*');
    lines.push(catalogUrl);
  }

  if (photoUrl) {
    lines.push('');
    lines.push('📸 *Ver Foto del Producto:*');
    lines.push(photoUrl);
  }

  lines.push('');
  if (isVarietyPaused) {
    lines.push('¿Tienen fecha estimada de reposición para este color o qué opciones similares tienen disponibles? ¡Muchas gracias!');
  } else {
    lines.push('¿Tienen disponibilidad para entrega o despacho? ¡Muchas gracias!');
  }

  return lines.join('\n');
}

// Replicamos el Logo Tío Willy usando SVG y Tailwind con Animación de Radar y Resplandor
function LogoTioWilly({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Icono de Casa en Pin de Ubicación con Ondas de Radar Vivas */}
      <div className="relative flex items-center justify-center mb-1">
        {/* Ondas concéntricas de pulso radar */}
        <span className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600/30 animate-radar-ping pointer-events-none"></span>
        <span className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-500/15 blur-md pointer-events-none animate-pulse"></span>

        <svg className="relative z-10 w-16 h-16 md:w-20 md:h-20 mb-1 drop-shadow-[0_0_14px_rgba(255,45,45,0.65)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 85C42 77 15 54 15 37C15 17 31 5 50 5C69 5 85 17 85 37C85 54 58 77 50 85Z" 
            stroke="#FF2D2D" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M38 48V62H62V48M32 48L50 32L68 48" 
            stroke="#FF2D2D" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <rect x="46" y="52" width="8" height="10" fill="#FF2D2D" />
        </svg>
      </div>
      
      {/* HOME */}
      <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white leading-none select-none flex items-center font-sans drop-shadow-[0_2px_14px_rgba(255,255,255,0.2)]">
        H
        <span className="relative inline-flex items-center justify-center">
          O
          <span className="absolute w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75"></span>
          <span className="absolute w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
        </span>
        ME
      </h1>
      
      {/* AND TOYS */}
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-[#FF2D2D] leading-none select-none mt-1 font-sans drop-shadow-[0_0_12px_rgba(255,45,45,0.4)]">
        AND TOYS
      </h2>
      
      {/* Línea Divisora con resplandor central rojo */}
      <div className="w-52 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 opacity-90"></div>
      
      {/* TÍO WILLY */}
      <h3 className="text-lg md:text-xl font-bold tracking-[0.35em] text-zinc-300 leading-none select-none font-sans uppercase">
        Tío Willy
      </h3>
    </div>
  );
}

// Subcomponente para cada Tarjeta de Producto (Exportado para vista previa en admin)
export function ProductCard({ product, categoryName, currency = 'USD' }: { product: Product; categoryName?: string; currency?: string }) {
  const pausedVars = useMemo(() => product.pausedVarieties || [], [product.pausedVarieties]);
  const initialAvailableIdx = useMemo(() => {
    const idx = product.varieties.findIndex(v => !pausedVars.includes(v));
    return idx !== -1 ? idx : 0;
  }, [product.varieties, pausedVars]);

  const [activeIdx, setActiveIdx] = useState(initialAvailableIdx);

  // Si la variedad actualmente seleccionada queda pausada pero existe otra con stock disponible, seleccionarla
  useEffect(() => {
    if (pausedVars.includes(product.varieties[activeIdx])) {
      const nextAvail = product.varieties.findIndex(v => !pausedVars.includes(v));
      if (nextAvail !== -1) {
        setActiveIdx(nextAvail);
      }
    }
  }, [pausedVars, product.varieties, activeIdx]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Soporte de gestos táctiles (swipe) para móviles
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && product.images.length > 1) {
      // Deslizar izquierda -> Siguiente imagen
      setActiveIdx((prev) => (prev + 1) % product.images.length);
    } else if (isRightSwipe && product.images.length > 1) {
      // Deslizar derecha -> Imagen anterior
      setActiveIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % product.images.length);
  };

  const currentImage = product.images[activeIdx] || '/images/chair_red.jpg';
  const currentVariety = product.varieties[activeIdx] || product.varieties[0];
  const isCurrentVarietyPaused = pausedVars.includes(currentVariety);

  const symbol = currency === 'EUR' ? '€' : '$';
  const isOfferActive = !!(product.isOffer && product.offerPrice && product.offerPrice > 0);

  // Estado para capturar el origin real del cliente (evita SSR con origin vacío)
  const [cardOrigin, setCardOrigin] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCardOrigin(window.location.origin);
    }
  }, []);

  const phone = '584244576086';

  const getWhatsAppTargetUrl = (explicitOrigin?: string) => {
    const originToUse = explicitOrigin || cardOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    const whatsappMessage = buildProductWhatsAppMessage({
      productName: product.name,
      variety: currentVariety,
      priceDetal: product.priceDetal,
      priceMayor: product.priceMayor,
      minMayor: product.minMayor,
      isOffer: product.isOffer,
      offerPrice: product.offerPrice,
      symbol,
      productId: product._id,
      varietyIndex: activeIdx,
      imageUrl: currentImage,
      origin: originToUse,
      isVarietyPaused: isCurrentVarietyPaused,
    });
    return buildWhatsAppLink(phone, whatsappMessage);
  };

  const whatsappUrl = getWhatsAppTargetUrl();

  const handleWhatsAppAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const currentOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : cardOrigin;
    const finalUrl = getWhatsAppTargetUrl(currentOrigin);
    trackEventAction('whatsapp_click', product._id).catch(err => console.error("Error tracking click:", err));
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={() => setIsModalOpen(true)}
      className="group relative flex flex-col rounded-2xl sm:rounded-3xl bg-white border border-zinc-200/90 hover:border-red-500/60 transition-all duration-300 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-red-950/10 cursor-pointer"
    >
      {/* Carrusel de Imágenes con soporte híbrido de gestos swipe */}
      <div 
        className="relative aspect-square w-full bg-zinc-100 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={currentImage} 
          alt={`${product.name} - ${currentVariety}`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105"
        />
        
        {/* Sombreado de degradado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40"></div>

        {/* Flechas de navegación (visibles en hover o móviles siempre) */}
        {product.images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-red-600 active:scale-95 text-zinc-800 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none shadow-md border border-zinc-200"
              aria-label="Imagen anterior"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-red-600 active:scale-95 text-zinc-800 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none shadow-md border border-zinc-200"
              aria-label="Siguiente imagen"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicadores de variedad / dots */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {product.images.map((_, idx: number) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? 'bg-red-500 w-3.5 sm:w-4' : 'bg-white/70 hover:bg-white'
                }`}
                aria-label={`Ver variedad ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Categoría Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-600 bg-white/95 border border-red-200/80 rounded-full backdrop-blur-md shadow-xs">
            {categoryName || product.category}
          </span>
        </div>

        {/* Badge de Variedad Agotada en Imagen */}
        {isCurrentVarietyPaused && (
          <div className="absolute top-11 left-3 z-10 bg-zinc-950/85 backdrop-blur-md border border-amber-500/60 text-amber-300 font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{currentVariety} Agotado</span>
          </div>
        )}

        {/* Badge de Oferta Especial */}
        {isOfferActive && (
          <div className="absolute top-3 right-3 z-10 bg-red-600 border border-red-400 text-white font-black text-[10px] sm:text-xs tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase shadow-md flex items-center gap-1 backdrop-blur-xs">
            <span>🔥 OFERTA</span>
            {product.priceDetal > (product.offerPrice || 0) && (
              <span className="bg-zinc-900/80 text-white px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-bold">
                -{Math.round(((product.priceDetal - (product.offerPrice || 0)) / product.priceDetal) * 100)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight group-hover:text-red-600 transition-colors duration-200 min-h-[40px] sm:min-h-[48px] line-clamp-2 leading-snug">
          {product.name}
        </h3>
        
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
          {product.description}
        </p>

        {/* Selección Rápida de Variedades por Texto/Color */}
        {product.varieties.length > 1 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs text-zinc-500 block uppercase font-bold tracking-wider">Variedad:</span>
              {isCurrentVarietyPaused && (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded uppercase">
                  Agotado
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {product.varieties.map((varName: string, idx: number) => {
                const isVarPaused = pausedVars.includes(varName);
                const isSelected = idx === activeIdx;
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(idx);
                    }}
                    className={`text-[11px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-lg border transition-all duration-200 flex items-center gap-1 ${
                      isVarPaused
                        ? isSelected
                          ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold line-through shadow-2xs'
                          : 'bg-zinc-100/70 text-zinc-400 border-zinc-200 line-through opacity-75 hover:opacity-100'
                        : isSelected
                          ? 'bg-red-50 text-red-600 border-red-400 font-semibold shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    <span>{varName}</span>
                    {isVarPaused && (
                      <span className="text-[8px] no-underline font-extrabold text-amber-700 bg-amber-100/90 px-1 rounded ml-0.5">
                        Agotado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Espaciador */}
        <div className="flex-1 min-h-[14px]"></div>

        {/* Precios */}
        <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col gap-2">
          {isOfferActive ? (
            <div className="flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 line-through font-mono">
                  Antes: {symbol}{product.priceDetal.toFixed(2)}
                </span>
                <span className="text-[11px] text-red-600 font-bold uppercase tracking-wide flex items-center gap-1">
                  <span>🔥 Oferta:</span>
                </span>
              </div>
              <span className="text-lg sm:text-xl font-black text-red-600 font-mono">
                {symbol}{product.offerPrice!.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">Precio Detal:</span>
              <span className="text-lg sm:text-xl font-black text-zinc-900 font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
            </div>
          )}
          
          <div className="h-[1px] bg-zinc-200/80"></div>
          <div className="flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-[11px] text-red-600 font-bold uppercase tracking-wide">Precio Mayor:</span>
              <span className="text-[9px] text-zinc-500 italic">Mín. {product.minMayor} unidades</span>
            </div>
            <span className="text-base sm:text-lg font-black text-red-600 font-mono">{symbol}{product.priceMayor.toFixed(2)}</span>
          </div>
        </div>

        {/* Botón WhatsApp de proporción equilibrada y moderna */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppAction}
          className={`mt-3 w-full py-2.5 px-3.5 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 ${
            isCurrentVarietyPaused
              ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 hover:shadow-md hover:shadow-amber-600/20 focus:ring-amber-500/50'
              : 'bg-red-600 hover:bg-red-500 active:bg-red-700 hover:shadow-md hover:shadow-red-600/20 focus:ring-red-500/50'
          }`}
        >
          {/* WhatsApp Icon */}
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
          </svg>
          <span>
            {isCurrentVarietyPaused ? `Consultar Reposición (${currentVariety})` : 'Pedir por WhatsApp'}
          </span>
        </a>
      </div>

      {/* Modal flotante de información completa del producto */}
      {isModalOpen && (
        <ProductDetailModal
          product={product}
          categoryName={categoryName}
          currency={currency}
          initialActiveIdx={activeIdx}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// Componente Modal de Detalle de Producto de Alta Jerarquía y Responsividad Perfecta
export function ProductDetailModal({
  product,
  categoryName,
  currency = 'USD',
  initialActiveIdx,
  onClose,
}: {
  product: Product;
  categoryName?: string;
  currency?: string;
  initialActiveIdx?: number;
  onClose: () => void;
}) {
  const pausedVars = useMemo(() => product.pausedVarieties || [], [product.pausedVarieties]);
  const firstAvailableIdx = useMemo(() => {
    const idx = product.varieties.findIndex(v => !pausedVars.includes(v));
    return idx !== -1 ? idx : 0;
  }, [product.varieties, pausedVars]);

  // Si se indicó un índice inicial específico (y existe), usarlo; de lo contrario el primer disponible en stock
  const startingIdx = (initialActiveIdx !== undefined && initialActiveIdx < product.varieties.length)
    ? initialActiveIdx
    : firstAvailableIdx;

  const [modalActiveIdx, setModalActiveIdx] = useState(startingIdx);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentImage = product.images[modalActiveIdx] || product.images[0] || '/images/chair_red.jpg';
  const currentVariety = product.varieties[modalActiveIdx] || product.varieties[0] || 'Estándar';
  const isCurrentVarietyPaused = pausedVars.includes(currentVariety);

  const symbol = currency === 'EUR' ? '€' : '$';
  const isOfferActive = !!(product.isOffer && product.offerPrice && product.offerPrice > 0);
  const discountPct = isOfferActive && product.priceDetal > (product.offerPrice || 0)
    ? Math.round(((product.priceDetal - (product.offerPrice || 0)) / product.priceDetal) * 100)
    : null;

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.images.length <= 1) return;
    setModalActiveIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.images.length <= 1) return;
    setModalActiveIdx((prev) => (prev + 1) % product.images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && product.images.length > 1) {
      setModalActiveIdx((prev) => (prev + 1) % product.images.length);
    } else if (distance < -minSwipeDistance && product.images.length > 1) {
      setModalActiveIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const [modalOrigin, setModalOrigin] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setModalOrigin(window.location.origin);
    }
  }, []);

  const phone = '584244576086';

  const getModalWhatsAppTargetUrl = (explicitOrigin?: string) => {
    const originToUse = explicitOrigin || modalOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    const whatsappMessage = buildProductWhatsAppMessage({
      productName: product.name,
      variety: currentVariety,
      priceDetal: product.priceDetal,
      priceMayor: product.priceMayor,
      minMayor: product.minMayor,
      isOffer: product.isOffer,
      offerPrice: product.offerPrice,
      symbol,
      productId: product._id,
      varietyIndex: modalActiveIdx,
      imageUrl: currentImage,
      origin: originToUse,
      isVarietyPaused: isCurrentVarietyPaused,
    });
    return buildWhatsAppLink(phone, whatsappMessage);
  };

  const whatsappUrl = getModalWhatsAppTargetUrl();

  const handleModalWhatsAppAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const currentOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : modalOrigin;
    const finalUrl = getModalWhatsAppTargetUrl(currentOrigin);
    trackEventAction('whatsapp_click', product._id).catch(err => console.error("Error tracking click:", err));
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg md:max-w-4xl bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Superior del Modal con Botón de Cerrar Seguro */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 rounded-full shrink-0">
              {categoryName || product.category}
            </span>
            {isOfferActive && (
              <span className="bg-red-600 text-white font-black text-[10px] tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow-sm shrink-0">
                🔥 Oferta
              </span>
            )}
            <span className="text-xs text-zinc-700 font-medium truncate hidden sm:inline">
              {product.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-red-600 active:scale-95 text-zinc-600 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none border border-zinc-200 shadow-sm shrink-0 ml-auto"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenedor Interior con Scroll Suave */}
        <div className="overflow-y-auto p-5 sm:p-7 flex flex-col md:flex-row gap-6 md:gap-8 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
          
          {/* Columna Izquierda: Galería Principal y Miniaturas */}
          <div className="w-full md:w-1/2 flex flex-col gap-3.5">
            {/* Foto Principal */}
            <div
              className="relative aspect-square w-full bg-zinc-100 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none border border-zinc-200 shadow-inner group/heroimg"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={currentImage}
                alt={`${product.name} - ${currentVariety}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/heroimg:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 pointer-events-none"></div>

              {/* Badge si la foto corresponde a variedad agotada */}
              {isCurrentVarietyPaused && (
                <div className="absolute top-3 left-3 z-10 bg-zinc-950/85 backdrop-blur-md border border-amber-500/60 text-amber-300 font-extrabold text-[10px] sm:text-xs tracking-wider px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Color {currentVariety} Agotado</span>
                </div>
              )}

              {/* Botones de navegación si hay más de 1 imagen */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-red-600 active:scale-95 text-zinc-800 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md focus:outline-none shadow-lg border border-zinc-200"
                    aria-label="Imagen anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-red-600 active:scale-95 text-zinc-800 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md focus:outline-none shadow-lg border border-zinc-200"
                    aria-label="Siguiente imagen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Contador de fotos en badge flotante */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/90 border border-zinc-200 text-[11px] font-mono text-zinc-800 backdrop-blur-sm shadow-md font-bold">
                  {modalActiveIdx + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Fila de Miniaturas Clicables (Thumbnails) para ver todas las fotos */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>📷 Todas las fotos ({product.images.length})</span>
                  <span className="text-zinc-400 font-normal">Toca para ampliar:</span>
                </span>
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-300">
                  {product.images.map((imgSrc, idx) => (
                    <button
                      key={`thumb-${idx}`}
                      onClick={() => setModalActiveIdx(idx)}
                      className={`relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                        idx === modalActiveIdx
                          ? 'border-red-500 ring-2 ring-red-500/30 scale-105 shadow-md shadow-red-950/20'
                          : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Ver foto ${idx + 1}`}
                    >
                      <img
                        src={imgSrc || '/images/chair_red.jpg'}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === modalActiveIdx && (
                        <div className="absolute inset-0 bg-red-600/10 pointer-events-none"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Información, Variedades, Precios y Compra */}
          <div className="w-full md:w-1/2 flex flex-col justify-between gap-5 text-left">
            <div>
              {/* Título Principal Grande */}
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-wide leading-tight">
                {product.name}
              </h2>

              {/* Variedades Disponibles */}
              {product.varieties.length > 1 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
                      Variedades / Modelos:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isCurrentVarietyPaused ? 'text-amber-700' : 'text-red-600'}`}>
                        {currentVariety}
                      </span>
                      {isCurrentVarietyPaused && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.varieties.map((varName: string, idx: number) => {
                      const isVarPaused = pausedVars.includes(varName);
                      const isSelected = idx === modalActiveIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setModalActiveIdx(idx)}
                          className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 font-semibold cursor-pointer flex items-center gap-1.5 ${
                            isVarPaused
                              ? isSelected
                                ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-xs'
                                : 'bg-zinc-100/70 text-zinc-400 border-zinc-200 line-through opacity-75 hover:opacity-100'
                              : isSelected
                                ? 'bg-red-50 text-red-600 border-red-500 shadow-sm'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                          }`}
                        >
                          <span>{varName}</span>
                          {isVarPaused && (
                            <span className="text-[8px] no-underline uppercase font-extrabold text-amber-700 bg-amber-100 px-1 rounded">
                              Agotado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="h-[1px] bg-zinc-200 my-4"></div>

              {/* Descripción con scroll independiente si es muy larga */}
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-extrabold tracking-wider">
                  Descripción y Detalles:
                </span>
                <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line font-normal overflow-y-auto max-h-[140px] md:max-h-[200px] pr-2 scrollbar-thin scrollbar-thumb-zinc-300">
                  {product.description || 'Sin descripción detallada disponible.'}
                </p>
              </div>
            </div>

            {/* Caja de Precios Estructurada en Filas Claras (Sin Solapamientos) */}
            <div className="pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col gap-3 shadow-sm">
                {isOfferActive ? (
                  <div className="flex flex-col gap-2">
                    {/* Fila Antes + Badge de Descuento */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400 line-through font-mono">
                        Precio Regular: {symbol}{product.priceDetal.toFixed(2)}
                      </span>
                      {discountPct && (
                        <span className="bg-red-600 text-white border border-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-sm">
                          -{discountPct}% DCTO
                        </span>
                      )}
                    </div>

                    {/* Fila Precio de Oferta */}
                    <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-zinc-200">
                      <span className="text-xs text-red-600 font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <span>🔥 Precio Oferta:</span>
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
                        {symbol}{product.offerPrice!.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Precio Detal:</span>
                    <span className="text-2xl sm:text-3xl font-black text-zinc-950 font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
                  </div>
                )}

                {/* Línea Divisoria */}
                <div className="h-[1px] bg-zinc-200"></div>

                {/* Fila Precio al Mayor */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Precio al Mayor:</span>
                    <span className="text-[10px] text-zinc-500">A partir de {product.minMayor} unidades</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-red-600 font-mono">
                    {symbol}{product.priceMayor.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Aviso amigable si la variedad seleccionada está agotada */}
              {isCurrentVarietyPaused && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
                  <span className="text-base leading-none">⚠️</span>
                  <div className="leading-snug">
                    <span className="font-bold block">Variedad "{currentVariety}" agotada temporalmente</span>
                    <span className="text-[11px] text-amber-800/90 block mt-0.5">
                      Puedes elegir cualquier otro color disponible o pulsar abajo para consultar con Tío Willy la fecha estimada de llegada.
                    </span>
                  </div>
                </div>
              )}

              {/* Botón WhatsApp de Compra Inmediata o Consulta de Stock */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleModalWhatsAppAction}
                className={`mt-4 w-full py-3 px-4 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer uppercase tracking-wider ${
                  isCurrentVarietyPaused
                    ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-600/25'
                    : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-600/25'
                }`}
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                </svg>
                <span>
                  {isCurrentVarietyPaused ? `Consultar reposición (${currentVariety})` : 'Pedir por WhatsApp'}
                </span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// Función auxiliar para extraer subcategorías creadas manualmente por el administrador
function getSubcategoriesForCategory(
  productsInCategory: Product[],
  categoriesList: Category[],
  currentCategoryId: string
): string[] {
  const subcats = new Set<string>();

  // 1. Obtener las subcategorías oficiales configuradas en la categoría
  const categoryObj = categoriesList.find((c) => c._id === currentCategoryId);
  if (categoryObj && Array.isArray(categoryObj.subcategories)) {
    categoryObj.subcategories.forEach((s) => {
      if (s && typeof s === 'string' && s.trim().length > 0) {
        subcats.add(s.trim());
      }
    });
  }

  // 2. Incluir también subcategorías manuales asignadas a productos activos de esta categoría
  productsInCategory.forEach((product) => {
    if (product.subcategory && product.subcategory.trim().length > 0) {
      subcats.add(product.subcategory.trim());
    }
  });

  return Array.from(subcats).sort((a, b) => {
    // Si contiene números (ej: Rin 12, Rin 16, Rin 20), ordenar numéricamente
    const aNum = a.match(/\d+/);
    const bNum = b.match(/\d+/);
    if (aNum && bNum) {
      const diff = parseInt(aNum[0], 10) - parseInt(bNum[0], 10);
      if (diff !== 0) return diff;
    }
    return a.localeCompare(b);
  });
}

// Diapositivas para el carrusel de la cabecera (Hero Slider)
const HERO_SLIDES = [
  {
    id: 1,
    tag: 'COLECCIÓN EXCLUSIVA',
    title: 'Hogar, Juguetería y Variedades',
    highlight: 'Calidad Premium',
    description: 'Encuentra las mejores marcas y modelos seleccionados al detal y con tarifas directas al mayor.',
    badge: '✨ Catálogo 2026',
    ctaText: 'Ver Catálogo',
    ctaLink: '#catalogo',
    secondaryText: 'Pedir por WhatsApp',
    secondaryLink: 'https://api.whatsapp.com/send?phone=584244576086'
  },
  {
    id: 2,
    tag: 'ATENCIÓN MAYORISTA',
    title: 'Precios de Distribución Comercial',
    highlight: 'Impulsa tu Negocio',
    description: 'Ventas por bulto y cajas cerradas con márgenes de ganancia inmejorables para tu comercio.',
    badge: '💼 Mayoristas',
    ctaText: 'Trabaja con Nosotros',
    isPdfAction: true,
    secondaryText: 'Cotizar Lotes',
    secondaryLink: 'https://api.whatsapp.com/send?phone=584244576086&text=%C2%A1Hola!%20Deseo%20cotizar%20compras%20al%20mayor%20en%20Home%20and%20Toys%20T%C3%ADo%20Willy.'
  },
  {
    id: 3,
    tag: 'REBAJAS POR TIEMPO LIMITADO',
    title: 'Super Ofertas y Liquidaciones',
    highlight: 'Precios Especiales',
    description: 'Descubre artículos en promoción con descuentos imperdibles hasta agotar existencia.',
    badge: '🔥 Super Ofertas',
    ctaText: 'Ver Ofertas Destacadas',
    ctaLink: '#seccion-ofertas',
    secondaryText: 'Consultar Ofertas',
    secondaryLink: 'https://api.whatsapp.com/send?phone=584244576086&text=%C2%A1Hola!%20Me%20interesa%20conocer%20las%20ofertas%20especiales%20disponibles.'
  }
];

export default function Catalog({ 
  initialProductos, 
  initialCategorias,
  mapUrl,
  currency = 'USD'
}: { 
  initialProductos: Product[]; 
  initialCategorias: Category[]; 
  mapUrl?: string;
  currency?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showInactivityAlert, setShowInactivityAlert] = useState<boolean>(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('todos');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<Product | null>(null);
  const [selectedUrlProduct, setSelectedUrlProduct] = useState<Product | null>(null);
  const [selectedUrlVarietyIdx, setSelectedUrlVarietyIdx] = useState<number>(0);
  const [catalogOrigin, setCatalogOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCatalogOrigin(window.location.origin);
    }
  }, []);

  // Detección de producto enlazado por URL (?p=ID&v=INDEX) para abrir automáticamente la vista detallada
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const productId = searchParams.get('p');
      const varietyStr = searchParams.get('v');
      if (productId && initialProductos && initialProductos.length > 0) {
        const found = initialProductos.find((p) => p._id === productId);
        if (found) {
          const vIdx = varietyStr ? parseInt(varietyStr, 10) : 0;
          const safeVIdx = !isNaN(vIdx) && vIdx >= 0 && vIdx < (found.images?.length || 1) ? vIdx : 0;
          setSelectedUrlProduct(found);
          setSelectedUrlVarietyIdx(safeVIdx);
        }
      }
    } catch (err) {
      console.error("Error al procesar parámetros de URL:", err);
    }
  }, [initialProductos]);

  // Estados del Carrusel de la Cabecera (Hero Slider)
  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);
  const [isHeroPaused, setIsHeroPaused] = useState<boolean>(false);

  // Soporte de gestos táctiles (Swipe) para el Hero Slider en móviles
  const [heroTouchStart, setHeroTouchStart] = useState<number | null>(null);
  const [heroTouchEnd, setHeroTouchEnd] = useState<number | null>(null);

  const onHeroTouchStart = (e: React.TouchEvent) => {
    setHeroTouchEnd(null);
    setHeroTouchStart(e.targetTouches[0].clientX);
  };

  const onHeroTouchMove = (e: React.TouchEvent) => {
    setHeroTouchEnd(e.targetTouches[0].clientX);
  };

  const onHeroTouchEnd = () => {
    if (!heroTouchStart || !heroTouchEnd) return;
    const distance = heroTouchStart - heroTouchEnd;
    if (distance > 45) {
      // Deslizar a la izquierda -> Siguiente slide
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (distance < -45) {
      // Deslizar a la derecha -> Slide anterior
      setCurrentHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
  };

  // Auto-avance del Slider Hero cada 5 segundos (sincronizado con la barra de progreso cinemática)
  useEffect(() => {
    if (isHeroPaused) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroPaused]);

  // Filtrar exclusivamente productos activos (ocultar publicaciones en pausa)
  const activeProducts = useMemo(() => {
    return initialProductos.filter((p) => p.status !== 'paused');
  }, [initialProductos]);

  // Lista calculada de productos en oferta (solo activos)
  const offerProducts = useMemo(() => {
    return activeProducts.filter((p) => p.isOffer && p.offerPrice && p.offerPrice > 0);
  }, [activeProducts]);

  // Resetear subcategoría cuando cambia la categoría principal
  useEffect(() => {
    setSelectedSubcategory('todos');
    setCurrentPage(1);
  }, [selectedCategory]);

  // Resetear subcategoría cuando cambia la búsqueda
  useEffect(() => {
    setSelectedSubcategory('todos');
    setCurrentPage(1);
  }, [searchQuery]);

  // Obtener las subcategorías dinámicas para la categoría seleccionada (solo activos)
  const subcategories = useMemo(() => {
    if (selectedCategory === 'todos') return [];
    const productsInCategory = activeProducts.filter((p) => p.category === selectedCategory);
    return getSubcategoriesForCategory(productsInCategory, initialCategorias, selectedCategory);
  }, [selectedCategory, activeProducts, initialCategorias]);

  // Helper to load an image URL and convert it to Base64
  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Error fetching image for PDF: ", url, e);
      return '';
    }
  };

  const handleGenerateCatalogPDF = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);

    try {
      // Carga dinámica bajo demanda para optimizar el bundle inicial
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297

      // --- PAGINA DE PORTADA (Blanca / Minimalista) ---
      // Fondo blanco
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Bordes decorativos finos en gris
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'D');
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'D');

      // Título Principal
      doc.setTextColor(30, 30, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text("CATÁLOGO DE PRODUCTOS", pageWidth / 2, 70, { align: 'center' });

      // Línea divisoria decorativa roja/gris
      doc.setDrawColor(230, 50, 50);
      doc.setLineWidth(1.5);
      doc.line(40, 80, pageWidth - 40, 80);

      // Subtítulo
      doc.setTextColor(100, 100, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.text("Catálogo General de Artículos y Variantes", pageWidth / 2, 92, { align: 'center' });
      
      doc.setTextColor(140, 140, 145);
      doc.setFontSize(10);
      doc.text("Información de referencia sin precios de venta", pageWidth / 2, 100, { align: 'center' });

      // Descripción
      doc.setTextColor(80, 80, 85);
      doc.setFontSize(10.5);
      const introText = "Este catálogo contiene la descripción técnica y visual de nuestro inventario completo de productos. Se distribuye como una herramienta de apoyo comercial de marca blanca para que colaboradores y distribuidores puedan comercializar los artículos utilizando sus propias tarifas y márgenes de ganancia.";
      const splitIntro = doc.splitTextToSize(introText, pageWidth - 50);
      doc.text(splitIntro, pageWidth / 2, 125, { align: 'center' });

      // --- RECUADRO PARA DATOS DEL DISTRIBUIDOR / COLABORADOR ---
      const boxX = 25;
      const boxY = 175;
      const boxW = pageWidth - 50;
      const boxH = 65;

      // Caja gris claro de fondo
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, 'F');
      
      // Borde punteado
      doc.setDrawColor(180, 180, 190);
      doc.setLineWidth(0.4);
      // Simular borde dashed
      doc.line(boxX + 2, boxY, boxX + boxW - 2, boxY);
      doc.line(boxX + boxW, boxY + 2, boxX + boxW, boxY + boxH - 2);
      doc.line(boxX + 2, boxY + boxH, boxX + boxW - 2, boxY + boxH);
      doc.line(boxX, boxY + 2, boxX, boxY + boxH - 2);

      // Título en la caja
      doc.setTextColor(50, 50, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("ATENDIDO POR (CONTACTO COMERCIAL):", boxX + 10, boxY + 12);

      // Campos en blanco para rellenar
      doc.setTextColor(110, 110, 120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text("Nombre: _________________________________________________", boxX + 10, boxY + 26);
      doc.text("Teléfono: ________________________________________________", boxX + 10, boxY + 38);
      doc.text("Correo/Red Social: _________________________________________", boxX + 10, boxY + 50);

      // Pie de portada
      doc.setTextColor(160, 160, 165);
      doc.setFontSize(8);
      doc.text("Herramienta de ventas autorizada para distribuidores independientes.", pageWidth / 2, 265, { align: 'center' });

      // --- AGRUPAR PRODUCTOS POR CATEGORÍA ---
      const grouped: { [categoryId: string]: Product[] } = {};
      initialCategorias.forEach((cat) => {
        grouped[cat._id] = [];
      });
      const unmatchedProducts: Product[] = [];

      activeProducts.forEach((prod) => {
        if (grouped[prod.category]) {
          grouped[prod.category].push(prod);
        } else {
          unmatchedProducts.push(prod);
        }
      });

      let currentY = 20;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2); // 180
      let firstItemRendered = false;

      // Iterar sobre las categorías
      for (let c = 0; c < initialCategorias.length; c++) {
        const cat = initialCategorias[c];
        const catProducts = grouped[cat._id];
        if (catProducts.length === 0) continue;

        // Comprobar si cabe el banner de categoría + 1 producto (98mm de espacio)
        if (!firstItemRendered || currentY + 98 > pageHeight - 20) {
          doc.addPage();
          
          // Fondo blanco para hojas de catálogo
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          
          // Cabecera fina y limpia
          doc.setDrawColor(215, 215, 220);
          doc.setLineWidth(0.4);
          doc.line(margin, 15, pageWidth - margin, 15);
          
          doc.setTextColor(100, 100, 105);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text("CATÁLOGO DE PRODUCTOS", margin, 11);
          
          doc.setFont('helvetica', 'normal');
          doc.text("SOCIOS COMERCIALES", pageWidth - margin - 35, 11);

          currentY = 20;
          firstItemRendered = true;
        }

        // Dibujar banner de categoría sutil
        doc.setFillColor(242, 242, 247);
        doc.roundedRect(margin, currentY, contentWidth, 9, 2, 2, 'F');
        doc.setDrawColor(220, 220, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, 9, 2, 2, 'D');

        doc.setTextColor(50, 50, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`SECCIÓN: ${cat.name.toUpperCase()}`, margin + 5, currentY + 6);
        currentY += 14;

        // Listar productos de esta categoría
        for (let pIdx = 0; pIdx < catProducts.length; pIdx++) {
          const prod = catProducts[pIdx];

          // Comprobar si cabe la tarjeta actual (78mm + 6mm = 84mm)
          if (currentY + 84 > pageHeight - 20) {
            doc.addPage();
            
            // Fondo blanco
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Cabecera
            doc.setDrawColor(215, 215, 220);
            doc.setLineWidth(0.4);
            doc.line(margin, 15, pageWidth - margin, 15);
            
            doc.setTextColor(100, 100, 105);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text("CATÁLOGO DE PRODUCTOS", margin, 11);
            
            doc.setFont('helvetica', 'normal');
            doc.text("SOCIOS COMERCIALES", pageWidth - margin - 35, 11);

            currentY = 20;
          }

          // Altura de tarjeta: 78mm
          const cardH = 78;

          // Dibujar contenedor del producto
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, currentY, contentWidth, cardH, 3, 3, 'F');
          doc.setDrawColor(225, 225, 230);
          doc.setLineWidth(0.4);
          doc.roundedRect(margin, currentY, contentWidth, cardH, 3, 3, 'D');

          // Procesar Imagen de Producto (Asíncrono)
          let imgBase64 = '';
          if (prod.images && prod.images[0]) {
            imgBase64 = await getBase64ImageFromUrl(prod.images[0]);
          }

          // Dibujar recuadro de imagen grande
          const imgX = margin + 5;
          const imgY = currentY + 5;
          const imgW = 68;
          const imgH = 68;

          doc.setFillColor(245, 245, 248);
          doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'F');
          doc.setDrawColor(235, 235, 240);
          doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'D');

          if (imgBase64) {
            try {
              doc.addImage(imgBase64, 'JPEG', imgX, imgY, imgW, imgH);
            } catch (e) {
              doc.setTextColor(140, 140, 145);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.text("Imagen del producto", imgX + 20, imgY + 35);
            }
          } else {
            doc.setTextColor(140, 140, 145);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text("Imagen en catálogo", imgX + 21, imgY + 35);
          }

          // Datos del Producto (a la derecha de la imagen)
          const infoX = imgX + imgW + 6;
          const infoY = currentY + 9;
          const infoW = contentWidth - imgW - 16;

          // Categoría (Badge pequeño gris)
          doc.setFillColor(240, 240, 245);
          doc.roundedRect(infoX, infoY - 3, doc.getTextWidth(cat.name.toUpperCase()) + 5, 4.5, 1, 1, 'F');
          
          doc.setTextColor(100, 100, 110);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(cat.name.toUpperCase(), infoX + 2.5, infoY + 0.3);

          // Nombre del Producto (Título grande)
          doc.setTextColor(30, 30, 35);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(prod.name, infoX, infoY + 7.5);

          // Subcategoría o variantes
          const subcat = prod.subcategory || '';
          if (subcat) {
            doc.setTextColor(120, 120, 125);
            doc.setFont('helvetica', 'oblique');
            doc.setFontSize(8.5);
            doc.text(`Categoría secundaria: ${subcat}`, infoX, infoY + 13.5);
          }

          // Descripción (Salto automático, espacio generoso)
          doc.setTextColor(75, 75, 80);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const splitDesc = doc.splitTextToSize(prod.description, infoW);
          const slicedDesc = splitDesc.slice(0, 4);
          doc.text(slicedDesc, infoX, infoY + (subcat ? 20 : 16.5));

          // Pie de Página
          doc.setTextColor(150, 150, 155);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text("Catálogo de Referencia de Productos  |  Libre de Precios al Consumidor", margin, pageHeight - 8);

          currentY += cardH + 6;
        }
      }

      // Procesar productos huérfanos/sin categoría asignada al final
      if (unmatchedProducts.length > 0) {
        if (!firstItemRendered || currentY + 98 > pageHeight - 20) {
          doc.addPage();
          
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          
          doc.setDrawColor(215, 215, 220);
          doc.setLineWidth(0.4);
          doc.line(margin, 15, pageWidth - margin, 15);
          
          doc.setTextColor(100, 100, 105);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text("CATÁLOGO DE PRODUCTOS", margin, 11);
          
          doc.setFont('helvetica', 'normal');
          doc.text("SOCIOS COMERCIALES", pageWidth - margin - 35, 11);

          currentY = 20;
          firstItemRendered = true;
        }

        // Dibujar banner "OTROS PRODUCTOS"
        doc.setFillColor(242, 242, 247);
        doc.roundedRect(margin, currentY, contentWidth, 9, 2, 2, 'F');
        doc.setDrawColor(220, 220, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, 9, 2, 2, 'D');

        doc.setTextColor(50, 50, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("SECCIÓN: OTROS PRODUCTOS", margin + 5, currentY + 6);
        currentY += 14;

        for (let pIdx = 0; pIdx < unmatchedProducts.length; pIdx++) {
          const prod = unmatchedProducts[pIdx];

          if (currentY + 84 > pageHeight - 20) {
            doc.addPage();
            
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            
            doc.setDrawColor(215, 215, 220);
            doc.setLineWidth(0.4);
            doc.line(margin, 15, pageWidth - margin, 15);
            
            doc.setTextColor(100, 100, 105);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text("CATÁLOGO DE PRODUCTOS", margin, 11);
            
            doc.setFont('helvetica', 'normal');
            doc.text("SOCIOS COMERCIALES", pageWidth - margin - 35, 11);

            currentY = 20;
          }

          const cardH = 78;

          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, currentY, contentWidth, cardH, 3, 3, 'F');
          doc.setDrawColor(225, 225, 230);
          doc.setLineWidth(0.4);
          doc.roundedRect(margin, currentY, contentWidth, cardH, 3, 3, 'D');

          let imgBase64 = '';
          if (prod.images && prod.images[0]) {
            imgBase64 = await getBase64ImageFromUrl(prod.images[0]);
          }

          const imgX = margin + 5;
          const imgY = currentY + 5;
          const imgW = 68;
          const imgH = 68;

          doc.setFillColor(245, 245, 248);
          doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'F');
          doc.setDrawColor(235, 235, 240);
          doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'D');

          if (imgBase64) {
            try {
              doc.addImage(imgBase64, 'JPEG', imgX, imgY, imgW, imgH);
            } catch (e) {
              doc.setTextColor(140, 140, 145);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.text("Imagen del producto", imgX + 20, imgY + 35);
            }
          } else {
            doc.setTextColor(140, 140, 145);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text("Imagen en catálogo", imgX + 21, imgY + 35);
          }

          const infoX = imgX + imgW + 6;
          const infoY = currentY + 9;
          const infoW = contentWidth - imgW - 16;

          doc.setFillColor(240, 240, 245);
          doc.roundedRect(infoX, infoY - 3, doc.getTextWidth("OTROS") + 5, 4.5, 1, 1, 'F');
          
          doc.setTextColor(100, 100, 110);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text("OTROS", infoX + 2.5, infoY + 0.3);

          doc.setTextColor(30, 30, 35);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(prod.name, infoX, infoY + 7.5);

          const subcat = prod.subcategory || '';
          if (subcat) {
            doc.setTextColor(120, 120, 125);
            doc.setFont('helvetica', 'oblique');
            doc.setFontSize(8.5);
            doc.text(`Categoría secundaria: ${subcat}`, infoX, infoY + 13.5);
          }

          doc.setTextColor(75, 75, 80);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const splitDesc = doc.splitTextToSize(prod.description, infoW);
          const slicedDesc = splitDesc.slice(0, 4);
          doc.text(slicedDesc, infoX, infoY + (subcat ? 20 : 16.5));

          doc.setTextColor(150, 150, 155);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text("Catálogo de Referencia de Productos  |  Libre de Precios al Consumidor", margin, pageHeight - 8);

          currentY += cardH + 6;
        }
      }

      doc.save("Catalogo_General_Productos.pdf");
    } catch (error) {
      console.error("Error al generar catálogo PDF: ", error);
      alert("Ocurrió un error al compilar el catálogo PDF. Por favor intente de nuevo.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Comprobar si se cerró sesión por inactividad (detectar query param)
  useEffect(() => {
    // Registrar la visita al sitio de forma asíncrona no bloqueante
    trackEventAction('visit').catch(err => console.error("Error tracking visit:", err));

    const params = new URLSearchParams(window.location.search);
    if (params.get('inactivity') === '1') {
      setShowInactivityAlert(true);
      // Ocultar aviso tras 5 segundos y limpiar la URL de forma sutil
      const timer = setTimeout(() => {
        setShowInactivityAlert(false);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);
  const ITEMS_PER_PAGE = 6;

  // Filtrar productos por Categoría, Subcategoría y Búsqueda de Texto (Solo activos)
  const filteredProducts = useMemo(() => {
    let list = activeProducts;

    // 1. Filtrar por categoría principal
    if (selectedCategory !== 'todos') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // 2. Filtrar por subcategoría si hay una seleccionada y no es 'todos'
    if (selectedCategory !== 'todos' && selectedSubcategory !== 'todos') {
      list = list.filter((p) => {
        if (!p.subcategory || !p.subcategory.trim()) return false;
        return p.subcategory.trim().toLowerCase() === selectedSubcategory.trim().toLowerCase();
      });
    }

    // 3. Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeProducts, selectedCategory, selectedSubcategory, searchQuery]);

  // Contadores de productos por categoría (Solo activos)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: activeProducts.length };
    initialCategorias.forEach((cat: Category) => {
      counts[cat._id] = activeProducts.filter((p: Product) => p.category === cat._id).length;
    });
    return counts;
  }, [activeProducts, initialCategorias]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Resetear página si el filtro reduce los resultados
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#09090b] via-[#18181b]/5 via-white to-zinc-100 text-zinc-900 font-sans selection:bg-red-600 selection:text-white relative bg-brand-lines">
      {/* Aviso de cierre de sesión por inactividad */}
      {showInactivityAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-pulse duration-700">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/95 border border-red-500/40 text-red-500 shadow-2xl backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide">
            <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Sesión cerrada por inactividad</span>
            <button
              onClick={() => setShowInactivityAlert(false)}
              className="text-zinc-400 hover:text-white transition-colors focus:outline-none ml-2 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Sticky Top Navbar de Alta Gama en Cristal Ahumado Oscuro */}
      <nav className="sticky top-0 z-30 w-full bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-xl transition-all shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* 1. Logo Compacto de Alta Jerarquía */}
          <a href="#" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-red-600/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-7 h-7 text-red-500 group-hover:scale-105 transition-transform relative" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 85C42 77 15 54 15 37C15 17 31 5 50 5C69 5 85 17 85 37C85 54 58 77 50 85Z" stroke="#FF2D2D" strokeWidth="8"/>
                <path d="M38 48V62H62V48M32 48L50 32L68 48" stroke="#FF2D2D" strokeWidth="7"/>
                <rect x="46" y="52" width="8" height="10" fill="#FF2D2D" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-wider text-xs uppercase leading-none text-white font-sans flex items-center gap-1.5">
                HOME & TOYS
              </span>
              <span className="text-red-500 font-bold text-[9px] tracking-[0.25em] uppercase leading-none mt-1">
                Tío Willy
              </span>
            </div>
          </a>

          {/* 2. Navegación Central Estratégica (Limpia y sin colisiones) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button 
              onClick={() => { setSelectedCategory('todos'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'todos' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Catálogo
            </button>

            {offerProducts.length > 0 && (
              <button 
                onClick={() => document.getElementById('seccion-ofertas')?.scrollIntoView({ behavior: 'smooth' })} 
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Ofertas</span>
              </button>
            )}

            <button 
              onClick={handleGenerateCatalogPDF}
              disabled={pdfLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar Catálogo B2B para Mayoristas"
            >
              {pdfLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-red-400">Generando...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Mayoristas (PDF)</span>
                </>
              )}
            </button>

            <button 
              onClick={() => document.getElementById('ubicacion')?.scrollIntoView({ behavior: 'smooth' })} 
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Ubicación
            </button>
          </div>

          {/* 3. Grupo de Conversión y Redes Sociales */}
          <div className="flex items-center gap-2.5">
            
            {/* Redes Sociales Oficiales con Badges Circulares */}
            <div className="hidden sm:flex items-center gap-1.5 pr-1 border-r border-zinc-800">
              <a
                href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm group"
                title="TikTok Oficial @hogaryjuguetestiowilly"
                aria-label="TikTok Oficial"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>

              <a
                href="https://www.instagram.com/hogaryjuguetestiowilly"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-pink-400 flex items-center justify-center transition-all active:scale-95 shadow-sm group"
                title="Instagram Oficial @hogaryjuguetestiowilly"
                aria-label="Instagram Oficial"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Botón de Acceso Discreto (Ícono de Perfil/Cuenta) */}
              <a
                href="/admin"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm group"
                aria-label="Acceso"
                title="Acceso"
              >
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </a>
            </div>

            {/* Botón WhatsApp de Alto Impacto */}
            <a 
              href="https://api.whatsapp.com/send?phone=584244576086"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all uppercase tracking-wider shadow-md shadow-emerald-950/40 flex items-center gap-2 active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
              </span>
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Botón Menú Móvil Hamburger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 active:scale-95 rounded-xl border border-zinc-800 transition-all focus:outline-none cursor-pointer"
              aria-label="Abrir menú de navegación y categorías"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (Menu Lateral) */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isDrawerOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop (fondo oscuro semitransparente) */}
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        ></div>

        {/* Panel lateral */}
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85%] bg-white border-l border-zinc-200 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Cabecera del menú */}
          <div className="flex items-center justify-between">
            <span className="font-extrabold tracking-widest text-[10px] uppercase text-zinc-500">Navegación / Filtros</span>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Cerrar menú móvil"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Botón Trabaja con nosotros Móvil */}
          <button
            onClick={() => {
              handleGenerateCatalogPDF();
              setIsDrawerOpen(false);
            }}
            disabled={pdfLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Generando Catálogo PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Descargar Catálogo (PDF)</span>
              </>
            )}
          </button>

          {/* Buscador dentro del menú móvil */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Búsqueda rápida</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-red-500 text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all text-xs"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categorías dentro del menú móvil */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Categorías</span>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[45vh] pr-1">
              <button
                onClick={() => { setSelectedCategory('todos'); setIsDrawerOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-xs ${
                  selectedCategory === 'todos'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
                }`}
              >
                <span>Todos los productos</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-700 text-white' : 'bg-zinc-200 text-zinc-700 font-bold'}`}>
                  {categoryCounts.todos}
                </span>
              </button>

              {initialCategorias.map((cat: Category) => {
                const isActive = selectedCategory === cat._id;
                const count = categoryCounts[cat._id] || 0;
                return (
                  <button
                    key={cat._id}
                    onClick={() => { setSelectedCategory(cat._id); setIsDrawerOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-xs ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-red-700 text-white' : 'bg-zinc-200 text-zinc-700 font-bold'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-200"></div>

          {/* Información de contacto y Redes Sociales */}
          <div className="mt-auto flex flex-col gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block text-center">Atención al Cliente</span>
            <a
              href="https://api.whatsapp.com/send?phone=584244576086"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-3 bg-red-600 hover:bg-red-500 border border-red-500/30 text-white rounded-xl font-bold text-center text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-600/30"
            >
              <span>📞 +58 424 457 6086</span>
            </a>

            {/* Redes Sociales Drawer */}
            <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block text-center">Síguenos Oficial</span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-zinc-800 hover:text-black flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  <span>TikTok</span>
                </a>
                <a
                  href="https://www.instagram.com/hogaryjuguetestiowilly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-100 border border-zinc-200 hover:border-pink-300 text-zinc-800 hover:text-pink-600 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* Acceso discreto al panel */}
            <div className="pt-2 flex justify-center">
              <a
                href="/admin"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors"
                aria-label="Acceso"
                title="Acceso"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Header / Hero Carousel Slider */}
      <header 
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        onTouchStart={onHeroTouchStart}
        onTouchMove={onHeroTouchMove}
        onTouchEnd={onHeroTouchEnd}
        className="relative w-full min-h-[500px] md:min-h-[560px] overflow-hidden flex flex-col items-center justify-center border-b border-zinc-200/80 bg-gradient-to-b from-[#09090b] via-[#1c1917]/25 via-zinc-50 to-white cursor-grab active:cursor-grabbing select-none"
      >
        {/* Malla Geométrica y Figuras Decorativas de Fondo con Aura Radial */}
        <div className="absolute inset-0 bg-brand-grid opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,_rgba(255,45,45,0.12)_0%,_transparent_65%)] pointer-events-none"></div>
        
        {/* Figuras geométricas y luces volumétricas */}
        <div className="absolute top-8 left-10 w-80 h-80 bg-red-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-8 right-10 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/4 right-[9%] w-36 h-36 border border-red-500/20 rounded-3xl rotate-12 pointer-events-none hidden lg:block backdrop-blur-[1px]"></div>
        <div className="absolute bottom-1/4 left-[7%] w-28 h-28 border border-zinc-300/60 rounded-2xl -rotate-6 pointer-events-none hidden lg:block backdrop-blur-[1px]"></div>

        {/* Cápsulas Flotantes de Colección (Floating Feature Pills en Desktop) */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-white/15 backdrop-blur-md shadow-2xl text-xs font-bold text-white absolute top-28 left-8 xl:left-14 animate-float-slow z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-base shrink-0 text-white">🚴‍♂️</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Bicicletas</span>
            <span className="text-white text-xs font-black">Rin 12 a Rin 29</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-white/15 backdrop-blur-md shadow-2xl text-xs font-bold text-white absolute top-24 right-8 xl:right-14 animate-float-reverse z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-base shrink-0 text-white">🎧</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Tecnología</span>
            <span className="text-white text-xs font-black">Audio & Gaming</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-white/15 backdrop-blur-md shadow-2xl text-xs font-bold text-white absolute bottom-24 left-10 xl:left-16 animate-float-reverse z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-base shrink-0 text-white">📦</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Mayoristas</span>
            <span className="text-white text-xs font-black">Tarifas de Fábrica</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-white/15 backdrop-blur-md shadow-2xl text-xs font-bold text-white absolute bottom-20 right-10 xl:right-16 animate-float-slow z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-base shrink-0 text-white">⚡</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Envíos Rápidos</span>
            <span className="text-white text-xs font-black">Caracas & Nacional</span>
          </div>
        </div>

        {/* Logo Superior con pulso de radar */}
        <div className="relative z-10 pt-8 pb-3">
          <LogoTioWilly className="scale-90 md:scale-95 transition-transform duration-500" />
        </div>

        {/* Micro-Badges de Especialidad para Móvil (Scrollable horizontal muy suave) */}
        <div className="flex xl:hidden items-center gap-2 z-10 px-4 py-1.5 mb-2 max-w-full overflow-x-auto scrollbar-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/15 text-[11px] font-bold text-zinc-200 whitespace-nowrap shadow-md backdrop-blur-md">
            <span>🚴‍♂️</span> Bicicletas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/15 text-[11px] font-bold text-zinc-200 whitespace-nowrap shadow-md backdrop-blur-md">
            <span>🎧</span> Audio & Tech
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/15 text-[11px] font-bold text-zinc-200 whitespace-nowrap shadow-md backdrop-blur-md">
            <span>📦</span> Mayor & Detal
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/15 text-[11px] font-bold text-zinc-200 whitespace-nowrap shadow-md backdrop-blur-md">
            <span>⚡</span> Envíos 24h
          </span>
        </div>

        {/* Slider de Diapositivas Hero */}
        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 py-4 flex flex-col items-center text-center">
          {HERO_SLIDES.map((slide, sIdx) => {
            const isActive = sIdx === currentHeroSlide;
            return (
              <div
                key={slide.id}
                className={`w-full flex flex-col items-center transition-all duration-700 transform ${
                  isActive 
                    ? 'opacity-100 translate-y-0 scale-100 relative' 
                    : 'opacity-0 translate-y-4 scale-95 absolute pointer-events-none'
                }`}
              >
                {/* Badge con borde animado de acento */}
                <div className={`transition-all duration-700 delay-100 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-widest mb-3 shadow-sm animate-pulse">
                    <span>{slide.badge}</span>
                  </div>
                </div>

                {/* Título Principal */}
                <h2 className={`text-2xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight max-w-2xl leading-tight transition-all duration-700 delay-200 transform drop-shadow-sm ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                  {slide.title}
                </h2>

                {/* Highlight / Subtítulo Corporativo */}
                <p className={`text-red-600 font-black text-sm sm:text-base tracking-wider uppercase mt-2.5 transition-all duration-700 delay-300 transform drop-shadow-sm ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  {slide.highlight}
                </p>

                {/* Descripción */}
                <p className={`mt-3 text-zinc-600 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed transition-all duration-700 delay-400 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  {slide.description}
                </p>

                {/* Botones de acción del slide (Touch targets >= 44px con feedback elástico) */}
                <div className={`mt-6 flex flex-wrap items-center justify-center gap-3.5 transition-all duration-700 delay-500 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                  {slide.isPdfAction ? (
                    <button
                      onClick={handleGenerateCatalogPDF}
                      disabled={pdfLoading}
                      className="min-h-[46px] px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {pdfLoading ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                          <span>Generando PDF...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{slide.ctaText}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href={slide.ctaLink}
                      className="min-h-[46px] px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-red-600/30 flex items-center gap-2 active:scale-95"
                    >
                      <span>{slide.ctaText}</span>
                      <svg className="w-4 h-4 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7-7-7" />
                      </svg>
                    </a>
                  )}

                  <a
                    href={slide.secondaryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[46px] px-6 py-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-800 hover:text-zinc-950 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <span>{slide.secondaryText}</span>
                    <svg className="w-4 h-4 fill-current text-red-600" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flechas de navegación del Slider (>= 44px) */}
        <button
          onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-900/80 hover:bg-red-600 border border-white/15 hover:border-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hidden sm:flex active:scale-95 backdrop-blur-md"
          aria-label="Slide anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-900/80 hover:bg-red-600 border border-white/15 hover:border-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hidden sm:flex active:scale-95 backdrop-blur-md"
          aria-label="Siguiente slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicadores Cinemáticos con Barra de Progreso en Vivo */}
        <div className="relative z-10 flex items-center gap-3 mt-4 pb-8">
          {HERO_SLIDES.map((_, dotIdx) => {
            const isCurrent = dotIdx === currentHeroSlide;
            return (
              <button
                key={dotIdx}
                onClick={() => setCurrentHeroSlide(dotIdx)}
                className="min-h-[44px] px-1 cursor-pointer flex items-center justify-center group"
                aria-label={`Ir a la diapositiva ${dotIdx + 1}`}
              >
                {isCurrent ? (
                  <div className="w-16 sm:w-20 h-2 bg-zinc-200 border border-zinc-300 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      key={`progress-${currentHeroSlide}`}
                      className={`h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full animate-hero-progress ${
                        isHeroPaused ? 'animation-paused' : ''
                      }`}
                    />
                  </div>
                ) : (
                  <span className="w-3 h-2 rounded-full bg-zinc-300 group-hover:bg-zinc-400 transition-all block" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Franja de Ritmo Claro / Neutro: Pilares y Confianza de Marca */}
      <section className="relative z-20 w-full bg-white border-y border-zinc-200 py-6 sm:py-7 text-zinc-900 shadow-sm overflow-hidden">
        {/* Micro-textura y figura geométrica de fondo en la franja clara */}
        <div className="absolute inset-0 bg-brand-lines opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Pilar 1 */}
            <div className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">🛵</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-zinc-900">Envíos Inmediatos</h4>
                <p className="text-[11px] font-medium text-zinc-600 leading-tight">Delivery en Caracas y nacional</p>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shadow-black/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">🏷️</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-zinc-900">Mayor & Detal</h4>
                <p className="text-[11px] font-medium text-zinc-600 leading-tight">Precios directos de importación</p>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">📍</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-zinc-900">Tienda Física</h4>
                <p className="text-[11px] font-medium text-zinc-600 leading-tight">Centro de Caracas (Edif. Arvelo)</p>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shadow-black/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">💬</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-zinc-900">WhatsApp Directo</h4>
                <p className="text-[11px] font-medium text-zinc-600 leading-tight">Respuesta rápida y asesoría</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Franja de Super Ofertas Destacadas (Si existen productos con isOffer) */}
        {offerProducts.length > 0 && (
          <section id="seccion-ofertas" className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-red-500/30 shadow-2xl shadow-zinc-950/20 relative overflow-hidden text-white bg-brand-lines">
            {/* Luces decorativas */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">🔥</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                    Super Ofertas Destacadas
                  </h3>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-md shadow-red-600/40">
                    {offerProducts.length} {offerProducts.length === 1 ? 'Producto' : 'Productos'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Precios especiales por tiempo limitado en artículos seleccionados. ¡Aprovecha estas promociones!
                </p>
              </div>
              <a
                href={buildWhatsAppLink('584244576086', '¡Hola! Quisiera consultar por las súper ofertas destacadas de la tienda')}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-auto min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-extrabold transition-all uppercase tracking-wider shadow-lg shadow-red-600/40 active:scale-95"
              >
                <span>Consultar en WhatsApp</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* Carrusel Deslizable de Tarjetas de Oferta */}
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory">
              {offerProducts.map((offerProd) => {
                const catName = initialCategorias.find((c) => c._id === offerProd.category)?.name || offerProd.category;
                const discountPct = offerProd.priceDetal > (offerProd.offerPrice || 0) 
                  ? Math.round(((offerProd.priceDetal - (offerProd.offerPrice || 0)) / offerProd.priceDetal) * 100)
                  : null;
                const currencySymbol = currency === 'EUR' ? '€' : '$';
                
                const handleOfferWaAction = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const currentOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : catalogOrigin;
                  const dynamicMsg = buildProductWhatsAppMessage({
                    productName: offerProd.name,
                    priceDetal: offerProd.priceDetal,
                    priceMayor: offerProd.priceMayor,
                    minMayor: offerProd.minMayor,
                    isOffer: true,
                    offerPrice: offerProd.offerPrice,
                    symbol: currencySymbol,
                    productId: offerProd._id,
                    imageUrl: offerProd.images[0],
                    origin: currentOrigin,
                  });
                  const targetUrl = buildWhatsAppLink('584244576086', dynamicMsg);
                  trackEventAction('whatsapp_click', offerProd._id).catch(err => console.error("Error tracking click:", err));
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                };

                const offerWaMsg = buildProductWhatsAppMessage({
                  productName: offerProd.name,
                  priceDetal: offerProd.priceDetal,
                  priceMayor: offerProd.priceMayor,
                  minMayor: offerProd.minMayor,
                  isOffer: true,
                  offerPrice: offerProd.offerPrice,
                  symbol: currencySymbol,
                  productId: offerProd._id,
                  imageUrl: offerProd.images[0],
                  origin: catalogOrigin,
                });
                const offerWaUrl = buildWhatsAppLink('584244576086', offerWaMsg);

                return (
                  <div 
                    key={`offer-${offerProd._id}`}
                    onClick={() => setSelectedOfferProduct(offerProd)}
                    className="w-72 sm:w-80 flex-shrink-0 bg-zinc-900/90 border border-zinc-800 hover:border-red-500 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-red-950/40 snap-start cursor-pointer"
                  >
                    {/* Imagen con Badges */}
                    <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                      <img 
                        src={offerProd.images[0] || '/images/chair_red.jpg'} 
                        alt={offerProd.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Badge Oferta / Descuento */}
                      <div className="absolute top-3 left-3 z-10 bg-red-600 border border-red-400 text-white font-black text-xs tracking-wider px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                        <span>🔥 OFERTA</span>
                        {discountPct && (
                          <span className="bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            -{discountPct}%
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 z-10 bg-black/60 border border-white/10 text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase backdrop-blur-md shadow-sm">
                        {catName}
                      </div>

                      {/* Badge de Fotos Disponibles */}
                      {offerProd.images.length > 1 && (
                        <div className="absolute bottom-2.5 right-3 z-10 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm shadow-sm">
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{offerProd.images.length} fotos</span>
                        </div>
                      )}
                    </div>

                    {/* Información y CTA */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                        {offerProd.name}
                      </h4>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                        {offerProd.description}
                      </p>

                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-800">
                        <div>
                          <span className="text-[11px] text-zinc-500 line-through font-mono block">
                            Antes: {currencySymbol}{offerProd.priceDetal.toFixed(2)}
                          </span>
                          <span className="text-xl font-black text-red-500 font-mono">
                            {currencySymbol}{offerProd.offerPrice?.toFixed(2)}
                          </span>
                        </div>
                        <a
                          href={offerWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleOfferWaAction}
                          className="min-h-[44px] px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/30 hover:shadow-red-600/40 active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <span>Pedir</span>
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          
          {/* Columna Izquierda: Filtros de Categoría y Buscador */}
          <aside className="w-full lg:w-80 flex flex-col gap-6 lg:sticky lg:top-8 z-20 hidden lg:flex">
            {/* Buscador */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 flex flex-col gap-3 shadow-sm backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Búsqueda</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/20 text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all duration-300 font-medium text-sm"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selector de Categorías */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 flex flex-col gap-3 shadow-sm backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categorías</h4>
              <nav className="flex flex-col gap-1.5">
                {/* Categoría Todos */}
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                    selectedCategory === 'todos'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 translate-x-1'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'todos' ? 'bg-white' : 'bg-zinc-400 group-hover:bg-red-500 transition-colors'}`}></span>
                    Todos los productos
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-700/80 text-white' : 'bg-zinc-200 text-zinc-700 font-semibold'}`}>
                    {categoryCounts.todos}
                  </span>
                </button>

                {/* Categorías Dinámicas */}
                {initialCategorias.map((cat: Category) => {
                  const isActive = selectedCategory === cat._id;
                  const count = categoryCounts[cat._id] || 0;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30 translate-x-1'
                          : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-400 group-hover:bg-red-500 transition-colors'}`}></span>
                        {cat.name}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${isActive ? 'bg-red-700/80 text-white' : 'bg-zinc-200 text-zinc-700 font-semibold'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Columna Derecha: Catálogo de Productos y Paginación */}
          <div className="flex-1 flex flex-col gap-6 lg:gap-10">
            {/* Mobile Filter & Search Button Trigger + Buscador Rápido */}
            <div className="lg:hidden flex flex-col gap-3 bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Catálogo de Productos</span>
                  <span className="text-xs font-black text-zinc-900">{filteredProducts.length} Productos Disponibles</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-600/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Menú y Filtros
                </button>
              </div>

              {/* Buscador móvil inline */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en el catálogo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-red-500 focus:bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none text-xs font-medium"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Barra de Categorías Horizontal Deslizable para Móviles */}
            <div className="lg:hidden w-full flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
                  Categorías
                </span>
                <span className="text-[10px] text-zinc-500">
                  Desliza 👉
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-none snap-x snap-mandatory">
                <button
                  onClick={() => {
                    setSelectedCategory('todos');
                    setSelectedSubcategory('todos');
                  }}
                  className={`flex-shrink-0 min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer snap-start active:scale-95 ${
                    selectedCategory === 'todos'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-[1.02]'
                      : 'bg-white text-zinc-700 border border-zinc-200 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <span>Todos</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    selectedCategory === 'todos' ? 'bg-red-700 text-white font-bold' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {categoryCounts.todos}
                  </span>
                </button>

                {initialCategorias.map((cat: Category) => {
                  const isActive = selectedCategory === cat._id;
                  const count = categoryCounts[cat._id] || 0;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setSelectedSubcategory('todos');
                      }}
                      className={`flex-shrink-0 min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer snap-start active:scale-95 ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-[1.02]'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:text-zinc-950 hover:bg-zinc-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-red-700 text-white font-bold' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro de Subcategorías / Variantes por Categoría */}
            {selectedCategory !== 'todos' && subcategories.length > 0 && (
              <div className="w-full bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                    Subcategorías / Colecciones
                  </span>
                  {selectedSubcategory !== 'todos' && (
                    <button
                      onClick={() => setSelectedSubcategory('todos')}
                      className="text-[10px] text-red-600 hover:text-red-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Limpiar Filtro
                    </button>
                  )}
                </div>
                
                {/* Contenedor con Scroll Lateral Suave */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
                  {/* Botón Ver Todo */}
                  <button
                    onClick={() => setSelectedSubcategory('todos')}
                    className={`flex-shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
                      selectedSubcategory === 'todos'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                    }`}
                  >
                    Ver Todo
                  </button>

                  {/* Botones de subcategorías */}
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(subcat)}
                      className={`flex-shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
                        selectedSubcategory === subcat
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid de Productos */}
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {paginatedProducts.map((prod: Product) => {
                  const categoryObj = initialCategorias.find((c) => c._id === prod.category);
                  const categoryName = categoryObj ? categoryObj.name : prod.category;
                  return (
                    <ProductCard 
                      key={prod._id} 
                      product={prod} 
                      categoryName={categoryName} 
                      currency={currency}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="w-full py-20 flex flex-col items-center justify-center text-center rounded-3xl bg-white border border-zinc-200 shadow-sm">
                <svg className="w-16 h-16 text-zinc-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-zinc-800">No encontramos productos</h3>
                <p className="text-zinc-500 text-sm mt-1">Prueba cambiando la búsqueda o el filtro de categoría.</p>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(p - 1, 1));
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="w-11 h-11 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:border-red-500/50 hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm text-zinc-700"
                  aria-label="Página anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-11 h-11 rounded-xl font-bold transition-all duration-300 shadow-sm ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(p + 1, totalPages));
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:border-red-500/50 hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm text-zinc-700"
                  aria-label="Siguiente página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sección de Ubicación y Contacto con diseño luminoso premium y halos de marca */}
      <section id="ubicacion" className="w-full py-20 bg-gradient-to-b from-white via-zinc-100 to-zinc-900 border-t border-zinc-200 scroll-mt-20 relative overflow-hidden text-zinc-900">
        {/* Halos decorativos de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
          
          <div className="text-center max-w-2xl mb-12">
            <span className="text-xs text-red-600 font-bold uppercase tracking-[0.2em] block mb-2">Contacto & Visitas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 mb-3">Ubicación y Contacto</h2>
            <p className="text-zinc-600 text-xs sm:text-sm">
              Visítanos en nuestra tienda física o contáctanos a través de nuestras líneas de atención directa.
            </p>
          </div>

          {/* Mapa Responsivo */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden border border-zinc-200 shadow-xl">
            <iframe
              src={mapUrl || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve'}
              className="w-full h-full border-0"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Ubicación Tío Willy"
            ></iframe>
          </div>

          {/* Botón de Acción Directa ("¿Cómo llegar?") */}
          <a
            href="https://www.google.com/maps/place/Edificio+Arvelo/@10.5062937,-66.9130259,20.46z/data=!4m6!3m5!1s0x8c2a5f0019dc6fb7:0x261466dc19753595!8m2!3d10.5063117!4d-66.9132688!16s%2Fg%2F11xkw4cns7?entry=ttu&g_ep=EgoyMDI2MDgxOS4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full max-w-md py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md shadow-red-600/30 active:scale-[0.98] text-xs sm:text-sm cursor-pointer select-none"
            title="Cómo llegar con Google Maps"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>¿Cómo llegar a la tienda?</span>
          </a>

          {/* Información de Ubicación y Contacto justo debajo del mapa */}
          <div className="mt-8 w-full max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 text-left flex flex-col gap-4 shadow-sm backdrop-blur-md">
            
            {/* Dirección */}
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">📍</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ubicación Física</span>
                <p className="text-zinc-900 text-sm sm:text-base font-bold leading-relaxed">
                  Centro de Caracas, Esquina de Torres a Madrices, Edificio Arvelo, PB, Locales 1-2 y 3.
                </p>
              </div>
            </div>

            {/* Referencia */}
            <div className="flex items-start gap-3 pl-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Punto de Referencia</span>
                <p className="text-zinc-700 text-sm font-medium leading-relaxed">
                  Frente a la Panadería Picadelli (Catedral / Plaza Bolívar).
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-zinc-200 my-1"></div>

            {/* Contactos */}
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">📞</span>
              <div className="flex flex-col gap-2 w-full">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Líneas de Atención Directa</span>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm sm:text-base font-bold">
                  {/* Numero 1 */}
                  <div className="flex items-center gap-2 bg-zinc-50 px-3.5 py-2 rounded-xl border border-zinc-200">
                    <span className="text-zinc-900 font-mono">0424-4576086</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <a
                        href="tel:+584244576086"
                        className="w-8 h-8 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Llamar por teléfono"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?phone=584244576086"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 border border-emerald-200"
                        title="Enviar WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  <span className="text-zinc-400 font-mono hidden sm:inline">/</span>

                  {/* Numero 2 */}
                  <div className="flex items-center gap-2 bg-zinc-50 px-3.5 py-2 rounded-xl border border-zinc-200">
                    <span className="text-zinc-900 font-mono">0424-1439324</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <a
                        href="tel:+584241439324"
                        className="w-8 h-8 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Llamar por teléfono"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?phone=584241439324"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 border border-emerald-200"
                        title="Enviar WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Redes Sociales Oficiales */}
                <div className="h-[1px] bg-zinc-200 my-1"></div>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">🌐</span>
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Redes Sociales Oficiales</span>
                    <p className="text-xs text-zinc-600">Síguenos para enterarte de nuevos ingresos, promociones y videos en vivo:</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 transition-all active:scale-95 shadow-sm"
                      >
                        <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </span>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-900 group-hover:text-red-600 transition-colors">TikTok</span>
                          <span className="text-[10px] text-zinc-500 font-mono">@hogaryjuguetestiowilly</span>
                        </div>
                      </a>

                      <a
                        href="https://www.instagram.com/hogaryjuguetestiowilly"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-pink-300 hover:bg-zinc-100 transition-all active:scale-95 shadow-sm"
                      >
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </span>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-900 group-hover:text-pink-600 transition-colors">Instagram</span>
                          <span className="text-[10px] text-zinc-500 font-mono">@hogaryjuguetestiowilly</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer en Acabado Obsidian Elegante */}
      <footer className="w-full py-12 border-t border-zinc-800 bg-zinc-950 text-center text-zinc-400 text-sm flex flex-col items-center gap-3">
        <LogoTioWilly className="scale-75 opacity-90 mb-1" />

        {/* Social Icons Bar in Footer */}
        <div className="flex items-center gap-3 my-2">
          <a
            href="https://www.tiktok.com/@hogaryjuguetestiowilly"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-md"
            title="TikTok Oficial"
            aria-label="TikTok Oficial"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/hogaryjuguetestiowilly"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-pink-400 flex items-center justify-center transition-all active:scale-95 shadow-md"
            title="Instagram Oficial"
            aria-label="Instagram Oficial"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=584244576086"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-95 shadow-md"
            title="WhatsApp Directo"
            aria-label="WhatsApp Directo"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
            </svg>
          </a>
        </div>

        <p className="mt-2 text-zinc-400">© 2026 Home and Toys Tío Willy. Todos los derechos reservados.</p>
        <p className="text-xs text-zinc-500 italic">Desarrollado con pasión para una experiencia de compra premium.</p>
        <a 
          href="/admin" 
          className="text-xs text-red-500 hover:text-red-400 transition-colors duration-300 uppercase tracking-widest font-bold mt-2 hover:underline"
        >
          Acceso Administrador
        </a>
      </footer>

      {/* Modal para producto seleccionado en sección Super Ofertas */}
      {selectedOfferProduct && (
        <ProductDetailModal
          product={selectedOfferProduct}
          categoryName={
            initialCategorias.find((c) => c._id === selectedOfferProduct.category)?.name ||
            selectedOfferProduct.category
          }
          currency={currency}
          onClose={() => setSelectedOfferProduct(null)}
        />
      )}

      {/* Modal para producto enlazado directamente por URL (?p=ID&v=INDEX) */}
      {selectedUrlProduct && (
        <ProductDetailModal
          product={selectedUrlProduct}
          categoryName={
            initialCategorias.find((c) => c._id === selectedUrlProduct.category)?.name ||
            selectedUrlProduct.category
          }
          currency={currency}
          initialActiveIdx={selectedUrlVarietyIdx}
          onClose={() => setSelectedUrlProduct(null)}
        />
      )}
    </div>
  );
}
