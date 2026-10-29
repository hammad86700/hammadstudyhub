// ==============================================================================
// HAMMAD STUDYHUB — UTILITY FUNCTIONS
// ==============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Resource, ResourceType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a YYYY-MM-DD date string to a human-readable format without timezone shifting
 */
export function formatLessonDate(dateStr: string, options: { includeDayOfWeek?: boolean; format?: 'short' | 'full' } = {}): string {
  if (!dateStr) return '';
  
  // Parse YYYY-MM-DD parts explicitly to avoid UTC/local offset bugs
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateStr;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const monthName = options.format === 'full' ? fullMonthNames[month] : monthNames[month];

  if (options.includeDayOfWeek) {
    return `${dayNames[d.getDay()]}, ${monthName} ${day}, ${year}`;
  }
  return `${monthName} ${day}, ${year}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Human-readable relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatLessonDate(dateString.substring(0, 10));
}

/**
 * Generates a clean URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Groups a collection of resources by their lesson_date in descending order
 */
export function groupResourcesByDate(resources: Resource[]): { date: string; resources: Resource[] }[] {
  const groups: Record<string, Resource[]> = {};

  for (const item of resources) {
    const key = item.lesson_date || 'Unscheduled';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  // Sort dates descending
  const sortedDates = Object.keys(groups).sort((a, b) => {
    if (a === 'Unscheduled') return 1;
    if (b === 'Unscheduled') return -1;
    return b.localeCompare(a);
  });

  return sortedDates.map((date) => ({
    date,
    resources: groups[date],
  }));
}

/**
 * Visual styling and metadata for resource types
 */
export function getResourceTypeMeta(type: ResourceType) {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF Notes',
        shortLabel: 'PDF',
        iconName: 'FileText',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
        dotColor: 'bg-red-500',
      };
    case 'video':
      return {
        label: 'Lecture Video',
        shortLabel: 'Video',
        iconName: 'Video',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dotColor: 'bg-blue-500',
      };
    case 'whiteboard':
      return {
        label: 'Whiteboard & Diagram',
        shortLabel: 'Whiteboard',
        iconName: 'Image',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'assignment':
      return {
        label: 'Assignment / Worksheet',
        shortLabel: 'Assignment',
        iconName: 'ClipboardCheck',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    case 'presentation':
      return {
        label: 'Presentation Slides',
        shortLabel: 'Slides',
        iconName: 'Presentation',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dotColor: 'bg-purple-500',
      };
    case 'past_paper':
      return {
        label: 'Past Paper / Solution',
        shortLabel: 'Past Paper',
        iconName: 'GraduationCap',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        dotColor: 'bg-indigo-500',
      };
    default:
      return {
        label: 'Study Material',
        shortLabel: 'Resource',
        iconName: 'Bookmark',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotColor: 'bg-slate-400',
      };
  }
}

/**
 * Exports resources to CSV format
 */
export function exportResourcesToCSV(resources: Resource[], subjectName?: string): string {
  const headers = ['Title', 'Subject', 'Type', 'Lesson Date', 'Topic', 'Chapter', 'Tags', 'Status', 'External URL'];
  const rows = resources.map((r) => [
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${(subjectName || r.subject?.name || '').replace(/"/g, '""')}"`,
    r.resource_type,
    r.lesson_date,
    `"${(r.topic || '').replace(/"/g, '""')}"`,
    `"${(r.chapter || '').replace(/"/g, '""')}"`,
    `"${(r.tags || []).join(';')}"`,
    r.status,
    `"${r.external_url}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Validates and parses a CSV text for bulk resource importing
 */
export interface ParsedCsvRow {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  data?: Partial<Resource>;
}

export function parseResourcesCSV(csvText: string, defaultSubjectId: string): ParsedCsvRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const results: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const rowNumber = i + 1;
    const errors: string[] = [];

    // Simple CSV splitter that respects quoted commas
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));

    const rowObj: Record<string, string> = {};
    headers.forEach((hdr, idx) => {
      rowObj[hdr] = cells[idx] || '';
    });

    const title = rowObj['title'] || cells[0] || '';
    const type = (rowObj['type'] || rowObj['resource_type'] || cells[2] || 'pdf').toLowerCase() as ResourceType;
    const lessonDate = rowObj['lesson date'] || rowObj['lesson_date'] || cells[3] || getTodayDateString();
    const url = rowObj['external url'] || rowObj['url'] || cells[8] || cells[cells.length - 1] || '';
    const topic = rowObj['topic'] || cells[4] || '';
    const chapter = rowObj['chapter'] || cells[5] || '';
    const tagsRaw = rowObj['tags'] || cells[6] || '';
    const tags = tagsRaw ? tagsRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [];

    if (!title) errors.push('Title is required.');
    if (!url) errors.push('External URL is required.');

    const validTypes: ResourceType[] = ['pdf', 'video', 'whiteboard', 'assignment', 'presentation', 'past_paper', 'other'];
    if (!validTypes.includes(type)) {
      errors.push(`Invalid resource type "${type}". Allowed: ${validTypes.join(', ')}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) {
      errors.push('Lesson date must be in YYYY-MM-DD format.');
    }

    results.push({
      rowNumber,
      isValid: errors.length === 0,
      errors,
      data: {
        title,
        slug: slugify(title),
        subject_id: defaultSubjectId,
        resource_type: validTypes.includes(type) ? type : 'pdf',
        lesson_date: lessonDate,
        external_url: url,
        topic: topic || undefined,
        chapter: chapter || undefined,
        tags,
        status: 'published',
      },
    });
  }

  return results;
}
