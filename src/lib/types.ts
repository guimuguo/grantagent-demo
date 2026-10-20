export type Match = {
  match_id: string;
  opportunity_id: string;
  title: string;
  agency: string | null;
  deadline: string | null;
  url: string | null;
  score: number | null;
  verdict: "strong_fit" | "possible_fit" | "not_a_fit" | null;
  feedback:
    | "interested"
    | "saved"
    | "not_relevant"
    | "applied"
    | "thumbs_up"
    | "thumbs_down"
    | null;
  rationale: string | null;
  week_of: string;
  is_primary: boolean;
  is_collab_candidate: boolean;
  collaborators?: Collaborator[];
};

export type OpportunityRow = {
  opportunity_id: string;
  title: string | null;
  agency: string | null;
  program: string | null;
  deadline: string | null;
  award_floor: number | null;
  award_ceiling: number | null;
  url: string | null;
  collaboration_signal: string | null;
  first_seen_at: string | null;
  similarity?: number | null;
  is_saved?: boolean;
  saved_at?: string | null;
  days_until_deadline?: number | null;
  n_matched?: number;
  summary?: string | null;
  eligibility?: string | null;
};

export type Profile = {
  faculty_id: string;
  full_name: string;
  email: string;
  orcid: string | null;
  department: string | null;
  college: string | null;
  rank: string | null;
  rowan_profile_url: string | null;
  opt_out_collaborator: boolean;
  disowned_openalex_work_ids: string[];
  openalex_id: string | null;
  last_profiled_at: string | null;
  is_subscribed: boolean;
  institution_name: string;
};

export type Paper = {
  openalex_work_id: string;
  year: number | null;
  title: string;
  citation_count: number | null;
  venue: string | null;
  author_position: string | null;
};

export type Collaborator = {
  name: string;
  department: string;
  college: string;
  expertise: string;
  why: string;
  coauthored_before: boolean;
};
