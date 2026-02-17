import type { WOPRPlugin, WOPRPluginContext } from "@wopr-network/plugin-types";
import { buildCronA2ATools } from "./cron-a2a-tools.js";
import { initCronStorage } from "./cron-repository.js";
import { createCronTickLoop } from "./cron-tick.js";

let tickInterval: ReturnType<typeof setInterval> | null = null;

const plugin: WOPRPlugin = {
  name: "wopr-plugin-cron",
  version: "1.0.0",
  description: "Cron scheduling — recurring and one-time message injection with optional script execution",

  async init(ctx: WOPRPluginContext) {
    // 1. Register storage schema and get repositories
    await initCronStorage(ctx.storage);

    // 2. Start tick loop (30s interval)
    const cronTick = createCronTickLoop(ctx);
    tickInterval = setInterval(cronTick, 30000);
    cronTick(); // Run immediately on startup

    // 3. Register A2A tools
    if (ctx.registerA2AServer) {
      ctx.registerA2AServer(buildCronA2ATools());
    }

    ctx.log.info("Cron plugin initialized");
  },

  async shutdown() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  },
};

export default plugin;
