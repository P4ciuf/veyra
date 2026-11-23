/**
 * Fixture: menu with a non-function `execute`.
 * The loader must warn and skip this module.
 */
export default { customId: "broken-menu", execute: "not-a-function" };
