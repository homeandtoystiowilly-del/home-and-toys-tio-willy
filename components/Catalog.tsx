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
}

export interface Category {
  _id: string;
  name: string;
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
      <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white leading-none select-none flex items-center font-sans drop-shadow-sm">
        H
        <span className="relative inline-flex items-center justify-center">
          O
          <span className="absolute w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75"></span>
          <span className="absolute w-2 h-2 rounded-full bg-white animate-pulse"></span>
        </span>
        ME
      </h1>
      
      {/* AND TOYS */}
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-[#FF2D2D] leading-none select-none mt-1 font-sans drop-shadow-[0_0_8px_rgba(255,45,45,0.4)]">
        AND TOYS
      </h2>
      
      {/* Línea Divisora con resplandor central rojo */}
      <div className="w-52 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 opacity-90"></div>
      
      {/* TÍO WILLY */}
      <h3 className="text-lg md:text-xl font-bold tracking-[0.35em] text-white leading-none select-none font-sans uppercase">
        Tío Willy
      </h3>
    </div>
  );
}

// Subcomponente para cada Tarjeta de Producto (Exportado para vista previa en admin)
export function ProductCard({ product, categoryName, currency = 'USD' }: { product: Product; categoryName?: string; currency?: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

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

  const symbol = currency === 'EUR' ? '€' : '$';
  const isOfferActive = !!(product.isOffer && product.offerPrice && product.offerPrice > 0);

  // Enlace de WhatsApp
  const phone = '584244576086'; // Número del cliente
  const textMessage = isOfferActive
    ? `Hola Tío Willy, me interesa consultar por la *OFERTA ESPECIAL* del producto:\n\n📌 *${product.name}*\n- *Variedad:* ${currentVariety}\n- *Precio de Oferta:* ${symbol}${product.offerPrice!.toFixed(2)} (Antes ${symbol}${product.priceDetal.toFixed(2)})\n- *Precio Mayor:* ${symbol}${product.priceMayor.toFixed(2)} (A partir de ${product.minMayor} unidades)\n\n¿Tienen stock disponible?`
    : `Hola Tío Willy, me interesa consultar por el producto:\n\n*${product.name}*\n- *Variedad:* ${currentVariety}\n- *Precio Detal:* ${symbol}${product.priceDetal.toFixed(2)}\n- *Precio Mayor:* ${symbol}${product.priceMayor.toFixed(2)} (A partir de ${product.minMayor} unidades)\n\n¿Tienen stock disponible?`;
  
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMessage)}`;

  return (
    <div 
      onClick={() => setIsModalOpen(true)}
      className="group relative flex flex-col rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-red-500/50 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-950/20 shadow-black/40 cursor-pointer backdrop-blur-sm"
    >
      {/* Carrusel de Imágenes con soporte híbrido de gestos swipe */}
      <div 
        className="relative aspect-square w-full bg-zinc-850 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={currentImage} 
          alt={`${product.name} - ${currentVariety}`}
          className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105"
        />
        
        {/* Sombreado de degradado */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-70"></div>

        {/* Flechas de navegación (visibles en hover o móviles siempre) */}
        {product.images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none shadow-md shadow-black/50 border border-zinc-700/60"
              aria-label="Imagen anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none shadow-md shadow-black/50 border border-zinc-700/60"
              aria-label="Siguiente imagen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicadores de variedad / dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {product.images.map((_, idx: number) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === activeIdx ? 'bg-red-500 w-4' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Ver variedad ${idx + 1}`}
            />
          ))}
        </div>

        {/* Categoría Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-zinc-900/90 border border-red-500/30 rounded-full backdrop-blur-md shadow-sm">
            {categoryName || product.category}
          </span>
        </div>

        {/* Badge de Oferta Especial */}
        {isOfferActive && (
          <div className="absolute top-4 right-4 z-10 bg-red-600 border border-red-400 text-white font-black text-xs tracking-wider px-3 py-1 rounded-full uppercase shadow-lg shadow-black/60 flex items-center gap-1.5 backdrop-blur-sm">
            <span>🔥 OFERTA</span>
            {product.priceDetal > (product.offerPrice || 0) && (
              <span className="bg-zinc-900/80 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                -{Math.round(((product.priceDetal - (product.offerPrice || 0)) / product.priceDetal) * 100)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-red-400 transition-colors duration-300 min-h-[56px] line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-zinc-400 text-sm mt-2 line-clamp-2 min-h-[40px]">
          {product.description}
        </p>

        {/* Selección Rápida de Variedades por Texto/Color */}
        {product.varieties.length > 1 && (
          <div className="mt-4">
            <span className="text-xs text-zinc-400 block mb-1.5 uppercase font-bold tracking-wider">Variedad:</span>
            <div className="flex flex-wrap gap-1.5">
              {product.varieties.map((varName: string, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(idx);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-300 ${
                    idx === activeIdx
                      ? 'bg-red-950/50 text-red-400 border-red-500/60 font-semibold'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700/80 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {varName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Espaciador */}
        <div className="flex-1 min-h-[20px]"></div>

        {/* Precios */}
        <div className="mt-4 p-4 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 flex flex-col gap-2.5">
          {isOfferActive ? (
            <div className="flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 line-through font-mono">
                  Antes: {symbol}{product.priceDetal.toFixed(2)}
                </span>
                <span className="text-xs text-red-500 font-bold uppercase tracking-wide flex items-center gap-1">
                  <span>🔥 Oferta:</span>
                </span>
              </div>
              <span className="text-2xl font-black text-red-500 font-mono">
                {symbol}{product.offerPrice!.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Precio Detal:</span>
              <span className="text-2xl font-black text-white font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
            </div>
          )}
          
          <div className="h-[1px] bg-zinc-800/60"></div>
          <div className="flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-xs text-red-500 font-bold uppercase tracking-wide">Precio Mayor:</span>
              <span className="text-[10px] text-zinc-500 italic">Mínimo {product.minMayor} unidades</span>
            </div>
            <span className="text-xl font-black text-red-400 font-mono">{symbol}{product.priceMayor.toFixed(2)}</span>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            trackEventAction('whatsapp_click', product._id).catch(err => console.error("Error tracking click:", err));
          }}
          className="mt-5 w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          {/* WhatsApp Icon */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
          </svg>
          Pedir por WhatsApp
        </a>
      </div>

      {/* Modal flotante de información completa del producto */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md transition-all duration-300 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          {/* Tarjeta del Modal */}
          <div 
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black relative flex flex-col max-h-[90vh] md:max-h-[85vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de Cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer focus:outline-none border border-zinc-800 shadow-md"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenedor de Contenido con Scroll */}
            <div className="overflow-y-auto flex flex-col md:flex-row gap-6 p-6 sm:p-8">
              
              {/* Columna Izquierda: Galería/Carrusel del Producto */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div 
                  className="relative aspect-square w-full bg-zinc-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none border border-zinc-900"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={currentImage} 
                    alt={`${product.name} - ${currentVariety}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-40"></div>

                  {product.images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md focus:outline-none shadow-md"
                        aria-label="Imagen anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md focus:outline-none shadow-md"
                        aria-label="Siguiente imagen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Puntos del Carrusel */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                    {product.images.map((_, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIdx(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx === activeIdx ? 'bg-red-500 w-4' : 'bg-white/40 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Categoría Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-500/30 rounded-full">
                    {categoryName || product.category}
                  </span>
                </div>
              </div>

              {/* Columna Derecha: Información Detallada */}
              <div className="w-full md:w-1/2 flex flex-col justify-between gap-5 text-left">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
                    {product.name}
                  </h3>
                  
                  {/* Selección de Variedades en Modal */}
                  {product.varieties.length > 1 && (
                    <div className="mt-4">
                      <span className="text-[10px] text-zinc-500 block mb-2 uppercase font-extrabold tracking-wider">Variedades disponibles:</span>
                      <div className="flex flex-wrap gap-2">
                        {product.varieties.map((varName: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveIdx(idx);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-300 font-medium ${
                              idx === activeIdx
                                ? 'bg-red-950/40 text-red-400 border-red-500/50'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {varName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-[1px] bg-zinc-900 my-4"></div>

                  <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-extrabold tracking-wider">Descripción del Producto:</span>
                  <p className="text-zinc-350 text-sm leading-relaxed whitespace-pre-line font-medium overflow-y-auto max-h-[150px] md:max-h-[220px] pr-2 scrollbar-thin">
                    {product.description}
                  </p>
                </div>

                <div>
                  {/* Caja de Precios en el Modal */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 flex flex-col gap-2.5">
                    {isOfferActive ? (
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-500 line-through font-mono">
                            Antes: {symbol}{product.priceDetal.toFixed(2)}
                          </span>
                          <span className="text-xs text-red-500 font-bold uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                            <span>🔥 Precio de Oferta:</span>
                            {product.priceDetal > (product.offerPrice || 0) && (
                              <span className="bg-red-950/80 text-red-400 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                                -{Math.round(((product.priceDetal - (product.offerPrice || 0)) / product.priceDetal) * 100)}% DCTO
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-3xl font-black text-red-500 font-mono animate-pulse">
                          {symbol}{product.offerPrice!.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Precio Detal:</span>
                        <span className="text-2xl font-black text-white font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="h-[1px] bg-zinc-800/40"></div>
                    <div className="flex justify-between items-baseline">
                      <div className="flex flex-col">
                        <span className="text-xs text-red-500 font-bold uppercase tracking-wide">Precio Mayor:</span>
                        <span className="text-[10px] text-zinc-500 italic">Mínimo {product.minMayor} unidades</span>
                      </div>
                      <span className="text-xl font-black text-red-400 font-mono">{symbol}{product.priceMayor.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Enlace WhatsApp de Compra */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEventAction('whatsapp_click', product._id).catch(err => console.error("Error tracking click:", err));
                    }}
                    className="mt-4 w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-[0.98] focus:outline-none"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                    </svg>
                    Pedir por WhatsApp
                  </a>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Función auxiliar para extraer subcategorías de forma dinámica
function getSubcategoriesForCategory(productsInCategory: Product[], categoriesList: Category[]) {
  const subcats = new Set<string>();
  
  productsInCategory.forEach(product => {
    // 0. Priorizar la subcategoría manual si existe
    if (product.subcategory && product.subcategory.trim().length > 0) {
      subcats.add(product.subcategory.trim());
      return;
    }

    const nameLower = product.name.toLowerCase();
    
    // 1. Tamaños de Rin (Bicicletas y Juguetes con ruedas)
    const rinMatch = product.name.match(/Rin\s*\d+/i);
    if (rinMatch) {
      const normalized = rinMatch[0].replace(/\s+/g, ' ').toUpperCase(); // "RIN 16"
      subcats.add(normalized);
      return;
    }
    
    // 2. Coincidencias de Rin implícitas
    if (nameLower.includes('rin 12')) { subcats.add('Rin 12'); return; }
    if (nameLower.includes('rin 16')) { subcats.add('Rin 16'); return; }
    if (nameLower.includes('rin 20')) { subcats.add('Rin 20'); return; }
    if (nameLower.includes('rin 24')) { subcats.add('Rin 24'); return; }
    if (nameLower.includes('rin 26')) { subcats.add('Rin 26'); return; }
    if (nameLower.includes('rin 29')) { subcats.add('Rin 29'); return; }

    // 3. Agrupaciones de Tecnología
    if (nameLower.includes('auricular') || nameLower.includes('audifono') || nameLower.includes('headphone') || nameLower.includes('cornetas bluetooth') || nameLower.includes('audífonos')) {
      subcats.add('Audio');
      return;
    }
    if (nameLower.includes('teclado') || nameLower.includes('keyboard')) {
      subcats.add('Teclados');
      return;
    }
    if (nameLower.includes('mouse') || nameLower.includes('raton') || nameLower.includes('ratón')) {
      subcats.add('Mouses');
      return;
    }
    if (nameLower.includes('cargador') || nameLower.includes('powerbank') || nameLower.includes('bateria') || nameLower.includes('batería')) {
      subcats.add('Cargadores');
      return;
    }
    if (nameLower.includes('reloj') || nameLower.includes('smartwatch') || nameLower.includes('pulsera')) {
      subcats.add('Relojes');
      return;
    }

    // 4. Agrupaciones de Juguetes
    if (nameLower.includes('robot') || nameLower.includes('interactivo')) {
      subcats.add('Robots y Tech');
      return;
    }
    if (nameLower.includes('muñec') || nameLower.includes('barbie') || nameLower.includes('lol')) {
      subcats.add('Muñecas');
      return;
    }
    if (nameLower.includes('carro') || nameLower.includes('pista') || nameLower.includes('auto') || nameLower.includes('camion') || nameLower.includes('camión')) {
      subcats.add('Vehículos');
      return;
    }
    if (nameLower.includes('juego de mesa') || nameLower.includes('monopoly') || nameLower.includes('ludo') || nameLower.includes('rompecabezas') || nameLower.includes('puzzle')) {
      subcats.add('Juegos de Mesa');
      return;
    }
    if (nameLower.includes('lego') || nameLower.includes('bloques') || nameLower.includes('armar')) {
      subcats.add('Construcción');
      return;
    }

    // 5. Agrupaciones de Hogar
    if (nameLower.includes('silla') || nameLower.includes('sillon') || nameLower.includes('sillón') || nameLower.includes('mueble') || nameLower.includes('escritorio')) {
      subcats.add('Muebles');
      return;
    }
    if (nameLower.includes('lampara') || nameLower.includes('lámpara') || nameLower.includes('led') || nameLower.includes('luz')) {
      subcats.add('Iluminación');
      return;
    }
    if (nameLower.includes('organizador') || nameLower.includes('estante') || nameLower.includes('repisa') || nameLower.includes('caja')) {
      subcats.add('Organizadores');
      return;
    }
    if (nameLower.includes('cocina') || nameLower.includes('licuadora') || nameLower.includes('sarten') || nameLower.includes('olla') || nameLower.includes('vaso')) {
      subcats.add('Cocina');
      return;
    }

    // Fallback: usar la primera palabra del nombre si califica como término válido
    const words = product.name.trim().split(/\s+/);
    if (words.length > 0) {
      const firstWord = words[0];
      const capitalized = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      if (capitalized.length > 2 && !['con', 'del', 'para', 'los', 'las', 'uno', 'una'].includes(capitalized.toLowerCase())) {
        subcats.add(capitalized);
        return;
      }
    }
    
    subcats.add('Otros');
  });

  return Array.from(subcats).sort((a, b) => {
    // Si contiene "Rin", ordenar numéricamente
    const aRin = a.match(/\d+/);
    const bRin = b.match(/\d+/);
    if (aRin && bRin) {
      return parseInt(aRin[0]) - parseInt(bRin[0]);
    }
    if (a === 'Otros') return 1;
    if (b === 'Otros') return -1;
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
    secondaryLink: 'https://wa.me/584244576086'
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
    secondaryLink: 'https://wa.me/584244576086?text=¡Hola!%20Deseo%20cotizar%20compras%20al%20mayor%20en%20Home%20and%20Toys%20Tío%20Willy.'
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
    secondaryLink: 'https://wa.me/584244576086?text=¡Hola!%20Me%20interesa%20conocer%20las%20ofertas%20especiales%20disponibles.'
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
    return getSubcategoriesForCategory(productsInCategory, initialCategorias);
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
        // Criterio 0: Prioridad a la subcategoría manual si existe
        if (p.subcategory && p.subcategory.trim().length > 0) {
          return p.subcategory.trim().toLowerCase() === selectedSubcategory.toLowerCase();
        }

        const nameLower = p.name.toLowerCase();
        const subcatLower = selectedSubcategory.toLowerCase();

        // Criterio 1: Rin (ej: Rin 16)
        if (subcatLower.startsWith('rin')) {
          const cleanSub = subcatLower.replace(/\s+/g, '');
          const cleanName = nameLower.replace(/\s+/g, '');
          return cleanName.includes(cleanSub);
        }

        // Criterio 2: Coincidencia de etiquetas/clasificaciones preestablecidas
        if (selectedSubcategory === 'Audio') {
          return nameLower.includes('auricular') || nameLower.includes('audifono') || nameLower.includes('headphone') || nameLower.includes('cornetas bluetooth') || nameLower.includes('audífonos');
        }
        if (selectedSubcategory === 'Teclados') {
          return nameLower.includes('teclado') || nameLower.includes('keyboard');
        }
        if (selectedSubcategory === 'Mouses') {
          return nameLower.includes('mouse') || nameLower.includes('raton') || nameLower.includes('ratón');
        }
        if (selectedSubcategory === 'Cargadores') {
          return nameLower.includes('cargador') || nameLower.includes('powerbank') || nameLower.includes('bateria') || nameLower.includes('batería');
        }
        if (selectedSubcategory === 'Relojes') {
          return nameLower.includes('reloj') || nameLower.includes('smartwatch') || nameLower.includes('pulsera');
        }
        if (selectedSubcategory === 'Robots y Tech') {
          return nameLower.includes('robot') || nameLower.includes('interactivo');
        }
        if (selectedSubcategory === 'Muñecas') {
          return nameLower.includes('muñec') || nameLower.includes('barbie') || nameLower.includes('lol');
        }
        if (selectedSubcategory === 'Vehículos') {
          return nameLower.includes('carro') || nameLower.includes('pista') || nameLower.includes('auto') || nameLower.includes('camion') || nameLower.includes('camión');
        }
        if (selectedSubcategory === 'Juegos de Mesa') {
          return nameLower.includes('juego de mesa') || nameLower.includes('monopoly') || nameLower.includes('ludo') || nameLower.includes('rompecabezas') || nameLower.includes('puzzle');
        }
        if (selectedSubcategory === 'Construcción') {
          return nameLower.includes('lego') || nameLower.includes('bloques') || nameLower.includes('armar');
        }
        if (selectedSubcategory === 'Muebles') {
          return nameLower.includes('silla') || nameLower.includes('sillon') || nameLower.includes('sillón') || nameLower.includes('mueble') || nameLower.includes('escritorio');
        }
        if (selectedSubcategory === 'Iluminación') {
          return nameLower.includes('lampara') || nameLower.includes('lámpara') || nameLower.includes('led') || nameLower.includes('luz');
        }
        if (selectedSubcategory === 'Organizadores') {
          return nameLower.includes('organizador') || nameLower.includes('estante') || nameLower.includes('repisa') || nameLower.includes('caja');
        }
        if (selectedSubcategory === 'Cocina') {
          return nameLower.includes('cocina') || nameLower.includes('licuadora') || nameLower.includes('sarten') || nameLower.includes('olla') || nameLower.includes('vaso');
        }

        // Fallback: coincidencia general por texto
        return nameLower.includes(subcatLower);
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
    <div className="min-h-screen bg-[#121216] text-white font-sans selection:bg-red-600 selection:text-white relative bg-brand-lines">
      {/* Aviso de cierre de sesión por inactividad */}
      {showInactivityAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-pulse duration-700">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/95 border border-red-500/40 text-red-500 shadow-2xl shadow-black/60 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide">
            <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Sesión cerrada por inactividad</span>
            <button
              onClick={() => setShowInactivityAlert(false)}
              className="text-zinc-500 hover:text-white transition-colors focus:outline-none ml-2 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Sticky Top Navbar de Alta Gama */}
      <nav className="sticky top-0 z-30 w-full bg-zinc-900/95 border-b border-zinc-800/90 backdrop-blur-xl transition-all shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* 1. Logo Compacto de Alta Jerarquía */}
          <a href="#" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-red-600/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/30' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer"
            >
              Ubicación
            </button>
          </div>

          {/* 3. Grupo de Conversión y Redes Sociales */}
          <div className="flex items-center gap-2.5">
            
            {/* Redes Sociales Oficiales con Badges Circulares */}
            <div className="hidden sm:flex items-center gap-1.5 pr-1 border-r border-zinc-700/60">
              <a
                href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-800/90 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm group"
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
                className="w-9 h-9 rounded-full bg-zinc-800/90 border border-zinc-700 hover:border-pink-500/50 hover:bg-zinc-700 text-zinc-300 hover:text-pink-400 flex items-center justify-center transition-all active:scale-95 shadow-sm group"
                title="Instagram Oficial @hogaryjuguetestiowilly"
                aria-label="Instagram Oficial"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            {/* Botón WhatsApp de Alto Impacto */}
            <a 
              href="https://wa.me/584244576086"
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
              className="lg:hidden w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 rounded-xl border border-zinc-700 transition-all focus:outline-none cursor-pointer"
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
          className={`absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        ></div>

        {/* Panel lateral */}
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85%] bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Cabecera del menú */}
          <div className="flex items-center justify-between">
            <span className="font-extrabold tracking-widest text-[10px] uppercase text-zinc-400">Navegación / Filtros</span>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Generando Catálogo PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-red-500/80 text-white placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categorías dentro del menú móvil */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categorías</span>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[45vh] pr-1">
              <button
                onClick={() => { setSelectedCategory('todos'); setIsDrawerOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-xs ${
                  selectedCategory === 'todos'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/20'
                    : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
                }`}
              >
                <span>Todos los productos</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-700 text-white' : 'bg-zinc-700 text-zinc-300 font-bold'}`}>
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
                        ? 'bg-red-600 text-white shadow-lg shadow-red-950/20'
                        : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-red-700 text-white' : 'bg-zinc-700 text-zinc-300 font-bold'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-800"></div>

          {/* Información de contacto y Redes Sociales */}
          <div className="mt-auto flex flex-col gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-center">Atención al Cliente</span>
            <a
              href="https://wa.me/584244576086"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-3 bg-red-600 hover:bg-red-500 border border-red-500/30 text-white rounded-xl font-bold text-center text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-950/40"
            >
              <span>📞 +58 424 457 6086</span>
            </a>

            {/* Redes Sociales Drawer */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-center">Síguenos Oficial</span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
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
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 hover:border-pink-500/50 text-zinc-200 hover:text-pink-400 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
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
        className="relative w-full min-h-[500px] md:min-h-[560px] overflow-hidden flex flex-col items-center justify-center border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-[#15151a] to-zinc-900 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Malla Geométrica y Figuras Decorativas de Fondo con Aura Radial */}
        <div className="absolute inset-0 bg-brand-grid opacity-75 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,_rgba(255,45,45,0.22)_0%,_transparent_65%)] pointer-events-none"></div>
        
        {/* Figuras geométricas y luces volumétricas */}
        <div className="absolute top-8 left-10 w-80 h-80 bg-red-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-8 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/4 right-[9%] w-36 h-36 border border-red-500/20 rounded-3xl rotate-12 pointer-events-none hidden lg:block backdrop-blur-[1px]"></div>
        <div className="absolute bottom-1/4 left-[7%] w-28 h-28 border border-zinc-700/40 rounded-2xl -rotate-6 pointer-events-none hidden lg:block backdrop-blur-[1px]"></div>

        {/* Cápsulas Flotantes de Colección (Floating Feature Pills en Desktop) */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-zinc-700/80 backdrop-blur-md shadow-2xl shadow-black/50 text-xs font-bold text-zinc-200 absolute top-28 left-8 xl:left-14 animate-float-slow z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-base shrink-0">🚴‍♂️</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Bicicletas</span>
            <span className="text-white text-xs font-black">Rin 12 a Rin 29</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-zinc-700/80 backdrop-blur-md shadow-2xl shadow-black/50 text-xs font-bold text-zinc-200 absolute top-24 right-8 xl:right-14 animate-float-reverse z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-base shrink-0">🎧</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Tecnología</span>
            <span className="text-white text-xs font-black">Audio & Gaming</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-zinc-700/80 backdrop-blur-md shadow-2xl shadow-black/50 text-xs font-bold text-zinc-200 absolute bottom-24 left-10 xl:left-16 animate-float-reverse z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-base shrink-0">📦</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Mayoristas</span>
            <span className="text-white text-xs font-black">Tarifas de Fábrica</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/85 border border-zinc-700/80 backdrop-blur-md shadow-2xl shadow-black/50 text-xs font-bold text-zinc-200 absolute bottom-20 right-10 xl:right-16 animate-float-slow z-20 pointer-events-none">
          <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-base shrink-0">⚡</span>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850/80 border border-zinc-700/70 text-[11px] font-bold text-zinc-300 whitespace-nowrap backdrop-blur-xs">
            <span>🚴‍♂️</span> Bicicletas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850/80 border border-zinc-700/70 text-[11px] font-bold text-zinc-300 whitespace-nowrap backdrop-blur-xs">
            <span>🎧</span> Audio & Tech
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850/80 border border-zinc-700/70 text-[11px] font-bold text-zinc-300 whitespace-nowrap backdrop-blur-xs">
            <span>📦</span> Mayor & Detal
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850/80 border border-zinc-700/70 text-[11px] font-bold text-zinc-300 whitespace-nowrap backdrop-blur-xs">
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
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-black uppercase tracking-widest mb-3 shadow-xl shadow-red-950/50 animate-pulse">
                    <span>{slide.badge}</span>
                  </div>
                </div>

                {/* Título Principal */}
                <h2 className={`text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight max-w-2xl leading-tight transition-all duration-700 delay-200 transform drop-shadow-md ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                  {slide.title}
                </h2>

                {/* Highlight / Subtítulo Corporativo */}
                <p className={`text-red-400 font-black text-sm sm:text-base tracking-wider uppercase mt-2.5 transition-all duration-700 delay-300 transform drop-shadow-sm ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  {slide.highlight}
                </p>

                {/* Descripción */}
                <p className={`mt-3 text-zinc-300 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed transition-all duration-700 delay-400 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  {slide.description}
                </p>

                {/* Botones de acción del slide (Touch targets >= 44px con feedback elástico) */}
                <div className={`mt-6 flex flex-wrap items-center justify-center gap-3.5 transition-all duration-700 delay-500 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                  {slide.isPdfAction ? (
                    <button
                      onClick={handleGenerateCatalogPDF}
                      disabled={pdfLoading}
                      className="min-h-[46px] px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-xl shadow-red-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
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
                      className="min-h-[46px] px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-xl shadow-red-950/60 flex items-center gap-2 active:scale-95"
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
                    className="min-h-[46px] px-6 py-3 rounded-xl bg-zinc-800/95 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-lg shadow-black/30"
                  >
                    <span>{slide.secondaryText}</span>
                    <svg className="w-4 h-4 fill-current text-red-500" viewBox="0 0 24 24">
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-800/90 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hidden sm:flex active:scale-95"
          aria-label="Slide anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-800/90 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hidden sm:flex active:scale-95"
          aria-label="Siguiente slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicadores Cinemáticos con Barra de Progreso en Vivo (Estilo Apple / Tesla Store) */}
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
                  <div className="w-16 sm:w-20 h-2 bg-zinc-800/90 border border-zinc-700/80 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      key={`progress-${currentHeroSlide}`}
                      className={`h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full animate-hero-progress ${
                        isHeroPaused ? 'animation-paused' : ''
                      }`}
                    />
                  </div>
                ) : (
                  <span className="w-3 h-2 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-all block" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Franja de Ritmo Claro / Neutro: Pilares y Confianza de Marca */}
      <section className="relative z-20 w-full bg-gradient-to-r from-zinc-100 via-white to-zinc-100 border-y border-zinc-300 py-6 sm:py-7 text-zinc-900 shadow-xl overflow-hidden">
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
          <section id="seccion-ofertas" className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-red-950/20 via-zinc-900/90 to-zinc-900/90 border border-red-500/30 shadow-2xl shadow-red-950/20 relative overflow-hidden bg-brand-lines">
            {/* Luces decorativas */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">🔥</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                    Super Ofertas Destacadas
                  </h3>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {offerProducts.length} {offerProducts.length === 1 ? 'Producto' : 'Productos'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Precios especiales por tiempo limitado en artículos seleccionados. ¡Aprovecha estas promociones!
                </p>
              </div>
              <a
                href="https://wa.me/584244576086?text=¡Hola!%20Quisiera%20consultar%20por%20las%20super%20ofertas%20destacadas%20de%20la%20tienda"
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-auto min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-extrabold transition-all uppercase tracking-wider shadow-lg shadow-red-950/60 active:scale-95"
              >
                <span>Consultar en WhatsApp</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* Carrusel Deslizable de Tarjetas de Oferta */}
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory">
              {offerProducts.map((offerProd) => {
                const catName = initialCategorias.find((c) => c._id === offerProd.category)?.name || offerProd.category;
                const discountPct = offerProd.priceDetal > (offerProd.offerPrice || 0) 
                  ? Math.round(((offerProd.priceDetal - (offerProd.offerPrice || 0)) / offerProd.priceDetal) * 100)
                  : null;
                const currencySymbol = currency === 'EUR' ? '€' : '$';
                const offerWaMsg = `Hola Tío Willy, quiero comprar en *OFERTA* el producto:\n\n🔥 *${offerProd.name}*\n🏷️ *Precio Especial:* ${currencySymbol}${offerProd.offerPrice?.toFixed(2)} (Antes ${currencySymbol}${offerProd.priceDetal.toFixed(2)})\n\n¿Tienen disponibilidad inmediata?`;
                const offerWaUrl = `https://wa.me/584244576086?text=${encodeURIComponent(offerWaMsg)}`;

                return (
                  <div 
                    key={`offer-${offerProd._id}`}
                    className="w-72 sm:w-80 flex-shrink-0 bg-zinc-900/95 border border-red-500/40 hover:border-red-500 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-red-950/50 snap-start"
                  >
                    {/* Imagen con Badges */}
                    <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                      <img 
                        src={offerProd.images[0] || '/images/chair_red.jpg'} 
                        alt={offerProd.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Badge Oferta / Descuento */}
                      <div className="absolute top-3 left-3 z-10 bg-red-600 border border-red-400 text-white font-black text-xs tracking-wider px-3 py-1 rounded-full uppercase shadow-lg shadow-black/80 flex items-center gap-1.5 backdrop-blur-sm">
                        <span>🔥 OFERTA</span>
                        {discountPct && (
                          <span className="bg-zinc-950/60 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            -{discountPct}%
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 z-10 bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase backdrop-blur-sm">
                        {catName}
                      </div>
                    </div>

                    {/* Información y CTA */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                        {offerProd.name}
                      </h4>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                        {offerProd.description}
                      </p>

                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-800/80">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            trackEventAction('whatsapp_click', offerProd._id).catch(err => console.error("Error tracking click:", err));
                          }}
                          className="min-h-[44px] px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-950/60 hover:shadow-red-600/30 active:scale-95 cursor-pointer uppercase tracking-wider"
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
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-3 shadow-xl shadow-black/30 backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Búsqueda</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-800/90 border border-zinc-700/80 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30 text-white placeholder-zinc-400 focus:outline-none transition-all duration-300 font-medium text-sm"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selector de Categorías */}
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-3 shadow-xl shadow-black/30 backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Categorías</h4>
              <nav className="flex flex-col gap-1.5">
                {/* Categoría Todos */}
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                    selectedCategory === 'todos'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/40 translate-x-1'
                      : 'bg-zinc-800/60 text-zinc-300 border border-zinc-750 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'todos' ? 'bg-white' : 'bg-zinc-500 group-hover:bg-red-500 transition-colors'}`}></span>
                    Todos los productos
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-700/80 text-white' : 'bg-zinc-700 text-zinc-300 font-semibold'}`}>
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
                          ? 'bg-red-600 text-white shadow-lg shadow-red-950/40 translate-x-1'
                          : 'bg-zinc-900/60 text-zinc-400 border border-zinc-900 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-600 group-hover:bg-red-500 transition-colors'}`}></span>
                        {cat.name}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${isActive ? 'bg-red-700/80 text-white' : 'bg-zinc-800 text-zinc-500 font-semibold'}`}>
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
            <div className="lg:hidden flex flex-col gap-3 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Catálogo de Productos</span>
                  <span className="text-xs font-black text-white">{filteredProducts.length} Productos Disponibles</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-red-950/20"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500 text-white placeholder-zinc-500 focus:outline-none text-xs font-medium"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 scale-[1.02]'
                      : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span>Todos</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    selectedCategory === 'todos' ? 'bg-red-800/90 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
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
                          ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 scale-[1.02]'
                          : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-red-800/90 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
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
              <div className="w-full bg-zinc-950/45 border border-zinc-900 rounded-3xl p-5 shadow-lg shadow-black/30 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                    Filtros de tamaño / tipo
                  </span>
                  {selectedSubcategory !== 'todos' && (
                    <button
                      onClick={() => setSelectedSubcategory('todos')}
                      className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Limpiar Filtro
                    </button>
                  )}
                </div>
                
                {/* Contenedor con Scroll Lateral Suave */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {/* Botón Ver Todo */}
                  <button
                    onClick={() => setSelectedSubcategory('todos')}
                    className={`flex-shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
                      selectedSubcategory === 'todos'
                        ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-850'
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
                          ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-850'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="w-full py-20 flex flex-col items-center justify-center text-center rounded-3xl bg-zinc-950/40 border border-zinc-900">
                <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-zinc-400">No encontramos productos</h3>
                <p className="text-zinc-600 text-sm mt-1">Prueba cambiando la búsqueda o el filtro de categoría.</p>
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
                  className="w-11 h-11 rounded-xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center hover:border-red-500/50 active:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm"
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
                          ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                          : 'bg-zinc-850 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500'
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
                  className="w-11 h-11 rounded-xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center hover:border-red-500/50 active:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm"
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

      {/* Sección de Ubicación y Contacto con diseño dark premium y halos de marca */}
      <section id="ubicacion" className="w-full py-20 bg-gradient-to-b from-transparent via-zinc-900/60 to-zinc-900/90 border-t border-zinc-800 scroll-mt-20 relative overflow-hidden">
        {/* Halos decorativos de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
          
          <div className="text-center max-w-2xl mb-12">
            <span className="text-xs text-red-400 font-bold uppercase tracking-[0.2em] block mb-2">Contacto & Visitas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">Ubicación y Contacto</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Visítanos en nuestra tienda física o contáctanos a través de nuestras líneas de atención directa.
            </p>
          </div>

          {/* Mapa Responsivo */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden border border-zinc-700/80 shadow-2xl shadow-black/60">
            <iframe
              src={mapUrl || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3923.3670984803977!2d-66.91327300000002!3d10.506195699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve'}
              className="w-full h-full border-0 grayscale invert contrast-[1.2]"
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
            className="mt-6 w-full max-w-md py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-red-950/40 active:scale-[0.98] text-xs sm:text-sm cursor-pointer select-none"
            title="Cómo llegar con Google Maps"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>¿Cómo llegar a la tienda?</span>
          </a>

          {/* Información de Ubicación y Contacto justo debajo del mapa */}
          <div className="mt-8 w-full max-w-2xl bg-zinc-900/90 p-6 sm:p-8 rounded-3xl border border-zinc-800 text-left flex flex-col gap-4 shadow-xl backdrop-blur-md">
            
            {/* Dirección */}
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">📍</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ubicación Física</span>
                <p className="text-white text-sm sm:text-base font-bold leading-relaxed">
                  Centro de Caracas, Esquina de Torres a Madrices, Edificio Arvelo, PB, Locales 1-2 y 3.
                </p>
              </div>
            </div>

            {/* Referencia */}
            <div className="flex items-start gap-3 pl-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Punto de Referencia</span>
                <p className="text-zinc-300 text-sm font-medium leading-relaxed">
                  Frente a la Panadería Picadelli (Catedral / Plaza Bolívar).
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-zinc-800 my-1"></div>

            {/* Contactos */}
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">📞</span>
              <div className="flex flex-col gap-2 w-full">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Líneas de Atención Directa</span>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm sm:text-base font-bold">
                  {/* Numero 1 */}
                  <div className="flex items-center gap-2 bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-700">
                    <span className="text-white font-mono">0424-4576086</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <a
                        href="tel:+584244576086"
                        className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Llamar por teléfono"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                      <a
                        href="https://wa.me/584244576086"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-emerald-950/40 hover:bg-emerald-800/50 text-emerald-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Enviar WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  <span className="text-zinc-600 font-mono hidden sm:inline">/</span>

                  {/* Numero 2 */}
                  <div className="flex items-center gap-2 bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-700">
                    <span className="text-white font-mono">0424-1439324</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <a
                        href="tel:+584241439324"
                        className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Llamar por teléfono"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                      <a
                        href="https://wa.me/584241439324"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-emerald-950/40 hover:bg-emerald-800/50 text-emerald-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
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
                <div className="h-[1px] bg-zinc-800 my-1"></div>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">🌐</span>
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Redes Sociales Oficiales</span>
                    <p className="text-xs text-zinc-400">Síguenos para enterarte de nuevos ingresos, promociones y videos en vivo:</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href="https://www.tiktok.com/@hogaryjuguetestiowilly"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
                      >
                        <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </span>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">TikTok</span>
                          <span className="text-[10px] text-zinc-400 font-mono">@hogaryjuguetestiowilly</span>
                        </div>
                      </a>

                      <a
                        href="https://www.instagram.com/hogaryjuguetestiowilly"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 hover:border-pink-500/50 hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
                      >
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </span>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">Instagram</span>
                          <span className="text-[10px] text-zinc-400 font-mono">@hogaryjuguetestiowilly</span>
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

      {/* Footer */}
      <footer className="w-full py-12 border-t border-zinc-800 bg-zinc-900/90 text-center text-zinc-400 text-sm flex flex-col items-center gap-3">
        <LogoTioWilly className="scale-75 opacity-90 mb-1" />

        {/* Social Icons Bar in Footer */}
        <div className="flex items-center gap-3 my-2">
          <a
            href="https://www.tiktok.com/@hogaryjuguetestiowilly"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
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
            className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 hover:border-pink-500/50 hover:bg-zinc-700 text-zinc-300 hover:text-pink-400 flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="Instagram Oficial"
            aria-label="Instagram Oficial"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://wa.me/584244576086"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="WhatsApp Directo"
            aria-label="WhatsApp Directo"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
            </svg>
          </a>
        </div>

        <p className="mt-2 text-zinc-300">© 2026 Home and Toys Tío Willy. Todos los derechos reservados.</p>
        <p className="text-xs text-zinc-400 italic">Desarrollado con pasión para una experiencia de compra premium.</p>
        <a 
          href="/admin" 
          className="text-xs text-red-500 hover:text-red-400 transition-colors duration-300 uppercase tracking-widest font-bold mt-2 hover:underline"
        >
          Acceso Administrador
        </a>
      </footer>
    </div>
  );
}
