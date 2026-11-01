// ==============================================================================
// HAMMAD STUDYHUB — NOTIFICATION BELL COMPONENT
// Header dropdown displaying new academic materials and important announcements
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  AlertCircle,
  Check,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getStudentNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  StudentNotification,
} from '../../lib/notifications';
import { formatRelativeTime } from '../../lib/utils';
import { useResources } from '../../hooks/useResources';
import { useAnnouncements } from '../../hooks/useAnnouncements';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: resources } = useResources(undefined, undefined, { includeDrafts: false });
  const { data: announcements } = useAnnouncements();

  const [notifications, setNotifications] = useState<StudentNotification[]>(() =>
    getStudentNotifications(resources, announcements)
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    getUnreadNotificationCount(notifications)
  );

  const refreshNotifs = () => {
    const list = getStudentNotifications(resources, announcements);
    setNotifications(list);
    setUnreadCount(getUnreadNotificationCount(list));
  };

  useEffect(() => {
    refreshNotifs();
  }, [resources, announcements]);

  useEffect(() => {
    const handleUpdate = () => refreshNotifs();
    window.addEventListener('studyhub_notifications_updated', handleUpdate);
    window.addEventListener('studyhub_resources_updated', handleUpdate);
    return () => {
      window.removeEventListener('studyhub_notifications_updated', handleUpdate);
      window.removeEventListener('studyhub_resources_updated', handleUpdate);
    };
  }, [resources, announcements]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: StudentNotification) => {
    markNotificationAsRead(notif.id);
    refreshNotifs();
    setIsOpen(false);
    navigate(notif.targetUrl);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications);
    refreshNotifs();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70 transition-colors focus:outline-none"
        title="Notifications (New materials & announcements)"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-elevated z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-navy-950/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No notifications yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Updates on new lecture notes and announcements will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-navy-800/50 cursor-pointer transition-colors flex items-start gap-3 text-left ${
                    !notif.isRead ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'announcement'
                        ? notif.priority
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}
                  >
                    {notif.type === 'announcement' ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/announcements');
              }}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              View All Announcements &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
