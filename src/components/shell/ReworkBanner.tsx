/**
 * Persistent site-wide and in-app notice informing users that the product is
 * currently down for rework.
 */
export function ReworkBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-xs font-medium text-amber-900 backdrop-blur-md dark:text-amber-200 sm:text-sm"
    >
      <span className="font-semibold">Notice:</span> Product is down for rework. Hosted services and active updates are temporarily paused.
    </div>
  );
}
