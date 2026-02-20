import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Cloud, CloudOff, Loader2 } from "lucide-react";

export function SyncStatus() {
  const fetching = useIsFetching({ queryKey: ["airtable"] });
  const mutating = useIsMutating({ mutationKey: undefined });
  const isActive = fetching > 0 || mutating > 0;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono">
      {isActive ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-primary">Syncing…</span>
        </>
      ) : (
        <>
          <Cloud className="h-3 w-3 text-success" />
          <span className="text-success">Synced</span>
        </>
      )}
    </div>
  );
}
