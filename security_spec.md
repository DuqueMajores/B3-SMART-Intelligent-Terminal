# Security Specification & Threat Model

This document outlines the security invariants, threat vector payloads, and verification specifications for the B3 Smart Intelligent Terminal.

## 1. Data Invariants

- **User Profile Isolation**: A user profile doc `/users/{userId}` is strictly private to the authenticated owner where `request.auth.uid == userId`. No other user can read or query another user's profile.
- **Relational Integrity**: All transaction records `/users/{userId}/transactions/{transactionId}` and alert records `/users/{userId}/alerts/{alertId}` inherit owner authorization from their parent `/users/{userId}` prefix path.
- **Asset Mutation Integrity**: Transaction operations are restricted to specific keys (`ticker`, `type`, `quantity`, `price`, `date`) and types.

## 2. Threat Vector Payloads ("The Dirty Dozen")

The following payloads represent malicious attempts to bypass identity checks or corrupt states, which our rules strictly reject:

1. **Identity Spoofing (Create Profile for Other)**: Create profile `/users/attacker` with `id: "victim"`.
2. **Identity Spoofing (Read Other Profile)**: Read profile `/users/victim` as `attacker`.
3. **Price Poisoning (Giant Text Value)**: Write transaction with `price` as a 50MB string.
4. **Operation Type Injection**: Write transaction with `type: "FREE_MONEY"`.
5. **Junk Path Variable Inject**: Create alert with document ID containing 1KB of binary junk.
6. **Alert Type Injection**: Create alert with `type: "IMPOSSIBLE_METRIC"`.
7. **Cross-User Data Scraping**: List all transactions across other users.
8. **Unauthorized Transaction Deletion**: Delete transaction of another user.
9. **Blanket Query Abuse**: Retrieve transactions without filtering by the authorized `userId`.
10. **Admin Privilege Spoofing**: Inject `isAdmin` token flag in custom claim payload.
11. **Negative Quantity Poisoning**: Write transaction with `quantity: -100`.
12. **Foreign Ticker Creation**: Write transaction with invalid ticker shape.
