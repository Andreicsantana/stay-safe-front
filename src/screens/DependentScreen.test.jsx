import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DependentScreen from "./DependentScreen";

vi.mock("../services/api", () => ({
  WS_URL: "ws://localhost:3001/ws",
  api: {
    get: vi.fn().mockResolvedValue({ alert: null }),
    post: vi.fn().mockResolvedValue({ alertId: "a1", status: "pending" }),
  },
}));

class MockWebSocket {
  static CLOSED = 3;
  readyState = 1;
  close() {}
}

describe("DependentScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("renders greeting, AJUDA button and handles 3s countdown cancellation", () => {
    render(
      <DependentScreen
        session={{ token: "tok", profile: { id: "p1", name: "João Silva", hasPin: true } }}
        onLogout={vi.fn()}
        onSessionExpired={vi.fn()}
      />
    );

    expect(screen.getByText("Olá, João")).toBeInTheDocument();
    const helpBtn = screen.getByRole("button", { name: /AJUDA/i });
    fireEvent.click(helpBtn);

    expect(screen.getByText(/Enviando em 3/)).toBeInTheDocument();
    const cancelBtn = screen.getByRole("button", { name: /Toque aqui para cancelar/i });
    fireEvent.click(cancelBtn);

    expect(screen.getByRole("button", { name: /AJUDA/i })).toBeInTheDocument();
  });

  it("warns clearly when offline and AJUDA is pressed", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    render(
      <DependentScreen
        session={{ token: "tok", profile: { id: "p1", name: "João", hasPin: false } }}
        onLogout={vi.fn()}
        onSessionExpired={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /AJUDA/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/sem internet/i);
  });
});
