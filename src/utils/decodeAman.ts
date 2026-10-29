/**
 * decodeURIComponent yang tidak melempar URIError untuk input rusak
 * (misal `%` tunggal); nilai asli dikembalikan apa adanya.
 */
export function decodeAman(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
