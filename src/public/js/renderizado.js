const contenido = document.getElementById('contenido-pestaña');

// Añadir un parámetro 'callback'
const cargarHTML = async (direccionArchivo, callback = null) => {
    try {
        const respuesta = await fetch(direccionArchivo);
        if(!respuesta.ok) throw new Error('No se encontro la pagina');
        const html = await respuesta.text();
        contenido.innerHTML = html;
        
        // Ejecutar el callback después de inyectar el HTML
        if (callback && typeof callback === 'function') {
            callback();
        }
        
    } catch (error) {
        console.error(`Error al cargar el contenido de ${direccionArchivo}:`, error);
    }
}

export default cargarHTML;
