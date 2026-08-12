'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  verifyPasswordAction, 
  logoutAction, 
  createProductAction,
  createCategoryAction,
  deleteCategoryAction,
  deleteProductAction,
  updateProductPricesAction 
} from './adminActions';

// Interfaces locales coincidentes con Catalog.tsx
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
// Función de compresión de imágenes en el cliente usando Canvas
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

interface AdminClientProps {
  isAuthorized: boolean;
  categories: Category[];
  initialProducts: Product[];
}

export default function AdminClient({ isAuthorized, categories: serverCategories, initialProducts }: AdminClientProps) {
  const router = useRouter();

  // Estado reactivo local para sincronización instantánea
  const [categories, setCategories] = useState<Category[]>(serverCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Sincronizar estados locales cuando cambian las props del servidor
  useEffect(() => {
    setCategories(serverCategories);
  }, [serverCategories]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Estados de Login
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados del Formulario de Producto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceDetal, setPriceDetal] = useState('');
  const [priceMayor, setPriceMayor] = useState('');
  const [minMayor, setMinMayor] = useState('3');
  const [varieties, setVarieties] = useState('Estándar');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Estado del Formulario de Categoría
  const [categoryInput, setCategoryInput] = useState('');

  // Estados de carga e indicaciones
  const [submitLoading, setSubmitLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado para indicar si se está guardando algún cambio de precio en la lista
  const [priceSavingId, setPriceSavingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-seleccionar primera categoría si cambia
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]._id);
    }
  }, [categories, category]);

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
        router.refresh();
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
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  };

  // Manejar cambio de imágenes con compresión automática
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      const compressedFiles = await Promise.all(
        files.map((file) => {
          // Solo comprimir si es una imagen y supera los 200KB
          if (file.type.startsWith('image/') && file.size > 200 * 1024) {
            return compressImage(file);
          }
          return Promise.resolve(file);
        })
      );

      const urls = compressedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...urls]);
      setSelectedFiles((prev) => [...prev, ...compressedFiles]);
    }
  };

  // Quitar imagen seleccionada
  const handleRemoveFile = (idxToRemove: number) => {
    URL.revokeObjectURL(previewUrls[idxToRemove]);
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Agregar Producto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (!name || !description || !category || !priceDetal || !priceMayor || !minMayor) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      setSubmitLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
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
        setPriceDetal('');
        setPriceMayor('');
        setMinMayor('3');
        setVarieties('Estándar');
        setSelectedFiles([]);
        setPreviewUrls([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh(); // Sincroniza con el servidor
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar el producto.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión al enviar el producto.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Crear Categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;

    setCategoryLoading(true);
    try {
      const res = await createCategoryAction(categoryInput);
      if (res.success) {
        setCategoryInput('');
        router.refresh();
      } else {
        alert(res.error || 'Error al crear la categoría');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al crear la categoría');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Eliminar Categoría
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Se desvincularán los productos asociados.')) return;
    try {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Error al eliminar la categoría');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al eliminar la categoría');
    }
  };

  // Eliminar Producto
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    try {
      const res = await deleteProductAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Error al eliminar el producto');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al eliminar el producto');
    }
  };

  // Cambiar precios en la lista (Cambio local en inputs)
  const handlePriceFieldChange = (productId: string, field: 'priceDetal' | 'priceMayor', valStr: string) => {
    setProducts((prev) => 
      prev.map((p) => {
        if (p._id === productId) {
          const num = parseFloat(valStr.replace(',', '.')) || 0;
          return { ...p, [field]: num };
        }
        return p;
      })
    );
  };

  // Guardar precios en MongoDB al perder el foco (onBlur)
  const handleSavePrices = async (product: Product) => {
    setPriceSavingId(product._id);
    try {
      const res = await updateProductPricesAction(product._id, product.priceDetal, product.priceMayor);
      if (!res.success) {
        console.error('Error al guardar precios:', res.error);
      }
    } catch (err) {
      console.error('Error al actualizar precios en red', err);
    } finally {
      setTimeout(() => setPriceSavingId(null), 800); // Pequeña transición visual
    }
  };

  // VISTA 1: LOGIN CARD
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-red-500 selection:text-white">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-650/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-zinc-900/60 shadow-2xl shadow-black/90 backdrop-blur-md relative z-10 text-center">
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
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-red-500/85 focus:ring-1 focus:ring-red-500/30 text-white placeholder-zinc-700 focus:outline-none transition-all duration-300 font-mono text-center"
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
              className="mt-2 py-3 bg-red-650 hover:bg-red-550 active:bg-red-750 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Verificando...' : 'Ingresar al Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL DE CONTROL
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Navbar de control */}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs transition-colors duration-300 border border-zinc-850"
          >
            Cerrar Sesión
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Grid Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: Formulario de Carga y Categorías (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* 1. Nuevo Producto Form Card */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">Nuevo producto</h2>
                <p className="text-zinc-500 text-xs mt-1">Sube una o varias imágenes desde tu ordenador y completa los datos.</p>
              </div>

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                
                {/* imágenes */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Imágenes del producto</span>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-zinc-800 hover:border-red-500/30 rounded-2xl py-8 px-4 text-center cursor-pointer bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col items-center gap-2.5 group"
                  >
                    <svg className="w-7 h-7 text-zinc-600 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                      Haz clic para seleccionar imágenes (puedes elegir varias)
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  {/* Listado de miniaturas con botón eliminar individual */}
                  {previewUrls.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2.5">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl border border-zinc-900 bg-zinc-900 group/thumb">
                          <img src={url} alt="mini" className="w-full h-full object-cover rounded-xl" />
                          <span className="absolute bottom-0 right-0 bg-zinc-950/80 text-zinc-500 font-mono font-bold text-[8px] px-1 rounded-tl-lg">
                            +{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md focus:outline-none"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nombre */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej: Bicicleta rin 20"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>

                {/* Precios Detal/Mayor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Precio al detal (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={priceDetal}
                      onChange={(e) => setPriceDetal(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Precio al mayor (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="120.00"
                      value={priceMayor}
                      onChange={(e) => setPriceMayor(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Mínimo unidades mayorista y descripción oculta/automatizada */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Mínimo al mayor (Uds)</label>
                    <input
                      type="number"
                      placeholder="3"
                      value={minMayor}
                      onChange={(e) => setMinMayor(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Variedades (Separadas por comas)</label>
                    <input
                      type="text"
                      placeholder="Ej: Rojo, Azul, Negro"
                      value={varieties}
                      onChange={(e) => setVarieties(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white focus:outline-none transition-all text-sm font-medium cursor-pointer"
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción (Rellenado básico o amplio) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Descripción</label>
                  <textarea
                    placeholder="Escribe los detalles clave del producto..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="mt-2 w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitLoading ? (
                    'Agregando...'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar producto
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 2. Categorías Management Card */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold tracking-wide text-white">Categorías</h2>
                <p className="text-zinc-500 text-xs mt-1">Crea y administra las categorías del catálogo.</p>
              </div>

              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Electrodomésticos"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-medium"
                  required
                />
                
                <button
                  type="submit"
                  disabled={categoryLoading}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  aria-label="Agregar categoría"
                  title="Agregar categoría"
                >
                  {/* Tag icon */}
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 8.25c-.97 0-1.75-.78-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75z" />
                  </svg>
                </button>
              </form>

              {/* Lista de Categorías */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <div 
                    key={cat._id}
                    className="flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="w-4.5 h-4.5 rounded-full bg-zinc-800 hover:bg-red-950/80 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
                      title="Eliminar categoría"
                    >
                      {/* Close or Trash icon */}
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Listado de Productos (7 cols) */}
          <section className="lg:col-span-7 p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-wide text-white">Productos ({products.length})</h2>
              {priceSavingId && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Guardando cambios...
                </div>
              )}
            </div>

            {products.length > 0 ? (
              <div className="flex flex-col gap-4">
                {products.map((prod) => {
                  const prodCategory = categories.find((c) => c._id === prod.category)?.name || prod.category;
                  const totalImages = prod.images.length;
                  const thumbnail = prod.images[0] || '/images/chair_red.jpg';

                  return (
                    <div 
                      key={prod._id}
                      className="group flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#0d0d0f] border border-zinc-900 rounded-2xl p-4 relative hover:border-zinc-800 transition-colors"
                    >
                      {/* Miniatura de Imagen con Badge +N */}
                      <div className="relative w-16 h-16 rounded-xl bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-800">
                        <img 
                          src={thumbnail} 
                          alt={prod.name}
                          className="w-full h-full object-cover" 
                        />
                        {totalImages > 1 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs select-none pointer-events-none">
                            +{totalImages - 1}
                          </div>
                        )}
                      </div>

                      {/* Detalles del Producto */}
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-bold text-white text-sm tracking-wide truncate pr-6" title={prod.name}>
                              {prod.name}
                            </h3>
                            <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold mt-0.5 block">
                              {prodCategory}
                            </span>
                          </div>
                        </div>

                        {/* Controles de Precio In-line */}
                        <div className="mt-3 flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Al detal:</span>
                            <input
                              type="text"
                              value={prod.priceDetal}
                              onChange={(e) => handlePriceFieldChange(prod._id, 'priceDetal', e.target.value)}
                              onBlur={() => handleSavePrices(prod)}
                              className="w-18 px-2 py-1 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white font-mono focus:border-red-500 focus:outline-none transition-colors text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Al mayor:</span>
                            <input
                              type="text"
                              value={prod.priceMayor}
                              onChange={(e) => handlePriceFieldChange(prod._id, 'priceMayor', e.target.value)}
                              onBlur={() => handleSavePrices(prod)}
                              className="w-18 px-2 py-1 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white font-mono focus:border-red-500 focus:outline-none transition-colors text-center"
                            />
                          </div>

                          <div className="text-[10px] text-zinc-500 italic mt-0.5 select-none font-medium">
                            Detal ${prod.priceDetal.toFixed(2)} · Mayor ${prod.priceMayor.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Botón para Eliminar Producto (Trash Can) */}
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="absolute sm:relative top-4 right-4 sm:top-auto sm:right-auto w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-950/60 text-zinc-650 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer focus:outline-none border border-zinc-850"
                        title="Eliminar producto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center rounded-2xl bg-zinc-900/10 border border-zinc-900 border-dashed">
                <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 11m8 4V5M4 11v10l8 4" />
                </svg>
                <h3 className="text-base font-bold text-zinc-400">Sin productos</h3>
                <p className="text-zinc-600 text-xs mt-0.5">El catálogo está vacío. Agrega uno en el formulario de la izquierda.</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
