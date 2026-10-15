import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}
