import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { config } from '../config/env';

export class MfaService {
  private readonly encryptionKey = crypto.createHash('sha256').update(config.MFA_ENCRYPTION_KEY).digest();

  constructor(private readonly appName = 'Workforce Analytics Platform') {}

  public generateSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: this.appName,
      label: userEmail,
      secret,
    });
    return { secret, otpauthUrl };
  }

  public async generateQrCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240,
    });
  }

  public verifyToken(token: string, secret: string): boolean {
    try {
      const result = verifySync({
        token: token.trim(),
        secret: secret.trim(),
        epochTolerance: 30, // 30s tolerance window
      });
      return Boolean(result?.valid);
    } catch {
      return false;
    }
  }

  public encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return `enc:v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${ciphertext.toString('base64')}`;
  }

  public decryptSecret(value: string): string {
    if (!value.startsWith('enc:v1:')) return value;

    const [, , ivValue, tagValue, ciphertextValue] = value.split(':');
    if (!ivValue || !tagValue || !ciphertextValue) {
      throw new Error('Stored MFA secret has an invalid encrypted format');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivValue, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagValue, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  public generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(8).toString('hex').toUpperCase();
      codes.push(Array.from({ length: 4 }, (_, index) => code.slice(index * 4, index * 4 + 4)).join('-'));
    }
    return codes;
  }

  public hashBackupCodes(codes: string[]): string {
    return JSON.stringify(codes.map((code) => this.hashBackupCode(code)));
  }

  public verifyBackupCode(
    providedCode: string,
    existingCodesJson: string | null
  ): { valid: boolean; remainingCodesJson: string | null } {
    if (!existingCodesJson) return { valid: false, remainingCodesJson: null };

    try {
      const codes: string[] = JSON.parse(existingCodesJson);
      const cleanProvided = providedCode.trim().toUpperCase();
      const providedHash = this.hashBackupCode(cleanProvided);
      const hashedCodes = codes.map((storedCode) => (
        /^[a-f0-9]{64}$/i.test(storedCode) ? storedCode.toLowerCase() : this.hashBackupCode(storedCode)
      ));
      const index = hashedCodes.findIndex((storedValue) => {
        return crypto.timingSafeEqual(Buffer.from(providedHash, 'hex'), Buffer.from(storedValue, 'hex'));
      });

      if (index !== -1) {
        // Code matched! Consume it (one-time use)
        hashedCodes.splice(index, 1);
        return {
          valid: true,
          remainingCodesJson: JSON.stringify(hashedCodes),
        };
      }
      return { valid: false, remainingCodesJson: existingCodesJson };
    } catch {
      return { valid: false, remainingCodesJson: existingCodesJson };
    }
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }
}
