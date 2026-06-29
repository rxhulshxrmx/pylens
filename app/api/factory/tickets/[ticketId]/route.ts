import { updateTicketStatus } from "@/lib/db/factory"
import type { TicketStatus } from "@/lib/factory/types"

const STATUSES: TicketStatus[] = ["Backlog", "Ready", "In Progress", "Review", "Done"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const { status }: { status?: TicketStatus } = await req.json()

    if (!status || !STATUSES.includes(status)) {
      return Response.json({ error: "Valid status is required" }, { status: 400 })
    }

    const ticket = await updateTicketStatus(ticketId, status)
    return Response.json(ticket)
  } catch (err) {
    console.error("Error updating ticket:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
