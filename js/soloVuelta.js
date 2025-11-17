
const idaRegreso = () => {
    const regreso = document.getElementById('regreso');
    const botonIda = document.getElementById('solo-ida');
    const botonIdaVuelta = document.getElementById('ida-vuelta');
    
    if (!regreso || !botonIda || !botonIdaVuelta) return;

    botonIda.addEventListener('click', () => {
        regreso.classList.add('hidden');
    });
    botonIdaVuelta.addEventListener('click', () => {
        regreso.classList.remove('hidden');
    });
}

export default idaRegreso
