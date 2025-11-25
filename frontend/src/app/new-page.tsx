import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/auth/login');
  
  // This return won't be reached due to the redirect above
  return null;
}
