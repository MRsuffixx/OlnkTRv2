"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "~/i18n/config";

const localeSchema = z.enum(SUPPORTED_LOCALES);

export async function setLocalePreference(
  value: string,
): Promise<{ locale: SupportedLocale }> {
  const locale = localeSchema.parse(value);
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
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

  return { locale };
}
