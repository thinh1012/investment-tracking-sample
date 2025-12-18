// Core Encryption Logic using Web Crypto API (AES-GCM)

// 1. Derive a Key from Password (PBKDF2)
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Security Requirement: This App must be running on HTTPS or Localhost to use the Vault. (Browser Restriction)");
    }
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

// 2. Encrypt Data
export const encryptData = async (data: any, password: string): Promise<string> => {
    const enc = new TextEncoder();
    const text = JSON.stringify(data);
    const encodedData = enc.encode(text);

    // Generate random salt and iv
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    );

    // Pack everything: salt + iv + ciphertext
    // Convert to Base64 for storage
    // Pack everything: salt + iv + ciphertext
    // Convert to Base64 for storage (Chunk-based to avoid stack overflow)
    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
};

// 3. Decrypt Data
export const decryptData = async (cipherText: string, password: string): Promise<any> => {
    try {
        const binaryString = atob(cipherText);
        const buffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            buffer[i] = binaryString.charCodeAt(i);
        }

        if (buffer.length < 28) throw new Error("Data too short to be valid vault.");

        // Unpack: salt (16) + iv (12) + data (rest)
        const salt = buffer.slice(0, 16);
        const iv = buffer.slice(16, 28);
        const data = buffer.slice(28);

        const key = await deriveKey(password, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );

        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted));
    } catch (e: any) {
        console.error("Decryption Failed Detail:", e);
        if (e.name === "OperationError") {
            throw new Error("Incorrect Password.");
        }
        throw new Error(`Decryption Error: ${e.message}`);
    }
};
