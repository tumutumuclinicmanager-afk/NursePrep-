import React, { useState, useEffect } from 'react';
import { UserPlus, Search, MoreVertical, Shield, GraduationCap, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('lecturers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let userList: any[] = [];
        try {
          const q = query(collection(db, 'users'));
          const querySnapshot = await getDocs(q);
          userList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (dbErr) {
          console.warn("Firestore fetch error, falling back to local storage:", dbErr);
        }

        // Default system admin accounts
        const defaultUsers = [
          { id: 'def-3', name: 'Godfrey Wangechi', email: 'wangechigodfrey77@gmail.com', role: 'Super Admin', status: 'Active', added: '2023-01-01', password: 'password123' },
          { id: 'def-4', name: 'System Admin', email: 'admin@nurseprep.ai', role: 'Admin', status: 'Active', added: '2023-01-01', password: 'password123' }
        ];

        // Seed Firestore if empty
        if (userList.length === 0) {
          for (const u of defaultUsers) {
            try {
              await addDoc(collection(db, 'users'), u);
            } catch (e) {
              console.warn("Failed to seed user to Firestore:", e);
            }
          }
        }

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

    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in Name, Email, and Temporary Password.");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const newUser = {
      name: formData.name.trim(),
      email: cleanEmail,
      password: formData.password,
      role: formData.role || (activeTab === 'lecturers' ? 'Staff / Lecturer' : 'Admin'),
      status: 'Active',
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
    alert(`Lecturer/Staff account (${cleanEmail}) successfully created and saved! They can now log in using these credentials.`);
  };

  const lecturers = users.filter(u => u.role === 'Staff / Lecturer' || u.role?.toLowerCase().includes('staff') || u.role?.toLowerCase().includes('lecturer'));
  const admins = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin' || u.role?.toLowerCase().includes('admin'));
  const displayUsers = activeTab === 'lecturers' ? lecturers : admins;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 text-sm">Manage staff and admin accounts.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 px-6 py-3 flex gap-6">
          <button 
            onClick={() => setActiveTab('lecturers')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Lecturers & Staff
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Administrators
            </div>
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
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
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
                <th className="px-6 py-4 border-b border-slate-200">Added</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayUsers.map((user, index) => (
                <tr key={user.id || user.email || `user-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{user.added}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-xs font-bold text-blue-600 hover:underline px-2 py-1">Reset Password</button>
                      <button className="p-1 text-slate-400 hover:text-slate-600 rounded"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
