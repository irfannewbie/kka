import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'YA, KONFIRMASI',
  cancelText = 'BATAL',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F2EFEB]/90 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="confirmation-modal"
        className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-mono-code text-xs"
      >
        <div className="p-5">
          <div className="flex items-center space-x-2.5 mb-3 border-b border-[#1a1a1a] pb-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <h3 className="font-bold text-xs uppercase text-[#1a1a1a]">{title}</h3>
          </div>

          <p className="text-xs text-[#1a1a1a] mb-4 leading-relaxed bg-[#F2EFEB] p-3 border border-[#1a1a1a]">
            {message}
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              id="btn-cancel-modal"
              onClick={onCancel}
              className="px-3.5 py-2 border border-[#1a1a1a] bg-[#F2EFEB] hover:bg-slate-200 text-xs font-bold"
            >
              {cancelText}
            </button>
            <button
              id="btn-confirm-modal"
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold text-white transition-all shadow-[2px_2px_0px_#000] ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#1a1a1a] hover:bg-[#2e59e6]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
