// Aplica el tema guardado antes de pintar, para evitar el parpadeo oscuro/claro.
try {
  if (localStorage.getItem('abaco-tema') === 'light') document.documentElement.dataset.theme = 'light'
} catch (e) {}
