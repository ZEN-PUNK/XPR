async function test() {
  console.log("Testing fetch...");
  const response = await fetch("https://proton.eosusa.io/v1/chain/get_table_rows", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: "lending.loan",
      table: "borrows",
      scope: "lending.loan",
      limit: 3,
      json: true,
    }),
  });
  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Rows:", data.rows?.length);
}
test().then(() => console.log("Done")).catch(e => console.error("Error:", e.message));
