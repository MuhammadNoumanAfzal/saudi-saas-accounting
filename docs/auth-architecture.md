# Auth Architecture

KHANBAS NEXUS uses Clerk for identity only and PostgreSQL for all SaaS business access.

## Source of Truth

Clerk owns:
- Sign up and sign in
- Email/social identity
- Email verification
- Session and JWT token issuance

PostgreSQL owns:
- Organizations / tenants
- Branches
- Roles and permissions
- Owner-approved invitations
- Module access
- Accounting data isolation

## Required Clerk Setting

Do not enable Clerk Organizations in membership-required mode for this app. Use one of these settings:

- Disable Clerk Organizations, or
- Set Organizations membership to optional, or
- Enable Personal Accounts

If Clerk forces `/tasks/choose-organization`, KHANBAS cannot receive a normal bearer token and `/api/me` will return `401 Unauthorized` until the Clerk setting is corrected.

## Invitation Flow

1. Owner creates an invitation in KHANBAS.
2. Owner approves the invitation.
3. Invitee creates/signs into a Clerk account with the same email.
4. Backend `/api/me` matches that email to an `APPROVED` row in `organization_invitations`.
5. Backend creates an active `organization_membership`, preserving role and branch scope.
6. Invitation is marked `ACCEPTED`.

This keeps the system production-safe: there is one identity provider and one business-access source of truth.