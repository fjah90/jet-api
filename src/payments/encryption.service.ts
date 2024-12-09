import { Injectable } from '@nestjs/common';
import { createCipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly ivLength = 16;

    encryptPayload(payload: string, merchantPassword: string): { encryptedPayload: string; iv: string; integrityCheck: string } {
        const iv = randomBytes(this.ivLength);
        const cipher = createCipheriv(this.algorithm, merchantPassword, iv);
        
        let encryptedPayload = cipher.update(payload, 'utf8', 'base64');
        encryptedPayload += cipher.final('base64');

        const integrityCheck = this.calculateIntegrityCheck(payload);

        return {
            encryptedPayload: encryptedPayload,
            iv: iv.toString('base64'),
            integrityCheck,
        };
    }

    private calculateIntegrityCheck(payload: string): string {
        const hash = createHash('sha256');
        hash.update(payload, 'utf8');
        return hash.digest('hex');
    }

    private deriveKeyFromPassword(merchantPassword: string): Buffer {
        const hashedPassword = createHash('sha256').update(merchantPassword).digest();
        return hashedPassword.subarray(0, 32);
    }
}