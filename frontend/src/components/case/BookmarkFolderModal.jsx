import React, { useState } from 'react';
import { X, Bookmark, FolderPlus, Tag, Check, Trash2 } from 'lucide-react';

const SUGGESTED_FOLDERS = [
  'Bail & Pre-Arrest Grounds',
  'Section 482 Quashing / Inherent Powers',
  'Cheque Dishonour (S.138 NI Act)',
  'Constitutional Writs (Art. 226)',
  'NDPS Commercial Quantity Standards',
  'General Legal Precedents',
];

export default function BookmarkFolderModal({
  isOpen,
  onClose,
  caseTitle,
  initialNotes = '',
  onSaveBookmark,
  onRemoveBookmark,
  isCurrentlyBookmarked = false,
  loading = false,
}) {
  const [selectedFolder, setSelectedFolder] = useState('General Legal Precedents');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const formattedNotes = `[${selectedFolder}] ${customNote.trim()}`.trim();
    onSaveBookmark(formattedNotes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Save Precedent to Research Folder</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{caseTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Select Folder */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              Research Folder / Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_FOLDERS.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setSelectedFolder(folder)}
                  className={`p-2 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer ${
                    selectedFolder === folder
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-xs'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {folder}
                </button>
              ))}
            </div>
          </div>

          {/* Research Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Advocate Research Note (Optional)
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Citing paragraph 14 for non-compliance with Section 41A CrPC guidelines..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isCurrentlyBookmarked ? (
              <button
                type="button"
                onClick={onRemoveBookmark}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Bookmark
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Folders sync with /bookmarks</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? 'Saving...' : 'Save to Folder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
