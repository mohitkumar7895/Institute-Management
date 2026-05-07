/**
 * Helpers for capturing an A4 (or A4-landscape) overlay element to JPEG and
 * embedding it in a single-page jsPDF document (smaller than PNG for typical templates).
 *
 * The earlier inline implementation (`toPng(el, { pixelRatio: 2 })`) clipped
 * the right-hand side of the certificate on viewports narrower than 297 mm
 * because it relied on the element's bounding rect at the moment of capture,
 * and did not wait for late-loading images (photo, QR, background).
 *
 * This helper:
 *   1. Waits for every <img> inside the element to finish loading.
 *   2. Waits for document.fonts, extra animation frames, and a short delay so
 *      layout/fonts settle (production CDNs can be slower than localhost).
 *   3. Passes explicit width / height / canvasWidth / canvasHeight to
 *      html-to-image so the full A4 area is rasterised even when the element
 *      overflows the viewport.
 */

export type A4Orientation = "portrait" | "landscape";

const ORIENTATION_TO_MM: Record<A4Orientation, { width: number; height: number }> = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
};

async function waitForImages(el: HTMLElement, timeoutMs = 8000): Promise<void> {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          img.addEventListener("load", finish, { once: true });
          img.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, timeoutMs);
        }),
    ),
  );
  // Let the browser flush any pending paint after images decoded.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Extra settle time for production: `html-to-image` clones the DOM into an SVG
 * foreignObject; webfonts and Tailwind must finish before capture or text can
 * rasterize blank (localhost often wins due to cache / faster `_next` static).
 */
async function waitForFontsAndPaintSettle(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 350));
}

function capturePixelSize(el: HTMLElement): { w: number; h: number } {
  const rect = el.getBoundingClientRect();
  const w = Math.ceil(rect.width) || el.offsetWidth || el.clientWidth;
  const h = Math.ceil(rect.height) || el.offsetHeight || el.clientHeight;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

/** Render `el` (sized to A4 in CSS units) to a single-page PDF and trigger a download. */
export async function downloadElementAsA4Pdf(
  el: HTMLElement,
  fileName: string,
  orientation: A4Orientation = "portrait",
  /** Lower values → smaller PDF; default keeps text sharp on A4 without multi‑MB PNGs. */
  pixelRatio = 1.35,
  jpegQuality = 0.82,
): Promise<void> {
  await waitForImages(el);
  await waitForFontsAndPaintSettle();

  const [{ toJpeg }, { default: jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  const { w, h } = capturePixelSize(el);
  const cw = Math.max(1, Math.round(w * pixelRatio));
  const ch = Math.max(1, Math.round(h * pixelRatio));
  const captureWithHtml2Canvas = async (): Promise<string> => {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      scale: Math.max(1, pixelRatio),
      imageTimeout: 12000,
      logging: false,
      width: w,
      height: h,
    });
    return canvas.toDataURL("image/jpeg", jpegQuality);
  };

  const captureWithHtmlToImage = async (): Promise<string> =>
    toJpeg(el, {
      cacheBust: true,
      pixelRatio,
      quality: jpegQuality,
      width: w,
      height: h,
      canvasWidth: cw,
      canvasHeight: ch,
      backgroundColor: "#ffffff",
      // Avoid broken / cross-origin @font-face inlining on some hosts; overlay
      // text uses explicit system font stacks so capture stays readable.
      skipFonts: true,
      style: {
        transform: "none",
        margin: "0",
      },
    });

  let jpeg: string;
  try {
    // Prefer html2canvas: it captures the already-rendered DOM, so production
    // exports match what users see on screen (text + positioned overlays).
    jpeg = await captureWithHtml2Canvas();
  } catch {
    // Fallback path if canvas capture fails on specific browser/env combinations.
    jpeg = await captureWithHtmlToImage();
  }

  const dims = ORIENTATION_TO_MM[orientation];
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  pdf.addImage(jpeg, "JPEG", 0, 0, dims.width, dims.height);
  const safeName = fileName.trim() || "document";
  pdf.save(safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
}
