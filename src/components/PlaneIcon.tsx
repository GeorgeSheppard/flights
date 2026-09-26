import type { SVGProps } from 'react';
import { PLANE_PATH } from '@/lib/planePath';

export function PlaneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d={PLANE_PATH} />
    </svg>
  );
}
