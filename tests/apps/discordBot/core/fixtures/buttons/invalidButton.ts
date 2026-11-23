/**
 * Fixture: button module with an empty `customId`.
 * The loader must treat the falsy key like a missing one and reject the module.
 */
export default { customId: "", execute: async () => {} };
