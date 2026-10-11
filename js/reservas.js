
/* ==========================================
   MEDELLÍN STUDIO — RESERVAS
   Servicios dinámicos desde Supabase
========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("booking-services");

  if (!contenedor) return;

  const BOOKSY_URL =
    "https://booksy.com/es-es/192905_medellin-studio_barberia_53009_madrid#ba_s=seo";

  function mostrarMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "booking-loading";
    mensaje.textContent = texto;

    contenedor.replaceChildren(mensaje);
  }

  function formatearPrecio(valor) {
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

  function formatearDuracion(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "Consultar duración";
    }

    const minutos = Number(valor);

    if (!Number.isInteger(minutos) || minutos <= 0) {
      return "Consultar duración";
    }

    return `${minutos} MIN`;
  }

  function crearServicio(servicio) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "booking-service";

    const informacion = document.createElement("div");
    informacion.className = "booking-service-info";

    const nombreServicio =
      servicio.nombre || "Servicio de barbería";

    const nombre = document.createElement("h3");
    nombre.textContent = nombreServicio;

    const descripcion = document.createElement("p");
    descripcion.textContent =
      servicio.descripcion || "Servicio de Medellín Studio.";

    informacion.append(nombre, descripcion);

    const duracion = document.createElement("span");
    duracion.className = "booking-service-duration";
    duracion.textContent =
      formatearDuracion(servicio.duracion_minutos);

    const precio = document.createElement("strong");
    precio.className = "booking-service-price";
    precio.textContent = formatearPrecio(servicio.precio);

    const boton = document.createElement("a");
    boton.className = "booking-service-button";
    boton.href = BOOKSY_URL;
    boton.target = "_blank";
    boton.rel = "noopener noreferrer";
    boton.textContent = "RESERVAR ↗";

    boton.setAttribute(
      "aria-label",
      `Reservar ${nombreServicio} en Booksy`
    );

    tarjeta.append(
      informacion,
      duracion,
      precio,
      boton
    );

    return tarjeta;
  }

  async function cargarServiciosReserva() {
    mostrarMensaje("Cargando servicios...");

    try {
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase no está disponible.");
      }

      const { data, error } = await supabaseClient
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        mostrarMensaje(
          "Próximamente estarán disponibles nuestros servicios."
        );
        return;
      }

      const fragmento = document.createDocumentFragment();

      data.forEach(servicio => {
        fragmento.appendChild(crearServicio(servicio));
      });

      contenedor.replaceChildren(fragmento);

    } catch (error) {
      console.error(
        "Error cargando servicios de reserva:",
        error
      );

      mostrarMensaje(
        "No hemos podido cargar los servicios. Inténtalo más tarde."
      );
    }
  }

  await cargarServiciosReserva();
});