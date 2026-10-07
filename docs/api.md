# API conventions and errors

The complete reference is the OpenAPI 3.1 document at `/apps/resume-analyzer/api/openapi.json`, rendered on the API reference page at `/apps/resume-analyzer/docs/api`. This page explains the conventions behind it.

## Conventions

- JSON bodies, except the upload, which is `multipart/form-data` with `file`, and optional `jobTitle` and `jobDescription`.
- Long-running work returns `202 Accepted` and a `Location` header. Poll that URL until `status` is `completed` or `failed`.
- Lists return `{ items, page, pageSize, total }` and accept `page`, `pageSize` (max 50), `status`, `q` and `sort` (`newest`, `oldest`, `score-desc`, `score-asc`).
- Timestamps are ISO 8601 in UTC. Identifiers are UUIDs.
- Reads of private data send `Cache-Control: private, no-store`.
- There is no authentication. Your own analyses are identified by the `ra_session` HttpOnly cookie set on your first upload.

## Errors

Every error is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem with `Content-Type: application/problem+json`:

```json
{
  "type": "https://github.com/FolderITDev/web-resume-analyzer/blob/main/docs/api.md#validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "One or more fields are invalid.",
  "errors": [
    {
      "path": "jobDescription",
      "message": "Paste at most 12,000 characters of the job description."
    }
  ]
}
```

Branch on `code`; `detail` is written for people and may change.

### validation_failed

`422`. A field or query parameter is missing or invalid. `errors` lists each field by its path.

### unsupported_file

`415`. The file is not a PDF or DOCX, or its content does not match its extension. The type is detected from the file's bytes.

### payload_too_large

`413`. The file is larger than 5 MB.

### rate_limited

`429`. More than 20 uploads from one client in 10 minutes. The `Retry-After` header gives the wait in seconds.

### not_found

`404`. The analysis does not exist, has expired, or belongs to another browser. These cases are deliberately indistinguishable.

### forbidden

`403`. Example reports cannot be deleted.

### internal_error

`500`. An unexpected failure. Details are logged on the server, never returned.

## Analysis error codes

A `failed` analysis carries `error.code`. Codes reported by the analysis engine are passed through with its message; the most common are listed first.

| Code                     | Meaning                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `no_text_found`          | Engine: the document has no extractable text, usually a scanned image.        |
| `unreadable_file`        | Engine: the document could not be opened, because it is damaged or protected. |
| `engine_unavailable`     | The analysis engine could not be reached, timed out or answered unexpectedly. |
| `processing_interrupted` | The server restarted before the analysis finished. Upload the file again.     |
| `internal_error`         | An unexpected failure in the pipeline.                                        |
