import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useBlocker } from 'react-router';
import { Button, Heading, Stack, TextInput, TextArea } from '@astryxdesign/core';
import { Markdown } from '../markdown/Markdown';

const CONTENT_FIELDS = ['title', 'slug', 'content', 'excerpt', 'enquiryUrl'];
const PROFILE_FIELDS = ['displayName'];

export function ContentForm({ kind, row, save, detail }: ContentFormProps) {
  const form = useContentForm(kind, row, save, detail);
  return <form ref={form.element} onSubmit={form.submit} noValidate>
    <Stack gap={4} align="stretch">
      {form.error && <p role="alert">{form.error}</p>}
      {kind === 'User' ? <>
        <TextInput label="Display name" htmlName="displayName" description="Shown as the author of posts." value={form.values.displayName} onChange={value => form.change('displayName', value)} status={form.invalid.displayName ? { type: 'error' } : undefined} />
      </> : <>
        <TextInput label="Title" htmlName="title" value={form.values.title} onChange={value => form.change('title', value)} status={form.invalid.title ? { type: 'error' } : undefined} />
        <TextInput label="Slug" htmlName="slug" value={form.values.slug} onChange={value => form.change('slug', value)} status={form.invalid.slug ? { type: 'error' } : undefined} description={row ? 'Changing the slug changes the public URL.' : 'Lowercase letters and numbers separated by hyphens.'} />
        <TextArea label="Content" htmlName="content" value={form.values.content} onChange={value => form.change('content', value)} status={form.invalid.content ? { type: 'error' } : undefined} />
        <TextInput label="Excerpt" htmlName="excerpt" value={form.values.excerpt} onChange={value => form.change('excerpt', value)} status={form.invalid.excerpt ? { type: 'error' } : undefined} />
        {kind === 'Product' && <TextInput label="Enquiry URL" htmlName="enquiryUrl" value={form.values.enquiryUrl} onChange={value => form.change('enquiryUrl', value)} status={form.invalid.enquiryUrl ? { type: 'error' } : undefined} />}
      </>}
      <Button type="submit" label={row ? 'Save' : 'Create'} isLoading={form.pending} />
      {kind !== 'User' && <section aria-label="Markdown preview"><Heading level={2}>Preview</Heading><Markdown content={form.values.content} /></section>}
    </Stack>
  </form>;
}

function useContentForm(kind: string, row: ContentFormRow | null | undefined, save: ContentFormProps['save'], detail: ContentFormProps['detail']) {
  const initial = initialValues(row);
  const [values, setValues] = useState(initial);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const element = useRef<HTMLFormElement>(null);
  const clean = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(values) !== clean.current;
  const navigate = useNavigate();
  const blocker = useBlocker(() => JSON.stringify(values) !== clean.current);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Discard unsaved changes?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', before);
    return () => { window.removeEventListener('beforeunload', before); };
  }, [dirty]);
  function change(field: string, value: string) { setValues(previous => ({ ...previous, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending) return;
    const errors = validateValues(kind, values);
    setInvalid(errors);
    const first = Object.keys(errors)[0];
    if (first) { setError('Please correct the highlighted fields.'); element.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    setPending(true); setError('');
    try {
      const fields = kind === 'User' ? PROFILE_FIELDS : kind === 'Product' ? CONTENT_FIELDS : CONTENT_FIELDS.slice(0, 4);
      const input: Record<string, unknown> = Object.fromEntries(fields.map(field => [field, field === 'enquiryUrl' ? values[field] || null : values[field]]));
      if (row) input.id = row.id;
      const id = await save(input);
      clean.current = JSON.stringify(values);
      navigate(detail(id), { state: { notice: row ? 'Saved successfully.' : 'Created successfully.' } });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Save failed. Your edits have been kept.'); }
    finally { setPending(false); }
  }
  return { values, invalid, error, pending, element, change, submit };
}

function initialValues(row: ContentFormRow | null | undefined): Record<string, string> {
  return Object.fromEntries([...CONTENT_FIELDS, ...PROFILE_FIELDS].map(field => [field, typeof row?.[field] === 'string' ? row[field] : '']));
}

function validateValues(kind: string, values: Record<string, string>): Record<string, boolean> {
  const errors: Record<string, boolean> = {};
  if (kind === 'User') {
    if (!values.displayName.trim() || values.displayName.length > 100) errors.displayName = true;
  } else {
    if (!values.title.trim() || values.title.length > 200) errors.title = true;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) || values.slug.length > 160) errors.slug = true;
    if (values.excerpt.length > 300) errors.excerpt = true;
    if (kind === 'Product' && values.enquiryUrl && !isSafeEnquiry(values.enquiryUrl)) errors.enquiryUrl = true;
  }
  return errors;
}

function isSafeEnquiry(value: string): boolean {
  if (value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname || url.protocol === 'mailto:' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url.pathname); } catch { return false; }
}

type ContentFormRow = { readonly id: string; readonly [field: string]: unknown };
type ContentFormProps = { kind: string; row?: ContentFormRow | null; save: (input: Record<string, unknown>) => Promise<string>; detail: (id: string) => string };
