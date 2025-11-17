import cargarHTML from "./renderizado.js";

<<<<<<< HEAD
const navegacion = () => {
    cargarHTML('../filtroVuelo.html')
=======
const navegacion = async () => {
    await cargarHTML('./filtroVuelo.html')
>>>>>>> miguel

    const pestañaVuelo=document.getElementById('boton-vuelos')
    const pestañaHoteles=document.getElementById('boton-hoteles')
    const pestañaPaquetes=document.getElementById('boton-paquetes')
    
    pestañaVuelo.addEventListener('click', ()=> {
        cargarHTML('./filtroVuelo.html')
    })

    pestañaHoteles.addEventListener('click', ()=>{
        cargarHTML('./filtroHoteles.html')
    })

    pestañaPaquetes.addEventListener('click',()=>{
        cargarHTML('../filtroVueloyHoteles.html')
    })
}

export default navegacion