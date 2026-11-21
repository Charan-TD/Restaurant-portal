"use client";
/**
 * New-order alerts with what every browser has built in, so they work on any
 * device without an extra service: a buzz made with Web Audio (no sound file
 * to load), a vibration on phones that support it, and a system notification
 * while the tab is hidden.
 *
 * Browsers only let a page make sound after the person has tapped or typed on
 * it once, so the sound is "unlocked" on the first tap anywhere in the portal.
 */
let context: AudioContext | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function audio() {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** True once the browser lets this page play sound. */
export const soundReady = () => audio()?.state === "running";

/** Lets the page make sound; must run inside a tap, click or key press. */
export async function unlockSound() {
  const ctx = audio();
  if (!ctx) return false;
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  // A silent blip: some phones (iOS) only unlock once a sound has started in the gesture.
  const silent = ctx.createBuffer(1, 1, 22050),
    source = ctx.createBufferSource();
  source.buffer = silent;
  source.connect(ctx.destination);
  source.start(0);
  notify();
  return ctx.state === "running";
}

/** Called when the sound becomes ready, so a "turn on sound" prompt can hide. */
export function onSoundReady(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Each buzz of a ring: when it starts (s) and how long it lasts (s). */
const BUZZES = [
  { at: 0, length: 0.6 },
  { at: 0.85, length: 0.6 },
];
/** One ring, about 1.5 seconds. */
export const RING_SECONDS = 1.45;

/**
 * One ring: two long buzzes with a short gap, like a phone ringing. A
 * square wave through a low-pass filter sounds like a buzzer and carries
 * over kitchen noise better than a soft tone; a slight warble keeps it
 * from sounding flat.
 */
export function playBuzz() {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return false;
  const start = ctx.currentTime + 0.02,
    filter = ctx.createBiquadFilter(),
    gain = ctx.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  gain.gain.value = 0.0001;
  filter.connect(gain).connect(ctx.destination);
  for (const buzz of BUZZES) {
    const osc = ctx.createOscillator(),
      lfo = ctx.createOscillator(),
      depth = ctx.createGain(),
      at = start + buzz.at,
      end = at + buzz.length;
    osc.type = "square";
    osc.frequency.value = 740;
    // A 16 Hz wobble of ±40 Hz: the "brr" of a buzzer.
    lfo.frequency.value = 16;
    depth.gain.value = 40;
    lfo.connect(depth).connect(osc.frequency);
    osc.connect(filter);
    // Quick attack and release, so each buzz is distinct and does not click.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.35, at + 0.03);
    gain.gain.setValueAtTime(0.35, end - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.start(at);
    lfo.start(at);
    osc.stop(end + 0.02);
    lfo.stop(end + 0.02);
  }
  return true;
}

/** Buzzes the phone where the browser allows it (most Android phones; not iPhones), in step with the ring. */
export function vibrate() {
  try {
    navigator.vibrate?.(BUZZES.flatMap((b, i) => [
      ...(i ? [Math.round((b.at - BUZZES[i - 1].at - BUZZES[i - 1].length) * 1000)] : []),
      Math.round(b.length * 1000),
    ]));
  } catch {
    // Not supported: nothing to do.
  }
}

/** Whether system notifications can be shown, or could be after asking. */
export const notificationPermission = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

const ASKED_KEY = "td.askedNotifications";
/**
 * Asks for system notifications, once per browser; must run inside a tap or
 * click. Closing the browser's prompt without choosing leaves the permission
 * on "default", which would otherwise ask again on every page load.
 */
export async function askNotificationPermission() {
  if (notificationPermission() !== "default") return notificationPermission();
  try {
    if (localStorage.getItem(ASKED_KEY)) return "default";
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Storage blocked: ask anyway.
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationPermission();
  }
}

/** A system notification; tapping it brings the portal to the front on the orders page. */
export function showOrderNotification(title: string, body: string, href = "/orders") {
  if (notificationPermission() !== "granted") return;
  try {
    const shown = new Notification(title, { body, tag: "new-order", icon: "/logo.jpg", requireInteraction: true });
    shown.onclick = () => {
      window.focus();
      if (window.location.pathname !== href) window.location.assign(href);
      shown.close();
    };
  } catch {
    // Some phones only allow notifications from an installed app; the sound still plays.
  }
}
