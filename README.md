# InnerBloom

A fun quiz website inspired by forests and personal growth, featuring 30 quizzes across three categories: Love, Career, and Personality & Growth.

**Live Website:** [innerbloom-quiz.pages.dev](https://innerbloom-quiz.pages.dev/)

## Version Status

As of October 5, 2026, this repository contains sanitized source code for two versions of the project.

| Location | Purpose | Status |
| --- | --- | --- |
| [`static-site/`](static-site/README.md) | The pure static version currently used by the public website, including the redemption code generator | Updated with the latest result content. Fixed redemption codes in the uploaded copy have been replaced with demo values. |
| Repository root | The upgraded version with an admin panel and one-time redemption codes | Locally validated but not yet deployed to the public website. |

To download, run, or deploy the current public website, start with `static-site/`.

The admin panel and D1 instructions below apply to the upgraded version in the repository root. These backend features can only be used online after creating a production database, configuring secrets, and deploying the application.

## Latest Result Content Updates

The 120 result profiles across all 30 quizzes have been updated. Each result now includes:

- A one-sentence conclusion
- Evidence based on the user's actual answers
- Three specific characteristics
- Concrete strengths
- One or two sentences of guidance
- A closing statement

The analysis explains the user's primary tendencies and, when answers indicate a mixture of tendencies, references actual choices associated with secondary tendencies. The Big Five personality test separately interprets aspects such as interaction, consideration for others, and recovery.

Each result contains approximately 273–404 Chinese characters. The updated content was checked against all 15,360 answer combinations from the previous version to confirm consistency in questions, result names, scoring, and tie-breaking rules. Existing redemption flows, page layouts, sharing features, and routing remain unchanged.

The original static version also passed validation of its 800 generated codes and 24,000 range-permission checks.

## User and Admin Workflows

### User Workflow

Users select a quiz, complete the questions, enter a redemption code, and view the full analysis after successful validation. They can then share the result as an image.

Before a code is successfully redeemed, the website does not reveal the result type, animal, keywords, score, summary, or analysis preview.

### Admin Workflow

Administrators sign in at `/admin` using a separate password.

The admin panel supports generating redemption codes for:

- Individual quizzes
- Love quizzes
- Career quizzes
- Personality & Growth quizzes
- All quizzes

Administrators can view redemption status, copy codes, and export them as TXT or CSV files.

Each batch can contain 1–100 codes, and each code can be successfully redeemed only once.

After deployment, administrators can generate and manage redemption codes without modifying the source code.

### Redemption Permissions and Data Handling

Redemption permissions are bound to the current browser's Cookie. Users can continue viewing their results after refreshing the page. However, redemption permissions cannot be recovered after switching devices or browsers, or clearing browser data.

Answers are stored in the current browser and temporarily submitted to a same-origin service when generating the analysis. They are not written to the database.

These quizzes are intended for entertainment and self-reflection, not psychological diagnosis.

## Technical Architecture

- **Frontend:** React, TypeScript, Vite, and Tailwind CSS.
- **Static Hosting:** Cloudflare Pages serves the static website.
- **API:** Pages Functions handles same-origin API endpoints under `/api/*`.
- **Database:** Cloudflare D1 stores redemption codes, access scopes, timestamps, anonymous browser identifiers, and short-term request counters.
- **Result Delivery:** Full analyses are returned only after the server verifies redemption permissions. They are not bundled into the browser-facing pages.
- **Admin Authentication:** The administrator password and session secret are supplied through environment variables. Administrators use an HttpOnly session Cookie.

The project can use Cloudflare's free plan, subject to platform request limits and database quotas. This project does not automatically enable any paid plan.

For current usage limits and pricing, refer to the official documentation:

- [Cloudflare Pages Functions Pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

## Local Development

### Prerequisites

Install Node.js 22 or a newer supported version, along with pnpm.

### Install and Start

Run the following commands from the repository root:

```sh
pnpm install --frozen-lockfile
node scripts/prepare-secrets.mjs
pnpm check
pnpm build
pnpm exec wrangler d1 execute innerbloom-codes --local --file migrations/0001_codes.sql
pnpm exec wrangler pages dev dist --ip 127.0.0.1 --port 5180
```

Open the website at:

- **Website:** http://127.0.0.1:5180/
- **Admin Panel:** http://127.0.0.1:5180/admin

The local administrator password is stored in the automatically generated `.private/cloudflare-secrets.json` file.

The `.private/` directory and `.dev.vars` are excluded by Git. Do not upload them to the repository.

**Important:** `pnpm dev` starts only the frontend development server. The complete redemption and admin workflows require the local Pages service started using the commands above.

### Local API Verification

In a separate terminal, run:

```sh
node scripts/check-api.mjs
```

This script only permits local addresses. It creates test redemption codes and consumes some of them during verification.

**Do not run this script against a production database.**

## Deploy to Your Own Cloudflare Account

1. Log in to your own Cloudflare account using the official Wrangler CLI.
2. Create a Pages project and a D1 database. Update `wrangler.json` with your project name, database name, and database ID. The existing ID is a placeholder and is not linked to any real database.
3. Apply the database migrations and configure the following two Secrets for the Pages project:
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`

   Generate independent, secure random values for the production environment.
4. Build and deploy the application, then verify the redemption and admin workflows on the actual public URL.

The project and database names in the commands below must match your own configuration:

```sh
pnpm exec wrangler d1 migrations apply innerbloom-codes --remote
pnpm exec wrangler pages secret put ADMIN_PASSWORD --project-name innerbloom-quiz
pnpm exec wrangler pages secret put ADMIN_SESSION_SECRET --project-name innerbloom-quiz
pnpm build
pnpm exec wrangler pages deploy dist --project-name innerbloom-quiz --branch main
```

The Secret commands prompt for values interactively, helping prevent real secrets from being written into source code or shell command history.

For subsequent updates, retain your existing production secrets and database.

## Source Code Structure

| Path | Description |
| --- | --- |
| `src/` | Pages, quiz logic, sharing, admin interface, and quiz content |
| `src/data/public.ts` | Question data available to the browser; does not contain result profiles |
| `src/data/analysis.ts` | Organizes result explanations based on actual selections without changing scoring |
| `server/api.ts` | Authentication, redemption, server-side results, and admin APIs |
| `functions/api/[[path]].ts` | Pages Functions entry point |
| `migrations/` | Database schema migrations; contains no operational records |
| `public/` | Routing, security response headers, and search crawler configuration |
| `scripts/` | Content validation, local API verification, and local secret initialization |

## Completed Local Validation

The following checks have been completed locally:

- TypeScript checks and production build.
- Validation of 30 quizzes, 242 questions, 120 result profiles, and 15,360 scoring paths.
- 72 API checks covering authentication, redemption scopes, one-time concurrent redemption, permission persistence after refresh, and exports.
- Browser testing of answer locking before redemption, successful redemption, admin redemption status, bulk copying, CSV downloads, and mobile-width layouts.

In-app browsers such as WeChat and Xiaohongshu, as well as physical iPhone and Android devices, still require real-device testing.

## Sanitization Scope

This repository contains only the source code required to run the project, dependency lockfiles, schema migrations, and placeholder configuration.

It does not contain:

- Administrator passwords or session secrets
- Platform credentials or authorization tokens
- Personal account information
- Real database IDs
- Redemption code records
- Database files or browser data
- Local filesystem paths
- Test screenshots
- Original documents or archived packages of old source code

The fixed redemption code configuration in the static version has been replaced with demo values. Deployment commands use placeholder project names. These changes apply only to the uploaded copy.

Security-related placeholders and local test cases do not represent real credentials.
