import cargarHTML from "./renderizado.js";

const navegacion = () => {
    cargarHTML('../filtroHoteles.html')

    const pestañaVuelo=document.getElementById('boton-vuelos')
    const pestañaHoteles=document.getElementById('boton-hoteles')
    const pestañaPaquetes=document.getElementById('boton-paquetes')
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('../filtroVuelo.html')
    })

    pestañaHoteles.addEventListener('click', ()=>{
        cargarHTML('../filtroHoteles.html')
    })
}

export default navegacion