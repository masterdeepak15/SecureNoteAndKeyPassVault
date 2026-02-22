/**
 * RSA Encryption Client for Secure Notes API
 * TypeScript port of SecureNotesClient.js
 * Uses Web Crypto API for cryptographic operations
 */

const API_BASE_URL = '/backend';

export class SecureNotesClient {
  private apiBaseUrl: string;
  sessionId: string | null = null;       // RSA session ID (for encryption/handshake)
  userSessionId: string | null = null;   // User session ID (for heartbeat/session APIs)
  private clientKeyPair: CryptoKeyPair | null = null;
  private serverPublicKey: CryptoKey | null = null;
  authToken: string | null = null;

  constructor(apiBaseUrl: string = API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl;
  }

  // ==================== CRYPTO UTILITIES ====================

  private async generateClientKeyPair(): Promise<CryptoKeyPair> {
    this.clientKeyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
    return this.clientKeyPair;
  }

  private async exportPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const base64 = this.arrayBufferToBase64(exported);
    return `-----BEGIN PUBLIC KEY-----\n${this.formatPem(base64)}\n-----END PUBLIC KEY-----`;
  }

  private async importPublicKeyFromPem(pemKey: string): Promise<CryptoKey> {
    const base64 = pemKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '')
      .trim();

    const binaryDer = this.base64ToArrayBuffer(base64);

    return await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  }

  private async encryptWithPublicKey(plainText: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
    return this.arrayBufferToBase64(encrypted);
  }

  private async decryptWithPrivateKey(encryptedBase64: string, privateKey: CryptoKey): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(encryptedBase64);
    const decrypted = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encrypted);
    return new TextDecoder().decode(decrypted);
  }

  async encryptForServer(plainText: string): Promise<string> {
    if (!this.serverPublicKey) throw new Error('Handshake must be completed first');
    return await this.encryptWithPublicKey(plainText, this.serverPublicKey);
  }

  async decryptFromServer(encryptedBase64: string): Promise<string> {
    if (!this.clientKeyPair) throw new Error('Client key pair not generated');
    return await this.decryptWithPrivateKey(encryptedBase64, this.clientKeyPair.privateKey);
  }

  // ==================== AUTH ====================

  async register(email: string, password: string, confirmPassword: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.authToken = data.token;
    // Store the user session ID (for heartbeat/session APIs)
    if (data.sessionId) {
      this.userSessionId = data.sessionId;
    }
    return data;
  }

  async googleLogin(idToken: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google login failed');
    }

    const data = await response.json();
    this.authToken = data.token;
    if (data.sessionId) {
      this.userSessionId = data.sessionId;
    }
    return data;
  }

  // ==================== HANDSHAKE ====================

  async performHandshake(handshakeData?: { sessionId: string; serverPublicKey: string }) {
    if (!this.authToken) throw new Error('Must be logged in');

    if (handshakeData) {
      this.sessionId = handshakeData.sessionId;
      this.serverPublicKey = await this.importPublicKeyFromPem(handshakeData.serverPublicKey);
    } else {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/handshake/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Handshake initiation failed');
      const data = await response.json();
      this.sessionId = data.sessionId;
      this.serverPublicKey = await this.importPublicKeyFromPem(data.serverPublicKey);
    }

    // Always generate NEW keys for every handshake
    await this.generateClientKeyPair();

    const clientPublicKeyPem = await this.exportPublicKeyToPem(this.clientKeyPair!.publicKey);

    const response = await fetch(`${this.apiBaseUrl}/api/auth/handshake/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        clientPublicKey: clientPublicKeyPem,
      }),
    });

    if (!response.ok) throw new Error('Handshake completion failed');
    console.log('✓ Secure channel established (fresh keys)');
  }

  // ==================== SESSION MANAGEMENT ====================

  async getActiveSessions() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return await response.json();
  }

  async sendHeartbeat() {
    if (!this.userSessionId) return { isValid: false };
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/heartbeat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: this.userSessionId }),
    });
    if (!response.ok) return { isValid: false };
    return await response.json();
  }

  async revokeSession(sessionId: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to revoke session');
    return await response.json();
  }

  async revokeOtherSessions() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/revoke-others`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to revoke other sessions');
    return await response.json();
  }

  async revokeAllSessions() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/revoke-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to revoke all sessions');
    return await response.json();
  }

  async validateSession() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/validate`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) return { isValid: false };
    return await response.json();
  }

  // ==================== NOTES ====================

  async createNote(title: string, content: string) {
    if (!this.sessionId) throw new Error('Session not established');
    const encryptedTitle = await this.encryptForServer(title);
    const encryptedContent = await this.encryptForServer(content);

    const response = await fetch(`${this.apiBaseUrl}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify({ encryptedTitle, encryptedContent }),
    });

    if (!response.ok) throw new Error('Failed to create note');
    return await response.json();
  }

  async getAllNotes() {
    if (!this.sessionId) throw new Error('Session not established');

    const response = await fetch(`${this.apiBaseUrl}/api/notes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'X-Session-Id': this.sessionId,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch notes');
    return await response.json();
  }

  async updateNote(id: string, title: string, content: string) {
    if (!this.sessionId) throw new Error('Session not established');
    const encryptedTitle = await this.encryptForServer(title);
    const encryptedContent = await this.encryptForServer(content);

    const response = await fetch(`${this.apiBaseUrl}/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify({ encryptedTitle, encryptedContent }),
    });

    if (!response.ok) throw new Error('Failed to update note');
    return await response.json();
  }

  async deleteNote(id: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to delete note');
  }

  async decryptNote(encryptedNote: any) {
    return {
      id: encryptedNote.id,
      title: await this.decryptFromServer(encryptedNote.encryptedTitle),
      content: await this.decryptFromServer(encryptedNote.encryptedContent),
      createdAt: encryptedNote.createdAt,
      updatedAt: encryptedNote.updatedAt,
    };
  }

  // ==================== PASSWORDS ====================

  async createPasswordEntry(
    siteName: string, username: string, password: string, url: string,
    serverIp: string | null = null, hostname: string | null = null, notes: string | null = null
  ) {
    if (!this.sessionId) throw new Error('Session not established');

    const body: any = {
      encryptedSiteName: await this.encryptForServer(siteName),
      encryptedUsername: await this.encryptForServer(username),
      encryptedPassword: await this.encryptForServer(password),
      encryptedUrl: await this.encryptForServer(url),
      encryptedServerIp: serverIp ? await this.encryptForServer(serverIp) : null,
      encryptedHostname: hostname ? await this.encryptForServer(hostname) : null,
      encryptedNotes: notes ? await this.encryptForServer(notes) : null,
    };

    const response = await fetch(`${this.apiBaseUrl}/api/passwords`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to create password entry');
    return await response.json();
  }

  async getAllPasswordEntries() {
    if (!this.sessionId) throw new Error('Session not established');

    const response = await fetch(`${this.apiBaseUrl}/api/passwords`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'X-Session-Id': this.sessionId,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch password entries');
    return await response.json();
  }

  async updatePasswordEntry(
    id: string, siteName: string, username: string, password: string, url: string,
    serverIp: string | null = null, hostname: string | null = null, notes: string | null = null
  ) {
    if (!this.sessionId) throw new Error('Session not established');

    const body: any = {
      encryptedSiteName: await this.encryptForServer(siteName),
      encryptedUsername: await this.encryptForServer(username),
      encryptedPassword: await this.encryptForServer(password),
      encryptedUrl: await this.encryptForServer(url),
      encryptedServerIp: serverIp ? await this.encryptForServer(serverIp) : null,
      encryptedHostname: hostname ? await this.encryptForServer(hostname) : null,
      encryptedNotes: notes ? await this.encryptForServer(notes) : null,
    };

    const response = await fetch(`${this.apiBaseUrl}/api/passwords/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to update password entry');
    return await response.json();
  }

  async deletePasswordEntry(id: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/passwords/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to delete password entry');
  }

  async decryptPasswordEntry(encryptedEntry: any) {
    return {
      id: encryptedEntry.id,
      siteName: await this.decryptFromServer(encryptedEntry.encryptedSiteName),
      username: await this.decryptFromServer(encryptedEntry.encryptedUsername),
      password: await this.decryptFromServer(encryptedEntry.encryptedPassword),
      url: await this.decryptFromServer(encryptedEntry.encryptedUrl),
      serverIp: encryptedEntry.encryptedServerIp ? await this.decryptFromServer(encryptedEntry.encryptedServerIp) : null,
      hostname: encryptedEntry.encryptedHostname ? await this.decryptFromServer(encryptedEntry.encryptedHostname) : null,
      notes: encryptedEntry.encryptedNotes ? await this.decryptFromServer(encryptedEntry.encryptedNotes) : null,
      createdAt: encryptedEntry.createdAt,
      updatedAt: encryptedEntry.updatedAt,
    };
  }

  // ==================== UTILITY ====================

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private formatPem(base64: string): string {
    const formatted: string[] = [];
    for (let i = 0; i < base64.length; i += 64) {
      formatted.push(base64.substring(i, i + 64));
    }
    return formatted.join('\n');
  }

  logout() {
    this.authToken = null;
    this.sessionId = null;
    this.userSessionId = null;
    this.clientKeyPair = null;
    this.serverPublicKey = null;
  }
}

// Singleton instance
export const secureClient = new SecureNotesClient();