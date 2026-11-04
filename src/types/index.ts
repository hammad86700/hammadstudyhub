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

export type UserRole = 'admin' | 'cr' | 'gr' | 'teacher' | 'student';
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
  assigned_subject_ids?: string[];
  teacher_status?: 'pending' | 'approved' | 'rejected';
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

export interface TeacherRegistrationInput {
  display_name: string;
  email: string;
  password: string;
  gender?: Gender;
  phone?: string;
  requested_subject_ids: string[];
}

export interface TeacherApplication {
  id: string;
  teacher_id: string;
  display_name: string;
  email: string;
  phone?: string;
  gender?: Gender;
  requested_subject_ids: string[];
  approved_subject_ids: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFile {
  id: string;
  file_name: string;
  file_size: string;
  mime_type: string;
  file_url: string;
  file_data?: string; // Base64 data URL for instant offline & cross-device viewing
  storage_path?: string;
}

export interface StudentAssignmentSubmission {
  id: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  subject_id: string;
  subject_name?: string;
  title: string;
  description?: string;
  files: SubmissionFile[];
  status: 'submitted' | 'reviewed';
  review_feedback?: string;
  review_marks?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  submitted_at: string;
  updated_at: string;
}

export interface TeacherNotification {
  id: string;
  teacher_id: string;
  submission_id: string;
  student_name: string;
  roll_no: string;
  subject_id: string;
  subject_name: string;
  assignment_title: string;
  submission_time: string;
  read: boolean;
  created_at: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'descriptive';

export interface TestQuestion {
  id: string;
  subject_id: string;
  chapter?: string;
  topic?: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[]; // 4 options for MCQ
  correct_answer: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface TeacherTest {
  id: string;
  teacher_id: string;
  subject_id: string;
  title: string;
  instructions?: string;
  test_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  total_marks: number;
  attempts_allowed: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: 'draft' | 'scheduled' | 'published';
  questions: TestQuestion[];
  created_at: string;
  updated_at: string;
}

export interface PlatformSocials {
  whatsapp_number: string;
  instagram_id: string;
  whatsapp_url?: string;
  instagram_url?: string;
}

export interface SharedMaterialAttachment {
  id: string;
  title: string;
  subject_name?: string;
  subject_id?: string;
  resource_type: ResourceType;
  file_url: string;
  description?: string;
  source_provider?: SourceProvider;
  is_hub_resource?: boolean;
  hub_resource_id?: string;
  created_at: string;
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
  attachment?: SharedMaterialAttachment;
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
  google_drive_folder_url?: string;
  google_drive_folder_id?: string;
  folder_configured?: boolean;
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
  google_drive_folder_url?: string;
  google_drive_file_id?: string;
  google_drive_file_url?: string;
  file_name?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: string;
  file_data?: string;
  storage_path?: string;
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

// ==============================================================================
// ANONYMOUS STUDENT REPORTING TYPES
// ==============================================================================

export type ReportCategory =
  | 'academic_concern'
  | 'classroom_incident'
  | 'student_behaviour'
  | 'teaching_learning'
  | 'facilities_infrastructure'
  | 'general_suggestion'
  | 'other';

export type ReportAudienceType =
  | 'all_students'
  | 'students_and_teachers'
  | 'specific_subject'
  | 'specific_teacher'
  | 'admin_only';

export type ReportStatus =
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'hidden'
  | 'resolved';

export interface AnonymousReport {
  id: string;
  reference_number: string; // e.g. "REP-2026-X8Y9"
  title: string;
  category: ReportCategory;
  description: string;
  audience_type: ReportAudienceType;
  subject_id?: string;
  subject_name?: string;
  target_teacher_id?: string;
  target_teacher_name?: string;
  status: ReportStatus;
  moderation_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportIdentityLink {
  report_id: string;
  reference_number: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  email: string;
  created_at: string;
}

export interface ReportAuditLog {
  id: string;
  report_id: string;
  reference_number: string;
  accessed_by: string;
  access_role: string;
  reason: string;
  timestamp: string;
}

// ==============================================================================
// TEACHER ANONYMOUS QUESTIONS & POLLS TYPES
// ==============================================================================

export type AnonymousQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'rating_scale'
  | 'short_answer'
  | 'student_feedback';

export type AnonymousQuestionStatus = 'active' | 'closed' | 'archived';

export interface AnonymousQuestion {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  title: string;
  description?: string;
  question_type: AnonymousQuestionType;
  options?: string[]; // For single_choice and multiple_choice
  rating_min?: number; // e.g. 1
  rating_max?: number; // e.g. 5
  rating_labels?: { min_label?: string; max_label?: string };
  is_anonymous: boolean; // default true
  start_date: string;
  closing_date: string;
  status: AnonymousQuestionStatus;
  min_responses_threshold?: number; // minimum responses before showing results (default 1 or 3)
  hide_results_until_closed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnonymousResponse {
  id: string;
  question_id: string;
  subject_id: string;
  question_type: AnonymousQuestionType;
  selected_option?: string;
  selected_options?: string[];
  rating_value?: number;
  written_text?: string;
  created_at: string;
}

export interface PollParticipation {
  question_id: string;
  student_id: string;
  participated_at: string;
}

export interface QuestionResponseSummary {
  question_id: string;
  total_responses: number;
  is_threshold_met: boolean;
  min_threshold: number;
  option_counts?: Record<string, number>;
  option_percentages?: Record<string, number>;
  average_rating?: number;
  rating_distribution?: Record<number, number>;
  shuffled_text_responses?: string[];
}

