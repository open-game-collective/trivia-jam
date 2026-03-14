import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CastButton } from "../CastButton";
import { createMockCastClient } from "@open-game-system/cast-kit/mock";
import { CastKit } from "~/bridge/cast";

function renderCastButton(
  overrides?: Partial<Parameters<typeof createMockCastClient>[0]["initialState"]>
) {
  const client = createMockCastClient({
    initialState: {
      isAvailable: false,
      isCasting: false,
      isConnecting: false,
      isScanning: false,
      deviceName: null,
      deviceId: null,
      sessionId: null,
      devices: [],
      error: null,
      ...overrides,
    },
  });

  return {
    client,
    ...render(
      <CastKit.ProviderFromClient client={client}>
        <CastButton />
      </CastKit.ProviderFromClient>
    ),
  };
}

describe("CastButton", () => {
  it("renders nothing when no devices are available", () => {
    renderCastButton();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a cast button when devices are available", () => {
    renderCastButton({
      isAvailable: true,
      devices: [
        { id: "device-1", name: "Living Room TV", type: "chromecast", isConnected: false },
      ],
    });

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(button.getAttribute("title")).toBe("Cast to device");
  });

  it("shows connected state when casting", () => {
    renderCastButton({
      isAvailable: true,
      isCasting: true,
      deviceName: "Living Room TV",
      deviceId: "device-1",
      sessionId: "session-1",
      devices: [
        { id: "device-1", name: "Living Room TV", type: "chromecast", isConnected: true },
      ],
    });

    expect(screen.getByText("Connected")).toBeDefined();
  });

  it("shows connecting state", () => {
    renderCastButton({
      isAvailable: true,
      isConnecting: true,
      devices: [
        { id: "device-1", name: "Living Room TV", type: "chromecast", isConnected: false },
      ],
    });

    expect(screen.getByText("Connecting")).toBeDefined();
  });

  it("disables button when connecting", () => {
    renderCastButton({
      isAvailable: true,
      isConnecting: true,
      devices: [
        { id: "device-1", name: "Living Room TV", type: "chromecast", isConnected: false },
      ],
    });

    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
