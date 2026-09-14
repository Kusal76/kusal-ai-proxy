---
visibility: public
---

# StockEasy – Cloud-Native Pharmacy Management & POS System

## Overview

StockEasy is a full-stack, multi-tenant pharmacy management and POS platform designed to support inventory management, billing, analytics, role-based access control, and pharmacy operations.

## Live Application

https://stock-easy-orpin.vercel.app/

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js Server Actions and Route Handlers
- **Database:** PostgreSQL through Supabase
- **Authentication:** Supabase Auth with PKCE
- **Caching / Security:** Upstash Redis
- **Background Processing:** Upstash QStash
- **Email:** Resend
- **AI:** Gemini AI

## Core Features

- Multi-tenant pharmacy management
- Point of Sale (POS)
- Batch-level inventory management
- FEFO inventory recommendations
- Real-time analytics
- Role-based access control
- PostgreSQL Row Level Security (RLS)
- Two-Factor Authentication (2FA/TOTP)
- Tenant blacklisting and rate limiting
- Background transactional email processing

## Business Problem

Pharmacies can face problems such as:

- Medicine expiry losses
- Poor visibility into batch-level inventory
- Manual billing processes
- Limited reporting
- Difficulty managing multiple staff roles
- Lack of centralized cloud-based access

## Solution

StockEasy addresses these requirements using:

- FEFO-based inventory recommendations
- Cloud-based inventory management
- Real-time analytics
- Automated billing
- Role-based access control
- Multi-tenant database architecture

## FEFO Inventory Optimization

StockEasy uses a First-Expire-First-Out strategy to prioritize medicines with the nearest expiration dates.

The system uses expiration information to help determine which inventory batches should be used first.

## Authentication & Security

### Multi-Factor Authentication

TOTP-based two-factor authentication is used for Superadmin accounts and configurable 2FA requirements are supported for pharmacy Owners.

### Session Management

Supabase Auth uses the PKCE authentication flow.

A custom Next.js middleware handles application-specific session behavior, including transient and persistent session configurations.

### Tenant Blacklisting

Upstash Redis is used to maintain tenant blacklist information and perform fast checks during authentication-related flows.

### Rate Limiting

Redis-based rate limiting is used to reduce brute-force login attempts.

## System Architecture

### Frontend

- Next.js 16 App Router
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js Server Actions
- Next.js Route Handlers

### Database

- PostgreSQL
- Supabase
- Row Level Security

### Infrastructure

- Vercel
- Supabase
- Upstash Redis
- Upstash QStash
- Resend

## Multi-Tenant Architecture

StockEasy uses a shared-database tenant-isolation model.

Major business tables contain a `shop_id` identifier representing the pharmacy tenant.

PostgreSQL Row Level Security policies are used to restrict access to rows belonging to the appropriate tenant.

Examples of business tables include:

- `inventory`
- `bills`
- `users`
- `support_tickets`

## Real-Time Analytics

Supabase Realtime subscriptions are used to provide live updates for analytics-related information such as inventory and sales data.

## Background Processing

Upstash QStash is used for asynchronous processing of background events such as transactional email workflows.

The objective is to prevent background operations from blocking the primary application flow.

## Key Engineering Challenges

### Challenge 1 — Medicine Expiry

Implemented FEFO-based inventory recommendations to prioritize medicines approaching expiration.

### Challenge 2 — Tenant Isolation

Implemented PostgreSQL Row Level Security using tenant identifiers such as `shop_id`.

### Challenge 3 — Real-Time Analytics

Integrated Supabase Realtime subscriptions for live dashboard updates.

### Challenge 4 — Authentication Security

Implemented TOTP-based 2FA, PKCE authentication, tenant blacklist checks, and rate limiting.

### Challenge 5 — Background Processing

Used Upstash QStash for asynchronous transactional email workflows.

## Key Engineering Decisions

### Why PostgreSQL?

PostgreSQL was used as the relational database because StockEasy contains strongly structured relationships between pharmacies, users, inventory, batches, bills, and other business entities. PostgreSQL also provides Row Level Security, which supports the application's tenant-isolation strategy.

### Why Supabase?

Supabase provides PostgreSQL together with authentication and realtime capabilities, allowing several backend requirements to be integrated around the same database platform.

### Why Redis?

Upstash Redis is used where low-latency key-value access is useful, including tenant blacklist checks and rate limiting.

### Why QStash?

QStash is used for asynchronous background processing so transactional email workflows do not unnecessarily block the main application flow.

## Important Verified Claims

- Multi-tenant architecture
- PostgreSQL with Supabase
- PostgreSQL Row Level Security
- FEFO inventory recommendations
- Supabase Realtime
- TOTP-based 2FA
- Upstash Redis
- Upstash QStash
- Next.js Server Actions and Route Handlers