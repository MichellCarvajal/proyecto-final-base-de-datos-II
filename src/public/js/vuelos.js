import { sendData } from './api.js';

export function initVuelos() {
    const formVuelos = document.getElementById('form-vuelos');
    if (!formVuelos) return console.error('❌ No se encontró el formulario #form-vuelos');

    const divFechaRegreso = document.getElementById('div-fecha-regreso');
    const inputFechaRegreso = document.getElementById('input-fecha-regreso');
    const btnIntercambiar = document.getElementById('btn-intercambiar');
    const inputOrigen = document.getElementById('input-origen');
    const inputDestino = document.getElementById('input-destino');

    // Contenedor de resultados dentro del formulario
    const containerResultados = document.getElementById('vuelos-resultados');

    function updateRegresoVisibility() {
        const tipo = formVuelos.querySelector('input[name="tipoViaje"]:checked').value;
        if (tipo === 'ida_vuelta') {
            divFechaRegreso.style.display = 'flex';
            inputFechaRegreso.setAttribute('required', 'true');
        } else {
            divFechaRegreso.style.display = 'none';
            inputFechaRegreso.removeAttribute('required');
        }
    }

    formVuelos.querySelectorAll('input[name="tipoViaje"]').forEach(r => r.addEventListener('change', updateRegresoVisibility));
    updateRegresoVisibility();

    btnIntercambiar.addEventListener('click', () => {
        const temp = inputOrigen.value;
        inputOrigen.value = inputDestino.value;
        inputDestino.value = temp;
    });

    function showCustomMessage(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }

    /**
     * 🚀 FUNCIÓN renderVuelos MEJORADA Y ESTILIZADA
     */
    function renderVuelos(vuelos) {
        containerResultados.innerHTML = ''; // Limpiar resultados previos

        if (!vuelos || vuelos.length === 0) {
            containerResultados.innerHTML = `
                <div class="bg-gray-50 p-8 rounded-xl shadow-inner mt-6 text-center">
                    <p class="text-gray-500 font-medium text-lg">
                        Parece que no hay vuelos disponibles para esta búsqueda. 😔
                    </p>
                    <p class="text-sm text-gray-400 mt-2">Intenta con otras fechas o destinos.</p>
                </div>
            `;
            return;
        }

        vuelos.forEach(vuelo => {
            // Formatear precio y fechas
            const precioFormateado = new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 0 
            }).format(vuelo.precioBase);

            const fechaSalida = new Date(vuelo.fechaSalida).toLocaleString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const fechaLlegada = new Date(vuelo.fechaLlegada).toLocaleString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            const card = document.createElement('div');
            card.className = 'bg-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4';

            card.innerHTML = `
                <div class="flex items-center gap-6 w-full">
                    
                    <div class="flex-1 min-w-0">
                        <h3 class="font-extrabold text-xl text-blue-800">${vuelo.origen.toUpperCase()} → ${vuelo.destino.toUpperCase()}</h3>
                        <span class="text-xs font-semibold px-2 py-0.5 mt-1 inline-block rounded ${vuelo.clase.toLowerCase() === 'premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}">
                            ${vuelo.clase.toUpperCase()}
                        </span>
                        <p class="text-sm text-gray-500 mt-1">Aerolínea: ${vuelo.aerolinea}</p>
                    </div>

                    <div class="flex flex-col gap-2 border-l border-r px-6 border-gray-200">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-plane-departure text-blue-500"></i>
                            <p class="text-sm text-gray-700"><strong>Sale:</strong> ${fechaSalida}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-plane-arrival text-blue-500"></i>
                            <p class="text-sm text-gray-700"><strong>Llega:</strong> ${fechaLlegada}</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-2 text-right flex-shrink-0">
                        <p class="text-2xl font-bold text-green-600">${precioFormateado}</p>
                        <p class="text-xs text-gray-500">
                            Asientos disponibles: <span class="font-bold text-green-600">${vuelo.asientosDisponibles}</span>
                        </p>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-lg transition duration-200 mt-2">
                            Seleccionar Vuelo
                        </button>
                    </div>

                </div>
            `;

            containerResultados.appendChild(card);
        });
    }

    formVuelos.addEventListener('submit', async (e) => {
        e.preventDefault();

        const claseSeleccionada = (document.getElementById('select-categoria').value.toLowerCase() === 'premium') 
            ? 'premium' 
            : 'economica';

        const tripType = formVuelos.querySelector('input[name="tipoViaje"]:checked').value;

        const data = {
            origen: inputOrigen.value.trim(),
            destino: inputDestino.value.trim(),
            fechaSalida: document.getElementById('input-fecha-salida').value,
            clase: claseSeleccionada,
            viajeros: parseInt(document.getElementById('input-viajeros').value),
            tripType: tripType
        };

        if (tripType === 'ida_vuelta') data.fechaRegreso = inputFechaRegreso.value;

        if (!data.origen || !data.destino || !data.fechaSalida || data.viajeros < 1) {
            showCustomMessage("Completa todos los campos obligatorios.", 'error');
            return;
        }
        if (tripType === 'ida_vuelta' && !data.fechaRegreso) {
            showCustomMessage("Debes seleccionar la fecha de regreso.", 'error');
            return;
        }

        try {
            const resultados = await sendData("auth/flights/search", data, "POST");
            const flights = resultados.flights || [];
            showCustomMessage(`¡Búsqueda exitosa! Se encontraron ${flights.length} vuelos.`, 'success');

            // Renderizar vuelos con la nueva función estilizada
            renderVuelos(flights);

        } catch (err) {
            console.error("❌ Error en búsqueda:", err);
            showCustomMessage("Error en la búsqueda: " + (err.message || "Error al conectar con el servidor."), 'error');
        }
    });
}