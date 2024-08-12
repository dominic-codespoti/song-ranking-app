export interface Song {
  trackId: number;
  trackName: string;
  collectionId: number;
  artistId: number;
  artistName: string;
  collectionName: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
  isStreamable: boolean;
}

export interface Album {
  collectionId: number;
  collectionName: string;
  artistId: number;
  artistName: string;
  collectionViewUrl: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
  songs: Song[];
}
