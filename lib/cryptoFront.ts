import CryptoJS from "crypto-js";

const AES_KEY = "12345678901234567890123456789012"; // 32字节密钥
const AES_IV = "1234567890123456"; // 16字节IV

export function encryptAES(plainText: string): string {
    const encrypted = CryptoJS.AES.encrypt(plainText, CryptoJS.enc.Utf8.parse(AES_KEY), {
        iv: CryptoJS.enc.Utf8.parse(AES_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
}

export function decryptAES(cipherText: string): string {
    const decrypted = CryptoJS.AES.decrypt(cipherText, CryptoJS.enc.Utf8.parse(AES_KEY), {
        iv: CryptoJS.enc.Utf8.parse(AES_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
} 