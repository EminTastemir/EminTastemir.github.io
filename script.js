// ---- Ayarlar ----
const GITHUB_USER = "EminTastemir";
// Listede göstermek istemediğin depoları buraya ekle (küçük harf):
const HIDDEN_REPOS = ["emintastemir.github.io", "emintastemir"];

// Navigasyon: kaydırınca arka plan + mobil menü
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");

const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Kaydırınca beliren bölümler
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

// GitHub depolarını otomatik çek
const LANG_COLORS = {
  Python: "#3572A5", C: "#555555", "C++": "#f34b7d", Dart: "#00B4AB", JavaScript: "#f1e05a",
  TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c", Jupyter: "#DA5B0B", "Jupyter Notebook": "#DA5B0B",
  Java: "#b07219", Kotlin: "#A97BFF", Shell: "#89e051",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function timeAgo(dateStr) {
  const d = (Date.now() - new Date(dateStr)) / 86400000;
  if (d < 1) return "bugün";
  if (d < 30) return `${Math.floor(d)} gün önce`;
  if (d < 365) return `${Math.floor(d / 30)} ay önce`;
  return `${Math.floor(d / 365)} yıl önce`;
}

async function loadRepos() {
  const box = document.getElementById("repos");
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error(res.status);
    const repos = (await res.json())
      .filter((r) => !r.fork && !HIDDEN_REPOS.includes(r.name.toLowerCase()))
      .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));

    if (!repos.length) {
      box.innerHTML = `<p class="repos-msg">Henüz herkese açık depo yok — yakında burada olacak.</p>`;
      return;
    }
    box.innerHTML = repos.slice(0, 9).map((r) => `
      <a class="repo reveal in" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <div class="repo-name"><span>${esc(r.name)}</span><i>↗</i></div>
        <p class="repo-desc">${esc(r.description || "Açıklama eklenmemiş.")}</p>
        <div class="repo-meta">
          ${r.language ? `<span><span class="lang-dot" style="background:${LANG_COLORS[r.language] || "#5eead4"}"></span>${esc(r.language)}</span>` : ""}
          ${r.stargazers_count ? `<span>★ ${r.stargazers_count}</span>` : ""}
          <span>${timeAgo(r.pushed_at)}</span>
        </div>
      </a>`).join("");
  } catch (err) {
    box.innerHTML = `<p class="repos-msg">Depolar şu an yüklenemedi. <a class="link" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">GitHub profilimi ziyaret et ↗</a></p>`;
  }
}
loadRepos();
