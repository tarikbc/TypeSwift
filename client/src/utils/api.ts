import { io, Socket } from 'socket.io-client';

// Determine the server URL based on the environment
const isProduction = import.meta.env.PROD;

// In production, the client and server are served from the same domain
// In development, connect to the local server on port 3001
const SOCKET_SERVER_URL = isProduction 
  ? window.location.origin
  : `http://${window.location.hostname}:3001`;

console.log('Using server URL:', SOCKET_SERVER_URL);

// Singleton pattern for socket connection
let socket: Socket | null = null;

// Get socket instance (creates one if it doesn't exist)
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Important for sending cookies
    });
  }
  return socket;
}

// Close socket connection
export function closeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Fetch the client ID from server
export async function getClientId(): Promise<string> {
  try {
    // Add cache-busting parameter to prevent caching
    const timestamp = new Date().getTime();
    const response = await fetch(`${SOCKET_SERVER_URL}/api/client-id?_=${timestamp}`, {
      credentials: 'include', // Important for sending and receiving cookies
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch client ID');
    }
    
    const data = await response.json();
    console.log('Received client ID from server:', data.clientId);
    return data.clientId;
  } catch (error) {
    console.error('Error fetching client ID:', error);
    return '';
  }
}
