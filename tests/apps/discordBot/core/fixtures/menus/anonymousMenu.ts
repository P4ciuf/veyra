// Fixture: menu whose anonymous function `customId` must fall back to the
// `"dynamic"` registry key.

/**
 * Builds a select-menu predicate that has no inferable function name.
 *
 * The loader keys a function `customId` by `Function.name` and falls back to the
 * `"dynamic"` key when the function is anonymous; this factory exists precisely
 * to produce a genuinely nameless predicate so that fallback is exercised.
 * (NamedEvaluation would otherwise give a directly-assigned arrow the variable
 * name, so the arrow must be returned from inside another arrow.)
 *
 * @returns A nameless predicate that always returns `true`.
 */
const makePredicate = (): (() => boolean) => () => true;

export default {
  customId: makePredicate(),
  execute: async () => {},
};
