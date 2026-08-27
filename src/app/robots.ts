import type { MetadataRoute } from "next";

// Public menu — allow indexing. The API path is not useful to crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
  };
}
