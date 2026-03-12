export function createShim(name) {
  const fail = () => {
    throw new Error(`${name} not available in browser`);
  };
  return new Proxy({}, { get: () => fail });
}
