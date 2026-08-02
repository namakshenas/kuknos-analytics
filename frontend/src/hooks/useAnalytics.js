import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';

/** Persian message for an axios failure. `null` means "aborted, not a failure". */
export function errorMessage(err) {
  if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.message === 'canceled') {
    return null;
  }
  if (err?.response?.status === 503) return 'خطا در اتصال به پایگاه داده';
  if (err?.response?.status === 400) return 'درخواست نامعتبر است';
  return 'خطا در دریافت اطلاعات';
}

/**
 * Fetches a page's endpoints in parallel and keeps each one's outcome separate.
 *
 * Three problems this fixes in the previous per-page code:
 *
 *  1. `Promise.all` meant a single failing endpoint out of eight replaced the
 *     entire page with an error card. `Promise.allSettled` isolates failures,
 *     so one dead endpoint now costs one chart.
 *  2. There was no `AbortController`, so quickly changing the date range or
 *     token could let a slow earlier response land last and win.
 *  3. `loading` is derived, not stored: it is true exactly while the data on
 *     screen belongs to a different filter set than the one selected. That is
 *     both simpler than a loading flag and impossible to leave stuck on.
 *
 * @param endpoints {Record<string, string>} state key -> API path
 * @param params    {object} query params (start_date, end_date, token, …)
 */
export function useAnalytics(endpoints, params) {
  const endpointsKey = JSON.stringify(endpoints);
  const paramsKey = JSON.stringify(params);
  const [nonce, setNonce] = useState(0);
  const requestKey = `${endpointsKey}|${paramsKey}|${nonce}`;

  const [result, setResult] = useState({ key: null, data: {}, errors: {} });

  useEffect(() => {
    const controller = new AbortController();
    const entries = Object.entries(JSON.parse(endpointsKey));

    (async () => {
      const settled = await Promise.allSettled(
        entries.map(([, path]) =>
          client.get(path, { params: JSON.parse(paramsKey), signal: controller.signal })
        )
      );

      // A newer run took over — drop this result rather than let it win.
      if (controller.signal.aborted) return;

      const data = {};
      const errors = {};
      settled.forEach((outcome, i) => {
        const [key, path] = entries[i];
        if (outcome.status === 'fulfilled') {
          data[key] = outcome.value.data;
        } else {
          const message = errorMessage(outcome.reason);
          if (message) errors[key] = message;
          console.error(`Failed: ${path}`, outcome.reason?.message);
        }
      });

      setResult({ key: requestKey, data, errors });
    })();

    return () => controller.abort();
  }, [requestKey, endpointsKey, paramsKey]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  const loading = result.key !== requestKey;
  const { data, errors } = result;
  const endpointCount = Object.keys(endpoints).length;

  // Everything failed — almost always the DB or API being unreachable, so it
  // warrants one page-level message rather than N identical per-card ones.
  const fatalError =
    !loading && endpointCount > 0 && Object.keys(errors).length === endpointCount
      ? Object.values(errors)[0]
      : null;

  return { data, errors, loading, fatalError, refetch };
}
