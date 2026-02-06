import { send } from "cloud/event";

const handler = async () => {
  await send("event", Buffer.from(JSON.stringify({})));
  await new Promise((resolve) => setTimeout(resolve, 10000));
};

export default {
  name: "sync-cron",
  timeout: 15000,
  cron: "*/15 * * * * *",
  handler,
};
