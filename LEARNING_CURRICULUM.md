# 🎓 LEARNING CURRICULUM - Software Engineering Fundamentals

> **Your Journey:** From 0 to confident software engineer
> **Duration:** Self-paced (estimated 3-6 months for fundamentals)
> **Approach:** Theory → Practice → Problem-solving

---

## 📚 Phase 1: JavaScript Fundamentals (Weeks 1-4)

### Week 1: The Basics
**Theory:**
- Variables (`let`, `const`, `var`)
- Data types (string, number, boolean, null, undefined)
- Operators (+, -, *, /, %, ===, !==)
- Conditionals (if/else, switch)

**Practice Task:**
- Create a simple calculator function
- **Agent:** Call TEACHER to explain concepts
- **Challenge:** Fix intentional bugs in provided code

**Resource:** [JavaScript.info - The JavaScript Language](https://javascript.info/first-steps)

---

### Week 2: Functions & Scope
**Theory:**
- Function declarations vs expressions
- Arrow functions (`() => {}`)
- Parameters & return values
- Scope (global, function, block)

**Practice Task:**
- Write a transaction validator (checks if amount > 0, symbol exists)
- **Agent:** FEATURE DEVELOPER shows patterns, you implement
- **Challenge:** Refactor your code based on CODE REVIEWER feedback

**Resource:** [JavaScript.info - Code Quality](https://javascript.info/code-quality)

---

### Week 3: Arrays & Objects
**Theory:**
- Arrays (`push`, `pop`, `map`, `filter`, `reduce`)
- Objects (properties, methods, destructuring)
- JSON (`JSON.parse`, `JSON.stringify`)

**Practice Task:**
- Filter test transactions by symbol
- Calculate total portfolio value
- **Agent:** DATABASE ARCHITECT explains data structures

**Resource:** [JavaScript.info - Data Types](https://javascript.info/data-types)

---

### Week 4: Async Programming (CRITICAL!)
**Theory:**
- Callbacks
- Promises (`.then`, `.catch`)
- async/await
- Error handling (try/catch)

**Practice Task:**
- Fetch price from Scout API
- Handle network errors gracefully
- **Agent:** TEACHER uses pizza delivery analogy 🍕

**Resource:** [MDN - Async JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)

**Checkpoint:** Build a mini-app that fetches and displays BTC price

---

## 🔷 Phase 2: TypeScript Basics (Weeks 5-6)

### Week 5: Type Safety
**Theory:**
- Basic types (`string`, `number`, `boolean`, `any`)
- Interfaces vs Types
- Optional properties (`?`)
- Union types (`string | number`)

**Practice Task:**
- Add types to your calculator from Week 1
- Create a `Transaction` interface
- **Agent:** CODE REVIEWER enforces strict typing

**Resource:** [TypeScript Handbook - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

---

### Week 6: Advanced Types
** Theory:**
- Generics (`Array<T>`)
- Type guards (`typeof`, `instanceof`)
- Utility types (`Partial`, `Pick`, `Omit`)

**Practice Task:**
- Create a typed service function: `fetchData<T>(url: string): Promise<T>`
- **Agent:** ARCHITECT explains when to use generics

**Resource:** [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

## ⚛️ Phase 3: React Fundamentals (Weeks 7-10)

### Week 7: Components & JSX
**Theory:**
- Functional components
- JSX syntax
- Props (passing data down)
- Rendering lists (`.map()`)

**Practice Task:**
- Build a `TransactionList` component
- Display test transactions from seed data
- **Agent:** TEACHER explains React mental model

**Resource:** [React Docs - Describing the UI](https://react.dev/learn/describing-the-ui)

---

### Week 8: State & Events
**Theory:**
- `useState` hook
- Event handlers (`onClick`, `onChange`)
- Controlled inputs (forms)

**Practice Task:**
- Build a transaction filter (search by symbol)
- **Agent:** FEATURE DEVELOPER implements, you explain each line

**Resource:** [React Docs - Adding Interactivity](https://react.dev/learn/adding-interactivity)

---

### Week 9: Effects & Side Effects
**Theory:**
- `useEffect` hook
- Dependency array
- Cleanup functions
- Data fetching in React

**Practice Task:**
- Fetch transactions from IndexedDB on component mount
- **Agent:** DEBUGGER helps fix infinite loop bugs

**Resource:** [React Docs - Escape Hatches](https://react.dev/learn/escape-hatches)

---

### Week 10: Custom Hooks & Context
**Theory:**
- Creating custom hooks (`useTransactionData`)
- Context API (`createContext`, `useContext`)
- When to use Context vs props

**Practice Task:**
- Extract transaction logic into `useTransactions` hook
- **Agent:** ARCHITECT explains separation of concerns

**Resource:** [React Docs - Reusing Logic](https://react.dev/learn/reusing-logic-with-custom-hooks)

**Checkpoint:** Build a complete transaction manager UI

---

## 💾 Phase 4: IndexedDB & Storage (Weeks 11-12)

### Week 11: IndexedDB Basics
**Theory:**
- Object stores (like tables)
- Transactions (ACID)
- Indexes (for fast queries)
- `idb` library wrapper

**Practice Task:**
- Create a simple CRUD (Create, Read, Update, Delete) for transactions
- **Agent:** DATA ARCHITECT designs schema

**Resource:** [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

---

### Week 12: Advanced Queries
**Theory:**
- Cursors (iteration)
- Key ranges (filtering)
- Compound indexes (multi-column)
- Migrations (schema changes)

**Practice Task:**
- Implement "Get all transactions for specific symbol"
- **Agent:** TESTER ensures edge cases are handled

---

## 🌐 Phase 5: REST APIs & HTTP (Weeks 13-14)

### Week 13: API Basics
**Theory:**
- HTTP methods (GET, POST, PUT, DELETE)
- Headers & status codes
- `fetch` API
- Request/response cycle

**Practice Task:**
- Call Scout API `/intel/vault` and display prices
- Handle loading state, errors, success
- **Agent:** FEATURE DEVELOPER shows loading patterns

**Resource:** [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

---

### Week 14: Integration
**Theory:**
- API contracts (request/response types)
- Error handling strategies
- Retry logic
- Caching

**Practice Task:**
- Integrate PriceService with UI
- **Agent:** DEBUGGER helps debug network failures

**Checkpoint:** Full-stack transaction dashboard with live prices

---

## 🧪 Phase 6: Testing (Weeks 15-16)

### Week 15: Unit Testing
**Theory:**
- Testing philosophy (why test?)
- Vitest basics (`describe`, `it`, `expect`)
- Mocking functions
- Test-driven development (TDD)

**Practice Task:**
- Write tests for transaction validator
- **Agent:** TESTER shows you how to think about test cases

**Resource:** [Vitest Docs](https://vitest.dev/guide/)

---

### Week 16: Integration Testing
**Theory:**
- Testing React components
- Testing hooks
- Testing IndexedDB operations

**Practice Task:**
- Test `useTransactionData` hook
- **Agent:** TESTER challenges you with edge cases

---

## 🎯 Ongoing Practice (Weekly)

### Code Challenges
**Monday:** Implement a small feature (e.g., sort transactions by date)
- FEATURE DEVELOPER guides implementation

**Wednesday:** Refactor something (e.g., extract duplicated logic)
- CODE REVIEWER provides feedback

**Friday:** Debug a bug (intentional bugs provided by DEBUGGER)
- DEBUGGER teaches debugging methodology

### Conceptual Review
**Every Saturday:** Pick one concept from the week
- TEACHER quizzes you
- You explain it in your own words
- You teach it to an imaginary friend

---

## 📊 Progress Tracking

Create a file: `LEARNING_LOG.md`

After each week, answer:
1. **What did I learn?** (concepts)
2. **What did I build?** (practical output)
3. **What challenged me?** (struggles)
4. **What do I still not understand?** (gaps)
5. **Confidence (1-10):** How confident am I?

Example:
```markdown
### Week 1: JavaScript Basics
- Learned: Variables, conditionals, functions
- Built: Calculator function
- Challenge: Understanding scope
- Gaps: Still confused about hoisting
- Confidence: 7/10
```

---

## 🎓 Graduation: What You'll Know

After 16 weeks of focused learning, you'll be able to:

✅ **Understand** the entire Digital HQ codebase  
✅ **Explain** why architectural decisions were made  
✅ **Implement** new features with guidance  
✅ **Debug** issues systematically  
✅ **Write** tests for your code  
✅ **Refactor** code with confidence  

**Next Level:** Advanced topics (State management, Performance optimization, DevOps)

---

## 🤝 How to Use This Curriculum

1. **Set a Schedule:** 10-15 hours/week minimum
2. **Request Agents:** "I'm on Week 3 - call TEACHER for arrays"
3. **Challenge Mode ON:** Always ask agents to test your understanding
4. **Build Real Features:** Apply learning to actual Digital HQ features
5. **Review Weekly:** Update LEARNING_LOG.md every Saturday

**Remember:** Progress > Perfection. It's okay to struggle. That's learning!

---

**Start Date:** _____________  
**Target Completion:** _____________  
**Current Week:** _____________  
**Confidence:** __/10
