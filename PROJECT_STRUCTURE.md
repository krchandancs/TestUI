# pathscribe AI - Project Structure

## Directory Layout

```
pathscribe-ai/
├── public/                          # Static assets (create this folder)
│   ├── pathscribe-logo.svg         # Main logo (light theme)
│   ├── pathscribe-logo.svg    # Dark theme logo
│   └── pathscribe-icon.svg         # Favicon
│
├── src/                             # Source code (create this folder)
│   ├── App.tsx                     # Main app with routing ✓
│   ├── AuthContext.tsx             # Auth state management ✓
│   ├── Login.tsx                   # Login page ✓
│   ├── Home.tsx                    # Dashboard page ✓
│   ├── Worklist.tsx                # Case worklist ✓
│   ├── Maintenance.tsx             # Admin dashboard ✓
│   ├── main.tsx                    # Entry point ✓
│   └── index.css                   # Global styles ✓
│
├── index.html                       # HTML entry point ✓
├── package.json                     # Dependencies ✓
├── tsconfig.json                    # TypeScript config ✓
├── tsconfig.node.json              # Node TypeScript config ✓
├── vite.config.ts                  # Vite config ✓
└── README.md                        # Documentation ✓
```

## Setup Instructions

### 1. Create Project Directory
```bash
mkdir pathscribe-ai
cd pathscribe-ai
```

### 2. Create Required Folders
```bash
mkdir src
mkdir public
```

### 3. Copy Files to Correct Locations

**Root level files:**
- index.html
- package.json
- tsconfig.json
- tsconfig.node.json
- vite.config.ts
- README.md

**Into src/ folder:**
- App.tsx
- AuthContext.tsx
- Login.tsx
- Home.tsx
- Worklist.tsx
- Maintenance.tsx
- main.tsx
- index.css

**Into public/ folder:**
- (You'll need to create/add logo SVG files)

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## Demo Credentials
Contact the team lead for access credentials.

## Missing Assets

You'll need to create or obtain these SVG files for the `/public` folder:

1. **pathscribe-logo.svg** - Main logo for light theme
2. **pathscribe-logo.svg** - Logo for dark theme
3. **pathscribe-icon.svg** - Favicon

The app will work without these but the logos won't display correctly. The code currently has inline SVG logos that will work as fallbacks.

## File Dependencies

### Dependencies Between Files:
```
index.html
  └── src/main.tsx
      └── src/App.tsx
          ├── src/AuthContext.tsx
          ├── src/Login.tsx (requires AuthContext)
          ├── src/Home.tsx (requires AuthContext)
          ├── src/Worklist.tsx (requires AuthContext)
          └── src/Maintenance.tsx (requires AuthContext)
```

All pages depend on:
- React Router for navigation
- AuthContext for authentication state
- SunCalc (Login only) for geolocation-based theming

## Key Features by Page

### Login.tsx
- Theme switching (4 modes)
- Email/password authentication
- SSO buttons (UI only)
- Animated background
- Modal about box

### Home.tsx
- Metrics dashboard
- Recent cases list
- Quick actions sidebar
- Role-based navigation

### Worklist.tsx
- Filterable case table
- AI status indicators
- Confidence scores
- Priority badges

### Maintenance.tsx
- Admin-only access
- Performance metrics
- Field accuracy tracking
- System alerts
- Activity log

## Color Scheme

The entire app uses a consistent cyan/teal color palette:

- **Primary**: #0891B2 (Cyan)
- **Primary Dark**: #0E7490
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Yellow)
- **Error**: #ef4444 (Red)
- **Text**: #1e293b (Dark slate)
- **Secondary Text**: #64748b (Slate)

## Development Notes

1. All components use TypeScript for type safety
2. Inline styles used throughout (no CSS modules)
3. No external UI library (pure React)
4. Mock authentication for demo purposes
5. Responsive design principles applied
6. Professional medical software aesthetic

## Troubleshooting

**"Cannot find module" errors:**
- Make sure all files are in the correct folders (src/ vs root)
- Run `npm install` to install dependencies

**Theme icons not showing:**
- The app uses emoji fallbacks (☀️ 🌙 💻 🕐)
- You can replace these with SVG icons if needed

**Navigation issues:**
- Check React Router is installed: `npm list react-router-dom`
- Clear browser cache and refresh

## Next Steps

After setup:
1. Test all pages work correctly
2. Verify authentication flow
3. Check theme switching
4. Review responsive design
5. Add any custom branding/assets
6. Configure for your backend API (when ready)
