/**
 * Fixture: module exporting a nested `default` object.
 * It exercises the loader's double-default unwrapping branch.
 */
export default { default: { data: { name: "inner" }, execute: async () => {} } };
