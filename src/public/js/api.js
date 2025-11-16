// public/js/api.js
const BASE_URL = 'http://localhost:3000/api'; 

export async function sendData(endpoint, data, method = 'POST') {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `Error HTTP ${response.status}`);
        }

        return responseData;

    } catch (error) {
        console.error("Error en sendData:", error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error('No se pudo conectar con el servidor. ¿Está ejecutando node server.js?');
        }
        throw error;
    }
}