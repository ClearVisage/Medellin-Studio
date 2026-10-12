
/* ==========================================
   MEDELLÍN STUDIO — ADMIN GALERÍA
========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("gallery-upload-form");
  const fileInput = document.getElementById("gallery-file");
  const titleInput = document.getElementById("gallery-title");
  const uploadButton = document.getElementById("gallery-upload-button");
  const grid = document.getElementById("admin-gallery-grid");
  const message = document.getElementById("gallery-admin-message");

  if (
    !form ||
    !fileInput ||
    !titleInput ||
    !uploadButton ||
    !grid ||
    !message
  ) {
    console.error("Faltan elementos del administrador de galería.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    message.textContent = "No se pudo conectar con Supabase.";
    return;
  }

  const BUCKET = "galeria";
  const MAX_SIZE = 5 * 1024 * 1024;

  const ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  let fotos = [];
  let operacionEnCurso = false;

  function informar(texto, success = false) {
    message.textContent = texto;
    message.classList.toggle("success", success);
  }

  function bloquearAcciones(bloquear) {
    operacionEnCurso = bloquear;
    uploadButton.disabled = bloquear;

    grid.querySelectorAll("button[data-action]").forEach(boton => {
      boton.disabled = bloquear;
    });
  }

  async function comprobarAdmin() {
    const { data: { user }, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !user) return false;

    const { data, error } =
      await supabaseClient.rpc("es_admin");

    if (error) {
      console.error("Error comprobando administrador:", error);
      return false;
    }

    return data === true;
  }

  function obtenerUrl(ruta) {
    const { data } = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(ruta);

    return data.publicUrl;
  }

  async function cargarFotos() {
    const { data, error } = await supabaseClient
      .from("galeria")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando galería:", error);
      informar("No se pudieron cargar las fotografías.");
      return;
    }

    fotos = data || [];
    pintarFotos();
  }

  function crearBoton(texto, accion, id, danger = false) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "admin-action-button";

    if (danger) boton.classList.add("danger");

    boton.textContent = texto;
    boton.dataset.action = accion;
    boton.dataset.id = String(id);
    boton.disabled = operacionEnCurso;

    return boton;
  }

  function pintarFotos() {
    grid.replaceChildren();

    if (!fotos.length) {
      const aviso = document.createElement("p");
      aviso.textContent =
        "Todavía no hay fotografías. Sube la primera.";
      grid.appendChild(aviso);
      return;
    }

    fotos.forEach(foto => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "admin-gallery-card";

      const imagen = document.createElement("img");
      imagen.src = obtenerUrl(foto.ruta_archivo);
      imagen.alt = foto.titulo || "Trabajo de Medellín Studio";
      imagen.loading = "lazy";
      imagen.decoding = "async";

      const cuerpo = document.createElement("div");
      cuerpo.className = "admin-gallery-card-body";

      const titulo = document.createElement("strong");
      titulo.textContent = foto.titulo || "Sin título";

      const estado = document.createElement("small");
      estado.textContent = foto.visible
        ? "VISIBLE EN LA WEB"
        : "FOTOGRAFÍA OCULTA";

      const acciones = document.createElement("div");
      acciones.className = "admin-gallery-card-actions";

      acciones.append(
        crearBoton(
          foto.visible ? "Ocultar" : "Mostrar",
          "toggle",
          foto.id
        ),
        crearBoton("Eliminar", "delete", foto.id, true)
      );

      cuerpo.append(titulo, estado, acciones);
      tarjeta.append(imagen, cuerpo);
      grid.appendChild(tarjeta);
    });
  }

  /* ==========================================
     SUBIR FOTOGRAFÍA
  ========================================== */

  async function subirFoto(event) {
    event.preventDefault();

    if (operacionEnCurso) return;

    const archivo = fileInput.files?.[0];
    const titulo = titleInput.value.trim();

    if (!archivo || !titulo) {
      informar("Selecciona una fotografía y escribe su título.");
      return;
    }

    if (!Object.hasOwn(ALLOWED_TYPES, archivo.type)) {
      informar("Solo se permiten imágenes JPG, PNG o WebP.");
      return;
    }

    if (archivo.size === 0 || archivo.size > MAX_SIZE) {
      informar("La imagen debe ocupar entre 1 byte y 5 MB.");
      return;
    }

    if (titulo.length > 150) {
      informar("El título no puede superar los 150 caracteres.");
      return;
    }

    bloquearAcciones(true);
    informar("Subiendo fotografía...");

    let ruta = null;
    let archivoSubido = false;
    let registroCreado = false;

    try {
      const extension = ALLOWED_TYPES[archivo.type];

      ruta = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabaseClient.storage
          .from(BUCKET)
          .upload(ruta, archivo, {
            contentType: archivo.type,
            upsert: false
          });

      if (uploadError) throw uploadError;

      archivoSubido = true;

      const { error: insertError } =
        await supabaseClient
          .from("galeria")
          .insert({
            titulo,
            ruta_archivo: ruta,
            visible: true,
            orden: 0
          });

      if (insertError) throw insertError;

      registroCreado = true;

      form.reset();
      informar("Fotografía subida correctamente.", true);
      await cargarFotos();

    } catch (error) {
      console.error("Error subiendo fotografía:", error);

      if (archivoSubido && !registroCreado && ruta) {
        const { error: cleanupError } =
          await supabaseClient.storage
            .from(BUCKET)
            .remove([ruta]);

        if (cleanupError) {
          console.error(
            "No se pudo limpiar el archivo subido:",
            cleanupError
          );

          informar(
            "Falló la subida y no se pudo limpiar el archivo. Revisa Storage."
          );

          return;
        }
      }

      informar("No se pudo subir la fotografía.");

    } finally {
      bloquearAcciones(false);
    }
  }

  /* ==========================================
     CAMBIAR VISIBILIDAD
  ========================================== */

  async function cambiarVisibilidad(foto) {
    const { error } = await supabaseClient
      .from("galeria")
      .update({
        visible: !foto.visible
      })
      .eq("id", foto.id);

    if (error) throw error;

    informar("Visibilidad actualizada.", true);
    await cargarFotos();
  }

  /* ==========================================
     ELIMINAR FOTOGRAFÍA
  ========================================== */

  async function eliminarFoto(foto) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente "${foto.titulo || "Sin título"}"?`
    );

    if (!confirmado) return;

    informar("Eliminando fotografía...");

    /*
      Primero ocultamos la foto para evitar que
      siga apareciendo en la web durante el borrado.
    */

    const { error: hideError } =
      await supabaseClient
        .from("galeria")
        .update({ visible: false })
        .eq("id", foto.id);

    if (hideError) throw hideError;

    /*
      Eliminamos el archivo de Storage.
    */

    const { error: storageError } =
      await supabaseClient.storage
        .from(BUCKET)
        .remove([foto.ruta_archivo]);

    if (storageError) {
      /*
        Restauramos la visibilidad anterior
        si no se pudo eliminar el archivo.
      */

      const { error: restoreError } =
        await supabaseClient
          .from("galeria")
          .update({ visible: foto.visible })
          .eq("id", foto.id);

      if (restoreError) {
        console.error(
          "No se pudo restaurar la visibilidad:",
          restoreError
        );
      }

      throw storageError;
    }

    /*
      Eliminamos el registro de la base de datos.
    */

    const { error: dbError } =
      await supabaseClient
        .from("galeria")
        .delete()
        .eq("id", foto.id);

    if (dbError) {
      console.error(
        "El archivo se eliminó, pero quedó su registro:",
        dbError
      );

      informar(
        "El archivo se borró, pero quedó un registro oculto. Revisa la galería."
      );

      await cargarFotos();
      return;
    }

    informar("Fotografía eliminada correctamente.", true);
    await cargarFotos();
  }

  /* ==========================================
     EVENTOS
  ========================================== */

  grid.addEventListener("click", async event => {
    const boton = event.target.closest("button[data-action]");

    if (!boton || operacionEnCurso) return;

    const foto = fotos.find(
      item => String(item.id) === boton.dataset.id
    );

    if (!foto) return;

    bloquearAcciones(true);

    try {
      if (boton.dataset.action === "toggle") {
        await cambiarVisibilidad(foto);
      }

      if (boton.dataset.action === "delete") {
        await eliminarFoto(foto);
      }

    } catch (error) {
      console.error("Error gestionando fotografía:", error);
      informar("No se pudo completar la operación.");

    } finally {
      bloquearAcciones(false);
    }
  });

  form.addEventListener("submit", subirFoto);

  /* ==========================================
     INICIALIZACIÓN
  ========================================== */

  try {
    const autorizado = await comprobarAdmin();

    if (autorizado) {
      await cargarFotos();
    } else {
      grid.textContent = "Acceso no autorizado.";
      uploadButton.disabled = true;
    }

  } catch (error) {
    console.error("Error iniciando galería:", error);
    grid.textContent = "No se pudo cargar la galería.";
    uploadButton.disabled = true;
  }
});
