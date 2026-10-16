// Aplica el tema antes de pintar, para evitar el parpadeo oscuro/claro.
// El portafolio abre en claro; solo queda en oscuro si la persona lo eligió con el botón de tema.
document.documentElement.dataset.theme = 'light'
try {
  if (localStorage.getItem('abaco-tema') === 'dark') document.documentElement.dataset.theme = 'dark'
} catch (e) {}
