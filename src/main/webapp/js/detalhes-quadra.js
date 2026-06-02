(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 22;

  const state = {
    court: null,
    courtId: new URLSearchParams(window.location.search).get("id") || new URLSearchParams(window.location.search).get("quadraId"),
    selectedDate: ""
  };

  const elements = {
    authAction: document.querySelector("#detail-auth-action"),
    error: document.querySelector("#court-detail-error"),
    visual: document.querySelector("#court-visual"),
    typeMark: document.querySelector("#court-type-mark"),
    name: document.querySelector("#court-name"),
    status: document.querySelector("#court-status"),
    type: document.querySelector("#court-type"),
    price: document.querySelector("#court-price"),
    description: document.querySelector("#court-description"),
    scheduleLink: document.querySelector("#schedule-court-link"),
    date: document.querySelector("#availability-date"),
    slots: document.querySelector("#time-slots-grid")
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

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
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

  function iconText(type) {
    const values = {
      FUTSAL: "FS",
      SOCIETY: "SC",
      BASQUETE: "BQ",
      VOLEI: "VL",
      TENIS: "TN"
    };

    return values[type] || "QD";
  }

  function badgeClass(status) {
    return `badge badge--${String(status || "muted").toLowerCase()}`;
  }

  function showError(text) {
    if (!elements.error) {
      return;
    }

    elements.error.hidden = false;
    elements.error.textContent = text;
  }

  function hideError() {
    if (elements.error) {
      elements.error.hidden = true;
      elements.error.textContent = "";
    }
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
      const start = `${String(hour).padStart(2, "0")}:00`;
      const end = `${String(hour + 1).padStart(2, "0")}:00`;
      slots.push({ start, end });
    }

    return slots;
  }

  function availableKey(slot) {
    return `${formatTime(slot.horaInicio)}-${formatTime(slot.horaFim)}`;
  }

  function makeScheduleHref(start, end) {
    const params = new URLSearchParams({
      quadraId: state.courtId,
      data: state.selectedDate,
      horaInicio: start,
      horaFim: end
    });

    return `agendar.html?${params.toString()}`;
  }

  function setScheduleButtonState() {
    const available = state.courtId && state.court?.status === "DISPONIVEL";
    const params = new URLSearchParams({ quadraId: state.courtId || "" });

    if (state.selectedDate) {
      params.set("data", state.selectedDate);
    }

    elements.scheduleLink.href = available ? `agendar.html?${params.toString()}` : "#";
    elements.scheduleLink.classList.toggle("is-disabled", !available);
    elements.scheduleLink.setAttribute("aria-disabled", String(!available));
  }

  function renderCourt(court) {
    state.court = court;
    document.title = `${court.nome || "Quadra"} | QuadraF\u00e1cil`;

    elements.name.textContent = court.nome || "Quadra";
    elements.status.className = badgeClass(court.status);
    elements.status.textContent = label(court.status);
    elements.type.textContent = label(court.tipo);
    elements.price.textContent = formatCurrency(court.precoHora);
    elements.description.textContent = court.descricao || "Quadra esportiva cadastrada para agendamentos.";
    elements.typeMark.textContent = iconText(court.tipo);
    elements.visual.className = `court-detail-visual court-detail-visual--${String(court.tipo || "").toLowerCase()}`;

    setScheduleButtonState();
  }

  function renderSlots(availableSlots) {
    const availableSet = new Set((availableSlots || []).map(availableKey));
    elements.slots.innerHTML = "";

    generateSlots().forEach((slot) => {
      const key = `${slot.start}-${slot.end}`;
      const isAvailable = state.court?.status === "DISPONIVEL" && availableSet.has(key);
      const chip = document.createElement(isAvailable ? "a" : "span");

      chip.className = isAvailable ? "time-slot time-slot--available" : "time-slot time-slot--busy";
      chip.textContent = `${slot.start} - ${slot.end}`;

      if (isAvailable) {
        chip.href = makeScheduleHref(slot.start, slot.end);
        chip.dataset.requiresLogin = "true";
      }

      elements.slots.appendChild(chip);
    });
  }

  async function loadAvailability() {
    if (!state.courtId || !state.selectedDate) {
      return;
    }

    if (state.selectedDate < todayString()) {
      showError("N\u00e3o \u00e9 permitido consultar datas passadas.");
      renderSlots([]);
      return;
    }

    if (state.court?.status !== "DISPONIVEL") {
      renderSlots([]);
      return;
    }

    try {
      hideError();
      elements.slots.innerHTML = '<span class="time-slot time-slot--busy">Carregando hor&aacute;rios...</span>';
      const response = await window.QuadraFacilApi.request(`/agendamentos/disponiveis?quadraId=${encodeURIComponent(state.courtId)}&data=${encodeURIComponent(state.selectedDate)}`);
      renderSlots(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      renderSlots([]);
      showError("N\u00e3o foi poss\u00edvel consultar os hor\u00e1rios desta quadra para a data selecionada.");
    }
  }

  async function loadCourt() {
    if (!state.courtId) {
      showError("Quadra n\u00e3o informada. Volte para a listagem e selecione uma quadra.");
      setScheduleButtonState();
      renderSlots([]);
      return;
    }

    try {
      hideError();
      const response = await window.QuadraFacilApi.request(`/quadras/${encodeURIComponent(state.courtId)}`);
      renderCourt(response?.data || {});
      await loadAvailability();
    } catch (error) {
      state.court = null;
      setScheduleButtonState();
      renderSlots([]);
      showError("N\u00e3o foi poss\u00edvel carregar os detalhes da quadra. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  function requireLoginForTarget(event, target) {
    if (!target || target.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }

    if (!getLoggedUser()?.id) {
      event.preventDefault();
      sessionStorage.setItem(REDIRECT_KEY, target.getAttribute("href"));
      window.location.href = "login.html";
    }
  }

  elements.scheduleLink?.addEventListener("click", (event) => {
    requireLoginForTarget(event, elements.scheduleLink);
  });

  elements.slots?.addEventListener("click", (event) => {
    const target = event.target.closest("[data-requires-login='true']");

    if (target) {
      requireLoginForTarget(event, target);
    }
  });

  elements.date?.addEventListener("change", () => {
    state.selectedDate = elements.date.value;
    setScheduleButtonState();
    loadAvailability();
  });

  elements.authAction?.addEventListener("click", () => {
    if (elements.authAction.dataset.mode === "logout") {
      localStorage.removeItem(AUTH_USER_KEY);
      updateAuthAction();
      return;
    }

    window.location.href = "login.html";
  });

  state.selectedDate = todayString();
  elements.date.min = todayString();
  elements.date.value = state.selectedDate;

  updateAuthAction();
  loadCourt();
})();
