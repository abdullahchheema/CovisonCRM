// One file covers every page under (app) — Next.js wraps the whole
// layout's children in a Suspense boundary with this as the fallback, so
// the sidebar/header stay mounted instantly and only the content area
// shows this while a page's data loads. Without any loading.tsx anywhere
// in the app, navigation showed nothing at all until the full server
// response (page + every Supabase query on it) came back — indistinguishable
// from the app being frozen rather than loading.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="size-8 animate-spin rounded-full border-2 border-line-soft border-t-brand" />
    </div>
  );
}
