/** The server takes PNG or JPEG only, and the whole workbook must stay under 5 MB. */
const MAX_SIDE = 800;
const QUALITY = 0.82;

/**
 * Turns any picture the vendor has (JPEG, PNG, WebP…) into a small JPEG that
 * fits in the workbook. Throws when the file is not a readable picture.
 */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || !file.size)
    throw new Error(`${file.name} is not a picture.`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} could not be read as a picture.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Pictures cannot be prepared in this browser.");
  // JPEG has no transparency; a PNG logo would otherwise turn black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error(`${file.name} could not be prepared.`);
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}
