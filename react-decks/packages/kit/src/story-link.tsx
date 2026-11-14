export function StoryLink({
  href,
  label,
  opacity = 1,
}: {
  href: string;
  label?: string;
  opacity?: number;
}) {
  return (
    <a
      className="od-mono od-story-link"
      href={href}
      target="_blank"
      rel="noopener"
      style={{ opacity, pointerEvents: opacity > 0.5 ? "auto" : "none" }}
    >
      {label ?? href.replace(/^https?:\/\//, "")}
    </a>
  );
}
