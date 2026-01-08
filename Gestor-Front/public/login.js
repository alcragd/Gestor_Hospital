// ======================================================
// MOSTRAR mostrarMensajeAS
// ======================================================
window.mostrarMensaje = function(texto, tipo = "info") {
    const msg = document.getElementById("mensaje");

    msg.innerText = texto;

    if (tipo === "error") msg.style.background = "#D32F2F";
    else if (tipo === "success") msg.style.background = "#388E3C";
    else msg.style.background = "#d22219ff";

    msg.style.display = "block";
    msg.style.opacity = "1";

    setTimeout(() => {
        msg.style.opacity = "0";
        setTimeout(() => msg.style.display = "none", 400);
    }, 2500);
};

// ======================================================
// MOSTRAR FORMULARIOS
// ======================================================
window.showRegister = function () {
    limpiarFormularios();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
};

// ======================================================
// LIMPIAR FORMULARIOS
// ======================================================
window.showLogin = function () {
    limpiarFormularios();
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
};

function limpiarFormularios() {
    document.querySelectorAll("input").forEach(i => i.value = "");
    document.getElementById("regSexo").value = "";
}

// ======================================================
// LOGIN - CORREGIDO
// ======================================================
// ======================================================
// LOGIN GENERAL PARA TODOS LOS USUARIOS - VERSIÓN CORREGIDA
// ======================================================
window.login = async function () {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        mostrarMensaje("Por favor escribe usuario y contraseña.");
        return;
    }

    try {
        console.log("🔍 Intentando conectar a: http://localhost:3000/auth/loginGeneral");
        
        const res = await fetch("http://localhost:3000/auth/loginGeneral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            mostrarMensaje(`Error del servidor (${res.status}): ${res.statusText}`);
            return;
        }

        const data = await res.json();
        console.log("Respuesta del servidor:", data);

        if (!data.success) {
            mostrarMensaje(data.message || "Usuario o contraseña incorrectos");
            return;
        }

        console.log("Datos del login:", data);

        // Guardar datos en localStorage
        localStorage.setItem("userId", data.userId);       // ID específico (Paciente, Doctor, etc.)
        localStorage.setItem("idUser", data.id);          // Id_User de la tabla Usuarios
        localStorage.setItem("userRole", data.tipo);      // GUARDADO COMO userRole para Vue
        localStorage.setItem("tipo", data.tipo);          // ID_Tipo_User (1,2,3,4)
        localStorage.setItem("nombre", data.nombre);
        localStorage.setItem("username", data.nombre);    // AGREGADO username para el panel
        localStorage.setItem("paterno", data.paterno || "");
        localStorage.setItem("materno", data.materno || "");
        localStorage.setItem("correo", data.correo);
        localStorage.setItem("telefono", data.telefono || "");
        // Datos personales adicionales
        if (data.dni) localStorage.setItem("dni", data.dni);
        if (data.fecha_nac) localStorage.setItem("fecha_nac", data.fecha_nac);
        if (data.sexo) localStorage.setItem("sexo", data.sexo);
        if (typeof data.edad !== 'undefined' && data.edad !== null) localStorage.setItem("edad", String(data.edad));
        if (data.curp) localStorage.setItem("curp", data.curp);
        if (data.rfc) localStorage.setItem("rfc", data.rfc);
        if (data.sueldo) localStorage.setItem("sueldo", String(data.sueldo));
        if (data.especialidad) localStorage.setItem("especialidad", data.especialidad);
        if (data.telefono) localStorage.setItem("telefono", data.telefono);
        
        // Datos adicionales según tipo
        if (data.especialidad) {
            localStorage.setItem("especialidad", data.especialidad);
        }
        if (data.emergencia) {
            localStorage.setItem("emergencia", data.emergencia);
        }

        console.log("LocalStorage guardado:", {
            userId: localStorage.getItem("userId"),
            tipo: localStorage.getItem("tipo"),
            nombre: localStorage.getItem("nombre")
        });

        // REDIRECCIÓN SEGÚN TIPO DE USUARIO - SIMPLIFICADA
        const tipo = parseInt(data.tipo);
        console.log("Tipo de usuario:", tipo);
        
        // Primero, prueba una redirección simple
        console.log("Redirigiendo a página de paciente...");
        
        // Opción 1: Redirigir siempre a paciente (para probar)
    window.location.href = "/paciente.html";
        
        // Opción 2: Según tipo (descomenta cuando funcione la opción 1)
        
        switch(tipo) {
            case 1: // DOCTOR
                window.location.href = "doctor.html";
                break;
            case 2: // FARMACEUTICO
                window.location.href = "farmacia.html";
                break;
            case 3: // RECEPCIONISTA
                window.location.href = "recepcion.html";
                break;
            case 4: // PACIENTE
                window.location.href = "paciente.html";
                break;
            default:
                mostrarMensaje("Tipo de usuario no reconocido");
                return;
        }
        

    } catch (error) {
        console.error("Error completo en login:", error);
        
        if (error.name === 'AbortError') {
            mostrarMensaje("Timeout: El servidor no respondió");
        } else if (error.message.includes('Failed to fetch')) {
            mostrarMensaje("Error de conexión con el servidor");
        } else {
            mostrarMensaje("Error: " + error.message);
        }
    }
};

// ======================================================
// REGISTRO (PACIENTE POR DEFAULT) - CORREGIDO
// ======================================================
window.register = async function() {
    const data = {
        username: document.getElementById("regUser").value.trim(),
        password: document.getElementById("regPass").value.trim(),
        nombre: document.getElementById("regNombre").value.trim(),
        paterno: document.getElementById("regPaterno").value.trim(),
        materno: document.getElementById("regMaterno").value.trim(),
        dni: document.getElementById("regDNI").value.trim(),
        fecha_nac: document.getElementById("regFechaNac").value,
        sexo: document.getElementById("regSexo").value,
        edad: parseInt(document.getElementById("regEdad").value),
        correo: document.getElementById("regEmail").value.trim(),
        telefono_cel: document.getElementById("regPhone").value.trim(),
        telefono_emergencia: document.getElementById("regEmergencia").value.trim()
    };

    // VALIDAR FECHA DE NACIMIENTO
    const fechaNac = new Date(data.fecha_nac);
    const hoy = new Date();

    if (isNaN(fechaNac.getTime())) {
        mostrarMensaje("La fecha de nacimiento no es válida.", "error");
        return;
    }

    if (fechaNac > hoy) {
        mostrarMensaje("La fecha de nacimiento no puede ser futura.", "error");
        return;
    }

    let edadCalc = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
        edadCalc--;
    }

    if (edadCalc < 0 || edadCalc > 120) {
        mostrarMensaje("La edad calculada no es válida.", "error");
        return;
    }

    // Validación simple
    for (const [key, value] of Object.entries(data)) {
        if (key !== "materno" && !value) {
            mostrarMensaje("Completa todos los campos obligatorios.");
            return;
        }
    }

    try {
        const res = await fetch("http://localhost:3000/auth/createFull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!result.success) {
            if (result.code === "USER_EXISTS") {
                mostrarMensaje("Ese nombre de usuario, correo o teléfono ya está registrado. Si ya tienes una cuenta, puedes iniciar sesión directamente.");
                return;
            }
            if (result.code === "DATA_EXISTS") {
                mostrarMensaje("El DNI, correo o teléfono ya están registrados.");
                return;
            }
            mostrarMensaje(result.message || "No se pudo crear el usuario.");
            return;
        }

        mostrarMensaje("Usuario creado correctamente. Ahora inicia sesión.", "success");
        showLogin();
        
    } catch (error) {
        console.error("Error en register:", error);
        mostrarMensaje("Error de conexión con el servidor");
    }
};