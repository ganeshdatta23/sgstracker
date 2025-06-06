
# Sri Guru Dig Vandanam App

Sri Guru Dig Vandanam is a spiritual companion app built with Next.js. It helps devotees locate Swamiji’s current location, get directional guidance for darshan, and experience an augmented reality (AR)-like viewing feature.

## Core Features:

*   **Admin Location Update**: Admins can securely update Swamiji's current location via a web form or a configured Telegram bot.
*   **Real-time Location Display**: Devotees see Swamiji's latest location on a map.
*   **Darshan Directions**: Provides text-based directions and a "Darshan View" to guide users towards Swamiji using device orientation.
*   **Personalized Greeting**: Offers a unique greeting to first-time users based on Swamiji's location, powered by Genkit and Google AI.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

### Prerequisites

*   Node.js and npm
*   **Database Setup**: This application is currently coded to use **Firebase Firestore**. If you intend to switch to Supabase, you will need a Supabase project and significant code migration.
*   Google AI API Key (for personalized greeting feature).
*   (Optional) A Telegram Bot created via BotFather for Telegram-based location updates.

### Environment Variables

Create a `.env` file in the root of your project.

**Important:** The application code **currently uses Firebase Firestore**. The Supabase variables listed below are provided as per user request for a *potential future migration*. If you set only Supabase variables, the current location features will likely break. For your deployed application (e.g., on Vercel/Netlify), these variables must be set in your hosting provider's environment variable settings.

**Supabase Configuration (if migrating from Firebase):**
```env
# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL="https://kpqwrcjtubmuxcegltty.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXdyY2p0dWJtdXhjZWdsdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzI1MjMsImV4cCI6MjA2MzYwODUyM30.y84yzzcxaevq9VDDEfFG7wo1-OHnlbm2OHM-KQQ1aLo"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXdyY2p0dWJtdXhjZWdsdHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAzMjUyMywiZXhwIjoyMDYzNjA4NTIzfQ.hg1UPajKifRwxT0p68CHBo2leWIaMtXtCASeK67Jkbs" # For server-side operations

# Full Postgres connection string (usually for server-side or specific tools)
# POSTGRES_URL="postgres://postgres.kpqwrcjtubmuxcegltty:bcksJp5cPSu6x2Yc@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
# SUPABASE_JWT_SECRET="vkOsu2mLeTARfaEkiZD5NY6M7SbAL3pdSZ2JD6GVuhwycUVd3Y35D0lWskpsOPFJ19NyKq0p66NXnpKY5d3uQw==" # If using custom JWT auth
```

**Firebase Configuration (Currently used by the application code):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Common Configuration (Used by both setups):**
```env
# Secret Token for Web Admin Access
ADMIN_SECRET_TOKEN=Appaji@1942

# For Genkit AI Features (Personalized Greeting)
GOOGLE_API_KEY=your_google_ai_api_key

# For Telegram Bot Integration (Optional)
TELEGRAM_BOT_TOKEN=7795442330:AAGooq73uC2rps5DJgpdaVX-47wKGfNSMWU
TELEGRAM_AUTHORIZED_CHAT_ID=your_telegram_chat_id
```

Replace `your_...` placeholders with your actual configuration values.

**Note on Database Migration:** The application's data persistence logic (saving and retrieving Swamiji's location) is currently implemented using Firebase Firestore. Migrating to Supabase would require significant code changes in `src/lib/firebase.ts` (to be replaced with Supabase client setup), `src/app/admin/actions.ts` (to use Supabase for updates), and `src/hooks/useSwamijiLocation.ts` (to fetch and subscribe to Supabase).

### Running Locally

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:9002`.

3.  (Optional) Run Genkit development server for AI features:
    ```bash
    npm run genkit:dev
    ```

## Admin Access

*   **Web Admin**: Navigate to `/admin` to update Swamiji's location using the web form. You will need the `ADMIN_SECRET_TOKEN` (e.g., `Appaji@1942`) configured in your `.env` file (and in your hosting provider for deployment).
*   **Telegram Bot Admin**:
    1.  Create a Telegram bot using BotFather (e.g., `@Appaji_loc_bot`) and get its API token (e.g., `7795442330:AAGooq73uC2rps5DJgpdaVX-47wKGfNSMWU`).
    2.  Get the chat ID of the user/admin who will send location updates (e.g., by messaging `@userinfobot`).
    3.  Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_AUTHORIZED_CHAT_ID` in your `.env` file (and in your hosting environment variables).
    4.  Deploy your application to get a public URL (e.g., `https://your-app.vercel.app`).
    5.  Set up the webhook for your Telegram bot by visiting the following URL in your browser (replace placeholders with YOUR bot token and YOUR deployed app URL):
        `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram-webhook`
    6.  Once set up, the authorized Telegram user can simply share a location to the bot, and Swamiji's location will be updated in the Sri Guru Dig Vandanam app (assuming the backend is configured for this).

