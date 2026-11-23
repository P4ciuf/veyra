/**
 * Fixture: modal whose function `customId` is keyed by its source text
 * (`toString()`), unlike menus, which use the function name.
 */
export default {
  customId: function checkModal(_id: string) {
    return true;
  },
  execute: () => {},
};
