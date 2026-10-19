export type FacultyRow = {
  faculty_id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  college: string | null;
  rank: string | null;
  orcid: string | null;
  is_subscribed: boolean;
  role: "faculty" | "admin";
  institution_name: string;
  paper_count: number;
  last_profiled_at: string | null;
};

export type FacultyListResponse = {
  total: number;
  limit: number;
  offset: number;
  rows: FacultyRow[];
};
