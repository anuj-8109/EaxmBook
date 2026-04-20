import { io, Socket } from 'socket.io-client';
import { VITE_API_URL } from './config';

let socket: Socket | null = null;

export const connectSocket = (token?: string) => {
  if (socket?.connected) {
    return socket;
  }

  const serverUrl = VITE_API_URL;
  
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onNewJob = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new_job', callback);
  }
};

export const offNewJob = (callback?: (data: any) => void) => {
  if (socket) {
    socket.off('new_job', callback);
  }
};

export const onNewMaterial = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new_material', callback);
  }
};

export const offNewMaterial = (callback?: (data: any) => void) => {
  if (socket) {
    socket.off('new_material', callback);
  }
};
