
/* ==========================================
   MEDELLÍN STUDIO — NAVEGACIÓN GLOBAL
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     ELEMENTOS
  ======================================== */

  const header = document.getElementById("site-header");

  const toggle = document.getElementById("menu-toggle");

  // Compatible con las páginas antiguas y nuevas
  const nav =
    document.getElementById("site-nav") ||
    document.getElementById("main-nav");

  /* ========================================
     CABECERA AL HACER SCROLL
  ======================================== */

  if (header) {

    const updateHeader = () => {
      header.classList.toggle(
        "scrolled",
        window.scrollY > 30
      );
    };

    updateHeader();

    window.addEventListener(
      "scroll",
      updateHeader,
      { passive: true }
    );
  }

  /* ========================================
     MENÚ MÓVIL
  ======================================== */

  if (toggle && nav) {

    // Mantener la referencia accesible correcta
    if (nav.id) {
      toggle.setAttribute("aria-controls", nav.id);
    }

    const closeMenu = () => {

      nav.classList.remove("open");

      toggle.classList.remove("open");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

      toggle.setAttribute(
        "aria-label",
        "Abrir menú"
      );
    };

    const openMenu = () => {

      nav.classList.add("open");

      toggle.classList.add("open");

      toggle.setAttribute(
        "aria-expanded",
        "true"
      );

      toggle.setAttribute(
        "aria-label",
        "Cerrar menú"
      );
    };

    // Estado inicial
    closeMenu();

    // Abrir y cerrar con el botón
    toggle.addEventListener("click", () => {

      const isOpen = nav.classList.contains("open");

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }

    });

    // Cerrar al seleccionar un enlace
    nav.querySelectorAll("a").forEach(link => {

      link.addEventListener("click", () => {
        closeMenu();
      });

    });

    // Cerrar con Escape
    document.addEventListener("keydown", event => {

      if (event.key === "Escape") {

        const wasOpen = nav.classList.contains("open");

        closeMenu();

        if (wasOpen) {
          toggle.focus();
        }
      }

    });

    // Cerrar al pulsar fuera
    document.addEventListener("click", event => {

      const clickedInsideNav = nav.contains(event.target);

      const clickedToggle = toggle.contains(event.target);

      if (!clickedInsideNav && !clickedToggle) {
        closeMenu();
      }

    });

    // Cerrar al volver a la vista de escritorio
    const desktopMedia = window.matchMedia(
      "(min-width: 901px)"
    );

    const handleDesktop = event => {

      if (event.matches) {
        closeMenu();
      }

    };

    desktopMedia.addEventListener(
      "change",
      handleDesktop
    );

  }

  /* ========================================
     ANIMACIONES AL HACER SCROLL
  ======================================== */

  const elements = document.querySelectorAll(".reveal");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    "IntersectionObserver" in window &&
    !reducedMotion
  ) {

    const observer = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    elements.forEach(element => {
      observer.observe(element);
    });

  } else {

    elements.forEach(element => {
      element.classList.add("visible");
    });

  }

  /* ========================================
     AÑO AUTOMÁTICO DEL FOOTER
  ======================================== */

  const year = document.getElementById("current-year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

});