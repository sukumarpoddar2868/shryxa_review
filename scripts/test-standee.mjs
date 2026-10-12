import { writeFile, mkdir } from "node:fs/promises";
import { generateStandeePDF } from "../lib/qr/generateStandeePDF.js";

const outputDirectory = "tmp/standee-preview";

// This is only a visual test URL.
// It does not need to exist or have a real business behind it.
const testDestinationUrl = "http://localhost:3000/review/TEST-QR-PREVIEW";

await mkdir(outputDirectory, { recursive: true });

for (const format of ["4x6", "12x12cm"]) {
  console.log(`Generating ${format} PDF...`);

  const pdfBytes = await generateStandeePDF(testDestinationUrl, format);

  const filename = format === "4x6" ? "standee-4x6.pdf" : "standee-12x12cm.pdf";

  const outputPath = `${outputDirectory}/${filename}`;

  await writeFile(outputPath, pdfBytes);

  console.log(`Saved: ${outputPath}`);
}

console.log("Both sample PDFs generated successfully.");
