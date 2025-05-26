# **App Name**: Guru Tracker

## Core Features:

- Location Display: Display Swamiji's current location on a map using Leaflet.js, showing coordinates and the last updated time.
- Admin Location Update: A simple UI for admins to input either a Google Maps URL or direct coordinates to update Swamiji's location.
- Secure Location Update API: API endpoint to securely update the location using a token, handling coordinate extraction and reverse geocoding to a human-readable name. Utilizes Supabase for data storage.
- Darshan Directions: Implement a 'Darshan Directions' tool. This tool provides step-by-step directions and estimated travel time to Swamiji's current location, either from the user's current location (if available) or a specified starting point. Directions would be based on publicly available APIs from Google Maps or similar services.
- Personalized Greeting: Implement a 'personalized greeting' tool, displayed when the user visits the app for the first time, tailored to Swamiji's last known location, that might incorporate interesting details (eg historical data or current events).

## Style Guidelines:

- Primary color: A calm and spiritual light purple (#A78BFA) to evoke a sense of peace and reverence, inspired by themes of spirituality and guidance.
- Background color: Very light grayish-purple (#F5F3FF), creating a soft and unobtrusive backdrop.
- Accent color: A gentle light blue (#818CF8), used for interactive elements and highlights, drawing from analogous color schemes to enhance usability and visual interest without overwhelming the serene aesthetic.
- Clean and readable sans-serif font.
- Responsive design that adapts to various screen sizes, ensuring a seamless experience on both desktop and mobile devices.
- Simple, intuitive icons for navigation and key features, ensuring ease of use.