import { useEffect, useState } from 'react';
import { Album, Song } from 'src/models/domain';

export interface AppleMusicResponse {
    resultCount: number
    results: AppleMusicResult[]
  }
  
  export interface AppleMusicResult {
    wrapperType: string
    kind: string
    artistId: number
    collectionId: number
    trackId: number
    artistName: string
    collectionName: string
    trackName: string
    collectionCensoredName: string
    trackCensoredName: string
    artistViewUrl: string
    collectionViewUrl: string
    trackViewUrl: string
    previewUrl: string
    artworkUrl30: string
    artworkUrl60: string
    artworkUrl100: string
    collectionPrice: number
    trackPrice: number
    releaseDate: string
    collectionExplicitness: string
    trackExplicitness: string
    discCount: number
    discNumber: number
    trackCount: number
    trackNumber: number
    trackTimeMillis: number
    country: string
    currency: string
    primaryGenreName: string
    isStreamable: boolean
    contentAdvisoryRating?: string
    collectionArtistId?: number
    collectionArtistName?: string
  }

  
interface UseSongsResult {
  songs: Song[];
  albums: Album[];
  isReady: boolean;
}

interface Props {
  artistName: string;
  limit?: number;
  sort?: 'standard' | 'random';
}

const useSongs = ({ artistName, limit = 50, sort = 'standard' }: Props): UseSongsResult => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const fetchSongsAndAlbums = async () => {
      try {
        // Fetch songs for the artist
        const songsResponse = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=${300}`
        );
        const fetchedSongs = await songsResponse.json() as AppleMusicResponse;

        // Fetch albums for the artist
        const albumsResponse = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=${300}`
        );
        const fetchedAlbums = await albumsResponse.json() as AppleMusicResponse;

        // Map albums to include their respective songs
        const albumsWithSongs = fetchedAlbums.results
          .filter((album: AppleMusicResult) => album.artistName.trim().toLowerCase() === artistName.trim().toLowerCase())
          .map((album: AppleMusicResult) => ({
            collectionId: album.collectionId,
            collectionName: album.collectionName,
            artistId: album.artistId,
            artistName: album.artistName,
            collectionViewUrl: album.collectionViewUrl,
            artworkUrl100: album.artworkUrl100,
            releaseDate: album.releaseDate,
            primaryGenreName: album.primaryGenreName,
            songs: fetchedSongs.results.filter((song: AppleMusicResult) => song.collectionName === album.collectionName).map((song: AppleMusicResult) => ({
              trackId: song.trackId,
              trackName: song.trackName,
              collectionId: song.collectionId,
              artistId: song.artistId,
              artistName: song.artistName,
              collectionName: song.collectionName,
              trackViewUrl: song.trackViewUrl,
              previewUrl: song.previewUrl,
              artworkUrl100: song.artworkUrl100,
              releaseDate: song.releaseDate,
              primaryGenreName: song.primaryGenreName,
              isStreamable: song.isStreamable,
            })),
          }));

        let allSongs = albumsWithSongs.flatMap(album => album.songs);

        if (sort === 'random') {
          allSongs = allSongs.sort(() => Math.random() - 0.5);
        }

        allSongs = allSongs.slice(0, limit);

        setSongs(allSongs);
        setAlbums(albumsWithSongs);
      } catch (error) {
        console.error("Failed to fetch songs and albums", error);
      }
    };

    fetchSongsAndAlbums().then(() => setIsReady(true));
  }, [artistName]);

  return { songs, albums, isReady };
};

export default useSongs;
