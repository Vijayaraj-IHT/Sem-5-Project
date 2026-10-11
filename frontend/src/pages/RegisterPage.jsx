import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Calculate password strength score and metadata
 *
 * @param {string} password 
 * @returns {{ score: number, label: string, colorClass: string, feedback: string[] }}
 */
const calculatePasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: '', colorClass: 'bg-slate-700', feedback: [] };
  }

  let score = 0;
  const feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one numeric digit (0-9)');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one special symbol (!@#$%...)');
  }

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', colorClass: 'bg-rose-500', feedback };
    case 2:
      return { score: 2, label: 'Fair', colorClass: 'bg-amber-500', feedback };
    case 3:
      return { score: 3, label: 'Good', colorClass: 'bg-blue-500', feedback };
    case 4:
      return { score: 4, label: 'Strong', colorClass: 'bg-emerald-500', feedback };
    default:
      return { score: 0, label: 'Very Weak', colorClass: 'bg-rose-600', feedback };
  }
};

/**
 * RegisterPage Component
 *
 * Registration portal for Lexguard platform with role-based field validation
 * and real-time password strength indicator.
 */
const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'public',
    credentialId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset credentialId if role switched to public
      ...(name === 'role' && value === 'public' ? { credentialId: '' } : {}),
    }));
    if (error) setError('');
  };

  const validate = () => {
    const { name, email, password, confirmPassword, role, credentialId } = formData;

    if (!name.trim()) {
      return 'Please provide your full legal or professional name.';
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please create a secure password.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters in length.';
    }

    if (password !== confirmPassword) {
      return 'Password confirmation does not match the entered password.';
    }

    if (role === 'advocate' && !credentialId.trim()) {
      return 'Bar Council Registration ID is required for advocates.';
    }

    if (role === 'scholar' && !credentialId.trim()) {
      return 'Institution ID or University name is required for legal scholars.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        credential_id: formData.credentialId.trim() || null,
      };

      await register(payload);

      // Successfully registered - redirect to login page with alert
      navigate('/login', {
        state: {
          message:
            formData.role === 'public'
              ? 'Account registered successfully! You may now sign in.'
              : 'Account registered successfully! Pending institutional verification. You may now sign in.',
        },
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Account registration failed. Please review your details and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-inner flex items-center justify-center text-amber-500 mb-4 ring-1 ring-amber-500/20">
            <Scale className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-serif flex items-center gap-1.5">
            LEX<span className="text-amber-500">GUARD</span>
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-widest text-slate-400 font-mono font-medium">
            Legal Case Research & Verification System
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Create User Account</h2>
            <p className="text-sm text-slate-400 mt-1">
              Join the Lexguard verified repository network.
            </p>
          </div>

          {/* Error alert box */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Adv. Rajesh Kumar"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rajesh.kumar@barcouncil.in"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label
                htmlFor="register-role"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Account Role <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="register-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                >
                  <option value="public">Public User</option>
                  <option value="advocate">Advocate</option>
                  <option value="scholar">Legal Scholar / Student</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {formData.role === 'public' &&
                  'Standard access to public judicial records and precedent searches.'}
                {formData.role === 'advocate' &&
                  'Requires Bar Council credentials; unlocks legal draft analysis and citations.'}
                {formData.role === 'scholar' &&
                  'Requires academic affiliation; unlocks research library and scholarly tools.'}
              </p>
            </div>

            {/* Conditional Credential Fields */}
            {formData.role === 'advocate' && (
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-amber-500/30 space-y-1.5 animate-fadeIn">
                <label
                  htmlFor="register-credential-advocate"
                  className="block text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Bar Council Registration ID <span className="text-amber-400">*</span>
                </label>
                <input
                  id="register-credential-advocate"
                  name="credentialId"
                  type="text"
                  required
                  value={formData.credentialId}
                  onChange={handleChange}
                  placeholder="e.g. D/1234/2018"
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
                <span className="text-[11px] text-slate-400">
                  Used for verified state bar validation and privileged drafting rights.
                </span>
              </div>
            )}

            {formData.role === 'scholar' && (
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-amber-500/30 space-y-1.5 animate-fadeIn">
                <label
                  htmlFor="register-credential-scholar"
                  className="block text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Institution ID / University <span className="text-amber-400">*</span>
                </label>
                <input
                  id="register-credential-scholar"
                  name="credentialId"
                  type="text"
                  required
                  value={formData.credentialId}
                  onChange={handleChange}
                  placeholder="e.g. National Law School of India / ID# 8829"
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
                <span className="text-[11px] text-slate-400">
                  Used to verify academic research accreditation.
                </span>
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full pl-11 pr-11 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Strength:</span>
                    <span className="font-semibold text-slate-200">{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-colors duration-200 ${
                          step <= passwordStrength.score ? passwordStrength.colorClass : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Confirm Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-11 pr-11 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-sm tracking-wide shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Already have an account link */}
          <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-amber-400 hover:text-amber-300 transition-colors focus:outline-none focus:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500 font-mono tracking-wide">
            Court record access governed by Lexguard Cryptographic Trust Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
