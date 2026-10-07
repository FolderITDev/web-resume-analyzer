import 'server-only';

import { analysisEngine } from '../analysis-engine';
import { db } from '../db';
import { createAnalysisRepository } from '../repositories/analysis-repository';
import { createAnalysisService } from './analysis-service';

/** Composition root: wires the service to the shared database pool and the analysis engine. */
export function analysisService() {
  return createAnalysisService({
    repository: createAnalysisRepository(db()),
    engine: analysisEngine,
  });
}
