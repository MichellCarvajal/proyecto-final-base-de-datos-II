// public/js/login.js
import { sendData } from './api.js';

// ⚠️ Función auxiliar para limpiar los campos del formulario de Login
function clearLoginFormFields() {
    document.getElementById('email-login').value = '';
    document.getElementById('password-login').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('form-login');
    const registerButton = document.getElementById('btn-register'); // Obtenido para la lógica de registro
    
    // Crear contenedor de mensajes para mostrar el resultado
    const messageContainer = document.createElement('div');
    messageContainer.id = 'login-message';
    messageContainer.className = 'text-center font-bold h-6 mb-3';
    loginForm.append(messageContainer);
    

    if (loginForm) {
        // Captura el evento submit del formulario
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // ⚠️ Lógica para redireccionar al registro (Mantenemos esta lógica)
    if (registerButton) {
        registerButton.addEventListener('click', (e) => {
            e.preventDefault(); // Evita el comportamiento por defecto del botón
            window.location.href = 'registro.html'; // Redirecciona a la nueva página
        });
    }

    async function handleLogin(event) {
        event.preventDefault(); 
        
        messageContainer.textContent = '';
        
        // Deshabilitar el botón de login temporalmente
        const loginButton = loginForm.querySelector('button:first-of-type');
        loginButton.disabled = true;

        const correo = document.getElementById('email-login').value;
        const contrasena = document.getElementById('password-login').value;

        const loginData = { correo, contrasena };

        try {
            messageContainer.textContent = 'Verificando...';
            messageContainer.className = 'text-center font-bold h-6 mb-3 text-blue-500';
            
            // Llama a la ruta: POST /api/auth/login
            const response = await sendData('auth/login', loginData, 'POST');

            // Muestra el mensaje de éxito del servidor
            messageContainer.textContent = `✅ ${response.message}`; 
            messageContainer.className = 'text-center font-bold h-6 mb-3 text-green-500';
            
            // ⚠️ NUEVA LÓGICA: Limpiar formulario y redirigir
            clearLoginFormFields();
            
            // Redirigir a la página principal (index.html o donde se inicie la sesión) después de 1 segundo
            setTimeout(() => {
                // Aquí debes redirigir a la página principal de tu aplicación (ej: 'home.html' o 'dashboard.html')
                // Por ahora, usamos 'index.html' solo como ejemplo.
                window.location.href = 'filtrosBusqueda.html'; 
            }, 1000); 
            
            // Nota: No es necesario re-habilitar el botón porque vamos a redirigir inmediatamente.

        } catch (error) {
            // Muestra el error del servidor
            messageContainer.textContent = `❌ ${error.message}`;
            messageContainer.className = 'text-center font-bold h-6 mb-3 text-red-500';
            loginButton.disabled = false; // Habilitar de nuevo
        }
    }
    
    // ⚠️ Importante: Mantenemos la lógica de registro fuera de handleLogin y la simplificamos
    // El segundo document.addEventListener('DOMContentLoaded', ...) no es necesario.
});