// Script para simular el envío de datos de energía a la API cada 5 segundos
const axios = require('axios');
// Apuntamos a localhost:5000, donde está nuestro contenedor Docker
const API_URL = 'http://localhost:5000/api/data/inject';

console.log('[+] Iniciando Inyector de datos. Enviando a ' + API_URL + ' cada 5 segundos');

// Función que genera un valor de consumo aleatorio
function generateRandomConsumption() {
    // Simula una variación de consumo entre 50 kWh y 150 kWh
    return (Math.random() * (100) + 50).toFixed(2);
}

// Función principal para enviar el dato a la API
async function sendData() {
    const randomValue = generateRandomConsumption();
    
    try {
        // --- *** CORRECCIÓN *** ---
        // El 'payload' debe coincidir con el Schema de Mongoose en server.js
        const payload = {
            sensorId: "Sensor-01 (Industrial)", // <-- ERROR 2 ARREGLADO: Añadimos un ID
            valor: parseFloat(randomValue)     // <-- ERROR 1 ARREGLADO: Cambiado de 'value' a 'valor'
            // No necesitamos 'type' o 'timestamp', el servidor los maneja.
        };
        // --- *** FIN DE LA CORRECCIÓN *** ---

        // Hace la petición POST al servidor Express (en Docker)
        await axios.post(API_URL, payload);
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Dato enviado: ${randomValue} kWh`);

    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Error al enviar dato. ¿El servidor Express está corriendo?`);
        if (error.response) {
            // El error 500 que veíamos antes
             console.error(`Status: ${error.response.status}, Mensaje: ${error.response.data}`);
        } else if (error.code === 'ECONNREFUSED') {
             console.error(`ERROR: Conexión rechazada. Asegúrate que el contenedor Docker esté corriendo.`);
        } else {
            console.error(error.message);
        }
    }
}

// Ejecutar la función inmediatamente y luego cada 5 segundos
sendData();
setInterval(sendData, 5000);