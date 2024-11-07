export type DeviceType = "desktop" | "mobile";

export function getDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return "desktop";
  
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent) ? "mobile" : "desktop";
} 