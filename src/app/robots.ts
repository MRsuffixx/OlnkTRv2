import type { MetadataRoute } from "next";

import { env } from "~/env";
import { buildRobotsPolicy } from "~/server/seo/policy";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsPolicy(env.APP_URL);
}
