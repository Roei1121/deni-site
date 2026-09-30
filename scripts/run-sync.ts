import { syncSchedule } from "../lib/jobs/syncSchedule";

syncSchedule().then((r) => {
  console.log("sync-schedule result:", JSON.stringify(r, null, 2));
}).catch((e) => { console.error(e); process.exit(1); });
