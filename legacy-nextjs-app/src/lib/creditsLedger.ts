import { getSupabaseServiceClient } from "@/lib/supabaseServer";

export type CreditReservation = { reservationId: string; cost: number };

export async function reserveCredits(params: {
  userId: string;
  cost: number;
  jobId?: string;
}): Promise<CreditReservation> {
  const { userId, cost, jobId } = params;
  const supabase = getSupabaseServiceClient();

  // Ensure sufficient balance
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, credit_balance")
    .eq("clerk_id", userId)
    .single();
  if (userErr) throw userErr;
  if (!user || user.credit_balance < cost) {
    throw new Error("Insufficient credits");
  }

  // Decrement balance
  const { error: decErr } = await supabase
    .from("users")
    .update({ credit_balance: user.credit_balance - cost })
    .eq("id", user.id);
  if (decErr) throw decErr;

  // Create ledger entry (pending charge)
  const { error: ledErr } = await supabase.from("credits_ledger").insert({
    user_id: user.id,
    transaction_type: "usage" as const,
    amount: -cost,
    balance_after: user.credit_balance - cost,
    description: "Job charge",
    job_id: jobId ?? null,
    metadata: { pending: true },
  });
  if (ledErr) throw ledErr;

  // Note: credit_reservations table not implemented yet
  // For now, return a simple reservation ID
  const reservationId = `temp_${Date.now()}_${user.id}`;
  
  return { reservationId, cost };
}

export async function finalizeCredits(reservationId: string): Promise<void> {
  // Note: credit_reservations table not implemented yet
  // This function would update the reservation status to 'finalized'
  console.log('Finalizing credits for reservation:', reservationId);
}

export async function refundCredits(params: {
  userId: string;
  reservationId: string;
  cost: number;
  jobId?: string;
}): Promise<void> {
  const { userId, reservationId, cost, jobId } = params;
  const supabase = getSupabaseServiceClient();

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, credit_balance")
    .eq("clerk_id", userId)
    .single();
  if (userErr) throw userErr;
  if (!user) throw new Error("User not found");

  const { error: updErr } = await supabase
    .from("users")
    .update({ credit_balance: user.credit_balance + cost })
    .eq("id", user.id);
  if (updErr) throw updErr;

  const { error: ledErr } = await supabase.from("credits_ledger").insert({
    user_id: user.id,
    transaction_type: "refund" as const,
    amount: cost,
    balance_after: user.credit_balance + cost,
    description: "Job refund",
    job_id: jobId ?? null,
    metadata: { reservationId },
  });
  if (ledErr) throw ledErr;

  // Note: credit_reservations table not implemented yet
  // This function would update the reservation status to 'refunded'
  console.log('Marking reservation as refunded:', reservationId);
}




