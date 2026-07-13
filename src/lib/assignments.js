import { getChildValue, setChildValue } from './childWorkspace.js';

const ASSIGNMENTS_KEY = 'assignments';
const ACTIVE_ASSIGNMENT_KEY = 'activeAssignmentId';

function now() {
    return new Date().toISOString();
}

function normalizeItems(subject, items) {
    return items.map(item => typeof item === 'string' ? item.trim() : item)
        .filter(item => typeof item === 'string' ? item : item?.text);
}

export function loadAssignments(profileId) {
    const value = getChildValue(profileId, ASSIGNMENTS_KEY, []);
    return Array.isArray(value) ? value : [];
}

export function getActiveAssignment(profileId) {
    const assignments = loadAssignments(profileId);
    const activeId = getChildValue(profileId, ACTIVE_ASSIGNMENT_KEY, '');
    return assignments.find(assignment => assignment.id === activeId) || null;
}

export function createAssignment(profileId, { title, subject, items }) {
    const assignment = {
        id: `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        subject,
        items: normalizeItems(subject, items),
        status: 'active',
        createdAt: now(),
        updatedAt: now(),
        attempts: []
    };
    const assignments = [assignment, ...loadAssignments(profileId)];
    setChildValue(profileId, ASSIGNMENTS_KEY, assignments);
    setChildValue(profileId, ACTIVE_ASSIGNMENT_KEY, assignment.id);
    return assignment;
}

export function setActiveAssignment(profileId, assignmentId) {
    setChildValue(profileId, ACTIVE_ASSIGNMENT_KEY, assignmentId);
}

export function recordAssignmentAttempt(profileId, assignmentId, attempt) {
    const assignments = loadAssignments(profileId);
    const next = assignments.map(assignment => assignment.id !== assignmentId ? assignment : {
        ...assignment,
        updatedAt: now(),
        attempts: [{ id: `attempt_${Date.now()}`, createdAt: now(), ...attempt }, ...(assignment.attempts || [])].slice(0, 200)
    });
    return setChildValue(profileId, ASSIGNMENTS_KEY, next);
}
