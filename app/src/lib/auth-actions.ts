"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "sulglass_session";

export async function login(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (senha !== process.env.APP_PASSWORD) {
    redirect(`/login?erro=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, process.env.SESSION_SECRET ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
