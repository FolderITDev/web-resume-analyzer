import 'server-only';

import { analysisEngineEnv } from '../env';
import { type AnalysisEngine, AnalysisEngineError, createAnalysisEngine } from './client';

let configured: AnalysisEngine | undefined;

function engine(): AnalysisEngine {
  if (!configured) {
    const settings = analysisEngineEnv.safeParse();
    if (!settings.success) {
      throw new AnalysisEngineError('ANALYSIS_ENGINE_URL is missing or invalid.', {
        cause: settings.error,
      });
    }
    configured = createAnalysisEngine({
      baseUrl: settings.data.ANALYSIS_ENGINE_URL,
      apiKey: settings.data.ANALYSIS_ENGINE_API_KEY,
    });
  }
  return configured;
}

/**
 * The analysis engine at ANALYSIS_ENGINE_URL. Configuration is read on the first job, so reading
 * analyses keeps working while the engine is misconfigured, and new jobs fail with a clear error.
 */
export const analysisEngine: AnalysisEngine = {
  submit: (submission) => engine().submit(submission),
  get: (jobId) => engine().get(jobId),
};
