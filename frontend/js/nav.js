/* ============================================================
   Bibliothèque de quartier — Navigation commune
   Injecte la sidebar dans #sidebar-placeholder et marque le lien
   actif selon la page courante (via data-page sur <body>).
   ============================================================ */

const NAV_LINKS = [
  { page: "dashboard", href: "index.html", label: "Tableau de bord" },
  { page: "livres", href: "livres.html", label: "Livres" },
  { page: "auteurs", href: "auteurs.html", label: "Auteurs" },
  { page: "adherents", href: "adherents.html", label: "Adhérents" },
  { page: "emprunts", href: "emprunts.html", label: "Emprunts" },
];

function renderSidebar() {
  const placeholder = document.getElementById("sidebar-placeholder");
  if (!placeholder) return;

  const currentPage = document.body.dataset.page;

  const linksHtml = NAV_LINKS.map((link) => {
    const activeClass = link.page === currentPage ? ' class="active"' : "";
    return `<a href="${link.href}"${activeClass}><span class="nav-dot"></span>${link.label}</a>`;
  }).join("");

  // Important : on applique la classe directement sur le placeholder
  // (l'élément réellement stretché par le flexbox parent), plutôt que
  // de créer un <aside> imbriqué qui ne s'étirerait pas correctement.
  placeholder.classList.add("sidebar");
  placeholder.innerHTML = `
    <div class="sidebar__brand">
      <span class="sidebar__mark">📖</span>
      <div>
        <p class="sidebar__title">Bibliothèque</p>
        <p class="sidebar__subtitle">Gestion de quartier</p>
      </div>
      <button type="button" class="burger" id="burger-btn" aria-label="Ouvrir le menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
    <nav id="sidebar-nav">${linksHtml}</nav>
  `;

  const burgerBtn = document.getElementById("burger-btn");
  const nav = document.getElementById("sidebar-nav");

  burgerBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    burgerBtn.classList.toggle("open", isOpen);
    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

document.addEventListener("DOMContentLoaded", renderSidebar);
