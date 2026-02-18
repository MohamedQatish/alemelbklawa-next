import useSWR from "swr"

interface SiteImage {
  image_key: string
  image_url: string
  alt_text: string
  sort_order: number
}

interface SiteSettingsData {
  settings: Record<string, string>
  images: SiteImage[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSiteSettings() {
  const { data, error, isLoading, mutate } = useSWR<SiteSettingsData>(
    "/api/settings",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, 
      dedupingInterval: 5000,
    }
  )

  const settings = data?.settings ?? {}
  const images = data?.images ?? []

  function getSetting(key: string, fallback = ""): string {
    return settings[key] || fallback
  }

  function getImage(key: string): SiteImage | undefined {
    return images.find((img) => img.image_key === key)
  }

  function getImageUrl(key: string, fallback = "/placeholder.svg"): string {
    const imgUrl = getImage(key)?.image_url;

    if (!imgUrl || imgUrl.trim() === "" || imgUrl.includes("placeholder.svg")) {
      return fallback;
    }

    return imgUrl;
  }


  return {
    settings,
    images,
    getSetting,
    getImage,
    getImageUrl,
    isLoading,
    error,
    mutate,
  }
}