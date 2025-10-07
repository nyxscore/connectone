import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input Component", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles text input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    await user.type(input, "Hello World");

    expect(input).toHaveValue("Hello World");
  });

  it("shows error state", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Input disabled placeholder="Disabled input" />);
    expect(screen.getByPlaceholderText("Disabled input")).toBeDisabled();
  });

  it("shows label when provided", () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows helper text when provided", () => {
    render(<Input helperText="This is helper text" />);
    expect(screen.getByText("This is helper text")).toBeInTheDocument();
  });

  it("handles different input types", () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "type",
      "email"
    );

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("calls onChange when value changes", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    await user.type(input, "test");

    expect(handleChange).toHaveBeenCalled();
  });
});





















