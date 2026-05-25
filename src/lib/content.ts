import type { SupabaseClient } from "@supabase/supabase-js";
import type { FaqItem, Review } from "@/lib/types";

type ReviewRow = {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
};

type FaqRow = {
  question: string;
  answer: string;
};

export async function fetchRecentReviews(
  supabase: SupabaseClient,
  limit = 3,
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, reviewer_id, rating, comment")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  const rows = data as ReviewRow[];
  const reviewerIds = [...new Set(rows.map((r) => r.reviewer_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", reviewerIds);

  const byUser = new Map((profiles as ProfileRow[] | null | undefined)?.map((p) => [p.user_id, p.full_name]) ?? []);

  return rows.map((row) => ({
    id: row.id,
    author: byUser.get(row.reviewer_id) ?? "Membre",
    comment: row.comment?.trim() ? row.comment : "Avis valide sans commentaire détaillé.",
    rating: row.rating,
  }));
}

export async function fetchPublishedFaqItems(
  supabase: SupabaseClient,
  limit = 20,
): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("question, answer")
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  return (data as FaqRow[]).map((row) => ({
    question: row.question,
    answer: row.answer,
  }));
}
