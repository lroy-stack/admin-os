import type { SVGProps } from "react";

/**
 * The admin-OS mark: a single-storey "a" drawn as a ring (the O of OS) closed by a stem. Filled shapes only, so it
 * renders the same in the DOM and in the generated icons, and stays legible at 16 px.
 */
export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M12 3.7a8.3 8.3 0 1 1 0 16.6a8.3 8.3 0 0 1 0-16.6Zm0 3.4a4.9 4.9 0 1 0 0 9.8a4.9 4.9 0 0 0 0-9.8Z"
      />
      <rect x="16.9" y="3.7" width="3.4" height="16.6" rx="1.7" />
    </svg>
  );
}
