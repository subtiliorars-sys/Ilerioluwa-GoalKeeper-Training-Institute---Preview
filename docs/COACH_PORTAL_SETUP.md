# Coach portal setup — Firebase

The coach portal (`admin.html`) uses **Firebase Auth** (email/password), **Firestore**
(`coachRoles`, `coachInvites`, `photos`), and **Storage** (`photos/`).

## One-time Firebase Console steps

1. Open [Firebase Console](https://console.firebase.google.com/) → project
   **ilerioluwa-goal-keeper-train**.
2. **Authentication → Sign-in method → Email/Password** → Enable.
3. **Authentication → Settings → Authorized domains** — add:
   - `ilerioluwa-goalkeeper.pages.dev`
   - `subtiliorars-sys.github.io`
   - Any custom domain you attach later.
4. **Firestore** — create database (production mode), then deploy rules from this repo:
   ```bash
   cd Ilerioluwa-GoalKeeper-Training-Institute---Preview
   firebase deploy --only firestore:rules,storage --project ilerioluwa-goal-keeper-train
   ```
   (Requires Firebase CLI logged in once on a trusted machine.)

## Bootstrap the first head coach

The first admin cannot self-invite. Create them manually:

1. **Authentication → Users → Add user** — head coach email + temporary password.
2. Copy the new user's **UID**.
3. **Firestore → Start collection** `coachRoles` → document ID = that UID:
   ```json
   {
     "email": "coach@example.com",
     "displayName": "Head Coach",
     "role": "admin",
     "status": "active",
     "createdAt": "<server timestamp>"
   }
   ```
4. Coach signs in at `/admin.html`, then uses **Team access → Invite a coach** for staff.

## Day-to-day flow

| Who | Action |
|-----|--------|
| Head coach (admin) | Sign in → **Team access** → invite email + role |
| New coach | Open portal → **Activate account** → set password |
| Any active coach | **Upload photo** → appears in gallery via Firestore |

## Roles

| Role | Upload photos | Invite / manage coaches |
|------|---------------|-------------------------|
| `coach` | Yes | No |
| `admin` | Yes | Yes |

## Security rules

- `firebase/firestore.rules` — gallery writes require active coach; invites admin-only.
- `firebase/storage.rules` — image uploads only, max 8 MB.

After changing rules, redeploy with `firebase deploy --only firestore:rules,storage`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Email or password incorrect" | Reset password tab, or verify user exists in Auth |
| "Access not authorized" | Add `coachRoles` doc or send invite + Activate account |
| Upload fails permission denied | Deploy Storage + Firestore rules; confirm coach `status: active` |
| Auth domain error | Add your site hostname to Authorized domains |
