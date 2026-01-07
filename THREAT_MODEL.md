# Threat Model

## 🧠 Overview

Magic Privacy Messenger is designed with **privacy-by-design** and **security-by-default** principles.

This document outlines the high-level threat model to provide transparency into how we reason about risks and mitigations.

---

## 🎯 Security Goals

- Confidentiality of message content
- Integrity of messages and media
- Authentication of participants
- Minimal metadata exposure
- Resistance to mass surveillance

---

## 👤 Threat Actors

We consider the following threat actors:

- Passive network observers (ISPs, Wi-Fi operators)
- Active network attackers (MITM)
- Malicious users
- Compromised client devices
- Curious or malicious third parties

---

## 🔐 Cryptographic Model

- End-to-end encryption (E2EE)
- Forward secrecy
- Encrypted media transfer
- Encrypted group messaging

> Message content is never accessible to servers in plaintext.

---

## 🗂 Metadata Considerations

We minimize metadata wherever possible:

- No phone number or email required
- No contact graph upload
- Limited connection metadata

Some metadata (e.g., message timing or size) may still be observable at the network level.

---

## 📱 Client-Side Trust

Security assumes:

- Client devices are not compromised
- Users protect their devices

If a device is compromised, end-to-end encryption cannot guarantee message secrecy.

---

## ⚠️ Non-Goals

The following are explicitly **out of scope**:

- Protection against fully compromised operating systems
- Protection against physical device seizure
- Anonymous traffic routing guarantees beyond VPN/Tor usage

---

## 🔄 Evolution

This threat model evolves over time as:

- New features are added
- Threats change
- Cryptographic best practices evolve

Feedback from the security community is welcome via responsible disclosure.
