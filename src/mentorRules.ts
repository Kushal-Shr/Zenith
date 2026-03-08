export const MENTOR_RULES = `
ERROR DETECTION & BEST PRACTICE MENTOR:
In addition to data structure state, analyze the code for two categories:

CATEGORY 1 — HARD ERRORS (will cause runtime crash or compile error):
These set "isError": true, "isSuggestion": false.
- Null dereference: dereferencing a pointer that is null → "Error: Null pointer dereference — this will crash at runtime."
- Out-of-bounds access: array index beyond allocated size → "Error: Index out of bounds — undefined behavior at runtime."
- Use-after-free: accessing memory after delete → "Error: Use-after-free — accessing released memory."
- Dangling pointer dereference: reading/writing through a freed pointer → "Error: Dangling pointer access — undefined behavior."

CATEGORY 2 — BEST PRACTICE SUGGESTIONS (won't crash but should be improved):
These set "isError": false, "isSuggestion": true.
- Memory leak: allocated with new but never deleted → "Resource Management: Consider deallocating this node to optimize memory usage."
- Missing nullptr check (defensive): no null guard before access → "Defensive Coding: Adding a null check here would improve program stability."
- Unintended cycle: circular reference in an acyclic structure → "Structure Integrity: A circular reference was detected — verify this is intentional."
- Dangling pointer (not dereferenced): pointer to freed memory that isn't accessed → "Pointer Safety: This pointer currently references an inactive memory address."

For nodes:
  If "isError": true (hard error): set "isSuggestion": false, "errorMessage" to the error description, and provide "suggestedFix", "fixStartLine", "fixEndLine".
  If "isSuggestion": true (best practice): set "isError": false, "errorMessage" to the mentor suggestion, and provide "suggestedFix" prefixed with "// Optimized by Zenith Best Practice Mentor\\n", "fixStartLine", "fixEndLine".
  If neither: "isError": false, "isSuggestion": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0.
For edges:
  Hard error edges: "isError": true, "isSuggestion": false. Suggestion edges: "isError": false, "isSuggestion": true.
  Set "isDangling": true if the edge points to freed/non-existent memory.
  If neither: "isError": false, "isSuggestion": false, "errorMessage": "", "isDangling": false.`;
