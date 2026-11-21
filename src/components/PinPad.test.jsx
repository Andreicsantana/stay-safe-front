import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PinPad from "./PinPad";

describe("PinPad", () => {
  it("appends digits, removes on backspace and triggers confirm", () => {
    const onChange = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <PinPad value="" onChange={onChange} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(onChange).toHaveBeenCalledWith("1");

    rerender(<PinPad value="12" onChange={onChange} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Apagar dígito" }));
    expect(onChange).toHaveBeenCalledWith("1");

    fireEvent.click(screen.getByRole("button", { name: "Confirmar PIN" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("displays error message when provided", () => {
    render(
      <PinPad
        value="1234"
        onChange={vi.fn()}
        onConfirm={vi.fn()}
        error="PIN incorreto."
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("PIN incorreto.");
  });
});
