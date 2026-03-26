"use client";

import dynamic from "next/dynamic";

const CustomCursor = dynamic(
  () => import("./CustomCursor").then((m) => m.CustomCursor),
  { ssr: false },
);

export function LazyCustomCursor() {
  return <CustomCursor />;
}
