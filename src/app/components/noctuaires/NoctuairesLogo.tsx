"use client";

interface NoctuairesLogoProps {
  className?: string;
}

export function NoctuairesLogo({ className }: NoctuairesLogoProps) {
  return (
    <svg
      viewBox="0 0 482 1204"
      xmlns="http://www.w3.org/2000/svg"
      className={`neon-logo ${className ?? ""}`}
      aria-label="Noctuaires"
      role="img"
      overflow="visible"
      style={{
        filter:
          "drop-shadow(0 0 8px var(--accent)) drop-shadow(0 0 20px var(--accent)) drop-shadow(0 0 60px var(--accent))",
      }}
    >
      <g fill="currentColor" fillRule="nonzero" stroke="none">
        {/* Top dome — solid filled half-circle, y=0–244 */}
        <g id="logo-dome">
          <path
            className="neon-char"
            style={{ "--char-i": 0 } as React.CSSProperties}
            d="M241,0 C374.100625,0 482,107.899375 482,241 L482,244 L0,244 L0,241 C0,107.899375 107.899375,0 241,0 Z"
          />
        </g>

        {/* Middle ring — full circle outline, y=364–843 */}
        <g id="logo-ring">
          <g transform="translate(2, 364)">
            <path
              className="neon-char"
              style={{ "--char-i": 1 } as React.CSSProperties}
              d="M239,-3 C372.100625,-3 480,104.899375 480,238 L480,241 L479.975,241 L479.967713,241.985376 C477.839492,373.247822 370.769618,479 239,479 C106.901388,479 -0.373988923,372.719092 -1.98168993,241.001717 L-2,241 L-2,238 C-2,104.899375 105.899375,-3 239,-3 Z M473.981225,241 L4.024,241 L4.03148329,241.886155 C6.10671906,369.880657 110.510953,473 239,473 C367.784959,473 472.374041,369.40514 473.981225,241 Z"
            />
          </g>
        </g>

        {/* Bottom dome — inverted open half-circle, y=960–1204 */}
        <g id="logo-base">
          <path
            className="neon-char"
            style={{ "--char-i": 2 } as React.CSSProperties}
            d="M241,960 C374.100625,960 482,1067.89938 482,1201 L482,1204 L0,1204 L0,1201 C0,1067.89938 107.899375,960 241,960 Z M241,966 C111.213084,966 6,1071.21308 6,1201 L6.024,1198 L475.975,1198 L475.968517,1197.11385 C473.914243,1070.41222 371.587783,968.085757 244.886155,966.031483 L241,966 Z"
            transform="translate(241, 1082) rotate(180) translate(-241, -1082)"
          />
        </g>
      </g>
    </svg>
  );
}
