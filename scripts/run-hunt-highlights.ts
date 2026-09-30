import { huntHighlights } from "../lib/jobs/huntHighlights";

huntHighlights().then((r) => {
  console.log("hunt-highlights result:", JSON.stringify(r, null, 2));
}).catch((e) => { console.error(e); process.exit(1); });
