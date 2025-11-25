# SYSTEM INSTRUCTION: ADHAM AGRITECH - PRODUCTION READY OVERHAUL

**AUTHORITY:** Senior Solutions Architect & Lead Developer.
**TOOLS:** Model Context Protocol (MCP), Deep Debugger, UI/UX Engine.
**TARGET:** adham-agritech.com (Full Codebase & Database Access).

---

## SECTION 1: CRITICAL DIAGNOSTICS via MCP (PRIORITY ZERO)
**Action:** Use Model Context Protocol (MCP) to scan the entire project structure.
1.  **Crash Analysis:** Investigate the specific "Client-side exception" causing the app to crash. Fix the concurrency issue preventing multiple users from logging in simultaneously.
2.  **Database Integrity:** Audit the Database Schema (PostgreSQL/Firebase). Ensure the relationship `User -> Farm -> Field` is correctly indexed and Foreign Keys are enforced.
    * **FIX:** Repair the "New User Registration" flow. Ensure when a new user signs up, they can immediately create a Farm and link Fields without errors.
3.  **Performance:** Optimize database queries to prevent timeout crashes when fetching data for large farms.

---

## SECTION 2: ESODA API INTEGRATION (REAL DATA)
**Action:** Replace all `Mock Data` / `Simulation Logic` with real-time EOSDA API integration.
1.  **Documentation Implementation:** Read and implement the full logic from standard EOSDA API documentation.
2.  **Data Fetching Service:** Create a robust service to fetch:
    * **NDVI** (Vegetation Health).
    * **NDRE/Chlorophyll** (Crop Nutrition).
    * **Soil Moisture** (Surface & Root zone).
    * **Weather Analytics.**
3.  **Tile Rendering:** Update the "Field Analysis" tiles to display this *real data*. If API limit is reached, fail gracefully (do not crash).

---

## SECTION 3: UI/UX & STRICT THEMING (VISUAL OVERHAUL)
**Action:** Enforce "Brand Identity" consistency.
1.  **Color Extraction:** Scan `tailwind.config.js` or global CSS files. Extract the EXACT Hex codes for:
    * `Matte Black` (Backgrounds).
    * `Vivid Green` (Accents/Buttons/Indicators).
2.  **Indicator Standardization:** Go to the **Fields Page**. Change ALL status indicators (Weak/Good/Critical) to match the custom Dark Theme:
    * Use the `Matte Black` container for all metrics.
    * Use the `Vivid Green` for text/icons.
    * **Remove** any default white/blue/grey colors that don't match the theme.
3.  **ESODA Tile Design:** Create a custom tile component that visualizes Soil Analysis (NPK, Moisture) using the extracted color palette.

---

## SECTION 4: AGENTIC AI & LOGIC (THE BRAIN)
**Action:** Connect the "Smart Assistants" to the new Data Layer.
1.  **Context Awareness:** The AI Assistant must now have "Read Access" to the fetched ESODA Satellite data and User Database.
    * *Scenario:* If a user asks "Why is my field yellow?", the AI must query the NDVI values from the database before answering.
2.  **Business Logic Refactoring:** Review the logic for "Irrigation Recommendations". Align it with global best practices (FAO standards), using the real Soil Moisture data from ESODA.

---

## SECTION 5: FINAL POLISH & DEPLOYMENT PREP
1.  **Translation Fixes:** Scan all `en.json` / `ar.json` files. Fix missing keys and ensure RTL (Right-to-Left) layout works perfectly for Arabic users without breaking the UI.
2.  **Error Handling:** Wrap all critical functions in `Try/Catch` blocks with proper logging.
3.  **Final Clean:** Remove unused code and console logs.

**EXECUTE THESE STEPS IN ORDER. REPORT STATUS AFTER EACH SECTION.**
