import { ImageProvider } from "@/types/image-provider";
import { UnsplashImageProvider } from "./unsplash-provider";
import { PexelsImageProvider } from "./pexels-provider";
import { CuratedImageProvider } from "./curated-provider";
import { PlaceholderImageProvider } from "./placeholder-provider";

export {
  UnsplashImageProvider,
  PexelsImageProvider,
  CuratedImageProvider,
  PlaceholderImageProvider,
};

/**
 * Returns the currently active Image Provider based on Environment Variables
 * or optional override (e.g. from Admin search UI)
 */
export function getActiveImageProvider(providerOverride?: string | null): ImageProvider {
  const chosen = (providerOverride || process.env.IMAGE_PROVIDER || "curated").toLowerCase();

  switch (chosen) {
    case "unsplash":
      if (process.env.UNSPLASH_ACCESS_KEY) {
        return new UnsplashImageProvider();
      }
      // Fall back to curated if no key
      return new CuratedImageProvider();

    case "pexels":
      if (process.env.PEXELS_API_KEY) {
        return new PexelsImageProvider();
      }
      return new CuratedImageProvider();

    case "placeholder":
      return new PlaceholderImageProvider();

    case "curated":
    default:
      return new CuratedImageProvider();
  }
}

/**
 * Returns available providers for Admin UI selection
 */
export function getAvailableProviderNames(): { id: string; name: string; isConfigured: boolean }[] {
  return [
    {
      id: "curated",
      name: "Curated Local Library",
      isConfigured: true,
    },
    {
      id: "unsplash",
      name: "Unsplash API",
      isConfigured: Boolean(process.env.UNSPLASH_ACCESS_KEY),
    },
    {
      id: "pexels",
      name: "Pexels API",
      isConfigured: Boolean(process.env.PEXELS_API_KEY),
    },
    {
      id: "placeholder",
      name: "Category SVG Fallback",
      isConfigured: true,
    },
  ];
}
