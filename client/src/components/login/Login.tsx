import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { LOGIN_QUERY } from './LoginQuery';
import type { LoginQuery } from './__generated__/LoginQuery.graphql';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Heading, Stack, TextInput } from '@astryxdesign/core';
import { AdminHomeURI } from '../../routes/__generated__/routes';
import { authRequest } from '../../authRequest';

export function Login({ queryRef }: LoginProps) {
  const data = usePreloadedQuery<LoginQuery>(LOGIN_QUERY, queryRef); const login = useLogin();
  return <Layout data={data} title="Sign in" admin><Heading level={1}>Sign in</Heading><form onSubmit={login.submit} noValidate><Stack gap={4} align="stretch">
    {login.error && <p role="alert">{login.error}</p>}
    <TextInput label="Email" htmlName="email" type="email" value={login.email} onChange={login.setEmail} />
    <TextInput label="Password" htmlName="password" type="password" value={login.password} onChange={login.setPassword} />
    <Button type="submit" label="Sign in" isLoading={login.pending} />
  </Stack></form></Layout>;
}

function useLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending) return; setPending(true); setError('');
    try { await authRequest('login', { email, password }); navigate(AdminHomeURI.getURI({})); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign in failed.'); }
    finally { setPending(false); }
  }
  return { email, password, setEmail, setPassword, error, pending, submit };
}


type LoginProps = { queryRef: PreloadedQuery<LoginQuery> };
