# AgriChain: Blockchain-Powered Agricultural Marketplace
AgriChain is a blockchain marketplace connecting farmers directly with buyers through secure Solana transactions. The platform uses USDC escrow payments that only release after product verification via cryptographically-signed QR codes. With separate portals for suppliers and buyers, real-time notifications, and transparent tracking, AgriChain ensures product authenticity while maximizing farmer profits and eliminating intermediaries.
## Key Features
- **Dual Portal System**: Separate interfaces for suppliers (farmers) and buyers
- **Blockchain-Secured Transactions**: Solana-based payments using USDC cryptocurrency
- **Escrow Payment Protection**: Funds held in secure escrow until product authentication
- **QR Code Verification**: Suppliers generate unique QR codes with cryptographic signatures that buyers scan to verify product authenticity
- **Real-Time Notification System**: Instant updates about transactions, verifications, and other events
- **PostgreSQL Database**: Enterprise-grade data persistence
- **WebSocket Integration**: Real-time communication for instant updates
## Technology Stack
- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express.js, Node.js, PostgreSQL with Drizzle ORM
- **Blockchain**: Solana Web3.js
- **Authentication**: JSON Web Tokens (JWT)
- **Real-time**: WebSockets
