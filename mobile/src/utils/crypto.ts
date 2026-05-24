import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
  publicKey: string; // base64-encoded X25519 public key
  secretKey: string; // base64-encoded X25519 private key
}

export function generateKeyPair(): KeyPair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

// Encrypts plaintext using X25519 ECDH + XSalsa20-Poly1305.
// Returns a base64 string containing nonce || ciphertext.
export function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string,
  senderSecretKeyB64: string
): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(
    encodeUTF8(plaintext),
    nonce,
    decodeBase64(recipientPublicKeyB64),
    decodeBase64(senderSecretKeyB64)
  );
  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);
  return encodeBase64(combined);
}

// Returns decrypted plaintext, or null if authentication fails.
export function decryptMessage(
  encryptedB64: string,
  senderPublicKeyB64: string,
  recipientSecretKeyB64: string
): string | null {
  const combined = decodeBase64(encryptedB64);
  const nonce = combined.slice(0, nacl.box.nonceLength);
  const ciphertext = combined.slice(nacl.box.nonceLength);
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    decodeBase64(senderPublicKeyB64),
    decodeBase64(recipientSecretKeyB64)
  );
  return decrypted ? decodeUTF8(decrypted) : null;
}
