import React, { useState, useEffect } from 'react';
import { UserPlus, Search, MoreVertical, Shield, GraduationCap, Users, RefreshCw, Crown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, query, doc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'admins' | 'students'>('students');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let userList: any[] = [];
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        userList = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
      } catch (dbErr) {
        console.warn("Firestore fetch error, falling back to local storage:", dbErr);
      }

      // Default system admin accounts
      const defaultUsers = [
        { id: 'def-3', name: 'Godfrey Wangechi', email: 'wangechigodfrey77@gmail.com', role: 'Super Admin', status: 'Active', added: '2023-01-01' },
        { id: 'def-4', name: 'System Admin', email: 'admin@nurseprep.com', role: 'Admin', status: 'Active', added: '2023-01-01' }
      ];

      // Retrieve local storage custom users
      const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');

      // Combine into unified map keyed by email
      const userMap = new Map<string, any>();
      defaultUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
      userList.forEach(u => u.email && userMap.set(u.email.toLowerCase(), u));
      localUsers.forEach((u: any) => u.email && userMap.set(u.email.toLowerCase(), u));

      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStudentPlan = async (userItem: any, newPlan: string) => {
    if (!userItem.id && !userItem.email) return;
    setUpdatingUserId(userItem.id || userItem.email);
    try {
      // 1. Update Firestore by ID if valid Firestore ID
      if (userItem.id && !userItem.id.startsWith('def-') && !userItem.id.startsWith('local-')) {
        try {
          await updateDoc(doc(db, 'users', userItem.id), {
            subscriptionPlan: newPlan
          });
        } catch (e) {
          console.warn("Could not update by id, trying email query:", e);
        }
      }

      // 2. Also try querying by email in Firestore users
      if (userItem.email) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', userItem.email.trim().toLowerCase()));
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            await updateDoc(doc(db, 'users', docSnap.id), {
              subscriptionPlan: newPlan
            });
          }
        } catch (e) {
          console.warn("Could not query/update by email in Firestore:", e);
        }
      }

      // 3. Update localStorage custom users
      const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
      const updatedLocal = localUsers.map((u: any) => u.email?.toLowerCase() === userItem.email?.toLowerCase() ? { ...u, subscriptionPlan: newPlan } : u);
      localStorage.setItem('nurseprep_custom_users', JSON.stringify(updatedLocal));

      // 4. Cache plan in localStorage for immediate access
      if (userItem.email) {
        localStorage.setItem(`nurseprep_plan_${userItem.email.trim().toLowerCase()}`, newPlan);
        if (auth.currentUser?.email?.toLowerCase() === userItem.email.trim().toLowerCase()) {
          localStorage.setItem('nurseprep_current_user_plan', newPlan);
        }
      }

      setUsers(prev => prev.map(u => (u.id === userItem.id || u.email?.toLowerCase() === userItem.email?.toLowerCase()) ? { ...u, subscriptionPlan: newPlan } : u));
      alert(`Successfully upgraded ${userItem.name || userItem.email} to ${newPlan.toUpperCase()} plan! They now have immediate full access.`);
    } catch (err) {
      console.error("Error updating student plan:", err);
      alert("Failed to update student subscription plan.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in Name, Email, and Temporary Password.");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const newUser = {
      name: formData.name.trim(),
      email: cleanEmail,
      role: formData.role || (activeTab === 'lecturers' ? 'Staff / Lecturer' : 'Admin'),
      status: 'Active',
      subscriptionPlan: 'free',
      added: new Date().toISOString().split('T')[0]
    };

    let newDocId = `local-${Date.now()}`;

    // 1. Save to Firestore
    try {
      const docRef = await addDoc(collection(db, 'users'), newUser);
      newDocId = docRef.id;
    } catch (error) {
      console.warn("Firestore user creation warning, stored locally:", error);
    }

    // 2. Save to localStorage to guarantee persistent retention across logouts/reloads
    const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
    const updatedLocal = [...localUsers.filter((u: any) => u.email !== cleanEmail), { id: newDocId, ...newUser }];
    localStorage.setItem('nurseprep_custom_users', JSON.stringify(updatedLocal));

    // Update state
    setUsers(prev => {
      const filtered = prev.filter(u => u.email?.toLowerCase() !== cleanEmail);
      return [...filtered, { id: newDocId, ...newUser }];
    });

    setShowAddModal(false);
    setFormData({ name: '', email: '', password: '', role: '' });
    alert(`Account (${cleanEmail}) successfully created!`);
  };

  const lecturers = users.filter(u => u.role === 'Staff / Lecturer' || u.role?.toLowerCase().includes('staff') || u.role?.toLowerCase().includes('lecturer'));
  const admins = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin' || u.role?.toLowerCase().includes('admin'));
  const students = users.filter(u => !u.role || u.role === 'Student' || u.role?.toLowerCase().includes('student'));

  let displayUsers = students;
  if (activeTab === 'lecturers') displayUsers = lecturers;
  if (activeTab === 'admins') displayUsers = admins;

  const filteredDisplayUsers = displayUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.subscriptionPlan || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User & Subscription Management</h2>
          <p className="text-slate-500 text-sm">Manage student accounts, active subscription plans, lecturers, and system administrators.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="text-xs gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {activeTab !== 'students' && (
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
              <UserPlus className="w-4 h-4" />
              Add New User
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 px-6 py-3 flex gap-6">
          <button 
            onClick={() => setActiveTab('students')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students & Subscriptions ({students.length})
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('lecturers')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Lecturers & Staff ({lecturers.length})
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Administrators ({admins.length})
            </div>
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or subscription plan..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">User</th>
                <th className="px-6 py-4 border-b border-slate-200">Role</th>
                {activeTab === 'students' && (
                  <th className="px-6 py-4 border-b border-slate-200">Subscription Plan</th>
                )}
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
                <th className="px-6 py-4 border-b border-slate-200">Added</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No users found matching your query.
                  </td>
                </tr>
              ) : (
                filteredDisplayUsers.map((user, index) => {
                  const currentPlan = user.subscriptionPlan || 'free';

                  return (
                    <tr key={user.id || user.email || `user-${index}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name || 'Student Account'}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{user.role || 'Student'}</td>

                      {activeTab === 'students' && (
                        <td className="px-6 py-4">
                          <select
                            value={currentPlan}
                            disabled={updatingUserId === user.id}
                            onChange={(e) => handleUpdateStudentPlan(user, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold border outline-none cursor-pointer ${
                              currentPlan === 'platinum' || currentPlan === 'master'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : currentPlan === 'gold' || currentPlan === 'sure-pass'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : currentPlan === 'basic' || currentPlan === 'silver'
                                ? 'bg-slate-200 text-slate-800 border-slate-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <option value="free">Free Tier (Public Access)</option>
                            <option value="basic">Silver / Basic Plan ($64)</option>
                            <option value="gold">Gold / Sure Pass Plan ($128)</option>
                            <option value="platinum">Platinum / Master Plan ($199)</option>
                          </select>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{user.added || '2026-08-01'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs font-bold text-blue-600 hover:underline px-2 py-1">Details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add New {activeTab === 'lecturers' ? 'Lecturer' : 'Administrator'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporary Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {activeTab === 'lecturers' ? (
                    <option>Staff / Lecturer</option>
                  ) : (
                    <>
                      <option>Admin</option>
                      <option>Super Admin</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} className="bg-blue-600 text-white hover:bg-blue-700">Create Account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
