(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";
  const ACCESS_DENIED_KEY = "quadraFacil.adminAccessDenied";
  const ACTIVE_STATUSES = ["PENDENTE", "CONFIRMADO"];

  const elements = {
    title: document.querySelector("#dashboard-title"),
    topbarName: document.querySelector("#topbar-user-name"),
    error: document.querySelector("#dashboard-error"),
    activeBookings: document.querySelector("#active-bookings-count"),
    nextBookingTime: document.querySelector("#next-booking-time"),
    nextBookingDate: document.querySelector("#next-booking-date"),
    availableCourts: document.querySelector("#available-courts-count"),
    pendingBookings: document.querySelector("#pending-bookings-count"),
    nextStatus: document.querySelector("#next-booking-status"),
    nextCourt: document.querySelector("#next-booking-court"),
    nextFullDate: document.querySelector("#next-booking-full-date"),
    nextFullTime: document.querySelector("#next-booking-full-time"),
    nextLink: document.querySelector("#next-booking-link"),
    featuredCourts: document.querySelector("#featured-courts-grid"),
    logoutButton: document.querySelector("#logout-button")
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

    if (!user || !user.id) {
      sessionStorage.setItem(REDIRECT_KEY, "dashboard.html");
      window.location.href = "login.html";
      return null;
    }

    return user;
  }

  function firstName(fullName) {
    const name = String(fullName || "Usuario").trim();
    return name.split(/\s+/)[0] || "Usuario";
  }

  function showError(message) {
    if (!elements.error) {
      return;
    }

    elements.error.hidden = false;
    elements.error.textContent = message;
  }

  function showAdminAccessDeniedMessage() {
    const message = sessionStorage.getItem(ACCESS_DENIED_KEY);

    if (!message) {
      return;
    }

    sessionStorage.removeItem(ACCESS_DENIED_KEY);
    showError(message);
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("pt-BR");
  }

  function formatLongDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function formatTime(value) {
    return String(value || "--").slice(0, 5);
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function statusLabel(status) {
    const labels = {
      DISPONIVEL: "DISPON\u00cdVEL",
      INDISPONIVEL: "INDISPON\u00cdVEL",
      MANUTENCAO: "MANUTEN\u00c7\u00c3O",
      PENDENTE: "PENDENTE",
      CONFIRMADO: "CONFIRMADO",
      CANCELADO: "CANCELADO",
      FINALIZADO: "FINALIZADO",
      FUTSAL: "FUTSAL",
      SOCIETY: "SOCIETY",
      BASQUETE: "BASQUETE",
      VOLEI: "V\u00d4LEI",
      TENIS: "T\u00caNIS"
    };

    return labels[status] || status || "N/A";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function badgeClass(status) {
    const normalized = String(status || "").toLowerCase();
    return `badge badge--${normalized || "muted"}`;
  }

  function bookingDateTime(booking) {
    return new Date(`${booking.dataAgendamento}T${formatTime(booking.horaInicio)}:00`);
  }

  function findNextBooking(bookings) {
    const now = new Date();

    return bookings
      .filter((booking) => ACTIVE_STATUSES.includes(booking.status))
      .filter((booking) => bookingDateTime(booking) >= now)
      .sort((a, b) => bookingDateTime(a) - bookingDateTime(b))[0] || null;
  }

  function buildCourtMap(courts) {
    return courts.reduce((map, court) => {
      map.set(Number(court.id), court);
      return map;
    }, new Map());
  }

  function updateGreeting(user) {
    const name = firstName(user.nome);

    if (elements.title) {
      elements.title.textContent = `Ol\u00e1, ${name}! O que deseja fazer hoje?`;
    }

    if (elements.topbarName) {
      elements.topbarName.textContent = user.nome || user.email || "Usuario";
    }
  }

  function updateSummary(bookings, courts, nextBooking) {
    const activeCount = bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length;
    const pendingCount = bookings.filter((booking) => booking.status === "PENDENTE").length;
    const availableCount = courts.filter((court) => court.status === "DISPONIVEL").length;

    elements.activeBookings.textContent = String(activeCount);
    elements.pendingBookings.textContent = String(pendingCount);
    elements.availableCourts.textContent = String(availableCount);

    if (nextBooking) {
      elements.nextBookingTime.textContent = formatTime(nextBooking.horaInicio);
      elements.nextBookingDate.textContent = formatDate(nextBooking.dataAgendamento);
    } else {
      elements.nextBookingTime.textContent = "--";
      elements.nextBookingDate.textContent = "Nenhum hor\u00e1rio encontrado.";
    }
  }

  function updateNextBooking(nextBooking, courtMap) {
    if (!nextBooking) {
      elements.nextStatus.className = "badge badge--muted";
      elements.nextStatus.textContent = "SEM RESERVA";
      elements.nextCourt.textContent = "Nenhuma reserva ativa.";
      elements.nextFullDate.textContent = "--";
      elements.nextFullTime.textContent = "--";
      elements.nextLink.href = "meus-agendamentos.html";
      return;
    }

    const court = courtMap.get(Number(nextBooking.quadraId));
    elements.nextStatus.className = badgeClass(nextBooking.status);
    elements.nextStatus.textContent = statusLabel(nextBooking.status);
    elements.nextCourt.textContent = court?.nome || `Quadra #${nextBooking.quadraId}`;
    elements.nextFullDate.textContent = formatLongDate(nextBooking.dataAgendamento);
    elements.nextFullTime.textContent = `${formatTime(nextBooking.horaInicio)} at\u00e9 ${formatTime(nextBooking.horaFim)}`;
    elements.nextLink.href = `detalhes-agendamento.html?id=${encodeURIComponent(nextBooking.id)}`;
  }

  function renderFeaturedCourts(courts) {
    const featured = courts.slice(0, 3);

    if (!elements.featuredCourts) {
      return;
    }

    if (featured.length === 0) {
      elements.featuredCourts.innerHTML = `
        <article class="court-card">
          <strong>Nenhuma quadra cadastrada.</strong>
          <p>Assim que houver quadras na API, elas aparecer\u00e3o aqui.</p>
        </article>
      `;
      return;
    }

    elements.featuredCourts.innerHTML = featured.map((court) => {
      const name = escapeHtml(court.nome || "Quadra");
      const description = escapeHtml(court.descricao || "Quadra esportiva dispon\u00edvel para consulta.");
      const type = escapeHtml(statusLabel(court.tipo));
      const status = escapeHtml(statusLabel(court.status));
      const className = escapeHtml(badgeClass(court.status));
      const href = `quadras.html?id=${encodeURIComponent(court.id)}`;

      return `
        <article class="court-card">
          <div class="court-card__top">
            <span>${type}</span>
            <span class="${className}">${status}</span>
          </div>
          <strong>${name}</strong>
          <p>${description}</p>
          <div class="court-card__footer">
            <span>${formatCurrency(court.precoHora)}</span>
            <a href="${href}">Ver quadra</a>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadDashboard(user) {
    try {
      const [bookingResponse, courtResponse] = await Promise.all([
        window.QuadraFacilApi.request(`/agendamentos?usuarioId=${encodeURIComponent(user.id)}`),
        window.QuadraFacilApi.request("/quadras")
      ]);

      const bookings = Array.isArray(bookingResponse?.data) ? bookingResponse.data : [];
      const courts = Array.isArray(courtResponse?.data) ? courtResponse.data : [];
      const courtMap = buildCourtMap(courts);
      const nextBooking = findNextBooking(bookings);

      updateSummary(bookings, courts, nextBooking);
      updateNextBooking(nextBooking, courtMap);
      renderFeaturedCourts(courts);
    } catch (error) {
      showError("N\u00e3o foi poss\u00edvel carregar os dados do dashboard. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.");
      updateSummary([], [], null);
      updateNextBooking(null, new Map());
      renderFeaturedCourts([]);
    }
  }

  elements.logoutButton?.addEventListener("click", () => {
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "login.html";
  });

  const user = requireUser();

  if (user) {
    updateGreeting(user);
    showAdminAccessDeniedMessage();
    loadDashboard(user);
  }
})();
