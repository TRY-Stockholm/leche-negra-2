"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CustomCursor = dynamic(
  () => import("./CustomCursor").then((m) => m.CustomCursor),
  { ssr: false },
);

export function LazyCustomCursor() {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) return null;
  return <CustomCursor />;
}
