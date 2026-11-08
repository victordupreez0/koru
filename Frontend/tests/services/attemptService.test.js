import { getBlockResults, getMyAttempts, submitAttempt } from "../../src/services/attemptService";

const respond = (body, ok = true, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({ ok, status, text: async () => JSON.stringify(body) });
};

describe("attemptService", () => {
  afterEach(() => delete global.fetch);

  test("submitAttempt sends only the user and the answer", async () => {
    respond({ passed: true });
    const result = await submitAttempt("page 1", "block/1", "u1", { cells: [1] });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/Attempt/pages/page%201/blocks/block%2F1");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ userId: "u1", answer: { cells: [1] } });
    expect(result.passed).toBe(true);
  });

  test("server messages reach the student", async () => {
    respond({ message: "You don't have access to this activity." }, false, 403);
    await expect(submitAttempt("p", "b", "u", {})).rejects.toThrow("You don't have access");
  });

  test("a response with no message still fails clearly", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "" });
    await expect(submitAttempt("p", "b", "u", {})).rejects.toThrow("Something went wrong");
  });

  test("getMyAttempts asks for this student", async () => {
    respond([]);
    await getMyAttempts("p", "u 1");
    expect(global.fetch.mock.calls[0][0]).toContain("/Attempt/pages/p/mine?userId=u%201");
  });

  test("getBlockResults asks as this lecturer", async () => {
    respond({ students: [] });
    await getBlockResults("p", "b", "t1");
    expect(global.fetch.mock.calls[0][0]).toContain("/blocks/b/results?userId=t1");
  });
});
