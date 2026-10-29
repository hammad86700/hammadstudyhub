// ==============================================================================
// HAMMAD STUDYHUB — CSV BULK RESOURCE IMPORT MODAL
// Validates row data, previews valid records, and reports line errors
// ==============================================================================

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Subject, Resource } from '../../types';
import { parseResourcesCSV, ParsedCsvRow } from '../../lib/utils';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface CsvBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onImport: (resources: any[]) => Promise<void>;
  isLoading?: boolean;
}

export const CsvBulkImportModal: React.FC<CsvBulkImportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onImport,
  isLoading = false,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    if (!csvText.trim()) return;
    const rows = parseResourcesCSV(csvText, selectedSubjectId);
    setParsedRows(rows);
    setStep('preview');
  };

  const handleDownloadSample = () => {
    const sample = `Title,Subject,Type,Lesson Date,Topic,Chapter,Tags,Status,External URL\n"Lesson 01: Introduction","Computer Programming",pdf,2026-10-25,"Basic Concepts","Chapter 1","intro;c++",published,"https://drive.google.com/file/d/1sample_drive_link_here/view"\n"Lesson 02: Loops & Control Flow","Computer Programming",whiteboard,2026-10-27,"Loops Practice","Chapter 2","loops;diagrams",published,"https://drive.google.com/file/d/1sample_whiteboard_link/view"`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studyhub_sample_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const errorRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = async () => {
    const resourcesToSave = validRows.map((r) => ({
      ...r.data,
      subject_id: selectedSubjectId,
    }));
    await onImport(resourcesToSave);
    setCsvText('');
    setParsedRows([]);
    setStep('input');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Resources (CSV)"
      description="Quickly import multiple lesson resources, Google Drive links, and dates at once."
      maxWidth="4xl"
    >
      {step === 'input' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs">
            <span className="text-brand-800 dark:text-brand-300">
              Need the expected CSV column format?
            </span>
            <button
              onClick={handleDownloadSample}
              type="button"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Target Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Paste CSV Content
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Title,Subject,Type,Lesson Date,Topic,Chapter,Tags,Status,External URL\n"Lesson 01 Notes","Computer Programming",pdf,2026-10-25,"Intro","Ch1","c++",published,"https://drive.google.com/file/d/..."`}
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!csvText.trim()}
              onClick={handleParse}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Preview & Validate Rows
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {validRows.length} Valid {validRows.length === 1 ? 'Resource' : 'Resources'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Ready to publish</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {errorRows.length} Rejected {errorRows.length === 1 ? 'Row' : 'Rows'}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">Contains validation errors</p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5">Row</th>
                  <th className="p-2.5">Title</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Lesson Date</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? '' : 'bg-red-50/50 dark:bg-red-950/20'}
                  >
                    <td className="p-2.5 font-mono text-slate-400">{row.rowNumber}</td>
                    <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {row.data?.title || 'Empty'}
                    </td>
                    <td className="p-2.5 uppercase font-mono text-[10px]">
                      {row.data?.resource_type}
                    </td>
                    <td className="p-2.5 font-mono">{row.data?.lesson_date}</td>
                    <td className="p-2.5">
                      {row.isValid ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold" title={row.errors.join(' | ')}>
                          {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => setStep('input')}>
              Back to Editor
            </Button>
            <Button
              size="sm"
              disabled={validRows.length === 0}
              onClick={handleConfirmImport}
              isLoading={isLoading}
            >
              Import {validRows.length} Valid Resources
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
