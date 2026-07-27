"use client";

import { useEffect, useState } from "react";

/**
 * Admin "view mode" toggle, modelled on Sauti Salama's role switcher.
 *
 * Whether an account *is* a Hub admin lives in the database (profiles.is_hub_admin).
 * Whether that admin is currently *viewing* the admin console is a device-local
 * preference kept in localStorage, so it survives sign-out and sign-in on the
 * same device. A custom event keeps every mounted component (sidebar, profile,
 * topbar) in sync without a full reload.
 */
export const ADMIN_MODE_KEY = "whrd-admin-mode";
export const ADMIN_MODE_EVENT = "whrd-admin-mode-changed";

export function getAdminMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAdminMode(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_MODE_KEY, on ? "true" : "false");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ADMIN_MODE_EVENT));
}

/** Reactive hook returning the current admin view mode. */
export function useAdminMode(): boolean {
  const [mode, setMode] = useState(false);

  useEffect(() => {
    const sync = () => setMode(getAdminMode());
    sync();
    window.addEventListener(ADMIN_MODE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ADMIN_MODE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return mode;
}
