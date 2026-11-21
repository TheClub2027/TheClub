import { createClient } from "@supabase/supabase-js";
import type { Career } from "./game";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured ? createClient(url!, publishableKey!) : null;

export async function saveOnlineCareer(userId: string, career: Career) {
  if (!supabase) throw new Error("Online saves are not configured for this deployment.");
  const { error } = await supabase.from("career_saves").upsert(
    {
      user_id: userId,
      career_id: career.id,
      career_payload: career,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,career_id" },
  );
  if (error) throw error;
}

export async function loadLatestOnlineCareer(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("career_saves")
    .select("career_payload")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.career_payload as Career | undefined) ?? null;
}
