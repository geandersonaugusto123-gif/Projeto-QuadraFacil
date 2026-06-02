(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const CANCELABLE_STATUSES = ["PENDENTE", "CONFIRMADO"];

  const state = {
    user: null,
    bookingId: new URLSearchParams(window.location.search).get("id"),
    booking: null,
    court: null,
    responsible: null
  };

  const elements = {
    authAction: document.querySelector("#booking-detail-auth-action"),
    success: document.querySelector("#booking-detail-success"),
    error: document.querySelector("#booking-detail-error"),
    status: document.querySelector("#detail-status"),
    statusMessage: document.querySelector("#status-message"),
    id: document.querySelector("#detail-id"),
    user: document.querySelector("#detail-user"),
    court: document.querySelector("#detail-court"),
    type: document.querySelector("#detail-court-type"),
    date: document.querySelector("#detail-date"),
    start: document.querySelector("#detail-start"),
    end: document.querySelector("#detail-end"),
    price: document.querySelector("#detail-price"),
    notes: document.querySelector("#detail-notes"),
    timeline: document.querySelector("#booking-timeline"),
    editLink: document.querySelector("#edit-booking-link"),
    cancelButton: document.querySelector("#cancel-detail-booking"),
    cancelModal: document.querySelector("#cancel-detail-modal"),
    confirmCancel: document.querySelector("#confirm-detail-cancel")
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
      sessionStorage.setItem(REDIRECT_KEY, `detalhes-agendamento.html${window.location.search}`);
      window.location.href = "login.html";
      return null;
    }

    return user;
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function formatTime(value) {
    return String(value || "--").slice(0, 5);
  }

  function timeToMinutes(value) {
    const [hour, minute] = formatTime(value).split(":").map(Number);
    return hour * 60 + minute;
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
      PENDENTE: "PENDENTE",
      CONFIRMADO: "CONFIRMADO",
      CANCELADO: "CANCELADO",
      FINALIZADO: "FINALIZADO"
    };

    return labels[value] || value || "N/A";
  }

  function badgeClass(status) {
    return `badge booking-detail-status badge--${String(status || "muted").toLowerCase()}`;
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

  function estimatedValue() {
    if (!state.booking || !state.court) {
      return "--";
    }

    const duration = Math.max(0, (timeToMinutes(state.booking.horaFim) - timeToMinutes(state.booking.horaInicio)) / 60);
    return duration > 0 ? formatCurrency(duration * Number(state.court.precoHora || 0)) : "--";
  }

  function statusMessage(status) {
    const messages = {
      CANCELADO: ["status-message status-message--cancelado", "Esta reserva foi cancelada."],
      CONFIRMADO: ["status-message status-message--confirmado", "Esta reserva est\u00e1 ativa."],
      PENDENTE: ["status-message status-message--pendente", "Esta reserva aguarda confirma\u00e7\u00e3o."],
      FINALIZADO: ["status-message status-message--finalizado", "Esta reserva j\u00e1 foi conclu\u00edda."]
    };

    return messages[status] || ["status-message status-message--muted", "Status do agendamento carregado."];
  }

  function renderStatus(status) {
    elements.status.className = badgeClass(status);
    elements.status.textContent = label(status);

    const [className, message] = statusMessage(status);
    elements.statusMessage.className = className;
    elements.statusMessage.textContent = message;
  }

  function renderTimeline(status) {
    const steps = [
      { key: "CRIADO", text: "Agendamento criado." },
      { key: "PENDENTE", text: "Pendente de confirma\u00e7\u00e3o." },
      { key: "CONFIRMADO", text: "Confirmado." },
      { key: "ENCERRADO", text: status === "CANCELADO" ? "Cancelado." : "Finalizado ou cancelado." }
    ];

    const stepStates = {
      PENDENTE: ["is-complete", "is-current", "is-pending", "is-pending"],
      CONFIRMADO: ["is-complete", "is-complete", "is-current", "is-pending"],
      FINALIZADO: ["is-complete", "is-complete", "is-complete", "is-current"],
      CANCELADO: ["is-complete", "is-complete", "is-pending", "is-current"]
    };
    const states = stepStates[status] || stepStates.PENDENTE;

    elements.timeline.innerHTML = "";
    steps.forEach((step, index) => {
      const item = document.createElement("li");
      item.textContent = step.text;
      item.className = states[index];
      elements.timeline.appendChild(item);
    });
  }

  function setActionState(status) {
    const canCancel = CANCELABLE_STATUSES.includes(status);
    elements.cancelButton.disabled = !canCancel;
    elements.cancelButton.classList.toggle("is-disabled", !canCancel);

    elements.editLink.classList.toggle("is-disabled", status === "CANCELADO" || status === "FINALIZADO");
    elements.editLink.setAttribute("aria-disabled", String(status === "CANCELADO" || status === "FINALIZADO"));

    if (state.booking) {
      const params = new URLSearchParams({
        agendamentoId: state.booking.id,
        quadraId: state.booking.quadraId,
        data: state.booking.dataAgendamento,
        horaInicio: formatTime(state.booking.horaInicio),
        horaFim: formatTime(state.booking.horaFim)
      });
      elements.editLink.href = `agendar.html?${params.toString()}`;
    }
  }

  function renderDetails() {
    const booking = state.booking;
    const court = state.court;
    const responsible = state.responsible;

    document.title = `Agendamento #${booking.id} | QuadraF\u00e1cil`;

    elements.id.textContent = `#${booking.id}`;
    elements.user.textContent = responsible?.nome || state.user.nome || `Usu\u00e1rio #${booking.usuarioId}`;
    elements.court.textContent = court?.nome || `Quadra #${booking.quadraId}`;
    elements.type.textContent = label(court?.tipo);
    elements.date.textContent = formatDate(booking.dataAgendamento);
    elements.start.textContent = formatTime(booking.horaInicio);
    elements.end.textContent = formatTime(booking.horaFim);
    elements.price.textContent = estimatedValue();
    elements.notes.textContent = booking.observacoes || "Sem observa\u00e7\u00f5es cadastradas.";

    renderStatus(booking.status);
    renderTimeline(booking.status);
    setActionState(booking.status);
  }

  async function fetchOptional(endpoint) {
    try {
      return await window.QuadraFacilApi.request(endpoint);
    } catch (error) {
      return null;
    }
  }

  async function loadDetails() {
    if (!state.bookingId) {
      showMessage("error", "Informe o ID do agendamento na URL.");
      setActionState("CANCELADO");
      return;
    }

    try {
      hideMessages();
      const bookingResponse = await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(state.bookingId)}`);
      state.booking = bookingResponse?.data;

      if (!state.booking) {
        throw new Error("Agendamento nao encontrado.");
      }

      const [courtResponse, userResponse] = await Promise.all([
        fetchOptional(`/quadras/${encodeURIComponent(state.booking.quadraId)}`),
        fetchOptional(`/usuarios/${encodeURIComponent(state.booking.usuarioId)}`)
      ]);

      state.court = courtResponse?.data || null;
      state.responsible = userResponse?.data || null;
      renderDetails();
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar os detalhes do agendamento.");
      setActionState("CANCELADO");
    }
  }

  async function cancelRequest(bookingId) {
    try {
      return await window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(bookingId)}/cancelar`, {
        method: "PUT"
      });
    } catch (error) {
      if (error.status === 404 || error.status === 405) {
        return window.QuadraFacilApi.request(`/agendamentos/${encodeURIComponent(bookingId)}`, {
          method: "DELETE"
        });
      }

      throw error;
    }
  }

  async function cancelBooking() {
    if (!state.booking?.id) {
      return;
    }

    elements.confirmCancel.disabled = true;
    hideMessages();

    try {
      await cancelRequest(state.booking.id);
      state.booking = { ...state.booking, status: "CANCELADO" };
      elements.cancelModal.close();
      renderDetails();
      showMessage("success", "Agendamento cancelado com sucesso.");
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel cancelar este agendamento.");
    } finally {
      elements.confirmCancel.disabled = false;
    }
  }

  elements.authAction?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  elements.cancelButton?.addEventListener("click", () => {
    if (!elements.cancelButton.disabled) {
      elements.cancelModal.showModal();
    }
  });

  document.querySelectorAll("[data-cancel-detail-close]").forEach((button) => {
    button.addEventListener("click", () => elements.cancelModal.close());
  });

  elements.confirmCancel?.addEventListener("click", cancelBooking);

  elements.editLink?.addEventListener("click", (event) => {
    if (elements.editLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  state.user = requireUser();

  if (state.user) {
    loadDetails();
  }
})();
