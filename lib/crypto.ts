import crypto from "crypto";

const AES_KEY = "12345678901234567890123456789012"; // 32字节密钥
const AES_IV = "1234567890123456"; // 16字节IV

export function encryptAES(plainText: string): string {
    const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, AES_IV);
    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

export function decryptAES(cipherText: string): string {
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, AES_IV);
    let decrypted = decipher.update(cipherText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
} 