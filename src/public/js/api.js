// Archivo: public/js/api.js

const API_URL = "http://localhost:3000/api/";

export async function sendData(endpoint, data = {}, method = "POST") {
    try {
        const response = await fetch(API_URL + endpoint, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: method === "GET" ? null : JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: "Error desconocido"
            }));
            throw new Error(errorData.message || "Error en la solicitud");
        }

        return await response.json();

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
