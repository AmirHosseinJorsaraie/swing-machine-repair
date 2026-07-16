"use strict";

document.documentElement.classList.add("js");

function setupRevealAnimations() {
  const elements = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px" },
  );

  elements.forEach((element) => observer.observe(element));
}

function setupScrollProgress() {
  const progress = document.querySelector("[data-scroll-progress]");
  if (!progress) return;

  let scheduled = false;

  const update = () => {
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollRange > 0
      ? Math.min(1, Math.max(0, window.scrollY / scrollRange))
      : 0;

    progress.style.transform = `scaleX(${ratio})`;
    scheduled = false;
  };

  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

function setupMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "بستن منو" : "بازکردن منو");
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setOpen(false);
    toggle.focus();
  });
}

function setupDiagnosis() {
  const buttons = document.querySelectorAll("[data-diagnosis-button]");
  const panels = document.querySelectorAll("[data-diagnosis-panel]");
  if (!buttons.length || !panels.length) return;

  const selectPanel = (panelId) => {
    buttons.forEach((button) => {
      const active = button.dataset.diagnosisButton === panelId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === panelId);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPanel(button.dataset.diagnosisButton);
    });
  });
}

function setupCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-carousel-track]");
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
  const previous = carousel.querySelector("[data-carousel-previous]");
  const next = carousel.querySelector("[data-carousel-next]");
  const pause = carousel.querySelector("[data-carousel-pause]");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!track || !slides.length || !previous || !next || !pause) return;

  let activeSlide = 0;
  let manualPaused = false;
  let interactionPaused = false;
  let pageHidden = document.hidden;
  let reduceMotion = motionPreference.matches;
  let pointerStart = null;
  let autoplayTimer = null;

  const normalizeIndex = (index) =>
    (index + slides.length) % slides.length;

  const renderSlide = () => {
    track.style.transform = `translateX(-${activeSlide * 100}%)`;
    slides.forEach((slide, index) => {
      slide.setAttribute("aria-hidden", String(index !== activeSlide));
    });
    dots.forEach((dot, index) => {
      const active = index === activeSlide;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const setSlide = (index) => {
    activeSlide = normalizeIndex(index);
    renderSlide();
  };

  const syncAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;

    if (manualPaused || interactionPaused || pageHidden || reduceMotion) return;

    autoplayTimer = window.setInterval(() => {
      setSlide(activeSlide + 1);
    }, 7000);
  };

  previous.addEventListener("click", () => setSlide(activeSlide - 1));
  next.addEventListener("click", () => setSlide(activeSlide + 1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      setSlide(Number(dot.dataset.carouselDot));
    });
  });

  pause.addEventListener("click", () => {
    manualPaused = !manualPaused;
    pause.textContent = manualPaused ? "ادامه پخش" : "توقف پخش";
    pause.setAttribute(
      "aria-label",
      manualPaused ? "ادامه پخش خودکار" : "توقف پخش خودکار",
    );
    syncAutoplay();
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSlide(activeSlide - 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSlide(activeSlide + 1);
    }
  });

  carousel.addEventListener("mouseenter", () => {
    interactionPaused = true;
    syncAutoplay();
  });
  carousel.addEventListener("mouseleave", () => {
    interactionPaused = false;
    syncAutoplay();
  });
  carousel.addEventListener("focusin", () => {
    interactionPaused = true;
    syncAutoplay();
  });
  carousel.addEventListener("focusout", (event) => {
    if (carousel.contains(event.relatedTarget)) return;
    interactionPaused = false;
    syncAutoplay();
  });

  carousel.addEventListener("pointerdown", (event) => {
    pointerStart = event.clientX;
    interactionPaused = true;
    syncAutoplay();
  });
  carousel.addEventListener("pointerup", (event) => {
    if (pointerStart !== null) {
      const distance = event.clientX - pointerStart;
      if (Math.abs(distance) > 48) {
        setSlide(activeSlide + (distance > 0 ? -1 : 1));
      }
    }
    pointerStart = null;
    interactionPaused = false;
    syncAutoplay();
  });
  carousel.addEventListener("pointercancel", () => {
    pointerStart = null;
    interactionPaused = false;
    syncAutoplay();
  });

  document.addEventListener("visibilitychange", () => {
    pageHidden = document.hidden;
    syncAutoplay();
  });

  const updateMotionPreference = () => {
    reduceMotion = motionPreference.matches;
    syncAutoplay();
  };
  motionPreference.addEventListener?.("change", updateMotionPreference);

  renderSlide();
  syncAutoplay();
}

function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Intl.NumberFormat("fa-IR", {
      useGrouping: false,
    }).format(new Date().getFullYear());
  });
}

setupRevealAnimations();
setupScrollProgress();
setupMobileMenu();
setupDiagnosis();
setupCarousel();
setCurrentYear();
