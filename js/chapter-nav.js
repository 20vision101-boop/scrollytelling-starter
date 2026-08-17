/* Chapter nav — tracks which Part is in view */
export function initChapterNav() {
  const chapterSectionIds = ["part-1", "part-2", "part-3", "part-4", "part-5"];
  const chapterSections = chapterSectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const chapterCurrent = document.getElementById("chapter-current");
  const chapterDots = document.querySelectorAll(".chapter-dot");

  const chapterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = chapterSections.indexOf(entry.target);
        if (idx === -1) return;
        chapterCurrent.textContent = String(idx + 1).padStart(2, "0");
        chapterDots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
      });
    },
    { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
  );
  chapterSections.forEach((el) => chapterObserver.observe(el));

  chapterDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      document.getElementById(dot.dataset.target)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}
