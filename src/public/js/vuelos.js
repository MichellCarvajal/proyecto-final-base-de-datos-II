import { sendData } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Referencias a elementos del DOM ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const formVuelos = document.getElementById('form-vuelos');
    const messageContainer = document.getElementById('vuelos-message-container');
    const resultsList = document.getElementById('results-list');
    
    const inputOrigen = document.getElementById('input-origen');
    const inputDestino = document.getElementById('input-destino');
    const btnIntercambiar = document.getElementById('btn-intercambiar');
    const inputFechaSalida = document.getElementById('input-fecha-salida');
    const inputFechaRegreso = document.getElementById('input-fecha-regreso');
    const divFechaRegreso = document.getElementById('div-fecha-regreso'); 
    
    // Inicializa la pestaña de Vuelos al cargar
    showTab('vuelos');


    // --- 2. Lógica de Intercambio de Pestañas ---

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            showTab(targetTab);
        });
    });

    /**
     * Muestra la pestaña seleccionada y actualiza el estilo de los botones.
     */
    function showTab(tabId) {
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        tabButtons.forEach(button => {
            button.style.borderBottom = 'none';
            button.classList.remove('text-primary-blue', 'font-bold');
            button.classList.add('text-gray-800', 'font-semibold');
        });

        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        const activeButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (activeButton) {
            // Nota: Aquí uso 'primary-blue' que se definió en el tailwind.config del HTML
            activeButton.style.borderBottom = '2px solid #3B82F6'; 
            activeButton.classList.add('text-primary-blue', 'font-bold');
            activeButton.classList.remove('text-gray-800', 'font-semibold');
        }
    }


    // --- 3. Funciones de Feedback ---

    function displayMessage(text, color) {
        if (messageContainer) {
            messageContainer.textContent = text;
            // Usamos clases de Tailwind dinámicamente: text-blue-500, text-red-500, etc.
            messageContainer.className = `mb-4 h-6 text-center font-semibold text-${color}`;
        }
    }
    
    function resetMessageAndResults() {
        if (messageContainer) {
            messageContainer.textContent = '';
            messageContainer.className = 'mb-4 h-6 text-center font-semibold';
        }
        if (resultsList) {
             resultsList.innerHTML = `<div class="p-4 text-gray-500 bg-gray-50 rounded-lg">Aún no se ha realizado ninguna búsqueda.</div>`;
        }
    }

    // --- 4. Renderizado de Resultados ---

    /**
     * Formatea una fecha y hora de la DB a formato hora (HH:MM).
     * ⚠️ CORRECCIÓN: Se usa new Date(string) y toLocaleTimeString con opciones específicas.
     */
    function formatTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/D';

        // Crear un objeto Date. El constructor de Date(string) suele ser robusto con DATETIME de MySQL.
        const date = new Date(dateTimeStr); 

        if (isNaN(date.getTime())) { // Comprobación más robusta de fecha inválida
            console.error('Fecha Inválida detectada para:', dateTimeStr);
            return "Fecha Inválida";
        }

        // Opciones de formato: solo hora y minuto en formato 24h (ej: 13:30)
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Usar 24h
        };

        return date.toLocaleTimeString('es-ES', options);
    }

    /**
     * Renderiza la lista de vuelos en la interfaz.
     */
    function renderFlightResults(flights) {
        if (!resultsList) return;

        resultsList.innerHTML = ''; // Limpiar resultados anteriores
        
        if (!flights || flights.length === 0) {
            resultsList.innerHTML = `
                <div class="p-4 text-gray-500 bg-red-50 border border-red-200 rounded-lg">
                    😔 No se encontraron vuelos disponibles que coincidan con tus criterios de búsqueda.
                </div>`;
            return;
        }

        const isRoundtrip = document.querySelector('input[name="tipoViaje"]:checked')?.value === 'ida_vuelta';
        
        if (isRoundtrip && flights.length > 1) {
            // Ordenar por fecha de salida (esto ayuda a separar Ida de Regreso)
            // ⚠️ CORRECCIÓN: Se usa flight.fechaSalida en lugar de flight.fechaHoraSalida
            flights.sort((a, b) => new Date(a.fechaSalida) - new Date(b.fechaSalida));
            
            // Asume que los primeros son Ida y los segundos Regreso
            // ⚠️ CORRECCIÓN: Se usa flight.fechaSalida en lugar de flight.fechaHoraSalida
            const departureDate = flights[0].fechaSalida.split('T')[0]; 
            const returnDate = flights[flights.length - 1].fechaSalida.split('T')[0];
            
            // Filtra y separa en grupos basándose en el sentido (origen/destino)
            const idaFlights = flights.filter(f => f.origen === inputOrigen.value.trim());
            const regresoFlights = flights.filter(f => f.origen === inputDestino.value.trim());

            resultsList.innerHTML += `<h3 class="text-xl font-bold text-gray-700 mb-2">✈️ Vuelos de IDA - ${departureDate}</h3>`;
            renderFlightGroup(idaFlights, 'blue');
            
            resultsList.innerHTML += `<h3 class="text-xl font-bold text-gray-700 mt-6 mb-2">↩️ Vuelos de REGRESO - ${returnDate}</h3>`;
            renderFlightGroup(regresoFlights, 'green');

        } else {
            // Solo ida o un solo resultado 
            resultsList.innerHTML += `<h3 class="text-xl font-bold text-gray-700 mb-2">✈️ Vuelos encontrados</h3>`;
            renderFlightGroup(flights, 'default');
        }
        
        displayMessage(`✅ ¡Búsqueda exitosa! Se encontraron ${flights.length} vuelos en total.`, 'green-500');
    }
    
    /**
     * Genera el HTML para un grupo de vuelos.
     */
    function renderFlightGroup(flights, type) {
        flights.forEach(flight => {
            // Colores basados en el tipo de vuelo (IDA/REGRESO)
            const typeColor = type === 'blue' ? 'text-primary-blue' : type === 'green' ? 'text-green-600' : 'text-primary-blue';
            const priceColor = type === 'blue' ? 'text-primary-blue' : type === 'green' ? 'text-green-600' : 'text-primary-blue';
            
            // ⚠️ CORRECCIÓN: Se usa flight.fechaSalida y flight.fechaLlegada
            const departureTime = formatTime(flight.fechaSalida);
            const arrivalTime = formatTime(flight.fechaLlegada);

            const flightCard = `
                <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex justify-between items-center transition-all duration-300 hover:shadow-xl">
                    <div class="flex items-center space-x-6">
                        <i class="fa-solid fa-plane text-2xl ${typeColor}"></i>
                        <div>
                            <p class="text-xs text-gray-500 font-medium">Vuelo #${flight.idVuelo} | ${flight.clase.toUpperCase()}</p>
                            <h3 class="text-xl font-bold text-gray-900">${flight.origen} <span class="text-gray-400">→</span> ${flight.destino}</h3>
                        </div>
                    </div>

                    <div class="text-center">
                        <p class="text-lg font-bold text-gray-700">${departureTime} - ${arrivalTime}</p>
                        <p class="text-xs text-gray-500">Horario</p>
                    </div>

                    <div class="text-right">
                        <p class="text-sm text-gray-600">Asientos: <span class="font-bold ${typeColor}">${flight.asientosDisponibles}</span></p>
                        <h4 class="text-3xl font-extrabold ${priceColor} mb-2">
                            $${new Intl.NumberFormat('es-CO').format(flight.precioBase)}
                        </h4>
                        <button class="bg-primary-yellow text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200 text-sm">
                            Seleccionar
                        </button>
                    </div>
                </div>
            `;
            resultsList.innerHTML += flightCard;
        });
    }

    // --- 5. Lógica de Búsqueda de Vuelos (Manejador de Submit) ---
    
    if (formVuelos) {
        formVuelos.addEventListener('submit', handleSearchFlights);
    }

    async function handleSearchFlights(event) {
        event.preventDefault(); 
        
        displayMessage('Buscando vuelos... Por favor, espera.', 'primary-blue');
        
        // Deshabilitar botón de búsqueda
        const searchButton = document.getElementById('btn-buscar-vuelos');
        searchButton.disabled = true;
        searchButton.classList.add('opacity-50', 'cursor-not-allowed');

        // Recolección de datos
        const origen = inputOrigen.value.trim();
        const destino = inputDestino.value.trim();
        const salida = inputFechaSalida.value;
        const viajeros = parseInt(document.getElementById('input-viajeros').value, 10);
        
        // Mapeo de valores del frontend al backend
        const clase = document.getElementById('select-categoria').value === 'economica' ? 'Económica' : 'Premium'; 
        const tipoViajeInput = document.querySelector('input[name="tipoViaje"]:checked');
        
        const tipoViaje = tipoViajeInput && tipoViajeInput.value === 'ida_vuelta' ? 'roundtrip' : 'solo_ida'; 
        
        const regreso = (tipoViaje === 'roundtrip') ? inputFechaRegreso.value : null;

        // Validaciones del lado del cliente (opcional, pero útil)
        if (tipoViaje === 'roundtrip' && !regreso) {
             displayMessage('❌ Debes seleccionar una fecha de regreso para un viaje de Ida y Vuelta.', 'red-500');
             searchButton.disabled = false;
             searchButton.classList.remove('opacity-50', 'cursor-not-allowed');
             return;
        }
        
        if (origen.toLowerCase() === destino.toLowerCase()) {
             displayMessage('❌ El origen y el destino no pueden ser el mismo.', 'red-500');
             searchButton.disabled = false;
             searchButton.classList.remove('opacity-50', 'cursor-not-allowed');
             return;
        }


        // Payload ajustado para el backend (authService.findAvailableFlights)
        const searchData = {
            origen: origen, 
            destino: destino, 
            fechaSalida: salida, 
            fechaRegreso: regreso, 
            viajeros: viajeros,
            clase: clase,
            tripType: tipoViaje
        };
        
        try {
            // Usamos el endpoint correcto: /api/auth/flights/search
            const response = await sendData("auth/flights/search", searchData, 'POST');

            if (response && response.flights) {
                renderFlightResults(response.flights);
            } else {
                 renderFlightResults([]); // No se encontraron vuelos o respuesta incompleta
            }

        } catch (error) {
            // Manejo de errores de la API
            const errorMessage = error.message || 'Ocurrió un error desconocido al buscar vuelos.';
            displayMessage(`❌ Error de búsqueda: ${errorMessage}`, 'red-500');
            if (resultsList) {
                resultsList.innerHTML = `<div class="p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg">Error: ${errorMessage}</div>`;
            }
        } finally {
            // Restablecer el botón
            searchButton.disabled = false;
            searchButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // --- 6. Lógica de Intercambio de Origen/Destino ---
    if (btnIntercambiar) {
        btnIntercambiar.addEventListener('click', () => {
            const temp = inputOrigen.value;
            inputOrigen.value = inputDestino.value;
            inputDestino.value = temp;
            resetMessageAndResults();
        });
    }

    // --- 7. Lógica para deshabilitar/habilitar fecha de regreso (Solo Ida) ---
    document.querySelectorAll('input[name="tipoViaje"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isSoloIda = e.target.value === 'solo_ida';
            
            inputFechaRegreso.disabled = isSoloIda;
            inputFechaRegreso.required = !isSoloIda;
            
            if (isSoloIda) {
                inputFechaRegreso.value = '';
                divFechaRegreso.classList.add('opacity-50');
                divFechaRegreso.style.pointerEvents = 'none'; // Desactiva clics
            } else {
                divFechaRegreso.classList.remove('opacity-50');
                divFechaRegreso.style.pointerEvents = 'auto';
            }
            resetMessageAndResults();
        });
    });

    // --- 8. Lógica para setear la fecha mínima (evitar búsquedas en el pasado) ---
    const today = new Date().toISOString().split('T')[0];
    inputFechaSalida.min = today;
    inputFechaRegreso.min = today;

    inputFechaSalida.addEventListener('change', (e) => {
        // La fecha de regreso no puede ser anterior a la de salida
        inputFechaRegreso.min = e.target.value || today;
        if (inputFechaRegreso.value < e.target.value) {
            inputFechaRegreso.value = e.target.value;
        }
    });


});