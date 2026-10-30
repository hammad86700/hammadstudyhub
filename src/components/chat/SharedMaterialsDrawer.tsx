// ==============================================================================
// HAMMAD STUDYHUB — SHARED MATERIALS DRAWER / LOCKER
// Quick access to all notes, PDFs, drive links, and resources shared between
// CR, GR, Admin, and students in this active conversation.
// ==============================================================================

import React, { useState } from 'react';
import {
  X,
  FileText,
  Video,
  FileSpreadsheet,
  Layers,
  Award,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { SharedMaterialAttachment, ResourceType } from '../../types';
import { Button } from '../common/Button';
import { publishSharedMaterialToHub } from '../../lib/demoStore';
import { formatRelativeTime } from '../../lib/utils';

interface SharedMaterialsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  materials: SharedMaterialAttachment[];
  contactName: string;
  canPublishToHub: boolean;
  currentUserName: string;
  onOpenShareModal: () => void;
}

const getFormatIcon = (type: ResourceType) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-rose-500" />;
    case 'video':
      return <Video className="w-4 h-4 text-blue-500" />;
    case 'past_paper':
      return <Award className="w-4 h-4 text-amber-500" />;
    case 'assignment':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    case 'presentation':
      return <Layers className="w-4 h-4 text-indigo-500" />;
    default:
      return <LinkIcon className="w-4 h-4 text-cyan-500" />;
  }
};

export const SharedMaterialsDrawer: React.FC<SharedMaterialsDrawerProps> = ({
  isOpen,
  onClose,
  materials,
  contactName,
  canPublishToHub,
  currentUserName,
  onOpenShareModal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = (material: SharedMaterialAttachment) => {
    publishSharedMaterialToHub(material, currentUserName);
    setPublishedIds((prev) => new Set(prev).add(material.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-navy-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-navy-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Shared Study Materials
              </h3>
              <p className="text-[11px] text-slate-400">
                With {contactName} • {materials.length} item{materials.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Callout */}
        <div className="p-3 bg-brand-50/50 dark:bg-navy-950/60 border-b border-brand-100 dark:border-brand-900/40 flex items-center justify-between">
          <span className="text-xs text-brand-900 dark:text-brand-300 font-medium">
            Collaborative Study Locker
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenShareModal}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Share Material
          </Button>
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {materials.length > 0 ? (
            materials.map((mat) => {
              const isCopied = copiedId === mat.id;
              const isPublished = publishedIds.has(mat.id) || mat.is_hub_resource;

              return (
                <div
                  key={mat.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-navy-950/30 hover:border-brand-300 dark:hover:border-brand-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shrink-0">
                        {getFormatIcon(mat.resource_type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {mat.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                            {mat.subject_name || 'Subject'}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {mat.resource_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {mat.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {mat.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(mat.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(mat.id, mat.file_url)}
                        title="Copy file link"
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 transition-colors"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>

                      {canPublishToHub && (
                        <button
                          onClick={() => handlePublish(mat)}
                          disabled={isPublished}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            isPublished
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 cursor-default'
                              : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {isPublished ? 'On Hub' : 'Add to Hub'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No materials shared yet
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Class Representatives can exchange lecture slides, PDFs, notes, and past papers directly here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
