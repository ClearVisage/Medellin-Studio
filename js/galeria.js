
/* ==========================================
   MEDELLÍN STUDIO — GALERÍA PÚBLICA
========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("gallery-container");
  if (!contenedor) return;

  const BUCKET = "galeria";

  function mostrarMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "gallery-loading";
    mensaje.textContent = texto;

    contenedor.replaceChildren(mensaje);
  }

  function obtenerUrl(ruta) {
    const { data } = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(ruta);

    return data.publicUrl;
  }

  function crearTarjeta(foto, indice) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "gallery-item reveal";

    // Conservar la composición visual original
    if (indice === 0) {
      tarjeta.classList.add("gallery-item-large");
    } else if (indice === 4) {
      tarjeta.classList.add("gallery-item-wide");
    }

    const contenedorImagen = document.createElement("div");
    contenedorImagen.className = "gallery-photo";

    const imagen = document.createElement("img");
    imagen.src = obtenerUrl(foto.ruta_archivo);
    imagen.alt =
      foto.titulo || "Corte realizado en Medellín Studio";

    imagen.loading = indice === 0 ? "eager" : "lazy";
    imagen.decoding = "async";

    if (indice === 0) {
      imagen.fetchPriority = "high";
    }

    // Si una imagen falla, evitar mostrar el icono roto
    imagen.addEventListener("error", () => {
      tarjeta.classList.add("gallery-item-error");
      imagen.hidden = true;
    });

    contenedorImagen.appendChild(imagen);

    const informacion = document.createElement("div");
    informacion.className = "gallery-item-info";

    const numero = document.createElement("span");
    numero.textContent =
      `${String(indice + 1).padStart(2, "0")} / MEDELLÍN STUDIO`;

    const titulo = document.createElement("strong");
    titulo.textContent =
      foto.titulo || "NUESTRO TRABAJO";

    informacion.append(numero, titulo);
    tarjeta.append(contenedorImagen, informacion);

    return tarjeta;
  }

  async function cargarGaleria() {
    mostrarMensaje("Cargando nuestros trabajos...");

    try {
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase no está disponible.");
      }

      const { data, error } = await supabaseClient
        .from("galeria")
        .select("id,titulo,ruta_archivo,orden")
        .eq("visible", true)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        mostrarMensaje(
          "Estamos preparando nuestra galería. Muy pronto podrás descubrir nuestros trabajos."
        );
        return;
      }

      const fragmento = document.createDocumentFragment();
      const tarjetas = [];

      data.forEach((foto, indice) => {
        if (!foto.ruta_archivo) return;

        const tarjeta = crearTarjeta(foto, indice);
        tarjetas.push(tarjeta);
        fragmento.appendChild(tarjeta);
      });

      if (!tarjetas.length) {
        mostrarMensaje("Todavía no hay fotografías disponibles.");
        return;
      }

      contenedor.replaceChildren(fragmento);

      /*
        Las tarjetas se añaden después de la
        inicialización de las animaciones globales.
        Por eso activamos su visibilidad manualmente.
      */

      requestAnimationFrame(() => {
        tarjetas.forEach(tarjeta => {
          tarjeta.classList.add("visible");
        });
      });

    } catch (error) {
      console.error("Error cargando galería:", error);

      mostrarMensaje(
        "No hemos podido cargar las fotografías. Inténtalo más tarde."
      );
    }
  }

  await cargarGaleria();
});