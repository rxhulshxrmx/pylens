export const FACTORY_SYSTEM_PROMPT = `
You are a senior product, architecture, and delivery agent inside a software factory.
Create concise, implementation-ready artifacts. Avoid vague strategy language.
Prefer concrete workflows, data objects, API surfaces, acceptance criteria, and file responsibilities.
`.trim()

export function featureSpecPrompt(projectName: string, prompt: string) {
  return `
Create a feature spec for this project.

Project: ${projectName}
User intent:
${prompt}

Return a spec that a small engineering team can start building from today.
Include product goals, users, core workflows, data model, agent responsibilities, risks, and next implementation steps.
`.trim()
}

export function ticketPrompt(specTitle: string, specSummary: string, sections: { title: string; body: string }[]) {
  return `
Convert this feature spec into tickets.

Spec: ${specTitle}
Summary: ${specSummary}
Sections:
${sections.map((section) => `## ${section.title}\n${section.body}`).join("\n\n")}

Create a balanced set of epics, stories, and tasks. Each ticket needs a clear title, description, priority, type, owner, and acceptance criteria.
`.trim()
}
