const { getLiquidatablePositions } = require('./dist/adapters/lending-adapter');

async function main() {
  try {
    console.log("Testing getLiquidatablePositions...");
    const result = await getLiquidatablePositions(0);
    console.log("Success! Count:", result.count);
    console.log("First position:", JSON.stringify(result.positions[0], null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
  }
}

main();
