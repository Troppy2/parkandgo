# Park&Go v1.05

A smart parking assistant web application designed for the University of Minnesota Twin Cities campus. Park&Go helps students find optimal parking spots based on their location, schedule, and preferences.

## Version 1.05 Release Notes

### New Features

**Smart Search & Pin Placement**
- Real-time search with autocomplete for parking spots
- Interactive map pins with location fly-to animation
- Coordinate validation to prevent invalid pin placement

**Personalized Recommendations**
- Algorithm-based suggestions considering cost, distance, and user preferences
- Top 3 parking spot recommendations after each search
- Integration with user academic profile for campus-specific suggestions

**Turn-by-Turn Navigation (Somewhat Does not work well)**
- Route calculation using OSRM routing engine
- Dual travel modes: driving and walking with semi-accurate time estimates
- Real-time user location tracking during navigation
- Distance and ETA updates as user approaches destination

**User Authentication**
- Google OAuth 2.0 integration
- Profile completion for personalized recommendations
- Session management with secure cookies

### Bug Fixes

**Critical Fixes**
- Resolved duplicate variable declarations causing JavaScript runtime errors
- Fixed navigation overlay not dismissing after route completion
- Implemented coordinate validation to prevent pins at [0,0] (center of Earth)
- Corrected travel time calculations to differentiate between walking and driving modes

**Stability Improvements**
- Added null checks throughout codebase to prevent DOM-related crashes
- Improved error handling for geolocation permission denials
- Fixed route layer cleanup preventing map rendering issues
- Enhanced async/await consistency across API calls

**UI/UX Improvements**
- Replaced intrusive alert dialogs with console logging for non-critical errors
- Added proper loading states for suggestion cards
- Improved sidebar auto-close behavior when selecting destinations
- Fixed Escape key handler for modal dismissal

### Technical Details

**Backend (Flask/Python)**
- Geocoding API integration using Nominatim
- Haversine distance calculation for accurate proximity scoring
- Caching layer for geocoding results using `@lru_cache`
- Multi-factor recommendation algorithm weighing cost, distance, walk time, and user preferences

**Frontend (JavaScript/MapLibre GL)**
- MapLibre GL JS for 3D building rendering and smooth map interactions
- Debounced search to minimize API calls (300ms delay)
- OSRM integration for routing with profile-based speed calculations
- Real-time geolocation tracking with `watchPosition` API

**Database (MySQL)**
- User profiles with OAuth credentials
- Parking spot inventory with verified/unverified flags
- Major-to-campus mapping for academic-based recommendations
- Latitude/longitude storage for all parking locations

### Known Issues

- Search results limited to spots with valid coordinates (by design)
- Geolocation requires HTTPS or localhost for browser security
- Route calculation requires active internet connection
- OSRM public API may have rate limits during peak usage
- Overhead route 

### Dependencies

**Python**
```
Flask==2.3.0
Flask-Login==0.6.2
Flask-SQLAlchemy==3.0.5
PyMySQL==1.1.0
requests==2.31.0
oauthlib==3.2.2
python-dotenv==1.0.0
```

**JavaScript (CDN)**
- MapLibre GL JS v5.15.0
- OSRM Routing API (public instance)

**Database**
- MySQL 8.0+

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/parkandgo.git
cd parkandgo
```

2. Install Python dependencies
```bash
pip install -r requirements.txt
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials and Google OAuth keys
```

4. Initialize the database
```bash
mysql -u root -p < parkandgo_db.sql
```

5. Run the application
```bash
python app.py
```

6. Access the application at `http://localhost:5000`

### Configuration

Required environment variables in `.env`:

```ini
SECRET_KEY=your-secret-key-here
DB_USERNAME=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=parkandgo_db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### API Endpoints

**Authentication**
- `GET /login` - Redirect to Google OAuth
- `GET /login/callback` - OAuth callback handler
- `GET /logout` - End user session
- `GET /api/current-user` - Get authenticated user info

**Parking Spots**
- `GET /api/parking-spots` - Retrieve all parking spots
- `GET /api/parking-spots/filter` - Filter by campus, type, cost
- `GET /api/search?q={query}` - Search parking spots (coordinates required)
- `POST /api/add-parking-spot` - Submit new parking location

**Recommendations**
- `POST /api/recommendations` - Get personalized suggestions
  - Request body: `{selected_spot_id, user_lat, user_lon}`
  - Returns: Top 3 scored parking spots

**User Profile**
- `POST /api/update-profile` - Update user preferences
  - Request body: `{major, grade_level, graduation_year, housing_type}`

### Architecture

**Request Flow**
1. User searches for parking spot
2. Frontend sends AJAX request to `/api/search`
3. Backend filters spots with valid coordinates and returns matches
4. User clicks result, triggering pin drop and suggestions request
5. Recommendation algorithm scores spots based on:
   - Cost (25% weight)
   - Distance from user (30% weight)
   - Walk time to buildings (15% weight)
   - User preferences (20% weight)
   - Verified status (10% weight)
6. Top 3 suggestions displayed with "Get Directions" buttons
7. Route calculated using OSRM with appropriate travel profile
8. Navigation overlay tracks user position until arrival

**Recommendation Scoring Algorithm**
```python
score = (cost_score * 0.25) + 
        (distance_score * 0.30) + 
        (walk_time_score * 0.15) + 
        (preference_score * 0.20) + 
        (verified_bonus * 0.10)
```

### File Structure

```
parkandgo/
├── app.py                      # Main Flask application
├── auth.py                     # Google OAuth handlers
├── config.py                   # Configuration management
├── models.py                   # SQLAlchemy database models
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (not in repo)
├── static/
│   ├── app.js                  # Frontend JavaScript
│   ├── styles.css              # Application styles
│   └── Park&Go_Logo.png        # Application logo
├── templates/
│   └── index.html              # Main application template
└── parkandgo_db.sql            # Database schema and seed data
```

### Security Considerations

- OAuth tokens stored in secure HTTP-only cookies
- Database credentials isolated in environment variables
- CSRF protection via Flask-Login session management
- Geolocation data kept client-side, only coordinates sent to server
- User passwords never stored (OAuth only)

### Performance Optimizations

- Geocoding results cached using LRU cache (100 items)
- Search debounced to 300ms to reduce server load
- Database queries filtered at SQL level before Python processing
- MapLibre GL uses vector tiles for efficient rendering
- Route geometry simplified for faster map rendering

### Browser Compatibility

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Note:** Geolocation features require HTTPS in production or localhost for development.

### Acknowledgments

- OpenStreetMap contributors for map data
- OSRM project for routing engine
- OpenFreeMap for tile hosting
- MapLibre GL JS for mapping library
- University of Minnesota for campus data
