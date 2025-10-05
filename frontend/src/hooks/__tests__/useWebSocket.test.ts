/**
 * Frontend test: useWebSocket hook
 * Test WebSocket connection and message handling
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Store WebSocket instances for testing
let wsInstances: MockWebSocket[] = [];

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send = jest.fn((data: string) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  });

  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => {
      if (this.onclose) {
        this.onclose(new CloseEvent('close'));
      }
    }, 0);
  });

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    wsInstances = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initializes with disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  test('connects to WebSocket on mount', async () => {
    const onOpen = jest.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        onOpen,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(onOpen).toHaveBeenCalled();
  });

  test('receives and processes messages', async () => {
    const onMessage = jest.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        onMessage,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Get WebSocket instance and simulate message
    await act(async () => {
      const wsInstance = wsInstances[0];
      wsInstance.simulateMessage({
        type: 'test',
        data: { message: 'Hello' },
      });
    });

    await waitFor(() => {
      expect(result.current.lastMessage).not.toBeNull();
    });

    expect(result.current.lastMessage?.type).toBe('test');
    expect(result.current.lastMessage?.data).toEqual({ message: 'Hello' });
    expect(onMessage).toHaveBeenCalledWith({
      type: 'test',
      data: { message: 'Hello' },
    });
  });

  test('sends messages when connected', async () => {
    let wsInstance: MockWebSocket;

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    wsInstance = wsInstances[0];

    act(() => {
      result.current.sendMessage({
        type: 'test',
        data: { message: 'Hello' },
      });
    });

    expect(wsInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'test',
        data: { message: 'Hello' },
      })
    );
  });

  test('does not send messages when disconnected', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
      })
    );

    act(() => {
      result.current.sendMessage({
        type: 'test',
        data: {},
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected');
    consoleSpy.mockRestore();
  });

  test('disconnects on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    unmount();

    expect(wsInstance.close).toHaveBeenCalled();
  });

  test('calls onClose callback when connection closes', async () => {
    const onClose = jest.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        onClose,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    act(() => {
      wsInstance.close();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(onClose).toHaveBeenCalled();
  });

  test('calls onError callback on error', async () => {
    const onError = jest.fn();

    renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        onError,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    const wsInstance = wsInstances[0];

    act(() => {
      wsInstance.simulateError();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  test('reconnects automatically when enabled', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        reconnect: true,
        reconnectInterval: 1000,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    // Simulate connection close
    act(() => {
      wsInstance.close();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Wait for reconnect interval
    await act(async () => {
      jest.advanceTimersByTime(1000);
      jest.runAllTimers();
    });

    // Should reconnect
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('does not reconnect when disabled', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        reconnect: false,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    // Simulate connection close
    await act(async () => {
      wsInstance.close();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    const instanceCountAfterClose = wsInstances.length;

    // Wait for potential reconnect (there should be none)
    await act(async () => {
      jest.advanceTimersByTime(5000);
      jest.runAllTimers();
    });

    // Should not create new WebSocket (reconnect disabled)
    expect(wsInstances.length).toBe(instanceCountAfterClose);
  });

  test('can manually disconnect', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        reconnect: true,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    act(() => {
      result.current.disconnect();
    });

    expect(wsInstance.close).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  test('can manually reconnect', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8000/ws',
        reconnect: false,
      })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wsInstance = wsInstances[0];

    act(() => {
      wsInstance.close();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Manual reconnect
    act(() => {
      result.current.reconnect();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
