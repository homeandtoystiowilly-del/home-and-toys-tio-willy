'use client';

import React, { useState, useEffect } from 'react';

// Interfaz para el evento BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // Inicialmente oculto para evitar parpadeos

  useEffect(() => {
    // 1. Verificar si ya está instalada o ejecutándose en modo standalone
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 2. Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Revisar si el usuario lo descartó recientemente
    const dismissedTime = localStorage.getItem('tio_willy_pwa_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 5) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      // Mostrar tras 3 segundos de navegación para no saturar al usuario
      const timer = setTimeout(() => {
        setIsDismissed(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Capturar evento beforeinstallprompt (Android, Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Escuchar evento custom de instalación disparado desde botones del drawer/footer
    const handleTriggerInstall = () => {
      if (isIOSDevice) {
        setShowIOSModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsDismissed(true);
          }
        });
      } else {
        // En caso de que el navegador no soporte prompt directo
        setShowIOSModal(true);
      }
    };

    window.addEventListener('tio-willy-open-install', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('tio-willy-open-install', handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      setShowIOSModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] El usuario aceptó la instalación.');
      setDeferredPrompt(null);
      setIsDismissed(true);
    } else {
      console.log('[PWA] El usuario canceló la instalación.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tio_willy_pwa_dismissed', Date.now().toString());
  };

  // Si ya es app instalada o está descartado el banner flotante
  if (isStandalone) return null;

  return (
    <>
      {/* Banner flotante inferior elegante */}
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
                Instala Tío Willy en tu teléfono
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Acceso ultra rápido, navegación fluida y catálogo disponible incluso sin conexión.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
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

      {/* Modal / Sheet explicativo para iOS o navegadores que requieren instalación manual */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSModal(false)}
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
                <h3 className="text-base font-black text-white">Instalar en tu Pantalla</h3>
                <span className="text-xs text-red-400 font-bold">Home & Toys Tío Willy</span>
              </div>
            </div>

            <div className="space-y-3.5 my-4 text-xs text-zinc-300">
              <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isIOS ? 'Pulsa el botón de Compartir en Safari:' : 'Abre el menú de tu navegador:'}
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    {isIOS ? 'Ubicado en la barra inferior (icono de un cuadro con una flecha hacia arriba ⎋).' : 'Pulsa en los tres puntos (•••) en la esquina superior.'}
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
                    Busca la opción con el símbolo <strong>➕</strong> en el menú desplegable.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-white">¡Listo para usar!</p>
                  <p className="text-zinc-400 mt-0.5">
                    Se creará el icono de Tío Willy como una app nativa con apertura a pantalla completa.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
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
