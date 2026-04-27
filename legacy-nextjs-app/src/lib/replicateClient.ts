import Replicate from "replicate";
import { env } from "@/lib/env";

export function getReplicateClient() {
  return new Replicate({ auth: env.REPLICATE_API_TOKEN });
}



