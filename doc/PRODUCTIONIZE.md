# Productionize Masked Banana

Generate a production plan below with the goal to host this on Firebase App Hosting.

---

## Production Plan: Firebase App Hosting

Firebase App Hosting automatically builds and deploys modern web apps directly from a GitHub repository. Follow this plan to productionize the Masked Banana application.

### Phase 1: Application Readiness
1. **Types and Linting**: Ensure the codebase is completely free of TypeScript errors. Run `npm run build` locally to confirm a clean build.
2. **Chunk Splitting**: Add manual chunking in `vite.config.ts` to split vendor dependencies (like `konva`, `jszip`, and `lucide-react`) from the main application code. This resolves the large chunk size warnings and improves cache performance.
3. **SPA Routing Preparation**: Since Masked Banana is a Single Page Application (SPA), ensure that any future client-side routes will correctly fall back to `index.html`. Firebase App Hosting handles basic static serving, but adding a `firebase.json` with a rewrite rule (`"source": "**", "destination": "/index.html"`) guarantees robust SPA behavior.

### Phase 2: Firebase Environment Setup
1. **Create Firebase Project**: Navigate to the Firebase Console and create a new project.
2. **Upgrade Billing**: Firebase App Hosting requires the project to be on the **Blaze (Pay-as-you-go)** billing plan.
3. **Enable App Hosting**: Select "App Hosting" from the Build menu in the Firebase Console and click "Get Started".

### Phase 3: GitHub Integration & Deployment
1. **Connect GitHub**: Follow the Firebase App Hosting wizard to authenticate your GitHub account and select the `masked-banana` repository.
2. **Configure Deployment Options**:
   - **Root directory**: `/` (since `package.json` is at the root).
   - **Branch**: Select your deployment branch (e.g., `main`).
3. **Rollout**: Click "Roll out". Firebase App Hosting will automatically:
   - Detect it as a Node.js/Vite project.
   - Run `npm install`.
   - Run `npm run build`.
   - Serve the output `dist/` directory globally on Google's CDN.

### Phase 4: Security & Secrets (BYOK)
- **Current BYOK Model**: Because users supply their own API key via the browser UI, there are no backend secrets required to run the application securely.
- **Future Managed Key**: If transitioning to a unified API key for all users, **do not** hardcode it. Instead, store the Gemini key in Google Cloud Secret Manager, expose it to the App Hosting service account, and proxy the API calls through a secure backend route.

### Phase 5: Post-Launch & Monitoring
- **Automated CI/CD**: Verify that pushing a new commit to the `main` branch automatically triggers a new isolated rollout in the Firebase App Hosting dashboard.
- **Custom Domain**: Connect a custom domain (e.g., `masked-banana.com`) in the App Hosting settings to replace the default `.apphosting.firebaseapp.com` URL. Firebase will handle the SSL certificate provisioning automatically.