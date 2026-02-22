import { Note, PasswordEntry } from '@/types';
import { secureClient } from './secureNotesClient';

/**
 * API Service that uses SecureNotesClient for all encrypted operations.
 * Data is sent/received encrypted via RSA. The client handles encrypt/decrypt.
 */
export const apiService = {
  // ==================== NOTES ====================

  async getAllNotes(): Promise<Note[]> {
    const encryptedNotes = await secureClient.getAllNotes();
    // Decrypt each note
    const decrypted = await Promise.all(
      encryptedNotes.map((note: any) => secureClient.decryptNote(note))
    );
    return decrypted;
  },

  async createNote(title: string, content: string): Promise<Note> {
    const encryptedNote = await secureClient.createNote(title, content);
    return await secureClient.decryptNote(encryptedNote);
  },

  async updateNote(id: string, title: string, content: string): Promise<Note> {
    const encryptedNote = await secureClient.updateNote(id, title, content);
    return await secureClient.decryptNote(encryptedNote);
  },

  async deleteNote(id: string): Promise<void> {
    await secureClient.deleteNote(id);
  },

  // ==================== PASSWORDS ====================

  async getAllPasswords(): Promise<PasswordEntry[]> {
    const encryptedEntries = await secureClient.getAllPasswordEntries();
    const decrypted = await Promise.all(
      encryptedEntries.map((entry: any) => secureClient.decryptPasswordEntry(entry))
    );
    return decrypted;
  },

  async createPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> {
    const encryptedEntry = await secureClient.createPasswordEntry(
      entry.siteName, entry.username, entry.password, entry.url,
      entry.serverIp || null, entry.hostname || null, entry.notes || null
    );
    return await secureClient.decryptPasswordEntry(encryptedEntry);
  },

  async updatePassword(id: string, entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> {
    const encryptedEntry = await secureClient.updatePasswordEntry(
      id, entry.siteName, entry.username, entry.password, entry.url,
      entry.serverIp || null, entry.hostname || null, entry.notes || null
    );
    return await secureClient.decryptPasswordEntry(encryptedEntry);
  },

  async deletePassword(id: string): Promise<void> {
    await secureClient.deletePasswordEntry(id);
  },
};
