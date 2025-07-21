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
`cd ./src`
`uvicorn app:app --host=0.0.0.0 --port=8000`

Ensure you cd into src
