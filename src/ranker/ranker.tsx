import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Song, Album } from 'src/models/domain';
import useSongs from 'src/lib/useSongs';
import { SongCard } from './songCard';

interface Props {
  artistName: string;
  limit?: number;
}

type Preference = "First" | "Second" | "Equal" | "No Opinion";

type LoadingState = {
  state: "Loading";
};

type ReadyState = {
  state: "Ready";
  songs: Song[];
  albums: Album[];
};

type ComparingState = {
  state: "Comparing";
  currentSong: Song;
  comparisonSong: Song;
  remainingSongs: Song[];
  rankedSongs: Song[];
  lowerBound: number;
  upperBound: number;
};

type CompleteState = {
  state: "Complete";
  rankings: Song[];
  albumRankings: Album[];
};

type State = LoadingState | ReadyState | ComparingState | CompleteState;

export const Ranker: React.FC<Props> = ({ artistName, limit = 10 }) => {
  const { songs, albums, isReady } = useSongs({ artistName, limit, sort: 'random' });

  const [stateHistory, setStateHistory] = useState<State[]>([{ state: "Loading" }]);
  const [showProcess, setShowProcess] = useState(false);

  const state = stateHistory[stateHistory.length - 1];

  const setState = useCallback((newState: State) => {
    setStateHistory((prev) => [...prev, newState]);
  }, []);

  const popState = useCallback(() => {
    setStateHistory((prev) => prev.slice(0, prev.length - 1));
  }, []);

  // Loading state -> Ready state
  useEffect(() => {
    if (isReady && state.state === "Loading") {
      setState({ state: "Ready", songs, albums });
    }
  }, [isReady, state, songs, albums, setState]);

  // Ready state -> Comparing state
  useEffect(() => {
    if (state.state === "Ready") {
      const [firstSong, secondSong, ...restSongs] = state.songs;
      setState({
        state: "Comparing",
        currentSong: secondSong,
        comparisonSong: firstSong,
        remainingSongs: restSongs,
        rankedSongs: [],
        lowerBound: 0,
        upperBound: 1,  // Initialize upperBound to 1 as we start with one ranked song
      });
    }
  }, [state, setState]);

  // Helper function to proceed to the next comparison
  const proceedToNextComparison = useCallback((updatedRankedSongs: Song[], remainingSongs: Song[]) => {
    if (remainingSongs.length === 0) {
      setState({
        state: "Complete",
        rankings: updatedRankedSongs,
        albumRankings: getAlbumRankings(updatedRankedSongs, albums),
      });
    } else {
      const nextSong = remainingSongs[0];
      const nextMidpoint = Math.floor(updatedRankedSongs.length / 2);
      setState({
        state: "Comparing",
        currentSong: nextSong,
        comparisonSong: updatedRankedSongs[nextMidpoint],
        remainingSongs: remainingSongs.slice(1),
        rankedSongs: updatedRankedSongs,
        lowerBound: 0,
        upperBound: updatedRankedSongs.length,
      });
    }
  }, [setState, albums]);

  // Comparing state -> Complete state or next comparison
  const compareSongs = useCallback(
    (preference: Preference) => {
      if (state.state !== "Comparing") return;

      const {
        currentSong,
        remainingSongs,
        rankedSongs,
        lowerBound,
        upperBound,
      } = state;

      let newLowerBound = lowerBound;
      let newUpperBound = upperBound;

      if (preference === "Second") {
        newLowerBound = Math.floor((lowerBound + upperBound) / 2);
      } else if (preference === "First") {
        newUpperBound = Math.floor((lowerBound + upperBound) / 2);
      } else if (preference === "Equal") {
        // Insert at the current position
        const insertIndex = Math.floor((lowerBound + upperBound) / 2);
        const updatedRankedSongs = [
          ...rankedSongs.slice(0, insertIndex),
          currentSong,
          ...rankedSongs.slice(insertIndex)
        ];
        proceedToNextComparison(updatedRankedSongs, remainingSongs);
        return;
      } else if (preference === "No Opinion") {
        // Insert at the end
        const updatedRankedSongs = [...rankedSongs, currentSong];
        proceedToNextComparison(updatedRankedSongs, remainingSongs);
        return;
      }

      if (newUpperBound - newLowerBound <= 1) {
        // We've found the correct position
        const insertIndex = newUpperBound;
        const updatedRankedSongs = [
          ...rankedSongs.slice(0, insertIndex),
          currentSong,
          ...rankedSongs.slice(insertIndex)
        ];
        proceedToNextComparison(updatedRankedSongs, remainingSongs);
      } else {
        // Continue binary search
        const nextMidpoint = Math.floor((newLowerBound + newUpperBound) / 2);
        setState({
          ...state,
          comparisonSong: rankedSongs[nextMidpoint],
          lowerBound: newLowerBound,
          upperBound: newUpperBound,
        });
      }
    },
    [state, proceedToNextComparison, setState]
  );

  const getAlbumRankings = (rankedSongs: Song[], albums: Album[]): Album[] => {
    const albumRankings: { [key: string]: { album: Album; totalRank: number; count: number } } = {};

    rankedSongs.forEach((song, index) => {
      const album = albums.find((album) => album.collectionId === song.collectionId);
      if (album) {
        if (!albumRankings[album.collectionId]) {
          albumRankings[album.collectionId] = { album, totalRank: 0, count: 0 };
        }
        albumRankings[album.collectionId].totalRank += index + 1;
        albumRankings[album.collectionId].count += 1;
      }
    });

    return Object.values(albumRankings)
      .map(({ album, totalRank, count }) => ({
        ...album,
        averageRank: totalRank / count,
      }))
      .sort((a, b) => a.averageRank - b.averageRank);
  };

  const content = useMemo(() => {
    if (state.state === "Loading" || state.state === "Ready") {
      return <p>Loading songs...</p>;
    }

    if (state.state === "Complete") {
      return (
        <div>
          <h2 className="text-xl font-semibold mb-2">Final Song Rankings</h2>
          <ol>
            {state.rankings.map((song, index) => (
              <li key={`${song.trackId}-${index}`}>{`${index + 1}. ${song.trackName}`}</li>
            ))}
          </ol>
          <h2 className="text-xl font-semibold mt-4 mb-2">Album Rankings</h2>
          <ol>
            {state.albumRankings.map((album, index) => (
              <li key={album.collectionId}>{`${index + 1}. ${album.collectionName}`}</li>
            ))}
          </ol>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Which song do you prefer?</h2>
        <div className="flex justify-between gap-4 mb-4">
          <div className="w-1/2">
            <SongCard song={state.currentSong} />
            <Button
              onClick={() => compareSongs('First')}
              className="mt-4 w-full"
              variant="default"
            >
              {state.currentSong.trackName}
            </Button>
          </div>
          <div className="w-1/2">
            <SongCard song={state.comparisonSong} />
            <Button
              onClick={() => compareSongs('Second')}
              className="mt-4 w-full"
              variant="default"
            >
              {state.comparisonSong.trackName}
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <Button onClick={() => compareSongs('Equal')} className="w-full" variant="secondary">
            Equal
          </Button>
          <Button
            onClick={() => compareSongs('No Opinion')}
            className="w-full"
            variant="secondary"
          >
            No Opinion
          </Button>
        </div>
      </div>
    );
  }, [compareSongs, state]);

  const footer = useMemo(() => {
    const handleShare = () => {
      if (state.state !== "Complete") return;
  
      const subject = encodeURIComponent(`${artistName} Song Rankings`);
      let body = `Here are my ${artistName} song rankings:\n\n`;
  
      body += state.rankings.map((song, index) => `${index + 1}. ${song.trackName}`).join('\n');
      
      body += '\n\nAlbum Rankings:\n\n';
      body += state.albumRankings.map((album, index) => `${index + 1}. ${album.collectionName}`).join('\n');
  
      body = encodeURIComponent(body);
  
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }

    if (state.state === "Complete") {
      return (
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} variant="default">
            Restart
          </Button>
          <Button onClick={handleShare} className="ml-2" variant="default">
            Share Rankings
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-4 flex items-center">
        <Button onClick={() => { popState(); }} variant="default" className="ml-2" disabled={state.state === "Comparing" && state.rankedSongs.length === 0}>
          Undo
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <label>Show process</label>
          <input type="checkbox" checked={showProcess} onChange={e => setShowProcess(e.target.checked)} />
        </div>
      </div>
    );
  }, [state, showProcess, artistName, popState]);

  const processContent = useMemo(() => {
    if (state.state === "Comparing" && showProcess) {
      const midpointIndex = Math.floor((state.lowerBound + state.upperBound) / 2);
      const orderedSongs = state.rankedSongs;
    
      // Generate fake list to align the current song
      const placeholders = Array(midpointIndex).fill(null);
    
      return (
        <div className="mt-4 p-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Current Comparison</h3>
          
          <div className="grid grid-cols-2 gap-4 items-start">
  
            {/* Left column: Current song */}
            <div className="flex flex-col items-center">
              {placeholders.map((_, index) => (
                <div key={index} className="h-10" />
              ))}
              <div>
                <p className="text-center text-green-600 font-bold">{state.currentSong.trackName}</p>
              </div>
            </div>
    
            {/* Right column: Ordered songs */}
            <div className="flex flex-col items-center">
              {orderedSongs.map((song, index) => (
                <p
                  key={index}
                  className={`text-center h-10 ${index === midpointIndex ? "text-blue-600 font-bold" : ""}`}
                >
                  {song.trackName}
                </p>
              ))}
            </div>
  
          </div>
        </div>
      );
    }
    return null;
  }, [state, showProcess]);
  
  return (
    <div>
      {content}
      <div className="mt-4">{footer}</div>
      <div className="mt-4">{processContent}</div>
    </div>
  );
};
