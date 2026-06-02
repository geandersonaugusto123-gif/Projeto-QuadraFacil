(function () {
  const AUTH_USER_KEY = "quadraFacil.usuarioLogado";
  const REMEMBER_KEY = "quadraFacil.lembrarAcesso";
  const REMEMBER_EMAIL_KEY = "quadraFacil.emailLembrado";
  const REDIRECT_KEY = "quadraFacil.posLoginRedirect";

  const form = document.querySelector("#login-form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#senha");
  const rememberInput = document.querySelector("#lembrar-acesso");
  const messageBox = document.querySelector("#login-message");
  const submitButton = document.querySelector(".login-submit");
  const submitText = submitButton?.querySelector(".button-text");

  const savedRemember = localStorage.getItem(REMEMBER_KEY) === "true";
  const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

  if (rememberInput) {
    rememberInput.checked = savedRemember;
  }

  if (emailInput && savedRemember && savedEmail) {
    emailInput.value = savedEmail;
  }

  function setFieldError(fieldName, message) {
    const errorElement = document.querySelector(`#${fieldName}-error`);
    const input = document.querySelector(`#${fieldName}`);

    if (errorElement) {
      errorElement.textContent = message || "";
    }

    if (input) {
      input.classList.toggle("has-error", Boolean(message));
    }
  }

  function clearFieldErrors() {
    setFieldError("email", "");
    setFieldError("senha", "");
  }

  function showMessage(type, text) {
    if (!messageBox) {
      return;
    }

    messageBox.hidden = false;
    messageBox.className = `form-alert form-alert--${type}`;
    messageBox.textContent = text;
  }

  function hideMessage() {
    if (messageBox) {
      messageBox.hidden = true;
      messageBox.textContent = "";
    }
  }

  function setLoading(isLoading) {
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.classList.toggle("is-loading", isLoading);
    }

    if (submitText) {
      submitText.textContent = isLoading ? "Entrando..." : "Entrar";
    }
  }

  function validateLogin(email, senha) {
    let valid = true;
    clearFieldErrors();

    if (!email) {
      setFieldError("email", "Informe seu email.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("email", "Informe um email valido.");
      valid = false;
    }

    if (!senha) {
      setFieldError("senha", "Informe sua senha.");
      valid = false;
    } else if (senha.length < 6) {
      setFieldError("senha", "A senha deve ter pelo menos 6 caracteres.");
      valid = false;
    }

    return valid;
  }

  function saveLoggedUser(apiResponse, email, lembrarAcesso) {
    const usuario = apiResponse?.data?.usuario;

    if (!usuario) {
      throw new Error("Resposta de login sem dados do usuario.");
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
      ...usuario,
      email: usuario.email || email,
      autenticadoEm: new Date().toISOString()
    }));

    localStorage.setItem(REMEMBER_KEY, String(lembrarAcesso));

    if (lembrarAcesso) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }

  function redirectAfterLogin() {
    const target = sessionStorage.getItem(REDIRECT_KEY);

    if (target) {
      sessionStorage.removeItem(REDIRECT_KEY);
      window.setTimeout(() => {
        window.location.href = target;
      }, 650);
      return;
    }

    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 650);
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage();

    const email = emailInput.value.trim();
    const senha = passwordInput.value;
    const lembrarAcesso = Boolean(rememberInput?.checked);

    if (!validateLogin(email, senha)) {
      return;
    }

    setLoading(true);

    try {
      const response = await window.QuadraFacilApi.request("/login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
      });

      saveLoggedUser(response, email, lembrarAcesso);
      showMessage("success", "Login realizado com sucesso.");
      redirectAfterLogin();
    } catch (error) {
      const message = error.status === 401 || error.status === 400
        ? "Email ou senha inv\u00e1lidos."
        : "N\u00e3o foi poss\u00edvel conectar ao servidor. Verifique se o backend est\u00e1 em execu\u00e7\u00e3o.";

      showMessage("error", message);
    } finally {
      setLoading(false);
    }
  });
})();
