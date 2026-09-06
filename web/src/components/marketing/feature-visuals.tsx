import Image from "next/image";

// The four feature-story illustrations. These replaced hand-built CSS
// mockups of the real UI. The two product mockups that show actual
// interface (ProductPreview in the hero, ProductShowcase mid-page) are
// still there, so the page keeps showing the real thing twice while these
// rows carry the visual weight.
//
// Each illustration has a warm off-white background baked into the file,
// so the image fills its card edge to edge rather than sitting on a
// themed surface. In dark mode that reads as a deliberate light plate,
// which is the intent. A themed frame around a cream image would just
// look like a mismatch.
const SIZE = { width: 1200, height: 896 };

function IllustrationCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-line-soft">
      <Image
        src={src}
        alt={alt}
        width={SIZE.width}
        height={SIZE.height}
        className="h-auto w-full"
        sizes="(min-width: 768px) 50vw, 100vw"
      />
    </div>
  );
}

export function ContactVisual() {
  return (
    <IllustrationCard
      src="/feature-centralize.webp"
      alt="Scattered cards converging into a single organized stack"
    />
  );
}

export function PipelineVisual() {
  return (
    <IllustrationCard
      src="/feature-track.webp"
      alt="Blocks progressing in sequence along an ascending path"
    />
  );
}

export function TaskVisual() {
  return (
    <IllustrationCard
      src="/feature-collaborate.webp"
      alt="Three forms arranged around a shared surface"
    />
  );
}

export function ReportVisual() {
  return (
    <IllustrationCard
      src="/feature-grow.webp"
      alt="Ascending bars beneath an upward trending curve"
    />
  );
}
