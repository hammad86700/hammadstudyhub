// ==============================================================================
// HAMMAD STUDYHUB — SYSTEM STORAGE METRICS UTILITIES
// Computes live used, available, and categorized storage capacity for StudyHub
// ==============================================================================

import { Resource, Subject } from '../types';

export const DEFAULT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5.00 GB Tier

/**
 * Parses file size string (e.g. "1.24 MB", "500 KB", "1024 B") or derives from base64 data
 */
export function parseFileSizeToBytes(sizeStr?: string, fileData?: string): number {
  if (sizeStr && typeof sizeStr === 'string') {
    const trimmed = sizeStr.trim();
    const match = trimmed.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = (match[2] || 'B').toUpperCase();
      if (!isNaN(val)) {
        if (unit === 'TB') return Math.round(val * 1024 * 1024 * 1024 * 1024);
        if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
        if (unit === 'MB') return Math.round(val * 1024 * 1024);
        if (unit === 'KB') return Math.round(val * 1024);
        return Math.round(val);
      }
    }
  }

  // Fallback: derive byte size from base64 data URL length
  if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
    const base64Part = fileData.split(',')[1] || '';
    return Math.round((base64Part.length * 3) / 4);
  }

  return 0;
}

/**
 * Formats byte size into human-readable representation
 */
export function formatStorageBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export interface TypeStorageBreakdown {
  bytes: number;
  count: number;
  formatted: string;
  percentage: number;
}

export interface SubjectStorageBreakdown {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  bytes: number;
  count: number;
  formatted: string;
  percentage: number;
}

export interface StorageMetrics {
  totalUsedBytes: number;
  totalLimitBytes: number;
  availableBytes: number;
  usedPercentage: number;
  availablePercentage: number;
  totalFilesCount: number;
  formattedUsed: string;
  formattedAvailable: string;
  formattedLimit: string;
  byType: Record<string, TypeStorageBreakdown>;
  bySubject: SubjectStorageBreakdown[];
}

/**
 * Calculates complete storage metrics from active resources and subjects
 */
export function calculateStorageMetrics(
  resources: Resource[],
  subjects: Subject[] = [],
  customLimitBytes = DEFAULT_STORAGE_LIMIT_BYTES
): StorageMetrics {
  let totalUsedBytes = 0;
  let totalFilesCount = 0;

  const byTypeMap: Record<string, { bytes: number; count: number }> = {
    pdf: { bytes: 0, count: 0 },
    presentation: { bytes: 0, count: 0 },
    whiteboard: { bytes: 0, count: 0 },
    assignment: { bytes: 0, count: 0 },
    past_paper: { bytes: 0, count: 0 },
    video: { bytes: 0, count: 0 },
    other: { bytes: 0, count: 0 },
  };

  const subjectMap = new Map<string, { name: string; code: string; bytes: number; count: number }>();
  subjects.forEach((s) => {
    subjectMap.set(s.id, { name: s.name, code: s.code || '', bytes: 0, count: 0 });
  });

  resources.forEach((res) => {
    const bytes = parseFileSizeToBytes(res.file_size, res.file_data);
    totalUsedBytes += bytes;

    if (bytes > 0 || res.file_name || res.file_data) {
      totalFilesCount++;
    }

    const typeKey = res.resource_type || 'other';
    if (!byTypeMap[typeKey]) {
      byTypeMap[typeKey] = { bytes: 0, count: 0 };
    }
    byTypeMap[typeKey].bytes += bytes;
    byTypeMap[typeKey].count += 1;

    // Subject breakdown
    const subId = res.subject_id;
    if (subId) {
      const existing = subjectMap.get(subId);
      if (existing) {
        existing.bytes += bytes;
        existing.count += 1;
      } else {
        subjectMap.set(subId, {
          name: res.subject?.name || 'General Subject',
          code: res.subject?.code || '',
          bytes,
          count: 1,
        });
      }
    }
  });

  const availableBytes = Math.max(0, customLimitBytes - totalUsedBytes);
  const usedPercentage = customLimitBytes > 0 ? Math.min(100, (totalUsedBytes / customLimitBytes) * 100) : 0;
  const availablePercentage = Math.max(0, 100 - usedPercentage);

  const byTypeFormatted: Record<string, TypeStorageBreakdown> = {};
  Object.keys(byTypeMap).forEach((type) => {
    const data = byTypeMap[type];
    byTypeFormatted[type] = {
      bytes: data.bytes,
      count: data.count,
      formatted: formatStorageBytes(data.bytes),
      percentage: totalUsedBytes > 0 ? (data.bytes / totalUsedBytes) * 100 : 0,
    };
  });

  const bySubjectFormatted: SubjectStorageBreakdown[] = Array.from(subjectMap.entries())
    .map(([id, val]) => ({
      subjectId: id,
      subjectName: val.name,
      subjectCode: val.code,
      bytes: val.bytes,
      count: val.count,
      formatted: formatStorageBytes(val.bytes),
      percentage: totalUsedBytes > 0 ? (val.bytes / totalUsedBytes) * 100 : 0,
    }))
    .filter((s) => s.count > 0 || s.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  return {
    totalUsedBytes,
    totalLimitBytes: customLimitBytes,
    availableBytes,
    usedPercentage: Number(usedPercentage.toFixed(2)),
    availablePercentage: Number(availablePercentage.toFixed(2)),
    totalFilesCount,
    formattedUsed: formatStorageBytes(totalUsedBytes),
    formattedAvailable: formatStorageBytes(availableBytes),
    formattedLimit: formatStorageBytes(customLimitBytes),
    byType: byTypeFormatted,
    bySubject: bySubjectFormatted,
  };
}

