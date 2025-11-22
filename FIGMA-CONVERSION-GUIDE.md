# Step-by-Step Guide: Convert Your React App to Figma Using html.to.design

## Prerequisites

- Figma account (free tier works)
- Your React app running locally
- Chrome or Firefox browser

---

## Step 1: Install Browser Extension + Figma Plugin

### Part A: Install Chrome Extension (Required for localhost)

1. **Open Chrome Web Store**
   - Go to: https://chrome.google.com/webstore
2. **Search for "html.to.design"**
   - Find the official extension by "html.to.design"
3. **Click "Add to Chrome"** → **"Add extension"**

4. **Pin the extension:**
   - Click the puzzle piece icon (extensions) in Chrome toolbar
   - Find "html.to.design" and click the pin icon
5. **Keep Chrome open** with the extension installed

### Part B: Install Figma Plugin

1. **Open Figma** (desktop app or web at figma.com)
2. **Open or create a new file** where you want your designs
3. **Access Plugins:**
   - Click on the menu icon (top-left) or right-click on canvas
   - Select **Plugins** → **Browse plugins in Community**
4. **Search for "html.to.design"**
   - Type in the search bar: `html.to.design`
   - Find the official plugin by "html.to.design"
5. **Click "Install"** or "Try it out"
6. **Close the plugin window** (we'll use it in Step 3)

---

## Step 2: Run Your React App Locally

1. **Open Terminal** in VS Code (`` Ctrl+` ``)

2. **Navigate to frontend directory:**

   ```powershell
   cd frontend
   ```

3. **Install dependencies** (if not already done):

   ```powershell
   npm install
   ```

4. **Start the development server:**

   ```powershell
   npm run dev
   ```

5. **Note the localhost URL** (usually shown in terminal):

   ```
   ➜  Local:   http://localhost:5173/
   ```

   **Note:** If your URL is different (e.g., `http://localhost:8080`), use that instead.

6. **Open the URL in Chrome browser** (must use Chrome with the extension)

   - Navigate to the page you want to convert
   - Make sure the page is fully loaded

7. **Keep the dev server running** (don't close the terminal)

---

## Step 3: Convert Pages to Figma (Using Browser Extension Method)

### For Each Page (Dashboard, Stats, Settings, Reminders, etc.):

**Method 1: Direct from Chrome Extension (Easiest)**

1. **In Chrome, navigate to the page** you want to convert

   - Example: `http://localhost:8080` or `http://localhost:5173/dashboard`
   - Make sure the page is fully loaded

2. **Click the html.to.design extension icon** in Chrome toolbar

   - It's the extension you pinned in Step 1

3. **Click "Send to Figma"** or "Export to Figma" button

4. **The extension will:**

   - Capture the current page
   - Send it to Figma automatically
   - Open Figma with the imported design

5. **In Figma, review the imported design:**

   - All HTML elements become Figma frames/groups
   - Text, colors, spacing should be preserved

6. **Rename the imported frame:**
   - Select the top-level frame
   - Rename it (e.g., "Dashboard - Desktop")

**Method 2: From Figma Plugin (Alternative)**

1. **Navigate to the page** in Chrome browser

   - Example: `http://localhost:8080/dashboard`

2. **Copy the full URL** from the browser address bar

3. **Go to Figma**

4. **Run the plugin:**

   - Right-click on canvas → **Plugins** → **html.to.design**
   - Or use keyboard shortcut: **Ctrl+Alt+P** (Windows) or **Cmd+Option+P** (Mac)
   - Search for "html.to.design" and click it

5. **Paste your localhost URL** into the plugin input field

   - Example: `http://localhost:8080/dashboard`
   - The Chrome extension must be running for this to work

6. **Click "Import"** or "Fetch URL"

7. **Wait for conversion** (usually 10-30 seconds)

   - The plugin will capture the page and convert it to Figma layers

8. **Review the imported design:**

   - All HTML elements become Figma frames/groups
   - Text, colors, spacing should be preserved
   - Images may need re-linking

9. **Rename the imported frame:**

   - Select the top-level frame
   - Rename it (e.g., "Dashboard - Desktop")

10. **Repeat for each page:**
    - Dashboard: `http://localhost:8080/` (or your localhost URL)
    - Stats: `http://localhost:8080/stats`
    - Settings: `http://localhost:8080/settings`
    - Reminders: `http://localhost:8080/reminders`
    - Exercises: `http://localhost:8080/exercises`
    - Templates: `http://localhost:8080/templates`

---

## Step 4: Convert Mobile Versions

1. **In your browser, open DevTools:**

   - Press **F12** or **Ctrl+Shift+I**

2. **Enable Device Toolbar:**

   - Click the phone/tablet icon (top-left of DevTools)
   - Or press **Ctrl+Shift+M**

3. **Select a mobile device:**

   - Choose "iPhone 12 Pro" or "Pixel 5" from dropdown
   - Or set custom dimensions: **375px width**

4. **Navigate to each page** and repeat Step 3:

   - Copy URL → Import to Figma → Rename as "Page Name - Mobile"

5. **Organize in Figma:**
   - Create a "Desktop" frame/section
   - Create a "Mobile" frame/section
   - Drag imported screens into respective sections

---

## Step 5: Clean Up and Organize

### 5.1 Create Pages in Figma:

1. Click **"+"** next to "Page 1" in left sidebar
2. Create pages: "Screens", "Components", "Design System"

### 5.2 Extract Reusable Components:

1. Select repeated elements (buttons, cards, inputs)
2. Right-click → **Create Component** (or **Ctrl+Alt+K**)
3. Move components to "Components" page

### 5.3 Create Color Styles:

1. Select an element with your primary color
2. Click the color fill in the right panel
3. Click the **4-dot icon** → **"+"** → Name it "Primary"
4. Repeat for all colors from your design system

### 5.4 Create Text Styles:

1. Select a heading
2. Click "Text" in right panel
3. Click the **4-dot icon** → **"+"** → Name it "Heading/H1"
4. Repeat for all text sizes

---

## Step 6: Test Responsive Behavior

1. **Select a frame** (e.g., Dashboard - Desktop)
2. **Resize it** by dragging corners
3. **Check if elements break** or maintain layout
4. **Fix constraints:**
   - Select elements
   - In right panel → **Constraints**
   - Set to "Left & Right" for full width, "Center" for centered, etc.

---

## Step 7: Add Interactions (Optional)

1. **Switch to Prototype mode** (top-right corner)
2. **Select a button** (e.g., "Log Workout")
3. **Drag the blue handle** to the target screen
4. **Set interaction:**
   - Trigger: "On Click"
   - Action: "Navigate to"
   - Destination: Select the target screen
   - Animation: "Smart Animate" or "Instant"

---

## Troubleshooting

### Issue: "Please use browser extension for local URLs" error

**Solution:**

- **Install the Chrome extension** (Step 1, Part A) - this is REQUIRED for localhost
- Make sure you're using **Chrome browser** (not Firefox or Edge)
- The extension must be **installed and enabled**
- Try using the extension icon directly instead of the Figma plugin
- Restart Chrome after installing the extension

### Issue: Plugin can't access localhost

**Solution:**

- Verify Chrome extension is installed and enabled
- Make sure dev server is running (`npm run dev` in terminal)
- Try using `http://127.0.0.1:8080/` instead of `http://localhost:8080/`
- Check if the page loads in Chrome before trying to export
- Use the Chrome extension icon (Method 1) instead of Figma plugin

### Issue: Styling looks different

**Solution:**

- Ensure you're logged in to the app (some routes require auth)
- Try refreshing the page in browser before exporting
- Clear browser cache and reload
- Make sure all CSS/styles are loaded (check browser console for errors)

### Issue: Plugin errors or freezes

**Solution:**

- Refresh Figma (Ctrl+R)
- Try importing a smaller section (single component)
- Use "Inspect" mode to manually copy styles

### Issue: Images not loading

**Solution:**

- Replace image URLs with actual assets
- Upload images to Figma manually
- Use placeholder images from Unsplash or Figma plugins

### Issue: Fonts look wrong

**Solution:**

- Install "Inter" font on your computer (download from fonts.google.com)
- In Figma: Menu → Preferences → Missing Fonts → Replace with Inter

---

## Alternative: Manual Screenshot Method (If Plugin Fails)

1. **Take screenshots** of each page (full page screenshot)
2. **Import to Figma:**
   - Drag image files into Figma canvas
3. **Trace over screenshots:**
   - Use screenshots as reference
   - Recreate using Figma shapes, text, components
4. **Delete screenshots** once done

---

## Pro Tips

✅ **Import in order:** Start with simplest page first (Settings)
✅ **Create a style guide page:** Document all colors, typography, spacing
✅ **Use Auto Layout:** Convert static frames to Auto Layout for flexibility
✅ **Name layers properly:** Makes it easier to find elements later
✅ **Create variants:** For buttons (primary, secondary, outline, etc.)
✅ **Share with team:** Click "Share" button → Add teammates

---

## Next Steps After Import

1. **Extract design tokens** to a separate "Design System" page
2. **Create component library** with all reusable elements
3. **Add documentation** (how to use components)
4. **Set up variables** (Figma's new feature for colors, spacing)
5. **Create prototypes** linking all screens together
6. **Share with developers** or teammates

---

## Estimated Time

- Plugin installation: **2 minutes**
- Per page import: **2-5 minutes**
- Total for 6 pages (desktop + mobile): **30-60 minutes**
- Cleanup and organization: **30-60 minutes**
- **Total: 1-2 hours** for complete conversion

---

## Need Help?

If you encounter issues:

1. Check the terminal for any React errors
2. Verify the page loads correctly in browser
3. Try a different browser (Chrome recommended)
4. Restart Figma and try again
5. Ask me specific questions about any step!

---

**You're now ready to convert your React app to Figma! Start with Step 1. 🚀**
