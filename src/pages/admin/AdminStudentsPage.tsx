// ==============================================================================
// HAMMAD STUDYHUB — ADMIN STUDENT DIRECTORY & CR/GR ROLE MANAGEMENT
// Accessible ONLY to Master Administrator.
// Shows all registered student records and allows appointing CR and GR.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  Search,
  ShieldCheck,
  Award,
  Crown,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle,
  Filter,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  getRegisteredStudents,
  updateStudentRole,
  deleteStudent,
  mergeRegisteredStudentsLocally,
  RegisteredStudentEntry,
} from '../../lib/demoStore';
import { UserRole, Gender } from '../../types';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../lib/utils';

export const AdminStudentsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<RegisteredStudentEntry[]>(() => getRegisteredStudents());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Gender>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const fetchRemoteStudents = async () => {
    setIsRefreshing(true);
    let remote: RegisteredStudentEntry[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('registered_students')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          remote = data as RegisteredStudentEntry[];
        }
      } catch (err) {
        console.warn('Could not fetch remote students:', err);
      }
    }
    const merged = mergeRegisteredStudentsLocally(remote);
    setStudents(merged);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRemoteStudents();

    const handleUpdate = () => {
      setStudents(getRegisteredStudents());
    };
    window.addEventListener('studyhub_students_updated', handleUpdate);
    return () => window.removeEventListener('studyhub_students_updated', handleUpdate);
  }, []);

  // Strict Security Boundary: CR & GR cannot see student records
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Restricted Administrator Access
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Student records and representative appointments can only be viewed and managed by the Master Administrator. Representative privileges are focused exclusively on managing course resources, notes, and announcements.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (studentId: string, name: string, newRole: 'student' | 'cr' | 'gr') => {
    const roleLabel = newRole === 'cr' ? 'Class Representative (CR)' : newRole === 'gr' ? 'Girls Representative (GR)' : 'Standard Student';
    if (window.confirm(`Update ${name}'s role to ${roleLabel}?`)) {
      updateStudentRole(studentId, newRole);
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('registered_students')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', studentId);
        } catch (e) {
          console.warn('Remote student role update error:', e);
        }
      }
    }
  };

  const handleDelete = async (studentId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student profile "${name}"?`)) {
      deleteStudent(studentId);
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('registered_students')
            .delete()
            .eq('id', studentId);
        } catch (e) {
          console.warn('Remote student delete error:', e);
        }
      }
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.display_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(search.toLowerCase())) ||
      (s.program_name && s.program_name.toLowerCase().includes(search.toLowerCase()));

    const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    return matchesSearch && matchesGender && matchesRole;
  });

  const totalCount = students.length;
  const crStudent = students.find((s) => s.role === 'cr');
  const grStudent = students.find((s) => s.role === 'gr');
  const maleCount = students.filter((s) => s.gender === 'male').length;
  const femaleCount = students.filter((s) => s.gender === 'female').length;

  return (
    <div className="space-y-6">
      <SEOHead title="Student Directory & Representative Management — Admin Hub" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Registered Students & Representatives</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View student accounts, phone contacts, academic programs, and appoint Class Representatives (CR & GR).
          </p>
        </div>

        <button
          onClick={fetchRemoteStudents}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors shadow-subtle disabled:opacity-50"
          title="Refresh students from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Directory'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Registered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-xs text-slate-400">
              {maleCount} Boys &bull; {femaleCount} Girls
            </span>
          </div>
        </Card>

        {/* Current CR */}
        <Card className="p-4 border border-brand-200 dark:border-brand-900/60 bg-brand-50/30 dark:bg-navy-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-brand-300">
            <span>Class Representative (CR)</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {crStudent ? crStudent.display_name : 'No CR Assigned'}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {crStudent ? `${crStudent.roll_no || crStudent.email}` : 'Appoint a student below'}
          </p>
        </Card>

        {/* Current GR */}
        <Card className="p-4 border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-navy-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-300">
            <span>Girls Representative (GR)</span>
            <Award className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {grStudent ? grStudent.display_name : 'No GR Assigned'}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {grStudent ? `${grStudent.roll_no || grStudent.email}` : 'Appoint a female student below'}
          </p>
        </Card>

        {/* CR/GR Privileges Note */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-navy-950/50 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Representative Powers:
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            CR & GR can publish and edit course notes & notices. They cannot see other students&apos; data or admin settings.
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, email, or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Genders</option>
            <option value="male">Boys Only</option>
            <option value="female">Girls Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Standard Students</option>
            <option value="cr">CR Only</option>
            <option value="gr">GR Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Program & Semester</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Appoint Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {st.display_name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{st.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {st.roll_no || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          st.gender === 'male'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                        }`}
                      >
                        {st.gender === 'male' ? 'Male (Boy)' : 'Female (Girl)'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {st.program_name || 'General Program'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {st.semester || '1st Semester'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {st.phone ? (
                        <a
                          href={`https://wa.me/${st.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{st.phone}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {st.role === 'cr' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Crown className="w-3 h-3" />
                          <span>CR</span>
                        </span>
                      ) : st.role === 'gr' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          <Award className="w-3 h-3" />
                          <span>GR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Student
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Appoint as CR */}
                        {st.role !== 'cr' && (
                          <button
                            onClick={() => handleRoleChange(st.id, st.display_name, 'cr')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
                            title="Appoint as Class Representative"
                          >
                            Make CR
                          </button>
                        )}

                        {/* Appoint as GR */}
                        {st.role !== 'gr' && (
                          <button
                            onClick={() => handleRoleChange(st.id, st.display_name, 'gr')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                            title="Appoint as Girls Representative"
                          >
                            Make GR
                          </button>
                        )}

                        {/* Demote to standard student */}
                        {(st.role === 'cr' || st.role === 'gr') && (
                          <button
                            onClick={() => handleRoleChange(st.id, st.display_name, 'student')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                            title="Demote to Standard Student"
                          >
                            Set Student
                          </button>
                        )}

                        {/* Delete action */}
                        <button
                          onClick={() => handleDelete(st.id, st.display_name)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete student account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No students registered yet"
              description="Students who register via the Sign Up page will appear here with full details. You can appoint any student as CR or GR."
            />
          </div>
        )}
      </Card>
    </div>
  );
};

