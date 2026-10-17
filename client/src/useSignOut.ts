import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { LoginURI } from './routes/__generated__/routes';
import { authRequest } from './authRequest';

/** Prepares a CSRF token while someone is signed in, and signs them out to the login page. */
export function useSignOut(signedIn: boolean) {
  const navigate = useNavigate();
  const [csrf, setCsrf] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json()).then((value: { token: string }) => { if (active) setCsrf(value.token); }).catch(() => { if (active) setError('Could not prepare sign out. Reload and try again.'); });
    return () => { active = false; };
  }, [signedIn]);
  async function signOut() { await authRequest('logout', undefined, csrf); navigate(LoginURI.getURI({})); }
  return { ready: csrf !== '', error, signOut };
}
