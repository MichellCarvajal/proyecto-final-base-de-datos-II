import cargarHTML from "./renderizado.js";
import { initVuelos } from "./vuelos.js";
import { initHoteles } from "./hoteles.js";   // ✅ IMPORTANTE
import idaRegreso from "./soloVuelta.js";

const navegacion = () => {

    // CARGA INICIAL
    cargarHTML('./filtroVuelo.html', initVuelos);

    const pestañaVuelo = document.getElementById('boton-vuelos');
    const pestañaHoteles = document.getElementById('boton-hoteles');
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('./filtroVuelo.html', initVuelos);
    });

    pestañaHoteles.addEventListener('click', ()=> {
        cargarHTML('./filtroHoteles.html', initHoteles); // ✅ AHORA SÍ
    });
}

export default navegacion;
