# 🚀 Quick Start Guide - Bus Management System

## 📋 Prerequisites

Ensure you have the following dependencies installed:

```bash
npm install react axios framer-motion tailwindcss
```

## 🎯 Integration Steps

### Step 1: Import the Component

```jsx
// In your main App.jsx or routing file
import Bus from './bus-managementt/Bus';

function App() {
  return (
    <div>
      <Bus />
    </div>
  );
}
```

### Step 2: Configure API Endpoints

The component expects these endpoints to be available:

```javascript
// Backend API Base URL
const API_BASE = "http://localhost:5000/api/bus";

// Required Endpoints:
// 1. GET  /get-all-buses
// 2. POST /bus-create
// 3. DELETE /delete-bus/:id
```

### Step 3: Set Up Authentication

Ensure JWT token is stored in localStorage:

```javascript
// After successful login
localStorage.setItem("token", "your-jwt-token");
```

## 🎨 Styling Requirements

The component uses Tailwind CSS. Ensure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors are already included in Tailwind v4
      },
    },
  },
  plugins: [],
}
```

## 📱 Usage Examples

### Basic Usage

```jsx
import Bus from './bus-managementt/Bus';

export default function BusManagementPage() {
  return <Bus />;
}
```

### With Layout Wrapper

```jsx
import DashboardLayout from './components/layouts/DashboardLayout';
import Bus from './bus-managementt/Bus';

export default function BusManagementPage() {
  return (
    <DashboardLayout>
      <Bus />
    </DashboardLayout>
  );
}
```

### With React Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Bus from './bus-managementt/Bus';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/buses" element={<Bus />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🔧 Configuration Options

### Customize API Base URL

Edit the API calls in `Bus.jsx`:

```javascript
// Change from:
const response = await axios.get("http://localhost:5000/api/bus/get-all-buses", {

// To your API:
const response = await axios.get("https://your-api.com/api/bus/get-all-buses", {
```

### Customize Colors

Update gradient classes throughout components:

```jsx
// Example: Change primary color
className="bg-gradient-to-r from-purple-600 to-pink-600"
```

## 🎯 Features Checklist

After integration, verify these features work:

- [ ] Page loads with statistics cards
- [ ] Search functionality works
- [ ] Filters can be applied and cleared
- [ ] "Add New Bus" button opens modal
- [ ] Image upload (drag & drop and click) works
- [ ] Form validation displays errors
- [ ] Bus cards display correctly
- [ ] "View Details" opens drawer
- [ ] "Edit" opens modal with pre-filled data
- [ ] "Delete" shows confirmation modal
- [ ] Toast notifications appear
- [ ] Export CSV downloads file
- [ ] Refresh button reloads data
- [ ] Empty state shows when no buses
- [ ] Loading skeletons appear during fetch
- [ ] Responsive design works on mobile

## 🐛 Troubleshooting

### Issue: Components not rendering

**Solution**: Ensure all dependencies are installed:
```bash
npm install framer-motion axios
```

### Issue: Styles not applying

**Solution**: Verify Tailwind CSS is properly configured and imported in your main CSS file:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue: API calls failing

**Solution**: Check:
1. Backend server is running
2. CORS is enabled on backend
3. JWT token is valid and stored in localStorage
4. API endpoints match your backend routes

### Issue: Images not displaying

**Solution**: Verify:
1. Backend serves static files from `/uploads` directory
2. Image paths in database are correct
3. CORS allows image loading

### Issue: Animations not smooth

**Solution**: Ensure Framer Motion is properly installed:
```bash
npm install framer-motion@latest
```

## 📊 Testing the Component

### Test Data Structure

Use this sample data for testing:

```javascript
const testBus = {
  _id: "123456",
  busName: "University Express",
  busNumber: "BUS-001",
  busRegistrationNumber: "ABC-1234",
  busType: "Ac",
  busCapacity: 50,
  busStatus: "active",
  busPhoto: "uploads/bus/sample.jpg",
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Manual Testing Steps

1. **Load Page**: Verify statistics and bus list load
2. **Search**: Type in search box, verify filtering
3. **Filter**: Apply status/type/capacity filters
4. **Add Bus**: Click "Add New Bus", fill form, submit
5. **View Details**: Click on a bus card, verify drawer opens
6. **Edit Bus**: Click edit, modify data, save
7. **Delete Bus**: Click delete, confirm, verify removal
8. **Export**: Click export, verify CSV downloads
9. **Responsive**: Resize browser, verify layout adapts

## 🚀 Performance Tips

1. **Lazy Load Images**: Images load as needed
2. **Debounce Search**: Search waits for user to stop typing
3. **Memoize Components**: Use React.memo for heavy components
4. **Optimize Re-renders**: State updates are batched

## 📝 Common Customizations

### Change Animation Speed

```jsx
// In any component with motion.div
transition={{ duration: 0.3 }} // Adjust duration
```

### Modify Card Layout

```jsx
// In Bus.jsx, change grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
```

### Update Status Colors

```jsx
// In BusCard.jsx or other components
const statusColors = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  // Modify as needed
};
```

## 🎓 Learning Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Axios Docs](https://axios-http.com/docs/intro)

## 💡 Pro Tips

1. **Use Browser DevTools**: Inspect network calls and component state
2. **Check Console**: Look for error messages and warnings
3. **Test Edge Cases**: Empty states, long names, large images
4. **Mobile First**: Always test on mobile devices
5. **Accessibility**: Use keyboard navigation to test

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Verify API responses in Network tab
3. Ensure all dependencies are installed
4. Review the README.md for detailed documentation
5. Check that backend endpoints match expected format

## ✅ Production Checklist

Before deploying:

- [ ] All API endpoints use environment variables
- [ ] Error handling is comprehensive
- [ ] Loading states are implemented
- [ ] Images are optimized
- [ ] Responsive design tested on all devices
- [ ] Accessibility features verified
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Code is documented
- [ ] Tests are passing

---

**Ready to go!** 🎉 Your Bus Management System is now set up and ready to use.