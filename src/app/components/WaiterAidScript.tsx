"use client";

import Script from "next/script";

export function WaiterAidScript() {
  return (
    <Script
      id="waiteraid-widget"
      src="https://app.bokabord.se/widget-popup/widget.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (document.readyState !== "loading") {
          document.dispatchEvent(new Event("DOMContentLoaded"));
        }
      }}
    />
  );
}
