import React from 'react';
import { Song } from 'src/models/domain';

interface SongCardProps {
  song: Song;
}

export const SongCard: React.FC<SongCardProps> = ({ song }) => {
  return (
    <div className="p-4 border rounded-lg shadow-lg flex flex-col items-center h-72 justify-between">
      <img src={song.artworkUrl100} alt={`${song.trackName} artwork`} className="w-24 h-24 mb-4 rounded-lg" />
      <h3 className="text-lg font-bold mb-1 text-center line-clamp-1">{song.trackName}</h3>
      <p className="text-sm text-gray-500 mb-2 text-center">{song.collectionName}</p>
      <audio controls className="w-full">
        <source src={song.previewUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
