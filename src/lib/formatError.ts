import { ApiError } from '@/lib/apiError';

export type ToastFormat = {
  title: string;
  description?: string;
};

function joinNonEmpty(parts: Array<string | undefined | null>, sep = ' · ') {
  return parts.map(p => (p ?? '').trim()).filter(Boolean).join(sep);
}

export function formatErrorForToast(err: unknown, opts?: { fallbackTitle?: string; includeDebug?: boolean }): ToastFormat {
  const fallbackTitle = opts?.fallbackTitle || 'Something went wrong';
  const includeDebug = opts?.includeDebug ?? true;

  if (ApiError.is(err)) {
    const title = err.message || fallbackTitle;
    const detailLines: string[] = [];

    if (err.details?.length) {
      detailLines.push(err.details.map(d => `${d.field}: ${d.message}`).join('\n'));
    }

    if (includeDebug) {
      const debug = joinNonEmpty([
        err.code ? `code=${err.code}` : undefined,
        err.requestId ? `requestId=${err.requestId}` : undefined,
        typeof err.statusCode === 'number' ? `status=${err.statusCode}` : undefined,
      ]);
      if (debug) detailLines.push(debug);
    }

    const description = detailLines.length ? detailLines.join('\n') : undefined;
    return { title, description };
  }

  // Socket.io emits { message, code? }, and some code paths throw plain objects
  if (err && typeof err === 'object') {
    const anyErr = err as any;
    const title = (typeof anyErr.message === 'string' && anyErr.message.trim()) ? anyErr.message : fallbackTitle;
    const debug = includeDebug ? joinNonEmpty([
      typeof anyErr.code === 'string' ? `code=${anyErr.code}` : undefined,
      typeof anyErr.requestId === 'string' ? `requestId=${anyErr.requestId}` : undefined,
    ]) : '';
    return { title, description: debug || undefined };
  }

  if (typeof err === 'string' && err.trim()) {
    return { title: err.trim() };
  }

  return { title: fallbackTitle };
}

