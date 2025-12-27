# SAMA MCP Ecosystem Architecture

> "Together We Light The Way" 🔥

## Vision

SAMA's intelligence layer powered by specialized MCP (Model Context Protocol) servers that enable natural language interaction with the Proton blockchain ecosystem.

```
User: "Swapéame 20 dolaretes de metal por proton, de a tandas de 5 xmd por día"

SAMA Brain interprets:
  → Token: XMD (metal/dolaretes)  
  → Target: XPR token
  → Amount: 20 XMD total
  → Strategy: DCA 5 XMD per day over 4 days
  
Calls: mcp_sama_swaps.schedule_dca_swap({
  from: "XMD", to: "XPR", total: 20, 
  tranches: 4, interval: "daily"
})
```

## MCP Server Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAMA INTELLIGENCE LAYER                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        SAMA BRAIN                                │   │
│  │            (LLM Agent with MCP Client)                          │   │
│  │                                                                  │   │
│  │  • Natural language understanding                               │   │
│  │  • Intent classification                                        │   │
│  │  • Multi-step planning                                          │   │
│  │  • Tool orchestration                                           │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                          │
│              ┌──────────────┴──────────────────────────┐               │
│              │           MCP Protocol Layer            │               │
│              │         (JSON-RPC 2.0 + SSE)            │               │
│              └──────────────┬──────────────────────────┘               │
│                             │                                          │
│   ┌─────────────────────────┼─────────────────────────────────────┐   │
│   │                         │                                      │   │
│   ▼                         ▼                         ▼            │   │
│ ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │   │
│ │  MCP Lending  │   │  MCP Swaps    │   │  MCP Wallet   │         │   │
│ │    Server     │   │    Server     │   │    Server     │         │   │
│ │               │   │               │   │               │         │   │
│ │ • Markets     │   │ • Pools       │   │ • Balances    │         │   │
│ │ • Positions   │   │ • Routes      │   │ • Transfers   │         │   │
│ │ • Liquidate   │   │ • Swap        │   │ • History     │         │   │
│ │ • Rescue      │   │ • DCA         │   │ • Stake       │         │   │
│ └───────┬───────┘   └───────┬───────┘   └───────┬───────┘         │   │
│         │                   │                   │                  │   │
│   ┌─────┴───────────────────┴───────────────────┴─────┐           │   │
│   │                                                    │           │   │
│   ▼                         ▼                         ▼            │   │
│ ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │   │
│ │  MCP Oracle   │   │  MCP NFT      │   │  MCP Account  │         │   │
│ │    Server     │   │    Server     │   │    Server     │         │   │
│ │               │   │               │   │               │         │   │
│ │ • Prices      │   │ • Assets      │   │ • Info        │         │   │
│ │ • Feeds       │   │ • Collections │   │ • Resources   │         │   │
│ │ • TWAP        │   │ • Mint        │   │ • Permissions │         │   │
│ └───────────────┘   └───────────────┘   └───────────────┘         │   │
│                                                                    │   │
└────────────────────────────────────────────────────────────────────┘   │
                                │                                         │
                    ┌───────────┴───────────┐                            │
                    │   @sama/core          │  ← Shared library          │
                    │                       │                            │
                    │ • Constants           │                            │
                    │ • Types               │                            │
                    │ • Proton API client   │                            │
                    │ • Utilities           │                            │
                    └───────────┬───────────┘                            │
                                │                                         │
                    ┌───────────▼───────────┐                            │
                    │  Proton Blockchain    │                            │
                    │  (XPR Network)        │                            │
                    └───────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
zenpunk-xpr/agentic_dev/
├── SAMA_MCP_ARCHITECTURE.md     # This file
├── packages/
│   └── sama-core/               # Shared library (@sama/core)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts         # Main exports
│           ├── constants/
│           │   ├── oracles.ts   # Oracle feed mappings
│           │   ├── markets.ts   # Collateral factors, configs
│           │   └── contracts.ts # Contract addresses
│           ├── types/
│           │   ├── lending.ts   # Lending types
│           │   ├── swaps.ts     # DEX types
│           │   └── common.ts    # Common types
│           ├── api/
│           │   └── proton.ts    # Proton blockchain client
│           └── utils/
│               ├── math.ts      # Precision, calculations
│               └── format.ts    # Formatting helpers
│
├── servers/
│   ├── lending/                 # MCP Lending Server
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── server.ts
│   │       ├── tools.ts
│   │       └── adapters/
│   │           └── lending-adapter.ts
│   │
│   ├── swaps/                   # MCP Swaps Server (future)
│   │   └── src/
│   │       └── adapters/
│   │           └── swaps-adapter.ts
│   │
│   ├── wallet/                  # MCP Wallet Server (future)
│   │   └── src/
│   │       └── adapters/
│   │           └── wallet-adapter.ts
│   │
│   └── oracle/                  # MCP Oracle Server (future)
│       └── src/
│           └── adapters/
│               └── oracle-adapter.ts
│
└── brain/                       # SAMA Brain (future)
    ├── intents/                 # Natural language → intent mapping
    ├── planning/                # Multi-step task planning
    └── orchestrator/            # MCP client orchestration
```

## MCP Server Specifications

### 1. MCP Lending Server
**Port**: 3001
**Tools**: 32 tools
**Capabilities**:
- `get_oracle_prices` - Current token prices
- `get_lending_markets` - All lending markets
- `get_lending_position` - User position details
- `get_liquidatable_positions` - Positions with HF < 1.0
- `get_at_risk_positions` - Positions with HF 1.0-1.1
- ... (see tools.ts for full list)

### 2. MCP Swaps Server (Planned)
**Port**: 3002
**Focus**: proton.swaps DEX
**Tools** (planned):
- `get_swap_pools` - All liquidity pools
- `get_pool_by_pair` - Specific pool info
- `get_swap_rate` - Calculate swap output
- `get_liquidity_positions` - User LP positions
- `execute_swap` - Perform a swap
- `add_liquidity` - Add to pool
- `remove_liquidity` - Remove from pool
- `schedule_dca` - Dollar cost average

### 3. MCP Wallet Server (Planned)
**Port**: 3003
**Focus**: Account & token management
**Tools** (planned):
- `get_balances` - All token balances
- `get_account_info` - Account details
- `transfer_tokens` - Send tokens
- `stake_tokens` - Stake XPR
- `get_transaction_history` - Recent transactions

### 4. MCP Oracle Server (Planned)
**Port**: 3004
**Focus**: Price data & TWAP
**Tools** (planned):
- `get_all_prices` - All oracle prices
- `get_price_history` - Historical prices
- `get_twap` - Time-weighted average price
- `subscribe_price` - Price alerts

## Shared Library: @sama/core

The `@sama/core` package provides:

### Constants (Single Source of Truth)
```typescript
// From: SAMA_portal/ai-agent/config.py
export const ORACLE_FEED_INDEXES = {
  XPR: 3, XBTC: 4, XUSDC: 5, XMT: 6, XETH: 7,
  XDOGE: 8, XUSDT: 9, XUST: 10, XLUNA: 11, XMD: 12,
  XLTC: 16, XXRP: 18, XSOL: 19, XHBAR: 21, XADA: 22, XXLM: 23
};

export const COLLATERAL_FACTORS = {
  XBTC: 0.70, XETH: 0.70, XMD: 0.90, XUSDC: 0.80,
  XPR: 0.40, XSOL: 0.60, // ... etc
};
```

### Proton API Client
```typescript
export class ProtonAPI {
  async getTable(contract, table, scope, limit);
  async getAccount(name);
  async getBalance(account, contract, symbol);
  async pushTransaction(actions);
}
```

### Common Types
```typescript
export interface LendingPosition {
  account: string;
  collaterals: Collateral[];
  debts: Debt[];
  healthFactor: number;
  isLiquidatable: boolean;
}

export interface SwapPool {
  id: number;
  tokenA: Token;
  tokenB: Token;
  reserveA: number;
  reserveB: number;
  fee: number;
}
```

## Integration with SAMA Backend

The MCP servers complement (not replace) the SAMA backend:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   SAMA_portal/backend/        SAMA_portal/zenpunk-xpr/         │
│   ──────────────────         ─────────────────────────          │
│                                                                 │
│   Express REST API            MCP Servers                       │
│   • Production endpoints      • AI/Agent interface              │
│   • WebSocket alerts          • Natural language tools          │
│   • Cron jobs                 • VS Code integration             │
│   • User authentication       • Claude/LLM integration          │
│                                                                 │
│         │                              │                        │
│         └──────────┬───────────────────┘                        │
│                    │                                            │
│                    ▼                                            │
│            ┌──────────────┐                                     │
│            │  @sama/core  │  ← Shared source of truth           │
│            └──────────────┘                                     │
│                    │                                            │
│                    ▼                                            │
│            ┌──────────────┐                                     │
│            │   Proton     │                                     │
│            │  Blockchain  │                                     │
│            └──────────────┘                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Language Aliases (SAMA Brain)

SAMA Brain will understand natural language aliases:

| User Says | SAMA Interprets |
|-----------|-----------------|
| "dolaretes", "dolares", "usd" | XUSDC, XMD |
| "metal" | XMD, XMT |
| "bitcoin", "btc", "satoshis" | XBTC |
| "eth", "ethereum" | XETH |
| "proton", "xpr" | XPR |
| "swap", "cambiar", "intercambiar" | swap action |
| "prestar", "pedir prestado" | borrow action |
| "depositar", "meter" | supply action |
| "tandas", "partes", "dca" | DCA strategy |

## Next Steps

1. [x] Create lending-adapter.ts with correct oracle mappings
2. [x] Implement exchange rate calculations
3. [ ] Extract @sama/core shared library
4. [ ] Create servers/swaps MCP server
5. [ ] Implement SAMA Brain intent parsing
6. [ ] Add transaction signing capabilities

## References

- MCP Protocol: https://modelcontextprotocol.io/
- Proton API: https://proton.eosusa.io
- MetalX Lending Docs: https://lending.docs.metalx.com/
- SAMA Backend: /home/misha/SAMA_portal/backend/
- SAMA Config: /home/misha/SAMA_portal/ai-agent/config.py

---

*"El conocimiento compartido multiplica su valor"* - SAMA Philosophy
