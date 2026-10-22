import test from 'node:test';
import assert from 'node:assert/strict';
import { projectSetupSteps } from '../src/modules/projects/setup-steps.ts';

const fresh = {
  status: 'PLANNING',
  hasResponsible: false,
  hasScope: true,
  documents: 1,
  tasks: 0,
  milestones: [{ dueDate: '2026-11-01' }, { dueDate: null }],
  requirements: [],
};
const byId = (steps) => Object.fromEntries(steps.map((step) => [step.id, step]));

test('un proyecto recién convertido desde una propuesta', () => {
  const steps = byId(projectSetupSteps(fresh));
  assert.equal(steps.responsible.done, false);
  assert.equal(steps.scope.done, true);
  assert.equal(steps.milestones.done, false);
  assert.equal(steps.milestones.detail, '1 hito sin fecha');
  assert.equal(steps.requirements.detail, 'Todavía no hay requerimientos');
  assert.equal(steps.tasks.detail, 'Todavía no hay tareas');
  assert.equal(steps.start.done, false);
});

test('requerimientos sin hito o sin tareas dejan el paso pendiente', () => {
  const steps = byId(projectSetupSteps({
    ...fresh,
    tasks: 3,
    requirements: [{ milestoneId: 'h1', tasks: [{}] }, { milestoneId: null, tasks: [] }, { milestoneId: 'h2', tasks: [] }],
  }));
  assert.equal(steps.requirements.detail, '1 requerimiento sin hito');
  assert.equal(steps.tasks.detail, '2 requerimientos sin tareas');
  assert.equal(steps.tasks.done, false);
});

test('todo listo: ningún paso pendiente', () => {
  const steps = projectSetupSteps({
    ...fresh,
    status: 'IN_PROGRESS',
    hasResponsible: true,
    tasks: 2,
    milestones: [{ dueDate: '2026-11-01' }],
    requirements: [{ milestoneId: 'h1', tasks: [{}] }],
  });
  assert.deepEqual(steps.filter((step) => !step.done), []);
});
