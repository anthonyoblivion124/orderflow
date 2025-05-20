
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullScreenLoader from '@/components/FullScreenLoader';

export default function SettingsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Return a loader or null while redirecting
  return <FullScreenLoader message="Redirecting..." />;
}
