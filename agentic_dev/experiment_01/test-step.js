const adapter = require('./dist/adapters/lending-adapter');

async function test() {
  console.log("1. Testing getOraclePrices...");
  const prices = await adapter.getOraclePrices();
  console.log("   Prices count:", prices.count);
  
  console.log("2. Testing getLendingMarkets...");
  const markets = await adapter.getLendingMarkets();
  console.log("   Markets count:", markets.count);
  
  console.log("3. Testing getLiquidatablePositions...");
  const liq = await adapter.getLiquidatablePositions(0);
  console.log("   Liquidatable count:", liq.count);
}

test().then(() => console.log("All done!")).catch(e => {
  console.error("Error:", e.message);
  console.error("Stack:", e.stack);
});
