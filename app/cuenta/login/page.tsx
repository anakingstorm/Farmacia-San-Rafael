import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string } }) {
  const callbackUrl = searchParams?.callbackUrl || '/';
  return <LoginForm callbackUrl={callbackUrl} />;
}
