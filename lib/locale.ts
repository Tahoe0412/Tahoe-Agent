import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY, type Locale } from "@/lib/locale-copy";

export { copy, LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, type Locale } from "@/lib/locale-copy";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE_KEY)?.value;
  return locale === "en" ? "en" : "zh";
}
