'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

function AdminLoginContent() {
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
      {/* Animated Background Elements - Dark/Slate tones for Admin */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-300/40 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] bg-gray-300/40 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-zinc-300/40 rounded-full blur-[100px] animate-blob animation-delay-4000" />
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
          <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:text-slate-900 bg-white/50 hover:bg-white/80 backdrop-blur-sm shadow-sm hover:shadow transition-all rounded-full px-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Options
          </Button>
        </Link>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-slate-700 to-zinc-800 text-white relative">
          <div className="relative z-10 space-y-6">
            <div className="h-12 w-12 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20 mb-8">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold leading-tight">
              Administration Portal
            </h1>
            
            <p className="text-gray-300 text-lg leading-relaxed opacity-90">
              System monitoring, user management, and platform configuration control panel.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-500">
              Secure area. Authorized personnel only.
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@parkinson.care"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                </div>
                <div className="relative transition-all duration-300">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-base shadow-lg shadow-slate-800/20 hover:shadow-slate-800/30 transition-all duration-300 group"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
