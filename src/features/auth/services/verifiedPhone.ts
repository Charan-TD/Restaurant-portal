"use client";
import { useSyncExternalStore } from "react";

const KEY = "td.verifiedPhone",
  listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/**
 * The 10-digit mobile number a new vendor proved with an OTP on the sign-in
 * page. Registration carries it as the vendor's number and does not let it be
 * edited.
 */
export const verifiedPhone = () =>
  typeof window === "undefined" ? "" : (localStorage.getItem(KEY) ?? "");

export function rememberVerifiedPhone(phone: string) {
  localStorage.setItem(KEY, phone);
  notify();
}

export function forgetVerifiedPhone() {
  localStorage.removeItem(KEY);
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

/** The verified number, or "" before one is known (and on the server). */
export const useVerifiedPhone = () =>
  useSyncExternalStore(subscribe, verifiedPhone, () => "");
