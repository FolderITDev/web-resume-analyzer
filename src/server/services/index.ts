import 'server-only';

import { db } from '../db';
import { createAnalysisRepository } from '../repositories/analysis-repository';
import { createAnalysisService } from './analysis-service';

/** Composition root: wires the service to the shared database pool. */
export function analysisService() {
  return createAnalysisService({ repository: createAnalysisRepository(db()) });
}
