/* ============================================================
   ЭвакуаторПро — интерактив лендинга
   ============================================================ */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Шапка: фон при прокрутке ---------- */

  const header = $("#siteHeader");

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */

  const burger = $("#burgerBtn");
  const mobileMenu = $("#mobileMenu");

  const closeMenu = () => {
    burger.classList.remove("open");
    mobileMenu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-locked");
  };

  burger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    burger.classList.toggle("open", isOpen);
    burger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-locked", isOpen);
  });

  $$("a", mobileMenu).forEach((link) =>
    link.addEventListener("click", closeMenu)
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Появление блоков при прокрутке ---------- */

  const revealEls = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Счётчики в блоке «О компании» ---------- */

  const counters = $$("[data-count]");
  const fmt = new Intl.NumberFormat("ru-RU");

  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = fmt.format(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(
      (el) =>
        (el.textContent = fmt.format(parseInt(el.dataset.count, 10)) + (el.dataset.suffix || ""))
    );
  }

  /* ---------- Подсветка активного пункта меню ---------- */

  const navLinks = $$(".site-nav a");
  const sectionsById = navLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sectionsById.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle(
              "active",
              a.getAttribute("href") === `#${entry.target.id}`
            )
          );
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sectionsById.forEach((s) => spy.observe(s));
  }

  /* ---------- FAQ: аккордеон ---------- */

  const faqItems = $$(".faq-item");

  faqItems.forEach((item) => {
    const btn = $(".faq-q", item);
    const answer = $(".faq-a", item);

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      faqItems.forEach((other) => {
        other.classList.remove("open");
        $(".faq-q", other).setAttribute("aria-expanded", "false");
        $(".faq-a", other).style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ---------- Маска телефона ---------- */

  const phoneInput = $("#fPhone");

  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (digits && !digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);
    if (!digits) return "";

    const rest = digits.slice(1);
    let out = "+7";
    if (rest.length > 0) out += " (" + rest.slice(0, 3);
    if (rest.length >= 3) out += ")";
    if (rest.length > 3) out += " " + rest.slice(3, 6);
    if (rest.length > 6) out += "-" + rest.slice(6, 8);
    if (rest.length > 8) out += "-" + rest.slice(8, 10);
    return out;
  };

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhone(phoneInput.value);
      phoneInput.closest(".field").classList.remove("invalid");
    });
  }

  /* ---------- Форма заявки ---------- */

  const form = $("#orderForm");
  const successBlock = $("#orderSuccess");

  const validators = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => v.replace(/\D/g, "").length === 11,
    from: (v) => v.trim().length >= 4,
    to: (v) => v.trim().length >= 4,
  };

  const validateField = (input) => {
    const name = input.name;
    const check = validators[name];
    const ok = check ? check(input.value) : true;
    input.closest(".field").classList.toggle("invalid", !ok);
    return ok;
  };

  if (form) {
    $$(".field input, .field textarea", form).forEach((input) => {
      input.addEventListener("input", () =>
        input.closest(".field").classList.remove("invalid")
      );
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const requiredInputs = $$("input[required]", form);
      const allValid = requiredInputs.map(validateField).every(Boolean);

      if (!allValid) {
        $(".field.invalid input", form)?.focus();
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      // Здесь подключается бэкенд / CRM: fetch("/api/lead", {...})
      console.log("Заявка:", payload);

      form.hidden = true;
      successBlock.hidden = false;
      successBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  const resetBtn = $("#orderReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      form.hidden = false;
      successBlock.hidden = true;
      $("#fName").focus();
    });
  }

  /* ---------- Год в подвале ---------- */

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
