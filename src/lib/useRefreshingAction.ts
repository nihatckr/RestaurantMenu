import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Wraps useActionState with the ubiquitous "on success → (optional callback +)
// router.refresh()" effect, so client forms don't each re-declare it. Returns the
// same tuple as useActionState.
export function useRefreshingAction<S extends { ok?: boolean }>(
  action: (prev: Awaited<S>, formData: FormData) => S | Promise<S>,
  initial: Awaited<S>,
  onOk?: () => void,
) {
  const [state, formAction, pending] = useActionState(action, initial);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      onOk?.();
      router.refresh();
    }
  }, [state.ok, onOk, router]);
  return [state, formAction, pending] as const;
}
