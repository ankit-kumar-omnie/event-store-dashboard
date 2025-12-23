# Event Dashboard

A modern React-based dashboard for monitoring and analyzing event streams, similar to EventStore's UI. This dashboard provides real-time visualization of events, entity states, and comprehensive analytics for your event sourcing system.

## Features

### 🎯 Core Features
- **Real-time Event Streaming**: Monitor live event streams with auto-refresh
- **Entity State Reconstruction**: View current and historical entity states
- **Event Timeline**: Chronological view of all events across entities
- **Advanced Analytics**: Charts and statistics for event patterns
- **State Comparison**: Compare entity states between different time periods
- **Audit Trail**: Complete history of all changes with detailed logs

### 📊 Visualization
- Interactive charts using Recharts
- Real-time data updates
- Responsive design for all screen sizes
- Dark/light theme support
- JSON payload viewer with syntax highlighting

### 🔍 Analysis Tools
- Event filtering by type, date, and entity
- Search functionality across events and entities
- State reconstruction at any point in time
- Rollback preview functionality
- Export capabilities for reports and data

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios with React Query
- **Routing**: React Router v6
- **Icons**: Lucide React
- **JSON Viewer**: React JSON View

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Running NestJS API server (from server-new-pj)

### Installation

1. **Clone and install dependencies**
```bash
cd event-dashboard
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

3. **Start the development server**
```bash
npm start
```

The dashboard will be available at `http://localhost:3001`

### Production Build

```bash
npm run build
npm run serve
```

## Dashboard Sections

### 🏠 Dashboard
- System overview with key metrics
- Recent events summary
- Quick action buttons
- System health status
- Real-time connection indicator

### 🌊 Event Streams
- Live event streaming with start/stop controls
- Entity selection and filtering
- Real-time event display with payload inspection
- Stream statistics and metadata
- Event type filtering and search

### 👤 Entity Details
- Detailed entity information
- Current state reconstruction
- State at specific dates
- Complete audit trail
- State comparison between time periods
- Export entity data

### ⏰ Event Timeline
- Chronological view of all events
- Multi-entity timeline support
- Date range filtering
- Event type filtering
- Search across events and entities
- Visual timeline with event indicators

### 📈 Analytics
- Event volume over time
- Events by user/entity
- Event type distribution
- User activity summaries
- Customizable date ranges
- Export analytics reports

### ⚙️ Settings
- API connection configuration
- Display preferences
- Notification settings
- Data retention policies
- Import/export settings
- Debug mode toggle

## API Integration

The dashboard integrates with your NestJS event sourcing API through these endpoints:

### Event Sourcing Endpoints
- `GET /events/{entityId}/replay` - Replay events
- `GET /events/{entityId}/timeline` - Get event timeline
- `GET /events/{entityId}/statistics` - Get event statistics
- `GET /events/{entityId}/state-at/{timestamp}` - Get state at time
- `GET /events/{entityId}/compare` - Compare states

### User Event Sourcing Endpoints
- `GET /users/me/current-state` - Current user state
- `GET /users/me/audit-trail` - User audit trail
- `GET /users/me/history` - User history
- `GET /users/{userId}/audit-trail` - Any user audit trail (admin)

### Authentication
The dashboard supports JWT authentication. Set the token in localStorage:
```javascript
localStorage.setItem('authToken', 'your-jwt-token');
```

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_ENVIRONMENT`: Environment (development/production)

### Settings Panel
Configure dashboard behavior through the Settings page:
- API connection settings
- Refresh intervals
- Display preferences
- Notification settings
- Data retention policies

## Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main page components
├── services/           # API services and utilities
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── index.tsx           # App entry point
```

### Adding New Features

1. **New API Endpoint**
   - Add service function in `src/services/api.ts`
   - Create TypeScript types in `src/types/index.ts`
   - Use React Query for data fetching

2. **New Page**
   - Create component in `src/pages/`
   - Add route in `App.tsx`
   - Update navigation in `Layout.tsx`

3. **New Chart Type**
   - Use Recharts components
   - Follow existing chart patterns
   - Ensure responsive design

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Static Hosting
The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API URL in settings
   - Verify backend server is running
   - Check CORS configuration

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper API permissions

3. **Data Not Loading**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check browser console for errors

### Debug Mode
Enable debug mode in Settings to see:
- Detailed API request/response logs
- Component render information
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.