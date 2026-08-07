'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard, Product, Category } from '@/components/Catalog';
import { verifyPasswordAction, logoutAction, createProductAction } from './adminActions';

interface AdminClientProps {
  isAuthorized: boolean;
  categories: Category[];
}

export default function AdminClient({ isAuthorized, categories }: AdminClientProps) {
  const router = useRouter();

  // Estados de Login
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados del Formulario de Producto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?._id || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [priceDetal, setPriceDetal] = useState('');
  const [priceMayor, setPriceMayor] = useState('');
  const [minMayor, setMinMayor] = useState('3');
  const [varieties, setVarieties] = useState('Estándar');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Estados de carga y feedback al enviar
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar URLs de vista previa para evitar fugas de memoria
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Manejar el inicio de sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await verifyPasswordAction(password);
      if (res.success) {
        router.refresh(); // Recargar el estado del servidor (isAuthorized se volverá true)
      } else {
        setLoginError(res.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setLoginError('Ocurrió un error al verificar la contraseña');
    } finally {
      setLoginLoading(false);
    }
  };

  // Manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      await logoutAction();
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  };

  // Manejar cambio de imágenes (acumulando archivos seleccionados)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...urls]);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  // Eliminar una imagen de la selección de forma individual
  const handleRemoveFile = (idxToRemove: number) => {
    URL.revokeObjectURL(previewUrls[idxToRemove]);
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const isNewCategory = category === 'new_category_option';

    if (!name || !description || (!category && !isNewCategory) || !priceDetal || !priceMayor || !minMayor) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      setSubmitLoading(false);
      return;
    }

    if (isNewCategory && !newCategoryName.trim()) {
      setErrorMsg('Por favor escriba el nombre de la nueva categoría.');
      setSubmitLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', isNewCategory ? '' : category);
    formData.append('isNewCategory', isNewCategory ? 'true' : 'false');
    formData.append('newCategoryName', newCategoryName.trim());
    formData.append('priceDetal', priceDetal);
    formData.append('priceMayor', priceMayor);
    formData.append('minMayor', minMayor);
    formData.append('varieties', varieties);
    
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await createProductAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Producto guardado con éxito.');
        // Limpiar formulario
        setName('');
        setDescription('');
        setCategory(categories[0]?._id || '');
        setNewCategoryName('');
        setPriceDetal('');
        setPriceMayor('');
        setMinMayor('3');
        setVarieties('Estándar');
        setSelectedFiles([]);
        setPreviewUrls([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh(); // Actualiza las categorías en la barra lateral del catálogo de inmediato
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar el producto.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión al enviar el producto.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Construir objeto de producto para la Vista Previa
  const previewProduct: Product = useMemo(() => {
    const listVarieties = varieties
      ? varieties.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
      : ['Estándar'];

    // Si no hay archivos subidos, usar una imagen de placeholder según la categoría
    const fallbackImage = 
      category === 'juguetes' 
        ? '/images/robot_red.jpg' 
        : category === 'tecnologia' 
          ? '/images/headphones_black.jpg' 
          : '/images/chair_red.jpg';

    const finalImages = previewUrls.length > 0 ? previewUrls : [fallbackImage];

    return {
      _id: 'preview_temp',
      name: name || 'Nombre del Producto (Ejemplo)',
      description: description || 'Esta es una descripción corta de ejemplo para visualizar el diseño de la tarjeta del catálogo.',
      category: category === 'new_category_option' ? (newCategoryName || 'nueva_categoria') : category,
      priceDetal: parseFloat(priceDetal) || 0,
      priceMayor: parseFloat(priceMayor) || 0,
      minMayor: parseInt(minMayor) || 3,
      images: finalImages,
      varieties: listVarieties
    };
  }, [name, description, category, newCategoryName, priceDetal, priceMayor, minMayor, varieties, previewUrls]);

  // VISTA 1: FORMULARIO DE INGRESO (LOGIN CON CONTRASEÑA)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-red-500 selection:text-white">
        {/* Fondo de luces decorativas */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Card de Acceso */}
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-zinc-900 shadow-2xl shadow-black backdrop-blur-md relative z-10 text-center">
          
          {/* Logo Tío Willy */}
          <div className="flex flex-col items-center mb-8">
            <svg className="w-14 h-14 mb-2 drop-shadow-[0_0_8px_rgba(255,45,45,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 85C42 77 15 54 15 37C15 17 31 5 50 5C69 5 85 17 85 37C85 54 58 77 50 85Z" stroke="#FF2D2D" strokeWidth="6"/>
              <path d="M38 48V62H62V48M32 48L50 32L68 48" stroke="#FF2D2D" strokeWidth="5"/>
              <rect x="46" y="52" width="8" height="10" fill="#FF2D2D" />
            </svg>
            <h2 className="text-xl font-bold tracking-[0.25em] text-white uppercase leading-none font-sans">
              Acceso Admin
            </h2>
            <h3 className="text-xs tracking-wider text-red-500 font-semibold uppercase mt-1">
              Tío Willy
            </h3>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-left">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contraseña del Sistema</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30 text-white placeholder-zinc-700 focus:outline-none transition-all duration-300 font-mono text-center"
                disabled={loginLoading}
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 font-bold bg-red-950/20 border border-red-950/40 p-3 rounded-lg text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                'Ingresar al Panel'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL DE CONTROL COMPLETO (ADMINISTRADOR AUTORIZADO)
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Barra de navegación de administración */}
      <nav className="w-full py-4 border-b border-zinc-900 bg-zinc-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 drop-shadow-[0_0_4px_rgba(255,45,45,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 85C42 77 15 54 15 37C15 17 31 5 50 5C69 5 85 17 85 37C85 54 58 77 50 85Z" stroke="#FF2D2D" strokeWidth="6"/>
              <path d="M38 48V62H62V48M32 48L50 32L68 48" stroke="#FF2D2D" strokeWidth="5"/>
              <rect x="46" y="52" width="8" height="10" fill="#FF2D2D" />
            </svg>
            <div>
              <span className="font-black tracking-widest text-sm leading-none block">PANEL ADMIN</span>
              <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold leading-none">Tío Willy</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-red-650 hover:text-white text-zinc-400 font-bold text-xs transition-colors duration-300 border border-zinc-800 hover:border-red-500/30"
          >
            Cerrar Sesión
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Encabezado */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Publicar Nuevo Producto</h1>
          <p className="text-zinc-500 text-sm mt-1">Completa los campos del formulario. Verás una vista previa de la tarjeta en tiempo real a la derecha.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Columna Izquierda: Formulario (7 cols) */}
          <section className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/80">
            
            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm font-semibold flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Nombre del Producto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Silla Gamer Ergonómica Tío Willy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-600 focus:outline-none transition-all duration-300 font-medium"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descripción *</label>
                <textarea
                  placeholder="Ej: Silla de alto rendimiento con reclinación completa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-600 focus:outline-none transition-all duration-300 font-medium resize-none"
                  required
                />
              </div>

              {/* Categoría y Variedades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categoría *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white focus:outline-none transition-all duration-300 font-medium cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="new_category_option" className="text-red-400 font-bold">
                      + Crear Nueva Categoría...
                    </option>
                  </select>

                  {category === 'new_category_option' && (
                    <div className="mt-2 flex flex-col gap-1.5 animate-fadeIn">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nombre de la nueva categoría *</label>
                      <input
                        type="text"
                        placeholder="Ej: Cocina y Comedor"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-red-500/80 rounded-xl focus:ring-1 focus:ring-red-500/20 text-white text-sm focus:outline-none transition-all duration-300 font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Variedades (Separadas por coma) *</label>
                  <input
                    type="text"
                    placeholder="Ej: Rojo, Azul, Negro"
                    value={varieties}
                    onChange={(e) => setVarieties(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-600 focus:outline-none transition-all duration-300 font-medium"
                    required
                  />
                  <span className="text-[10px] text-zinc-500">Determina el nombre de cada opción que el usuario puede elegir.</span>
                </div>
              </div>

              {/* Precios y Mínimos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Precio Detal ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="180.00"
                    value={priceDetal}
                    onChange={(e) => setPriceDetal(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-650 focus:outline-none transition-all duration-300 font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-semibold text-red-500">Precio Mayor ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="145.00"
                    value={priceMayor}
                    onChange={(e) => setPriceMayor(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-650 focus:outline-none transition-all duration-300 font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mínimo Mayor (Uds) *</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={minMayor}
                    onChange={(e) => setMinMayor(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 text-white placeholder-zinc-650 focus:outline-none transition-all duration-300 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Subida de Archivos / Cargar Imágenes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Imágenes del Producto</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-800 hover:border-red-500/40 rounded-2xl py-8 px-4 text-center cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300 flex flex-col items-center gap-2 group"
                >
                  <svg className="w-8 h-8 text-zinc-600 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">Haga clic para subir archivos</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Puedes seleccionar múltiples archivos</span>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>

                {/* Mostrar miniaturas de archivos seleccionados */}
                {previewUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl border border-zinc-800 bg-zinc-900 group/thumb">
                        <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                        
                        {/* Indicador de orden */}
                        <span className="absolute bottom-0 right-0 bg-zinc-950/80 text-zinc-400 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-tl-lg rounded-br-xl border-t border-l border-zinc-800">
                          #{idx + 1}
                        </span>

                        {/* Botón para remover de la selección */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-black/60 focus:outline-none cursor-pointer"
                          title="Eliminar de la selección"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={submitLoading}
                className="mt-4 w-full py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-red-900/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando producto en catálogo...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Publicar Producto
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Columna Derecha: Vista Previa en Vivo (5 cols) */}
          <section className="lg:col-span-5 lg:sticky lg:top-24 z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2 text-zinc-500 uppercase tracking-widest text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Vista Previa en Vivo
            </div>
            
            <div className="max-w-[380px] mx-auto w-full">
              <ProductCard product={previewProduct} />
            </div>

            <div className="text-zinc-650 text-center text-[10px] italic px-4 leading-relaxed">
              La vista previa se actualiza inmediatamente mientras editas. Las variedades se corresponden en orden a las imágenes seleccionadas.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
