# Frontend Setup and Installation Guide

## Prerequisites

Before setting up the frontend, ensure you have:
- **Node.js 16 or higher**
- **npm 8 or higher** (comes with Node.js)
- **Git** (optional)

## Installation Steps

### 1. Verify Node.js and npm Installation
```bash
node -v
npm -v
```

Should output Node.js 16+ and npm 8+

### 2. Navigate to Frontend Directory
```bash
cd bgv-application/frontend
```

### 3. Install Dependencies
```bash
npm install
```

This will install:
- React 18.2.0
- Vite 5.0.0
- Axios (HTTP client)
- React Router DOM
- All other dependencies listed in `package.json`

### 4. Run Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5173`

You should see:
```
VITE v5.0.0 ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── PmForm.jsx          # PM Role Form Component
│   │   └── AdminForm.jsx       # Admin Role Form Component
│   ├── services/
│   │   └── bgvService.js       # API Service Layer
│   ├── styles/
│   │   └── form.css            # Form Styles
│   ├── App.jsx                 # Main App Component
│   └── main.jsx                # React DOM Entry Point
├── public/                     # Static assets
├── index.html                  # HTML Template
├── package.json                # Dependencies and Scripts
├── vite.config.js             # Vite Configuration
└── .gitignore                 # Git ignore rules
```

## Available Scripts

### Development Mode
```bash
npm run dev
```
Starts the development server with hot module replacement (HMR)

### Build for Production
```bash
npm run build
```
Creates optimized production build in `dist/` folder

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

## Key Components

### PmForm Component (`src/components/PmForm.jsx`)
- Collects PM-specific form data
- 9 fields for PM role
- Form validation
- API integration for submission
- Error handling and success messages

### AdminForm Component (`src/components/AdminForm.jsx`)
- Collects both PM reference and admin-specific data
- 14 total fields
- Complete form validation
- Status management
- PMO team comments
- Onboarding type selection

### API Service (`src/services/bgvService.js`)
Provides methods for:
- `createRequest()` - Create new BGV request
- `updateRequest()` - Update existing request
- `getRequest()` - Fetch single request
- `getAllRequests()` - Fetch all requests
- `getRequestsByRole()` - Filter by role
- `getRequestsByStatus()` - Filter by status
- `deleteRequest()` - Delete a request

## Configuration

### Backend Connection
The frontend connects to backend at: `http://localhost:8080`

To change this, modify `src/services/bgvService.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/api/bgv-requests';
```

### Vite Configuration
Located in `vite.config.js`:
- Development server port: 5173
- Hot Module Replacement enabled
- React plugin configured

## Form Features

### PM Form
- **9 Input Fields** with real-time validation
- **Dropdown Selects** for Resource Type, Geo Region, Country
- **Number Inputs** for PS Number and RR Number
- **Error Messages** displayed inline
- **Submit and Reset** buttons
- **Success/Error Messages** feedback

### Admin Form
- **Inherits PM Fields** for context
- **4 Additional Admin Fields**:
  - Status dropdown
  - BGV Initiated By text field
  - PMO Comments textarea
  - Onboarding Type dropdown
  - Request Submitted Date picker
- **Comprehensive Validation**
- **Admin-specific Workflow**

## Styling

Global styles defined in `src/styles/form.css`:
- Responsive grid layout
- Consistent color scheme (blue #3498db)
- Form sections with clear hierarchy
- Error states and messages
- Button styles (Primary, Secondary, Success)
- Mobile-responsive design
- Tab navigation for form switching

## Form Validation

### Real-time Validation:
- Clears errors as user corrects input
- Displays errors inline below fields
- Validates on form submission
- Prevents submission if errors exist

### Validation Rules:
- **Text fields**: Non-empty strings
- **Number fields**: Valid positive numbers
- **Dropdowns**: Required selection
- **Date fields**: Cannot be in future
- **Decimal numbers**: Proper decimal format

## Connecting to Backend

1. **Ensure Backend is Running:**
```bash
# In another terminal
cd backend
mvn spring-boot:run
```

2. **Start Frontend:**
```bash
# In frontend directory
npm run dev
```

3. **Access Application:**
Open `http://localhost:5173` in your browser

4. **Test the Forms:**
   - Switch between PM and Admin tabs
   - Fill in the forms
   - Submit requests
   - Check console for API responses

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Issue: "npm command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: Port 5173 already in use
**Solution:** Kill the process or specify different port:
```bash
npm run dev -- --port 5174
```

### Issue: "Cannot find module" errors
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Backend connection errors
**Solution:** 
1. Verify backend is running on http://localhost:8080
2. Check CORS configuration in backend
3. Check network requests in browser DevTools (F12)
4. Verify API URL in `bgvService.js`

### Issue: Form not submitting
**Solution:**
1. Check browser console for errors (F12)
2. Verify all required fields are filled
3. Check network tab to see API response
4. Ensure backend is accepting requests

### Issue: Styling looks broken
**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Restart dev server: `npm run dev`

## Development Workflow

### Making Changes:
1. Edit any `.jsx` or `.css` file
2. Changes automatically reload in browser (HMR)
3. Fix any console errors
4. Test in both PM and Admin forms

### Adding New Fields:
1. Update form state in component
2. Add form group HTML
3. Add validation rule
4. Update API service if needed
5. Test submission

### Testing API Integration:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit form
4. Inspect API request and response
5. Check console for any errors

## Building for Production

### Create Production Build:
```bash
npm run build
```

Output files in `dist/` folder:
- Minified JavaScript
- Optimized CSS
- HTML template
- All assets bundled

### Deploy:
1. Upload `dist/` folder contents to web server
2. Configure backend URL for production environment
3. Update API_BASE_URL in build process (using env variables)

### Environment Variables:
Create `.env` file for different environments:
```
VITE_API_URL=http://localhost:8080
```

Then reference in code:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

## Performance Tips

- Production build is automatically minified
- Assets are bundled and optimized
- Code splitting handled by Vite
- CSS is purged of unused styles
- Image optimization available via plugins

## Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open `http://localhost:5173`
4. Make sure backend is running
5. Test the forms
6. Customize as needed

For backend setup, see [Backend Setup Guide](../backend/SETUP.md)
