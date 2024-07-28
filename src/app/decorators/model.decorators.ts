type Constructor<T> = new (...args: unknown[]) => T;

export const MODEL_CLASS_KEY = Symbol('model-class');

export function ModelClass<T>() {
  return function (target: Constructor<T>) {
    Reflect.defineMetadata(MODEL_CLASS_KEY, true, target.prototype);
  };
}
