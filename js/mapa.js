
/* ==========================================
   MEDELLÍN STUDIO — MAPA BAJO DEMANDA
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("contact-map");
  const boton = document.getElementById("load-contact-map");

  if (!contenedor || !boton) return;

  boton.addEventListener("click", () => {
    boton.disabled = true;
    boton.textContent = "CARGANDO MAPA...";

    const iframe = document.createElement("iframe");

    iframe.title = "Ubicación de Medellín Studio en Madrid";
    iframe.src =
      "https://www.google.com/maps?q=Calle%20Ezequiel%20Solana%2099%2C%20Madrid&output=embed";

    iframe.loading = "eager";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;

    iframe.addEventListener("load", () => {
      console.log("Mapa de Medellín Studio cargado.");
    });

    contenedor.replaceChildren(iframe);
  }, { once: true });
});
