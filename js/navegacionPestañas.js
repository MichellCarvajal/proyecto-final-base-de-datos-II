import cargarHTML from "./renderizado.js";
import idaRegreso from "./soloVuelta.js";

const navegacion = async () => {
    await cargarHTML('./filtroVuelo.html')

    const pestañaVuelo=document.getElementById('boton-vuelos')
    const pestañaHoteles=document.getElementById('boton-hoteles')
    const pestañaPaquetes=document.getElementById('boton-paquetes')
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('./filtroVuelo.html').then(() => {
            idaRegreso()
        })
    })

    pestañaHoteles.addEventListener('click', ()=>{
        cargarHTML('./filtroHoteles.html')
    })

    pestañaPaquetes.addEventListener('click',()=>{
        cargarHTML('../filtroVueloyHoteles.html')
    })
}

export default navegacion