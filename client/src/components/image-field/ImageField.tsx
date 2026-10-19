import { useState } from 'react';
import { Button, FileInput, Stack, Text, TextInput } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { uploadImage } from '../../uploadImage';

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** One image with required alt text: choosing a file uploads it at once; Remove clears both fields. */
export function ImageField({ url, alt, onChange, altInvalid = false }: ImageFieldProps) {
  const upload = useImageUpload(onChange, alt);
  return <fieldset {...stylex.props(styles.field)}>
    <legend {...stylex.props(styles.legend)}>Image</legend>
    <Stack gap={3} align="stretch">
      {upload.error && <p role="alert">{upload.error}</p>}
      {url && <img src={url} alt={alt || 'Preview of the chosen image'} {...stylex.props(styles.preview)} />}
      <FileInput label={url ? 'Replace image' : 'Image file'} value={null} onChange={upload.choose} accept={IMAGE_TYPES} maxSize={MAX_IMAGE_BYTES} isDisabled={upload.pending}
        description={upload.pending ? 'Uploading…' : 'PNG, JPEG or WebP, up to 5 MB. Location and camera details are removed.'} />
      {url && <>
        <TextInput label="Image alt text" htmlName="imageAlt" value={alt} onChange={value => onChange(url, value)} isRequired
          status={altInvalid ? { type: 'error' } : undefined} description="Describe the image for people who cannot see it." />
        <Button label="Remove image" onClick={() => { onChange('', ''); }} />
      </>}
      {!url && <Text color="secondary" size="sm">Optional. Shown beside the item in lists and under its title.</Text>}
    </Stack>
  </fieldset>;
}

function useImageUpload(onChange: ImageFieldProps['onChange'], alt: string) {
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function choose(value: File | File[] | null) {
    const file = Array.isArray(value) ? value[0] : value;
    if (!file || pending) return;
    setPending(true); setError('');
    try { onChange(await uploadImage(file), alt); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The image could not be uploaded.'); }
    finally { setPending(false); }
  }
  return { pending, error, choose };
}

type ImageFieldProps = { url: string; alt: string; onChange: (url: string, alt: string) => void; altInvalid?: boolean };

const styles = stylex.create({
  field: { margin: 0, padding: 0, border: 'none', minWidth: 0 },
  legend: { fontWeight: 600, marginBottom: '0.5rem', padding: 0 },
  preview: { display: 'block', maxWidth: '100%', maxHeight: '12rem', objectFit: 'contain', borderRadius: 'var(--radius-element)' },
});
