import cargarHTML from "./renderizado.js";
import { initVuelos } from "./vuelos.js";
import { initHoteles } from "./hoteles.js";   // ✅ IMPORTANTE

const navegacion = () => {

    // CARGA INICIAL
    cargarHTML('./filtroVuelo.html', initVuelos);

    const pestañaVuelo = document.getElementById('boton-vuelos');
    const pestañaHoteles = document.getElementById('boton-hoteles');
    const pestañaPaquetes = document.getElementById('boton-paquetes');
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('./filtroVuelo.html', initVuelos);
    });

    pestañaHoteles.addEventListener('click', ()=> {
        cargarHTML('./filtroHoteles.html', initHoteles); // ✅ AHORA SÍ
    });

    pestañaPaquetes.addEventListener('click',()=> {
        cargarHTML('./filtroVueloyHoteles.html');
    });
}

export default navegacion;
