import type { FormState } from "./types";

async function renderIframeToPdf(
  url: string,
  filename: string,
  waitMs = 2000
) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

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
        : new Promise((r) => {
            img.onload = r;
            img.onerror = r;
          })
    )
  );

  // Force signature images to render at natural aspect ratio
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

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const imgH = (canvas.height * usableW) / canvas.width;

  let currentY = 0;
  let first = true;

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
      ctx.drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        srcH,
        0,
        0,
        canvas.width,
        srcH
      );
    }

    if (!first) pdf.addPage();
    pdf.addImage(
      sliceCanvas.toDataURL("image/jpeg", 0.85),
      "JPEG",
      margin,
      margin,
      usableW,
      sliceH
    );
    currentY += sliceH;
    first = false;
  }

  pdf.save(filename);
}

function toKebab(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fname(prefix: string, vorname: string, nachname: string) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date}-${[prefix, nachname, vorname].map(toKebab).filter(Boolean).join("-")}.pdf`;
}

export async function generateAllPdfs(state: FormState) {
  const base = window.location.pathname;

  // For each person: Datenschutz + Mitgliedsantrag
  for (let i = 0; i < state.personen.length; i++) {
    const p = state.personen[i];
    await renderIframeToPdf(
      `${base}/pdf/datenschutz?idx=${i}`,
      fname("datenschutz", p.vorname, p.nachname)
    );
    await new Promise((r) => setTimeout(r, 400));
    await renderIframeToPdf(
      `${base}/pdf/antrag?idx=${i}`,
      fname("mitgliedsantrag", p.vorname, p.nachname)
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  // One SEPA form
  const first = state.personen[0];
  await renderIframeToPdf(
    `${base}/pdf/sepa`,
    fname("sepa-mandat", first?.vorname || "", first?.nachname || "")
  );
}
