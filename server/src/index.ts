import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './data-source';
import { UserRepository } from './repository/UserRepository';

dotenv.config();

// Import services
import wordService from './services/wordService';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Cookie and session secret
const cookieSecret = process.env.COOKIE_SECRET || 'typeswift_default_secret';
const PgSession = connectPgSimple(session);

// Get allowed origins based on environment
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, allow the app's own domain and any specified CORS_ORIGIN
    if (process.env.CORS_ORIGIN) {
      return process.env.CORS_ORIGIN;
    }
    // If no CORS_ORIGIN is specified, allow all origins in production
    return true;
  } else {
    // In development, allow local development servers
    return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];
  }
};

// Setup Express middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
}));
app.use(express.json());
app.use(cookieParser(cookieSecret));

// Setup session with PostgreSQL storage
// We'll initialize the session store after database connection is established
let sessionMiddleware: express.RequestHandler;

// Setup Socket.io with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
  },
  transports: ['websocket'],
  pingTimeout: 60000
});

// Client ID cookie name
const CLIENT_ID_COOKIE = 'typeswift_client_id';

// Define player interface
interface Player {
  id: string;        // Socket ID
  clientId: string;  // Persistent client ID
  name: string;
  avatar: number;    // Keep for backward compatibility
  emoji: string;
  progress: number;
  wpm: number;
  bestWpm?: number;  // Best WPM score from database
  latestWpm?: number; // Latest WPM score from database
  position?: number; // Track current character position
}

// List of default emojis for automatic assignment
const DEFAULT_EMOJIS = [
  "😀", "😎", "🚀", "🔥", "⭐", "🌈", "🦄", "🐱", "🐶", "🦊",
  "🦁", "🐯", "🦝", "🐼", "🐨", "🐮", "🐷", "🐸", "🐙", "🦋"
];

// Get a random emoji from the list
function getRandomEmoji(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_EMOJIS.length);
  return DEFAULT_EMOJIS[randomIndex];
}

// Helper function to get or create client ID
function getOrCreateClientId(req: express.Request, res: express.Response): string {
  let clientId = req.signedCookies[CLIENT_ID_COOKIE];
  
  if (!clientId) {
    clientId = uuidv4();
    
    // Set cookie with appropriate options
    res.cookie(CLIENT_ID_COOKIE, clientId, {
      signed: true,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
  }
  
  return clientId;
}

// API endpoint to get client ID
app.get('/api/client-id', (req, res) => {
  const clientId = getOrCreateClientId(req, res);
  res.json({ clientId });
});

// Middleware to handle socket authentication with cookie parsing
io.use(async (socket, next) => {
  try {
    // Parse the cookies from the handshake
    let cookieHeader = socket.handshake.headers.cookie;
    let clientId;
    
    if (cookieHeader) {
      try {
        // Create a mock request object with the cookie header
        const mockReq: any = {
          headers: {
            cookie: cookieHeader
          }
        };
        
        // Create a mock response object
        const mockRes: any = {};
        
        // Create a middleware function to parse cookies
        const cookieParserMiddleware = cookieParser(cookieSecret);
        
        // Execute the middleware synchronously
        cookieParserMiddleware(mockReq, mockRes, () => {});
        
        // Now the cookies should be available in the request object
        const signedCookies = mockReq.signedCookies || {};
        
        // Check if our client ID cookie exists in the signed cookies
        if (signedCookies && signedCookies[CLIENT_ID_COOKIE]) {
          clientId = signedCookies[CLIENT_ID_COOKIE];
          console.log('Found client ID in signed cookies:', clientId);
        } else {
          console.log('Client ID not found in signed cookies');
        }
      } catch (e) {
        console.error('Error parsing cookies:', e);
        // Silent error - will generate a new ID below
      }
    } else {
      console.log('No cookie header found in socket handshake');
    }

    // If no valid client ID was found, generate a new one
    if (!clientId) {
      clientId = uuidv4();
    }
    
    // Store the client ID in the socket data for later use
    socket.data.clientId = clientId;
    
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Track connected players and their last activity time
const connectedPlayers = new Map<string, Player & { lastActivity: number }>();
let currentWord = '';

// Idle timeout in milliseconds (1 minute)
const IDLE_TIMEOUT = 60 * 1000;

// Socket.io connection handler
io.on('connection', async (socket) => {
  try {
    // Get client ID from socket data
    console.log(socket.data.clientId)
    const clientId = socket.data.clientId || uuidv4();
    
    // Initialize player with default values
    let playerName = `Player_${Math.floor(Math.random() * 1000)}`;
    let avatarId = Math.floor(Math.random() * 10) + 1;
    let playerEmoji = getRandomEmoji();
    
    // Try to find existing user in database
    const user = await UserRepository.findOrCreateByClientId(
      clientId,
      playerName,
      playerEmoji
    );
    
    console.log(user)
    // Use data from database if available
    if (user) {
      playerName = user.name;
      playerEmoji = user.emoji;
    }
    
    // Store player data in memory for current session
    const playerId = socket.id;
    connectedPlayers.set(playerId, {
      id: playerId,
      clientId: clientId,
      name: playerName,
      avatar: avatarId,
      emoji: playerEmoji,
      progress: 0,
      wpm: 0,
      bestWpm: user ? user.bestWpm : 0,
      latestWpm: user ? user.latestWpm : 0,
      position: 0,
      lastActivity: Date.now() // Track last activity time
    });

    // Send current game state to the new player
    socket.emit('gameState', {
      currentWord,
      player: connectedPlayers.get(playerId),
      players: Array.from(connectedPlayers.values())
    });

    // Broadcast new player to all connected clients
    io.emit('playerJoined', connectedPlayers.get(playerId));
  } catch (error) {
    console.error('Error handling connection:', error);
  }

  // Update player's last activity time
  const updateActivity = () => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      player.lastActivity = Date.now();
    }
  };

  // Handle profile updates
  socket.on('updateProfile', async (data: { name: string; emoji: string }) => {
    updateActivity();
    try {
      const playerId = socket.id;
      const player = connectedPlayers.get(playerId);
      
      if (player && data.name) {
        // Update player name and emoji in memory
        player.name = data.name.substring(0, 15); // Limit name length
        player.emoji = data.emoji;
        
        // Also update in database for persistence
        await UserRepository.updateProfile(
          player.clientId,
          player.name,
          player.emoji
        );
        
        // Broadcast updated player info to all clients
        io.emit('playerUpdated', {
          playerId,
          name: player.name,
          emoji: player.emoji
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  });

  // Handle fireworks trigger
  socket.on('triggerFireworks', (data: { targetPlayerId: string }) => {
    updateActivity();
    try {
      const { targetPlayerId } = data;
      const sourcePlayerId = socket.id;
      
      // Check if the target player exists
      if (connectedPlayers.has(targetPlayerId)) {
        // Broadcast the fireworks event to all players with source player info
        io.emit('fireworks', { 
          targetPlayerId,
          sourcePlayerId
        });
      }
    } catch (error) {
      console.error('Error handling fireworks trigger:', error);
    }
  });

  // Handle player input
  socket.on('typingProgress', async (data: { progress: number; position?: number; wpm?: number }) => {
    updateActivity();
    try {
      const playerId = socket.id;
      const player = connectedPlayers.get(playerId);

      if (player) {
        player.progress = data.progress;
        
        // Update character position if provided
        if (data.position !== undefined) {
          player.position = data.position;
        }

        // Broadcast progress to all players
        io.emit('playerProgress', {
          playerId,
          progress: data.progress,
          position: player.position
        });

        // If player completed the word, update WPM
        if (data.progress === 100 && data.wpm) {
          player.wpm = data.wpm;
          player.latestWpm = data.wpm;
          
          // Update best WPM if current WPM is higher
          if (!player.bestWpm || data.wpm > player.bestWpm) {
            player.bestWpm = data.wpm;
          }
          
          io.emit('playerWpm', {
            playerId,
            wpm: data.wpm,
            bestWpm: player.bestWpm,
            latestWpm: player.latestWpm
          });
          
          // Update user stats in database
          await UserRepository.updateStats(
            player.clientId,
            data.wpm,
            true // completed word
          );

          // Check if majority of players completed the word
          const completedCount = Array.from(connectedPlayers.values())
            .filter(p => p.progress === 100)
            .length;

          // Only start a new round when a strict majority (more than half) of players have completed the word
          if (completedCount > connectedPlayers.size / 2) {
            startNewRound();
          }
        }
      }
    } catch (error) {
      console.error('Error handling typing progress:', error);
    }
  });

  // Handle heartbeat to keep connection alive
  socket.on('heartbeat', () => {
    updateActivity();
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedPlayers.delete(socket.id);
    io.emit('playerLeft', socket.id);
  });
});

// Start a new round with a new word
async function startNewRound(): Promise<void> {
  currentWord = await wordService.getRandomWord();

  // Reset all players progress
  for (const player of connectedPlayers.values()) {
    player.progress = 0;
  }

  // Set the reveal time: current time + 3 seconds for countdown
  const revealTime = Date.now() + 3000;

  // Broadcast new word to all players with countdown
  io.emit('newWord', {
    word: currentWord,
    players: Array.from(connectedPlayers.values()),
    revealTime: revealTime
  });
}

// Check for idle users every 10 seconds
setInterval(() => {
  const now = Date.now();
  
  // Find idle players
  for (const [socketId, player] of connectedPlayers.entries()) {
    if (now - player.lastActivity > IDLE_TIMEOUT) {
      // Get the socket by ID
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        // Emit idle timeout event to the client
        socket.emit('idleTimeout');
        
        // Disconnect the socket
        socket.disconnect(true);
        
        // Remove from connected players
        connectedPlayers.delete(socketId);
        
        // Notify other players
        io.emit('playerLeft', socketId);
        
        console.log(`Player ${player.name} (${socketId}) disconnected due to inactivity`);
      }
    }
  }
}, 10000);

// Initialize application
(async () => {
  try {
    // Initialize TypeORM connection
    await AppDataSource.initialize();
    console.log("Database connection established successfully");
    
    // Get the underlying pg pool from TypeORM connection
    const pgPool = (AppDataSource.driver.options as any).pool;
    
    // Now initialize the session middleware with the pool
    sessionMiddleware = session({
      store: new PgSession({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: cookieSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      }
    });
    
// Apply the session middleware
app.use(sessionMiddleware);

// In production, serve static files from the client build directory
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the client build directory
  const clientBuildPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  
  // For any other routes, serve the index.html file
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  
  console.log('Serving static files from:', clientBuildPath);
}

// Get first word
currentWord = await wordService.getRandomWord();
console.log('Initial word:', currentWord);

    // Start the server
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Server is accessible at http://localhost:${PORT} and your local network IP`);
      console.log('Using PostgreSQL for data persistence');
    });
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
})();
