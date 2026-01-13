import { useEffect, useMemo, useRef } from "react";
import { debounce } from "lodash";

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  const funcRef = useRef<T>(fn);

  useEffect(() => {
    funcRef.current = fn;
  }, [fn]);

  return useMemo(
    () =>
      debounce(
        (...args: Parameters<T>) => {
          funcRef.current?.(...args);
        },
        ms,
        { maxWait },
      ),
    [ms, maxWait],
  );
}
