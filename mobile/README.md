# LogiFlow Mobile (Flutter)

Android-first Flutter client for **all four roles** (Customer, Driver, Warehouse, Admin).
It talks to the **same ASP.NET Core API** as the web app (JWT auth) — no separate backend.

## Prerequisites (one-time)
```bash
brew install --cask flutter      # or install the Flutter SDK + add to PATH
flutter doctor                   # install what it flags (Android Studio SDK, etc.)
```

## Run it
```bash
cd mobile
flutter create .                 # generates android/ + ios/ platform folders (keeps lib/ + pubspec)
flutter pub get
flutter run                      # pick an Android emulator / device
```
**API host:** the app auto-targets `http://10.0.2.2:5000/api` on the Android emulator and
`http://localhost:5000/api` otherwise. For a **real device**, pass your machine's LAN IP:
```bash
flutter run --dart-define=API_HOST=192.168.1.50 --dart-define=API_PORT=5000
```
(Backend must be running; see the repo root. On macOS, port 5000 clashes with AirPlay Receiver — turn it off or use another port via `API_PORT`.)

## Folder structure (feature-first)
```
lib/
  main.dart                      # entry → ProviderScope → LogiFlowApp
  app.dart                       # MaterialApp.router (theme + router)
  core/                          # ── SHARED — everyone uses, don't fork ──
    config/api_config.dart       # base URL per platform
    network/dio_provider.dart    # one Dio: attaches JWT + signs out on 401
    storage/token_store.dart     # secure JWT storage
    auth/                        # session_controller, auth_user, user_role
    router/app_router.dart       # role-based routing (edit to add your routes)
    theme/app_theme.dart         # brand theme
    widgets/role_scaffold.dart   # shared screen shell
  features/
    auth/                        # SHARED — login + register (reference pattern)
    customer/                    # Customer owner
    driver/                      # Driver owner
    warehouse/                   # Warehouse owner
    admin/                       # Admin owner
```
Each feature follows: **`data/`** (repository + API calls + models) and **`presentation/`**
(pages + Riverpod controllers). `features/auth/` is the fully-working reference — copy its pattern.

## Who owns what
| Member | Folder | Screens (see the home-page TODO list) |
|---|---|---|
| Customer | `features/customer/` | order + checkout, my orders, order tracking |
| Driver | `features/driver/` | my runs, run detail + map, arrive/deliver, POD |
| Warehouse | `features/warehouse/` | warehouses/zones, intake, inventory, dispatch |
| Admin | `features/admin/` | approvals, agent monitor, shipments, fleet, users |

## Conventions (so integration is painless)
- **State:** Riverpod. Expose providers from `data/` (repositories) and `presentation/` (controllers).
- **HTTP:** always go through `ref.read(dioProvider)` — never create your own Dio (the JWT + 401 handling live there). Paths are relative to `/api`, e.g. `_dio.get('/shipments/mine')`.
- **Auth:** read the signed-in user via `ref.watch(sessionControllerProvider).user`; sign out via `...notifier.signOut()`.
- **Routing:** add your screens as sub-routes under your role's route in `core/router/app_router.dart` (e.g. `/driver/run/:id`). The redirect already sends each role to its home after login.
- **Models:** put DTOs in your feature's `data/models/`. The repositories currently return raw JSON (`Map`/`List`) with `// TODO: map to models` — replace with typed models as you build.
- Each role's repository (`features/<role>/data/<role>_repository.dart`) is **pre-wired to the backend endpoints** you need — start there.

## Dependencies
Core (already added): `flutter_riverpod`, `dio`, `flutter_secure_storage`, `go_router`, `intl`.
Driver-only (commented in `pubspec.yaml`, enable when needed): `mobile_scanner` (QR), `image_picker` (POD photo), `geolocator` (GPS), `flutter_map`+`latlong2` (map). Each needs Android permissions in `AndroidManifest.xml`.
