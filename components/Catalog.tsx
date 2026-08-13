'use client';

import React, { useState, useMemo } from 'react';

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
export function ProductCard({ product }: { product: Product }) {
  const [activeIdx, setActiveIdx] = useState(0);

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

  // Enlace de WhatsApp
  const phone = '584244576086'; // Número del cliente
  const textMessage = `Hola Tío Willy, me interesa consultar por el producto:\n\n*${product.name}*\n- *Variedad:* ${currentVariety}\n- *Precio Detal:* $${product.priceDetal.toFixed(2)}\n- *Precio Mayor:* $${product.priceMayor.toFixed(2)} (A partir de ${product.minMayor} unidades)\n\n¿Tienen stock disponible?`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMessage)}`;

  return (
    <div className="group relative flex flex-col rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-red-500/40 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-red-950/20 shadow-black/80">
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
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-950/40 border border-red-500/30 rounded-full backdrop-blur-md">
            {product.category === 'juguetes' ? 'Juguetes' : product.category === 'hogar' ? 'Hogar' : 'Tecnología'}
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
                  onClick={() => setActiveIdx(idx)}
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
            <span className="text-2xl font-black text-white font-mono">${product.priceDetal.toFixed(2)}</span>
          </div>
          <div className="h-[1px] bg-zinc-800/60"></div>
          <div className="flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-xs text-red-500 font-bold uppercase tracking-wide">Precio Mayor:</span>
              <span className="text-[10px] text-zinc-500 italic">Mínimo {product.minMayor} unidades</span>
            </div>
            <span className="text-xl font-black text-red-400 font-mono">${product.priceMayor.toFixed(2)}</span>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          {/* WhatsApp Icon */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-9.977c.311.089.822.112 1.134.112.31 0 .82-.112 1.131-.492.311-.38.82-1.993.899-2.15.079-.156.13-.339.028-.553-.102-.213-.822-1.994-.822-1.994-.127-.278-.261-.318-.466-.318-.17 0-.368-.012-.566-.012-.397 0-.907.146-1.22.492-.311.38-1.189 1.163-1.189 2.833 0 1.67 1.218 3.282 1.388 3.507.17.225 2.4 3.665 5.811 5.138.81.35 1.442.56 1.933.717.813.259 1.554.223 2.14.136.652-.097 1.993-.815 2.276-1.602.283-.787.283-1.46.198-1.602-.085-.142-.311-.225-.652-.393-.34-.168-1.993-.984-2.276-1.085-.283-.101-.49-.152-.697.152-.207.304-.803 1.085-.984 1.288-.18.203-.362.228-.703.06-.34-.168-1.436-.53-2.735-1.688-1.01-.902-1.693-2.016-1.892-2.355-.198-.339-.021-.523.149-.692.153-.152.34-.393.51-.59.17-.197.226-.338.339-.564.113-.225.056-.422-.028-.59-.084-.168-.703-1.692-1.01-2.434-.298-.718-.604-.621-.822-.631-.212-.01-.453-.012-.694-.012-.24 0-.631.09-.962.45-.33.36-1.26 1.23-1.26 3.003 0 1.77 1.29 3.48 1.47 3.73.18.25 2.54 3.88 6.16 5.45.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.69-.1 2.12-.87 2.42-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.72-.43z"/>
          </svg>
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function Catalog({ 
  initialProductos, 
  initialCategorias,
  mapUrl
}: { 
  initialProductos: Product[]; 
  initialCategorias: Category[]; 
  mapUrl?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const ITEMS_PER_PAGE = 6;

  // Filtrar productos por Categoría y Búsqueda de Texto
  const filteredProducts = useMemo(() => {
    return initialProductos.filter((prod: Product) => {
      const matchesCategory = selectedCategory === 'todos' || prod.category === selectedCategory;
      const matchesSearch = 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialProductos, selectedCategory, searchQuery]);

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
            {/* Grid de Productos */}
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProducts.map((prod: Product) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
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
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

      {/* Sección de Ubicación (Google Maps) con diseño dark premium */}
      <section id="ubicacion" className="w-full py-16 bg-zinc-950/20 border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="text-center max-w-2xl mb-10">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] block mb-2">Visita nuestra tienda</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">Nuestra Ubicación</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Estamos ubicados en Caracas. Ven y conoce nuestra gran variedad de productos para el hogar, juguetes y tecnología.
            </p>
          </div>

          {/* Mapa Responsivo */}
          <div className="w-full max-w-4xl aspect-[16/9] sm:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80">
            <iframe
              src={mapUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125556.76465492415!2d-67.03061405000001!3d10.4683838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a58adcd824845%3A0xa1e2d787747e117f!2sCaracas%2C%20Distrito%20Capital!5e0!3m2!1ses-419!2sve!4v1710000000000!5m2!1ses-419!2sve'}
              className="w-full h-full border-0 grayscale invert contrast-[1.2]"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Ubicación Tío Willy"
            ></iframe>
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
