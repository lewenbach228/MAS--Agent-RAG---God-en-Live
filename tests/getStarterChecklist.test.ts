import { describe, expect, it } from 'vitest';
import { getStarterChecklist } from '../src/domain/project/getStarterChecklist';

describe('getStarterChecklist', () => {
  it('returns the mandatory first project steps', () => {
    expect(getStarterChecklist()).toEqual([
      'Lire .internal/project/AGENT_START.md',
      'Remplir .internal/project/PROJECT_KICKOFF.md',
      'Fixer la demo principale et le hors-scope V1',
      'Coder fonctionnalite par fonctionnalite avec tests',
      'Preparer README, preuves portfolio et publication',
    ]);
  });
});
