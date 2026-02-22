/**
 * RSA Encryption Client for Secure Notes API
 * Handles all client-side RSA encryption/decryption operations
 * Uses Web Crypto API for cryptographic operations
 */
class SecureNotesClient {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.sessionId = null;
        this.clientKeyPair = null;
        this.serverPublicKey = null;
        this.authToken = null;
    }

    /**
     * Generates RSA key pair for the client
     */
    async generateClientKeyPair() {
        this.clientKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true, // extractable
            ["encrypt", "decrypt"]
        );
        return this.clientKeyPair;
    }

    /**
     * Exports public key to PEM format
     */
    async exportPublicKeyToPem(publicKey) {
        const exported = await window.crypto.subtle.exportKey("spki", publicKey);
        const exportedAsBase64 = this.arrayBufferToBase64(exported);
        return `-----BEGIN PUBLIC KEY-----\n${this.formatPem(exportedAsBase64)}\n-----END PUBLIC KEY-----`;
    }

    /**
     * Imports public key from PEM format
     */
    async importPublicKeyFromPem(pemKey) {
        // Remove PEM headers and all whitespace/newlines
        let base64 = pemKey
            .replace(/-----BEGIN PUBLIC KEY-----/g, '')
            .replace(/-----END PUBLIC KEY-----/g, '')
            .replace(/\s/g, '')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .trim();
        
        const binaryDer = this.base64ToArrayBuffer(base64);
        
        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["encrypt"]
        );
    }

    /**
     * Encrypts data using RSA public key
     */
    async encryptWithPublicKey(plainText, publicKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            data
        );
        
        return this.arrayBufferToBase64(encrypted);
    }

    /**
     * Decrypts data using RSA private key
     */
    async decryptWithPrivateKey(encryptedBase64, privateKey) {
        const encrypted = this.base64ToArrayBuffer(encryptedBase64);
        
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    /**
     * User Registration
     */
    async register(email, password, confirmPassword) {
        const response = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, confirmPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return await response.json();
    }

    /**
     * User Login
     */
    async login(email, password) {
        const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        this.authToken = data.token;
        return data;
    }

    /**
     * Google Login - Login with Google ID token
     */
    async googleLogin(idToken) {
        const response = await fetch(`${this.apiBaseUrl}/api/auth/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idToken })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Google login failed');
        }

        const data = await response.json();
        this.authToken = data.token;
        return data;
    }

    /**
     * Initiates RSA handshake with server (like TCP handshake)
     */
    async initiateHandshake() {
        if (!this.authToken) {
            throw new Error('User must be logged in to initiate handshake');
        }

        try {
            // Generate client key pair
            await this.generateClientKeyPair();
            console.log('✓ Client key pair generated');

            // Request server's public key
            const response = await fetch(`${this.apiBaseUrl}/api/auth/handshake/initiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            this.sessionId = data.sessionId;
            console.log('✓ Received server public key');
            console.log('Server Public Key (first 100 chars):', data.serverPublicKey.substring(0, 100));
            
            // Import server's public key
            this.serverPublicKey = await this.importPublicKeyFromPem(data.serverPublicKey);
            console.log('✓ Server public key imported successfully');

            return data;
        } catch (error) {
            console.error('Handshake initiation failed:', error);
            throw error;
        }
    }

    /**
     * Completes RSA handshake by sending client's public key to server
     */
    async completeHandshake() {
        if (!this.sessionId || !this.clientKeyPair) {
            throw new Error('Must initiate handshake first');
        }

        try {
            const clientPublicKeyPem = await this.exportPublicKeyToPem(this.clientKeyPair.publicKey);
            console.log('✓ Client public key exported to PEM');
            console.log('Client Public Key (first 100 chars):', clientPublicKeyPem.substring(0, 100));

            const response = await fetch(`${this.apiBaseUrl}/api/auth/handshake/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    clientPublicKey: clientPublicKeyPem
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✓ Handshake completed successfully');
            return result;
        } catch (error) {
            console.error('Handshake completion failed:', error);
            throw error;
        }
    }

    /**
     * Full handshake process (initiate + complete)
     */
    async performHandshake() {
        await this.initiateHandshake();
        await this.completeHandshake();
        console.log('Secure channel established!');
    }

    /**
     * Encrypts data for transmission to server
     */
    async encryptForServer(plainText) {
        if (!this.serverPublicKey) {
            throw new Error('Handshake must be completed first');
        }
        return await this.encryptWithPublicKey(plainText, this.serverPublicKey);
    }

    /**
     * Decrypts data received from server
     */
    async decryptFromServer(encryptedBase64) {
        if (!this.clientKeyPair) {
            throw new Error('Client key pair not generated');
        }
        return await this.decryptWithPrivateKey(encryptedBase64, this.clientKeyPair.privateKey);
    }

    // ==================== NOTES API ====================

    /**
     * Creates a new note (encrypts title and content before sending)
     */
    async function createNote(title, content) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const encryptedTitle = await this.encryptForServer(title);
        const encryptedContent = await this.encryptForServer(content);

        const response = await fetch(`${this.apiBaseUrl}/api/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                'X-Session-Id': this.sessionId  // Send session ID in header
            },
            body: JSON.stringify({
                encryptedTitle,
                encryptedContent
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create note');
        }

        const encryptedNote = await response.json();
        return await this.decryptNote(encryptedNote);
    }

    /**
     * Gets all notes and decrypts them
     */
    async getAllNotes() {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const response = await fetch(`${this.apiBaseUrl}/api/notes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'X-Session-Id': this.sessionId
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }

        const encryptedNotes = await response.json();
        return await Promise.all(encryptedNotes.map(note => this.decryptNote(note)));
    }

    /**
     * Gets a specific note by ID and decrypts it
     */
    async getNoteById(id) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const response = await fetch(`${this.apiBaseUrl}/api/notes/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'X-Session-Id': this.sessionId
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch note');
        }

        const encryptedNote = await response.json();
        return await this.decryptNote(encryptedNote);
    }

    /**
     * Updates a note (encrypts new data before sending)
     */
    async updateNote(id, title, content) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const encryptedTitle = await this.encryptForServer(title);
        const encryptedContent = await this.encryptForServer(content);

        const response = await fetch(`${this.apiBaseUrl}/api/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                'X-Session-Id': this.sessionId
            },
            body: JSON.stringify({
                encryptedTitle,
                encryptedContent
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update note');
        }

        const encryptedNote = await response.json();
        return await this.decryptNote(encryptedNote);
    }

    /**
     * Deletes a note
     */
    async deleteNote(id) {
        const response = await fetch(`${this.apiBaseUrl}/api/notes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete note');
        }
    }

    /**
     * Decrypts a note object
     */
    async decryptNote(encryptedNote) {
        return {
            id: encryptedNote.id,
            title: await this.decryptFromServer(encryptedNote.encryptedTitle),
            content: await this.decryptFromServer(encryptedNote.encryptedContent),
            createdAt: encryptedNote.createdAt,
            updatedAt: encryptedNote.updatedAt
        };
    }

    // ==================== PASSWORD MANAGER API ====================

    /**
     * Creates a new password entry (encrypts all fields before sending)
     */
    async createPasswordEntry(siteName, username, password, url, serverIp = null, hostname = null, notes = null) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const encryptedSiteName = await this.encryptForServer(siteName);
        const encryptedUsername = await this.encryptForServer(username);
        const encryptedPassword = await this.encryptForServer(password);
        const encryptedUrl = await this.encryptForServer(url);
        const encryptedServerIp = serverIp ? await this.encryptForServer(serverIp) : null;
        const encryptedHostname = hostname ? await this.encryptForServer(hostname) : null;
        const encryptedNotes = notes ? await this.encryptForServer(notes) : null;

        const response = await fetch(`${this.apiBaseUrl}/api/passwords`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                'X-Session-Id': this.sessionId
            },
            body: JSON.stringify({
                encryptedSiteName,
                encryptedUsername,
                encryptedPassword,
                encryptedUrl,
                encryptedServerIp,
                encryptedHostname,
                encryptedNotes
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create password entry');
        }

        const encryptedEntry = await response.json();
        return await this.decryptPasswordEntry(encryptedEntry);
    }

    /**
     * Gets all password entries and decrypts them
     */
    async getAllPasswordEntries() {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const response = await fetch(`${this.apiBaseUrl}/api/passwords`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'X-Session-Id': this.sessionId
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch password entries');
        }

        const encryptedEntries = await response.json();
        return await Promise.all(encryptedEntries.map(entry => this.decryptPasswordEntry(entry)));
    }

    /**
     * Gets a specific password entry by ID and decrypts it
     */
    async getPasswordEntryById(id) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const response = await fetch(`${this.apiBaseUrl}/api/passwords/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'X-Session-Id': this.sessionId
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch password entry');
        }

        const encryptedEntry = await response.json();
        return await this.decryptPasswordEntry(encryptedEntry);
    }

    /**
     * Updates a password entry (encrypts new data before sending)
     */
    async updatePasswordEntry(id, siteName, username, password, url, serverIp = null, hostname = null, notes = null) {
        if (!this.sessionId) {
            throw new Error('Session not established. Please complete handshake first.');
        }

        const encryptedSiteName = await this.encryptForServer(siteName);
        const encryptedUsername = await this.encryptForServer(username);
        const encryptedPassword = await this.encryptForServer(password);
        const encryptedUrl = await this.encryptForServer(url);
        const encryptedServerIp = serverIp ? await this.encryptForServer(serverIp) : null;
        const encryptedHostname = hostname ? await this.encryptForServer(hostname) : null;
        const encryptedNotes = notes ? await this.encryptForServer(notes) : null;

        const response = await fetch(`${this.apiBaseUrl}/api/passwords/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                'X-Session-Id': this.sessionId
            },
            body: JSON.stringify({
                encryptedSiteName,
                encryptedUsername,
                encryptedPassword,
                encryptedUrl,
                encryptedServerIp,
                encryptedHostname,
                encryptedNotes
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update password entry');
        }

        const encryptedEntry = await response.json();
        return await this.decryptPasswordEntry(encryptedEntry);
    }

    /**
     * Deletes a password entry
     */
    async deletePasswordEntry(id) {
        const response = await fetch(`${this.apiBaseUrl}/api/passwords/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete password entry');
        }
    }

    /**
     * Decrypts a password entry object
     */
    async decryptPasswordEntry(encryptedEntry) {
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
            updatedAt: encryptedEntry.updatedAt
        };
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Converts ArrayBuffer to Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Converts Base64 string to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Formats Base64 string for PEM format (64 characters per line)
     */
    formatPem(base64) {
        const formatted = [];
        for (let i = 0; i < base64.length; i += 64) {
            formatted.push(base64.substring(i, i + 64));
        }
        return formatted.join('\n');
    }

    /**
     * Logs out the user and clears session data
     */
    logout() {
        this.authToken = null;
        this.sessionId = null;
        this.clientKeyPair = null;
        this.serverPublicKey = null;
    }
}

// Export for use in modules or Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureNotesClient;
}
