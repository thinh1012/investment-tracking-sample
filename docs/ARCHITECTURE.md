# Data Architecture & Schema Map

## 1. Entity Relationship Diagram (ERD)

This diagram shows how the core "Transactions" relate to each other and how they form the "Assets" you see on the dashboard.

```mermaid
erDiagram
    TRANSACTION ||--o{ TRANSACTION : "linkedTo (Parent/Child)"
    TRANSACTION }|--|| ASSET : "affects"
    
    TRANSACTION {
        string id PK
        string date
        string type "DEPOSIT | WITHDRAWAL | INTEREST | TRANSFER"
        string assetSymbol "BTC, LP-HYPE, etc"
        number amount
        number pricePerUnit "Cost Basis"
        string linkedTransactionId FK "Self-Reference"
        object MetaData "(LP Range, Notes, PaymentMode)"
    }

    ASSET {
        string symbol PK
        number quantity "Sum(Deposits) - Sum(Withdrawals)"
        number totalInvested "Sum(CostBasis)"
        number averageBuyPrice "Invested / Quantity"
        number currentValue "Qty * LivePrice"
        object lpRange "Min/Max"
    }
```

## 2. Transaction Flow "The Engine"

How a raw input becomes a Dashboard Metric.

```mermaid
flowchart TD
    %% Nodes
    Input[("User Input / Form")]
    DB[(LocalStorage DB)]
    Processor[["usePortfolio() Hook"]]
    
    subgraph Dashboard View
        Total[("Total Invested")]
        Breakdown[("Funding Breakdown")]
        AssetRow[("Asset Row")]
    end

    %% Flow
    Input -->|"Create (Deopsit/Buy)"| DB
    DB -->|"Load Raw List"| Processor
    
    Processor -->|"Sum(Cost)"| Calculator1(Total Invested Logic)
    Calculator1 -->|"Display"| Total
    
    Processor -->|"Filter(Type=Deposit)"| Calculator2(Funding Logic)
    Calculator2 -.->|"Subtract Linked Leaves"| Calculator2
    Calculator2 -->|"Display"| Breakdown

    Processor -->|"Grouping by Symbol"| AssetRow
```

## 3. The "Mixed Funding" Map (Specific Example)

Visualizing what happens when you "Buy LP with Fresh Cash + Holdings".

```mermaid
sequenceDiagram
    participant User
    participant Form
    participant DB as Transaction Ledger

    User->>Form: "Buy LP-HYPE"
    User->>Form: "Use 500 USDT (Fresh)"
    User->>Form: "Use 50 HYPE (Holdings)"
    
    Form->>DB: 1. Create [WITHDRAWAL] 50 HYPE
    Note right of DB: Reduces HYPE holdings
    Form->>DB: 2. Create [DEPOSIT] LP-HYPE
    Note right of DB: Adds LP Asset
    
    rect rgb(240, 248, 255)
        Note over DB: LINKAGE
        DB->>DB: Withdrawal linkedTo Deposit ID
    end
```
