const contenido = document.getElementById('contenido-pestaña')

const cargarHTML = async (direccionArchivo) => {
    try {
        const respuesta = await fetch(direccionArchivo)
        if(!respuesta.ok) throw new Error('No se encontro la pagina');
        const html = await respuesta.text();
        contenido.innerHTML = html;
        
    } catch (error) {
        console.error(`Error al cargar el contenido de ${direccionArchivo}:`, error);
    }
}

export default cargarHTML