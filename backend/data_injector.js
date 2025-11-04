// Script para simular el envío de datos de energía a la API cada 5 segundos
const axios = require('axios');
const API_URL = 'http://localhost:5000/api/data';

console.log('[+] Iniciando Inyector de datos. Enviando a ' + API_URL + ' cada 5 segundos');

// Función que genera un valor de consumo aleatorio
function generateRandomConsumption() {
    // Simula una variación de consumo entre 50 kWh y 150 kWh
    return (Math.random() * (100) + 50).toFixed(2);
}

// Función principal para enviar el dato a la API
async function sendData() {
    const value = generateRandomConsumption();
    
    try {
        const payload = {
            value: parseFloat(value),
            type: 'kWh', 
            timestamp: new Date()
        };

        // Hace la petición POST al servidor Express
        await axios.post(API_URL, payload);
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Dato enviado: ${value} kWh`);

    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Error al enviar dato. ¿El servidor Express está corriendo en la Terminal 1?`);
        if (error.response) {
             console.error(`Status: ${error.response.status}, Mensaje: ${error.response.data.message}`);
        } else if (error.code === 'ECONNREFUSED') {
             console.error(`ERROR: Conexión rechazada. Asegúrate que el servidor Express esté iniciado en http://localhost:5000.`);
        }
    }
}

// Ejecutar la función inmediatamente y luego cada 5 segundos
sendData();
setInterval(sendData, 5000);