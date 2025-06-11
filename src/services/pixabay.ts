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
  largeImageWidth: number;
  largeImageHeight: number;
  fullHDURL: string;
  imageURL: string;
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
  let apiUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true`;

  if (options.category) {
    apiUrl += `&category=${encodeURIComponent(options.category)}`;
  }

  if (options.perPage) {
    apiUrl += `&per_page=${options.perPage}`;
  }

  const res = await fetch(apiUrl);
  const data = await res.json();
  return data.hits;
}
