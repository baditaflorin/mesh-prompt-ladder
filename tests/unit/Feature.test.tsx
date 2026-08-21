import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, isValidLadder, isValidNote } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("renders the prompt ladder when connected", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);
    expect(screen.getByRole("heading", { name: /A little deeper/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start as facilitator/i })).toBeInTheDocument();
  });

  it("shows a connecting state when room is null", () => {
    render(<Feature room={null} config={config} />);
    expect(screen.getByText(/Joining the discussion room/i)).toBeInTheDocument();
  });

  it("validates bounded shared ladder state and notes", () => {
    expect(
      isValidLadder({ id: "ladder", stage: 0, facilitator: "peer", requestBy: "", updatedAt: 1 }),
    ).toBe(true);
    expect(
      isValidLadder({ id: "ladder", stage: 9, facilitator: "peer", requestBy: "", updatedAt: 1 }),
    ).toBe(false);
    expect(
      isValidNote({ id: "12345678", stage: 0, body: "A thought", author: "Ari", createdAt: 1 }),
    ).toBe(true);
  });
});
