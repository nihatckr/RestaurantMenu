import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public menu — allow indexing. The API path is not useful to crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
