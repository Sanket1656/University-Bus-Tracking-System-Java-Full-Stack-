# 🚌 Premium Bus Management System

A modern, enterprise-grade Bus Management interface for University Bus Tracking System built with React.js, Tailwind CSS, and Framer Motion.

## ✨ Features

### 🎨 Design & UI
- **Modern SaaS Dashboard** - Clean, minimal, and professional interface
- **Glassmorphism Effects** - Premium glass-like UI elements with soft shadows
- **Smooth Animations** - Framer Motion powered transitions and micro-interactions
- **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- **Accessibility Focused** - WCAG compliant with keyboard navigation support

### 📊 Statistics Dashboard
- Real-time bus statistics with animated counters
- Total Buses, Active, Inactive, and Maintenance counts
- Trend indicators showing percentage changes
- Color-coded status badges

### 🔍 Advanced Search & Filtering
- Real-time search by bus name, number, or registration
- Multi-filter support:
  - Status (Active, Inactive, Maintenance)
  - Bus Type (AC, Non-AC)
  - Capacity Range (Small, Medium, Large)
- Clear filters functionality
- Collapsible filter panel

### 🚍 Bus Management
- **Add New Bus** - Beautiful modal with drag-and-drop image upload
- **Edit Bus** - Update bus information seamlessly
- **Delete Bus** - Confirmation modal with warning details
- **View Details** - Sliding drawer with complete bus information
- **Bulk Operations** - Select and manage multiple buses

### 📋 Bus Cards
- Premium card design with hover effects
- Bus image with fallback illustration
- Status badges with animated pulse effect
- Quick action dropdown menu
- Capacity and type indicators

### 🎯 Empty State
- Engaging illustration with animations
- Clear call-to-action button
- Feature highlights for new users

### 🔔 Notifications
- Toast notifications for all actions
- Success, Error, Warning, and Info types
- Auto-dismiss with progress bar
- Smooth entrance and exit animations

### ⚡ Performance
- Skeleton loaders for better perceived performance
- Optimized re-renders
- Lazy loading support
- Efficient state management

### 📤 Export Functionality
- Export bus data to CSV
- Includes all filtered results
- Timestamped file names

## 🏗️ Project Structure

```
src/bus-managementt/
├── Bus.jsx                          # Main component
├── README.md                        # Documentation
└── components/
    ├── StatCard.jsx                 # Statistics card component
    ├── BusCard.jsx                  # Individual bus card
    ├── AddBusModal.jsx              # Add/Edit bus modal
    ├── BusDetailsDrawer.jsx         # Bus details side drawer
    ├── DeleteConfirmModal.jsx       # Delete confirmation modal
    ├── Toast.jsx                    # Toast notification component
    ├── SkeletonLoader.jsx           # Loading skeleton component
    └── EmptyState.jsx               # Empty state component
```

## 🎨 Color Palette

### Primary Colors
- **Indigo**: `#4F46E5` - Primary actions and highlights
- **Blue**: `#2563EB` - Secondary actions and accents

### Status Colors
- **Active**: `#10B981` (Emerald) - Green for active buses
- **Inactive**: `#6B7280` (Gray) - Gray for inactive buses
- **Maintenance**: `#F59E0B` (Amber) - Orange for maintenance
- **Error**: `#EF4444` (Red) - Red for errors and deletions

### Background
- **Light Gray**: `#F8FAFC` - Page background
- **White**: `#FFFFFF` - Card backgrounds
- **Gradients**: Subtle indigo to blue gradients

## 🚀 Usage

### Basic Implementation

```jsx
import Bus from './bus-managementt/Bus';

function App() {
  return <Bus />;
}
```

### API Integration

The component expects the following API endpoints:

```javascript
// Get all buses
GET http://localhost:5000/api/bus/get-all-buses
Headers: { Authorization: `Bearer ${token}` }

// Create new bus
POST http://localhost:5000/api/bus/bus-create
Headers: { Authorization: `Bearer ${token}` }
Body: FormData with bus details

// Delete bus
DELETE http://localhost:5000/api/bus/delete-bus/:id
Headers: { Authorization: `Bearer ${token}` }
```

### Expected Data Structure

```javascript
{
  _id: "string",
  busName: "string",
  busNumber: "string",
  busRegistrationNumber: "string",
  busType: "Ac" | "Non-ac",
  busCapacity: number,
  busStatus: "active" | "inactive" | "maintenance",
  busPhoto: "string", // path to image
  createdAt: "date",
  updatedAt: "date"
}
```

## 🎭 Component Props

### StatCard
```jsx
<StatCard
  title="Total Buses"
  value={50}
  icon="bus"
  color="indigo"
  trend="+12%"
/>
```

### BusCard
```jsx
<BusCard
  bus={busObject}
  onView={() => {}}
  onEdit={() => {}}
  onDelete={() => {}}
  index={0}
/>
```

### AddBusModal
```jsx
<AddBusModal
  isOpen={true}
  onClose={() => {}}
  onSubmit={(formData) => {}}
  editBus={busObject} // optional for edit mode
/>
```

### BusDetailsDrawer
```jsx
<BusDetailsDrawer
  isOpen={true}
  onClose={() => {}}
  bus={busObject}
/>
```

### DeleteConfirmModal
```jsx
<DeleteConfirmModal
  isOpen={true}
  onClose={() => {}}
  onConfirm={() => {}}
  busName="University Express"
/>
```

### Toast
```jsx
<Toast
  show={true}
  message="Bus added successfully!"
  type="success" // success | error | warning | info
  onClose={() => {}}
/>
```

## 🔧 Dependencies

```json
{
  "react": "^19.2.4",
  "axios": "^1.15.0",
  "framer-motion": "^12.39.0",
  "tailwindcss": "^4.2.4"
}
```

## 🎯 Key Features Implementation

### 1. Drag & Drop Image Upload
The AddBusModal component supports both click-to-upload and drag-and-drop functionality with image preview.

### 2. Real-time Search
Search functionality filters buses instantly as you type, with no backend calls required.

### 3. Animated Statistics
Statistics cards use Framer Motion for smooth counter animations and hover effects.

### 4. Responsive Design
- **Desktop**: 3-column grid layout
- **Tablet**: 2-column grid layout
- **Mobile**: Single column layout with collapsible sidebar

### 5. Loading States
Skeleton loaders provide visual feedback during data fetching, improving perceived performance.

### 6. Empty State
When no buses exist, an engaging empty state encourages users to add their first bus.

## 🎨 Customization

### Changing Colors
Update the color classes in each component:

```jsx
// Example: Change primary color from indigo to purple
className="bg-gradient-to-r from-purple-600 to-blue-600"
```

### Modifying Animations
Adjust Framer Motion animation properties:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }} // Adjust duration
>
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔐 Security Considerations

- All API calls include JWT token authentication
- File uploads are validated on the frontend
- Delete operations require confirmation
- Input validation on all forms

## 🚀 Performance Optimizations

1. **Lazy Loading**: Components load on demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Debounced Search**: Reduces filter operations
4. **Optimized Images**: Proper image sizing and lazy loading
5. **Skeleton Loaders**: Improve perceived performance

## 📝 Future Enhancements

- [ ] Bulk operations (select multiple buses)
- [ ] Advanced sorting options
- [ ] Print functionality
- [ ] Dark mode support
- [ ] Driver assignment integration
- [ ] Route assignment integration
- [ ] Real-time tracking integration
- [ ] Activity log
- [ ] Bus maintenance scheduling
- [ ] Analytics dashboard

## 🤝 Contributing

This is a university project component. For improvements or bug fixes, please follow the project's contribution guidelines.

## 📄 License

Part of the University Bus Tracking System project.

## 👨‍💻 Author

Created as part of a final-year University Bus Tracking System project.

---

**Note**: This component is designed to work within a larger University Bus Tracking System and requires proper backend API integration for full functionality.