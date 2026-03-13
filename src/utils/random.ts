export function generateRandomNumber(): bigint {
  return BigInt(Math.floor(Math.random() * 100000000000));
}
