// Helper to mock global.fetch in a single line per test.
export function mockFetchOnce({ ok = true, status = 200, body = {} } = {}) {
  const fetchSpy = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => (body === undefined || body === null ? '' : JSON.stringify(body)),
  });
  global.fetch = fetchSpy;
  return fetchSpy;
}

export function lastFetchCall() {
  return global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
}
