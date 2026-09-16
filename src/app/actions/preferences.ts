"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

const localeSchema = z.enum(["en", "tr"]);

export async function setLocalePreference(value: string) {
  const locale = localeSchema.parse(value);
  const cookieStore = await cookies();
  cookieStore.set("olnk-locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const session = await auth();
  if (session?.user.id) {
    await db.user.updateMany({ where: { id: session.user.id }, data: { locale } });
  }
  revalidatePath("/", "layout");
}
