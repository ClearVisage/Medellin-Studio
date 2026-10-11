
/* =====================================
   MEDELLÍN STUDIO — ADMINISTRACIÓN
===================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("admin-loading");
  const app = document.getElementById("admin-app");
  const tbody = document.getElementById("services-table-body");
  const modal = document.getElementById("service-modal");
  const form = document.getElementById("service-form");
  const message = document.getElementById("admin-message");
  const modalMessage = document.getElementById("modal-message");
  const saveButton = document.getElementById("save-service-button");

  let servicios = [];
  let lastFocusedElement = null;

  function informar(elemento, texto, success = false) {
    elemento.textContent = texto;
    elemento.classList.toggle("success", success);
  }

  function formatoPrecio(valor) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(valor);
  }

  async function comprobarAcceso() {
    const { data: { user }, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError || !user) {
      window.location.replace("login.html");
      return false;
    }

    const { data: autorizado, error: permissionError } =
      await supabaseClient.rpc("es_admin");

    if (permissionError || autorizado !== true) {
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
      return false;
    }

    document.getElementById("admin-email").textContent =
      user.email || "Administrador";

    loading.hidden = true;
    app.hidden = false;

    return true;
  }

  async function cargarServicios() {
    const { data, error } = await supabaseClient
      .from("servicios")
      .select("*")
      .order("orden", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      informar(message, "No se pudieron cargar los servicios.");
      return;
    }

    servicios = data || [];
    actualizarEstadisticas();
    pintarTabla();
  }

  function actualizarEstadisticas() {
    document.getElementById("stat-total").textContent =
      servicios.length;

    document.getElementById("stat-active").textContent =
      servicios.filter(s => s.activo).length;

    document.getElementById("stat-inactive").textContent =
      servicios.filter(s => !s.activo).length;
  }

  function crearCelda(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
  }

  function crearBoton(texto, accion, id, danger = false) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "admin-action-button";

    if (danger) boton.classList.add("danger");

    boton.textContent = texto;
    boton.dataset.action = accion;
    boton.dataset.id = id;

    return boton;
  }

  function pintarTabla() {
    tbody.replaceChildren();

    if (!servicios.length) {
      const fila = document.createElement("tr");
      const celda = crearCelda("No hay servicios registrados.");
      celda.colSpan = 5;
      fila.appendChild(celda);
      tbody.appendChild(fila);
      return;
    }

    servicios.forEach(servicio => {
      const fila = document.createElement("tr");

      const nombre = document.createElement("td");
      const titulo = document.createElement("strong");
      titulo.textContent = servicio.nombre;

      const descripcion = document.createElement("small");
      descripcion.textContent = servicio.descripcion || "";

      nombre.append(titulo, descripcion);

      const precio = crearCelda(formatoPrecio(servicio.precio));

      const duracion = crearCelda(
        `${servicio.duracion_minutos} min`
      );

      const estado = document.createElement("td");
      const etiqueta = document.createElement("span");
      etiqueta.className =
        `admin-status ${servicio.activo ? "active" : "inactive"}`;
      etiqueta.textContent =
        servicio.activo ? "ACTIVO" : "OCULTO";
      estado.appendChild(etiqueta);

      const acciones = document.createElement("td");
      const contenedor = document.createElement("div");
      contenedor.className = "admin-actions";

      contenedor.append(
        crearBoton("Editar", "edit", servicio.id),
        crearBoton(
          servicio.activo ? "Ocultar" : "Activar",
          "toggle",
          servicio.id
        ),
        crearBoton("Eliminar", "delete", servicio.id, true)
      );

      acciones.appendChild(contenedor);

      fila.append(
        nombre,
        precio,
        duracion,
        estado,
        acciones
      );

      tbody.appendChild(fila);
    });
  }

  function abrirModal(servicio = null) {
    lastFocusedElement = document.activeElement;
    form.reset();
    informar(modalMessage, "");

    document.getElementById("service-id").value =
      servicio?.id ?? "";

    document.getElementById("service-name").value =
      servicio?.nombre ?? "";

    document.getElementById("service-description").value =
      servicio?.descripcion ?? "";

    document.getElementById("service-price").value =
      servicio?.precio ?? "";

    document.getElementById("service-duration").value =
      servicio?.duracion_minutos ?? 30;

    document.getElementById("service-order").value =
      servicio?.orden ?? servicios.length + 1;

    document.getElementById("service-active").checked =
      servicio?.activo ?? true;

    document.getElementById("modal-title").textContent =
      servicio ? "EDITAR SERVICIO" : "AÑADIR SERVICIO";

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("service-name").focus();
  }

  function cerrarModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
  }

  async function guardarServicio(event) {
    event.preventDefault();

    const id = document.getElementById("service-id").value;

    const datos = {
      nombre: document.getElementById("service-name").value.trim(),
      descripcion:
        document.getElementById("service-description").value.trim(),
      precio: Number(
        document.getElementById("service-price").value
      ),
      duracion_minutos: Number(
        document.getElementById("service-duration").value
      ),
      orden: Number(
        document.getElementById("service-order").value
      ),
      activo:
        document.getElementById("service-active").checked
    };

    if (!datos.nombre ||
        !Number.isFinite(datos.precio) ||
        datos.precio < 0 ||
        !Number.isInteger(datos.duracion_minutos) ||
        datos.duracion_minutos <= 0 ||
        !Number.isInteger(datos.orden)) {
      informar(modalMessage, "Revisa los datos introducidos.");
      return;
    }

    saveButton.disabled = true;
    informar(modalMessage, "Guardando...");

    try {
      let resultado;

      if (id) {
        resultado = await supabaseClient
          .from("servicios")
          .update(datos)
          .eq("id", id);
      } else {
        resultado = await supabaseClient
          .from("servicios")
          .insert(datos);
      }

      if (resultado.error) throw resultado.error;

      cerrarModal();
      informar(message, "Servicio guardado correctamente.", true);
      await cargarServicios();

    } catch (error) {
      console.error(error);
      informar(modalMessage, "No se pudo guardar el servicio.");
    } finally {
      saveButton.disabled = false;
    }
  }

  async function cambiarEstado(servicio) {
    const { error } = await supabaseClient
      .from("servicios")
      .update({ activo: !servicio.activo })
      .eq("id", servicio.id);

    if (error) {
      console.error(error);
      informar(message, "No se pudo cambiar el estado.");
      return;
    }

    informar(message, "Estado actualizado.", true);
    await cargarServicios();
  }

  async function eliminarServicio(servicio) {
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar "${servicio.nombre}"?`
    );

    if (!confirmado) return;

    const { error } = await supabaseClient
      .from("servicios")
      .delete()
      .eq("id", servicio.id);

    if (error) {
      console.error(error);
      informar(message, "No se pudo eliminar el servicio.");
      return;
    }

    informar(message, "Servicio eliminado.", true);
    await cargarServicios();
  }

  // EVENTOS
  document.getElementById("add-service-button")
    .addEventListener("click", () => abrirModal());

  document.getElementById("close-modal-button")
    .addEventListener("click", cerrarModal);

  document.getElementById("cancel-modal-button")
    .addEventListener("click", cerrarModal);

  modal.querySelector("[data-close-modal]")
    .addEventListener("click", cerrarModal);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
      cerrarModal();
    }
  });

  form.addEventListener("submit", guardarServicio);

  tbody.addEventListener("click", async event => {
    const boton = event.target.closest("button[data-action]");
    if (!boton) return;

    const servicio = servicios.find(
      s => String(s.id) === boton.dataset.id
    );

    if (!servicio) return;

    const accion = boton.dataset.action;

    if (accion === "edit") abrirModal(servicio);
    if (accion === "toggle") await cambiarEstado(servicio);
    if (accion === "delete") await eliminarServicio(servicio);
  });

  document.getElementById("logout-button")
    .addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        informar(message, "No se pudo cerrar la sesión.");
        return;
      }

      window.location.replace("login.html");
    });

  // INICIALIZACIÓN
  try {
    const autorizado = await comprobarAcceso();
    if (autorizado) await cargarServicios();
  } catch (error) {
    console.error(error);
    loading.textContent =
      "No se pudo verificar el acceso. Recarga la página.";
  }
});