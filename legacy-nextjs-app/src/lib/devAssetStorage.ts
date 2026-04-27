// Simple in-memory storage for development mode
const devAssets: Map<string, any[]> = new Map();

// Function to store assets from other APIs
export function storeDevAsset(userId: string, asset: any) {
  const userAssets = devAssets.get(userId) || [];
  userAssets.unshift(asset); // Add to beginning for newest-first ordering
  devAssets.set(userId, userAssets);
  console.log(`💾 Stored dev asset for user ${userId}:`, asset.filename);
  console.log(`💾 Total assets for user ${userId}:`, userAssets.length);
  console.log(`💾 All stored users:`, Array.from(devAssets.keys()));
}

// Function to get assets for a user
export function getDevAssets(userId: string): any[] {
  const assets = devAssets.get(userId) || [];
  console.log(`📖 Getting assets for user ${userId}: found ${assets.length} assets`);
  console.log(`📖 Available users in storage:`, Array.from(devAssets.keys()));
  return assets;
}

// Function to clear assets for a user (for cleanup)
export function clearDevAssets(userId: string): void {
  devAssets.delete(userId);
}