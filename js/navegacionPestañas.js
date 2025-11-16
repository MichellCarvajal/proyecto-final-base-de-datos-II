import cargarHTML from "./renderizado.js";

const navegacion = () => {
    cargarHTML('../filtroVueloyHoteles.html')

    const pestañaVuelo=document.getElementById('boton-vuelos')
    const pestañaHoteles=document.getElementById('boton-hoteles')
    const pestañaPaquetes=document.getElementById('boton-paquetes')
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('../filtroVuelo.html')
    })

    pestañaHoteles.addEventListener('click', ()=>{
        cargarHTML('../filtroHoteles.html')
    })

    pestañaPaquetes.addEventListener('click',()=>{
        cargarHTML('../filtroVueloyHoteles.html')
    })
}

export default navegacion