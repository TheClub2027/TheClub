import { createClient } from "@supabase/supabase-js";
import type { Career } from "./game";
import { summarizeCareerSave, type CareerSaveSummary } from "./career-save-store";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured ? createClient(url!, publishableKey!) : null;

export type OnlineCareerSave = {
  summary: CareerSaveSummary;
  career: Career;
};

function fromRow(row: { career_id: string; career_payload: Career; updated_at: string }): OnlineCareerSave {
  const career = row.career_payload;
  return {
    career,
    summary: summarizeCareerSave(career, row.updated_at),
  };
}

export async function saveOnlineCareer(userId: string, career: Career): Promise<OnlineCareerSave> {
  if (!supabase) throw new Error("Online saves are not configured for this deployment.");
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase.from("career_saves").upsert(
    {
      user_id: userId,
      career_id: career.id,
      career_payload: career,
      updated_at: updatedAt,
    },
    { onConflict: "user_id,career_id" },
  ).select("career_id,career_payload,updated_at").single();
  if (error) throw error;
  return fromRow(data as { career_id: string; career_payload: Career; updated_at: string });
}

export async function listOnlineCareerSaves(userId: string): Promise<OnlineCareerSave[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("career_saves")
    .select("career_id,career_payload,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as { career_id: string; career_payload: Career; updated_at: string }));
}

export async function loadOnlineCareer(userId: string, careerId: string): Promise<OnlineCareerSave | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("career_saves")
    .select("career_id,career_payload,updated_at")
    .eq("user_id", userId)
    .eq("career_id", careerId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as { career_id: string; career_payload: Career; updated_at: string }) : null;
}

export async function deleteOnlineCareer(userId: string, careerId: string): Promise<void> {
  if (!supabase) throw new Error("Online saves are not configured for this deployment.");
  const { error } = await supabase
    .from("career_saves")
    .delete()
    .eq("user_id", userId)
    .eq("career_id", careerId);
  if (error) throw error;
}
