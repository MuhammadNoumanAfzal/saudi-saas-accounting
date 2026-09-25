type ApiIssue = {
  path?: string[] | string;
  field?: string;
  message?: string;
};

function readMessage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (typeof record.error === 'string') return record.error;
  if (record.data) return readMessage(record.data);
  if (record.response) return readMessage(record.response);
  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const message = readMessage(error);
  return message && message.trim() ? message : fallback;
}

export function getFieldErrors(error: unknown, fallback = 'Something went wrong'): Record<string, string> {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : null;
    const details = Array.isArray(record.details) ? record.details : data && Array.isArray(data.details) ? data.details : null;

    if (details?.length) {
      return details.reduce<Record<string, string>>((acc, issue) => {
        const item = issue as ApiIssue;
        const key = Array.isArray(item.path) ? item.path.join('.') : item.path || item.field || 'submit';
        acc[key] = item.message || fallback;
        return acc;
      }, {});
    }
  }

  return { submit: getErrorMessage(error, fallback) };
}