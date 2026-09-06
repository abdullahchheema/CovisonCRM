import { CovisonMark } from "@/components/brand/covison-mark";

// One file covers every page under (app). Next.js wraps the whole
// layout's children in a Suspense boundary with this as the fallback, so
// the sidebar/header stay mounted instantly and only the content area
// shows this while a page's data loads. Without any loading.tsx anywhere
// in the app, navigation showed nothing at all until the full server
// response (page + every Supabase query on it) came back, indistinguishable
// from the app being frozen rather than loading.
//
// The mark pulses rather than a neutral spinner: it's the one moment the
// user is definitely looking at an otherwise empty region.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <CovisonMark className="size-10 animate-pulse" />
    </div>
  );
}
