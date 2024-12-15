import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { HostView } from "./host-view";
import { GameContext } from "../game.context";
import { SessionContext } from "../session.context";
import { createActorKitMockClient } from "actor-kit/test";
import type { GameMachine } from "../game.machine";
import type { SessionMachine } from "../session.machine";
import { CallerSnapshotFrom, ClientEventFrom } from 'actor-kit';
import { defaultGameSnapshot, defaultSessionSnapshot } from '../../stories/utils';

const meta: Meta<typeof HostView> = {
  title: "Game/HostView",
  component: HostView,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof HostView>;

// Helper to create mock clients
const createMockClients = (
  gameState: CallerSnapshotFrom<GameMachine>,
  sessionState: CallerSnapshotFrom<SessionMachine>,
  onGameEvent?: (event: ClientEventFrom<GameMachine>) => void
) => {
  const mockGameClient = createActorKitMockClient<GameMachine>({
    initialSnapshot: gameState,
    onSend: (event) => {
      console.log("Game event:", event);
      onGameEvent?.(event);
    },
  });

  const mockSessionClient = createActorKitMockClient<SessionMachine>({
    initialSnapshot: sessionState,
    onSend: (event) => {
      console.log("Session event:", event);
    },
  });

  return { mockGameClient, mockSessionClient };
};

// Base game state - extend from default snapshot
const baseGameState: CallerSnapshotFrom<GameMachine> = {
  ...defaultGameSnapshot,
  public: {
    ...defaultGameSnapshot.public,
    id: "game-123",
    hostId: "host-456",
    hostName: "Host",
    settings: {
      maxPlayers: 10,
      questionCount: 10,
      answerTimeWindow: 30,
    },
  },
};

// Base session state - extend from default snapshot
const baseSessionState: CallerSnapshotFrom<SessionMachine> = {
  ...defaultSessionSnapshot,
  public: {
    ...defaultSessionSnapshot.public,
    userId: "host-456",
  },
  private: {
    gameIds: ["game-123"],
  },
};

export const Default: Story = {
  args: {
    host: "triviajam.tv",
  },
  decorators: [
    (Story) => {
      const { mockGameClient, mockSessionClient } = createMockClients(
        baseGameState,
        baseSessionState
      );

      return (
        <SessionContext.ProviderFromClient client={mockSessionClient}>
          <GameContext.ProviderFromClient client={mockGameClient}>
            <Story />
          </GameContext.ProviderFromClient>
        </SessionContext.ProviderFromClient>
      );
    },
  ],
};

export const WithSettingsInteraction: Story = {
  args: {
    host: "triviajam.tv",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open settings
    const settingsButton = await canvas.findByLabelText("Settings");
    await userEvent.click(settingsButton);

    // Verify settings modal is open
    const modal = await canvas.findByText("Game Settings");
    expect(modal).toBeInTheDocument();

    // Change settings
    const questionCountInput = canvas.getByLabelText("Number of Questions");
    await userEvent.clear(questionCountInput);
    await userEvent.type(questionCountInput, "20");

    const timeWindowInput = canvas.getByLabelText("Answer Time Window");
    await userEvent.clear(timeWindowInput);
    await userEvent.type(timeWindowInput, "45");

    const maxPlayersSelect = canvas.getByLabelText("Max Players");
    await userEvent.selectOptions(maxPlayersSelect, "100");

    // Save settings
    const saveButton = canvas.getByText("Save Settings");
    await userEvent.click(saveButton);

    // Verify modal is closed
    expect(modal).not.toBeInTheDocument();
  },
  decorators: [
    (Story) => {
      let lastEvent: any = null;
      const { mockGameClient, mockSessionClient } = createMockClients(
        baseGameState,
        baseSessionState,
        (event) => {
          lastEvent = event;
        }
      );

      return (
        <SessionContext.ProviderFromClient client={mockSessionClient}>
          <GameContext.ProviderFromClient client={mockGameClient}>
            <Story />
          </GameContext.ProviderFromClient>
        </SessionContext.ProviderFromClient>
      );
    },
  ],
}; 