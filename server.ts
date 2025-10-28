// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0'; // Listen on all network interfaces

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://localhost:${currentPort}`);
      console.log(`> Network: Available on all network interfaces (0.0.0.0:${currentPort})`);
      console.log(`> Socket.IO server running at ws://localhost:${currentPort}/api/socketio`);
      
      // Try to get local IP for easier access
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      console.log('\n> Access from other devices:');
      Object.keys(networkInterfaces).forEach((name) => {
        networkInterfaces[name]?.forEach((net) => {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  - http://${net.address}:${currentPort}`);
          }
        });
      });
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
