import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from '@tiptap/markdown';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { FileInput } from '@astryxdesign/core/FileInput';
import { Button, Heading, IconButton, Stack, Text, TextArea, TextInput } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Markdown content edited as rich text (Tiptap), with a Markdown source mode that is a
 * plain textarea. Markdown stays the stored format. The toolbar is one Tab stop with
 * arrow keys between buttons; images need alt text and upload to POST /media.
 */
export function RichTextEditor({ label, value, onChange, invalid = false, name }: RichTextEditorProps) {
  const rich = useRichTextEditor(value, onChange, label);
  return <Stack gap={2} align="stretch">
    <Stack direction="horizontal" gap={3} align="center" xstyle={styles.header}>
      <Text id={rich.labelId} weight="semibold">{label}</Text>
      <SegmentedControl label="Editing mode" value={rich.mode} onChange={rich.setMode} size="sm">
        <SegmentedControlItem value="rich" label="Rich text" />
        <SegmentedControlItem value="markdown" label="Markdown" />
      </SegmentedControl>
    </Stack>
    {rich.mode === 'markdown'
      ? <TextArea label={label} isLabelHidden htmlName={name} value={value} onChange={onChange} status={invalid ? { type: 'error' } : undefined} description="Markdown source. Switch back to rich text at any time." />
      : <Stack gap={1} align="stretch" xstyle={[styles.frame, invalid && styles.invalid]}>
        <Toolbar label="Formatting" size="sm" startContent={<RichTextEditor_Tools editor={rich.editor} state={rich.state} onLink={rich.openLink} onImage={rich.openImage} />} />
        <EditorContent editor={rich.editor} />
      </Stack>}
    <RichTextEditor_LinkDialog isOpen={rich.dialog === 'link'} initial={rich.currentLink} onClose={rich.closeDialog} onApply={rich.applyLink} />
    <RichTextEditor_ImageDialog isOpen={rich.dialog === 'image'} onClose={rich.closeDialog} onInsert={rich.insertImage} />
  </Stack>;
}

export type RichTextEditorProps = { label: string; value: string; onChange: (markdown: string) => void; invalid?: boolean; name?: string };

function RichTextEditor_Tools({ editor, state, onLink, onImage }: { editor: Editor | null; state: ToolState; onLink: () => void; onImage: () => void }) {
  const chain = () => editor?.chain().focus();
  return <Stack direction="horizontal" gap={1} align="center" xstyle={styles.tools}>
    <ToggleButton isIconOnly size="sm" label="Bold" icon={<RichTextEditor_Icon path="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />} isPressed={state.bold} onPressedChange={() => { chain()?.toggleBold().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Italic" icon={<RichTextEditor_Icon path="M14 5h-4M14 19h-4M14 5l-4 14" />} isPressed={state.italic} onPressedChange={() => { chain()?.toggleItalic().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Strikethrough" icon={<RichTextEditor_Icon path="M5 12h14M16 7a4 3 0 0 0-8 0c0 4 8 2 8 6a4 3 0 0 1-8 1" />} isPressed={state.strike} onPressedChange={() => { chain()?.toggleStrike().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Inline code" icon={<RichTextEditor_Icon path="m8 8-4 4 4 4M16 8l4 4-4 4" />} isPressed={state.code} onPressedChange={() => { chain()?.toggleCode().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Heading 2" icon={<RichTextEditor_Icon path="M4 6v12M12 6v12M4 12h8M16 10a2 2 0 1 1 4 0c0 2-4 3-4 6h4" />} isPressed={state.heading2} onPressedChange={() => { chain()?.toggleHeading({ level: 2 }).run(); }} />
    <ToggleButton isIconOnly size="sm" label="Heading 3" icon={<RichTextEditor_Icon path="M4 6v12M12 6v12M4 12h8M16 9h4l-2 3a2 2 0 1 1-2 3" />} isPressed={state.heading3} onPressedChange={() => { chain()?.toggleHeading({ level: 3 }).run(); }} />
    <ToggleButton isIconOnly size="sm" label="Bulleted list" icon={<RichTextEditor_Icon path="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />} isPressed={state.bulletList} onPressedChange={() => { chain()?.toggleBulletList().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Numbered list" icon={<RichTextEditor_Icon path="M10 6h10M10 12h10M10 18h10M4 5l1-1v4M4 14h2l-2 3h2" />} isPressed={state.orderedList} onPressedChange={() => { chain()?.toggleOrderedList().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Quote" icon={<RichTextEditor_Icon path="M6 7h4v5H6c0 3 1 4 3 5M14 7h4v5h-4c0 3 1 4 3 5" />} isPressed={state.blockquote} onPressedChange={() => { chain()?.toggleBlockquote().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Code block" icon={<RichTextEditor_Icon path="M4 4h16v16H4zM9 9l-2 3 2 3M15 9l2 3-2 3" />} isPressed={state.codeBlock} onPressedChange={() => { chain()?.toggleCodeBlock().run(); }} />
    <ToggleButton isIconOnly size="sm" label="Link" icon={<RichTextEditor_Icon path="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />} isPressed={state.link} onPressedChange={onLink} />
    <IconButton label="Image" variant="ghost" size="sm" icon={<RichTextEditor_Icon path="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01" />} onClick={onImage} />
    <IconButton label="Undo" variant="ghost" size="sm" isDisabled={!state.canUndo} icon={<RichTextEditor_Icon path="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" />} onClick={() => { chain()?.undo().run(); }} />
    <IconButton label="Redo" variant="ghost" size="sm" isDisabled={!state.canRedo} icon={<RichTextEditor_Icon path="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h4" />} onClick={() => { chain()?.redo().run(); }} />
  </Stack>;
}

function RichTextEditor_Icon({ path }: { path: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}

function RichTextEditor_LinkDialog({ isOpen, initial, onClose, onApply }: { isOpen: boolean; initial: string; onClose: () => void; onApply: (href: string | null) => void }) {
  const link = useLinkForm(isOpen, initial, onApply);
  return <RichTextEditor_Dialog isOpen={isOpen} title="Link" onClose={onClose}>
    <form onSubmit={link.submit} noValidate><Stack gap={3} align="stretch">
      {link.error && <p role="alert">{link.error}</p>}
      <TextInput label="Link address" htmlName="href" value={link.href} onChange={link.setHref} status={link.error ? { type: 'error' } : undefined} description="https://…, mailto:… or a path on this site such as /pages/about." />
      <Stack direction="horizontal" gap={2} xstyle={styles.dialogActions}>
        <Button label="Cancel" onClick={onClose} />
        {initial && <Button label="Remove link" onClick={() => { onApply(null); }} />}
        <Button type="submit" label="Apply link" variant="primary" />
      </Stack>
    </Stack></form>
  </RichTextEditor_Dialog>;
}

function RichTextEditor_ImageDialog({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (src: string, alt: string) => void }) {
  const image = useImageForm(isOpen, onInsert);
  return <RichTextEditor_Dialog isOpen={isOpen} title="Insert image" onClose={onClose}>
    <form onSubmit={image.submit} noValidate><Stack gap={3} align="stretch">
      {image.error && <p role="alert">{image.error}</p>}
      <FileInput label="Image file" value={image.file} onChange={image.setFile} accept={IMAGE_TYPES} maxSize={MAX_IMAGE_BYTES} description="PNG, JPEG or WebP, up to 5 MB. Location and camera details are removed." isRequired />
      <TextInput label="Alt text" htmlName="alt" value={image.alt} onChange={image.setAlt} isRequired status={image.missingAlt ? { type: 'error' } : undefined} description="Describe the image for people who cannot see it." />
      <Stack direction="horizontal" gap={2} xstyle={styles.dialogActions}>
        <Button label="Cancel" onClick={onClose} />
        <Button type="submit" label="Insert image" variant="primary" isLoading={image.pending} />
      </Stack>
    </Stack></form>
  </RichTextEditor_Dialog>;
}

// A modal dialog that keeps Tab inside, closes on Escape and returns focus to the editor.
// It renders on <body>, outside the post's <form>, so its own form never submits the post.
function RichTextEditor_Dialog({ isOpen, title, onClose, children }: { isOpen: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useModal(isOpen, onClose);
  return createPortal(<dialog ref={dialog.element} aria-labelledby={dialog.titleId} onCancel={dialog.escape} onKeyDown={dialog.keepFocus} {...stylex.props(styles.dialog)}>
    <Stack gap={3} align="stretch"><Heading level={2} id={dialog.titleId}>{title}</Heading>{children}</Stack>
  </dialog>, document.body);
}

function useRichTextEditor(value: string, onChange: (markdown: string) => void, label: string) {
  const labelId = useId();
  const [mode, setModeState] = useState<'rich' | 'markdown'>('rich');
  const [dialog, setDialog] = useState<'link' | 'image' | null>(null);
  // Tiptap compares options by identity on every render and re-applies changed ones, which
  // resets the document, so everything it sees stays stable: the initial Markdown, the
  // extensions and props, and an update callback that reads the latest onChange.
  const initial = useRef(value).current;
  const latestChange = useRef(onChange);
  useEffect(() => { latestChange.current = onChange; }, [onChange]);
  const extensions = useMemo(() => [
    StarterKit.configure({ underline: false, heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, protocols: ['https', 'http', 'mailto'] } }),
    Image.configure({ inline: false }),
    Markdown,
  ], []);
  const editorProps = useMemo(() => ({ attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': label, class: stylex.props(styles.editable).className ?? '' } }), [label]);
  const editor = useEditor({
    extensions, editorProps,
    content: initial,
    contentType: 'markdown',
    immediatelyRender: true,
    onUpdate: ({ editor: current }) => { latestChange.current(current.getMarkdown()); },
  });
  const state: ToolState = useEditorState({ editor, selector: ({ editor: current }) => readTools(current) }) ?? readTools(null);
  function setMode(next: string) {
    if (next === 'rich') editor?.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
    setModeState(next === 'markdown' ? 'markdown' : 'rich');
  }
  return {
    labelId, mode, setMode, editor, state, dialog,
    currentLink: typeof editor?.getAttributes('link').href === 'string' ? String(editor.getAttributes('link').href) : '',
    openLink: () => { setDialog('link'); }, openImage: () => { setDialog('image'); },
    closeDialog: () => { setDialog(null); editor?.commands.focus(); },
    applyLink: (href: string | null) => {
      const chain = editor?.chain().focus().extendMarkRange('link');
      if (href === null) chain?.unsetLink().run();
      else if (editor?.state.selection.empty && !editor.isActive('link')) chain?.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
      else chain?.setLink({ href }).run();
      setDialog(null);
    },
    insertImage: (src: string, alt: string) => {
      editor?.chain().focus().setImage({ src, alt }).run();
      setDialog(null);
    },
  };
}

function readTools(editor: Editor | null): ToolState {
  const active = (name: string, attributes?: Record<string, unknown>) => editor?.isActive(name, attributes) ?? false;
  return {
    bold: active('bold'), italic: active('italic'), strike: active('strike'), code: active('code'),
    heading2: active('heading', { level: 2 }), heading3: active('heading', { level: 3 }),
    bulletList: active('bulletList'), orderedList: active('orderedList'), blockquote: active('blockquote'), codeBlock: active('codeBlock'), link: active('link'),
    canUndo: editor?.can().undo() ?? false, canRedo: editor?.can().redo() ?? false,
  };
}

function useLinkForm(isOpen: boolean, initial: string, onApply: (href: string | null) => void) {
  const [href, setHref] = useState(initial); const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { setHref(initial); setError(''); } }, [isOpen, initial]);
  function submit(event: FormEvent) {
    event.preventDefault(); event.stopPropagation();
    const value = href.trim();
    if (!/^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|\/[^\s]*)$/i.test(value)) { setError('Use https://…, mailto:… or a path starting with /.'); return; }
    onApply(value);
  }
  return { href, setHref, error, submit };
}

function useImageForm(isOpen: boolean, onInsert: (src: string, alt: string) => void) {
  const [file, setFileState] = useState<File | null>(null); const [alt, setAlt] = useState('');
  const [error, setError] = useState(''); const [pending, setPending] = useState(false); const [missingAlt, setMissingAlt] = useState(false);
  useEffect(() => { if (isOpen) { setFileState(null); setAlt(''); setError(''); setMissingAlt(false); } }, [isOpen]);
  async function submit(event: FormEvent) {
    event.preventDefault(); event.stopPropagation(); if (pending) return;
    if (!file) { setError('Choose an image file.'); return; }
    if (!alt.trim()) { setMissingAlt(true); setError('Describe the image in the alt text.'); return; }
    setPending(true); setError('');
    try { onInsert(await uploadImage(file), alt.trim()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The image could not be uploaded.'); }
    finally { setPending(false); }
  }
  return { file, alt, setAlt, error, pending, missingAlt, submit, setFile: (value: File | File[] | null) => { setFileState(Array.isArray(value) ? value[0] ?? null : value); } };
}

async function uploadImage(file: File): Promise<string> {
  const csrf = await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }).then(response => response.json() as Promise<{ token: string }>);
  const body = new FormData(); body.append('image', file);
  const response = await fetch('/media', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf.token }, body });
  const result = await response.json().catch(() => null) as { url?: unknown; error?: unknown } | null;
  if (!response.ok || typeof result?.url !== 'string') throw new Error(typeof result?.error === 'string' ? result.error : 'The image could not be uploaded.');
  return result.url;
}

function useModal(isOpen: boolean, onClose: () => void) {
  const element = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = element.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);
  function escape(event: React.SyntheticEvent<HTMLDialogElement>) { event.preventDefault(); onClose(); }
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled), [tabindex="0"]'));
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return { element, titleId, escape, keepFocus };
}

type ToolState = { bold: boolean; italic: boolean; strike: boolean; code: boolean; heading2: boolean; heading3: boolean; bulletList: boolean; orderedList: boolean; blockquote: boolean; codeBlock: boolean; link: boolean; canUndo: boolean; canRedo: boolean };

const styles = stylex.create({
  header: { justifyContent: 'space-between', flexWrap: 'wrap' },
  frame: { borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border-emphasized)', borderRadius: '0.75rem', overflow: 'hidden' },
  invalid: { borderColor: 'var(--color-error)' },
  tools: { flexWrap: 'wrap' },
  editable: {
    minHeight: '16rem', padding: '0.75rem 1rem', lineHeight: 1.7, outline: { default: 'none', ':focus-visible': '2px solid var(--color-text-primary)' }, outlineOffset: '-2px',
  },
  dialog: {
    width: 'min(30rem, calc(100vw - 2rem))', boxSizing: 'border-box', padding: '1.25rem', borderRadius: '1rem',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-hairline)',
    backgroundColor: 'var(--color-background-surface)', color: 'var(--color-text-primary)',
    '::backdrop': { backgroundColor: 'rgb(0 0 0 / 0.45)' },
  },
  dialogActions: { justifyContent: 'flex-end', flexWrap: 'wrap' },
});
