// public/js/servicesStorage.js

// Guarda el usuario logueado
export function saveUser(user) {
    localStorage.setItem("usuarioActivo", JSON.stringify(user));
}

// Obtiene el usuario logueado
export function getUser() {
    return JSON.parse(localStorage.getItem("usuarioActivo"));
}

// Vacía usuario (logout)
export function clearUser() {
    localStorage.removeItem("usuarioActivo");
}

// -----------------------------------------------
// ARRAY GENERAL DE SERVICIOS SELECCIONADOS
// -----------------------------------------------
export function addService(service) {
    const current = JSON.parse(localStorage.getItem("serviciosSeleccionados")) || [];
    current.push(service);
    localStorage.setItem("serviciosSeleccionados", JSON.stringify(current));
}

export function getServices() {
    return JSON.parse(localStorage.getItem("serviciosSeleccionados")) || [];
}

export function clearServices() {
    localStorage.removeItem("serviciosSeleccionados");
}
