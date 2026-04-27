import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      client_reference_id: userId,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


