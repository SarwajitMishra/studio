// src/services/pixabay.ts

interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

interface SearchImagesOptions {
  category?: string;
  perPage?: number;
}

export async function searchImages(
  query: string,
  apiKey: string,
  options: SearchImagesOptions = {}
): Promise<PixabayImage[]> {
  if (!apiKey) {
    console.warn(
      "Pixabay API key is missing. Add NEXT_PUBLIC_PIXABAY_API_KEY to your environment variables. Falling back to placeholder images."
    );
    return [];
  }

  let apiUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=illustration&orientation=horizontal&safesearch=true`;

  if (options.category) {
    apiUrl += `&category=${encodeURIComponent(options.category)}`;
  }

  if (options.perPage) {
    apiUrl += `&per_page=${options.perPage}`;
  }

  try {
    const res = await fetch(apiUrl);

    // Check if the HTTP response status is OK (e.g., 200)
    if (!res.ok) {
      console.error(`Pixabay API error for query "${query}": ${res.status} ${res.statusText}`);
      // Return an empty array to prevent the app from crashing on a non-JSON response.
      return [];
    }

    const data: PixabayResponse = await res.json();
    return data.hits;

  } catch (error) {
    // This will catch network errors or if res.json() fails for other reasons
    console.error(`Failed to fetch or parse from Pixabay for query "${query}":`, error);
    return [];
  }
}
