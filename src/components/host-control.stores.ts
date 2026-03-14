import { atom } from "nanostores";

export const $showHelp = atom(false);

export function toggleHelp() {
  $showHelp.set(!$showHelp.get());
}

export function closeHelp() {
  $showHelp.set(false);
}

export function openHelp() {
  $showHelp.set(true);
}
