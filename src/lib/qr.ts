import { randomUUID } from 'crypto'

/**
 * Token unik untuk QR check-in tamu.
 * Disimpan di guests.qr_token — tamu konfirmasi kehadiran via /rsvp?token=...
 */
export function generateQr(): string {
  return randomUUID().replace(/-/g, '')
}
