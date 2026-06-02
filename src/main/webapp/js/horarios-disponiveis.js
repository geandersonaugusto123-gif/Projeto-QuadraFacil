(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 22;

  const params = new URLSearchParams(window.location.search);
  const state = {
    courts: [],
    availableSlots: [],
    selectedSlot: null,
    initial: {
      quadraId: params.get("quadraId") || params.get("id") || "",
      data: params.get("data") || ""
    }
  };

  const elements = {
    form: document.querySelector("#availability-query-form"),
    court: document.querySelector("#availability-court"),
    date: document.querySelector("#availability-query-date"),
    submit: document.querySelector("#consult-availability-button"),
    success: document.querySelector("#availability-success"),
    error: document.querySelector("#availability-error"),
    count: document.querySelector("#availability-results-count"),
    slots: document.querySelector("#availability-slots-grid"),
    schedule: document.querySelector("#schedule-selected-slot"),
    authAction: document.querySelector("#availability-auth-action")
  };

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function todayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatTime(value) {
    return String(value || "").slice(0, 5);
  }

  function label(value) {
    const labels = {
      FUTSAL: "Futsal",
      SOCIETY: "Society",
      BASQUETE: "Basquete",
      VOLEI: "V\u00f4lei",
      TENIS: "T\u00eanis",
      DISPONIVEL: "DISPON\u00cdVEL",
      INDISPONIVEL: "INDISPON\u00cdVEL",
      MANUTENCAO: "MANUTEN\u00c7\u00c3O"
    };

    return labels[value] || value || "N/A";
  }

  function setFieldError(fieldId, message) {
    const field = document.querySelector(`#${fieldId}`);
    const error = document.querySelector(`#${fieldId}-error`);

    if (error) {
      error.textContent = message || "";
    }

    if (field) {
      field.classList.toggle("has-error", Boolean(message));
    }
  }

  function clearFieldErrors() {
    setFieldError("availability-court", "");
    setFieldError("availability-query-date", "");
  }

  function showMessage(type, text) {
    const target = type === "success" ? elements.success : elements.error;
    const other = type === "success" ? elements.error : elements.success;

    if (other) {
      other.hidden = true;
      other.textContent = "";
    }

    if (target) {
      target.hidden = false;
      target.textContent = text;
    }
  }

  function hideMessages() {
    [elements.success, elements.error].forEach((element) => {
      if (element) {
        element.hidden = true;
        element.textContent = "";
      }
    });
  }

  function updateAuthAction() {
    const user = getLoggedUser();

    if (!elements.authAction) {
      return;
    }

    if (user?.id) {
      elements.authAction.textContent = "Sair";
      elements.authAction.dataset.mode = "logout";
    } else {
      elements.authAction.textContent = "Entrar";
      elements.authAction.dataset.mode = "login";
    }
  }

  function generateSlots() {
    const slots = [];

    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour += 1) {
      slots.push({
        horaInicio: `${String(hour).padStart(2, "0")}:00`,
        horaFim: `${String(hour + 1).padStart(2, "0")}:00`
      });
    }

    return slots;
  }

  function slotKey(slot) {
    return `${formatTime(slot.horaInicio)}-${formatTime(slot.horaFim)}`;
  }

  function setScheduleState() {
    if (!state.selectedSlot) {
      elements.schedule.href = "agendar.html";
      elements.schedule.classList.add("is-disabled");
      elements.schedule.setAttribute("aria-disabled", "true");
      return;
    }

    const params = new URLSearchParams({
      quadraId: elements.court.value,
      data: elements.date.value,
      horaInicio: state.selectedSlot.horaInicio,
      horaFim: state.selectedSlot.horaFim
    });

    elements.schedule.href = `agendar.html?${params.toString()}`;
    elements.schedule.classList.remove("is-disabled");
    elements.schedule.setAttribute("aria-disabled", "false");
  }

  function renderInitialMessage(message) {
    state.availableSlots = [];
    state.selectedSlot = null;
    elements.count.textContent = message;
    elements.slots.innerHTML = "";
    const empty = document.createElement("span");
    empty.className = "time-slot time-slot--busy";
    empty.textContent = message;
    elements.slots.appendChild(empty);
    setScheduleState();
  }

  function renderSlots(availableSlots) {
    state.availableSlots = Array.isArray(availableSlots) ? availableSlots : [];
    const availableSet = new Set(state.availableSlots.map(slotKey));
    const allSlots = generateSlots();
    elements.slots.innerHTML = "";

    allSlots.forEach((slot) => {
      const key = slotKey(slot);
      const isAvailable = availableSet.has(key);
      const chip = document.createElement(isAvailable ? "button" : "span");

      chip.className = isAvailable ? "time-slot time-slot--available" : "time-slot time-slot--busy";
      chip.textContent = `${slot.horaInicio} - ${slot.horaFim}`;

      if (isAvailable) {
        chip.type = "button";
        chip.dataset.start = slot.horaInicio;
        chip.dataset.end = slot.horaFim;

        if (state.selectedSlot && slotKey(state.selectedSlot) === key) {
          chip.classList.add("time-slot--selected");
          chip.setAttribute("aria-pressed", "true");
        } else {
          chip.setAttribute("aria-pressed", "false");
        }
      }

      elements.slots.appendChild(chip);
    });

    if (availableSet.size === 0) {
      elements.count.textContent = "Nenhum hor\u00e1rio dispon\u00edvel para esta data.";
      return;
    }

    elements.count.textContent = availableSet.size === 1
      ? "1 hor\u00e1rio dispon\u00edvel"
      : `${availableSet.size} hor\u00e1rios dispon\u00edveis`;
  }

  function fillCourtSelect() {
    elements.court.innerHTML = '<option value="">Selecione uma quadra</option>';

    state.courts.forEach((court) => {
      const option = document.createElement("option");
      option.value = court.id;
      option.textContent = `${court.nome || `Quadra #${court.id}`} - ${label(court.tipo)} - ${label(court.status)}`;
      option.disabled = court.status !== "DISPONIVEL";
      elements.court.appendChild(option);
    });

    if (state.initial.quadraId) {
      elements.court.value = state.initial.quadraId;
    }
  }

  function validateQuery() {
    let valid = true;
    clearFieldErrors();
    hideMessages();

    if (!elements.court.value) {
      setFieldError("availability-court", "Selecione uma quadra.");
      valid = false;
    }

    if (!elements.date.value) {
      setFieldError("availability-query-date", "Selecione uma data.");
      valid = false;
    } else if (elements.date.value < todayString()) {
      setFieldError("availability-query-date", "N\u00e3o \u00e9 permitido consultar datas passadas.");
      showMessage("error", "N\u00e3o \u00e9 permitido consultar datas passadas.");
      valid = false;
    }

    if (!valid && !elements.error.textContent) {
      showMessage("error", "Selecione uma quadra e uma data.");
    }

    return valid;
  }

  function setLoading(isLoading) {
    elements.submit.disabled = isLoading;
    elements.submit.textContent = isLoading ? "Consultando..." : "Consultar hor\u00e1rios";
  }

  async function consultAvailability() {
    if (!validateQuery()) {
      renderInitialMessage("Selecione uma quadra e uma data.");
      return;
    }

    state.selectedSlot = null;
    setScheduleState();
    setLoading(true);

    try {
      elements.count.textContent = "Consultando hor\u00e1rios...";
      elements.slots.innerHTML = '<span class="time-slot time-slot--busy">Consultando hor&aacute;rios...</span>';

      const response = await window.QuadraFacilApi.request(`/agendamentos/disponiveis?quadraId=${encodeURIComponent(elements.court.value)}&data=${encodeURIComponent(elements.date.value)}`);
      renderSlots(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      state.selectedSlot = null;
      renderSlots([]);

      const message = String(error.body?.message || error.message || "").toLowerCase();
      if (message.includes("data") || message.includes("passada")) {
        showMessage("error", "N\u00e3o \u00e9 permitido consultar datas passadas.");
      } else {
        showMessage("error", "Nenhum hor\u00e1rio dispon\u00edvel para esta data.");
      }
    } finally {
      setLoading(false);
      setScheduleState();
    }
  }

  async function loadCourts() {
    try {
      hideMessages();
      const response = await window.QuadraFacilApi.request("/quadras");
      state.courts = Array.isArray(response?.data) ? response.data : [];
      fillCourtSelect();

      if (state.initial.data) {
        elements.date.value = state.initial.data;
      }

      if (elements.court.value && elements.date.value) {
        await consultAvailability();
      }
    } catch (error) {
      state.courts = [];
      elements.court.innerHTML = '<option value="">Erro ao carregar quadras</option>';
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar as quadras. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    consultAvailability();
  });

  elements.court?.addEventListener("change", () => {
    state.selectedSlot = null;
    renderInitialMessage("Selecione uma quadra e uma data.");
  });

  elements.date?.addEventListener("change", () => {
    state.selectedSlot = null;
    renderInitialMessage("Selecione uma quadra e uma data.");
  });

  elements.slots?.addEventListener("click", (event) => {
    const chip = event.target.closest("button.time-slot--available");

    if (!chip) {
      return;
    }

    state.selectedSlot = {
      horaInicio: chip.dataset.start,
      horaFim: chip.dataset.end
    };

    renderSlots(state.availableSlots);
    setScheduleState();
  });

  elements.schedule?.addEventListener("click", (event) => {
    if (elements.schedule.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      showMessage("error", "Selecione um hor\u00e1rio dispon\u00edvel.");
      return;
    }

    if (!getLoggedUser()?.id) {
      event.preventDefault();
      sessionStorage.setItem(REDIRECT_KEY, elements.schedule.getAttribute("href"));
      window.location.href = "login.html";
    }
  });

  elements.authAction?.addEventListener("click", () => {
    if (elements.authAction.dataset.mode === "logout") {
      localStorage.removeItem(AUTH_USER_KEY);
      updateAuthAction();
      return;
    }

    window.location.href = "login.html";
  });

  elements.date.min = todayString();

  updateAuthAction();
  renderInitialMessage("Selecione uma quadra e uma data.");
  loadCourts();
})();
