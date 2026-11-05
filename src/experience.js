// Lightweight depth inspired by the supplied visual references. No remote media.
export function attachDepth(hero) {
  if (
    !hero ||
    !matchMedia("(hover: hover) and (pointer: fine)").matches ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.style.setProperty("--depth-x", `${x * 12}deg`);
    hero.style.setProperty("--depth-y", `${-y * 10}deg`);
    hero.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
    hero.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--depth-x", "0deg");
    hero.style.setProperty("--depth-y", "0deg");
    hero.style.setProperty("--glow-x", "75%");
    hero.style.setProperty("--glow-y", "45%");
  });
}
