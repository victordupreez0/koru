import { act, renderHook } from "@testing-library/react";
import { useAutosave } from "../../src/components/editor/useAutosave";

const settle = () => act(async () => { await jest.advanceTimersByTimeAsync(0); });

describe("useAutosave", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("saves only the newest payload after the pause", async () => {
    const save = jest.fn().mockResolvedValue();
    const { result } = renderHook(() => useAutosave(save, 1000));
    act(() => { result.current.schedule("a"); result.current.schedule("b"); });
    expect(result.current.status).toBe("dirty");
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("b");
    expect(result.current.status).toBe("saved");
  });

  test("flush saves immediately and reports success", async () => {
    const save = jest.fn().mockResolvedValue();
    const { result } = renderHook(() => useAutosave(save, 1000));
    act(() => result.current.schedule("a"));
    let ok;
    await act(async () => { ok = await result.current.flush(); });
    expect(ok).toBe(true);
    expect(save).toHaveBeenCalledWith("a");
  });

  test("a failed save is reported and retried", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const save = jest.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue();
    const { result } = renderHook(() => useAutosave(save, 10));
    act(() => result.current.schedule("a"));
    await act(async () => { await jest.advanceTimersByTimeAsync(10); });
    expect(result.current.status).toBe("error");
    await act(async () => { await jest.advanceTimersByTimeAsync(5000); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("saved");
    console.error.mockRestore();
  });

  test("flush reports failure so the page can stay open", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const save = jest.fn().mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useAutosave(save, 10));
    act(() => result.current.schedule("a"));
    let ok;
    await act(async () => { ok = await result.current.flush(); });
    expect(ok).toBe(false);
    console.error.mockRestore();
  });

  test("leaving the page sends what is pending", async () => {
    const save = jest.fn().mockResolvedValue();
    const { result, unmount } = renderHook(() => useAutosave(save, 100000));
    act(() => result.current.schedule("last words"));
    unmount();
    await settle();
    expect(save).toHaveBeenCalledWith("last words");
  });

  test("nothing pending means nothing is sent", async () => {
    const save = jest.fn();
    const { result } = renderHook(() => useAutosave(save));
    await act(async () => { await result.current.flush(); });
    expect(save).not.toHaveBeenCalled();
  });
});
