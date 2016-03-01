export default function createChange(
  type: string, data: Function = data => data
): Function {
  return (...args) => ({
    type, data: data.apply(null, args)
  });
}
