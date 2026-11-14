/** Decorative transition only: profile and onboarding state remain in Welcome. */
export async function burnWelcomePaper(
  dialog: HTMLDialogElement,
  paper: HTMLElement,
  dragonURL: string,
): Promise<void> {
  if (!CSS.supports("clip-path", "polygon(evenodd,0px 0px,1px 0px,1px 1px)")) {
    paper.remove();
    return;
  }
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const duration = 1950;
  const stage = document.createElement("div");
  stage.className = "welcome-burn-stage";
  stage.style.setProperty("--welcome-transition-duration", `${duration}ms`);
  stage.setAttribute("aria-hidden", "true");
  stage.innerHTML = `<svg class="welcome-burn-outline" xmlns="http://www.w3.org/2000/svg"><path class="welcome-soot-edge"/><path class="welcome-char-edge"/><path class="welcome-ember-edge"/></svg>
    <div class="welcome-dragon-flight">
      <svg class="welcome-cloud-scroll" viewBox="0 0 600 210" fill="none"><g stroke="currentColor" stroke-width="1.3"><path d="M30 140c-30 0-23-28-5-22 8-36 52-32 56-8 31-13 42 20 18 24H30m-9 12h102M360 65c-24 0-24-23-5-22 1-27 38-33 48-9 21-9 40 12 23 23h-66m-8 14h96M415 185c-32 0-30-29-8-25 7-33 46-29 51-5 29-12 44 19 17 24h-60m-15 12h98"/></g></svg>
      <img class="welcome-long-dragon" src="${dragonURL}" alt=""/>
      <div class="welcome-dragon-breath"><svg viewBox="0 0 500 180" preserveAspectRatio="none"><defs><linearGradient id="welcome-flame-color"><stop stop-color="#a95e3b" stop-opacity="0"/><stop offset=".3" stop-color="#b96f43" stop-opacity=".7"/><stop offset=".8" stop-color="#d4ab6c"/><stop offset="1" stop-color="#fff0be"/></linearGradient></defs><g fill="url(#welcome-flame-color)"><path class="welcome-flame-outer" d="M500 87C442 76 431 46 378 55 333 65 322 22 273 34 294 53 280 69 248 61 207 45 171 75 130 62 155 84 135 98 104 89 73 79 36 99 0 82 45 122 103 106 145 125 194 147 211 113 247 134 298 160 324 118 363 128 421 143 437 101 500 96Z"/><path class="welcome-flame-inner" d="M500 89C442 83 427 69 396 81 355 95 338 70 305 83 327 90 304 111 277 100 247 90 224 112 198 99 237 136 268 109 303 118 350 135 364 103 397 111 443 122 462 97 500 95Z"/></g></svg></div>
    </div>`;
  dialog.append(stage);
  const flight = stage.querySelector<HTMLElement>(".welcome-dragon-flight")!;
  const breath = stage.querySelector<HTMLElement>(".welcome-dragon-breath")!;
  const outline = stage.querySelector<SVGSVGElement>(".welcome-burn-outline")!;
  const edges = stage.querySelectorAll<SVGPathElement>(
    ".welcome-burn-outline path",
  );
  let width = 0,
    height = 0,
    originX = 0,
    originY = 0,
    radius = 0;
  const layout = (): void => {
    width = dialog.clientWidth;
    height = dialog.clientHeight;
    const size = Math.min(
      760,
      width * (width < 600 ? 0.88 : 0.49),
      height * 1.55,
    );
    const left = width - size * 0.86;
    const top = height * 0.53 - (size / 3) * 0.32;
    const mouthX = left + size * 0.035;
    const length = Math.min(size * 0.62, mouthX * 0.7);
    flight.style.cssText = `left:${left}px;top:${top}px;width:${size}px`;
    breath.style.width = `${length}px`;
    originX = mouthX - length * 0.82;
    originY = height * 0.53;
    radius =
      Math.hypot(
        Math.max(originX, width - originX),
        Math.max(originY, height - originY),
      ) * 1.35;
    outline.setAttribute("viewBox", `0 0 ${width} ${height}`);
  };
  layout();
  // Recompute geometry on rotation/resizing; mouth, flame and paper share pixels.
  window.addEventListener("resize", layout);
  let frame = 0;
  const start = performance.now();
  try {
    await new Promise<void>((resolve) => {
      const draw = (now: number): void => {
        if (motion.matches) {
          resolve();
          return;
        }
        const elapsed = now - start;
        const t = Math.max(0, Math.min(1, (elapsed - 620) / 1120));
        if (t > 0) {
          const reach = radius * Math.pow(t, 1.25);
          const points: [number, number][] = [];
          for (let i = 0; i < 256; i++) {
            const angle = (i / 256) * Math.PI * 2;
            // Fixed harmonics keep a torn, brush-like edge without random flicker.
            const roughness =
              1 +
              0.065 * Math.sin(angle * 7 + 0.8) +
              0.032 * Math.cos(angle * 13) +
              0.014 * Math.sin(angle * 29 + 2) +
              0.005 * Math.sin(angle * 61) +
              0.003 * Math.cos(angle * 97);
            points.push([
              originX + Math.cos(angle) * reach * roughness,
              originY + Math.sin(angle) * reach * roughness * 0.86,
            ]);
          }
          const hole = points
            .map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)
            .join(",");
          const first = points[0]!;
          paper.style.clipPath = `polygon(evenodd,0px 0px,${width}px 0px,${width}px ${height}px,0px ${height}px,0px 0px,${hole},${first[0]}px ${first[1]}px,0px 0px)`;
          const path = `M${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;
          edges.forEach((edge) => edge.setAttribute("d", path));
          outline.style.opacity = String(
            Math.min(1, t * 12) * Math.min(1, (1 - t) * 7),
          );
        }
        if (elapsed < duration) frame = requestAnimationFrame(draw);
        else resolve();
      };
      frame = requestAnimationFrame(draw);
    });
  } finally {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", layout);
    stage.remove();
    paper.remove();
  }
}
