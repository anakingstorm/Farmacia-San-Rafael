/**
 * SIICAR Setup & Testing Utilities
 * 
 * Usa este script para:
 * 1. Generar claves secretas
 * 2. Testear conexión con SIICAR local
 * 3. Probar sincronización
 * 
 * Uso: node siicar-utils.js [command] [options]
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============= UTILITIES =============

function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env.local no encontrado');
    return {};
  }
  
  const env = {};
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  return env;
}

async function testConnection(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            data
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout (5s)' });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// ============= COMMANDS =============

async function cmdGenerateSecrets() {
  console.log('\n📝 Generando claves secretas...\n');
  
  const cronSecret = generateSecretKey();
  const siicarKey = generateSecretKey();
  
  console.log('CRON_SECRET:');
  console.log(`  ${cronSecret}\n`);
  
  console.log('SIICAR_LOCAL_KEY:');
  console.log(`  ${siicarKey}\n`);
  
  console.log('✅ Copia estas en tu .env.local\n');
}

async function cmdTestSiicar() {
  const env = loadEnv();
  const siicarUrl = env.SIICAR_LOCAL_URL || 'http://localhost:9500';
  
  console.log(`\n🔗 Testeando conexión con SIICAR...\n`);
  console.log(`   URL: ${siicarUrl}`);
  
  const healthUrl = `${siicarUrl}/api/health`;
  const result = await testConnection(healthUrl);
  
  if (result.success) {
    console.log(`✅ SIICAR está conectado\n`);
    console.log('   Endpoints disponibles:');
    console.log('   - GET  /api/health');
    console.log('   - GET  /api/productos');
    console.log('   - GET  /api/inventario');
    console.log('   - GET  /api/ventas?minutosAtras=5');
    console.log('   - GET  /api/compras?minutosAtras=5\n');
  } else {
    console.log(`❌ No se pudo conectar a SIICAR\n`);
    console.log(`   Error: ${result.error}\n`);
    console.log('   Verifica:');
    console.log('   1. ¿siicar-local-bridge.js está corriendo?');
    console.log('   2. ¿${SIICAR_LOCAL_URL} es correcta?');
    console.log('   3. ¿El puerto está abierto?\n');
  }
}

async function cmdTestNgrok() {
  const env = loadEnv();
  const siicarUrl = env.SIICAR_LOCAL_URL || 'http://localhost:9500';
  
  console.log(`\n📡 Testeando ngrok...\n`);
  
  if (!siicarUrl.includes('ngrok')) {
    console.log('⚠️  SIICAR_LOCAL_URL no parece ser un ngrok\n');
    console.log('   URL: ' + siicarUrl);
    console.log('\n   Para usar ngrok:\n');
    console.log('   1. Descargar: https://ngrok.com/download');
    console.log('   2. Ejecutar: ngrok http 9500');
    console.log('   3. Copiar URL (ej: https://abc123.ngrok.io)');
    console.log('   4. Guardar en SIICAR_LOCAL_URL\n');
    return;
  }
  
  const result = await testConnection(`${siicarUrl}/api/health`);
  
  if (result.success) {
    console.log(`✅ ngrok está activo y SIICAR es accesible\n`);
  } else {
    console.log(`❌ ngrok no está respondiendo\n`);
    console.log(`   Error: ${result.error}\n`);
    console.log('   Verifica que ngrok esté corriendo:\n');
    console.log('   ngrok http 9500\n');
  }
}

async function cmdSetupEnv() {
  console.log(`\n⚙️  Configurando .env.local...\n`);
  
  const envPath = path.join(__dirname, '.env.local');
  const examplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(examplePath)) {
    console.log('❌ .env.example no encontrado\n');
    return;
  }
  
  if (fs.existsSync(envPath)) {
    console.log(`⚠️  .env.local ya existe\n`);
    return;
  }
  
  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  fs.writeFileSync(envPath, exampleContent);
  
  console.log('✅ .env.local creado desde .env.example\n');
  console.log('   Edita el archivo y completa:');
  console.log('   - SIICAR_LOCAL_URL');
  console.log('   - SIICAR_LOCAL_KEY');
  console.log('   - CRON_SECRET\n');
}

async function cmdHelp() {
  console.log(`
╔════════════════════════════════════════════╗
║  SIICAR Utilities                          ║
╚════════════════════════════════════════════╝

Uso: node siicar-utils.js [command]

Comandos:

  secrets          Generar claves secretas
  test-siicar      Testear conexión con SIICAR local
  test-ngrok       Testear ngrok
  setup-env        Crear .env.local desde .env.example
  help             Mostrar esta ayuda

Ejemplos:

  node siicar-utils.js secrets
  node siicar-utils.js test-siicar
  node siicar-utils.js setup-env
  
  `);
}

// ============= MAIN =============

async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'secrets':
      await cmdGenerateSecrets();
      break;
    case 'test-siicar':
      await cmdTestSiicar();
      break;
    case 'test-ngrok':
      await cmdTestNgrok();
      break;
    case 'setup-env':
      await cmdSetupEnv();
      break;
    case 'help':
    default:
      await cmdHelp();
  }
}

main().catch(console.error);
