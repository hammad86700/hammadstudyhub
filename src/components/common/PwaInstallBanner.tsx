// ==============================================================================
// HAMMAD STUDYHUB — PWA INSTALL BANNER & PROMPT CONTROLLER
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = sessionStorage.getItem('studyhub_pwa_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS or browser without beforeinstallprompt: show helpful guide
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('studyhub_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-brand-900 via-navy-900 to-brand-950 text-white border-b border-brand-800/60 py-2.5 px-4 shadow-sm relative z-40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300 shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <p className="truncate">
              <span className="font-semibold text-white">Install StudyHub App:</span> Quick offline access to all your notes and study materials.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="accent"
              className="text-xs py-1 px-3 h-7 font-semibold"
              onClick={handleInstallClick}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Install App
            </Button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal for iOS / unsupported browsers */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Install Hammad StudyHub on Your Device"
        description="Follow these simple steps to install the app on your home screen."
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 py-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-slate-700">
            <CheckCircle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">On iPhone / iPad (Safari):</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Tap the <strong className="text-slate-800 dark:text-slate-200">Share</strong> icon at the bottom of the screen, scroll down, and tap <strong className="text-slate-800 dark:text-slate-200">&quot;Add to Home Screen&quot;</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-slate-700">
            <CheckCircle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">On Android (Chrome / Edge):</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Tap the three-dot menu icon in the upper right, and choose <strong className="text-slate-800 dark:text-slate-200">&quot;Install App&quot;</strong> or <strong className="text-slate-800 dark:text-slate-200">&quot;Add to Home Screen&quot;</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-slate-700">
            <CheckCircle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">On Windows / Mac (Desktop):</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Click the install icon in your address bar (right side next to bookmarks star) to run as an independent desktop window.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={() => setShowGuideModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
