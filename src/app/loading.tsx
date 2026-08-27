// Suspense fallback for the route (DESIGN.md → EmptyState/Spinner).
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-muted/30 border-t-foreground"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  );
}
