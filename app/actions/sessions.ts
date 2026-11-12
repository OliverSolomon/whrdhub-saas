"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";

/**
 * "Where you are signed in", for the profile page.
 *
 * Sessions belong to the sign-in service (Neon Auth), so they are listed and
 * ended through it. Each call acts only on the signed-in person's own sessions.
 */

export interface DeviceSession {
  id: string;
  created_at: string;
  refreshed_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
}

interface RawSession {
  id: string;
  token: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

async function rawSessions(): Promise<{ list: RawSession[]; currentId: string | null }> {
  const [{ data: current }, { data: all }] = await Promise.all([auth.getSession(), auth.listSessions()]);
  const currentId = (current as { session?: { id?: string } } | null)?.session?.id ?? null;
  return { list: ((all ?? []) as unknown as RawSession[]), currentId };
}

const iso = (d: string | Date) => new Date(d).toISOString();

export async function listSessions(): Promise<DeviceSession[]> {
  try {
    const { list, currentId } = await rawSessions();
    return list
      .map((s) => ({
        id: s.id,
        created_at: iso(s.createdAt),
        refreshed_at: iso(s.updatedAt),
        user_agent: s.userAgent ?? null,
        ip: s.ipAddress ?? null,
        is_current: s.id === currentId,
      }))
      .sort((a, b) => Number(b.is_current) - Number(a.is_current) || b.refreshed_at.localeCompare(a.refreshed_at));
  } catch (e) {
    console.error("[sessions] could not list", (e as Error).message);
    return [];
  }
}

export async function revokeSession(id: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    // The page knows a session by its id; the sign-in service ends it by its token.
    const { list } = await rawSessions();
    const target = list.find((s) => s.id === id);
    if (!target) return { error: "That device is already signed out." };
    const { error } = await auth.revokeSession({ token: target.token });
    if (error) return { error: "Could not sign that device out. Please try again." };
  } catch {
    return { error: "Could not sign that device out. Please try again." };
  }
  revalidatePath("/profile");
  return { ok: true };
}

export async function revokeOtherSessions(): Promise<{ ok?: boolean; error?: string; count?: number }> {
  try {
    const { list, currentId } = await rawSessions();
    const others = list.filter((s) => s.id !== currentId).length;
    const { error } = await auth.revokeOtherSessions();
    if (error) return { error: "Could not sign the other devices out. Please try again." };
    revalidatePath("/profile");
    return { ok: true, count: others };
  } catch {
    return { error: "Could not sign the other devices out. Please try again." };
  }
}
