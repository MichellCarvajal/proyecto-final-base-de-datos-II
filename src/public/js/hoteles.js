// hoteles.js
import { sendData } from "./api.js";

export function initHoteles() {
    console.log("🏨 initHoteles() cargado correctamente.");

    const form = document.getElementById("form-hoteles");
    const contenedor = document.getElementById("hoteles-resultados");

    if (!form) {
        console.error("❌ No se encontró #form-hoteles");
        return;
    }

    /**
     * 🏨 RENDERIZADOR ESTILIZADO DE HOTELES
     */
    function renderHoteles(hoteles) {
    contenedor.innerHTML = "";

    if (!hoteles || hoteles.length === 0) {
        contenedor.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-xl shadow-inner mt-6 text-center">
                <p class="text-gray-500 font-medium text-lg">
                    No se encontraron hoteles disponibles. 😔
                </p>
            </div>
        `;
        return;
    }

    hoteles.forEach(hotel => {
        const card = document.createElement("div");
        card.className =
            "w-full flex items-center justify-between p-4 bg-white border rounded-xl shadow-md";

        card.innerHTML = `
            <div>
                <p class="text-xl font-bold text-gray-800">${hotel.nombre}</p>
                <p class="text-gray-500">${hotel.ciudad}, ${hotel.pais}</p>
                <p class="text-green-600 font-semibold mt-1">
                    Habitaciones disponibles: ${hotel.habitacionesDisponibles}
                </p>
            </div>

            <button 
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg">
                Ver habitaciones
            </button>
        `;

        contenedor.appendChild(card);
    });
}


    /**
     * 📤 MANEJAR SUBMIT
     */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const destino = document.getElementById("input-destino-hotel").value.trim();
        const fechaCheckin = document.getElementById("input-fecha-salida-hotel").value;
        const fechaCheckout = document.getElementById("input-fecha-regreso-hotel").value;
        const habitaciones = parseInt(document.getElementById("input-habitaciones-hotel").value) || 1;
        const viajeros = parseInt(document.getElementById("input-viajeros-hotel").value) || 1;
        const estrellas = parseInt(document.getElementById("select-estrellas-hotel").value);

        if (!destino || !fechaCheckin || !fechaCheckout) {
            alert("⚠️ Debes completar destino, check-in y check-out.");
            return;
        }

        const filtros = {
    destino,

    // Antiguos (compatibilidad)
    fechaCheckin,
    fechaCheckout,

    // Nuevos (lo que el backend REALMENTE usa)
    fechaSalida: fechaCheckin,
    fechaRegreso: fechaCheckout,

    habitaciones,
    viajeros,
    estrellas
};


        console.log("📤 Enviando filtros al backend:", filtros);

        try {
            // RUTA CORRECTA: /api/auth/hotels/search
            const data = await sendData("auth/hotels/search", filtros, "POST");

            const results = data.hotels || [];

            console.log(`🏨 ${results.length} hoteles encontrados.`);

            renderHoteles(results);

        } catch (error) {
            console.error("❌ Error en la búsqueda de hoteles:", error);

            contenedor.innerHTML = `
                <p class="text-center text-red-500 text-lg mt-10">
                    ⚠️ Error al conectar con el servidor.
                </p>
            `;
        }
    });
}
