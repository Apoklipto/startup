const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ======================
// FUNCIÓN PARA LEER TODOS LOS PRODUCTOS DEL JSON
// ======================
function leerTodosLosProductos() {
  const jsonPath = path.join(__dirname, 'productos.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ No se encuentra productos.json');
    return { config: {}, productos: [] };
  }
  
  const contenido = fs.readFileSync(jsonPath, 'utf-8');
  const datos = JSON.parse(contenido);
  
  // Solo publicar los marcados
  const productos = datos.productos.filter(p => p.publicar !== false);
  
  console.log(`📦 ${productos.length} productos para publicar`);
  
  return {
    config: datos.config || {},
    productos: productos
  };
}

// ======================
// PROGRAMA PRINCIPAL
// ======================
(async () => {
  const carpetaSesion = path.join(__dirname, 'sesion_facebook');

  console.log('🟢 Abriendo navegador...');
  const browser = await chromium.launchPersistentContext(carpetaSesion, {
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    viewport: { width: 1280, height: 720},
    slowMo: 300
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

      // Verificar si hay sesión
    const estaLogueado = await page.locator('text=¿Quién eres?').count() === 0;
    if (!estaLogueado) {
        console.log('⚠️ No hay sesión activa. Inicia sesión localmente primero.');
        // Guardar estado de sesión
    }
  // ======================
  // 1. IR A FACEBOOK
  // ======================
  console.log('🌐 Navegando a Facebook...');
  try {
    await page.goto('https://www.facebook.com', {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    console.log('⏳ Esperando 5 segundos...');
    await page.waitForTimeout(5000);
    console.log('✅ Facebook cargado.');
  } catch (error) {
    console.error('❌ No se pudo cargar Facebook:', error.message);
    await browser.close();
    return;
  }

  // ======================
  // 2. IR AL GRUPO
  // ======================
  const grupoID = '2280670018999339';
  const urlGrupo = `https://www.facebook.com/groups/${grupoID}`;

  console.log(`➡️ Navegando al grupo ${grupoID}...`);
  try {
    await page.goto(urlGrupo, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    console.log('✅ URL del grupo cargada.');
  } catch (error) {
    console.error('❌ No se pudo cargar el grupo:', error.message);
    await browser.close();
    return;
  }

// 3. CARGAR PRODUCTOS DEL JSON
console.log('📋 Cargando productos...');
const datos = leerTodosLosProductos();
const productos = datos.productos;
const config = datos.config;
const numeroContacto = config.numeroContacto || '54320330';

if (productos.length === 0) {
  console.error('❌ No hay productos para publicar');
  await browser.close();
  return;
}

console.log(`📊 Total: ${productos.length} productos`);
console.log(`📞 Contacto: ${numeroContacto}`);


  // ======================
  // 4. BUCLE DE PUBLICACIONES (SOLO UN FOR)
  // ======================
  for (let index = 0; index < productos.length; index++) {
    console.log(`\n📦 [${index + 1}/${productos.length}] Iniciando...`);
    
    try {
      // Esperar a que la página esté estable
      await page.waitForTimeout(3000);
      
      // Hacer clic en "Escribe algo..."
      console.log('🔍 Buscando "Escribe algo..."...');
      await page.waitForTimeout(2000);
      
      const cajaTexto = page.locator('span:has-text("Escribe algo...")').first();
      await cajaTexto.waitFor({ state: 'visible', timeout: 30000 });
      await cajaTexto.click();
      console.log('🖱️ Clic en "Escribe algo..." exitoso.');

      // Esperar modal
      console.log('⏳ Esperando modal...');
      const modalPublicacion = page.locator('[role="dialog"]:has-text("Crear publicación")').first();
      await modalPublicacion.waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForTimeout(3000);
      console.log('✅ Modal abierto');

      // Buscar editor
      console.log('🔍 Buscando editor...');
      let editor;
      try {
        editor = modalPublicacion.locator('[contenteditable="true"]').first();
        await editor.waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        editor = page.locator('[contenteditable="true"]').first();
        await editor.waitFor({ state: 'visible', timeout: 10000 });
      }
      console.log('✅ Editor encontrado');

      // Inyectar texto
      const producto = productos[index];
      const texto = `${producto.nombre}\n\n${producto.descripcion}\n\nPrecio: ${producto.precio}.\nEscribir al ${numeroContacto}`;
      
      await editor.click();
      await page.waitForTimeout(1500);
      await editor.fill('');
      await page.waitForTimeout(500);
      await editor.fill(texto);
      await page.waitForTimeout(1000);
      console.log('✅ Texto inyectado');

// ==========================================
// SUBIR IMAGEN (OBLIGATORIA)
// ==========================================
const rutaImagen = path.join(__dirname, 'image', producto.imagen);
console.log('📁 Ruta construida:', rutaImagen);

// VERIFICAR QUE LA IMAGEN EXISTE
if (!fs.existsSync(rutaImagen)) {
  console.error(`❌ IMAGEN NO ENCONTRADA: ${producto.imagen}`);
  console.error(`❌ Saltando producto: ${producto.nombre}`);
  console.error('   Ruta buscada:', rutaImagen);
  
  // CERRAR EL MODAL SIN PUBLICAR
  try {
    const botonCerrar = page.locator('[role="dialog"] div[aria-label="Cerrar"]').first();
    await botonCerrar.click();
    await page.waitForTimeout(2000);
  } catch {
    // Si no encuentra botón cerrar, refrescar
    await page.reload();
    await page.waitForTimeout(3000);
  }
  
  continue; // SALTAR AL SIGUIENTE PRODUCTO
}

console.log('✅ Imagen encontrada');
console.log('📎 Subiendo imagen...');

try {
  // Crear promesa para el filechooser ANTES de hacer clic
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 20000 });
  
  // Buscar botón Foto/video con múltiples opciones
  let botonFoto;
  
  try {
    botonFoto = page.locator('div[aria-label="Foto/video"]').first();
    await botonFoto.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Botón Foto/video encontrado');
  } catch {
    try {
      botonFoto = page.locator('span:has-text("Foto/video")').first();
      await botonFoto.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Botón Foto/video encontrado (alternativo)');
    } catch {
      const botones = modalPublicacion.locator('div[role="button"]');
      const count = await botones.count();
      for (let i = 0; i < count; i++) {
        const texto = await botones.nth(i).textContent();
        if (texto && texto.includes('Foto')) {
          botonFoto = botones.nth(i);
          console.log('✅ Botón Foto/video encontrado por búsqueda');
          break;
        }
      }
    }
  }
  
  await botonFoto.click();
  console.log('🖱️ Clic en Foto/video');
  
  // Esperar al diálogo de archivos
  const fileChooser = await fileChooserPromise;
  console.log('✅ Diálogo de archivos capturado');
  
  // Inyectar archivo
  await fileChooser.setFiles(rutaImagen);
  console.log('📁 Archivo inyectado:', producto.imagen);
  
  // Esperar a que se cargue
  await page.waitForTimeout(7000);
  console.log('✅ Imagen cargada en el compositor');
  
} catch (error) {
  console.error('❌ Error al subir imagen:', error.message);
  await page.screenshot({ path: `error_imagen_${Date.now()}.png`, fullPage: true });
  
  // Cerrar modal y saltar
  try {
    await page.reload();
    await page.waitForTimeout(3000);
  } catch {}
  
  continue; // SALTAR AL SIGUIENTE PRODUCTO
}

      // Publicar
      console.log('🚀 Publicando...');
      await page.waitForTimeout(2000);
      
      const botonPublicar = page.locator('[role="dialog"] div[role="button"]:has-text("Publicar")').first();
      await botonPublicar.waitFor({ state: 'visible', timeout: 15000 });
      await botonPublicar.click();
      console.log(`✅ [${index + 1}/${productos.length}] PUBLICADO`);

      // Esperar a que se cierre el modal
      console.log('⏳ Esperando que se cierre el modal...');
      await page.waitForTimeout(5000);
      
      try {
        await modalPublicacion.waitFor({ state: 'hidden', timeout: 15000 });
        console.log('✅ Modal cerrado');
      } catch {
        console.log('⚠️ El modal no se cerró, refrescando...');
        await page.reload();
        await page.waitForTimeout(5000);
      }

      // Esperar entre publicaciones
      if (index < productos.length - 1) {
        console.log('⏳ Esperando 20 segundos antes del siguiente...');
        await page.waitForTimeout(20000);
      }

    } catch (error) {
      console.error(`❌ Error en producto ${index + 1}:`, error.message);
      
      try {
        await page.reload();
        await page.waitForTimeout(5000);
        console.log('🔄 Página refrescada después del error');
      } catch {
        console.log('⚠️ No se pudo refrescar');
      }
    }
  }

  console.log('\n📊 FINALIZADO');
  console.log('⏳ Cerrando en 5 segundos...');
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('🔒 Navegador cerrado.');

})();