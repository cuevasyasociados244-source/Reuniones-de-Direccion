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
    windowWidth: node.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // La imagen se ajusta al ancho de página; la altura se escala proporcional.
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  // JPEG (no PNG): mantiene el texto legible y produce archivos mucho más ligeros.
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
  heightLeft -= pageH;

  // Si el contenido es más alto que una página, se agregan páginas adicionales.
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
