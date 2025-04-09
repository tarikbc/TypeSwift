# TypeSwift

```
████████╗██╗   ██╗██████╗ ███████╗███████╗██╗    ██╗██╗███████╗████████╗
╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝██║    ██║██║██╔════╝╚══██╔══╝
   ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗██║ █╗ ██║██║█████╗     ██║   
   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║██║███╗██║██║██╔══╝     ██║   
   ██║      ██║   ██║     ███████╗███████║╚███╔███╔╝██║██║        ██║   
   ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝        ╚═╝   
```

A real-time multiplayer typing competition game using WebSockets with PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Playing the Game](#playing-the-game)
- [Technical Implementation](#technical-implementation)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Overview

TypeSwift is a fast-paced multiplayer typing competition where players race to type words as quickly and accurately as possible. The game leverages WebSockets to provide real-time synchronization across all connected players, allowing you to see everyone's typing progress as it happens.

The game automatically assigns each player a unique name and avatar, eliminating the need for accounts or sign-ins. Players compete on a level playing field where typing speed and accuracy are the only factors that determine your ranking.

## Features

- **Real-time Multiplayer:** See other players' typing progress in real-time with animated progress bars
- **Automatic Player Profiles:** Each player gets assigned a random name and avatar tied to their device
- **Competitive Gameplay:** Race against others to type words the fastest
- **Dynamic Word Progression:** When the majority of players complete the current word, a new one automatically appears
- **Live Leaderboard:** Real-time updates showing the fastest typists and their WPM (words per minute)
- **Word Per Minute Calculation:** Accurate WPM metrics based on character count and completion time
- **Device Persistence:** Player stats and identity persist between sessions on the same device
- **Responsive Design:** Works on desktop and mobile devices
- **No Account Required:** Jump straight into gameplay without registration or login

## Architecture

TypeSwift uses a modern web architecture with:

```
                 +---------------+
                 |   Web Client  |
                 +-------+-------+
                         |
                         | WebSocket
                         |
                +-------+-------+       +-------------+
                |  Node.js API  | <---> | PostgreSQL  |
                +---------------+       +-------------+
```

- **Frontend:** Vite-powered React client that renders the UI and handles user input
- **Backend:** Node.js server with Socket.io for real-time communication
- **Database:** PostgreSQL with TypeORM for persistent data storage
- **Real-time Development:** Vite for fast, HMR-enabled frontend development

## Project Structure

```
├── client/
│   ├── src/            # Client source code
│   │   ├── components/ # React components
│   │   └── main.jsx    # Main client entry point
│   ├── public/         # Static web assets
│   │   └── index.html  # Main HTML structure
│   └── vite.config.js  # Vite configuration
├── server/
│   ├── src/            # Server source code
│   │   ├── controllers/# API controllers
│   │   ├── models/     # TypeORM models
│   │   ├── services/   # Business logic
│   │   └── index.js    # Server entry point
│   └── package.json    # Server dependencies
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [PostgreSQL](https://www.postgresql.org/download/) (v13 or later)
- [Docker](https://www.docker.com/products/docker-desktop/) (optional, for containerized development)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/typeswift.git
cd typeswift
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Create a PostgreSQL database
createdb typeswift
```

4. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgres://username:password@localhost:5432/typeswift

# Server
PORT=3000
NODE_ENV=development
```

## Development

1. Start Redis and PostgreSQL:

```bash
# Using Docker (recommended)
docker compose up -d postgres

# Or run locally if installed
# PostgreSQL should be running as a service
```

2. Start the development server:

```bash
# Start both client and server in development mode
npm run dev
```

3. Open your browser and navigate to http://localhost:5173

4. For a multiplayer experience, open the same URL in multiple browser windows or share with friends on the same network.

### Customizing the Word List

To customize the word list, modify the `wordList.js` file in the server directory:

```javascript
// server/src/data/wordList.js
module.exports = [
  "your",
  "custom",
  "words",
  "here",
  // ...more words
];
```

## Playing the Game

1. When you open the game, you'll automatically be assigned a random name and avatar.
2. Wait for the current word to appear in the center of the screen.
3. Type the word as quickly and accurately as possible in the input field.
4. Watch your progress and other players' progress in real-time.
5. When you complete the word correctly, your score and WPM will be calculated and added to the leaderboard.
6. When the majority of players complete the word, a new one will appear automatically.
7. Keep playing to improve your WPM score and climb the leaderboard!

## Technical Implementation

### Client-Side

The client uses React with Vite to:

- Connect to the server using Socket.io
- Render the UI and handle user input
- Calculate typing progress and WPM
- Update the display of other players' progress in real-time
- Manage the leaderboard based on player performance

Key components:

- `GameContainer`: Main game component managing game state
- `WordDisplay`: Shows the current word to type
- `PlayerProgress`: Visualizes typing progress for all players
- `Leaderboard`: Shows rankings based on WPM
- `InputField`: Handles user typing input

### Server-Side

The Node.js server with Socket.io:

- Manages WebSocket connections for real-time updates
- Handles player connections and disconnections
- Tracks typing progress for all connected players
- Persists player statistics in PostgreSQL using TypeORM
- Generates new words when the majority complete the current one

Key components:

- Models: `Word`, `Player`, `GameSession`
- Controllers: `gameController`, `playerController`
- Services: `wordService`, `progressTracker`, `statsCalculator`

### Data Flow

1. Player loads the game and connects via Socket.io
2. Server assigns a player ID and shares the current word
3. As the player types, progress updates are sent to the server
4. Server broadcasts these updates to all connected clients via WebSockets
5. When a player completes a word, their stats are updated in PostgreSQL
6. When the majority complete a word, the server generates a new one
7. The cycle continues with the new word

## Building for Production

1. Build the client code:

```bash
npm run build
```

2. The compiled files will be available in the `client/dist` directory.

3. Start the production server:

```bash
npm run start
```

## Troubleshooting

### Connection Issues

- Ensure PostgreSQL is running before starting the server
- Check that the configured ports are not blocked by a firewall
- Try clearing your browser cache and reloading

### Build Problems

- Make sure all dependencies are installed with `npm install`
- Verify environment variables are set correctly
- Check that Node.js version is compatible (v16+)

### Game Performance

- If the game is lagging, try reducing the number of connected clients
- For best performance, use a modern browser like Chrome, Firefox, or Edge

## Future Improvements

- **User Accounts**: Optional accounts for persistent statistics across devices
- **Custom Game Rooms**: Create private games with friends
- **Difficulty Levels**: Word lists of varying difficulty
- **Game Modes**: Time attack, accuracy focus, or endurance modes
- **Mobile Optimization**: Better touch keyboard support for mobile devices
- **Internationalization**: Support for multiple languages
- **Themes**: Light/dark mode and custom themes
- **Sound Effects**: Audio feedback for typing and completion

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## License

MIT
