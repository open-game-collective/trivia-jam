import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import { Homepage } from './homepage';

const meta: Meta<typeof Homepage> = {
  title: 'Game/Homepage',
  component: Homepage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Homepage>;

// Default view
export const Default: Story = {};

// With game code entered
export const WithGameCode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and fill the game code input
    const gameCodeInput = canvas.getByLabelText(/game code/i);
    await userEvent.type(gameCodeInput, 'ABC123');
    
    // Verify the input value
    expect(gameCodeInput).toHaveValue('ABC123');
  },
};

// Join game interaction
export const JoinGameInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and fill the game code input
    const gameCodeInput = canvas.getByLabelText(/game code/i);
    await userEvent.type(gameCodeInput, 'ABC123');
    
    // Submit the form
    const joinButton = canvas.getByRole('button', { name: /join game/i });
    await userEvent.click(joinButton);
  },
};

// Create new game interaction
export const CreateGameInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click the create new game button
    const createButton = canvas.getByRole('button', { name: /create new game/i });
    await userEvent.click(createButton);
  },
};

// Show help interaction
export const ShowHelpInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click the help button
    const helpButton = canvas.getByRole('button', { name: /how to play/i });
    await userEvent.click(helpButton);
  },
};

// Mobile view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Tablet view
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// Desktop view
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
}; 