(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const ADMIN_EMAIL = "admin@quadras.com.br";

  function getLoggedUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch (error) {
      return null;
    }
  }

  function isAdminUser(user) {
    const email = String(user?.email || "").toLowerCase();
    const role = String(user?.perfil || user?.tipo || user?.role || "").toUpperCase();

    return email === ADMIN_EMAIL || role === "ADMIN" || role === "ADMINISTRADOR" || user?.administrador === true;
  }

  const user = getLoggedUser();
  const isAdmin = isAdminUser(user);

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    if (isAdmin) {
      element.hidden = false;
      element.removeAttribute("aria-hidden");
      return;
    }

    element.remove();
  });
})();
