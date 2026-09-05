# Product: Home & Toys Tío Willy

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
- **Consumidores directos (Detal):** Familias, compradores de juguetes, tecnología personal y artículos de confort para el hogar que buscan calidad, catálogo visual rápido y atención directa vía WhatsApp.
- **Socios Comerciales y Revendedores (Mayoristas):** Emprendedores, distribuidores y tiendas aliadas que descargan el catálogo formal en PDF de marca blanca para comercializar productos con sus propios márgenes y consultar tarifas al por mayor.
- **Administrador de Tienda:** El equipo interno de Tío Willy que gestiona el inventario, sube productos con fotos comprimidas, activa ofertas y pausa publicaciones según el stock en tiempo real.

## Product Purpose
Proporcionar una vitrina digital de alta gama (Landing Page y Catálogo Comercial B2B/B2C) para la tienda física y digital Home & Toys Tío Willy, ubicada en el Edificio Arvelo, Caracas. Facilita la exploración ágil de productos con precios en USD/EUR, cotización directa vía WhatsApp y generación instantánea de catálogos comerciales sin intermediarios lentos.

## Positioning
Catálogo comercial híbrido (Detal + Mayorista en marca blanca) con rendimiento instantáneo, navegación táctil con el pulgar, compra directa sin fricción de carritos complejos y panel de administración privado autónomo con recuperación por pregunta secreta.

## Operating Context
- **Dispositivos móviles (Android / iOS):** Navegación táctil con scroll horizontal magnético `snap-x`, carrusel Hero con gestos Swipe y botones ergonómicos $\ge 44\text{ px}$.
- **Escritorio / Tablet:** Panel administrativo responsivo, tabla de edición in-place de precios, generación de PDF A4 en marca blanca para socios comerciales.
- **WhatsApp Directo:** Puente principal de cierre de ventas con mensajes dinámicos autogenerados.

## Capabilities and Constraints
- Catálogo interactivo con filtrado por categorías, subcategorías dinámicas y búsqueda predictiva.
- Sistema de pausa/reanudación para control inmediato de inventario.
- Carrusel de ofertas destacadas con cálculo de descuento porcentual y precio anterior tachado.
- Base de datos MongoDB Atlas con singleton, timeouts estrictos (3.5s) y fallback de contingencia transparente.
- Restricción visual anti-fatiga: Sustituir negro absoluto (#000000) por gris profundo de alta fidelidad (`zinc-950` / `#09090b`).

## Brand Commitments
- Nombre: Home & Toys Tío Willy
- Logotipo distintivo con isotipo de casa, corazón y tipografía roja/blanca.
- Paleta oficial: Fondo anti-fatiga `zinc-950`, elevaciones en `zinc-900`, bordes sutiles `zinc-800` y acentos corporativos en rojo vivo (`#FF2D2D` / `red-600`).
- Tipografía oficial: Geist Sans / Geist Mono para métricas y precios.
