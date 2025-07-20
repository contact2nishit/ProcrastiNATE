# ProcrastiNATE #
ProcrastiNATE - An app to stop people from procrastinating

# Dev env setup #

`npm i`
`cd ./src`
`python -m venv venv`
`source venv/bin/activate`
`pip install -r requirements.txt`
1. Set a secret key in src/.env (`SECRET_KEY`)
2. Set postgres DB URL (`DATABASE_URL`)
3. Set Google Redirect URI (`GOOGLE_REDIRECT_URI`)
4. Set Expo Dev URL (`EXPO_DEV_URL`)
5. Get client_secret.json and ensure it is in the `src` directory.

# App startup #

`npx expo start --tunnel`
`fastapi run src/app.py`

# EAS Build & Deep Linking (Google OAuth) #

## Why do I need this? ##
If you want to use "Sign in with Google" or any authentication that opens a browser and then returns to your app, you need something called **deep linking**.  
A "deep link" is a special URL (like `procrastinate://auth?token=...`) that lets your app open itself and receive data (like a login token) from the browser.  
**Expo Go** (the app you download from the App Store) does **not** support custom deep links for your app.  
To use Google login or any OAuth flow, you must build a **development build** (a custom version of Expo Go just for your app) using EAS Build.

## How to do it (no Mac required) ##

1. **Install EAS CLI**  
   ```
   npm install -g eas-cli
   ```

2. **Configure EAS Build**  
   In your project root:
   ```
   eas build:configure
   ```
   This creates an `eas.json` file.

3. **Build a development client for iOS**  
   ```
   eas build --profile development --platform ios
   ```
   - This builds your app in the cloud (no Mac needed).
   - When finished, Expo will give you a link and QR code.

4. **Install the dev client on your iPhone**  
   - Open the link in **Safari** on your iPhone.
   - Follow the instructions to install via TestFlight (Apple's beta app system).
   - You may need to log in with your Apple ID and register your device (Expo will guide you).

5. **Run your app with the dev client**  
   - Start your project as usual:
     ```
     npx expo start --dev-client
     ```
   - Open the dev client app on your iPhone and scan the QR code from the Expo CLI.
   - Your app will now support deep linking and Google login.

## Why is this necessary? ##
- **Expo Go** (from the App Store) is a generic app and cannot register custom URL schemes for your app.
- **Deep linking** is required for OAuth (Google login) to securely return to your app after authentication.
- **Development builds** (via EAS) are like a custom Expo Go just for your app, with your deep link scheme enabled.

**If you skip these steps, Google login and similar features will NOT work on iOS.**

For more info, see:
- [Expo: Using Custom Dev Clients](https://docs.expo.dev/clients/installation/)
- [Expo: Deep Linking & Auth](https://docs.expo.dev/guides/authentication/#redirecting-back-to-your-app)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)