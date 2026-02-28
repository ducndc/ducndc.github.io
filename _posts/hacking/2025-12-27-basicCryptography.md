---
layout: post
title: "Fundamentals of Cryptography"
subtitle: "Understanding Symmetric, Asymmetric, and Hash-Based Encryption"
date: 2025-12-27 14:30:00 +0700
categories: [Hacking, Security]
tags: [cryptography, encryption, security, symmetric-key, public-key, hash, authentication]
author: Chung Duc Nguyen Dang
description: >
  A comprehensive guide to cryptographic fundamentals, including symmetric and asymmetric encryption, 
  hash algorithms, digital signatures, and practical attack methods like dictionary and brute-force attacks.
toc: true
math: true
---

## Overview

Cryptography is a critical scientific and technical discipline that underpins secure information exchange across digital infrastructure. This guide explores the core components of cryptographic systems, their mechanisms, applications, and the security implications of various approaches.

> **Key Concept** 💡
>
> Cryptography transforms readable data into an unreadable format and enables secure data exchange between untrusted parties, making it impossible for unauthorized users to understand intercepted communications.

---

## Table of Contents
{: .toc-custom }

- [Symmetric-Key Encryption](#symmetric-key-encryption)
- [Asymmetric-Key Encryption](#asymmetric-key-encryption)
- [Mathematical Foundations](#mathematical-foundations)
- [Hash Functions](#hash-functions)
- [Cryptographic Attacks](#cryptographic-attacks)
- [Password Security Best Practices](#password-security-best-practices)

---

## 1. Symmetric-Key Encryption
{: #symmetric-key-encryption }

### Introduction

**Symmetric-key encryption**, also known as **secret-key encryption**, uses a single shared key for both encryption and decryption. Both parties (sender and receiver) must securely possess the same key.

```
Sender Side                          Receiver Side
   ↓                                    ↓
Plaintext → [Encrypt with Key] → Ciphertext → [Decrypt with Key] → Plaintext
           ↑                                                         ↑
           └─────────────── Shared Secret Key ──────────────────────┘
```

**Advantages:**
- ✅ Fast computational speed (suitable for large data)
- ✅ Simple implementation
- ✅ Lower computational overhead

**Disadvantages:**
- ❌ Key distribution challenge (how to securely share the key?)
- ❌ Key compromise risks if not properly managed
- ❌ Requires secure channel to exchange keys beforehand

### Classification: Stream vs Block Ciphers

| Feature | **Stream Ciphers** | **Block Ciphers** |
|---------|-------------------|-------------------|
| **Processing** | One bit at a time | Fixed-size blocks (64, 128, 256 bits) |
| **Speed** | Generally faster for streaming | Slightly slower, better for bulk data |
| **Examples** | RC4, ChaCha20 | AES, DES, Triple-DES, Blowfish |
| **Use Case** | Video streaming, real-time communication | File encryption, disk encryption |
| **Vulnerability** | Keystream reuse attacks | Padding oracle attacks |

#### Stream Ciphers

**Stream ciphers** process data one bit at a time, using a keystream generated from the encryption key.

```
Key → [Keystream Generator] → Keystream (k₁, k₂, k₃, ...)
                                    ↓
                          Plaintext ⊕ Keystream → Ciphertext
```

**Popular Algorithms:**
- **RC4 (Rivest Cipher 4)**: Legacy stream cipher, now considered weak
- **ChaCha20**: Modern, secure stream cipher used in TLS 1.3
- **Salsa20**: Stream cipher designed for speed and security

**Example:** RC4 was widely used in SSL/TLS but has been deprecated due to vulnerabilities.

#### Block Ciphers

**Block ciphers** divide plaintext into fixed-size blocks and encrypt each block independently (though modified modes chain them together).

```
Plaintext: [Block 1][Block 2][Block 3]
              ↓          ↓          ↓
           [Encrypt] [Encrypt] [Encrypt]
              ↓          ↓          ↓
Ciphertext: [CT1]    [CT2]    [CT3]
```

**Popular Algorithms:**

| Algorithm | Block Size | Key Size | Status |
|-----------|-----------|---------|--------|
| **DES** | 64 bits | 56 bits | ❌ Deprecated (too small) |
| **Triple-DES** | 64 bits | 168 bits | ⚠️ Legacy (slow) |
| **AES-128** | 128 bits | 128 bits | ✅ Recommended |
| **AES-256** | 128 bits | 256 bits | ✅ Secure for classified data |
| **Blowfish** | 64 bits | 32-448 bits | ⚠️ Small block size |
| **IDEA** | 64 bits | 128 bits | ⚠️ Patent issues |

**Operating Modes:**
- **ECB (Electronic Codebook)**: Simple but insecure (same plaintext → same ciphertext)
- **CBC (Cipher Block Chaining)**: Uses initialization vector, recommended
- **CTR (Counter Mode)**: Turns block cipher into stream cipher, highly secure
- **GCM (Galois/Counter Mode)**: Provides authenticated encryption

**Key Limitation of Symmetric Encryption:**

> ⚠️ **The Key Distribution Problem**
>
> The fundamental challenge: How do two parties securely share a secret key over an insecure channel?
> This led to the invention of **asymmetric (public-key) encryption**.

---

## 2. Asymmetric-Key Encryption
{: #asymmetric-key-encryption }

### Introduction

**Asymmetric-key encryption** (or **public-key cryptography**) uses two mathematically related keys:
- **Public Key**: Can be shared openly with anyone
- **Private Key**: Kept secret by the key owner

```
Alice                              Bob
 ↓                                 ↓
Generate Key Pair             Shares Public Key
(Public + Private)                 ↓
                          Anyone can encrypt
                          Only Bob can decrypt
                                  ↓
                           [Public Key Directory]
                                  ↑
Alice gets Bob's Public Key ──────┘
Alice encrypts with Bob's Public Key
          ↓
Alice sends encrypted message
          ↓
Bob decrypts with his Private Key
```

**Advantages:**
- ✅ Solves key distribution problem
- ✅ No pre-shared secret needed
- ✅ Enables digital signatures for authentication
- ✅ More scalable for many users

**Disadvantages:**
- ❌ Much slower than symmetric encryption (100-1000x)
- ❌ Complex mathematical operations
- ❌ Larger key sizes needed (2048-4096 bits)

### Practical Example: Secure Communication Scenario

**Scenario:** Alice wants to send a confidential message to Bob

**Step 1:** Bob generates a public-private key pair
```
Bob's System: RSA-2048 key generation
├── Public Key:  e, n (shared openly)
└── Private Key: d, n (kept secret)
```

**Step 2:** Bob publishes his public key on a Directory Server
```
Public Key Server
├── Alice → (e_alice, n_alice)
├── Bob →   (e_bob, n_bob)      ← Alice retrieves this
└── Carol → (e_carol, n_carol)
```

**Step 3:** Alice encrypts her message using Bob's public key
```
Plaintext: "Secret Data"
        ↓
Ciphertext = (Plaintext ^ e_bob) mod n_bob
```

**Step 4:** Alice sends encrypted message over insecure channel
```
If intercepted: Ciphertext = "aj#$@!*&^%$#@!" (meaningless without private key)
```

**Step 5:** Only Bob can decrypt using his private key
```
Plaintext = (Ciphertext ^ d_bob) mod n_bob
        ↓
"Secret Data" (recovered!)
```

### Common Asymmetric Algorithms

| Algorithm | Key Size | Security Level | Use Cases |
|-----------|----------|----------------|-----------|
| **RSA** | 2048-4096 bits | Strong | Encryption, digital signatures, TLS |
| **Elliptic Curve (ECC)** | 256-521 bits | Strong* | Certificates, TLS 1.3, Bitcoin |
| **Diffie-Hellman** | 2048+ bits | Strong | Key exchange (not for encryption) |
| **DSA** | 2048 bits | Moderate | Digital signatures, legacy |

*ECC provides equivalent security with smaller key sizes

### Authentication Problem: Digital Signatures

**Issue:** How does Bob know the message came from Alice and wasn't modified?

> **Solution:** Digital Signatures using asymmetric cryptography

**Process:**

```
Alice (Sender)                   Bob (Receiver)
   ↓                                ↓
Plaintext Message               Receives Message + Signature
   ↓                                ↓
Hash the message                Hash the message
   ↓                                ↓
Sign hash with Alice's      Verify signature with
Private Key                 Alice's Public Key
   ↓                                ↓
Send Message + Signature     ✓ Authenticated!
                            ✓ Non-repudiation (Alice can't deny)
```

**Digital Signature Flow:**

```
┌────────────────────────────────────────────────────────┐
│ Message: "I authorize payment of $1000 to Bob"        │
└────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Hash Function (SHA-256)│
        └───────────────────────┘
                    ↓
         ┌──────────────────────┐
Hash:    │ 3a7f8c2e9d...       │
         └──────────────────────┘
                    ↓
        ┌───────────────────────────────────┐
        │ Sign with Alice's Private Key    │
        └───────────────────────────────────┘
                    ↓
  ┌──────────────────────────────────────────┐
  │ Signature: 5f2a8b1c9e3d7f...           │
  └──────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────┐
│ Transmit:                                              │
│  • Original Message                                    │
│  • Signature (proves authenticity & non-repudiation) │
└────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Foundations
{: #mathematical-foundations }

### One-Way Functions

A **one-way function** is computationally easy to execute in one direction but computationally infeasible to reverse.

**Intuitive Example:**

```
Easy:     4 Fruits {apple, banana, orange, mango}
          ↓
       [Blender] → Smoothie (delicious blend)
          
Hard:     Smoothie
          ↓
    [Impossible to recover original fruits]
    You can't "un-blend" a smoothie
```

**Mathematical Definition:**
- Forward: $f(x)$ is *easy* to compute
- Reverse: Finding $x$ from $f(x)$ is *computationally hard*

**Cryptographic Examples:**
- **Exponentiation**: $f(x) = 2^x \bmod p$ (easy to compute, hard to reverse = discrete log problem)
- **Hashing**: `SHA-256("password")` (easy to hash, impossible to un-hash)
- **Integer Factorization**: $f(p,q) = p \times q$ (easy to multiply, hard to factor large numbers)

### Trapdoor Functions

A **trapdoor function** is a one-way function with a "secret shortcut" (trapdoor information) that makes reversal easy.

```
One-Way Function (Hard to reverse):
    x → [Function] → f(x) ← Hard to invert

Trapdoor Function (Easy with secret):
    x → [Function] → f(x)
              ↓       ↑
         [Trapdoor: Secret Key]
         (Only owner knows this!)
```

**RSA as Trapdoor Function:**

```
Everyone:
  Public Info: e, n
  Forward: C ≡ M^e (mod n)  [Easy]
  Reverse: M ≡ C^d (mod n)  [Hard without d]

Only Bob (has private key d):
  Private Info: d
  Reverse: M ≡ C^d (mod n)  [Easy!]
  
d is the TRAPDOOR - the secret that makes reversal easy
```

**Applications in Cryptography:**
- **RSA Encryption**: Public key encrypts, private key decrypts
- **Digital Signatures**: Private key signs, public key verifies
- **Secure Key Exchange**: Diffie-Hellman uses discrete log trapdoor

---

## 4. Hash Functions
{: #hash-functions }

### Purpose and Characteristics

**Hash functions** map data of any size to a fixed-size string of bytes. Unlike encryption, they are **one-way** and **irreversible**.

```
Input: "A quick brown fox jumps over the lazy dog"
    ↓
[SHA-256 Hash Function]
    ↓
Output: 2d8c2f3d6b7e4a1f9c5b8e3a6d2f7c1e9a5b3d8c
(Always 64 hex characters = 256 bits)
```

### Three Critical Properties

| Property | Definition | Importance |
|----------|-----------|-----------|
| **One-way** | Impossible to compute input from output | Security: Can't recover original data |
| **Collision-Resistant** | Hard to find two inputs with same hash | Integrity: Hash uniquely identifies data |
| **Fixed Output** | Output always same size regardless of input | Efficiency: Consistent storage size |

```
Property 1: One-Way
────────────────────
Input: "password123" ──→ [SHA-256] ──→ 8f14e45f...p (output)
                            ↓
                     Can't reverse!


Property 2: Collision-Resistant  
─────────────────────────────────
SHA-256("apple")    ≠ SHA-256("orange")    [Different inputs]
SHA-256("apple")    = SHA-256("apple")     [Same input always]


Property 3: Fixed Output
───────────────────────
SHA-256("x")              → 2d548c27... (256 bits)
SHA-256("very long text") → 7a9f3c2e... (256 bits)
```

### Common Hash Algorithms

| Algorithm | Output Size | Status | Use Cases |
|-----------|------------|--------|-----------|
| **MD5** | 128 bits | ❌ Broken (collisions found) | Legacy only, don't use! |
| **SHA-1** | 160 bits | ⚠️ Weak (collisions possible) | Legacy, being phased out |
| **SHA-256** | 256 bits | ✅ Secure | Passwords, integrity checks, blockchain |
| **SHA-512** | 512 bits | ✅ Secure | High-security applications |
| **bcrypt** | Variable | ✅ Secure + Salt | Password hashing (recommended) |
| **scrypt** | Variable | ✅ Very Secure | Password hashing (resistant to GPU attacks) |

### Password Storage: The Right Way

> ⚠️ **CRITICAL**: Never store plaintext passwords!

**Incorrect (Dangerous):**
```
Database:
├── alice    : "MySecurePass123"  ← If breach occurs, passwords exposed!
├── bob      : "BobPassword456"   
└── carol    : "CarolSecret789"   
```

**Correct (Secure):**
```
Database:
├── alice    : $2b$12$x7Kj8nL2m9... ← Hash of "MySecurePass123"
├── bob      : $2b$12$y4Pq9oM3n1... ← Hash of "BobPassword456"
└── carol    : $2b$12$z5Rr0pN4o2... ← Hash of "CarolSecret789"

When alice logs in with "MySecurePass123":
1. Hash input: SHA-256("MySecurePass123") = 1a2b3c4d...
2. Compare with stored hash: $2b$12$x7Kj8nL2m9...
3. ✓ Match! User authenticated
```

**Why use bcrypt/scrypt?** They include:
- **Salt**: Random value prevents rainbow tables
- **Rounds/Cost Factor**: Makes brute-force attacks slower
- **Memory Hard**: scrypt resists GPU/ASIC attacks

---

## 5. Cryptographic Attacks
{: #cryptographic-attacks }

### Attack 1: Dictionary Attack

A **dictionary attack** uses a precomputed list of common passwords and their hashes.

**Process:**

```
Step 1: Prepare Dictionary
─────────────────────────
"password" → SHA-256 → a9b5c7d8...
"123456"   → SHA-256 → 5f2e1c3b...
"qwerty"   → SHA-256 → 8c4d9f2a...
"letmein"  → SHA-256 → 3e7a2c1f...
... (millions of entries in lookup table)
```

```
Step 2: Compare with Target Hash
────────────────────────────────
Target Hash from Breach: 5f2e1c3b...
                              ↓
                    [Lookup in Table]
                              ↓
                    ✓ Found: "123456"
                    Password recovered!
```

**Why It Works:**
- ✅ Users often choose weak, common passwords
- ✅ Pre-computed hashes require no computation
- ✅ Modern tables: billions of pre-hashed passwords available

**Protection:**

1. **Use Salts**: Salt makes each hash unique
   ```
   Without Salt:
   HASH("password") + HASH("password") = Same hashes
   
   With Salt:
   HASH("password" + random_salt_1) ≠ HASH("password" + random_salt_2)
   ```

2. **Use Strong Passwords**: Complex passwords often not in dictionaries

3. **Use Adaptive Hashing**: bcrypt/scrypt have built-in cost factors

**Real-World Example:**
The LinkedIn 2012 breach: Attackers used dictionary attacks to crack ~90% of 6.5 million hashed passwords within days.

### Attack 2: Brute-Force Attack

A **brute-force attack** systematically tries all possible passwords.

**Process:**

```
Pseudocode:
───────────
for each possible_password in password_space:
    hashed = SHA-256(possible_password)
    if hashed == target_hash:
        print("Found: " + possible_password)
        break
```

**Example Attack Space:**

| Password Format | Possible Combinations | Time to Crack (1 GPU) |
|-----------------|---------------------|----------------------|
| 6-char lowercase | $26^6$ = ~309M | ~1 second |
| 8-char alphanumeric + symbols | $94^8$ = ~6.1T | ~7 days |
| 12-char alphanumeric + symbols | $94^{12}$ = ~475Q | ~17,000 years |
| 16-char alphanumeric + symbols | $94^{16}$ = ~3.1S | ~1.1 billion years |

**Why Dictionary + Brute-Force Combined is Effective:**

```
Hybrid Attack Strategy
──────────────────────
1. Start with dictionary (fast)
   - Cracks ~70% of weak passwords instantly
   
2. Then try brute-force variations
   - Add numbers to dictionary words ("password1", "password2")
   - Common leet speak ("p@ssw0rd")
   - Date patterns ("password2024")
   
3. Result: Cracks ~90% of breached passwords
```

**Computational Power:**
- Modern GPU: 10-100 billion hashes/second
- Botnet of 1000 GPUs: 10 trillion hashes/second
- Future quantum computers: Potentially exponential speedup

### Defense Against Cryptographic Attacks

| Attack | Defense | Implementation |
|--------|---------|-----------------|
| Dictionary | Use Salt + Strong Hashing | bcrypt, scrypt, Argon2 |
| Brute-Force | Slow Hash Functions | Cost factor: 2^12 ~ 2^14 iterations |
| Rainbow Tables | Salts + Long Output | Unique salt per password |
| GPU/ASIC | Memory-Hard Functions | scrypt, Argon2 (GPU-resistant) |

---

## 6. Password Security Best Practices
{: #password-security-best-practices }

### Creating Bulletproof Passwords

**Formula for Strong Password:**

$$\text{Strength} = \log_2(\text{character\_space}^{\text{length}})$$

**Example:**
- Password: `MyP@ssw0rd2024!`
- Character Set: 94 (a-z, A-Z, 0-9, 32 symbols)
- Length: 16 characters
- Bits of Entropy: $\log_2(94^{16}) \approx$ 105 bits (>128 preferred)

**The Three Pillars of Password Security:**

| Pillar | Details | Example |
|--------|---------|---------|
| **Length** | ≥12 characters (16+ better) | ❌ "pass123" (8 chars) |
| **Complexity** | Mix: Uppercase, lowercase, numbers, symbols | ✅ "MyP@ssw0rd2024!" |
| **Uniqueness** | Different password for each account | ✅ AWS: AWSp@ss2024! Facebook: FBp@ss2024! |

**Creating Strong Passwords:**

**❌ Never Do This:**
```
- Dictionary words: "password123" (cracked in 0.003 seconds)
- Birthdate: "19900512" (social engineering target)
- Name-based: "Alice1995" (personal information)
- Keyboard patterns: "qwerty", "asdfgh" (pattern attacks)
- Sequential: "123456", "abc123" (obvious patterns)
```

**✅ Do This Instead:**
```
Method 1: Passphrase
  "BlueCat-Jumps-Over-FenceAt3AM" (easy to remember, strong)
  
Method 2: Random with Pattern
  "K#9pL@2mX$5yR" (truly random, hard to crack)
  
Method 3: Password Manager Generated
  Generate: aX7$mP2@kL9#qR5vN (unique, strong, stored securely)
```

### Additional Security Measures

**1. Multi-Factor Authentication (MFA)**

```
Login Flow:
┌──────────────────────────────────┐
│ What You Know (Password)         │
│ + What You Have (Phone/USB Key)  │
│ = Multi-Factor Authentication    │
└──────────────────────────────────┘

Types:
- SMS verification (weaker)
- TOTP apps (Google Authenticator) (good)
- Hardware keys (YubiKey) (strongest)
```

**2. Password Manager**

Use reputable password managers (Bitwarden, 1Password, KeePass):
- ✅ Generate truly random passwords
- ✅ Store securely encrypted
- ✅ Auto-fill prevents phishing
- ✅ One master password to remember

**3. Breach Monitoring**

- Use services like **Have I Been Pwned** (haveibeenpwned.com)
- Monitor your email at password breach sites
- Change password immediately if compromised

**4. Recommended Update Schedule**

```
General Accounts:        Every 3-6 months
High-Security Accounts:  Every 1-3 months
After Known Breach:      Immediately
Email Account:           Quarterly (prevents account takeover)
```

### Real-World Password Security Stats

| Metric | Finding |
|--------|---------|
| **Most Common Passwords** | "123456", "password", "123456789" (tested on millions) |
| **Time to Crack 8-char password** | ~5 hours (offline attack) |
| **Time to Crack 12-char password** | ~200 years (offline attack) |
| **Percentage using unique passwords** | Only 7% use truly unique passwords per account |
| **Average password reuse** | Americans reuse same password across 4.3 accounts |

**The Scary Part:** 81% of data breaches involve weak or reused passwords.

---

## Key Takeaways

| Concept | Key Point |
|---------|-----------|
| **Symmetric Encryption** | Fast, requires secure key sharing, solves bulk encryption |
| **Asymmetric Encryption** | Solves key distribution, enables authentication, slower |
| **Hash Functions** | One-way, fixed output, for integrity and password storage |
| **Digital Signatures** | Prove authenticity and non-repudiation using asymmetric crypto |
| **One-Way Functions** | Easy forward, hard reverse, mathematical foundation of crypto |
| **Trapdoor Functions** | One-way minus with secret shortcut, enables RSA and TLS |
| **Dictionary Attacks** | Crack weak passwords via lookup tables, prevented by salts |
| **Brute-Force Attacks** | Try all possibilities, CPU/GPU intensive, defeated by length |
| **Password Security** | Length (≥12), complexity (mixed case, numbers, symbols), uniqueness |

---

## Recommended Resources

**Further Reading:**
- NIST Special Publication 800-175B: "Guideline for Using Cryptographic Algorithms"
- "Applied Cryptography" by Bruce Schneier (classic reference)
- "Cryptography Engineering" by Ferguson, Schneier, Kohno

**Interactive Learning:**
- [Crypto Challenges](https://cryptopals.com/) - Hands-on cryptography exercises
- [CyberDefenders](https://cyberdefenders.org/) - CTF challenges
- TryHackMe Cryptography Room - Practical demonstrations

---

## Conclusion

Understanding cryptography's fundamentals is essential for modern cybersecurity. While symmetric encryption provides speed, asymmetric encryption solves the key distribution problem. Hash functions ensure integrity without encryption. Together, these three pillars protect data confidentiality, authenticity, and integrity across digital infrastructure.

Remember: **Better to have a truly random 16-character password protected by bcrypt than a complex 12-character password protected by SHA-1.**

---

*Last Updated: {{ page.date | date: "%B %d, %Y" }}*