(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const OPEN_TIME = "08:00";
  const CLOSE_TIME = "22:00";

  const params = new URLSearchParams(window.location.search);
  const state = {
    user: null,
    courts: [],
    selectedCourt: null,
    availableSlots: [],
    existingBooking: null,
    initial: {
      agendamentoId: params.get("agendamentoId") || params.get("editarId") || "",
      quadraId: params.get("quadraId") || "",
      data: params.get("data") || "",
      horaInicio: params.get("horaInicio") || "",
      horaFim: params.get("horaFim") || ""
    }
  };

  const elements = {
    form: document.querySelector("#booking-form"),
    authAction: document.querySelector("#booking-auth-action"),
    error: document.querySelector("#booking-error"),
    success: document.querySelector("#booking-success"),
    court: document.querySelector("#quadra"),
    date: document.querySelector("#data-agendamento"),
    start: document.querySelector("#hora-inicio"),
    end: document.querySelector("#hora-fim"),
    notes: document.querySelector("#observacoes"),
    selectedCourtCard: document.querySelector("#selected-court-card"),
    checkSlots: document.querySelector("#check-slots-button"),
    slots: document.querySelector("#booking-slots"),
    submit: document.querySelector(".booking-submit"),
    submitText: document.querySelector(".booking-submit .button-text"),
    backLink: document.querySelector("#booking-back-link"),
    summaryCourt: document.querySelector("#summary-court"),
    summaryDate: document.querySelector("#summary-date"),
    summaryTime: document.querySelector("#summary-time"),
    summaryDuration: document.querySelector("#summary-duration"),
    summaryPrice: document.querySelector("#summary-price")
  };

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function requireUser() {
    const user = getLoggedUser();

    if (!user?.id) {
      sessionStorage.setItem(REDIRECT_KEY, `agendar.html${window.location.search}`);
      window.location.href = "login.html";
      return null;
    }

    return user;
  }

  function todayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
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

  function badgeClass(status) {
    return `badge badge--${String(status || "muted").toLowerCase()}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setFieldError(fieldId, message) {
    const error = document.querySelector(`#${fieldId}-error`);
    const field = document.querySelector(`#${fieldId}`);

    if (error) {
      error.textContent = message || "";
    }

    if (field) {
      field.classList.toggle("has-error", Boolean(message));
    }
  }

  function clearFieldErrors() {
    ["quadra", "data-agendamento", "hora-inicio", "hora-fim"].forEach((id) => setFieldError(id, ""));
  }

  function showMessage(type, message) {
    const target = type === "success" ? elements.success : elements.error;
    const other = type === "success" ? elements.error : elements.success;

    if (other) {
      other.hidden = true;
      other.textContent = "";
    }

    if (target) {
      target.hidden = false;
      target.textContent = message;
    }
  }

  function hideMessages() {
    [elements.error, elements.success].forEach((element) => {
      if (element) {
        element.hidden = true;
        element.textContent = "";
      }
    });
  }

  function timeToMinutes(value) {
    const [hour, minute] = formatTime(value).split(":").map(Number);
    return hour * 60 + minute;
  }

  function durationHours() {
    const start = elements.start.value;
    const end = elements.end.value;

    if (!start || !end) {
      return 0;
    }

    return Math.max(0, (timeToMinutes(end) - timeToMinutes(start)) / 60);
  }

  function selectedMatchesExistingBooking() {
    if (!state.initial.agendamentoId) {
      return false;
    }

    return String(elements.court.value) === String(state.initial.quadraId)
      && elements.date.value === state.initial.data
      && formatTime(elements.start.value) === formatTime(state.initial.horaInicio)
      && formatTime(elements.end.value) === formatTime(state.initial.horaFim);
  }

  function isSelectedSlotAvailable() {
    if (selectedMatchesExistingBooking()) {
      return true;
    }

    const startMinutes = timeToMinutes(elements.start.value);
    const endMinutes = timeToMinutes(elements.end.value);
    const availableSet = new Set(state.availableSlots.map((slot) => `${formatTime(slot.horaInicio)}-${formatTime(slot.horaFim)}`));

    for (let current = startMinutes; current < endMinutes; current += 60) {
      const next = current + 60;
      const start = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
      const end = `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`;

      if (!availableSet.has(`${start}-${end}`)) {
        return false;
      }
    }

    return true;
  }

  function setLoading(isLoading) {
    if (elements.submit) {
      elements.submit.disabled = isLoading;
      elements.submit.classList.toggle("is-loading", isLoading);
    }

    if (elements.submitText) {
      const defaultText = state.initial.agendamentoId ? "Salvar altera\u00e7\u00f5es" : "Confirmar agendamento";
      elements.submitText.textContent = isLoading
        ? (state.initial.agendamentoId ? "Salvando..." : "Confirmando...")
        : defaultText;
    }
  }

  function updateAuthAction() {
    if (!elements.authAction) {
      return;
    }

    elements.authAction.textContent = "Sair";
    elements.authAction.dataset.mode = "logout";
  }

  function updateSelectedCourt() {
    const courtId = Number(elements.court.value);
    state.selectedCourt = state.courts.find((court) => Number(court.id) === courtId) || null;

    if (!state.selectedCourt) {
      elements.selectedCourtCard.innerHTML = `
        <strong>Nenhuma quadra selecionada.</strong>
        <p>Ao escolher uma quadra, o tipo, pre\u00e7o por hora e status aparecem aqui.</p>
      `;
      updateSummary();
      return;
    }

    const name = escapeHtml(state.selectedCourt.nome || "Quadra");
    const type = escapeHtml(label(state.selectedCourt.tipo));
    const price = escapeHtml(formatCurrency(state.selectedCourt.precoHora));
    const status = escapeHtml(label(state.selectedCourt.status));
    const className = escapeHtml(badgeClass(state.selectedCourt.status));

    elements.selectedCourtCard.innerHTML = `
      <div>
        <strong>${name}</strong>
        <p>${type} - ${price} por hora</p>
      </div>
      <span class="${className}">${status}</span>
    `;

    updateSummary();
  }

  function updateSummary() {
    const hours = durationHours();
    const estimatedPrice = state.selectedCourt ? hours * Number(state.selectedCourt.precoHora || 0) : 0;

    elements.summaryCourt.textContent = state.selectedCourt?.nome || "--";
    elements.summaryDate.textContent = formatDate(elements.date.value);
    elements.summaryTime.textContent = elements.start.value && elements.end.value
      ? `${formatTime(elements.start.value)} at\u00e9 ${formatTime(elements.end.value)}`
      : "--";
    elements.summaryDuration.textContent = hours > 0 ? `${hours.toLocaleString("pt-BR")} hora${hours === 1 ? "" : "s"}` : "--";
    elements.summaryPrice.textContent = hours > 0 ? formatCurrency(estimatedPrice) : "--";
  }

  function fillCourtSelect() {
    elements.court.innerHTML = '<option value="">Selecione uma quadra</option>';

    state.courts.forEach((court) => {
      const option = document.createElement("option");
      option.value = court.id;
      option.textContent = `${court.nome} - ${label(court.tipo)} - ${label(court.status)}`;
      option.disabled = court.status !== "DISPONIVEL";
      elements.court.appendChild(option);
    });

    if (state.initial.quadraId) {
      elements.court.value = state.initial.quadraId;
    }

    updateSelectedCourt();
  }

  function validateBaseFields() {
    let valid = true;
    clearFieldErrors();

    if (!elements.court.value) {
      setFieldError("quadra", "Selecione uma quadra.");
      valid = false;
    }

    if (!state.selectedCourt || state.selectedCourt.status !== "DISPONIVEL") {
      setFieldError("quadra", "Quadra indispon\u00edvel ou em manuten\u00e7\u00e3o.");
      valid = false;
    }

    if (!elements.date.value) {
      setFieldError("data-agendamento", "Selecione uma data.");
      valid = false;
    } else if (elements.date.value < todayString()) {
      setFieldError("data-agendamento", "N\u00e3o \u00e9 permitido selecionar datas passadas.");
      valid = false;
    }

    return valid;
  }

  function validateTimeFields() {
    let valid = validateBaseFields();

    if (!elements.start.value) {
      setFieldError("hora-inicio", "Informe a hora inicial.");
      valid = false;
    }

    if (!elements.end.value) {
      setFieldError("hora-fim", "Informe a hora final.");
      valid = false;
    }

    if (elements.start.value && elements.end.value && timeToMinutes(elements.end.value) <= timeToMinutes(elements.start.value)) {
      setFieldError("hora-fim", "Hora final deve ser maior que hora inicial.");
      valid = false;
    }

    if (elements.start.value && (elements.start.value < OPEN_TIME || elements.start.value >= CLOSE_TIME)) {
      setFieldError("hora-inicio", "Hor\u00e1rio deve estar entre 08:00 e 22:00.");
      valid = false;
    }

    if (elements.end.value && (elements.end.value <= OPEN_TIME || elements.end.value > CLOSE_TIME)) {
      setFieldError("hora-fim", "Hor\u00e1rio deve estar entre 08:00 e 22:00.");
      valid = false;
    }

    if (elements.start.value && elements.end.value && (timeToMinutes(elements.end.value) - timeToMinutes(elements.start.value)) % 60 !== 0) {
      setFieldError("hora-fim", "Use intervalos completos de 1 hora.");
      valid = false;
    }

    return valid;
  }

  function renderSlots(slots) {
    state.availableSlots = Array.isArray(slots) ? slots : [];
    elements.slots.innerHTML = "";

    if (state.availableSlots.length === 0) {
      const empty = document.createElement("span");
      empty.className = "time-slot time-slot--busy";
      empty.textContent = "Nenhum hor\u00e1rio livre para esta data.";
      elements.slots.appendChild(empty);
      return;
    }

    state.availableSlots.forEach((slot) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "time-slot time-slot--available";
      chip.textContent = `${formatTime(slot.horaInicio)} - ${formatTime(slot.horaFim)}`;
      chip.dataset.start = formatTime(slot.horaInicio);
      chip.dataset.end = formatTime(slot.horaFim);
      elements.slots.appendChild(chip);
    });
  }

  function renderSlotMessage(message) {
    state.availableSlots = [];
    elements.slots.innerHTML = "";
    const item = document.createElement("span");
    item.className = "time-slot time-slot--busy";
    item.textContent = message;
    elements.slots.appendChild(item);
  }

  async function loadCourts() {
    try {
      const response = await window.QuadraFacilApi.request("/quadras");
      state.courts = Array.isArray(response?.data) ? response.data : [];
      fillCourtSelect();
    } catch (error) {
      elements.court.innerHTML = '<option value="">Erro ao carregar quadras</option>';
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar as quadras. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  async function checkAvailability() {
    hideMessages();

    if (!validateBaseFields()) {
      return;
    }

    try {
      elements.slots.innerHTML = '<span class="time-slot time-slot--busy">Consultando hor&aacute;rios...</span>';
      const response = await window.QuadraFacilApi.request(`/agendamentos/disponiveis?quadraId=${encodeURIComponent(elements.court.value)}&data=${encodeURIComponent(elements.date.value)}`);
      renderSlots(response?.data || []);
    } catch (error) {
      state.availableSlots = [];
      renderSlots([]);

      const message = String(error.body?.message || error.message || "").toLowerCase();
      if (message.includes("manutencao") || message.includes("disponivel")) {
        showMessage("error", "Quadra indispon\u00edvel ou em manuten\u00e7\u00e3o.");
      } else {
        showMessage("error", "N\u00e3o foi poss\u00edvel consultar os hor\u00e1rios dispon\u00edveis.");
      }
    }
  }

  async function submitBooking() {
    hideMessages();

    if (!validateTimeFields()) {
      return;
    }

    if (state.availableSlots.length > 0 && !isSelectedSlotAvailable()) {
      showMessage("error", "J\u00e1 existe agendamento ativo neste hor\u00e1rio.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = state.initial.agendamentoId
        ? `/agendamentos/${encodeURIComponent(state.initial.agendamentoId)}`
        : "/agendamentos";
      const method = state.initial.agendamentoId ? "PUT" : "POST";

      await window.QuadraFacilApi.request(endpoint, {
        method,
        body: JSON.stringify({
          usuarioId: state.user.id,
          quadraId: Number(elements.court.value),
          dataAgendamento: elements.date.value,
          horaInicio: formatTime(elements.start.value),
          horaFim: formatTime(elements.end.value),
          observacoes: elements.notes.value.trim() || null
        })
      });

      await checkAvailability();
      showMessage("success", state.initial.agendamentoId ? "Agendamento atualizado com sucesso." : "Agendamento criado com sucesso.");
    } catch (error) {
      const message = String(error.body?.message || error.message || "").toLowerCase();

      if (message.includes("conflito") || message.includes("existe") || message.includes("horario")) {
        showMessage("error", "J\u00e1 existe agendamento ativo neste hor\u00e1rio.");
      } else if (message.includes("manutencao") || message.includes("disponivel")) {
        showMessage("error", "Quadra indispon\u00edvel ou em manuten\u00e7\u00e3o.");
      } else if (message.includes("hora final")) {
        showMessage("error", "Hora final deve ser maior que hora inicial.");
      } else {
        showMessage("error", state.initial.agendamentoId
          ? "N\u00e3o foi poss\u00edvel atualizar o agendamento."
          : "N\u00e3o foi poss\u00edvel criar o agendamento.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingBooking() {
    if (!state.initial.agendamentoId) {
      return true;
    }

    try {
      const response = await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(state.initial.agendamentoId)}`);
      const booking = response?.data;

      if (!booking) {
        throw new Error("Agendamento nao encontrado.");
      }

      state.existingBooking = booking;
      state.initial.quadraId = String(booking.quadraId || state.initial.quadraId || "");
      state.initial.data = booking.dataAgendamento || state.initial.data;
      state.initial.horaInicio = formatTime(booking.horaInicio || state.initial.horaInicio);
      state.initial.horaFim = formatTime(booking.horaFim || state.initial.horaFim);

      if (elements.notes) {
        elements.notes.value = booking.observacoes || "";
      }
      return true;
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os dados atuais do agendamento para edi\u00e7\u00e3o.");
      return false;
    }
  }

  function applyInitialValues() {
    if (state.initial.agendamentoId) {
      const title = document.querySelector("#booking-title");
      if (title) {
        title.textContent = "Editar agendamento";
      }
      if (elements.submitText) {
        elements.submitText.textContent = "Salvar altera\u00e7\u00f5es";
      }
      if (elements.backLink) {
        elements.backLink.href = `detalhes-agendamento.html?id=${encodeURIComponent(state.initial.agendamentoId)}`;
        elements.backLink.textContent = "Voltar";
      }
    }

    elements.date.min = todayString();
    elements.date.value = state.initial.data || todayString();

    if (state.initial.horaInicio) {
      elements.start.value = formatTime(state.initial.horaInicio);
    }

    if (state.initial.horaFim) {
      elements.end.value = formatTime(state.initial.horaFim);
    }

    updateSummary();
  }

  elements.court?.addEventListener("change", () => {
    state.availableSlots = [];
    updateSelectedCourt();
    renderSlotMessage("Clique em verificar hor\u00e1rios para consultar esta quadra.");
  });

  elements.date?.addEventListener("change", () => {
    state.availableSlots = [];
    updateSummary();
    renderSlotMessage("Clique em verificar hor\u00e1rios para consultar esta data.");
  });

  elements.start?.addEventListener("change", updateSummary);
  elements.end?.addEventListener("change", updateSummary);

  elements.checkSlots?.addEventListener("click", checkAvailability);

  elements.slots?.addEventListener("click", (event) => {
    const chip = event.target.closest(".time-slot--available");

    if (!chip) {
      return;
    }

    elements.start.value = chip.dataset.start;
    elements.end.value = chip.dataset.end;
    updateSummary();
  });

  elements.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitBooking();
  });

  elements.authAction?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  async function initialize() {
    updateAuthAction();
    const existingBookingLoaded = await loadExistingBooking();
    applyInitialValues();
    await loadCourts();

    if (existingBookingLoaded && elements.court.value && elements.date.value) {
      checkAvailability();
    }
  }

  state.user = requireUser();

  if (state.user) {
    initialize();
  }
})();
