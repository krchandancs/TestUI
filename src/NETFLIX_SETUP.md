# Netflix-Style Home Page - Setup Instructions

## ✅ Files Updated

I've updated your Home page to a Netflix-style card navigation interface!

### Updated Files:
1. **Home.tsx** - Complete redesign with 5 navigation cards
2. **Maintenance.tsx** - Now accepts tab parameter from navigation

---

## 📸 **IMPORTANT: Add Background Image**

You uploaded `main_background.jpg` (the microscope image). You need to place it in your project:

### Steps:

1. **Save the background image** you uploaded earlier as `main_background.jpg`

2. **Put it in the `public` folder** of your project:
   ```
   pathscribe-ai/
   ├── public/
   │   └── main_background.jpg  ← PUT IT HERE
   ├── src/
   └── ...
   ```

3. **In VS Code:**
   - Right-click on the `public` folder
   - Click "Reveal in File Explorer" (Windows) or "Reveal in Finder" (Mac)
   - Copy `main_background.jpg` into that folder

---

## 🎨 What Changed

### New Home Page Features:
- ✅ **Netflix-style card grid** with 5 large tiles
- ✅ **Microscope background** with dark overlay
- ✅ **Hover animations** - cards lift and scale on hover
- ✅ **Gradient accents** - each card has a colored top bar
- ✅ **Direct navigation** - click any card to jump to that section
- ✅ **Glass morphism** - frosted glass effect on cards and nav

### Navigation Flow:
- **Worklist** → Opens Worklist page
- **Performance** → Opens Maintenance on Performance tab
- **Models** → Opens Maintenance on Models tab
- **Configuration** → Opens Maintenance on Configuration tab
- **Logs** → Opens Maintenance on Audit Logs tab

---

## 🚀 How to Test

1. **Make sure `main_background.jpg` is in `/public` folder**

2. **In VS Code terminal**, if the app is still running:
   - It should auto-reload
   - If not, press `Ctrl+C` to stop, then `npm run dev` again

3. **In your browser**, refresh `localhost:5173`

4. **You should see:**
   - Dark background with microscope image
   - White PathScribe AI logo at top
   - Large welcome text
   - 5 colorful cards in a grid
   - Cards animate when you hover over them

5. **Test clicking cards:**
   - Click "Performance" → Should open Maintenance on Performance tab
   - Click "Worklist" → Should open Worklist page
   - Etc.

---

## 🎨 Card Colors

Each card has a unique gradient:
- 📋 **Worklist** - Cyan (matches brand)
- 📊 **Performance** - Green
- 🤖 **Models** - Purple
- ⚙️ **Configuration** - Orange
- 📝 **Logs** - Red

---

## 🔧 Customization

Want to change something? Edit `Home.tsx`:

**Change card titles/descriptions:**
```typescript
const cards: NavCard[] = [
  {
    title: 'Your Title',
    description: 'Your description',
    icon: '📋',
    // ...
  }
]
```

**Change colors:**
```typescript
gradient: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)'
```

**Adjust hover effect:**
```typescript
transform: hoveredCard === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'
```

---

## ✅ Checklist

- [ ] Background image (`main_background.jpg`) is in `/public` folder
- [ ] App is running (`npm run dev`)
- [ ] Browser shows new Netflix-style home page
- [ ] Cards animate on hover
- [ ] Clicking cards navigates correctly

---

**Enjoy your new Netflix-style interface!** 🎬
