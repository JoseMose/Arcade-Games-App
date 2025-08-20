# Getting Started with Create React App

## Firebase / Deployment Notes

### Toolchain Versions
- Use an LTS Node version (e.g. Node 20) for Firebase deploys. Deploying RTDB rules failed under Node 23 with newer firebase-tools (rules body not sent).
- Working combo verified: firebase-tools 12.9.1 + Node 23 (older CLI) OR latest firebase-tools + Node 20.

### Realtime Database
- Project does NOT use Realtime Database; configuration removed from `firebase.json` and `databaseURL` removed from `src/firebase.js` to avoid deploy noise.
- If you later add RTDB usage, reintroduce a minimal rules file and config.

### Firestore Leaderboards
Collections used:
- `leaderboard2048` (score only)
- `leaderboardEnemyGame` (score only)
- `leaderboardFlappy` (name + score)

Security rules (see `firestore.rules`):
- Public read of leaderboards.
- Restricted create with field validation & size/number limits.
- No client update/delete (cleanup should be a backend process / Cloud Function; current client-side delete logic may fail once stricter auth is enforced).

### Hardening Suggestions
- Replace the temporary date gate (currently year 2100) with authenticated logic (e.g. require auth, or signed callable Cloud Function) before production.
- Move leaderboard trimming (deleting extra docs) to a scheduled Cloud Function with Admin SDK so client cannot delete.

### Deploy Commands (examples)
```
# Use Node 20 (if using fnm or nvm)
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only database
```

### Known Issue (Documented)
Under Node 23 + newer firebase-tools a regression caused RTDB rules uploads to send only `{dryRun:true}` leading to `Expected 'rules' property` errors. Downgrading the CLI or using Node 20 resolved it.

## Firebase Config
The placeholder values in `src/firebase.js` (apiKey, appId) should be replaced with your actual config. Avoid committing secrets beyond the standard public web Firebase config.


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
