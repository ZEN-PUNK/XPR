async function test() {
  const PROTON_API = 'https://proton.eosusa.io';
  
  console.log("1. Fetching borrows...");
  const borrowsResp = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: "lending.loan",
      table: "borrows",
      scope: "lending.loan",
      limit: 100,
      json: true,
    }),
  });
  const borrowsData = await borrowsResp.json();
  console.log("   Borrows count:", borrowsData.rows?.length);
  
  console.log("2. Fetching shares...");
  const sharesResp = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: "lending.loan",
      table: "shares",
      scope: "lending.loan",
      limit: 100,
      json: true,
    }),
  });
  const sharesData = await sharesResp.json();
  console.log("   Shares count:", sharesData.rows?.length);
  
  console.log("3. Processing...");
  let count = 0;
  for (const row of borrowsData.rows || []) {
    const tokens = row.tokens || [];
    for (const t of tokens) {
      if (t.value?.variable_principal > 0) count++;
    }
  }
  console.log("   Accounts with debt:", count);
}

test().then(() => console.log("Done!")).catch(e => console.error("Error:", e));
