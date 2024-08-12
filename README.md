# Song Ranking App

## Overview

The Song Ranking App allows users to rank songs by comparing them in pairs. Users make choices between two songs to determine their preference, and the app sorts the songs accordingly. The app also generates rankings for albums based on the ranked songs.

## Features

- **Song Comparison**: Users compare two songs at a time and indicate their preference.
- **Equal Option**: Users can rank two songs as equal in preference.
- **No Opinion Option**: Users can choose not to express an opinion about a song.
- **Ranking**: The app continuously updates the rankings of songs based on user choices.
- **Album Rankings**: After all songs are ranked, the app provides album rankings based on the average song ranks.

## Installation

To get started with the Song Ranking App, clone the repository and install the dependencies:

```
git clone <repository-url>
cd <repository-directory>
npm install
```

## Usage

### Starting the App

Run the development server:

```
npm start
```

Navigate to `http://localhost:3000` in your web browser to access the app.

## Acceptance Criteria

1. **Initial Display**: When the app opens, two random songs from a predefined set are displayed, and users can select between four options: Selection 1, Selection 2, Equal, and No Opinion.
2. **Song Ranking**: Clicking on a song ranks it higher than the other option.
3. **Repetition**: New songs are shown repeatedly until they are correctly positioned in the ranking.
4. **Equal Ranking**: Clicking on "Equal" ranks the two compared songs equally.
5. **No Opinion**: Clicking on "No Opinion" ranks the song last.
6. **Completion**: The process repeats until all songs are ranked.
7. **Final Rankings**: Displays a list of all songs in ranked order.
8. **Album Rankings**: Shows rankings based on albums in a separate list below the final song rankings.
