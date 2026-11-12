import type { DraftItem } from "./types";

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

const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/[\s_-]+/g, " ");
const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");
const baseName = (path: string) => path.split(/[\/]/).pop() ?? path;
const fileKey = (name: string) => baseName(name).trim().toLowerCase();

export interface PhotoMatches {
  matches: Map<string, File>;
  unmatched: string[];
  ambiguous: string[];
  invalid: string[];
}

/**
 * Matches chosen pictures to dishes: first by the sheet's photo-file column
 * (exact file name, or the same name with another extension), otherwise by
 * dish name ("Masala Dosa.jpg" is "Masala Dosa"). A name that fits more than
 * one dish or file is reported, never guessed.
 */
export function matchPhotos(items: DraftItem[], files: File[]): PhotoMatches {
  const matches = new Map<string, File>(),
    unmatched: string[] = [],
    ambiguous: string[] = [],
    invalid: string[] = [];
  for (const file of files) {
    if (!file.size || !file.type.startsWith("image/")) {
      invalid.push(file.name);
      continue;
    }
    if (files.filter((f) => fileKey(f.name) === fileKey(file.name)).length > 1) {
      ambiguous.push(file.name);
      continue;
    }
    let found = items.filter((i) => i.photoFile && fileKey(i.photoFile) === fileKey(file.name));
    if (!found.length)
      found = items.filter(
        (i) =>
          i.photoFile &&
          normalizeName(stripExtension(baseName(i.photoFile))) ===
            normalizeName(stripExtension(file.name)),
      );
    if (!found.length) {
      const stem = normalizeName(stripExtension(file.name));
      if (files.filter((f) => normalizeName(stripExtension(f.name)) === stem).length > 1) {
        ambiguous.push(file.name);
        continue;
      }
      found = items.filter((i) => !i.photoFile && normalizeName(i.name) === stem);
    }
    if (found.length > 1) ambiguous.push(file.name);
    else if (!found.length) unmatched.push(file.name);
    else matches.set(found[0].id, file);
  }
  return { matches, unmatched, ambiguous, invalid };
}
