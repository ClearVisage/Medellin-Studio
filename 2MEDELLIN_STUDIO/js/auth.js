
/* ==========================================
   MEDELLÍN STUDIO — AUTENTICACIÓN
========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");
  const submit = document.getElementById("login-submit");

  if (!form || !message || !submit) {
    console.error("Faltan elementos del formulario de acceso.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    message.textContent = "No se pudo conectar con el sistema.";
    return;
  }

  function mostrarMensaje(texto, correcto = false) {
    message.textContent = texto;
    message.classList.toggle("success", correcto);
  }

  async function comprobarAdministrador() {
    const { data, error } =
      await supabaseClient.rpc("es_admin");

    if (error) {
      console.error("Error comprobando permisos:", error);
      throw new Error("No se pudieron verificar los permisos.");
    }

    return data === true;
  }

  async function cerrarSesionSegura() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Error cerrando sesión:", error);
    }
  }

  /* COMPROBAR SESIÓN EXISTENTE */

  try {
    const { data, error } =
      await supabaseClient.auth.getUser();

    if (!error && data.user) {
      const autorizado = await comprobarAdministrador();

      if (autorizado) {
        window.location.replace("admin.html");
        return;
      }

      await cerrarSesionSegura();
    }
  } catch (error) {
    console.error("Error comprobando sesión:", error);
  }

  /* INICIO DE SESIÓN */

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      mostrarMensaje("Introduce tu correo y contraseña.");
      return;
    }

    submit.disabled = true;
    mostrarMensaje("Comprobando credenciales...");

    try {
      const { error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        mostrarMensaje("Correo o contraseña incorrectos.");
        return;
      }

      let autorizado = false;

      try {
        autorizado = await comprobarAdministrador();
      } catch (error) {
        await cerrarSesionSegura();
        throw error;
      }

      if (!autorizado) {
        await cerrarSesionSegura();

        mostrarMensaje(
          "Esta cuenta no tiene permisos de administrador."
        );

        return;
      }

      mostrarMensaje(
        "Acceso autorizado. Redirigiendo...",
        true
      );

      window.location.replace("admin.html");

    } catch (error) {
      console.error("Error de autenticación:", error);

      mostrarMensaje(
        "No se pudo completar el acceso. Inténtalo de nuevo."
      );

    } finally {
      submit.disabled = false;
    }
  });
});