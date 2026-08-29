import React from 'react';
import '@testing-library/jest-dom';

// Mock next/navigation hooks used by client components.
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  };
});

// Make next/link render a plain anchor in tests.
// Note: this file is transformed as TS (not TSX), so avoid JSX here.
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ href, children, ...props }: any) =>
      React.createElement(
        'a',
        {
          ...props,
          href: typeof href === 'string' ? href : href?.pathname,
        },
        children,
      ),
  };
});

// next/image often needs a mock in Jest.
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { alt: props.alt ?? '', ...props });
  },
}));
