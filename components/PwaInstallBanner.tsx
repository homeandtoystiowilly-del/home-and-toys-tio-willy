'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Declaración global para el evento capturado
declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type DeviceType = 'ios' | 'android' | 'desktop';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  // Detectar dispositivo y modo de ejecución
  useEffect(() => {
    // 1. Verificar si ya está instalada o abierta en modo standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Detectar tipo de dispositivo
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 3. Revisar si hay un prompt ya capturado en window
    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    // 4. Escuchar evento 'pwa-prompt-ready' desde el script de head o listener local
    const handlePromptReady = () => {
      if (window.__pwaDeferredPrompt) {
        setDeferredPrompt(window.__pwaDeferredPrompt);
      }
    };
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const p = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = p;
      setDeferredPrompt(p);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Gestión del banner flotante
    const dismissedTime = localStorage.getItem('tio_willy_pwa_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed >= 5) {
        setIsDismissed(false);
      }
    } else {
      const timer = setTimeout(() => {
        setIsDismissed(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Función principal para instalar
  const triggerInstallation = useCallback(async () => {
    const prompt = window.__pwaDeferredPrompt || deferredPrompt;

    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[PWA] Instalación aceptada por el usuario.');
          window.__pwaDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsDismissed(true);
        } else {
          console.log('[PWA] Instalación cancelada por el usuario.');
        }
        return;
      } catch (err) {
        console.warn('[PWA] Error al invocar prompt:', err);
      }
    }

    // Si no hay prompt nativo disponible (ej. iOS, o si el navegador lo bloquea), mostrar guía según el sistema operativo real
    setShowModal(true);
  }, [deferredPrompt]);

  // Escuchar evento personalizado emitido desde cualquier parte de la app (drawer, footer, etc.)
  useEffect(() => {
    const handleCustomInstall = () => {
      triggerInstallation();
    };
    window.addEventListener('tio-willy-open-install', handleCustomInstall);
    return () => {
      window.removeEventListener('tio-willy-open-install', handleCustomInstall);
    };
  }, [triggerInstallation]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tio_willy_pwa_dismissed', Date.now().toString());
  };

  // Si ya es app instalada, no mostrar nada
  if (isStandalone) return null;

  return (
    <>
      {/* Banner Flotante Inferior */}
      {!isDismissed && (
        <aside
          role="region"
          aria-label="Aviso de instalación de aplicación"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-white p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-500">App Oficial</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 font-bold px-1.5 py-0.2 rounded">Instalable</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                {deviceType === 'desktop' 
                  ? 'Instala la aplicación en tu computadora' 
                  : 'Instala Tío Willy en tu teléfono'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Acceso ultra rápido, catálogo offline y apertura en ventana propia.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={triggerInstallation}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Instalar App</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Más tarde
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar aviso"
              className="text-zinc-500 hover:text-zinc-300 p-1 shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Modal Guía Dinámico según el Sistema Operativo (Android, PC o iOS) */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 overflow-hidden">
                <img src="/icons/icon-192x192.png" alt="Tío Willy" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {deviceType === 'desktop' ? 'Instalar en tu PC / Mac' : 'Instalar en tu Pantalla'}
                </h3>
                <span className="text-xs text-red-400 font-bold">Home & Toys Tío Willy</span>
              </div>
            </div>

            {/* Guía Específica para Android */}
            {deviceType === 'android' && (
              <div className="space-y-3.5 my-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Abre el menú de Chrome en Android:</p>
                    <p className="text-zinc-400 mt-0.5">
                      Pulsa sobre los tres puntos <strong>(⋮)</strong> en la esquina superior derecha.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Selecciona "Instalar aplicación":</p>
                    <p className="text-zinc-400 mt-0.5">
                      (O también puede decir <strong>"Agregar a la pantalla principal"</strong>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-white">¡Icono creado automáticamente!</p>
                    <p className="text-zinc-400 mt-0.5">
                      Se instalará con el logo de Tío Willy en tu cajón de aplicaciones.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Guía Específica para PC / Desktop (Chrome / Edge) */}
            {deviceType === 'desktop' && (
              <div className="space-y-3.5 my-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Barra de direcciones:</p>
                    <p className="text-zinc-400 mt-0.5">
                      Haz clic en el icono de instalación 💻 con flecha hacia abajo en la barra superior de Chrome o Edge (al lado de la estrella de favoritos).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">O desde el menú principal:</p>
                    <p className="text-zinc-400 mt-0.5">
                      Haz clic en los tres puntos <strong>(⋮)</strong> arriba a la derecha ➔ <strong>"Guardar y compartir"</strong> ➔ <strong>"Instalar Tío Willy"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-white">Acceso en tu Escritorio:</p>
                    <p className="text-zinc-400 mt-0.5">
                      Se abrirá en su propia ventana sin marcos y creará un acceso directo en tu escritorio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Guía Específica para iOS (Safari iPhone / iPad) */}
            {deviceType === 'ios' && (
              <div className="space-y-3.5 my-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Pulsa el botón Compartir en Safari:</p>
                    <p className="text-zinc-400 mt-0.5">
                      En la barra inferior de Safari, pulsa el icono de un cuadro con flecha hacia arriba <strong>⎋</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Selecciona "Agregar a pantalla de inicio":</p>
                    <p className="text-zinc-400 mt-0.5">
                      Desliza hacia abajo en el menú y selecciona la opción con el símbolo <strong>➕</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-white">¡Listo en tu iPhone!</p>
                    <p className="text-zinc-400 mt-0.5">
                      Se agregará el icono de Tío Willy para abrir a pantalla completa.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
