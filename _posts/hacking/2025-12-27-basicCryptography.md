---
layout: post
title: "Basic Cryptography"
date: 2025-11-16 10:00:00 +0700
categories: [Hacking]
---

<div style="text-align: justify; text-indent: 2em;">
Cryptography is an important scientific and technical application in the process of information exchange on digital infrastructure. This document will analyze the components in cryptographic applications, helping to clarify the role, tasks, and operating methods in digital information infrastructure.
</div>

## Private Key Encryption

<div style="text-align: justify; text-indent: 2em;">
Private key encryption is a key stored on both the sender and receiver sides, used on the sender side to encrypt information and on the receiver side to decrypt information.
</div>

<div style="text-align: justify; text-indent: 2em;">
Private key encryption is usually divided into two methods: stream ciphers and block ciphers.
</div>

### Stream Ciphers

<div style="text-align: justify; text-indent: 2em;">
Working on a single bit at a time, one of the widely known algorithms is RC4 (Rivest Cipher 4)
</div>

### Block Ciphers

<div style="text-align: justify; text-indent: 2em;">
Working on groups of bits of fixed length, blocks of length such as 64, 128, 256 bits. Block encryption algorithms are widely known as DES (Data Encryption Standard), Triple DES, IDEA (International Data Encryption Algorithm), RC5 (Rivest Cipher 5), AES (Advanced Encryption Standard), Blowfish, etc.One of the biggest problems with secret key encryption is finding a way to obtain the key from the data sharer. Sharing this key poses a significant security risk, and the solution is to use public key encryption.
</div>

## Public Key Encryption 

<div style="text-align: justify; text-indent: 2em;">
In public key encryption, two different keys are used for encrypting and decrypting data, and these two keys have a mathematical relationship with each other. These two keys are a pair consisting of a public key and a private key.
</div>

<div style="text-align: justify; text-indent: 2em;">
The public key can be shared with anyone, while the private key is held only by the person who created these two keys. Therefore, the sender will use the public key to encrypt the data, and the receiver will use the private key to decrypt the data received from the sender.
</div>

Example: Steps in data transmission with public key encryption

Scenario: An needs to send Hoa a message

1. Hoa creates a public key and a private key pair.

2. Hoa uploads this public key to a public key sharing server; anyone can obtain this key and inform An to get it.

3. An obtains Hoa's public key.

4. An retrieves the data she wants to send to Hoa and encrypts it with Hoa's public key.

5. An sends the encrypted data to Hoa.

6. Hoa uses the private key to decrypt the data received from An.

<div style="text-align: justify; text-indent: 2em;">
Although Hoa's private key can prevent anyone from reading and changing the data during transmission, it cannot verify who sent the data to Hoa. It could be An, but it could also be anyone using Hoa's public key. To prove the sender's identity, we need another technology known as a digital signature.

</div>

## One-Way Functions and Trapdoor Functions in Modern Cryptography

### One-Way Functions

<div style="text-align: justify; text-indent: 2em;">
Let's take an example: mixing four different fruits and blending them into a delicious smoothie is easy to do, but in the reverse direction, taking a smoothie and distinguishing which fruits are in it is much more difficult. In reality, a one-way function is a function where f(x) is easy to calculate but it is very difficult to find x from f(x).

</div>

### Trapdoor Functions

<div style="text-align: justify; text-indent: 2em;">
A trapdoor function is a special case of a one-way function. Given trapdoor information (t), we can easily find the value of x. Trapdoor functions are widely used in public-key cryptography. Everyone can encrypt with a public key, but only the person holding the private key can decrypt. RSA encryption systems and digital signatures use a trapdoor function.

</div>

## Hash Algorithm

<div style="text-align: justify; text-indent: 2em;">
Hash algorithms (SHA-256, ....) are primarily used for comparison purposes, not for encryption. Hash algorithms are known for three main characteristics:

</div>

1. Difficult to reverse engineer
2. Fixed size (128, 256 bits), meaning the output is usually of a fixed size regardless of whether the input has one or many characters
3. Unique, two different data sets cannot have the same output

<div style="text-align: justify; text-indent: 2em;">
Widely used for passwords. Remember this: all passwords should be stored as the output of a hashing algorithm, and no password should ever be stored in its raw form in any database. When you log in with your password, it's hashed and compared to the hash stored in the database; that's why it's used for comparison instead of encryption. Oddly enough, why is it still possible to steal your password?

</div>

## Some Ways to Retrieve Hashed Passwords

<div style="text-align: justify; text-indent: 2em;">
If you use a simple password, some applications will check the character strings and compare them to the hash to determine if the password is hashed. Therefore, make your password more complex, including numbers, uppercase letters, and special characters; this will make it harder to steal your password.

</div>

## Dictionary Attack and Brute Force Attack

## Dictionary Attack
<div style="text-align: justify; text-indent: 2em;">
A dictionary attack involves using a list of common passwords.

</div>

Step 1: From a dictionary, generate corresponding hash strings, with thousands of such strings, and put them into a table to search against these strings.

Step 2: Compare the hash strings in the table with the hash string to be attacked. If a match is found, the password string is obtained.

## Brute Force Attack

<div style="text-align: justify; text-indent: 2em;">
Using a loop, each character is automatically tried, which could be a word, character, number, or anything else. This method is effective for short passwords. In the future, if computing becomes fast enough (quantum), all passwords with current mechanisms will be easily attacked by this brute-force method.

</div>

<div style="text-align: justify; text-indent: 2em;">
Attackers often use a combination of these two methods, and to better protect your password, there are 3 things to pay attention to:</div>

1. Strong password: at least 12 characters, including uppercase and lowercase letters, numbers, and special characters.
2. Unique password: you will have multiple passwords for each different account, and each password needs to be different from the others.
3. Always change your password: change your password at least every 3 months.