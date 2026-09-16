import {getRequestConfig} from "next-intl/server";
import {cookies} from "next/headers";
export default getRequestConfig(async()=>{const value=(await cookies()).get("olnk-locale")?.value;const locale=value==="tr"?"tr":"en";return{locale,messages:(await import(`../../messages/${locale}.json`)).default};});
