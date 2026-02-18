# Views Directory Structure

This directory contains all Vue components used as route views in the application. The views are organized by domain for better maintainability.

## Directory Structure

```
views/
├── auth/              # Authentication & account management views
│   ├── Login.vue              # User login page
│   ├── Register.vue           # User registration page
│   ├── Verify.vue             # Email verification page
│   ├── ForgotPassword.vue     # Password recovery request page
│   └── ResetPassword.vue      # Password reset page
│
├── users/             # User management views (admin only)
│   ├── Users.vue              # User list and management
│   ├── UserEdit.vue           # Edit user details
│   └── UserServices.vue       # User service records and hours
│
├── absences/          # Absence management views (admin only)
│   ├── Absences.vue           # Absence list and management
│   └── AbsenceTypes.vue       # Absence type configuration
│
├── hours/             # Time tracking views (admin only)
│   ├── Planning.vue           # Weekly planning view
│   ├── Heures.vue             # Hours overview and summary
│   └── ExportHours.vue        # Export hours to various formats
│
├── vehicles/          # Vehicle management views
│   ├── Vehicules.vue          # Vehicle list
│   └── VehiculeDetail.vue     # Vehicle details and history
│
├── maintenance/       # Maintenance management views
│   ├── Entretiens.vue         # Maintenance records list
│   ├── EntretiensVehicule.vue # Maintenance records for specific vehicle
│   └── TypesEntretien.vue     # Maintenance type configuration
│
├── acomptes/          # Payroll advance management (admin only)
│   └── Acomptes.vue           # Acomptes list and management
│
├── signatures/        # Signature management (admin only)
│   └── Signatures.vue         # Digital signature management
│
└── common/            # Common/utility views
    ├── Home.vue               # Application home page
    ├── Notifications.vue      # Notification center
    ├── ServicesMonitoring.vue # Service monitoring dashboard (admin)
    ├── TestDesign.vue         # Design system testing page
    ├── Unauthorized.vue       # 403 unauthorized access page
    └── NotFound.vue           # 404 not found page
```

## Naming Conventions

- **File Names**: PascalCase (e.g., `Users.vue`, `VehiculeDetail.vue`)
- **Component Names**: Match the file name
- **Route Names**: Match the component name (defined in [router/index.ts](../router/index.ts))

## Access Control

Views are protected by route guards defined in [router/index.ts](../router/index.ts):

- **Public**: Login, Register, Verify, ForgotPassword, ResetPassword, Unauthorized, NotFound
- **Authenticated**: All other views require authentication
- **Admin Only**: Users, Absences, AbsenceTypes, Planning, Heures, ExportHours, Acomptes, Signatures, ServicesMonitoring
- **Authenticated (All Roles)**: Home, Notifications, Vehicules, VehiculeDetail, TypesEntretien, Entretiens, EntretiensVehicule

## Adding New Views

When adding a new view:

1. Place it in the appropriate domain folder (or create a new one if needed)
2. Follow the PascalCase naming convention
3. Add the route in [router/index.ts](../router/index.ts) under the appropriate section
4. Update this README with the new view
5. Use the application's design system components from `@/components/AV*.vue`

## Related Files

- **Router Configuration**: [src/router/index.ts](../router/index.ts)
- **Navigation Components**: [src/components/AppNavbar.vue](../components/AppNavbar.vue)
- **Design System**: [src/components/AV*.vue](../components/)
- **Auth Store**: [src/stores/auth.ts](../stores/auth.ts)
