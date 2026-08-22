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
  updateProductPricesAction,
  updateProductAction,
  updateMapUrlAction,
  updateGlobalCurrencyAction 
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
  currency?: string;
  subcategory?: string;
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
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
          0.6
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
  initialMapUrl: string;
  initialCurrency: string;
}

export default function AdminClient({ isAuthorized, categories: serverCategories, initialProducts, initialMapUrl, initialCurrency }: AdminClientProps) {
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

  // Temporizador de inactividad de 60 segundos
  useEffect(() => {
    // Solo activar el temporizador si el usuario está autorizado
    if (!isAuthorized) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout(true); // Cerrar sesión y redirigir con parámetro
      }, 60000); // 60 segundos (1 minuto)
    };

    // Eventos a monitorear para detectar actividad
    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'keydown', 'touchstart'];

    // Inicializar el timer
    resetTimer();

    // Agregar event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup al desmontar o desautorizar
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthorized]);

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
  const [subcategory, setSubcategory] = useState('');
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

  // Estados de edición de productos
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState<boolean>(false);

  // Estados del mapa
  const [mapUrlInput, setMapUrlInput] = useState(initialMapUrl || '');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapSuccessMsg, setMapSuccessMsg] = useState('');
  const [mapErrorMsg, setMapErrorMsg] = useState('');

  // Estados de la moneda global
  const [globalCurrency, setGlobalCurrency] = useState(initialCurrency || 'USD');
  const [currencySuccessMsg, setCurrencySuccessMsg] = useState('');
  const [currencyErrorMsg, setCurrencyErrorMsg] = useState('');
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // Sincronizar moneda global cuando cambie desde las props del servidor
  useEffect(() => {
    setGlobalCurrency(initialCurrency);
  }, [initialCurrency]);

  const handleUpdateGlobalCurrency = async (newVal: string) => {
    setGlobalCurrency(newVal);
    setCurrencyLoading(true);
    setCurrencySuccessMsg('');
    setCurrencyErrorMsg('');

    try {
      const res = await updateGlobalCurrencyAction(newVal);
      if (res.success) {
        setCurrencySuccessMsg(`Moneda actualizada a ${newVal === 'EUR' ? 'EUR (€)' : 'USD ($)'}`);
        router.refresh();
      } else {
        setCurrencyErrorMsg(res.error || 'Error al actualizar la moneda.');
      }
    } catch (err: any) {
      setCurrencyErrorMsg(err.message || 'Error de red al actualizar la moneda.');
    } finally {
      setCurrencyLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para buscador, paginación y confirmación
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
  const handleLogout = async (inactivityRedirect = false) => {
    try {
      // Borrar la sesión en el servidor (eliminar cookies de autenticación)
      await logoutAction();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      // Redirigir automáticamente a la página principal del catálogo
      window.location.href = inactivityRedirect ? '/?inactivity=1' : '/';
    }
  };

  // Manejar cambio de imágenes con compresión automática secuencial
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCompressing(true);
      const files = Array.from(e.target.files);
      const compressedFiles: File[] = [];
      
      try {
        // Compresión secuencial uno a uno para no congelar el hilo principal en celulares
        for (const file of files) {
          if (file.type.startsWith('image/') && file.size > 200 * 1024) {
            const compressed = await compressImage(file);
            compressedFiles.push(compressed);
          } else {
            compressedFiles.push(file);
          }
        }

        const urls = compressedFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...urls]);
        setSelectedFiles((prev) => [...prev, ...compressedFiles]);
      } catch (err) {
        console.error('Error al procesar imágenes:', err);
      } finally {
        setCompressing(false);
      }
    }
  };

  // Quitar imagen seleccionada
  const handleRemoveFile = (idxToRemove: number) => {
    URL.revokeObjectURL(previewUrls[idxToRemove]);
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Iniciar edición de un producto
  const handleStartEdit = (product: Product) => {
    setEditingProductId(product._id);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setPriceDetal(product.priceDetal.toString());
    setPriceMayor(product.priceMayor.toString());
    setMinMayor(product.minMayor.toString());
    setVarieties(product.varieties.join(', '));
    setSubcategory(product.subcategory || '');
    setExistingImages(product.images || []);
    
    // Limpiar archivos locales recién seleccionados para evitar mezclas involuntarias
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Hacer scroll suave hacia el formulario (izquierda) en móviles
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar la edición
  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setCategory(categories[0]?._id || '');
    setPriceDetal('');
    setPriceMayor('');
    setMinMayor('3');
    setVarieties('Estándar');
    setSubcategory('');
    setExistingImages([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Quitar una imagen activa de las ya subidas
  const handleRemoveExistingImage = (idxToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Guardar (Agregar o Actualizar) Producto
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
    formData.append('subcategory', subcategory);
    
    if (editingProductId) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      let res;
      if (editingProductId) {
        res = await updateProductAction(editingProductId, formData);
      } else {
        res = await createProductAction(formData);
      }

      if (res.success) {
        setSuccessMsg(res.message || 'Producto guardado con éxito.');
        // Limpiar formulario / salir de edición
        setName('');
        setDescription('');
        setPriceDetal('');
        setPriceMayor('');
        setMinMayor('3');
        setVarieties('Estándar');
        setSubcategory('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setExistingImages([]);
        setEditingProductId(null);
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

  // Actualizar Ubicación de Mapa
  const handleUpdateMapUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setMapLoading(true);
    setMapSuccessMsg('');
    setMapErrorMsg('');

    try {
      const res = await updateMapUrlAction(mapUrlInput);
      if (res.success) {
        setMapSuccessMsg(res.message || 'Ubicación actualizada con éxito.');
        router.refresh();
      } else {
        setMapErrorMsg(res.error || 'Error al actualizar la ubicación.');
      }
    } catch (err: any) {
      setMapErrorMsg(err.message || 'Error de red al actualizar la ubicación.');
    } finally {
      setMapLoading(false);
    }
  };

  // Eliminar Producto (Disparar Modal de Confirmación)
  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  // Confirmar y Ejecutar Eliminación Real
  const executeDeleteProduct = async (id: string) => {
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

  // Filtrar y paginar productos para el listado del panel de administración
  const filteredProducts = products.filter((prod) => {
    const query = adminSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      prod.name.toLowerCase().includes(query) ||
      prod.description.toLowerCase().includes(query) ||
      (categories.find((c) => c._id === prod.category)?.name || '').toLowerCase().includes(query)
    );
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Ajustar la página si los filtros dejan al usuario fuera de rango
  const activeAdminPage = Math.min(adminPage, Math.max(1, totalPages));

  const paginatedAdminProducts = filteredProducts.slice(
    (activeAdminPage - 1) * itemsPerPage,
    activeAdminPage * itemsPerPage
  );

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
            onClick={() => handleLogout(false)}
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
                <h2 className="text-xl font-bold tracking-wide text-white">
                  {editingProductId ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <p className="text-zinc-500 text-xs mt-1">
                  {editingProductId 
                    ? 'Modifica los campos del producto y guarda los cambios.' 
                    : 'Sube una o varias imágenes desde tu ordenador y completa los datos.'}
                </p>
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
                    onClick={() => {
                      if (!compressing) fileInputRef.current?.click();
                    }}
                    className={`w-full border border-dashed rounded-2xl py-8 px-4 text-center bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-300 flex flex-col items-center gap-2.5 group ${
                      compressing 
                        ? 'border-red-500/40 cursor-not-allowed opacity-75' 
                        : 'border-zinc-800 hover:border-red-500/30 cursor-pointer'
                    }`}
                  >
                    {compressing ? (
                      <>
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-red-400 animate-pulse">
                          Procesando y optimizando imágenes... Por favor espera.
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-7 h-7 text-zinc-600 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                          Haz clic para seleccionar imágenes (puedes elegir varias)
                        </span>
                      </>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  {/* Listado de miniaturas (Existentes y Nuevas) */}
                  {(existingImages.length > 0 || previewUrls.length > 0) && (
                    <div className="mt-2.5 flex flex-wrap gap-2.5">
                      {/* Imágenes Activas Existentes */}
                      {existingImages.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative w-14 h-14 rounded-xl border border-zinc-900 bg-zinc-900 group/thumb">
                          <img src={url} alt="existing" className="w-full h-full object-cover rounded-xl opacity-80" />
                          <span className="absolute bottom-0 right-0 bg-red-950/90 text-red-500 font-mono font-bold text-[8px] px-1 rounded-tl-lg uppercase">
                            Activa
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md focus:outline-none"
                            title="Quitar imagen actual"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Imágenes Nuevas (Previsualización local) */}
                      {previewUrls.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative w-14 h-14 rounded-xl border border-zinc-900 bg-zinc-900 group/thumb">
                          <img src={url} alt="mini" className="w-full h-full object-cover rounded-xl" />
                          <span className="absolute bottom-0 right-0 bg-zinc-950/80 text-zinc-500 font-mono font-bold text-[8px] px-1 rounded-tl-lg uppercase">
                            Nueva
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md focus:outline-none"
                            title="Quitar imagen nueva"
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
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Precio al detal ({globalCurrency})</label>
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
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Precio al mayor ({globalCurrency})</label>
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

                {/* Subcategoría Manual */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Subcategoría (Opcional)</label>
                    <span className="text-[10px] text-zinc-650 italic">Ej: Rin 12, Rin 16, Audio, Muebles</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Dejar en blanco para autodetectar"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-sm font-medium"
                  />
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
                   <button
                    type="submit"
                    disabled={submitLoading || compressing}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-550 active:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitLoading ? (
                      editingProductId ? 'Actualizando...' : 'Agregando...'
                    ) : (
                      <>
                        {editingProductId ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Actualizar producto
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar producto
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={submitLoading || compressing}
                      className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl font-bold transition-all cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
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

            {/* 3. Configuración de Ubicación (Google Maps) Card */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold tracking-wide text-white">Ubicación del Negocio</h2>
                <p className="text-zinc-500 text-xs mt-1">Configura el mapa de Google Maps que se muestra en tu catálogo.</p>
              </div>

              {mapSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {mapSuccessMsg}
                </div>
              )}

              {mapErrorMsg && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {mapErrorMsg}
                </div>
              )}

              <form onSubmit={handleUpdateMapUrl} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Enlace del iframe (src)</span>
                  <input
                    type="url"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={mapUrlInput}
                    onChange={(e) => setMapUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-650 focus:outline-none transition-all text-xs font-mono"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={mapLoading}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 hover:text-white rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {mapLoading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Guardar Ubicación
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 4. Configuración de Moneda Global Card */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold tracking-wide text-white">Moneda Global del Catálogo</h2>
                <p className="text-zinc-500 text-xs mt-1">Configura la divisa de toda la tienda. Los cambios se guardan y aplican automáticamente.</p>
              </div>

              {currencySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {currencySuccessMsg}
                </div>
              )}

              {currencyErrorMsg && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {currencyErrorMsg}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Divisa Seleccionada</span>
                <select
                  value={globalCurrency}
                  onChange={(e) => handleUpdateGlobalCurrency(e.target.value)}
                  disabled={currencyLoading}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white focus:outline-none transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <option value="USD" className="bg-zinc-950 text-white">Dólares (USD $)</option>
                  <option value="EUR" className="bg-zinc-950 text-white">Euros (EUR €)</option>
                </select>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Listado de Productos (7 cols) */}
          <section className="lg:col-span-7 p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl shadow-black/60 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-wide text-white">Productos ({filteredProducts.length})</h2>
              {priceSavingId && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Guardando cambios...
                </div>
              )}
            </div>

            {/* Buscador de productos */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, descripción o categoría..."
                value={adminSearchQuery}
                onChange={(e) => {
                  setAdminSearchQuery(e.target.value);
                  setAdminPage(1); // Resetear a la primera página al escribir
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl focus:border-red-500/80 focus:ring-1 focus:ring-red-500/25 text-white placeholder-zinc-550 focus:outline-none transition-all text-xs font-medium"
              />
            </div>

            {paginatedAdminProducts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {paginatedAdminProducts.map((prod) => {
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
                            Detal {globalCurrency === 'EUR' ? '€' : '$'}{prod.priceDetal.toFixed(2)} · Mayor {globalCurrency === 'EUR' ? '€' : '$'}{prod.priceMayor.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="absolute sm:relative top-4 right-4 sm:top-auto sm:right-auto flex sm:flex-row gap-2">
                        {/* Botón para Editar Producto (Pencil) */}
                        <button
                          onClick={() => handleStartEdit(prod)}
                          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 hover:text-red-400 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer focus:outline-none border border-zinc-850"
                          title="Editar producto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Botón para Eliminar Producto (Trash Can) */}
                        <button
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-950/60 text-zinc-650 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer focus:outline-none border border-zinc-850"
                          title="Eliminar producto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
                <p className="text-zinc-600 text-xs mt-0.5">No hay productos que coincidan con la búsqueda.</p>
              </div>
            )}

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-900/80 pt-4 mt-2">
                <button
                  type="button"
                  disabled={activeAdminPage <= 1}
                  onClick={() => setAdminPage((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-450 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
                
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Página {activeAdminPage} de {totalPages}
                </span>

                <button
                  type="button"
                  disabled={activeAdminPage >= totalPages}
                  onClick={() => setAdminPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-450 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Siguiente
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Modal de Confirmación de Eliminación */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 text-red-500 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">¿Está seguro de que desea borrar este producto?</h3>
              <p className="text-xs text-zinc-500 mt-1.5">Esta acción no se puede deshacer y el producto desaparecerá del catálogo público.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (productToDelete) {
                    executeDeleteProduct(productToDelete);
                    setProductToDelete(null);
                  }
                }}
                className="py-2.5 bg-red-600 hover:bg-red-550 active:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
