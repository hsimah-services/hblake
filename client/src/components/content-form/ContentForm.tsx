import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useBlocker } from 'react-router';
import { Button, CheckboxInput, Heading, NumberInput, RadioList, RadioListItem, Stack, Text, TextInput } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { Markdown } from '../markdown/Markdown';
import { RichTextEditor } from '../rich-text/RichTextEditor';

const CONTENT_FIELDS = ['title', 'slug', 'content', 'excerpt'];
// What each kind of record adds: an item has an enquiry link and a kind label; a page chooses the kind of item it holds.
const EXTRA_FIELDS: Readonly<Record<string, readonly string[]>> = { Item: ['enquiryUrl', 'kind'], Page: ['defaultItemKind'] };
const PROFILE_FIELDS = ['displayName'];
// Page placement (#13), kept as strings in the form and converted on save.
const PLACEMENT_DEFAULTS: Readonly<Record<string, string>> = { showInNavigation: 'true', navigationOrder: '100', featureOnHome: 'false', homeOrder: '100', accent: 'INK' };
const ACCENTS = [['INK', 'None (no home tile)'], ['GREEN', 'Green'], ['ORANGE', 'Orange'], ['BLUE', 'Blue'], ['BERRY', 'Berry']] as const;

export function ContentForm({ kind, row, defaults, save, detail, publication }: ContentFormProps) {
  const form = useContentForm(kind, row, defaults, save, detail);
  const publish = usePublication(publication, form.dirty);
  if (kind === 'User') return <form ref={form.element} onSubmit={form.submit} noValidate>
    <Stack gap={4} align="stretch">
      {form.error && <p role="alert">{form.error}</p>}
      <TextInput label="Display name" htmlName="displayName" description="Shown as the author of what you write." value={form.values.displayName} onChange={value => form.change('displayName', value)} status={form.invalid.displayName ? { type: 'error' } : undefined} />
      <Button type="submit" label="Save" isLoading={form.pending} />
    </Stack>
  </form>;
  // Writing on the left, publishing details on the right (stacked on narrow screens). The
  // reading and Tab order is Title, Slug, Content, then the panel: Excerpt and Save.
  return <form ref={form.element} onSubmit={form.submit} noValidate>
    {form.error && <p role="alert">{form.error}</p>}
    <div {...stylex.props(styles.layout)}>
      <Stack gap={4} align="stretch" xstyle={styles.main}>
        <TextInput label="Title" htmlName="title" value={form.values.title} onChange={value => form.change('title', value)} status={form.invalid.title ? { type: 'error' } : undefined} />
        <TextInput label="Slug" htmlName="slug" value={form.values.slug} onChange={value => form.change('slug', value)} status={form.invalid.slug ? { type: 'error' } : undefined} description={row ? 'Changing the slug changes the public URL.' : 'Filled in from the title until you edit it. Lowercase letters and numbers separated by hyphens.'} />
        {/* Pages and items are written as rich text, stored as Markdown. */}
        <RichTextEditor label="Content" name="content" value={form.values.content} onChange={value => form.change('content', value)} invalid={form.invalid.content} />
        <section aria-label="Markdown preview"><Heading level={2}>Preview</Heading><Markdown content={form.values.content} /></section>
      </Stack>
      <aside aria-label="Publishing" {...stylex.props(styles.panel)}><Stack gap={4} align="stretch">
        {publication && <Stack gap={2} align="stretch">
          <Text weight="semibold">Status: {publication.status === 'PUBLISHED' ? 'Published' : 'Draft'}</Text>
          {publish.error && <p role="alert">{publish.error}</p>}
          <Button label={publication.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} clickAction={publish.toggle} isLoading={publish.pending} isDisabled={form.dirty} />
          {form.dirty && <Text color="secondary" size="sm">Save your changes before publishing.</Text>}
        </Stack>}
        <TextInput label="Excerpt" htmlName="excerpt" value={form.values.excerpt} onChange={value => form.change('excerpt', value)} status={form.invalid.excerpt ? { type: 'error' } : undefined} description="Shown in lists and search results." />
        {kind === 'Item' && <>
          <TextInput label="Enquiry URL" htmlName="enquiryUrl" value={form.values.enquiryUrl} onChange={value => form.change('enquiryUrl', value)} status={form.invalid.enquiryUrl ? { type: 'error' } : undefined} description="An https link or a mailto address. Shown as an Enquire link." />
          <TextInput label="Kind" htmlName="kind" value={form.values.kind} onChange={value => form.change('kind', value)} status={form.invalid.kind ? { type: 'error' } : undefined} description="What sort of item this is, such as Article or Product." />
        </>}
        {kind === 'Page' && <TextInput label="Item kind" htmlName="defaultItemKind" value={form.values.defaultItemKind} onChange={value => form.change('defaultItemKind', value)} status={form.invalid.defaultItemKind ? { type: 'error' } : undefined} description="Leave empty unless this page holds items. New items are given this kind." />}
        {kind === 'Page' && <fieldset {...stylex.props(styles.placement)}>
          <legend {...stylex.props(styles.legend)}>Placement</legend>
          <Stack gap={3} align="stretch">
          <CheckboxInput label="Show in navigation" value={form.values.showInNavigation === 'true'} onChange={checked => form.change('showInNavigation', String(checked))} />
          <NumberInput label="Navigation order" htmlName="navigationOrder" value={Number(form.values.navigationOrder)} onChange={value => form.change('navigationOrder', String(value))} min={0} max={999} step={1} status={form.invalid.navigationOrder ? { type: 'error' } : undefined} description="Lower numbers come first." />
          <CheckboxInput label="Feature on home page" value={form.values.featureOnHome === 'true'} onChange={checked => form.change('featureOnHome', String(checked))} description="As a coloured tile. At most four show, by home order." />
          <NumberInput label="Home order" htmlName="homeOrder" value={Number(form.values.homeOrder)} onChange={value => form.change('homeOrder', String(value))} min={0} max={999} step={1} status={form.invalid.homeOrder ? { type: 'error' } : undefined} />
          <RadioList label="Colour" htmlName="accent" value={form.values.accent} onChange={value => form.change('accent', value)} status={form.invalid.accent ? { type: 'error' } : undefined} description="The tile colour and the navigation hover colour. Featured pages need one.">
            {ACCENTS.map(([value, label]) => <RadioListItem key={value} value={value} label={label} />)}
          </RadioList>
        </Stack></fieldset>}
        <Button type="submit" label={row ? 'Save' : 'Create'} variant="primary" isLoading={form.pending} />
      </Stack></aside>
    </div>
  </form>;
}

function useContentForm(kind: string, row: ContentFormRow | null | undefined, defaults: ContentFormProps['defaults'], save: ContentFormProps['save'], detail: ContentFormProps['detail']) {
  const initial = initialValues(row, defaults);
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
  // On a new record the slug follows the title until it is edited; clearing it resumes
  // following. Existing records never change their slug (it is the public URL).
  const slugEdited = useRef(false);
  function change(field: string, value: string) {
    if (field === 'slug') slugEdited.current = value !== '';
    const follow = field === 'title' && !row && !slugEdited.current;
    setValues(previous => ({ ...previous, [field]: value, ...(follow ? { slug: slugFrom(value) } : {}) }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending) return;
    const errors = validateValues(kind, values);
    setInvalid(errors);
    const first = Object.keys(errors)[0];
    if (first) { setError('Please correct the highlighted fields.'); element.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    setPending(true); setError('');
    try {
      const fields = kind === 'User' ? PROFILE_FIELDS : [...CONTENT_FIELDS, ...(EXTRA_FIELDS[kind] ?? [])];
      // Cleared optional fields are sent as null.
      const nullable = ['enquiryUrl', 'defaultItemKind'];
      const input: Record<string, unknown> = Object.fromEntries(fields.map(field => [field, nullable.includes(field) ? values[field].trim() || null : values[field]]));
      if (kind === 'Page') Object.assign(input, placementInput(values));
      if (row) input.id = row.id;
      const id = await save(input);
      clean.current = JSON.stringify(values);
      navigate(detail(id), { state: { notice: row ? 'Saved successfully.' : 'Created successfully.' } });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Save failed. Your edits have been kept.'); }
    finally { setPending(false); }
  }
  return { values, invalid, error, pending, element, change, submit, dirty };
}

/** A title as a slug: lowercase ASCII words joined by single hyphens, at most 160 characters. */
function slugFrom(title: string): string {
  const words = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (words.length <= 160) return words;
  const cut = words.slice(0, 161);
  return cut.slice(0, cut.lastIndexOf('-') > 0 ? cut.lastIndexOf('-') : 160).replace(/-+$/, '');
}

/** Publish or unpublish the saved record from the panel; refused while edits are unsaved. */
function usePublication(publication: ContentFormProps['publication'], dirty: boolean) {
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function toggle() {
    if (!publication || dirty) return;
    setPending(true); setError('');
    try { await publication.toggle(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication failed.'); }
    finally { setPending(false); }
  }
  return { pending, error, toggle };
}

function initialValues(row: ContentFormRow | null | undefined, defaults: Readonly<Record<string, string>> | undefined): Record<string, string> {
  const fields = [...CONTENT_FIELDS, ...PROFILE_FIELDS, ...Object.values(EXTRA_FIELDS).flat()];
  return {
    ...Object.fromEntries(fields.map(field => [field, typeof row?.[field] === 'string' ? row[field] : defaults?.[field] ?? ''])),
    ...Object.fromEntries(Object.entries(PLACEMENT_DEFAULTS).map(([field, fallback]) => {
      const value = row?.[field];
      return [field, typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' ? String(value) : fallback];
    })),
  };
}

function placementInput(values: Record<string, string>) {
  return {
    showInNavigation: values.showInNavigation === 'true', navigationOrder: Number(values.navigationOrder),
    featureOnHome: values.featureOnHome === 'true', homeOrder: Number(values.homeOrder), accent: values.accent,
  };
}

function validateValues(kind: string, values: Record<string, string>): Record<string, boolean> {
  const errors: Record<string, boolean> = {};
  if (kind === 'User') {
    if (!values.displayName.trim() || values.displayName.length > 100) errors.displayName = true;
  } else {
    if (!values.title.trim() || values.title.length > 200) errors.title = true;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) || values.slug.length > 160) errors.slug = true;
    if (values.excerpt.length > 300) errors.excerpt = true;
    if (kind === 'Item' && values.enquiryUrl && !isSafeEnquiry(values.enquiryUrl)) errors.enquiryUrl = true;
    if (kind === 'Item' && (!values.kind.trim() || values.kind.length > 80)) errors.kind = true;
    if (kind === 'Page' && values.defaultItemKind.length > 80) errors.defaultItemKind = true;
    if (kind === 'Page') {
      for (const field of ['navigationOrder', 'homeOrder']) if (!/^\d{1,3}$/.test(values[field])) errors[field] = true;
      if (values.featureOnHome === 'true' && values.accent === 'INK') errors.accent = true;
    }
  }
  return errors;
}

function isSafeEnquiry(value: string): boolean {
  if (value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname || url.protocol === 'mailto:' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url.pathname); } catch { return false; }
}

type ContentFormRow = { readonly id: string; readonly [field: string]: unknown };
type ContentFormProps = {
  /** `Page`, `Item` (of a page) or `User` (the profile). */
  kind: string; row?: ContentFormRow | null; defaults?: Readonly<Record<string, string>>; save: (input: Record<string, unknown>) => Promise<string>; detail: (id: string) => string;
  /** The saved record's status and its publish/unpublish action (edit screens). */
  publication?: { status: string; toggle: () => Promise<unknown> };
};

const styles = stylex.create({
  layout: {
    display: 'grid', gap: '1.5rem', alignItems: 'start',
    gridTemplateColumns: { default: 'minmax(0, 1fr) 18rem', '@media (max-width: 960px)': 'minmax(0, 1fr)' },
  },
  main: { minWidth: 0 },
  placement: { margin: 0, padding: 0, border: 'none', minWidth: 0 },
  legend: { fontWeight: 600, marginBottom: '0.5rem', padding: 0 },
  panel: {
    position: { default: 'sticky', '@media (max-width: 960px)': 'static' }, top: '1rem', padding: '1rem',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-container)',
    backgroundColor: 'var(--color-background-surface)',
  },
});
