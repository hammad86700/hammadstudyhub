// ==============================================================================
// HAMMAD STUDYHUB — STUDENT REGISTRATION / SIGNUP PAGE
// Allows students to create personal profiles and access learning resources
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Gender } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';

export const StudentSignupPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [rollNo, setRollNo] = useState('');
  const [programName, setProgramName] = useState('ADP Computer Science');
  const [semester, setSemester] = useState('1st Semester');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUpStudent, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/subjects', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
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
      navigate('/subjects', { replace: true });
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      <SEOHead
        title="Student Sign Up — Hammad StudyHub"
        description="Register for Hammad StudyHub to access semester materials, whiteboard notes, and message representatives."
      />

      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Create Student Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Join Hammad StudyHub to explore daily lecture notes, revision playlists, and student messaging.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            required
            autoFocus
            leftIcon={<User className="w-4 h-4" />}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Ali Raza or Fatima Noor"
          />

          {/* Email Address */}
          <Input
            label="Email Address"
            type="email"
            required
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
          />

          {/* Gender Selector (Crucial for Boys/Girls Representative Chat Rule) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  gender === 'male'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span>Male (Boy)</span>
                {gender === 'male' && <CheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  gender === 'female'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span>Female (Girl)</span>
                {gender === 'female' && <CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              * Used to configure peer communication channels with the Class Representative (CR) and Girls Representative (GR).
            </p>
          </div>

          {/* Roll Number & Phone */}
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

          {/* Program & Semester */}
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
            Complete Student Registration
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Already registered?</span>
          <Link
            to="/login"
            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};

