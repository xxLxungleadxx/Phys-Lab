// Preserve native keyboard navigation, but keep its focus ring inside the
// viewport and clear of the sticky header. Mouse/touch focus is unchanged.
document.addEventListener("focusin", event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  requestAnimationFrame(() => {
    if (document.activeElement !== target || !target.matches(":focus-visible")) return;
    if (getComputedStyle(target).position === "fixed") return;
    const rect = target.getBoundingClientRect();
    const header = document.querySelector(".site-header");
    const topLimit = header && !header.contains(target) ? header.getBoundingClientRect().bottom : 0;
    const ringSpace = 8;
    const bottomLimit = window.innerHeight - ringSpace;
    let deltaY = 0;
    if (rect.bottom > bottomLimit) deltaY = rect.bottom - bottomLimit;
    if (rect.top - deltaY < topLimit + ringSpace) deltaY = rect.top - topLimit - ringSpace;
    if (deltaY) window.scrollBy({ top: deltaY, behavior: "instant" });
  });
});
