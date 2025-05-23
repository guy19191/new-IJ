declare module 'yt-search' {
  interface VideoResult {
    url: string;
    videoId: string;
    title: string;
    thumbnail: string;
  }

  interface SearchResult {
    videos: VideoResult[];
  }

  function ytSearch(query: string): Promise<SearchResult>;
  export = ytSearch;
} 