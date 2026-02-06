'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, ArrowRight, Stethoscope, ArrowLeft } from 'lucide-react';

function CaretakerLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push('/dashboard?event=login');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
      {/* Animated Background Elements - Cool blue tones for Caretaker */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-cyan-200/40 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[100px] animate-blob animation-delay-4000" />
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

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="gap-2 text-teal-700 hover:text-teal-900 bg-white/50 hover:bg-white/80 backdrop-blur-sm shadow-sm hover:shadow transition-all rounded-full px-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Options
          </Button>
        </Link>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-teal-600 to-cyan-600 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="h-12 w-12 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20 mb-8">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold leading-tight">
              Professional Care Management
            </h1>
            
            <p className="text-teal-100 text-lg leading-relaxed opacity-90">
              Efficiently manage patient data, monitor vital signs, and provide the best care with our integrated tools.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Caretaker Login</h2>
            <p className="text-gray-500">
              Welcome back. Please sign in to continue.
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="h-2 w-2 rounded-full bg-red-600"></span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative transition-all duration-300">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Link 
                    href="/forgot-password"
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative transition-all duration-300">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-base shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-all duration-300 group"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              disabled={isLoading} 
              onClick={handleGoogleLogin} 
              className="w-full h-12 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-medium transition-all"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Sign in with Google
            </Button>
            
            {/* Note: No signup link for caretakers as they should be invited */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Need access? Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaretakerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <CaretakerLoginContent />
    </Suspense>
  );
}
