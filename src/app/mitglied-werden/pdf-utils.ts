import type { FormState } from "./types";

async function renderToCanvas(url: string, waitMs = 2000) {
  const { default: html2canvas } = await import("html2canvas");

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  await new Promise<void>((r) => {
    iframe.onload = () => r();
    iframe.src = url;
  });
  await new Promise((r) => setTimeout(r, waitMs));

  const doc = iframe.contentDocument!;
  const body = doc.body;
  doc.documentElement.classList.add("pdf-capture");

  await Promise.all(
    Array.from(doc.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((r) => { img.onload = r; img.onerror = r; })
    )
  );

  Array.from(doc.images).forEach((img) => {
    if (img.alt === "Unterschrift" && img.naturalWidth && img.naturalHeight) {
      const h = img.getBoundingClientRect().height || 40;
      const w = (img.naturalWidth / img.naturalHeight) * h;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
    }
  });

  iframe.style.height = body.scrollHeight + "px";
  await new Promise((r) => setTimeout(r, 300));

  const canvas = await html2canvas(body, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: 1050,
    height: body.scrollHeight,
    windowWidth: 1050,
    windowHeight: body.scrollHeight,
  });

  document.body.removeChild(iframe);
  return canvas;
}

function addCanvasToPdf(pdf: InstanceType<typeof import("jspdf").default>, canvas: HTMLCanvasElement, isFirst: boolean) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const imgH = (canvas.height * usableW) / canvas.width;

  let currentY = 0;
  let first = isFirst;

  while (currentY < imgH) {
    const sliceH = Math.min(imgH - currentY, usableH);
    const srcY = (currentY * canvas.width) / usableW;
    const srcH = (sliceH * canvas.width) / usableW;

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.ceil(srcH);
    const ctx = sliceCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    }

    if (!first) pdf.addPage();
    pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, usableW, sliceH);
    currentY += sliceH;
    first = false;
  }
}

function toKebab(s: string) {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateAllPdfs(state: FormState) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const base = window.location.pathname;
  let isFirst = true;

  for (let i = 0; i < state.personen.length; i++) {
    const canvas1 = await renderToCanvas(`${base}/pdf/datenschutz?idx=${i}`);
    addCanvasToPdf(pdf, canvas1, isFirst);
    isFirst = false;

    const canvas2 = await renderToCanvas(`${base}/pdf/antrag?idx=${i}`);
    addCanvasToPdf(pdf, canvas2, false);
  }

  const canvas3 = await renderToCanvas(`${base}/pdf/sepa`);
  addCanvasToPdf(pdf, canvas3, false);

  const first = state.personen[0];
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const name = [first?.nachname, first?.vorname].map(toKebab).filter(Boolean).join("-");
  pdf.save(`${date}-mitgliedsantrag${name ? `-${name}` : ""}.pdf`);
}
