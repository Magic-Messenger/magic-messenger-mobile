import "react-native-get-random-values";

import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";
import {
  decodeBase64,
  decodeUTF8,
  encodeBase64,
  encodeUTF8,
} from "tweetnacl-util";

import { useUserStore } from "../store";

if (typeof global.crypto !== "object") {
  global.crypto = {} as any;
}
if (typeof global.crypto.getRandomValues !== "function") {
  global.crypto.getRandomValues =
    Crypto.getRandomValues as typeof global.crypto.getRandomValues;
}
/**
 * example usage:
 * import { generateKeyPairs, encrypt, decrypt } from './encryptionHelper';
 * const { publicKey, privateKey } = generateKeyPairs();
 * const encrypted = encrypt("Hello, World!", publicKey, privateKey);
 * const decrypted = decrypt(encrypted.cipherText, encrypted.nonce, publicKey, privateKey);
 * console.log(decrypted); // Should log "Hello, World!"
 *
 * example usage for group encryption:
 * const groupKey = generateGroupKey();
 * const encryptedGroup = encryptForGroup("Hello, Group!", groupKey);
 * const decryptedGroup = decryptForGroup(encryptedGroup.cipherText, encryptedGroup.nonce, groupKey);
 * console.log(decryptedGroup); // Should log "Hello, Group!"
 *
 *
 * example usage for user-specific group key encryption:
 * const userPublicKey = "user's public key in base64";
 * const senderPrivateKey = "sender's private key in base64";
 * const encryptedGroupKey = encryptGroupKeyForUser(groupKey, userPublicKey, senderPrivateKey);
 * const decryptedGroupKey = decryptGroupKeyForUser(encryptedGroupKey.cipherText, encryptedGroupKey.nonce, receiverPrivateKey, senderPublicKey);
 * console.log(decryptedGroupKey); // Should log the original group key
 *
 * */

/**
 * Generates a pair of public and private keys for encryption.
 * @returns An object containing the public and private keys in base64 format.
 */
export const generateKeyPairs = () => {
  try {
    const keyPair = nacl.box.keyPair();
    if (keyPair) {
      useUserStore.setState({
        credentials: {
          publicKey: encodeBase64(keyPair.publicKey),
          privateKey: encodeBase64(keyPair.secretKey),
        },
      });

      return {
        publicKey: encodeBase64(keyPair.publicKey),
        privateKey: encodeBase64(keyPair.secretKey),
      };
    }
  } catch (error) {
    console.error("error: ", error);
  }
};

export const checkUserCredentials = () => {
  const { publicKey, privateKey } = useUserStore.getState().credentials;
  if (!publicKey || !privateKey) {
    console.error("❌ Missing user keys");
    return false;
  }
  return true;
};

export const userPublicKey = () => {
  const { publicKey } = useUserStore.getState().credentials;
  if (!publicKey) {
    console.error("❌ Missing user public key");
    return null;
  }
  return publicKey;
};

export const userPrivateKey = () => {
  const { privateKey } = useUserStore.getState().credentials;
  if (!privateKey) {
    console.error("❌ Missing user public key");
    return null;
  }
  return privateKey;
};

/**
 * Encrypts data using the receiver's public key and the sender's private key.
 * @param data - The data to encrypt as a UTF-8 string.
 * @param receiverPublicKey - The receiver's public key in base64 format.
 * @param senderPrivateKey - The sender's private key in base64 format.
 * @returns An object containing the encrypted message and nonce, or undefined if any parameter is missing.
 * @throws Will log an error if encryption fails.
 */
export const encrypt = (
  data: string,
  receiverPublicKey: string,
  senderPrivateKey: string,
) => {
  const nonce = nacl.randomBytes(24);
  const cipher = nacl.box(
    decodeUTF8(data),
    nonce,
    decodeBase64(receiverPublicKey),
    decodeBase64(senderPrivateKey),
  );
  return {
    cipherText: encodeBase64(cipher),
    nonce: encodeBase64(nonce),
  };
};

/**
 * Encrypts data for a group using a shared base64 group key.
 * @param data
 * @param groupKey
 * @returns An object containing the encrypted message and nonce, or undefined if groupKey is not provided.
 * @throws Will log an error if encryption fails.
 */
export const encryptForGroup = (data: string, groupKey: string) => {
  if (!groupKey) return;

  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(data);
  const keyBytes = decodeBase64(groupKey);
  const cipher = nacl.secretbox(messageBytes, nonce, keyBytes);
  return {
    cipherText: encodeBase64(cipher),
    nonce: encodeBase64(nonce),
  };
};

/**
 * Decrypts a message using the sender's public key and receiver's private key.
 * @param cipherText - The encrypted message in base64 format.
 * @param nonce - The nonce used during encryption in base64 format.
 * @param senderPublicKey - The sender's public key in base64 format.
 * @param receiverPrivateKey - The receiver's private key in base64 format.
 * @returns The decrypted message as a UTF-8 string, or null if decryption fails.
 * @throws Will log an error if decryption fails.
 * */
export const decrypt = (
  cipherText: string,
  nonce: string,
  senderPublicKey: string,
  receiverPrivateKey: string,
) => {
  if (!senderPublicKey || !receiverPrivateKey || !cipherText || !nonce) return;

  const decrypted = nacl.box.open(
    decodeBase64(cipherText),
    decodeBase64(nonce),
    decodeBase64(senderPublicKey),
    decodeBase64(receiverPrivateKey),
  );

  if (!decrypted) {
    console.log("❌ Decryption failed");
    return null; // Decryption failed
  }

  return encodeUTF8(decrypted);
};

/**
 * Decrypts a message for a group using the shared base64 group key.
 * @param cipherText
 * @param nonce
 * @param groupKey
 * @returns The decrypted message as a UTF-8 string, or null if decryption fails.
 * @throws Will log an error if decryption fails.
 * */
export const decryptForGroup = (
  cipherText: string,
  nonce: string,
  groupKey: string,
) => {
  if (!groupKey || !cipherText || !nonce) return;

  const decrypted = nacl.secretbox.open(
    decodeBase64(cipherText),
    decodeBase64(nonce),
    decodeBase64(groupKey),
  );

  if (!decrypted) {
    console.error("❌ Decryption failed");
    return null; // Decryption failed
  }

  return encodeUTF8(decrypted);
};

/**
 * Generates a random group key for encryption.
 * @returns A base64 encoded string representing the group key.
 * @throws Will log an error if key generation fails.
 * This key can be used to encrypt messages for a group.
 * */
export const generateGroupKey = () => {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key); // Base64 string
};

/**
 * Encrypts a group key for a specific user using their public key and the sender's private key.
 * @param groupKey - The group key to encrypt, in base64 format.
 * @param userPublicKey - The user's public key to encrypt the group key for, in
 * @param senderPrivateKey - The sender's private key used for encryption, in base64 format.
 * @returns An object containing the encrypted group key and nonce, or undefined if any parameter is missing.
 * @throws Will log an error if encryption fails.
 * */
export const encryptGroupKeyForUser = (
  groupKey: string,
  userPublicKey: string,
  senderPrivateKey: string,
) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const cipher = nacl.box(
    decodeBase64(groupKey),
    nonce,
    decodeBase64(userPublicKey),
    decodeBase64(senderPrivateKey),
  );

  return {
    cipherText: encodeBase64(cipher),
    nonce: encodeBase64(nonce),
  };
};

/**
 * Decrypts a group key for a specific user using their private key and the sender's public key.
 * @param encryptedGroupKey - The encrypted group key in base64 format.
 * @param encryptedGroupKeyNonce - The nonce used during encryption in base64 format.
 * @param receiverPrivateKey - The receiver's private key in base64 format.
 * @param senderPublicKey - The sender's public key in base64 format.
 * @returns The decrypted group key as a UTF-8 string, or undefined if decryption fails or any parameter is missing.
 * @throws Will log an error if decryption fails.
 * */
export const decryptGroupKeyForUser = (
  encryptedGroupKey: string,
  encryptedGroupKeyNonce: string,
  receiverPrivateKey: string,
  senderPublicKey: string,
) => {
  const decrypted = nacl.box.open(
    decodeBase64(encryptedGroupKey),
    decodeBase64(encryptedGroupKeyNonce),
    decodeBase64(senderPublicKey),
    decodeBase64(receiverPrivateKey),
  );

  if (!decrypted) {
    console.error("❌ Decryption failed");
    return;
  }

  return encodeBase64(decrypted); // Base64 string olarak geri dön
};
