import { z } from 'zod';

import {
  ACCEPTED_UPLOAD,
  JOB_DESCRIPTION_MAX_LENGTH,
  MAX_UPLOAD_BYTES,
} from '@/lib/validation/analysis';

function hasAcceptedExtension(name: string): boolean {
  const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
  return (ACCEPTED_UPLOAD.extensions as readonly string[]).includes(extension);
}

/**
 * Client-side checks for instant feedback. The server repeats every check and also verifies
 * the file's bytes, which the browser cannot be trusted to do.
 */
export const UploadFormSchema = z.object({
  file: z
    .instanceof(File, { message: 'Choose a PDF or DOCX resume.' })
    .refine((file) => hasAcceptedExtension(file.name), 'Only PDF and DOCX files are supported.')
    .refine((file) => file.size > 0, 'This file is empty.')
    .refine((file) => file.size <= MAX_UPLOAD_BYTES, 'The file is larger than 5 MB.'),
  jobTitle: z.string().trim().max(120, 'Keep the job title under 120 characters.'),
  jobDescription: z
    .string()
    .trim()
    .max(JOB_DESCRIPTION_MAX_LENGTH, 'Paste at most 12,000 characters of the job description.'),
});

export type UploadFormValues = z.input<typeof UploadFormSchema>;
