
/* ==========================================
   MEDELLÍN STUDIO — PÁGINA PRINCIPAL
   Servicios destacados desde Supabase
========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById(
    "home-services-container"
  );

  if (!contenedor) return;

  function formatoPrecio(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "Consultar precio";
    }

    const precio = Number(valor);

    if (!Number.isFinite(precio) || precio < 0) {
      return "Consultar precio";
    }

    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(precio);
  }

  function mostrarMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "home-services-loading";
    mensaje.textContent = texto;

    contenedor.replaceChildren(mensaje);
  }

  function crearServicio(servicio, indice) {
    const fila = document.createElement("article");
    fila.className = "service-row reveal";

    const numero = document.createElement("span");
    numero.className = "service-number";
    numero.textContent =
      String(indice + 1).padStart(2, "0");

    const informacion = document.createElement("div");
    informacion.className = "service-info";

    const nombre = servicio.nombre || "Servicio de barbería";

    const titulo = document.createElement("h3");
    titulo.textContent = nombre;

    const descripcion = document.createElement("p");
    descripcion.textContent = servicio.descripcion || "";

    informacion.append(titulo, descripcion);

    const precio = document.createElement("span");
    precio.className = "service-price";
    precio.textContent = formatoPrecio(servicio.precio);

    const reservar = document.createElement("a");
    reservar.className = "service-arrow";
    reservar.href = "reservas.html";
    reservar.textContent = "↗";

    reservar.setAttribute(
      "aria-label",
      `Reservar ${nombre}`
    );

    fila.append(
      numero,
      informacion,
      precio,
      reservar
    );

    return fila;
  }

  async function cargarServiciosDestacados() {
    mostrarMensaje("Cargando servicios...");

    try {
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase no está disponible.");
      }

      const { data, error } = await supabaseClient
        .from("servicios")
        .select("id,nombre,descripcion,precio,orden")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("id", { ascending: true })
        .limit(3);

      if (error) throw error;

      if (!data || data.length === 0) {
        mostrarMensaje(
          "Actualmente no hay servicios disponibles."
        );
        return;
      }

      const fragmento = document.createDocumentFragment();
      const filas = [];

      data.forEach((servicio, indice) => {
        const fila = crearServicio(servicio, indice);

        filas.push(fila);
        fragmento.appendChild(fila);
      });

      contenedor.replaceChildren(fragmento);

      /*
        Las filas se generan dinámicamente,
        por eso activamos su animación después
        de insertarlas en el documento.
      */

      requestAnimationFrame(() => {
        filas.forEach(fila => {
          fila.classList.add("visible");
        });
      });

    } catch (error) {
      console.error(
        "Error cargando servicios destacados:",
        error
      );

      mostrarMensaje(
        "No hemos podido cargar los servicios. Inténtalo más tarde."
      );
    }
  }

  await cargarServiciosDestacados();
});