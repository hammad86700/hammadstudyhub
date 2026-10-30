// ==============================================================================
// HAMMAD STUDYHUB — CONTACT ADMIN MODAL
// Direct WhatsApp & Instagram redirect for students requesting study materials
// WhatsApp: 03242779514 | Instagram: not_urs_hammi
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Instagram,
  Send,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { getPlatformSocials } from '../../lib/demoStore';
import { PlatformSocials } from '../../types';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
}) => {
  const [socials, setSocials] = useState<PlatformSocials>(() => getPlatformSocials());

  useEffect(() => {
    const handleUpdate = () => {
      setSocials(getPlatformSocials());
    };
    window.addEventListener('studyhub_socials_updated', handleUpdate);
    return () => window.removeEventListener('studyhub_socials_updated', handleUpdate);
  }, []);

  const whatsappHref = initialTopic
    ? `https://wa.me/${socials.whatsapp_number.replace(/\D/g, '').startsWith('0') ? '92' + socials.whatsapp_number.replace(/\D/g, '').substring(1) : socials.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hello Muhammad Hammad, I am studying on Hammad StudyHub and need specific material for: "${initialTopic}".`
      )}`
    : socials.whatsapp_url || 'https://wa.me/923242779514';

  const instagramHref = socials.instagram_url || `https://instagram.com/${socials.instagram_id.replace('@', '')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Learning Materials & Contact Admin"
      description="Need a specific chapter PDF, past paper solution, or whiteboard snapshot? Muhammad Hammad is available directly on WhatsApp and Instagram."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Creator Identity Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-navy-900 dark:to-navy-950 border border-brand-200 dark:border-brand-800/60 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
            MH
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Muhammad Hammad</h4>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Founder & Administrator &bull; Hammad StudyHub
            </p>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-2.5">
          {/* WhatsApp Direct Action */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Direct WhatsApp
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Fastest
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                  {socials.whatsapp_number}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          {/* Instagram Direct Action */}
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/50 dark:bg-pink-950/20 hover:bg-pink-100/50 dark:hover:bg-pink-950/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Instagram Direct (DM)
                </span>
                <p className="text-xs text-pink-700 dark:text-pink-400 font-mono font-medium">
                  @{socials.instagram_id.replace('@', '')}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          {/* In-Platform Chat Alternative */}
          <Link
            to="/chat"
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-navy-900/60 hover:bg-brand-100/50 dark:hover:bg-brand-950/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  In-Platform System Chat
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Message CR, GR, or Admin inside StudyHub
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
              Open &rarr;
            </span>
          </Link>
        </div>

        {/* Tip footer */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed pt-1">
          Feel free to mention your semester, subject code, or chapter name so the requested material can be uploaded right away.
        </p>
      </div>
    </Modal>
  );
};
