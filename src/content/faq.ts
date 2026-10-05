/** Questions answered on the landing page and published as FAQPage structured data. */
export const FAQ = [
  {
    question: 'Is there an AI model behind the analysis?',
    answer:
      'No. Resume Analyzer uses a deterministic rules engine written in TypeScript. The same file always produces the same report, and every strength, issue and recommendation cites the rule that produced it. The rules are listed on this page and in the source code.',
  },
  {
    question: 'What happens to the file I upload?',
    answer:
      'The file is read in memory on the server, its text is extracted and analyzed, and then it is discarded. Only the file name, its size and the resulting report are stored, linked to an anonymous cookie in your browser, and they are deleted automatically after 24 hours. You can also delete an analysis yourself.',
  },
  {
    question: 'Which file types are supported?',
    answer:
      'PDF and DOCX files up to 5 MB. The file type is verified from its content, not its name. Scanned resumes that contain only images cannot be read, because no text can be extracted from them.',
  },
  {
    question: 'How does the job description comparison work?',
    answer:
      'When you paste a job description, the analyzer detects the skills it mentions and its most frequent distinctive terms, then reports which of them your resume already shows and which it does not. Skills weigh 70% of the match score and general keywords 30%.',
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
      'Yes. The complete application, including the rules engine, the API, the database migrations and the tests, is published on GitHub under the MIT license.',
  },
] as const;
