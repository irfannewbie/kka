import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Judul panel yang ditampilkan saat terjadi error. */
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Penangkap error tingkat aplikasi.
 *
 * Tanpa komponen ini, satu runtime error pada view tertentu (mis. data korup
 * dari spreadsheet) akan mematikan seluruh halaman (blank screen). Dengan
 * ErrorBoundary, pengguna melihat panel pemulihan dan dapat mencoba lagi
 * tanpa kehilangan seluruh sesi.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen w-full bg-[#F2EFEB] flex items-center justify-center p-5">
        <div className="max-w-lg w-full bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 font-mono-code">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 bg-rose-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
              {this.props.title || 'Terjadi Kesalahan Aplikasi'}
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Bagian ini mengalami error tak terduga. Data Anda tetap tersimpan. Coba muat ulang
            bagian ini, atau muat ulang seluruh halaman bila masalah berlanjut.
          </p>

          {this.state.error && (
            <pre className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-2 mb-4 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#2e59e6] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer border border-blue-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>COBA LAGI</span>
            </button>
            <button
              onClick={this.handleReload}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold cursor-pointer border border-[#1a1a1a]"
            >
              MUAT ULANG HALAMAN
            </button>
          </div>
        </div>
      </div>
    );
  }
}
