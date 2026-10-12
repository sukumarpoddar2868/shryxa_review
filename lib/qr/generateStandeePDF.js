import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

// import { generateQR } from "@/lib/qr/generateQR";
import { generateQR } from "./generateQR.js";

const TEMPLATES = {
  "4x6": {
    file: "shryxa-standee-4x6.png",
    width: 4 * 72,
    height: 6 * 72,

    // Portrait template: QR in the blank area above the footer.
    qr: {
      centerX: 0.5,
      centerY: 0.75,
      size: 0.40,
    },
  },

  "12x12cm": {
    file: "shryxa-standee-12x12cm.png",
    width: (12 / 2.54) * 72,
    height: (12 / 2.54) * 72,

    // Square template: smaller QR to preserve text and footer spacing.
    qr: {
      centerX: 0.5,
      centerY: 0.72,
      size: 0.30,
    },
  },
};
/**
 * Generate a print-ready standee PDF with a business-specific QR code.
 *
 * @param {string} destinationUrl Shryxa review page URL.
 * @param {"4x6"|"12x12cm"} format PDF format.
 * @returns {Promise<Uint8Array>} PDF bytes.
 */
export async function generateStandeePDF(destinationUrl, format = "4x6") {
  const config = TEMPLATES[format];

  if (!config) {
    throw new Error("INVALID_PDF_FORMAT");
  }

  if (typeof destinationUrl !== "string" || !destinationUrl.trim()) {
    throw new Error("QR_DESTINATION_REQUIRED");
  }

  // Read the selected template from public/standee-templates.
  const templatePath = path.join(
    process.cwd(),
    "public",
    "standee-templates",
    config.file,
  );

  let templateBytes;

  try {
    templateBytes = await readFile(templatePath);
  } catch {
    throw new Error("STANDEE_TEMPLATE_NOT_FOUND");
  }

  // Generate the QR using the saved Shryxa review URL.
  const qrBytes = await generateQR(destinationUrl);

  const pdf = await PDFDocument.create();

  pdf.setTitle("Shryxa Review - Customer Review Standee");
  pdf.setAuthor("Shryxa Review");
  pdf.setSubject(`Print-ready ${format} review QR template`);

  const page = pdf.addPage([config.width, config.height]);

  const template = await pdf.embedPng(templateBytes);
  const qr = await pdf.embedPng(qrBytes);

  // Draw the full template as the page background.
  page.drawImage(template, {
    x: 0,
    y: 0,
    width: config.width,
    height: config.height,
  });

  // Convert normalized coordinates to PDF points.
  // PDF coordinates start at the bottom-left, whereas image
  // coordinates start at the top-left.
  const qrSize = config.width * config.qr.size;
  const qrCenterX = config.width * config.qr.centerX;
  const qrCenterY = config.height * config.qr.centerY;

  const qrX = qrCenterX - qrSize / 2;
  const qrY = config.height - qrCenterY - qrSize / 2;

  // White background provides a clean QR quiet zone.
  const padding = qrSize * 0.035;

  page.drawRectangle({
    x: qrX - padding,
    y: qrY - padding,
    width: qrSize + padding * 2,
    height: qrSize + padding * 2,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qr, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  return pdf.save({
    useObjectStreams: false,
  });
}
