import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  BookOpen, 
  CreditCard, 
  Sparkles, 
  Clock, 
  X, 
  ExternalLink,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'exam' | 'payment' | 'system' | 'study';
  link?: string;
  targetRole?: 'all' | 'student' | 'staff' | 'admin';
}

const DEFAULT_NOTIFICATIONS: Omit<NotificationItem, 'id'>[] = [
  {
    title: 'New NGN Case Studies Released',
    message: '15 new Next-Generation NCLEX clinical judgment case studies are now available in the Exam Bank.',
    timestamp: '10m ago',
    read: false,
    type: 'exam',
    link: '/exam-bank',
    targetRole: 'all'
  },
  {
    title: 'Subscription Access Active',
    message: 'Your NursePrep Premium Qbank plan is active. Unlimited access granted to all 3,500+ NGN questions.',
    timestamp: '2h ago',
    read: false,
    type: 'payment',
    link: '/pricing',
    targetRole: 'student'
  },
  {
    title: 'Daily Study Streak Alert',
    message: 'Complete 10 Pharmacology questions today to reach your 5-day study streak bonus!',
    timestamp: '5h ago',
    read: false,
    type: 'study',
    link: '/exam-bank',
    targetRole: 'student'
  },
  {
    title: 'Live Review Session Scheduled',
    message: 'Join Prof. Sarah for the interactive Fluid & Electrolytes review class tomorrow at 4:00 PM EST.',
    timestamp: '1d ago',
    read: true,
    type: 'system',
    link: '/live-classes',
    targetRole: 'all'
  }
];

export function NotificationBell({ userRole = 'student' }: { userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load & sync notifications from Firestore with automatic seeding if empty
  useEffect(() => {
    const q = query(collection(db, 'notifications'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial default notifications into Firestore
        DEFAULT_NOTIFICATIONS.forEach(async (notif, idx) => {
          try {
            const notifId = `notif-seed-${idx + 1}`;
            await setDoc(doc(db, 'notifications', notifId), {
              ...notif,
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error seeding notifications:', err);
          }
        });
      } else {
        const loaded: NotificationItem[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as NotificationItem));

        // Filter by targetRole if specified
        const userNotifs = loaded.filter(n => !n.targetRole || n.targetRole === 'all' || n.targetRole === userRole);
        setNotifications(userNotifs);
      }
    }, (err) => {
      console.error('Notification snapshot error:', err);
      // Fallback local memory state if Firestore encounters network issues
      setNotifications(DEFAULT_NOTIFICATIONS.map((n, i) => ({ ...n, id: `local-${i}` })));
    });

    return () => unsubscribe();
  }, [userRole]);

  // Handle outside clicks to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch {
        // fallback
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'exam':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'study':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className={`relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none ${
          isOpen ? 'bg-slate-100 text-slate-900' : ''
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] text-white flex items-center justify-center font-extrabold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white text-xs font-bold px-4 pt-2">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                filter === 'unread'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                <p className="text-xs font-medium">No notifications right now.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer group hover:bg-slate-50 ${
                    !notif.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-white shrink-0 mt-0.5 border border-slate-200/60 shadow-xs">
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2 hover:underline">
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Item Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {!notif.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as read"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      title="Delete"
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">
              NursePrep Instant Alerts & Updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
