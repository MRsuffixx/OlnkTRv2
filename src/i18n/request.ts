import {getRequestConfig} from "next-intl/server";
import {cookies} from "next/headers";

import { LOCALE_COOKIE_NAME, parseLocale } from "~/i18n/config";

export default getRequestConfig(async () => {
  const value = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  const locale = parseLocale(value);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
