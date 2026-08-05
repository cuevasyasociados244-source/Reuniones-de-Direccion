// Descarga en un clic de un nodo del DOM como archivo PDF.
// Rasteriza el nodo con html2canvas y lo pagina en A4 con jsPDF.
// Las librerías se importan dinámicamente para no cargarlas hasta que se usan.
export async function descargarNodoComoPdf(node: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, jspdf] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const jsPDF = jspdf.jsPDF;

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const ctx = canvas.getContext("2d");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Altura (en px de canvas) que cabe en una página A4 a todo el ancho.
  const pxPorPagina = (canvas.width * pageH) / pageW;

  // Corta la imagen larga en páginas, pero evitando partir tarjetas/párrafos:
  // cerca de cada límite de página busca hacia arriba una fila "en blanco"
  // (el espacio entre tarjetas) y corta ahí.
  const cortes: number[] = [0];
  let y = 0;
  while (y + pxPorPagina < canvas.height) {
    const ideal = y + pxPorPagina;
    // No retroceder más de ~35% de la página buscando un hueco.
    const minCorte = y + pxPorPagina * 0.65;
    const corte = ctx ? filaEnBlancoHaciaArriba(ctx, canvas.width, ideal, minCorte) : ideal;
    cortes.push(corte);
    y = corte;
  }
  cortes.push(canvas.height);

  for (let p = 0; p < cortes.length - 1; p++) {
    const y0 = cortes[p];
    const sliceH = cortes[p + 1] - y0;
    if (sliceH <= 0) continue;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;
    const pctx = pageCanvas.getContext("2d");
    if (pctx) {
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(0, 0, canvas.width, sliceH);
      pctx.drawImage(canvas, 0, y0, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    }
    // JPEG (no PNG): texto legible y archivos mucho más ligeros.
    const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);
    const hPt = (sliceH / canvas.width) * pageW; // <= pageH por construcción

    if (p > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, hPt);
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

// Busca, desde `ideal` hacia arriba y sin pasar de `minCorte`, una fila cuyos
// píxeles sean casi todos blancos (el hueco entre tarjetas). Devuelve esa fila,
// o `ideal` si no encuentra ninguna (p. ej. una tarjeta más alta que la página).
function filaEnBlancoHaciaArriba(
  ctx: CanvasRenderingContext2D,
  width: number,
  ideal: number,
  minCorte: number
): number {
  const top = Math.max(0, Math.floor(minCorte));
  const alto = Math.ceil(ideal) - top;
  if (alto <= 0) return Math.floor(ideal);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, top, width, alto).data;
  } catch {
    return Math.floor(ideal);
  }

  for (let fila = alto - 1; fila >= 0; fila--) {
    const base = fila * width * 4;
    let noBlancos = 0;
    for (let x = 0; x < width; x += 3) {
      const i = base + x * 4;
      if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) {
        noBlancos++;
        if (noBlancos > 4) break;
      }
    }
    if (noBlancos <= 4) return top + fila;
  }
  return Math.floor(ideal);
}
