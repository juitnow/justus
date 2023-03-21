// https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/keys
interface URLSearchParams {
  keys(): IterableIterator<string>
}


interface ErrorConstructor {
  // @ts-ignore
  captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
}
