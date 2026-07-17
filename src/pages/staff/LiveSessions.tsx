import React, { useState } from 'react';
import { Video, Calendar, Clock, Users, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LiveSessions() {
  const [sessions, setSessions] = useState([
    { id: 1, title: 'NCLEX-RN Pharmacology Review', date: 'Today', time: '14:00 - 15:30', attendees: 45, status: 'Upcoming' },
    { id: 2, title: 'Anatomy Q&A', date: 'Tomorrow', time: '10:00 - 11:00', attendees: 28, status: 'Scheduled' },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Live Sessions</h2>
          <p className="text-slate-500 text-sm">Schedule and host live review sessions for your students.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
          <Plus className="w-4 h-4" />
          Schedule Session
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Upcoming Sessions</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{session.title}</h4>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {session.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {session.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {session.attendees} Enrolled
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  session.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {session.status}
                </span>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No upcoming sessions scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
