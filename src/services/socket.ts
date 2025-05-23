import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { authenticateJWT } from '../middleware/auth';
import { SocketUser } from '../types';

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await authenticateJWT({ headers: { authorization: `Bearer ${token}` } } as any, {} as any, () => {});
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_event', (eventId: string) => {
        const userId = socket.data.user.id;
        this.connectedUsers.set(socket.id, { userId, eventId, socketId: socket.id });
        socket.join(eventId);
        this.io.to(eventId).emit('guest_joined', { userId });
      });

      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          this.io.to(user.eventId).emit('guest_left', { userId: user.userId });
          this.connectedUsers.delete(socket.id);
        }
      });

      // Event-specific handlers
      socket.on('vote_track', (data: { eventId: string; trackId: string; voteType: 'like' | 'dislike' }) => {
        this.io.to(data.eventId).emit('vote_update', {
          trackId: data.trackId,
          userId: socket.data.user.id,
          voteType: data.voteType
        });
      });

      socket.on('suggest_track', (data: { eventId: string; query: string }) => {
        this.io.to(data.eventId).emit('suggestions_updated', {
          userId: socket.data.user.id,
          query: data.query
        });
      });

      socket.on('skip_track', (eventId: string) => {
        this.io.to(eventId).emit('track_skipped');
      });

      socket.on('remove_track', (data: { eventId: string; trackId: string }) => {
        this.io.to(data.eventId).emit('track_removed', {
          trackId: data.trackId
        });
      });

      socket.on('set_energy', (data: { eventId: string; energy: number }) => {
        this.io.to(data.eventId).emit('energy_changed', {
          energy: data.energy
        });
      });
    });
  }

  public emitToEvent(eventId: string, event: string, data: any) {
    this.io.to(eventId).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userId === userId)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }
} 