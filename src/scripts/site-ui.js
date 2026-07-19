const root = document.documentElement;
const languageToggle = document.querySelector("[data-language-toggle]");

function setLanguage(language) {
  root.dataset.language = language;
  root.lang = language === "zh" ? "zh-CN" : "en";
  if (languageToggle) {
    languageToggle.setAttribute("aria-pressed", String(language === "zh"));
    languageToggle.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  }
  try {
    localStorage.setItem("ming-wang-site-language", language);
  } catch {
    // Language preference is optional.
  }
}

let storedLanguage = "en";
try {
  storedLanguage = localStorage.getItem("ming-wang-site-language") === "zh" ? "zh" : "en";
} catch {
  storedLanguage = "en";
}
setLanguage(storedLanguage);
languageToggle?.addEventListener("click", () => setLanguage(root.dataset.language === "zh" ? "en" : "zh"));

const nav = document.querySelector("[data-site-nav]");
const updateNav = () => nav?.classList.toggle("is-scrolled", window.scrollY > 24);
updateNav();
window.addEventListener("scroll", updateNav, { passive: true });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = Array.from(document.querySelectorAll(".reveal"));
if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -6%", threshold: 0.05 },
  );
  reveals.forEach((element) => observer.observe(element));
}
