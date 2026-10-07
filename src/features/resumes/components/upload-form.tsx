'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, FileText, Plus, X } from 'lucide-react';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type DragEvent, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ApiError, uploadResume } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/lib/format';
import { ACCEPTED_UPLOAD, JOB_DESCRIPTION_MAX_LENGTH } from '@/lib/validation/analysis';

import { isExampleId, loadExampleFile, EXAMPLE_FILES, type ExampleId } from '../examples';
import { UploadFormSchema, type UploadFormValues } from '../upload-schema';

type Phase =
  { name: 'editing' } | { name: 'uploading'; progress: number } | { name: 'redirecting' };

const FIELD_NAMES = ['file', 'jobTitle', 'jobDescription'] as const;
const EXAMPLE_ERROR = 'The example resume could not be loaded. Try again or upload your own file.';

export function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'editing' });
  const [dragging, setDragging] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: { file: undefined, jobTitle: '', jobDescription: '' },
    mode: 'onSubmit',
  });
  const { register, setValue, control, handleSubmit, setError, formState } = form;
  const file = useWatch({ control, name: 'file' });
  const description = useWatch({ control, name: 'jobDescription' }) ?? '';
  const busy = phase.name !== 'editing';

  function chooseFile(next: File | undefined) {
    setFormError(null);
    if (!next) return;
    setValue('file', next, { shouldValidate: true, shouldDirty: true });
  }

  function applyExample(id: ExampleId, example: File) {
    const { job } = EXAMPLE_FILES[id];
    chooseFile(example);
    setValue('jobTitle', job.title);
    setValue('jobDescription', job.text);
    setJobOpen(true);
  }

  async function loadExample(id: ExampleId) {
    try {
      applyExample(id, await loadExampleFile(id));
    } catch {
      setFormError(EXAMPLE_ERROR);
    }
  }

  // A link such as /analyze?example=senior-engineer opens the form with that example loaded.
  const exampleParam = searchParams.get('example');
  const onExampleLoaded = useEffectEvent(applyExample);
  useEffect(() => {
    if (!isExampleId(exampleParam)) return;
    let cancelled = false;
    loadExampleFile(exampleParam).then(
      (example) => {
        if (!cancelled) onExampleLoaded(exampleParam, example);
      },
      () => {
        if (!cancelled) setFormError(EXAMPLE_ERROR);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [exampleParam]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy) chooseFile(event.dataTransfer.files[0]);
  }

  async function submit(values: UploadFormValues) {
    setFormError(null);
    const body = new FormData();
    body.append('file', values.file);
    if (values.jobTitle.trim()) body.append('jobTitle', values.jobTitle.trim());
    if (values.jobDescription.trim()) body.append('jobDescription', values.jobDescription.trim());

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ name: 'uploading', progress: 0 });
    try {
      const submitted = await uploadResume(body, {
        signal: controller.signal,
        onProgress: (progress) => setPhase({ name: 'uploading', progress }),
      });
      setPhase({ name: 'redirecting' });
      router.push(`/analyses/${submitted.id}`);
    } catch (error) {
      setPhase({ name: 'editing' });
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof ApiError) {
        const known = error.fieldErrors.filter((item) =>
          (FIELD_NAMES as readonly string[]).includes(item.path),
        );
        for (const item of known)
          setError(item.path as (typeof FIELD_NAMES)[number], { message: item.message });
        if (known.length === 0) setFormError(error.message);
        return;
      }
      setFormError('The upload failed unexpectedly. Try again.');
    } finally {
      abortRef.current = null;
    }
  }

  const fileError = formState.errors.file?.message;
  const progress =
    phase.name === 'uploading' ? phase.progress : phase.name === 'redirecting' ? 1 : 0;

  return (
    <LazyMotion features={domAnimation} strict>
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        noValidate
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-3">
          <label
            htmlFor={inputId}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'group relative flex min-h-64 cursor-pointer flex-col justify-between gap-8 rounded-xs border bg-raised p-6 transition-[border-color,background-color] duration-200 ease-(--ease-out) sm:p-8',
              'focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]',
              dragging
                ? 'border-accent bg-accent-soft'
                : fileError
                  ? 'border-danger'
                  : 'border-rule-strong hover:border-ink-3',
              busy && 'pointer-events-none',
            )}
          >
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept={[...ACCEPTED_UPLOAD.extensions, ...ACCEPTED_UPLOAD.mimeTypes].join(',')}
              className="sr-only"
              aria-describedby={`${inputId}-hint`}
              aria-invalid={Boolean(fileError)}
              disabled={busy}
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <div className="flex items-start justify-between gap-6">
              <p className="text-heading font-[520]">
                {dragging
                  ? 'Release to add the file'
                  : file
                    ? 'Resume ready to analyze'
                    : 'Drop your resume here'}
              </p>
              <span className="shrink-0 readout text-ink-3">PDF · DOCX · 5 MB</span>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {file instanceof File ? (
                <m.div
                  key={`${file.name}-${file.size}`}
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(6px)' }
                  }
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-4 border-t border-rule pt-5"
                >
                  <FileText aria-hidden className="size-6 shrink-0 text-ink-2" strokeWidth={1.5} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-[560]">{file.name}</span>
                    <span className="readout text-ink-3">{formatBytes(file.size)}</span>
                  </div>
                  <span className="text-sm text-ink-2 underline decoration-rule-strong underline-offset-4 group-hover:text-ink">
                    Replace
                  </span>
                </m.div>
              ) : (
                <m.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="max-w-[44ch] text-ink-2"
                >
                  Drag a file onto this area, or{' '}
                  <span className="text-ink underline decoration-rule-strong underline-offset-4 group-hover:decoration-ink">
                    browse your computer
                  </span>
                  . Text-based PDFs and Word documents work best.
                </m.p>
              )}
            </AnimatePresence>
          </label>
          <p
            id={`${inputId}-hint`}
            className={cn('text-[0.8125rem]', fileError ? 'text-danger' : 'text-ink-3')}
          >
            {fileError ?? 'Files are sent to the analysis engine and never stored here.'}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
            <span>No resume at hand? Try an example:</span>
            {(Object.keys(EXAMPLE_FILES) as ExampleId[]).map((id) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => void loadExample(id)}
                className="rounded-xs px-1 text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink disabled:opacity-50"
              >
                {EXAMPLE_FILES[id].label} ({EXAMPLE_FILES[id].format})
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-rule">
          <button
            type="button"
            aria-expanded={jobOpen}
            aria-controls={`${inputId}-job`}
            onClick={() => setJobOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[1.0625rem] font-[560]">Compare with a job description</span>
              <span className="text-sm text-ink-3">
                Optional. See which skills the posting asks for that your resume shows.
              </span>
            </span>
            <Plus
              aria-hidden
              className={cn(
                'size-5 shrink-0 transition-transform duration-200 ease-(--ease-out)',
                jobOpen && 'rotate-45',
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {jobOpen ? (
              <m.div
                id={`${inputId}-job`}
                key="job"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-6 pb-6">
                  <Field label="Job title" optional error={formState.errors.jobTitle?.message}>
                    {({ id, describedBy, invalid }) => (
                      <Input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        placeholder="Senior Full-Stack Engineer"
                        autoComplete="off"
                        disabled={busy}
                        {...register('jobTitle')}
                      />
                    )}
                  </Field>
                  <Field
                    label="Job description"
                    optional
                    error={formState.errors.jobDescription?.message}
                    hint={`${description.length.toLocaleString('en-US')} of ${JOB_DESCRIPTION_MAX_LENGTH.toLocaleString('en-US')} characters`}
                  >
                    {({ id, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        placeholder="Paste the full posting, including responsibilities and requirements."
                        disabled={busy}
                        {...register('jobDescription')}
                      />
                    )}
                  </Field>
                </div>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>

        {formError ? (
          <Notice tone="error" title="The resume could not be uploaded">
            {formError}
          </Notice>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
          {busy ? (
            <div className="flex flex-1 flex-col gap-2" aria-live="polite">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-[560]">
                  {phase.name === 'redirecting' ? 'Uploaded. Opening your report…' : 'Uploading…'}
                </span>
                <span className="readout text-ink-2">{Math.round(progress * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="relative h-0.5 overflow-hidden bg-rule"
              >
                <div
                  className="absolute inset-0 origin-left bg-accent transition-transform duration-200 ease-(--ease-out)"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-3">
              The analysis takes a few seconds and runs in the background.
            </p>
          )}
          <div className="flex gap-3">
            {phase.name === 'uploading' ? (
              <Button variant="quiet" onClick={() => abortRef.current?.abort()}>
                <X aria-hidden />
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={busy}>
              Analyze resume
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </form>
    </LazyMotion>
  );
}
