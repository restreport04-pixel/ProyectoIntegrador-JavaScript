/* ==========================================================================
   SISTEMA DE COWORKING - LÓGICA EN JAVASCRIPT
   Proyecto Final - Segundo Semestre
   Temas aplicados:
   - Objetos y Arreglos (Array methods: push, filter, find, for/forEach)
   - Funciones y Estructuras de Control (if/else, switch)
   - Manipulación del DOM (Eventos, Renderizado dinámico)
   - Almacenamiento local con LocalStorage
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. ESTRUCTURAS DE DATOS BASE Y PERSISTENCIA (LOCALSTORAGE)
// --------------------------------------------------------------------------

// Precios de los espacios por modalidad (Uso de Objeto para tarifas)
const TARIFAS = {
    flexible: { hora: 8000, dia: 35000, mes: 450000 },
    fijo: { hora: 12000, dia: 55000, mes: 750000 },
    sala: { hora: 45000, dia: 280000, mes: 3200000 },
    oficina: { hora: 60000, dia: 300000, mes: 4500000 }
};

// Capacidad total de cada espacio
const CAPACIDADES = {
    flexible: 10,
    fijo: 6,
    sala: 2,
    oficina: 3
};

// Nombres legibles para mostrar en tablas y notificaciones
const NOMBRES_ESPACIOS = {
    flexible: "Puesto flexible",
    fijo: "Escritorio fijo",
    sala: "Sala de reuniones",
    oficina: "Oficina privada"
};

// Arreglos principales de la aplicación (Cargados desde LocalStorage o inicializados por defecto)
let usuarios = JSON.parse(localStorage.getItem('coworking_usuarios')) || [];
let reservas = JSON.parse(localStorage.getItem('coworking_reservas')) || [];
let usuarioLogueado = JSON.parse(localStorage.getItem('coworking_sesion')) || null;

// Inicializar datos de prueba si LocalStorage está vacío
function inicializarDatosEjemplo() {
    if (reservas.length === 0) {
        reservas = [
            { id: "R-001", correo: "juan@gmail.com", espacio: "flexible", modalidad: "hora", fechaInicio: "2026-11-10", horaInicio: "09:00", cantidad: 3, personas: 1, total: 24000, estado: "confirmada" },
            { id: "R-002", correo: "maria@gmail.com", espacio: "fijo", modalidad: "dia", fechaInicio: "2026-11-16", horaInicio: "--:--", cantidad: 5, personas: 1, total: 275000, estado: "confirmada" },
            { id: "R-003", correo: "pedro@gmail.com", espacio: "sala", modalidad: "hora", fechaInicio: "2026-11-18", horaInicio: "15:00", cantidad: 2, personas: 4, total: 90000, estado: "pendiente" },
            { id: "R-004", correo: "ana@gmail.com", espacio: "oficina", modalidad: "mes", fechaInicio: "2026-12-01", horaInicio: "--:--", cantidad: 1, personas: 3, total: 4500000, estado: "confirmada" },
            { id: "R-005", correo: "carlos@gmail.com", espacio: "flexible", modalidad: "dia", fechaInicio: "2026-11-03", horaInicio: "--:--", cantidad: 1, personas: 1, total: 35000, estado: "cancelada" }
        ];
        guardarReservasEnStorage();
    }
}

// Funciones auxiliares para guardar en LocalStorage
function guardarUsuariosEnStorage() {
    localStorage.setItem('coworking_usuarios', JSON.stringify(usuarios));
}

function guardarReservasEnStorage() {
    localStorage.setItem('coworking_reservas', JSON.stringify(reservas));
}

function guardarSesionEnStorage(usuario) {
    usuarioLogueado = usuario;
    if (usuario) {
        localStorage.setItem('coworking_sesion', JSON.stringify(usuario));
    } else {
        localStorage.removeItem('coworking_sesion');
    }
}

// Formateador de moneda en Pesos Colombianos (COP)
function formatearMoneda(valor) {
    return "$" + Number(valor).toLocaleString('es-CO');
}

// --------------------------------------------------------------------------
// 2. MÓDULO DE AUTENTICACIÓN Y USUARIOS (REGISTRO Y LOGIN)
// --------------------------------------------------------------------------

function registrarUsuario(event) {
    event.preventDefault();

    const nombre = document.getElementById('reg-nombre').value.trim();
    const apellido = document.getElementById('reg-apellido').value.trim();
    const tipoDoc = document.getElementById('reg-tipo-doc').value;
    const doc = document.getElementById('reg-doc').value.trim();
    const correo = document.getElementById('reg-correo').value.trim().toLowerCase();
    const clave = document.getElementById('reg-clave').value;
    const clave2 = document.getElementById('reg-clave2').value;

    // Validación mediante condicionales
    if (clave !== clave2) {
        alert("Las contraseñas no coinciden. Por favor verifique.");
        return;
    }

    // Comprobar si el correo ya existe usando el método .find() en el array
    const usuarioExiste = usuarios.find(user => user.correo === correo);
    if (usuarioExiste) {
        alert("El correo electrónico ya se encuentra registrado.");
        return;
    }

    // Creación del objeto usuario
    const nuevoUsuario = {
        nombre: nombre,
        apellido: apellido,
        tipoDoc: tipoDoc,
        documento: doc,
        correo: correo,
        clave: clave
    };

    // Agregar elemento al arreglo
    usuarios.push(nuevoUsuario);
    guardarUsuariosEnStorage();

    alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
    document.querySelector('#registro form').reset();
    
    // Auto-completar el correo en la sección de login
    document.getElementById('log-correo').value = correo;
    window.location.hash = "#login";
}

function iniciarSesion(event) {
    event.preventDefault();

    const correo = document.getElementById('log-correo').value.trim().toLowerCase();
    const clave = document.getElementById('log-clave').value;

    // Buscar coincidencia en el arreglo de usuarios
    const usuarioEncontrado = usuarios.find(user => user.correo === correo && user.clave === clave);

    if (usuarioEncontrado) {
        guardarSesionEnStorage(usuarioEncontrado);
        alert(`¡Bienvenido de nuevo, ${usuarioEncontrado.nombre}!`);
        
        // Auto-completar el correo en el formulario de reserva
        const resCorreoInput = document.getElementById('res-correo');
        if (resCorreoInput) resCorreoInput.value = usuarioEncontrado.correo;
        
        actualizarEstadoSesionUI();
        window.location.hash = "#reservar";
    } else {
        alert("Correo o contraseña incorrectos.");
    }
}

function cerrarSesion() {
    guardarSesionEnStorage(null);
    alert("Has cerrado sesión correctamente.");
    actualizarEstadoSesionUI();
}

function actualizarEstadoSesionUI() {
    const loginSection = document.getElementById('login');
    let divEstado = document.getElementById('estado-sesion-info');

    if (!divEstado) {
        divEstado = document.createElement('div');
        divEstado.id = 'estado-sesion-info';
        divEstado.style.padding = '1rem';
        divEstado.style.marginBottom = '1rem';
        divEstado.style.borderRadius = '8px';
        divEstado.style.textAlign = 'center';
        loginSection.prepend(divEstado);
    }

    if (usuarioLogueado) {
        divEstado.style.backgroundColor = '#dcfce7';
        divEstado.style.color = '#166534';
        divEstado.style.border = '1px solid #bbf7d0';
        divEstado.innerHTML = `
            <p style="margin:0; font-weight:600;">Sesión activa: ${usuarioLogueado.nombre} (${usuarioLogueado.correo})</p>
            <button id="btn-logout" style="margin-top:0.5rem; padding:0.4rem 1rem; background:#991b1b; color:#fff; border:none; border-radius:4px; cursor:pointer;">Cerrar sesión</button>
        `;
        document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
    } else {
        divEstado.style.backgroundColor = '#f1f5f9';
        divEstado.style.color = '#475569';
        divEstado.style.border = '1px solid #e2e8f0';
        divEstado.innerHTML = `<p style="margin:0;">No has iniciado sesión.</p>`;
    }
}

// --------------------------------------------------------------------------
// 3. MÓDULO DE GESTIÓN DE RESERVAS (CREACIÓN, CÁLCULO Y CANCELACIÓN)
// --------------------------------------------------------------------------

function calcularTotalReserva(espacioKey, modalidad, cantidad) {
    if (!TARIFAS[espacioKey] || !TARIFAS[espacioKey][modalidad]) {
        return 0;
    }
    const precioBase = TARIFAS[espacioKey][modalidad];
    return precioBase * cantidad;
}

function crearReserva(event) {
    event.preventDefault();

    const correo = document.getElementById('res-correo').value.trim().toLowerCase();
    const espacio = document.getElementById('res-espacio').value;
    const fecha = document.getElementById('res-fecha').value;
    const hora = document.getElementById('res-hora').value || "--:--";
    const cantidad = parseInt(document.getElementById('res-cantidad').value);
    const personas = parseInt(document.getElementById('res-personas').value);

    // Obtener valor de la modalidad seleccionada mediante radio buttons
    const modalidadRadio = document.querySelector('input[name="modalidad"]:checked');
    const modalidad = modalidadRadio ? modalidadRadio.value : 'hora';

    // Validaciones básicas con condicionales
    if (!espacio) {
        alert("Por favor selecciona un espacio de trabajo.");
        return;
    }

    if (!fecha) {
        alert("Por favor selecciona la fecha de inicio.");
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Ingresa una cantidad válida de tiempo.");
        return;
    }

    // Validar disponibilidad simple
    const reservasOcupadas = reservas.filter(r => r.espacio === espacio && r.fechaInicio === fecha && r.estado === 'confirmada').length;
    if (reservasOcupadas >= CAPACIDADES[espacio]) {
        alert("Lo sentimos, no hay cupos disponibles para este espacio en la fecha seleccionada.");
        return;
    }

    // Generar código id consecutivo para la reserva (Eje: R-006)
    const nuevoCodigo = "R-" + String(reservas.length + 1).padStart(3, '0');
    const total = calcularTotalReserva(espacio, modalidad, cantidad);

    // Creación del objeto Reserva
    const nuevaReserva = {
        id: nuevoCodigo,
        correo: correo,
        espacio: espacio,
        modalidad: modalidad,
        fechaInicio: fecha,
        horaInicio: hora,
        cantidad: cantidad,
        personas: personas,
        total: total,
        estado: "confirmada"
    };

    // Agregar objeto al array y guardar
    reservas.push(nuevaReserva);
    guardarReservasEnStorage();

    alert(`¡Reserva creada con éxito! Código: ${nuevoCodigo}. Total: ${formatearMoneda(total)}`);
    document.querySelector('#reservar form').reset();
    
    // Actualizar las tablas en el DOM
    renderizarTablaReservas();
    actualizarTablaDisponibilidad();
    window.location.hash = "#consultar";
}

function cancelarReserva(codigoReserva) {
    // Buscar elemento en el arreglo por su ID
    const reserva = reservas.find(r => r.id === codigoReserva);

    if (reserva) {
        if (confirm(`¿Estás seguro de cancelar la reserva ${codigoReserva}?`)) {
            reserva.estado = "cancelada";
            guardarReservasEnStorage();
            renderizarTablaReservas();
            actualizarTablaDisponibilidad();
            alert(`La reserva ${codigoReserva} ha sido cancelada.`);
        }
    }
}

// --------------------------------------------------------------------------
// 4. RENDERIZADO DINÁMICO EN EL DOM Y FILTROS
// --------------------------------------------------------------------------

function renderizarTablaReservas(listaReservas = reservas) {
    const tablaReservasBody = document.querySelector('#consultar table:first-of-type tbody');
    if (!tablaReservasBody) return;

    // Limpiar filas previas
    tablaReservasBody.innerHTML = '';

    if (listaReservas.length === 0) {
        tablaReservasBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No se encontraron reservas.</td></tr>`;
        return;
    }

    // Iteración del arreglo mediante forEach para renderizar en HTML
    listaReservas.forEach(res => {
        const tr = document.createElement('tr');

        // Formato para badges de estado (Switch o Condicional)
        let badgeClase = "badge-confirmada";
        if (res.estado === "pendiente") badgeClase = "badge-pendiente";
        if (res.estado === "cancelada") badgeClase = "badge-cancelada";

        // Formato de texto de modalidad
        const modalidadTexto = `${res.cantidad} ${res.modalidad}${res.cantidad > 1 ? 's' : ''}`;
        
        // Formato fecha y hora
        const inicioTexto = res.horaInicio !== "--:--" ? `${res.fechaInicio} ${res.horaInicio}` : res.fechaInicio;

        tr.innerHTML = `
            <td>${res.id}</td>
            <td>${NOMBRES_ESPACIOS[res.espacio] || res.espacio}</td>
            <td>${modalidadTexto}</td>
            <td>${inicioTexto}</td>
            <td>-</td>
            <td>${formatearMoneda(res.total)}</td>
            <td><span class="badge ${badgeClase}">${res.estado.toUpperCase()}</span></td>
            <td>
                ${res.estado !== 'cancelada' 
                    ? `<button onclick="cancelarReserva('${res.id}')" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; cursor: pointer;">Cancelar</button>`
                    : '-'
                }
            </td>
        `;

        tablaReservasBody.appendChild(tr);
    });
}

function filtrarReservas(event) {
    event.preventDefault();

    const correoFiltro = document.getElementById('con-correo').value.trim().toLowerCase();
    const espacioFiltro = document.getElementById('con-espacio').value;
    const estadoFiltro = document.getElementById('con-estado').value;
    const desdeFiltro = document.getElementById('con-desde').value;
    const hastaFiltro = document.getElementById('con-hasta').value;

    // Uso del método .filter() para filtrar arreglos dinámicamente
    const reservasFiltradas = reservas.filter(res => {
        let cumpleCorreo = true;
        let cumpleEspacio = true;
        let cumpleEstado = true;
        let cumpleFecha = true;

        if (correoFiltro && !res.correo.includes(correoFiltro)) {
            cumpleCorreo = false;
        }

        if (espacioFiltro !== 'todos' && res.espacio !== espacioFiltro) {
            cumpleEspacio = false;
        }

        if (estadoFiltro !== 'todos' && res.estado !== estadoFiltro) {
            cumpleEstado = false;
        }

        if (desdeFiltro && res.fechaInicio < desdeFiltro) {
            cumpleFecha = false;
        }

        if (hastaFiltro && res.fechaInicio > hastaFiltro) {
            cumpleFecha = false;
        }

        return cumpleCorreo && cumpleEspacio && cumpleEstado && cumpleFecha;
    });

    renderizarTablaReservas(reservasFiltradas);
}

function actualizarTablaDisponibilidad() {
    const tablaDisponibilidadBody = document.querySelector('#consultar table:last-of-type tbody');
    if (!tablaDisponibilidadBody) return;

    tablaDisponibilidadBody.innerHTML = '';

    // Obtener la fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];

    // Iteración de las claves del objeto CAPACIDADES usando for...in
    for (const espacioKey in CAPACIDADES) {
        const capacidadTotal = CAPACIDADES[espacioKey];
        
        // Contar ocupados del día con .filter()
        const ocupados = reservas.filter(res => 
            res.espacio === espacioKey && 
            res.fechaInicio === hoy && 
            res.estado === 'confirmada'
        ).length;

        const disponibles = capacidadTotal - ocupados;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${NOMBRES_ESPACIOS[espacioKey]}</td>
            <td>${capacidadTotal}</td>
            <td>${ocupados}</td>
            <td>${disponibles > 0 ? disponibles : 0}</td>
        `;
        tablaDisponibilidadBody.appendChild(tr);
    }
}

// --------------------------------------------------------------------------
// 5. EVENT LISTENERS E INICIALIZACIÓN
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar datos por defecto
    inicializarDatosEjemplo();

    // 2. Escuchar Formulario de Registro
    const formRegistro = document.querySelector('#registro form');
    if (formRegistro) {
        formRegistro.addEventListener('submit', registrarUsuario);
    }

    // 3. Escuchar Formulario de Login
    const formLogin = document.querySelector('#login form');
    if (formLogin) {
        formLogin.addEventListener('submit', iniciarSesion);
    }

    // 4. Escuchar Formulario de Reserva
    const formReserva = document.querySelector('#reservar form');
    if (formReserva) {
        formReserva.addEventListener('submit', crearReserva);
    }

    // 5. Escuchar Formulario de Consulta/Filtros
    const formConsulta = document.querySelector('#consultar form');
    if (formConsulta) {
        formConsulta.addEventListener('submit', filtrarReservas);
    }

    // 6. Escuchar Formulario de Contacto
    const formContacto = document.querySelector('#contacto form');
    if (formContacto) {
        formContacto.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("¡Gracias por contactarnos! Te responderemos muy pronto.");
            formContacto.reset();
        });
    }

    // 7. Cargar estado de sesión y tablas iniciales al cargar la página
    actualizarEstadoSesionUI();
    renderizarTablaReservas();
    actualizarTablaDisponibilidad();
});