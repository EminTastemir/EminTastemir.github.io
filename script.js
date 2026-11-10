// ---- Ayarlar ----
const GITHUB_USER = "EminTastemir";
// Listede göstermek istemediğin depoları buraya ekle (küçük harf):
const HIDDEN_REPOS = ["emintastemir.github.io", "emintastemir"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
const progress = document.getElementById("progress");
const heroPhoto = document.getElementById("heroPhoto");
const darkSections = [...document.querySelectorAll(".dark")];

// Mobil menü
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  nav.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  links.classList.remove("open");
  nav.classList.remove("menu-open");
  toggle.setAttribute("aria-expanded", "false");
}));

// Kaydırma metni: kelimelere böl
const scrollText = document.getElementById("scrollText");
scrollText.innerHTML = scrollText.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
const words = [...scrollText.querySelectorAll(".w")];

// Kaydırmaya bağlı efektler
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // Nav rengi: altında koyu bölüm varsa koyulaş
  const onDark = darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= 48 && r.bottom >= 48;
  });
  nav.classList.toggle("on-dark", onDark);

  if (!reduceMotion) {
    // Hero fotoğrafı: hafif büyüme
    const p = Math.min(Math.max(y / vh, 0), 1);
    heroPhoto.style.transform = `scale(${1 + p * 0.12}) translateY(${p * -30}px)`;

    // Hakkımda metni: kelime kelime aydınlanma
    const r = scrollText.getBoundingClientRect();
    const t = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
    const lit = Math.floor(t * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < lit));
  }
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// Görünür olunca beliren öğeler + sayaçlar
function countUp(el) {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const start = target > 100 ? target - 40 : 0;
  const t0 = performance.now();
  const dur = 1400;
  const step = (now) => {
    const k = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(start + (target - start) * e) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll("[data-count]").forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => io.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

// GitHub depolarını otomatik çek
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function timeAgo(d) {
  const days = (Date.now() - new Date(d)) / 864e5;
  if (days < 1) return "bugün";
  if (days < 30) return `${Math.floor(days)} gün önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
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
      box.innerHTML = `<p class="repos-msg">Yeni projeler yakında burada.</p>`;
      return;
    }
    box.innerHTML = repos.slice(0, 8).map((r) => `
      <a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <span class="repo-name">${esc(r.name)} ↗</span>
        <span class="repo-meta">${[r.language, r.stargazers_count ? "★ " + r.stargazers_count : "", timeAgo(r.pushed_at)].filter(Boolean).map(esc).join(" · ")}</span>
        <span class="repo-desc">${esc(r.description || "Açıklama eklenmemiş.")}</span>
      </a>`).join("");
  } catch {
    box.innerHTML = `<p class="repos-msg">Depolar şu an yüklenemedi. <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">GitHub profilimi ziyaret et</a></p>`;
  }
}
loadRepos();
