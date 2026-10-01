import crypto from "crypto";

/*
 * ------------------------------------------------------
 * ENCRYPTION CONFIGURATION
 * ------------------------------------------------------
 */

const ALGORITHM =
  "aes-256-gcm";

/*
 * ------------------------------------------------------
 * GET ENCRYPTION KEY
 * ------------------------------------------------------
 *
 * Add this to .env.local:
 *
 * INTEGRATION_ENCRYPTION_KEY=64_HEX_CHARACTERS
 *
 * Generate one with:
 *
 * openssl rand -hex 32
 *
 */

function getEncryptionKey(): Buffer {
  const value =
    process.env
      .INTEGRATION_ENCRYPTION_KEY;

  if (
    !value ||
    !/^[0-9a-fA-F]{64}$/.test(
      value
    )
  ) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  }

  return Buffer.from(
    value,
    "hex"
  );
}

/*
 * ------------------------------------------------------
 * ENCRYPT SECRET
 * ------------------------------------------------------
 *
 * Used for:
 *
 * - API keys
 * - Client secrets
 * - Passwords
 * - Tokens
 * - Integration credentials
 *
 * The returned value contains:
 *
 * IV : AUTH TAG : ENCRYPTED DATA
 *
 */

export function encryptSecret(
  value: string
): string {
  if (!value) {
    return "";
  }

  const key =
    getEncryptionKey();

  /*
   * GCM recommends a 12-byte IV.
   */
  const iv =
    crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      ALGORITHM,
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        value,
        "utf8"
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/*
 * ------------------------------------------------------
 * DECRYPT SECRET
 * ------------------------------------------------------
 *
 * This should ONLY be used server-side.
 *
 * Never send the decrypted value directly
 * to the browser unless absolutely necessary.
 *
 */

export function decryptSecret(
  value: string
): string {
  if (!value) {
    return "";
  }

  const parts =
    value.split(":");

  if (
    parts.length !== 3
  ) {
    throw new Error(
      "Invalid encrypted integration secret"
    );
  }

  const [
    ivHex,
    authTagHex,
    encryptedHex,
  ] = parts;

  const key =
    getEncryptionKey();

  const iv =
    Buffer.from(
      ivHex,
      "hex"
    );

  const authTag =
    Buffer.from(
      authTagHex,
      "hex"
    );

  const encrypted =
    Buffer.from(
      encryptedHex,
      "hex"
    );

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      key,
      iv
    );

  decipher.setAuthTag(
    authTag
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted
      ),
      decipher.final(),
    ]);

  return decrypted.toString(
    "utf8"
  );
}