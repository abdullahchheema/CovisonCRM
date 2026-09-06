import Image from "next/image";

// The brand mark. Every surface that shows the logo — marketing header and
// footer, the brand section, the auth shell, the login hero — renders
// through this one component, so swapping the artwork is a one-file change.
//
// The supplied file was a JPEG (white background baked in, no alpha), which
// would have shown as a white box on the dark theme and on the always-dark
// panels. public/logo-mark.png is that artwork with the background cut out,
// so the violet mark now sits correctly on any surface in either theme.
//
// Sized by the caller's className (e.g. `size-8`); the width/height below
// are the intrinsic dimensions Next needs to reserve space and pick a
// srcset, not the rendered size.
export function CovisonMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={512}
      height={512}
      className={className}
      priority
    />
  );
}
