/** Questions answered on the landing page and published as FAQPage structured data. */
export const FAQ = [
  {
    question: 'How is the resume analyzed?',
    answer:
      'Resume Analyzer checks the upload and hands it to its analysis engine as a background job. The engine reads the document, splits it into sections, compares it with the job description when there is one and scores six weighted categories. Every strength, issue and recommendation cites the check that produced it, and the page follows each stage as the engine reports it.',
  },
  {
    question: 'What happens to the file I upload?',
    answer:
      'The file is sent over an authenticated connection to the analysis engine for processing; Resume Analyzer never writes it to disk or to its database. Only the file name, its size and the resulting report are stored, linked to an anonymous cookie in your browser, and they are deleted automatically after 24 hours. You can also delete an analysis yourself.',
  },
  {
    question: 'Which file types are supported?',
    answer:
      'PDF and DOCX files up to 5 MB. The file type is verified from its content, not its name. Scanned resumes that contain only images cannot be read, because no text can be extracted from them.',
  },
  {
    question: 'How does the job description comparison work?',
    answer:
      'When you paste a job description, the analysis engine detects the skills and distinctive terms it asks for, then the report shows which of them your resume already covers and which it does not, with a match score from 0 to 100.',
  },
  {
    question: 'Can I use the API from my own application?',
    answer:
      'Yes. The REST API is documented with OpenAPI 3.1 at /api/openapi.json and on the API reference page. Uploads return 202 Accepted with a URL to poll until the analysis is completed.',
  },
  {
    question: 'Who built Resume Analyzer?',
    answer:
      'Folder IT, a nearshore software development company that builds custom web and mobile applications and business platforms for U.S. companies. The team builds and maintains Resume Analyzer with Next.js, TypeScript, REST APIs and PostgreSQL, the same stack it uses for client platforms.',
  },
  {
    question: 'Is the source code available?',
    answer:
      'Yes. The complete application, including the API, the analysis engine client, the database migrations and the tests, is published on GitHub under the MIT license.',
  },
] as const;
