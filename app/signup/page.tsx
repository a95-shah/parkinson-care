'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/lib/supabase/auth';
import { UserRole } from '@/lib/supabase/config';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!signupData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!signupData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(signupData.email)) newErrors.email = 'Email is invalid';
    if (!signupData.password) newErrors.password = 'Password is required';
    else if (signupData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (signupData.password !== signupData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const { user, error, needsConfirmation } = await signUp({
        email: signupData.email,
        password: signupData.password,
        fullName: signupData.fullName,
        role: selectedRole,
        phone: signupData.phone || undefined,
      });

      if (error) {
        setErrors({ general: error.message });
        setIsLoading(false);
        return;
      }

      if (needsConfirmation) {
        toast.info('Account created', {
          description: `Please check your email (${signupData.email}) to confirm.`,
        });
        setSuccessMessage(
          `Account created! Please check your email (${signupData.email}) to confirm.`
        );
        setIsLoading(false);
        return;
      }

      const dashboardUrl = selectedRole === 'patient' 
        ? '/dashboard/patient?event=signup' 
        : selectedRole === 'caretaker'
        ? '/dashboard/caretaker?event=signup'
        : '/dashboard/admin?event=signup';
      
      window.location.href = dashboardUrl;
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred' });
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const { error } = await signInWithGoogle();
      if (error) setErrors({ general: error.message });
    } catch (err) {
      setErrors({ general: 'Failed to sign up with Google' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[20%] left-[-10%] w-[35%] h-[35%] bg-emerald-200/40 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>
      
       <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Main Container */}
       <div className="relative z-10 w-full max-w-\[1100px] grid lg:grid-cols-2 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-linear-to-br from-teal-600 to-emerald-600 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1571772996211-2f02c9727629?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="h-12 w-12 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20 mb-8">
              <span className="text-2xl font-bold">P</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight">
              Join the future of inclusive care
            </h1>
            
            <p className="text-teal-50 text-lg leading-relaxed opacity-90">
              Create your account today to start monitoring, tracking, and improving your health journey with advanced tools tailored for you.
            </p>

            <div className="flex flex-col gap-4 mt-8">
              {['Personalized Health Insights', 'Secure Data Privacy', 'Easy Family Integration'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
             <p className="text-gray-500">
              Join us to get started on your journey
            </p>
          </div>

          <div className="space-y-4">
            {successMessage && (
              <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm border border-green-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                 <CheckCircle2 className="w-5 h-5" />
                 {successMessage}
              </div>
            )}
            
            {errors.general && (
               <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                 <span className="h-2 w-2 rounded-full bg-red-600"></span>
                 {errors.general}
               </div>
            )}

            {/* INFO ALERT */}
            <div className="bg-blue-50/80 backdrop-blur-sm text-blue-700 p-3 rounded-xl text-sm border border-blue-100 flex items-center gap-2">
              <span className="font-semibold text-blue-800 shrink-0">Note:</span>
              Only Patients can sign up. Caretakers must be invited.
            </div>

            <div className="space-y-3">
              <div className="space-y-1 group">
                <Label htmlFor="fullName" className="text-gray-700 font-medium text-xs">Full Name</Label>
                <div className="relative transition-all duration-300">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    disabled={isLoading}
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                  />
                </div>
                 {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-1 group">
                <Label htmlFor="email" className="text-gray-700 font-medium text-xs">Email</Label>
                <div className="relative transition-all duration-300">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    disabled={isLoading}
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

               {/* <div className="space-y-1 group">
                <Label htmlFor="phone" className="text-gray-700 font-medium text-xs">Phone (Optional)</Label>
                <div className="relative transition-all duration-300">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    disabled={isLoading}
                   value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                  />
                </div>
              </div> */}

              <div className="space-y-1 group">
                <Label htmlFor="password" className="text-gray-700 font-medium text-xs">Password</Label>
                <div className="relative transition-all duration-300">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    disabled={isLoading}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                  />
                </div>
                 {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              
              <div className="space-y-1 group">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-xs">Confirm Password</Label>
                <div className="relative transition-all duration-300">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    disabled={isLoading}
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                  />
                </div>
                 {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>

             <Button onClick={handleSignup} disabled={isLoading} className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-all duration-300 group mt-2">
                {isLoading ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                   <>
                      Sign Up
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignup} className="w-full h-11 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-medium transition-all">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </div>
              )}
            </Button>
            
            <p className="px-8 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-teal-600 hover:text-teal-700 font-semibold hover:underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}