import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Song, Album } from 'src/models/domain';
import useSongs from 'src/lib/useSongs';
import { SongCard } from './songCard';

interface Props {
  artistName: string;
  limit?: number;
}

type ComparisonState = 'Selection 1' | 'Selection 2' | 'Equal' | 'No Opinion';

export const Ranker: React.FC<Props> = ({ artistName, limit = 10 }) => {
  const { songs, albums, isReady } = useSongs({ artistName, limit, sort: 'random' });

  const [rankings, setRankings] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [comparisonSong, setComparisonSong] = useState<Song | null>(null);
  const [remainingSongs, setRemainingSongs] = useState<Song[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Array<{ rankings: Song[]; currentSong: Song | null; comparisonSong: Song | null; remainingSongs: Song[]; votes: Record<string, number>; }>>([]);

  const findInsertionIndex = (song: Song, start: number, end: number): number => {
    if (start >= end) {
      return start;
    }

    const mid = Math.floor((start + end) / 2);
    const comparison = rankings[mid];

    if ((votes[song.trackId] || 0) > (votes[comparison.trackId] || 0) ||
        ((votes[song.trackId] || 0) === (votes[comparison.trackId] || 0) && 
         song.trackName.localeCompare(comparison.trackName) < 0)) {
      return findInsertionIndex(song, start, mid);
    } else {
      return findInsertionIndex(song, mid + 1, end);
    }
  };

  const compare = (preference: ComparisonState): void => {
    if (!currentSong || !comparisonSong) return;

    setHistory(prevHistory => [
      ...prevHistory,
      { rankings, currentSong, comparisonSong, remainingSongs, votes },
    ]);

    let newRankings = [...rankings];
    let newVotes = { ...votes };
    let insertionIndex: number;

    switch (preference) {
      case 'Selection 1':
        newVotes[currentSong.trackId] = (newVotes[currentSong.trackId] || 0) + 1;
        insertionIndex = findInsertionIndex(currentSong, 0, newRankings.length);
        newRankings.splice(insertionIndex, 0, currentSong);
        break;
      case 'Selection 2':
        newVotes[comparisonSong.trackId] = (newVotes[comparisonSong.trackId] || 0) + 1;
        insertionIndex = findInsertionIndex(currentSong, newRankings.indexOf(comparisonSong) + 1, newRankings.length);
        newRankings.splice(insertionIndex, 0, currentSong);
        break;
      case 'Equal':
        newVotes[currentSong.trackId] = (newVotes[currentSong.trackId] || 0) + 1;
        newVotes[comparisonSong.trackId] = (newVotes[comparisonSong.trackId] || 0) + 1;
        insertionIndex = newRankings.indexOf(comparisonSong);
        newRankings.splice(insertionIndex + 1, 0, currentSong);
        break;
      case 'No Opinion':
        newRankings.push(currentSong);
        break;
    }

    setRankings(newRankings);
    setVotes(newVotes);
    setCurrentSong(remainingSongs.length > 0 ? remainingSongs[0] : null);
    setRemainingSongs(remainingSongs.slice(1));

    if (remainingSongs.length === 0) {
      setIsComplete(true);
      setComparisonSong(null);
    } else {
      setComparisonSong(newRankings[Math.floor(newRankings.length / 2)]);
    }
  };

  const undo = (): void => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setRankings(lastState.rankings);
    setCurrentSong(lastState.currentSong);
    setComparisonSong(lastState.comparisonSong);
    setRemainingSongs(lastState.remainingSongs);
    setVotes(lastState.votes);
    setHistory(history.slice(0, history.length - 1));
  };

  const calculateAlbumRankings = (): Array<Album & { averageRank: number; totalVotes: number; }> => {
    return albums
      .map(album => {
        const albumSongs = rankings.filter(song => song.collectionName === album.collectionName);
        const averageRank = albumSongs.reduce((sum, song) => sum + rankings.indexOf(song), 0) / albumSongs.length;
        const totalVotes = albumSongs.reduce((sum, song) => sum + (votes[song.trackId] || 0), 0);
        return { ...album, averageRank, totalVotes };
      })
      .filter(album => album.totalVotes > 0)
      .sort((a, b) => {
        if (a.totalVotes !== b.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        return a.averageRank - b.averageRank;
      });
  };

  const generateShareableContent = (): string => {
    let content = `My ${artistName} Song Rankings:\n\n`;
    rankings.forEach((song, index) => {
      content += `${index + 1}. ${song.trackName} (${votes[song.trackId] || 0} votes)\n`;
    });
    content += '\nAlbum Rankings:\n';
    const albumRankings = calculateAlbumRankings();
    albumRankings.forEach((album, index) => {
      content += `${index + 1}. ${album.collectionName} (${album.totalVotes} total votes)\n`;
    });
    return content;
  };

  const handleShare = async () => {
    const content = generateShareableContent();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artistName} Song Rankings`,
          text: content,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(content)
        .then(() => {
          alert('Rankings copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  const content = useMemo(() => {
    if (!isReady) {
      return <p>Loading songs...</p>;
    }

    if (isComplete) {
      const albumRankings = calculateAlbumRankings();
      return (
        <div>
          <h2 className="text-xl font-semibold mb-2">Final Song Rankings</h2>
          <ol>
            {rankings.map((song, index) => (
              <li key={`${song.trackId}-${index}`}>{`${index + 1}. ${song.trackName} (${votes[song.trackId] || 0} votes)`}</li>
            ))}
          </ol>
          <h2 className="text-xl font-semibold mt-4 mb-2">Album Rankings</h2>
          <ol>
            {albumRankings.map((album, index) => (
              <li key={album.collectionId}>{`${index + 1}. ${album.collectionName} (${album.totalVotes} total votes)`}</li>
            ))}
          </ol>
        </div>
      );
    }

    if (currentSong == null || comparisonSong == null) {
      return <p>Loading...</p>;
    }

    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Which song do you prefer?</h2>
        <div className="flex justify-between gap-4 mb-4">
          <div className='w-1/2'>
            <SongCard song={currentSong} />
            <Button onClick={() => compare('Selection 1')} className='mt-4 w-full' variant="default">{currentSong.trackName}</Button>
          </div>
          <div className='w-1/2'>
            <SongCard song={comparisonSong} />
            <Button onClick={() => compare('Selection 2')} className='mt-4 w-full' variant="default">{comparisonSong.trackName}</Button>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <Button onClick={() => compare('Equal')} className='w-full' variant="secondary">Equal</Button>
          <Button onClick={() => compare('No Opinion')} className='w-full' variant="secondary">No Opinion</Button>
        </div>
      </div>
    );
  }, [currentSong, comparisonSong, rankings, isComplete, isReady, votes, calculateAlbumRankings, compare]);

  useEffect(() => {
    const startRanking = (): void => {
      const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
      const [first, second, ...rest] = shuffledSongs;
      setRankings([first]);
      setCurrentSong(second);
      setRemainingSongs(rest);
      setComparisonSong(first);
      setVotes({ [first.trackId]: 1 });
    };

    if (songs.length > 0 && isReady) {
      startRanking();
    }
  }, [songs, isReady]);

  return (
    <div>
      {content}
      <div className="mt-4">
        {isComplete && (
          <>
            <Button onClick={() => window.location.reload()} variant="default">
              Restart
            </Button>
            <Button onClick={handleShare} className="ml-2" variant="default">
              Share Rankings
            </Button>
          </>
        )}
        {!isComplete && (
          <Button onClick={undo} variant="default" className="ml-2" disabled={history.length === 0}>
            Undo
          </Button>
        )}
      </div>
    </div>
  );
};