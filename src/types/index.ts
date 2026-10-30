// ==============================================================================
// HAMMAD STUDYHUB — CORE TYPES & INTERFACES
// ==============================================================================

export type ResourceType =
  | 'pdf'
  | 'video'
  | 'whiteboard'
  | 'assignment'
  | 'presentation'
  | 'past_paper'
  | 'other';

export type SourceProvider =
  | 'google_drive'
  | 'youtube'
  | 'direct_url'
  | 'supabase_storage';

export type PublicationStatus = 'draft' | 'published' | 'archived';

export type UserRole = 'admin' | 'cr' | 'gr' | 'student';
export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  gender: Gender;
  phone?: string;
  roll_no?: string;
  program_name?: string;
  semester?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentRegistrationInput {
  display_name: string;
  email: string;
  password: string;
  gender: Gender;
  phone?: string;
  roll_no?: string;
  program_name?: string;
  semester?: string;
}

export interface PlatformSocials {
  whatsapp_number: string;
  instagram_id: string;
  whatsapp_url?: string;
  instagram_url?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_gender?: Gender;
  receiver_id: string;
  receiver_name: string;
  receiver_role: UserRole;
  message: string;
  created_at: string;
  read?: boolean;
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicProgram {
  id: string;
  institution_id?: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  institution?: Institution;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  program_id: string;
  name: string;
  semester_number: number;
  academic_year?: string;
  is_active: boolean;
  program?: AcademicProgram;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  institution_id?: string;
  program_id?: string;
  semester_id?: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  instructor?: string;
  icon: string;
  color: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;

  // Joined relations (optional)
  institution?: Institution;
  program?: AcademicProgram;
  semester?: Semester;
  resource_count?: number;
  latest_lesson_date?: string;
}

export interface Resource {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  description?: string;
  resource_type: ResourceType;
  lesson_date: string; // YYYY-MM-DD
  source_provider: SourceProvider;
  external_url: string;
  embed_url?: string;
  topic?: string;
  chapter?: string;
  tags: string[];
  status: PublicationStatus;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Joined relations (optional)
  subject?: Subject;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  subject_id?: string;
  category: 'general' | 'exam' | 'assignment' | 'schedule';
  is_pinned: boolean;
  status: PublicationStatus;
  published_at: string;
  created_at: string;
  updated_at: string;

  subject?: Subject;
}

export interface FeedbackSubmission {
  id?: string;
  category: 'general' | 'broken_link' | 'resource_request' | 'correction' | 'other';
  message: string;
  contact_email?: string;
  resource_id?: string;
  status?: 'pending' | 'reviewed' | 'resolved';
  created_at?: string;
}

export interface PlatformSettings {
  platform_name: string;
  tagline: string;
  creator: string;
  contact_email: string;
  default_lesson_date_mode?: 'today' | 'custom';
  featured_subject_ids?: string[];
}

export interface BookmarkItem {
  id: string;
  resourceId: string;
  title: string;
  resourceType: ResourceType;
  subjectName: string;
  subjectSlug: string;
  lessonDate: string;
  savedAt: string;
}

export interface RecentlyViewedItem {
  id: string;
  resourceId: string;
  title: string;
  resourceType: ResourceType;
  subjectName: string;
  subjectSlug: string;
  lessonDate: string;
  viewedAt: string;
}

export interface ChecklistItem {
  id: string; // resource ID or custom topic ID
  subjectSlug: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ResourceFilters {
  searchQuery?: string;
  resourceType?: ResourceType | 'all';
  dateFrom?: string;
  dateTo?: string;
  topic?: string;
  chapter?: string;
  sortOrder?: 'date-desc' | 'date-asc' | 'title-asc';
}

export interface SubjectFilters {
  searchQuery?: string;
  programId?: string;
  semesterId?: string;
  featuredOnly?: boolean;
}
