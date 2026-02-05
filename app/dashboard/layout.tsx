import React from 'react';
import DashboardNotifier from '@/components/DashboardNotifier';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNotifier />
      {children}
    </>
  );
}
