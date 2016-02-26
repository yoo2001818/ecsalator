export default function createChange(
  type: string, data: Function = () => undefined
): Function {
  return (...args) => ({
    type, data: data.apply(null, args)
  });
}
