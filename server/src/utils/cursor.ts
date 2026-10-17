export interface CursorPayload {
  createdAt: Date;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  const raw = `${payload.createdAt.toISOString()}###${payload.id}`;
  return Buffer.from(raw, 'utf-8').toString('base64');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf-8');
    const [isoDate, id] = raw.split('###');
    if (!isoDate || !id) return null;
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return null;
    return { createdAt: date, id };
  } catch {
    return null;
  }
}
