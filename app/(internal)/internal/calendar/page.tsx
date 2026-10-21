import { requireAuth } from "@/src/lib/auth";
import { CalendarWorkspace } from "@/src/modules/calendar/CalendarWorkspace";
export default async function CalendarPage() {
  await requireAuth(["ADMIN", "WORKER"]);
  return <CalendarWorkspace />;
}
