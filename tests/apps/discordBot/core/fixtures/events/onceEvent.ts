// Fixture: one-shot event subscribed through `client.once`. The recorded
// arguments let the loader test prove the wrapper forwards them.

/**
 * Shape of the `globalThis` slots the event fixtures write to.
 *
 * @property __veyraEventOnce - Arguments of every `execute` invocation, in call order.
 */
type Recorder = Record<string, unknown[][] | undefined>;

/**
 * Appends one event invocation to the `globalThis` call recorder.
 *
 * Recording happens on `globalThis` because the loader cache-busts every import
 * (`?update=<timestamp>`): each load yields a fresh module instance, so
 * module-level state cannot be relied upon to survive across loads.
 *
 * @param args - Arguments the loader wrapper forwarded to the event handler.
 */
const record = (args: unknown[]): void => {
  const recorder = globalThis as unknown as Recorder;
  const store = (recorder.__veyraEventOnce ??= []);
  store.push(args);
};

export default {
  name: "custom-once",
  once: true,
  execute: (...args: unknown[]) => record(args),
};
