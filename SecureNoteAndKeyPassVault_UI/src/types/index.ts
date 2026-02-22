export interface User {
  email: string;
  name?: string;
  loginMethod: 'email' | 'google';
  memberSince: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordEntry {
  id: string;
  siteName: string;
  username: string;
  password: string;
  url: string;
  serverIp?: string | null;
  hostname?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SortOption = 'recent' | 'oldest' | 'az' | 'za';
