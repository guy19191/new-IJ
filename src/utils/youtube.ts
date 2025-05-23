import ytSearch from 'yt-search';

export interface YouTubeVideo {
  videoUrl: string;
  videoId: string;
  title: string;
  thumbnail: string;
}

export async function findYouTubeVideo(query: string): Promise<YouTubeVideo> {
  try {
    const results = await ytSearch(query);
    const video = results.videos[0];

    if (!video) {
      throw new Error('No video found');
    }

    return {
      videoUrl: video.url,
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail || ''
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    throw new Error('Failed to find YouTube video');
  }
}

export async function searchMultipleVideos(queries: string[]): Promise<YouTubeVideo[]> {
  const videos = await Promise.all(
    queries.map(query => findYouTubeVideo(query))
  );
  return videos;
} 