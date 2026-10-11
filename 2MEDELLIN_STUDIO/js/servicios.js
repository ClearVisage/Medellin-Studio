
/* =========================================
   MEDELLÍN STUDIO — SERVICIOS PÚBLICOS
   Datos obtenidos desde Supabase
========================================= */

const BOOKSY_URL =
  "https://booksy.com/es-es/192905_medellin-studio_barberia_53009_madrid";

function formatoPrecio(precio) {
  const numero = Number(precio);

  if (!Number.isFinite(numero) || numero < 0) {
    return "Consultar precio";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numero);
}

function crearTarjetaServicio(servicio, indice) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "service-card reveal";

  const numero = document.createElement("span");
  numero.className = "service-card-number";
  numero.textContent =
    String(indice + 1).padStart(2, "0");

  const titulo = document.createElement("h3");
  titulo.textContent =
    servicio.nombre || "Servicio de barbería";

  const descripcion = document.createElement("p");
  descripcion.className = "service-card-description";
  descripcion.textContent =
    servicio.descripcion || "";

  const parteInferior = document.createElement("div");
  parteInferior.className = "service-card-bottom";

  const precios = document.createElement("div");

  const precio = document.createElement("strong");
  precio.className = "service-card-price";
  precio.textContent = formatoPrecio(servicio.precio);

  const duracion = document.createElement("span");
  duracion.className = "service-card-duration";

  const minutos = Number(servicio.duracion_minutos);

  duracion.textContent =
    Number.isInteger(minutos) && minutos > 0
      ? `${minutos} MINUTOS`
      : "CONSULTAR DURACIÓN";

  precios.append(precio, duracion);

  const reservar = document.createElement("a");
  reservar.className = "service-card-book";
  reservar.href = BOOKSY_URL;
  reservar.target = "_blank";
  reservar.rel = "noopener noreferrer";
  reservar.textContent = "↗";

  reservar.setAttribute(
    "aria-label",
    `Reservar ${servicio.nombre || "servicio"} en Booksy`
  );

  parteInferior.append(precios, reservar);
  tarjeta.append(
    numero,
    titulo,
    descripcion,
    parteInferior
  );

  return tarjeta;
}

async function cargarServiciosPublicos() {
  const contenedor =
    document.getElementById("services-container");

  if (!contenedor) return;

  function mostrarMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "services-empty";
    mensaje.textContent = texto;
    contenedor.replaceChildren(mensaje);
  }

  mostrarMensaje("Cargando servicios...");

  try {
    if (typeof supabaseClient === "undefined") {
      throw new Error("Supabase no está disponible.");
    }

    const { data, error } = await supabaseClient
      .from("servicios")
      .select(
        "id,nombre,descripcion,precio,duracion_minutos,orden"
      )
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      mostrarMensaje(
        "No hay servicios disponibles actualmente."
      );
      return;
    }

    const fragmento = document.createDocumentFragment();
    const tarjetas = [];

    data.forEach((servicio, indice) => {
      const tarjeta =
        crearTarjetaServicio(servicio, indice);

      tarjetas.push(tarjeta);
      fragmento.appendChild(tarjeta);
    });

    contenedor.replaceChildren(fragmento);

    /*
      Mostrar tarjetas después de insertarlas,
      conservando las animaciones originales.
    */

    requestAnimationFrame(() => {
      tarjetas.forEach(tarjeta => {
        tarjeta.classList.add("visible");
      });
    });

  } catch (error) {
    console.error("Error cargando servicios:", error);

    mostrarMensaje(
      "No hemos podido cargar los servicios. Inténtalo de nuevo más tarde."
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  cargarServiciosPublicos
);