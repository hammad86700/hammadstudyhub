// ==============================================================================
// HAMMAD STUDYHUB — UNIFIED REGISTRATION (STUDENT & TEACHER PORTAL)
// Allows students to create accounts and teachers to submit applications for
// administrator review and subject assignments.
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { Gender } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';

export const StudentSignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [accountType, setAccountType] = useState<'student' | 'teacher'>(initialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [rollNo, setRollNo] = useState('');
  const [programName, setProgramName] = useState('ADP Computer Science');
  const [semester, setSemester] = useState('1st Semester');
  const [phone, setPhone] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherSubmitted, setTeacherSubmitted] = useState(false);

  const { signUpStudent, registerTeacher, isLoggedIn } = useAuth();
  const { data: availableSubjects = [] } = useSubjects();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    if (accountType === 'teacher') {
      if (selectedSubjectIds.length === 0) {
        setIsSubmitting(false);
        setErrorMessage('Please select at least one subject you want to teach.');
        return;
      }

      const res = await registerTeacher({
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        gender,
        requested_subject_ids: selectedSubjectIds,
      });
      setIsSubmitting(false);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setTeacherSubmitted(true);
      }
    } else {
      // Student signup
      const res = await signUpStudent({
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        gender,
        roll_no: rollNo.trim(),
        program_name: programName.trim(),
        semester,
        phone: phone.trim(),
      });
      setIsSubmitting(false);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  if (teacherSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-20 space-y-6">
        <SEOHead title="Application Submitted — Hammad StudyHub" />
        <Card className="p-8 text-center space-y-6 border border-emerald-200 dark:border-emerald-800 shadow-card">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Teacher Application Submitted!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{displayName}</strong>. Your teacher application has been securely received and is
              currently <span className="font-bold text-amber-600 dark:text-amber-400">Pending Administrator Approval</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Next Steps in Approval Workflow:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Master Administrator (Muhammad Hammad) reviews your requested subjects.</li>
              <li>Once verified, your account is approved and assigned your official subjects.</li>
              <li>You can then sign in directly to access the dedicated <strong>Teacher Dashboard</strong>.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="md" variant="primary" className="w-full sm:w-auto font-bold px-6">
                Go to Sign In
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button size="md" variant="outline" className="w-full sm:w-auto font-bold px-6">
                Back to Homepage
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      <SEOHead
        title={accountType === 'teacher' ? 'Teacher Registration — Hammad StudyHub' : 'Student Sign Up — Hammad StudyHub'}
        description="Register for Hammad StudyHub to manage subjects, upload assignments, and access study materials."
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
          {accountType === 'teacher' ? <BookOpen className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {accountType === 'teacher' ? 'Teacher Registration' : 'Create Student Account'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {accountType === 'teacher'
            ? 'Apply to teach subjects, create tests, and manage student assignment submissions.'
            : 'Join Hammad StudyHub to access lecture notes, revision playlists, and upload assignments.'}
        </p>
      </div>

      {/* Account Type Toggle Pill */}
      <div className="flex p-1 bg-slate-100 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setAccountType('student');
            setErrorMessage('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            accountType === 'student'
              ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Student Account
        </button>
        <button
          type="button"
          onClick={() => {
            setAccountType('teacher');
            setErrorMessage('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            accountType === 'teacher'
              ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Teacher Application
        </button>
      </div>

      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Teacher Approval Advisory Notice */}
          {accountType === 'teacher' && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Administrator Review Required</p>
                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                  Teacher accounts require Admin approval before accessing the Teacher Dashboard. Muhammad Hammad will
                  verify your requested subjects.
                </p>
              </div>
            </div>
          )}

          {/* Full Name */}
          <Input
            label={accountType === 'teacher' ? 'Teacher Full Name' : 'Full Name'}
            type="text"
            required
            autoFocus
            leftIcon={<User className="w-4 h-4" />}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={accountType === 'teacher' ? 'e.g. Prof. Muhammad Tariq' : 'e.g. Ali Raza or Fatima Noor'}
          />

          {/* Email Address */}
          <Input
            label="Email Address"
            type="email"
            required
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={accountType === 'teacher' ? 'teacher@example.com' : 'student@example.com'}
          />

          {/* Gender Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span>Male</span>
                {gender === 'male' && <CheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span>Female</span>
                {gender === 'female' && <CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              </button>
            </div>
          </div>

          {/* Teacher Subject Selection (Loaded directly from existing subjects) */}
          {accountType === 'teacher' ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Subject(s) to Teach <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  {selectedSubjectIds.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose one or multiple subjects from the platform's active curriculum:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-slate-800">
                {availableSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubjectSelection(sub.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="truncate block font-bold">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 block">{sub.code}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Student-Specific Fields: Roll No & Academic Program */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Roll Number / Student ID"
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 24-CS-042"
                />

                <Input
                  label="Phone / WhatsApp Number"
                  type="tel"
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0324XXXXXXX"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Academic Program"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  options={[
                    { value: 'ADP Computer Science', label: 'ADP Computer Science (CS)' },
                    { value: 'BS Computer Science', label: 'BS Computer Science' },
                    { value: 'BS Software Engineering', label: 'BS Software Engineering' },
                    { value: 'BS Information Technology', label: 'BS Information Technology' },
                    { value: 'ADP English', label: 'ADP English' },
                    { value: 'Other Academic Program', label: 'Other Degree Program' },
                  ]}
                />

                <Select
                  label="Current Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  options={[
                    { value: '1st Semester', label: '1st Semester' },
                    { value: '2nd Semester', label: '2nd Semester' },
                    { value: '3rd Semester', label: '3rd Semester' },
                    { value: '4th Semester', label: '4th Semester' },
                    { value: '5th Semester', label: '5th Semester' },
                    { value: '6th Semester', label: '6th Semester' },
                    { value: '7th Semester', label: '7th Semester' },
                    { value: '8th Semester', label: '8th Semester' },
                  ]}
                />
              </div>
            </>
          )}

          {/* Contact Number for Teacher */}
          {accountType === 'teacher' && (
            <Input
              label="Contact / WhatsApp Number (Optional)"
              type="tel"
              leftIcon={<Phone className="w-4 h-4" />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03001234567"
            />
          )}

          {/* Password & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          <Button
            type="submit"
            size="md"
            className="w-full font-semibold mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {accountType === 'teacher' ? 'Submit Teacher Application' : 'Complete Student Registration'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Already registered?</span>
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Sign In Here &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};
