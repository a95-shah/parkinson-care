'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeartPulse, Stethoscope, ShieldCheck, ArrowRight, Activity, ArrowLeft } from 'lucide-react';

export default function LoginLandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-rose-200/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-teal-200/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-indigo-200/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="absolute top-6 left-6 z-20 animate-in fade-in slide-in-from-left-4 duration-700">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 bg-white/50 hover:bg-white/80 backdrop-blur-sm shadow-sm hover:shadow transition-all rounded-full px-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="relative z-10 max-w-4xl w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-2 animate-bounce-slow">
            <Activity className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Welcome to Parkinson Care
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            Select your portal to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* Patient Card */}
          <Link href="/login/patient" className="group">
            <Card className="h-full relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/50 hover:border-rose-200 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-300 p-5 flex flex-col items-center text-center group-hover:-translate-y-1 rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-rose-100 transition-all duration-300">
                <HeartPulse className="w-7 h-7 text-rose-500 group-hover:text-rose-600 transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">Patient</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">
                Track symptoms and view daily health insights
              </p>
              
              <Button variant="ghost" size="sm" className="mt-auto w-full bg-rose-50/50 text-rose-600 hover:bg-rose-600 hover:text-white group-hover:shadow-md transition-all duration-300 h-9">
                Enter Portal <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            </Card>
          </Link>

          {/* Caretaker Card */}
          <Link href="/login/caretaker" className="group">
            <Card className="h-full relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/50 hover:border-teal-200 shadow-sm hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-300 p-5 flex flex-col items-center text-center group-hover:-translate-y-1 rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-100 transition-all duration-300">
                <Stethoscope className="w-7 h-7 text-teal-500 group-hover:text-teal-600 transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">Caretaker</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">
                Monitor patients and manage care plans
              </p>
              
              <Button variant="ghost" size="sm" className="mt-auto w-full bg-teal-50/50 text-teal-600 hover:bg-teal-600 hover:text-white group-hover:shadow-md transition-all duration-300 h-9">
                Enter Portal <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            </Card>
          </Link>

          {/* Admin Card */}
          <Link href="/login/admin" className="group">
            <Card className="h-full relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/50 hover:border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 p-5 flex flex-col items-center text-center group-hover:-translate-y-1 rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-slate-200 transition-all duration-300">
                <ShieldCheck className="w-7 h-7 text-slate-600 group-hover:text-slate-800 transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">Admin</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">
                System configuration and user management
              </p>
              
              <Button variant="ghost" size="sm" className="mt-auto w-full bg-slate-100/50 text-slate-600 hover:bg-slate-800 hover:text-white group-hover:shadow-md transition-all duration-300 h-9">
                Enter Portal <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            </Card>
          </Link>
        </div>
        
        <div className="text-center pt-8 animate-in fade-in delay-500 duration-700">
           <p className="text-sm text-slate-400">
             &copy; 2026 Parkinson Care. All rights reserved.
           </p>
        </div>
      </div>
    </div>
  );
}