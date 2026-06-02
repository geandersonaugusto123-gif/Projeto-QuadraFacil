(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const CANCELABLE_STATUSES = ["PENDENTE", "CONFIRMADO"];

  const state = {
    user: null,
    bookings: [],
    courts: [],
    courtMap: new Map(),
    filters: {
      status: "",
      date: "",
      search: ""
    },
    pendingCancelId: null,
    initialId: new URLSearchParams(window.location.search).get("id")
  };

  const elements = {
    authAction: document.querySelector("#my-bookings-auth-action"),
    success: document.querySelector("#my-bookings-success"),
    error: document.querySelector("#my-bookings-error"),
    status: document.querySelector("#booking-status-filter"),
    date: document.querySelector("#booking-date-filter"),
    search: document.querySelector("#booking-search-filter"),
    clear: document.querySelector("#clear-booking-filters"),
    count: document.querySelector("#my-bookings-count"),
    grid: document.querySelector("#my-bookings-grid"),
    detailsModal: document.querySelector("#booking-details-modal"),
    detailsContent: document.querySelector("#booking-details-content"),
    cancelModal: document.querySelector("#cancel-booking-modal"),
    confirmCancel: document.querySelector("#confirm-cancel-booking")
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
      sessionStorage.setItem(REDIRECT_KEY, `meus-agendamentos.html${window.location.search}`);
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

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function label(status) {
    const labels = {
      PENDENTE: "PENDENTE",
      CONFIRMADO: "CONFIRMADO",
      CANCELADO: "CANCELADO",
      FINALIZADO: "FINALIZADO"
    };

    return labels[status] || status || "N/A";
  }

  function badgeClass(status) {
    return `badge badge--${String(status || "muted").toLowerCase()}`;
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

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = text;
    return element;
  }

  function courtName(booking) {
    const court = state.courtMap.get(Number(booking.quadraId));
    return court?.nome || `Quadra #${booking.quadraId}`;
  }

  function bookingDateTime(booking) {
    return new Date(`${booking.dataAgendamento}T${formatTime(booking.horaInicio)}:00`);
  }

  function updateCount(total) {
    elements.count.textContent = total === 1 ? "1 agendamento encontrado" : `${total} agendamentos encontrados`;
  }

  function filteredBookings() {
    const search = normalizeText(state.filters.search);

    return state.bookings
      .filter((booking) => !state.filters.status || booking.status === state.filters.status)
      .filter((booking) => !state.filters.date || booking.dataAgendamento === state.filters.date)
      .filter((booking) => !search || normalizeText(courtName(booking)).includes(search))
      .sort((a, b) => bookingDateTime(b) - bookingDateTime(a));
  }

  function createBookingCard(booking) {
    const card = document.createElement("article");
    card.className = "booking-card";
    card.dataset.bookingId = booking.id;

    const header = document.createElement("div");
    header.className = "booking-card__header";

    const heading = document.createElement("div");
    heading.appendChild(createTextElement("span", "booking-code", `Agendamento #${booking.id}`));
    heading.appendChild(createTextElement("h2", "", courtName(booking)));

    const badge = createTextElement("span", badgeClass(booking.status), label(booking.status));

    header.appendChild(heading);
    header.appendChild(badge);

    const meta = document.createElement("dl");
    meta.className = "booking-card__meta";

    [
      ["Data", formatDate(booking.dataAgendamento)],
      ["Hora in\u00edcio", formatTime(booking.horaInicio)],
      ["Hora fim", formatTime(booking.horaFim)]
    ].forEach(([term, value]) => {
      const item = document.createElement("div");
      item.appendChild(createTextElement("dt", "", term));
      item.appendChild(createTextElement("dd", "", value));
      meta.appendChild(item);
    });

    const notes = createTextElement("p", "booking-card__notes", booking.observacoes || "Sem observa\u00e7\u00f5es cadastradas.");

    const actions = document.createElement("div");
    actions.className = "booking-card__actions";

    const details = document.createElement("a");
    details.className = "button button--dark";
    details.href = `detalhes-agendamento.html?id=${encodeURIComponent(booking.id)}`;
    details.textContent = "Ver detalhes";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "button button--danger";
    cancel.dataset.action = "cancel";
    cancel.dataset.bookingId = booking.id;
    cancel.textContent = "Cancelar";

    if (!CANCELABLE_STATUSES.includes(booking.status)) {
      cancel.disabled = true;
      cancel.classList.add("is-disabled");
    }

    actions.appendChild(details);
    actions.appendChild(cancel);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(notes);
    card.appendChild(actions);
    return card;
  }

  function renderBookings() {
    const list = filteredBookings();
    elements.grid.innerHTML = "";
    updateCount(list.length);

    if (list.length === 0) {
      const empty = document.createElement("article");
      empty.className = "bookings-empty";
      empty.appendChild(createTextElement("strong", "", "Voc\u00ea ainda n\u00e3o possui agendamentos."));
      empty.appendChild(createTextElement("p", "", "Quando uma reserva for criada, ela aparecer\u00e1 nesta tela."));
      elements.grid.appendChild(empty);
      return;
    }

    list.forEach((booking) => elements.grid.appendChild(createBookingCard(booking)));

    if (state.initialId) {
      const selected = state.bookings.find((booking) => String(booking.id) === String(state.initialId));
      if (selected) {
        openDetailsModal(selected);
      }
      state.initialId = null;
    }
  }

  function detailRow(term, value) {
    const wrapper = document.createElement("div");
    wrapper.appendChild(createTextElement("dt", "", term));
    wrapper.appendChild(createTextElement("dd", "", value));
    return wrapper;
  }

  function openDetailsModal(booking) {
    elements.detailsContent.innerHTML = "";
    elements.detailsContent.appendChild(detailRow("C\u00f3digo", `#${booking.id}`));
    elements.detailsContent.appendChild(detailRow("Quadra", courtName(booking)));
    elements.detailsContent.appendChild(detailRow("Data", formatDate(booking.dataAgendamento)));
    elements.detailsContent.appendChild(detailRow("Hor\u00e1rio", `${formatTime(booking.horaInicio)} at\u00e9 ${formatTime(booking.horaFim)}`));
    elements.detailsContent.appendChild(detailRow("Status", label(booking.status)));
    elements.detailsContent.appendChild(detailRow("Observa\u00e7\u00f5es", booking.observacoes || "Sem observa\u00e7\u00f5es cadastradas."));
    elements.detailsModal.showModal();
  }

  function openCancelModal(bookingId) {
    state.pendingCancelId = bookingId;
    elements.cancelModal.showModal();
  }

  function closeCancelModal() {
    state.pendingCancelId = null;
    elements.cancelModal.close();
  }

  async function cancelBooking() {
    if (!state.pendingCancelId) {
      return;
    }

    elements.confirmCancel.disabled = true;
    hideMessages();

    try {
      await cancelRequest(state.pendingCancelId);

      state.bookings = state.bookings.map((booking) => (
        String(booking.id) === String(state.pendingCancelId)
          ? { ...booking, status: "CANCELADO" }
          : booking
      ));

      closeCancelModal();
      renderBookings();
      showMessage("success", "Agendamento cancelado com sucesso.");
    } catch (error) {
      showMessage("error", "N\u00e3o foi poss\u00edvel cancelar este agendamento.");
    } finally {
      elements.confirmCancel.disabled = false;
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

  function buildCourtMap(courts) {
    state.courtMap = courts.reduce((map, court) => {
      map.set(Number(court.id), court);
      return map;
    }, new Map());
  }

  async function loadData() {
    try {
      hideMessages();
      const [bookingResponse, courtResponse] = await Promise.all([
        window.QuadraFacilApi.request(`/agendamentos?usuarioId=${encodeURIComponent(state.user.id)}`),
        window.QuadraFacilApi.request("/quadras")
      ]);

      state.bookings = Array.isArray(bookingResponse?.data) ? bookingResponse.data : [];
      state.courts = Array.isArray(courtResponse?.data) ? courtResponse.data : [];
      buildCourtMap(state.courts);
      renderBookings();
    } catch (error) {
      state.bookings = [];
      state.courts = [];
      buildCourtMap([]);
      renderBookings();
      showMessage("error", "N\u00e3o foi poss\u00edvel carregar seus agendamentos. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
    }
  }

  elements.status?.addEventListener("change", () => {
    state.filters.status = elements.status.value;
    renderBookings();
  });

  elements.date?.addEventListener("change", () => {
    state.filters.date = elements.date.value;
    renderBookings();
  });

  elements.search?.addEventListener("input", () => {
    state.filters.search = elements.search.value;
    renderBookings();
  });

  elements.clear?.addEventListener("click", () => {
    state.filters.status = "";
    state.filters.date = "";
    state.filters.search = "";
    elements.status.value = "";
    elements.date.value = "";
    elements.search.value = "";
    renderBookings();
  });

  elements.grid?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton || actionButton.disabled) {
      return;
    }

    const booking = state.bookings.find((item) => String(item.id) === String(actionButton.dataset.bookingId));

    if (!booking) {
      return;
    }

    if (actionButton.dataset.action === "cancel") {
      openCancelModal(booking.id);
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => elements.detailsModal.close());
  });

  document.querySelectorAll("[data-cancel-close]").forEach((button) => {
    button.addEventListener("click", closeCancelModal);
  });

  elements.confirmCancel?.addEventListener("click", cancelBooking);

  elements.authAction?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  state.user = requireUser();

  if (state.user) {
    loadData();
  }
})();
