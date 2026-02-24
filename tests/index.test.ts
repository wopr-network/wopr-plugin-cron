import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("../src/cron-repository.js", () => ({
  initCronStorage: vi.fn(),
}));

vi.mock("../src/cron-tick.js", () => ({
  createCronTickLoop: vi.fn(() => vi.fn()),
}));

vi.mock("../src/cron-a2a-tools.js", () => ({
  buildCronA2ATools: vi.fn(() => ({ name: "cron", version: "1.0.0", tools: [] })),
}));

vi.mock("../src/cron-commands.js", () => ({
  cronCommandHandler: vi.fn(),
}));

import plugin from "../src/index.js";
import { initCronStorage } from "../src/cron-repository.js";
import { createCronTickLoop } from "../src/cron-tick.js";
import { buildCronA2ATools } from "../src/cron-a2a-tools.js";

function createMockCtx() {
  return {
    storage: {
      register: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      getRepository: vi.fn(),
    },
    registerExtension: vi.fn(),
    registerContextProvider: vi.fn(),
    registerA2AServer: vi.fn(),
    log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  } as any;
}

describe("wopr-plugin-cron", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCtx = createMockCtx();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("plugin commands", () => {
    it("registers a 'cron' command", () => {
      expect(plugin.commands).toBeDefined();
      expect(plugin.commands).toHaveLength(1);
      expect(plugin.commands![0].name).toBe("cron");
      expect(typeof plugin.commands![0].handler).toBe("function");
    });
  });

  describe("plugin metadata", () => {
    it("has correct name", () => {
      expect(plugin.name).toBe("wopr-plugin-cron");
    });

    it("has correct version", () => {
      expect(plugin.version).toBe("1.0.0");
    });

    it("has a description", () => {
      expect(plugin.description).toBeDefined();
      expect(plugin.description.length).toBeGreaterThan(0);
    });
  });

  describe("init()", () => {
    it("initializes cron storage", async () => {
      await plugin.init(mockCtx);
      expect(initCronStorage).toHaveBeenCalledWith(mockCtx.storage);
    });

    it("creates tick loop with context", async () => {
      await plugin.init(mockCtx);
      expect(createCronTickLoop).toHaveBeenCalledWith(mockCtx);
    });

    it("runs tick loop immediately on startup", async () => {
      const mockTick = vi.fn();
      vi.mocked(createCronTickLoop).mockReturnValue(mockTick);
      await plugin.init(mockCtx);
      expect(mockTick).toHaveBeenCalledTimes(1);
    });

    it("registers A2A tools when registerA2AServer is available", async () => {
      await plugin.init(mockCtx);
      expect(buildCronA2ATools).toHaveBeenCalled();
      expect(mockCtx.registerA2AServer).toHaveBeenCalled();
    });

    it("does not throw when registerA2AServer is not available", async () => {
      const ctxWithoutA2A = { ...mockCtx, registerA2AServer: undefined };
      await expect(plugin.init(ctxWithoutA2A)).resolves.not.toThrow();
    });

    it("logs initialization message", async () => {
      await plugin.init(mockCtx);
      expect(mockCtx.log.info).toHaveBeenCalledWith("Cron plugin initialized");
    });
  });

  describe("shutdown()", () => {
    it("clears the tick interval after init", async () => {
      const mockTick = vi.fn();
      vi.mocked(createCronTickLoop).mockReturnValue(mockTick);
      await plugin.init(mockCtx);

      // After init, tick should run on interval. Advance past interval.
      vi.advanceTimersByTime(30000);
      expect(mockTick).toHaveBeenCalledTimes(2); // Once on init + once on interval

      await plugin.shutdown();

      // After shutdown, advancing timers should not trigger more ticks
      mockTick.mockClear();
      vi.advanceTimersByTime(60000);
      expect(mockTick).not.toHaveBeenCalled();
    });

    it("does not throw when called without init", async () => {
      await expect(plugin.shutdown()).resolves.not.toThrow();
    });
  });
});
