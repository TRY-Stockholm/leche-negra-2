"use client";

const ITEMS = [
  "Breakfast / Lunch / Dinner / Drinks",
  "Touch the Cassettes",
  "Stockholm",
  "Open Daily from 07:00",
  "Leche Negra",
];

function TickerContent() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-8 shrink-0">
          <span>{item}</span>
          <span className="text-accent">&#x2022;</span>
        </span>
      ))}
    </>
  );
}

export function Ticker() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border overflow-hidden">
      <div className="ticker-track flex items-center gap-8 whitespace-nowrap py-2.5 font-body text-[0.6875rem] font-medium tracking-[0.14em] uppercase text-muted-foreground">
        <TickerContent />
        <TickerContent />
        <TickerContent />
      </div>
    </div>
  );
}
