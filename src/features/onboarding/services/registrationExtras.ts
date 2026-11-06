"use client";
import { useSyncExternalStore } from "react";
import type { RiderOwner } from "../models/registration";

/**
 * Things a reloaded registration needs that the backend's saved copy does not
 * hand back: which files are already uploaded (it only says so by id), small
 * previews of the logo and cover, and the delivery choice. Previews and the
 * delivery choice live in this browser, per registration; the uploaded-file
 * flags are read from the backend on every load.
 */
export type SavedFile =
  | "logo"
  | "cover"
  | "gst"
  | "pan"
  | "fssai"
  | "identity"
  | "businessProof"
  | "bankProof";

interface Extras {
  registrationId: string;
  riderOwner?: RiderOwner;
  logoPreview?: string;
  coverPreview?: string;
}

const KEY = "td.registrationExtras",
  listeners = new Set<() => void>();
let savedFiles: Partial<Record<SavedFile, boolean>> = {},
  cache: { raw: string | null; value: Extras | null } = { raw: null, value: null };

const notify = () => listeners.forEach((listener) => listener());

function read(): Extras | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw === cache.raw) return cache.value;
  let value: Extras | null = null;
  try {
    value = raw ? (JSON.parse(raw) as Extras) : null;
  } catch {
    // A damaged value is the same as none saved.
  }
  cache = { raw, value };
  return value;
}

/** What is kept for this registration; nothing when it belongs to another one. */
export const extrasFor = (registrationId: string): Extras | null => {
  const extras = read();
  return extras?.registrationId === registrationId ? extras : null;
};

export function rememberExtras(registrationId: string, patch: Partial<Extras>) {
  const next = { ...(extrasFor(registrationId) ?? { registrationId }), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Previews are a nicety; a full or blocked storage just skips them.
  }
  notify();
}

export function forgetExtras() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  savedFiles = {};
  notify();
}

/** Which uploaded files the backend already holds for this registration. */
export function setSavedFiles(files: SavedFile[]) {
  savedFiles = Object.fromEntries(files.map((file) => [file, true]));
  notify();
}

export function markSavedFiles(files: SavedFile[]) {
  savedFiles = {
    ...savedFiles,
    ...Object.fromEntries(files.map((file) => [file, true])),
  };
  notify();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const NO_FILES: Partial<Record<SavedFile, boolean>> = {};

export const useSavedFiles = () =>
  useSyncExternalStore(subscribe, () => savedFiles, () => NO_FILES);

/** The small preview kept for the logo or cover, or "" when there is none. */
export const usePreview = (kind: "logo" | "cover") =>
  useSyncExternalStore(
    subscribe,
    () => {
      const extras = read();
      return (kind === "logo" ? extras?.logoPreview : extras?.coverPreview) ?? "";
    },
    () => "",
  );

/** A small JPEG data URL of a picture, to show it again after a reload. */
export async function makePreview(file: File, maxSide: number): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file),
      scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  }
}
