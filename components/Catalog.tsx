'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';

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
}

export interface Category {
  _id: string;
  name: string;
}

// Replicamos el Logo Tío Willy usando SVG y Tailwind
function LogoTioWilly({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Icono de Casa en Pin de Ubicación / Globo de diálogo */}
      <svg className="w-16 h-16 md:w-20 md:h-20 mb-2 drop-shadow-[0_0_8px_rgba(255,45,45,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      
      {/* HOME */}
      <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white leading-none select-none flex items-center font-sans">
        H
        <span className="relative inline-flex items-center justify-center">
          O
          <span className="absolute w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
        </span>
        ME
      </h1>
      
      {/* AND TOYS */}
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-[#FF2D2D] leading-none select-none mt-1 font-sans">
        AND TOYS
      </h2>
      
      {/* Línea Divisora */}
      <div className="w-48 h-[1.5px] bg-gradient-to-r from-transparent via-zinc-400 to-transparent my-3"></div>
      
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

  // Enlace de WhatsApp
  const phone = '584244576086'; // Número del cliente
  const textMessage = `Hola Tío Willy, me interesa consultar por el producto:\n\n*${product.name}*\n- *Variedad:* ${currentVariety}\n- *Precio Detal:* ${symbol}${product.priceDetal.toFixed(2)}\n- *Precio Mayor:* ${symbol}${product.priceMayor.toFixed(2)} (A partir de ${product.minMayor} unidades)\n\n¿Tienen stock disponible?`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMessage)}`;

  return (
    <div 
      onClick={() => setIsModalOpen(true)}
      className="group relative flex flex-col rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-red-500/40 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-red-950/20 shadow-black/80 cursor-pointer"
    >
      {/* Carrusel de Imágenes con soporte híbrido de gestos swipe */}
      <div 
        className="relative aspect-square w-full bg-zinc-900 overflow-hidden cursor-grab active:cursor-grabbing select-none"
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>

        {/* Flechas de navegación (visibles en hover o móviles siempre) */}
        {product.images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-colors duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
              aria-label="Imagen anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-colors duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
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
                idx === activeIdx ? 'bg-red-500 w-4' : 'bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Ver variedad ${idx + 1}`}
            />
          ))}
        </div>

        {/* Categoría Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-950/40 border border-red-500/30 rounded-full backdrop-blur-md font-bold">
            {categoryName || product.category}
          </span>
        </div>
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
            <span className="text-xs text-zinc-500 block mb-1.5 uppercase font-semibold tracking-wider">Variedad:</span>
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

        {/* Espaciador */}
        <div className="flex-1 min-h-[20px]"></div>

        {/* Precios */}
        <div className="mt-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Precio Detal:</span>
            <span className="text-2xl font-black text-white font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
          </div>
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
          onClick={(e) => e.stopPropagation()}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          {/* Tarjeta del Modal */}
          <div 
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-black relative flex flex-col max-h-[90vh] md:max-h-[85vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de Cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-red-650 text-white flex items-center justify-center transition-colors duration-300 backdrop-blur-md cursor-pointer focus:outline-none"
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-colors duration-300 backdrop-blur-sm focus:outline-none"
                        aria-label="Imagen anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-colors duration-300 backdrop-blur-sm focus:outline-none"
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
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Precio Detal:</span>
                      <span className="text-2xl font-black text-white font-mono">{symbol}{product.priceDetal.toFixed(2)}</span>
                    </div>
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
                    onClick={(e) => e.stopPropagation()}
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

  // Obtener las subcategorías dinámicas para la categoría seleccionada
  const subcategories = useMemo(() => {
    if (selectedCategory === 'todos') return [];
    const productsInCategory = initialProductos.filter((p) => p.category === selectedCategory);
    return getSubcategoriesForCategory(productsInCategory, initialCategorias);
  }, [selectedCategory, initialProductos, initialCategorias]);

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

      // --- PRODUCTOS (Exactamente 3 por página, imágenes grandes) ---
      let currentY = 20;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2); // 180

      for (let i = 0; i < initialProductos.length; i++) {
        const prod = initialProductos[i];
        
        // Cada 3 productos, o en el primero, agregamos una página
        if (i % 3 === 0) {
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
        }

        // Altura de tarjeta: 78mm
        const cardH = 78;

        // Dibujar contenedor del producto en blanco con borde sutil
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
        const infoX = imgX + imgW + 6; // 15 + 5 + 68 + 6 = 94
        const infoY = currentY + 9;
        const infoW = contentWidth - imgW - 16; // 180 - 68 - 16 = 96

        // Categoría (Badge pequeño gris)
        const categoryObj = initialCategorias.find((c) => c._id === prod.category);
        const categoryName = (categoryObj ? categoryObj.name : prod.category).toUpperCase();
        
        doc.setFillColor(240, 240, 245);
        doc.roundedRect(infoX, infoY - 3, doc.getTextWidth(categoryName) + 5, 4.5, 1, 1, 'F');
        
        doc.setTextColor(100, 100, 110);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(categoryName, infoX + 2.5, infoY + 0.3);

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
        // Mostrar hasta 4 líneas
        const slicedDesc = splitDesc.slice(0, 4);
        doc.text(slicedDesc, infoX, infoY + (subcat ? 20 : 16.5));

        // Pie de Página
        doc.setTextColor(150, 150, 155);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("Catálogo de Referencia de Productos  |  Libre de Precios al Consumidor", margin, pageHeight - 8);

        // Incrementar Y para el siguiente producto (78mm + 6mm de espacio)
        currentY += cardH + 6;
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

  // Filtrar productos por Categoría, Subcategoría y Búsqueda de Texto
  const filteredProducts = useMemo(() => {
    let list = initialProductos;

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
  }, [initialProductos, selectedCategory, selectedSubcategory, searchQuery]);

  // Contadores de productos por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: initialProductos.length };
    initialCategorias.forEach((cat: Category) => {
      counts[cat._id] = initialProductos.filter((p: Product) => p.category === cat._id).length;
    });
    return counts;
  }, [initialProductos, initialCategorias]);

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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white relative">
      {/* Aviso de cierre de sesión por inactividad */}
      {showInactivityAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-500">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-950/90 border border-red-500/40 text-red-500 shadow-2xl shadow-black backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide">
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
      {/* Sticky Top Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-black/85 border-b border-zinc-900/60 backdrop-blur-md py-4 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo compact */}
          <a href="#" className="flex items-center gap-2.5 group">
            <svg className="w-6.5 h-6.5 text-red-500 group-hover:scale-105 transition-transform" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 85C42 77 15 54 15 37C15 17 31 5 50 5C69 5 85 17 85 37C85 54 58 77 50 85Z" stroke="#FF2D2D" strokeWidth="8"/>
              <path d="M38 48V62H62V48M32 48L50 32L68 48" stroke="#FF2D2D" strokeWidth="7"/>
              <rect x="46" y="52" width="8" height="10" fill="#FF2D2D" />
            </svg>
            <span className="font-black tracking-widest text-xs uppercase leading-none block text-white font-sans">
              HOME & TOYS <span className="text-red-500 font-bold block text-[8px] tracking-[0.2em] mt-0.5">Tío Willy</span>
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => { setSelectedCategory('todos'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }} 
              className={`text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${selectedCategory === 'todos' ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
            >
              Todos
            </button>
            {initialCategorias.map((cat) => (
              <button
                key={cat._id}
                onClick={() => { setSelectedCategory(cat._id); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${selectedCategory === cat._id ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Contact / Drawer Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateCatalogPDF}
              disabled={pdfLoading}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-850 text-zinc-400 hover:text-white text-xs font-bold transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Trabaja con nosotros
                </>
              )}
            </button>
            <a 
              href="https://wa.me/584244576086"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-red-950/40 border border-red-500/30 hover:bg-red-650 hover:text-white text-red-500 text-xs font-bold transition-all uppercase tracking-wider"
            >
              WhatsApp
            </a>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors focus:outline-none cursor-pointer"
              aria-label="Abrir menú móvil"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        ></div>

        {/* Panel lateral */}
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85%] bg-zinc-950 border-l border-zinc-900 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Cabecera del menú */}
          <div className="flex items-center justify-between">
            <span className="font-extrabold tracking-widest text-[10px] uppercase text-zinc-500">Navegación / Filtros</span>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
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
            className="w-full py-3.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-500 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Generando Catálogo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sé parte de Tío Willy (Catálogo PDF)
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
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 text-white placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categorías dentro del menú móvil */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Categorías</h4>
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              <button
                onClick={() => { setSelectedCategory('todos'); setIsDrawerOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-xs ${
                  selectedCategory === 'todos'
                    ? 'bg-red-650 text-white shadow-lg shadow-red-950/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <span>Todos los productos</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-750 text-white' : 'bg-zinc-850 text-zinc-650 font-bold'}`}>
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
                        ? 'bg-red-650 text-white shadow-lg shadow-red-950/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-red-750 text-white' : 'bg-zinc-850 text-zinc-650 font-bold'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-900"></div>

          {/* Información de contacto */}
          <div className="mt-auto flex flex-col gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block text-center">Atención al Cliente</span>
            <a
              href="https://wa.me/584244576086"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-red-650 hover:bg-red-650 border border-red-550/20 text-white rounded-xl font-bold text-center text-xs transition-colors"
            >
              📞 +58 424 457 6086
            </a>
          </div>
        </div>
      </div>

      {/* Header / Hero */}
      <header className="relative w-full py-16 md:py-24 overflow-hidden flex flex-col items-center justify-center border-b border-zinc-900 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black">
        {/* Luces de ambiente traseras */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 translate-x-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <LogoTioWilly className="relative z-10 scale-95 md:scale-100 transition-transform duration-500" />

        <p className="mt-8 text-center text-sm md:text-base text-zinc-400 tracking-[0.15em] uppercase max-w-md px-6 leading-relaxed">
          Calidad Premium al detal y mayorista
        </p>

        {/* Flecha indicadora hacia abajo */}
        <a 
          href="#catalogo"
          className="absolute bottom-6 flex flex-col items-center gap-1.5 text-zinc-500 hover:text-red-500 transition-colors duration-300 group"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold">Ver catálogo</span>
          <svg className="w-5 h-5 animate-bounce group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7" />
          </svg>
        </a>
      </header>

      {/* Main Content Area */}
      <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          
          {/* Columna Izquierda: Filtros de Categoría y Buscador */}
          <aside className="w-full lg:w-80 flex flex-col gap-6 lg:sticky lg:top-8 z-20 hidden lg:flex">
            {/* Buscador */}
            <div className="p-6 rounded-3xl bg-zinc-950/90 border border-zinc-900 flex flex-col gap-3 shadow-xl shadow-black/50 backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Búsqueda</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 font-medium"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selector de Categorías */}
            <div className="p-6 rounded-3xl bg-zinc-950/90 border border-zinc-900 flex flex-col gap-3 shadow-xl shadow-black/50 backdrop-blur-md">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categorías</h4>
              <nav className="flex flex-col gap-1.5">
                {/* Categoría Todos */}
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                    selectedCategory === 'todos'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/40 translate-x-1'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-900 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'todos' ? 'bg-white' : 'bg-zinc-600 group-hover:bg-red-500 transition-colors'}`}></span>
                    Todos los productos
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${selectedCategory === 'todos' ? 'bg-red-700/80 text-white' : 'bg-zinc-800 text-zinc-500 font-semibold'}`}>
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
          <div className="flex-1 flex flex-col gap-8 lg:gap-10">
            {/* Mobile Filter & Search Button Trigger */}
            <div className="lg:hidden flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-3xl p-4 shadow-lg shadow-black/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Catálogo</span>
                <span className="text-xs font-black text-white">{filteredProducts.length} Productos</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-550 active:bg-red-750 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-red-950/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filtrar y Buscar
              </button>
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
                        ? 'bg-red-650 text-white shadow-md shadow-red-950/20'
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
                          ? 'bg-red-650 text-white shadow-md shadow-red-950/20'
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
                  className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center hover:border-red-500/40 active:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
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
                      className={`w-11 h-11 rounded-xl font-bold transition-all duration-300 ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white shadow-lg shadow-red-950/20'
                          : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                  className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center hover:border-red-500/40 active:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
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

      {/* Sección de Ubicación y Contacto con diseño dark premium */}
      <section id="ubicacion" className="w-full py-20 bg-zinc-950/20 border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          
          <div className="text-center max-w-2xl mb-12">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] block mb-2">Contacto & Visitas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">Ubicación y Contacto</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Visítanos en nuestra tienda física o contáctanos a través de nuestras líneas de atención directa.
            </p>
          </div>

          {/* Mapa Responsivo */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80">
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
            href="https://www.google.com/maps/dir/?api=1&destination=10.5061957,-66.913273"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full max-w-md py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-red-950/20 active:scale-[0.98] text-xs sm:text-sm cursor-pointer select-none"
            title="Cómo llegar con Google Maps"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ¿Cómo llegar?
          </a>

          {/* Información de Ubicación y Contacto justo debajo del mapa */}
          <div className="mt-8 w-full max-w-2xl bg-zinc-950/40 p-6 rounded-3xl border border-zinc-900 text-left flex flex-col gap-4 shadow-xl">
            
            {/* Dirección */}
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">📍</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ubicación</span>
                <p className="text-white text-sm sm:text-base font-semibold leading-relaxed">
                  Centro de Caracas, Esquina de Torres a Madrices, Edificio Arvelo, PB, Locales 1-2 y 3.
                </p>
              </div>
            </div>

            {/* Referencia */}
            <div className="flex items-start gap-3 pl-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Referencia</span>
                <p className="text-zinc-350 text-sm font-medium leading-relaxed">
                  Frente a la Panadería Picadelli (Catedral).
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-zinc-900/60 my-1"></div>

            {/* Contactos */}
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">📞</span>
              <div className="flex flex-col gap-2 w-full">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contáctanos</span>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm sm:text-base font-bold">
                  {/* Numero 1 */}
                  <div className="flex items-center gap-2 bg-zinc-900/60 px-3.5 py-1.5 rounded-xl border border-zinc-900">
                    <span className="text-white font-mono">0424-4576086</span>
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <a
                        href="tel:+584244576086"
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
                        className="w-7 h-7 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Enviar WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  <span className="text-zinc-700 font-mono hidden sm:inline">/</span>

                  {/* Numero 2 */}
                  <div className="flex items-center gap-2 bg-zinc-900/60 px-3.5 py-1.5 rounded-xl border border-zinc-900">
                    <span className="text-white font-mono">0424-1439324</span>
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <a
                        href="tel:+584241439324"
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
                        className="w-7 h-7 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Enviar WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
                        </svg>
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
      <footer className="w-full py-12 border-t border-zinc-900 bg-zinc-950/40 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
        <LogoTioWilly className="scale-75 opacity-75 mb-1" />
        <p className="mt-2">© 2026 Home and Toys Tío Willy. Todos los derechos reservados.</p>
        <p className="text-xs text-zinc-700 italic">Desarrollado con pasión para una experiencia de compra premium.</p>
        <a 
          href="/admin" 
          className="text-[10px] text-zinc-700 hover:text-red-500/80 transition-colors duration-300 uppercase tracking-widest font-bold mt-2"
        >
          Acceso Administrador
        </a>
      </footer>
    </div>
  );
}
