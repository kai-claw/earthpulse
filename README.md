# 🌍 EarthPulse - Interactive Seismic Globe

A sophisticated, real-time visualization of global seismic activity on an interactive 3D Earth. Built with modern web technologies to provide an immersive educational experience about earthquakes and tectonic activity.

## 🚀 Live Demo

**[→ View EarthPulse Live](https://kai-claw.github.io/earthpulse/)**

## ✨ Features

### 🌐 3D Interactive Globe
- **Realistic Earth**: High-quality textures with natural lighting and atmosphere
- **Smooth Interaction**: Drag to rotate, scroll to zoom, responsive touch controls
- **Space Theme**: Beautiful star field background with professional aesthetics

### 🔴 Real-Time Earthquakes
- **Live USGS Data**: Fetches current earthquake data from USGS GeoJSON API
- **Visual Encoding**: Earthquake magnitude determines dot size, depth determines color
- **Pulsing Animation**: Earthquakes appear with subtle pulsing effects
- **Rich Details**: Click any earthquake for detailed information

### 🗺️ Tectonic Plates
- **Plate Boundaries**: Animated tectonic plate boundary lines
- **Scientific Accuracy**: Based on geological survey data
- **Educational**: Learn about Earth's geological structure

### ⏰ Time Controls
- **Time Filtering**: View earthquakes from last hour to last month
- **Time-lapse Animation**: Watch earthquakes appear chronologically
- **Smooth Transitions**: Professional animation system

### 🎛️ Advanced Filtering
- **Magnitude Filter**: Adjustable minimum magnitude slider (0-9)
- **Visualization Modes**: Toggle between dot view and heatmap
- **Real-time Updates**: Filters apply instantly without page reload

### 📊 Statistics Panel
- **Live Metrics**: Total events, largest earthquake, most active region
- **Data Insights**: Average depth, magnitude distributions
- **Regional Analysis**: Identifies earthquake hotspots

### 🎨 Heatmap Mode
- **Alternative View**: Switch between individual dots and heatmap
- **Color Coding**: Intuitive magnitude-based color scheme
- **Performance**: Optimized for large datasets

### 📱 Responsive Design
- **Mobile Optimized**: Touch-friendly controls and responsive layout
- **Cross-Platform**: Works on desktop, tablet, and mobile
- **Adaptive UI**: Collapsible sidebar for different screen sizes

### 📚 Educational Content
- **Earthquake Scale**: Complete Richter scale reference
- **Depth Categories**: Color-coded depth classification
- **Scientific Context**: Educational information about seismic activity

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite (fast, modern development)
- **3D Rendering**: Three.js + react-globe.gl
- **Styling**: Modern CSS with dark space theme
- **Data Source**: USGS Earthquake API (real-time)
- **Icons**: Lucide React (clean, modern icons)
- **Date Handling**: date-fns (lightweight, efficient)

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Globe.tsx          # Main 3D globe component
│   └── Sidebar.tsx        # Controls and information panel
├── types/
│   └── index.ts          # TypeScript interfaces
├── utils/
│   ├── api.ts           # USGS API integration
│   └── helpers.ts       # Data processing utilities
└── App.tsx              # Main application logic
```

### Data Flow
1. **API Integration**: Fetches real-time data from USGS
2. **Data Processing**: Converts GeoJSON to globe-compatible format
3. **Filtering**: Client-side filtering for performance
4. **Visualization**: Three.js renders on interactive globe
5. **User Interaction**: React manages state and UI updates

## 🌊 Data Sources

### USGS Earthquake API
- **Endpoint**: https://earthquake.usgs.gov/fdsnws/event/1/query
- **Format**: GeoJSON (standard geographic data format)
- **Update Frequency**: Real-time (typically within minutes)
- **Data Quality**: Professional seismological monitoring

### Tectonic Plates
- **Source**: Geological survey data
- **Coverage**: Major global tectonic plate boundaries
- **Accuracy**: Scientifically validated plate boundaries

## 🎯 Key Features Deep Dive

### Earthquake Visualization
- **Size Encoding**: Larger dots = higher magnitude
- **Color Encoding**: Depth-based color scheme (red=shallow, blue=deep)
- **Interactive Details**: Click for magnitude, location, depth, time
- **Performance**: Optimized for 1000+ simultaneous earthquakes

### Scientific Accuracy
- **Richter Scale**: Proper magnitude classification and descriptions
- **Depth Categories**: Shallow (<35km), Intermediate (35-70km), Deep (>70km)
- **Geographic Precision**: Accurate lat/long positioning
- **Time Accuracy**: UTC timestamps with local time conversion

### User Experience
- **Intuitive Controls**: Natural drag/zoom interaction
- **Loading States**: Professional loading animations
- **Error Handling**: Graceful fallbacks for network issues
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Development

### Prerequisites
- Node.js 16+ (latest LTS recommended)
- npm or yarn package manager

### Local Development
```bash
# Clone the repository
git clone https://github.com/kai-claw/earthpulse.git
cd earthpulse

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production
```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

### Project Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🌍 API Usage

### Earthquake Data Structure
```typescript
interface EarthquakeFeature {
  properties: {
    mag: number;           // Magnitude (Richter scale)
    place: string;         // Location description
    time: number;          // Unix timestamp
    depth: number;         // Depth in kilometers
    // ... additional USGS properties
  };
  geometry: {
    coordinates: [lon, lat, depth];
  };
}
```

### Filtering Parameters
- **Time Range**: 1 hour to 30 days
- **Magnitude**: 0.0 to 10.0+ (theoretical max ~9.5)
- **Geographic**: Global coverage
- **Limit**: Configurable (default 200 events)

## 📈 Performance

### Optimizations
- **Bundle Splitting**: Separate chunks for core and vendor code
- **Lazy Loading**: Components load on demand
- **Efficient Rendering**: Three.js optimizations for 60fps
- **API Caching**: Intelligent caching of earthquake data
- **Memory Management**: Proper cleanup of 3D resources

### Browser Support
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with WebGL support

## 🎨 Design Philosophy

### Visual Design
- **Dark Theme**: Space-like aesthetic with professional appearance
- **Scientific Color Scheme**: Intuitive depth and magnitude encoding
- **Clean Typography**: Modern, readable font choices
- **Responsive Layout**: Adapts to all screen sizes

### User Experience
- **Progressive Disclosure**: Advanced features don't overwhelm newcomers
- **Immediate Feedback**: All interactions provide instant visual response
- **Educational Focus**: Learning-oriented information architecture
- **Accessibility**: Inclusive design for all users

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **USGS**: For providing real-time earthquake data
- **Three.js Community**: For the powerful 3D graphics library
- **react-globe.gl**: For the excellent globe component
- **OpenClaw**: For the development platform and support

## 🔗 Links

- **Live Application**: https://kai-claw.github.io/earthpulse/
- **GitHub Repository**: https://github.com/kai-claw/earthpulse
- **USGS Earthquake Data**: https://earthquake.usgs.gov/
- **Three.js Documentation**: https://threejs.org/docs/

---

*Built with ❤️ for science education and earthquake awareness*