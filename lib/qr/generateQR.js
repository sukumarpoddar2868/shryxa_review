import QRCode from "qrcode";

export async function generateQR(destinationUrl) {
  if (typeof destinationUrl !== "string" || !destinationUrl.trim()) {
    throw new Error("A valid QR destination URL is required.");
  }

  const url = new URL(destinationUrl);

  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("The QR destination must use HTTPS.");
  }

  return QRCode.toBuffer(destinationUrl, {
    type: "png",
    errorCorrectionLevel: "H",
    width: 1200,
    margin: 4,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
