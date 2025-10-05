// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock FileReader for chunked upload tests
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      // Create mock base64 data
      this.result = 'data:audio/wav;base64,SGVsbG8gV29ybGQ=';
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }
  
  readAsArrayBuffer(blob: Blob) {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }
  
  abort() {}
  readAsBinaryString(blob: Blob) {}
  readAsText(blob: Blob, encoding?: string) {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;
  readonly EMPTY = 0;
  readonly LOADING = 1;
  readonly DONE = 2;
  readyState = 0;
  error: DOMException | null = null;
} as any;
