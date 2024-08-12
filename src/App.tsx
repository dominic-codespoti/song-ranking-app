import React, { useMemo } from 'react';
import { Ranker } from './ranker/ranker';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

function App() {
  const [artist, setArtist] = React.useState<string>('');
  const [limit, setLimit] = React.useState<number | undefined>(undefined);
  const [start, setStart] = React.useState<boolean>(false);
  const [taylorSwiftMode, setTaylorSwiftMode] = React.useState<boolean>(false);

  const content = useMemo(() => {
    if (!start) {
      return (
        <div className='gap-4 flex flex-col'>
          {!taylorSwiftMode && (
            <p>
              Enter an artist name and the amount of songs you want to rank to get started!
            </p>
          )}
          {taylorSwiftMode && (
            <p>
              Taylor Swift mode is enabled. Click 'Start' to rank Taylor Swift's songs.
            </p>
          )}
          <Input
            type="text"
            placeholder="Enter an artist name"
            value={taylorSwiftMode ? 'Taylor Swift' : artist}
            disabled={taylorSwiftMode}
            onChange={(e) => setArtist(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Enter a max amount of songs"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          />
          <Button disabled={limit == null || isNaN(limit)} onClick={() => setStart(true)}>Start</Button>
        </div>
      );
    }

    return <Ranker artistName={taylorSwiftMode ? "Taylor Swift" : artist} limit={limit} />;
  }, [start, artist, limit, taylorSwiftMode]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <div className="flex flex-row align-middle content-center justify-between">
            <h1 className="mt-4 text-3xl font-bold mb-4">Song Ranking Tool</h1>
            <div className="flex items-center mb-auto mt-auto">
              <input
                type="checkbox"
                id="taylorSwiftMode"
                checked={taylorSwiftMode}
                onChange={() => {
                  setTaylorSwiftMode(!taylorSwiftMode);
                }}
              />
              <label htmlFor="taylorSwiftMode" className="ml-2">Taylor Swift Mode</label>
            </div>
          </div>
          <p className="mb-6">
            Rank songs by selecting your preference between two options, or choose 'Equal' if you can't decide. Select 'No Opinion' to rank the song last.
          </p>
          {content}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
