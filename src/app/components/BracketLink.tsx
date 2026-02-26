export function BracketLink({ children }: { children: React.ReactNode }) {
  return (
    <p className="group cursor-pointer">
      <span className="text-muted-foreground group-hover:text-accent transition-colors duration-200">
        [
      </span>{" "}
      <span className="group-hover:text-accent transition-colors duration-200">
        {children}
      </span>{" "}
      <span className="text-muted-foreground group-hover:text-accent transition-colors duration-200">
        ]
      </span>
    </p>
  );
}
