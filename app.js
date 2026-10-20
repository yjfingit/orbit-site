(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---------- Year ---------- */
  $all("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Header state and active section ---------- */
  var header = $("[data-header]");
  var navLinks = $all("[data-nav]");
  var navTargets = navLinks
    .map(function (link) {
      return { link: link, section: document.getElementById(link.getAttribute("data-nav")) };
    })
    .filter(function (item) {
      return item.section;
    });

  var scrollQueued = false;

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);

      var current = null;
      navTargets.forEach(function (item) {
        if (item.section.getBoundingClientRect().top <= 150) current = item;
      });

      navLinks.forEach(function (link) {
        var active = !!current && current.link === link;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var navToggle = $("[data-nav-toggle]");
  var mobileMenu = $("[data-mobile-menu]");
  var navScrim = $("[data-nav-scrim]");

  function setMobileMenu(open) {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mobileMenu.hidden = !open;
    if (navScrim) navScrim.hidden = !open;
    document.body.classList.toggle("nav-open", open);
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      setMobileMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    $all("a, button", mobileMenu).forEach(function (item) {
      item.addEventListener("click", function () {
        setMobileMenu(false);
      });
    });

    if (navScrim) {
      navScrim.addEventListener("click", function () {
        setMobileMenu(false);
        navToggle.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setMobileMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) setMobileMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = $all("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- Preview spotlight ---------- */
  var preview = $("[data-preview]");

  if (preview && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    var spotQueued = false;
    preview.addEventListener("pointermove", function (event) {
      if (spotQueued) return;
      spotQueued = true;
      window.requestAnimationFrame(function () {
        spotQueued = false;
        var rect = preview.getBoundingClientRect();
        preview.style.setProperty("--spot-x", ((event.clientX - rect.left) / rect.width) * 100 + "%");
        preview.style.setProperty("--spot-y", ((event.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* ---------- Interactive preview progress ---------- */
  var taskInputs = $all(".task__input");
  var progressStatus = $("[data-progress-status]");

  function updateProgress(announce) {
    var total = taskInputs.length;
    if (!total) return;

    var done = 0;
    var blocked = 0;

    taskInputs.forEach(function (input) {
      var task = input.closest(".task");
      task.classList.toggle("is-done", input.checked);
      if (input.checked) done += 1;
      if (!input.checked && input.getAttribute("data-blocked") === "true") blocked += 1;
    });

    var percent = Math.round((done / total) * 100);
    var active = total - done - blocked;

    $all("[data-done-count]").forEach(function (el) {
      el.textContent = String(done);
    });
    $all("[data-total-count]").forEach(function (el) {
      el.textContent = String(total);
    });
    $all("[data-active-count]").forEach(function (el) {
      el.textContent = String(active);
    });
    $all("[data-blocked-count]").forEach(function (el) {
      el.textContent = String(blocked);
    });
    $all("[data-progress-value]").forEach(function (el) {
      el.textContent = percent + "%";
    });
    $all("[data-progress-bar]").forEach(function (el) {
      el.style.width = percent + "%";
    });
    $all("[data-progress-ring]").forEach(function (el) {
      el.style.strokeDashoffset = String(100 - percent);
    });

    if (announce && progressStatus) {
      progressStatus.textContent =
        "项目进度已更新为 " + percent + "%，已完成 " + done + " 项，共 " + total + " 项，阻塞 " + blocked + " 项。";
    }
  }

  taskInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      updateProgress(true);
    });
  });
  updateProgress(false);

  /* ---------- Billing toggle ---------- */
  var billingRoot = $("[data-billing-root]");
  var billingButtons = $all("[data-billing-btn]");
  var billingNote = $("[data-billing-note]");

  function setBilling(mode) {
    if (!billingRoot) return;
    billingRoot.setAttribute("data-billing", mode);

    billingButtons.forEach(function (button) {
      var active = button.getAttribute("data-billing-btn") === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    $all("[data-price]").forEach(function (el) {
      var next = el.getAttribute("data-" + mode);
      if (next === null || el.textContent === next) return;
      el.textContent = next;
      el.classList.remove("is-changed");
      void el.offsetWidth;
      el.classList.add("is-changed");
    });

    $all("[data-suffix]").forEach(function (el) {
      var next = el.getAttribute("data-" + mode);
      if (next !== null) el.textContent = next;
    });

    $all("[data-price-note]").forEach(function (el) {
      var next = el.getAttribute("data-" + mode);
      if (next !== null) el.textContent = next;
    });

    if (billingNote) {
      billingNote.textContent =
        mode === "annual" ? "按年付费可节省 20%，费用一次性结算。" : "按月付费，随时可以取消。";
    }
  }

  billingButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setBilling(button.getAttribute("data-billing-btn"));
    });
  });

  /* ---------- FAQ accordion ---------- */
  var faqTriggers = $all(".faq-trigger");

  faqTriggers.forEach(function (trigger) {
    var item = trigger.closest(".faq-item");
    var panel = document.getElementById(trigger.getAttribute("aria-controls"));

    trigger.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");

      $all(".faq-item.is-open").forEach(function (other) {
        if (other === item) return;
        other.classList.remove("is-open");
        var otherTrigger = $(".faq-trigger", other);
        var otherPanel = document.getElementById(otherTrigger.getAttribute("aria-controls"));
        otherTrigger.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.setAttribute("aria-hidden", "true");
      });

      item.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
      if (panel) panel.setAttribute("aria-hidden", String(!willOpen));
    });
  });

  /* ---------- Demo dialog ---------- */
  var dialog = $("#demo-dialog");
  var formView = $("[data-demo-form-view]");
  var successView = $("[data-demo-success]");
  var demoForm = $("#demo-form");
  var submitButton = $("[data-demo-submit]");
  var submitLabel = submitButton ? $(".btn__label", submitButton) : null;
  var planLabel = $("[data-demo-plan]");
  var noteInput = $("#demo-note");
  var noteCount = $("[data-note-count]");
  var currentPlan = "";
  var lastTrigger = null;

  var fields = {
    name: {
      el: $("#demo-name"),
      message: "请填写至少 2 个字的姓名。",
      valid: function (value) {
        return value.trim().length >= 2;
      }
    },
    company: {
      el: $("#demo-company"),
      message: "请填写公司或团队名称。",
      valid: function (value) {
        return value.trim().length >= 2;
      }
    },
    email: {
      el: $("#demo-email"),
      message: "请输入有效的工作邮箱，例如 name@company.com。",
      valid: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
      }
    },
    size: {
      el: $("#demo-size"),
      message: "请选择团队规模。",
      valid: function (value) {
        return value.trim() !== "";
      }
    }
  };

  function fieldError(key) {
    return $('[data-error-for="' + key + '"]');
  }

  function validateField(key) {
    var field = fields[key];
    if (!field || !field.el) return true;

    var wrapper = field.el.closest(".field");
    var error = fieldError(key);
    var ok = field.valid(field.el.value);

    wrapper.classList.toggle("has-error", !ok);
    field.el.setAttribute("aria-invalid", String(!ok));
    if (error) error.textContent = ok ? "" : field.message;

    return ok;
  }

  function clearErrors() {
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.el) return;
      field.el.closest(".field").classList.remove("has-error");
      field.el.removeAttribute("aria-invalid");
      var error = fieldError(key);
      if (error) error.textContent = "";
    });
  }

  function showFormView() {
    formView.hidden = false;
    successView.hidden = true;
  }

  function showSuccessView() {
    formView.hidden = true;
    successView.hidden = false;
    var panel = $(".demo__panel", dialog);
    if (panel) panel.scrollTop = 0;
    successView.focus();
  }

  function openDemo(plan, trigger) {
    if (!dialog) return;
    lastTrigger = trigger || document.activeElement;
    currentPlan = plan || "";

    if (planLabel) {
      planLabel.hidden = !currentPlan;
      planLabel.textContent = currentPlan ? "你正在咨询：" + currentPlan : "";
    }

    showFormView();

    if (dialog.open) {
      $("input, select, textarea", dialog).focus();
      return;
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    window.setTimeout(function () {
      var nameInput = $("#demo-name");
      if (nameInput) nameInput.focus();
    }, 60);
  }

  if (dialog) {
    $all("[data-demo-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        openDemo(button.getAttribute("data-plan") || "", button);
      });
    });

    $all("[data-demo-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        dialog.close();
      });
    });

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      dialog.close();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", function () {
      var target = lastTrigger;
      if (!target || target.offsetParent === null) {
        target = navToggle && navToggle.offsetParent !== null ? navToggle : $all("[data-demo-open]")[0];
      }
      if (target && typeof target.focus === "function") target.focus();
    });

    var resetButton = $("[data-demo-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        demoForm.reset();
        clearErrors();
        if (noteCount) noteCount.textContent = "0";
        showFormView();
        $("#demo-name").focus();
      });
    }

    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.el) return;

      field.el.addEventListener("blur", function () {
        if (field.el.value.trim() !== "" || field.el.closest(".field").classList.contains("has-error")) {
          validateField(key);
        }
      });

      field.el.addEventListener("input", function () {
        if (field.el.closest(".field").classList.contains("has-error")) validateField(key);
      });

      field.el.addEventListener("change", function () {
        if (key === "size") validateField(key);
      });
    });

    if (noteInput && noteCount) {
      noteInput.addEventListener("input", function () {
        noteCount.textContent = String(noteInput.value.length);
      });
    }

    demoForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      Object.keys(fields).forEach(function (key) {
        var ok = validateField(key);
        if (!ok && !firstInvalid) firstInvalid = fields[key].el;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var name = $("#demo-name").value.trim();
      var company = $("#demo-company").value.trim();
      var email = $("#demo-email").value.trim();
      var size = $("#demo-size").value;
      var note = noteInput ? noteInput.value.trim() : "";
      var ref = "ORBIT-" + Date.now().toString(36).toUpperCase().slice(-6);

      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
      submitButton.setAttribute("aria-busy", "true");
      if (submitLabel) submitLabel.textContent = "正在提交…";

      window.setTimeout(function () {
        var values = {
          name: name,
          company: company,
          email: email,
          size: size,
          note: note || "未填写",
          plan: currentPlan || "综合了解",
          ref: ref
        };

        Object.keys(values).forEach(function (key) {
          var target = $('[data-summary="' + key + '"]');
          if (target) target.textContent = values[key];
        });

        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
        submitButton.removeAttribute("aria-busy");
        if (submitLabel) submitLabel.textContent = "确认预约";

        showSuccessView();
      }, 900);
    });
  }
})();
