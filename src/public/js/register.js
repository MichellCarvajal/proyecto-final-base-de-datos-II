// public/js/register.js
import { sendData } from './api.js';

// 1. FUNCIÓN DE LIMPIEZA
function clearFormFields() {
    document.getElementById('nombre-registro').value = '';
    document.getElementById('nacionalidad-registro').value = '';
    document.getElementById('direccion-registro').value = '';
    document.getElementById('fechaNacimiento-registro').value = '';
    
    // Para el <select>, es mejor resetear al valor por defecto ('')
    document.getElementById('tipoDocumento-registro').value = ''; 
    
    document.getElementById('numeroDocumento-registro').value = '';
    document.getElementById('correo-registro').value = '';
    document.getElementById('contraseña-registro').value = '';
    
    // Teléfonos
    document.getElementById('telefono1-register').value = '';
    document.getElementById('telefono2-register').value = ''; 
}

document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ USAMOS EL NUEVO ID DEL FORMULARIO
    const registerForm = document.getElementById('form-register'); 
    
    // Crear contenedor de mensajes para feedback
    const messageContainer = document.createElement('div');
    messageContainer.id = 'register-message';
    messageContainer.className = 'col-span-2 text-center font-bold h-6 mb-3';
    // Colocamos el mensaje al final del formulario, como en tu código
    registerForm.append(messageContainer); 

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    async function handleRegister(event) {
        event.preventDefault(); 
        messageContainer.textContent = '';
        const registerButton = registerForm.querySelector('button');
        registerButton.disabled = true;

        // 1. Recolección de datos del formulario 
        const userData = {
            nombre: document.getElementById('nombre-registro').value,
            nacionalidad: document.getElementById('nacionalidad-registro').value,
            direccion: document.getElementById('direccion-registro').value,
            fechaNacimiento: document.getElementById('fechaNacimiento-registro').value,
            tipoDocumento: document.getElementById('tipoDocumento-registro').value,
            numeroDocumento: document.getElementById('numeroDocumento-registro').value,
            correo: document.getElementById('correo-registro').value,
            contrasena: document.getElementById('contraseña-registro').value, 
            
            // Los teléfonos se envían al Backend. El Backend maneja si 'telefono2' es nulo.
            telefono1: document.getElementById('telefono1-register').value,
            telefono2: document.getElementById('telefono2-register').value, // El Backend recibe esto y lo hace opcional
        };

        try {
            messageContainer.textContent = 'Procesando registro...';
            messageContainer.className = 'col-span-2 text-center font-bold h-6 mb-3 text-blue-500';
            
            // 2. Llamada a la ruta: POST /api/auth/register
            const response = await sendData('auth/register', userData, 'POST');

            messageContainer.textContent = `✅ ${response.message}`; 
            messageContainer.className = 'col-span-2 text-center font-bold h-6 mb-3 text-green-500';
            
            // 3. LÓGICA DE ÉXITO: Limpiar y Redirigir
            clearFormFields();
            
            // Opcional: Redirigir al login (index.html) después de 3 segundos
            setTimeout(() => {
                window.location.href = 'filtrosBusqueda.html'; 
            }, 3000);

        } catch (error) {
            messageContainer.textContent = `❌ ${error.message}`;
            messageContainer.className = 'col-span-2 text-center font-bold h-6 mb-3 text-red-500';
            registerButton.disabled = false; // Habilitar de nuevo el botón si falla
        }
    }
});