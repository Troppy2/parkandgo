from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_login import LoginManager, login_required, logout_user, current_user
from config import Config
from models import db, ParkingSpot, User, MajorCampusMapping
from auth import init_auth
import requests
from functools import lru_cache


# Flask App
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'

# Initialize Google OAuth
google_auth = init_auth(app)

# Initialize database and seed data
with app.app_context():
    try:
        # Create tables if they don't exist
        db.create_all()
        print("Database tables are ready")
        
        # Check if we need to seed data
        from models import ParkingSpot
        if not ParkingSpot.query.first():
            print("No data found, running seed...")
            from init_db import init_database
            init_database()
        else:
            print("Database already has data")
            
    except Exception as e:
        print(f"Database initialization note: {e}")
        print("This might be normal if tables already exist")
# ============= FLASK-LOGIN USER LOADER =============
@login_manager.user_loader
def load_user(user_id):
    """
    Flask-Login uses this to reload the user object from the user ID stored in the session
    """
    return User.query.get(int(user_id))
# ============= GEOCODING HELPER =============
@lru_cache(maxsize=100)
def geocode_address(address):
    """
    Convert an address to latitude/longitude using Nominatim API
    Cached to avoid repeated API calls for same address
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'limit': 1
        }
        headers = {
            'User-Agent': 'ParkAndGo-UMN-App/1.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        data = response.json()
        
        if data and len(data) > 0:
            return {
                'lat': float(data[0]['lat']),
                'lon': float(data[0]['lon'])
            }
        return None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None

# ============= ROUTES =============
@app.route('/')
def index():
    """Home page route"""
    return render_template('index.html')

# ============= AUTHENTICATION ROUTES =============
@app.route('/login')
def login():
    """
    Redirect user to Google's login page
    """
    login_url = google_auth.get_login_url()
    return redirect(login_url)

@app.route('/login/callback')
def callback():
    """
    Handle callback from Google after user logs in
    """
    # Get user from Google
    user = google_auth.handle_callback()
    
    if user:
        # Log the user in
        from flask_login import login_user
        login_user(user)
        
        # Redirect based on whether profile is complete
        if user.is_profile_complete():
            return redirect(url_for('index'))
        else:
            return redirect(url_for('complete_profile'))
    else:
        return "Login failed", 400

@app.route('/logout')
@login_required
def logout():
    """
    Log out the current user
    """
    logout_user()
    return redirect(url_for('index'))

@app.route('/complete-profile')
@login_required
def complete_profile():
    """
    Page for new users to complete their profile
    """
    return render_template('index.html')

# ============= API ROUTES =============
@app.route('/api/current-user')
def get_current_user():
    """
    Get current logged-in user info
    """
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    else:
        return jsonify({
            'authenticated': False,
            'user': None
        })
    
# ============= UPDATE USER PROFILE =============
@app.route('/api/update-profile', methods=['POST'])
@login_required
def update_profile():
    """
    Update user profile information
    """
    try:
        data = request.get_json()
        
        # Update user fields
        if 'major' in data:
            current_user.major = data['major']
        if 'grade_level' in data:
            current_user.grade_level = data['grade_level']
        if 'graduation_year' in data:
            current_user.graduation_year = data['graduation_year']
        if 'housing_type' in data:
            current_user.housing_type = data['housing_type']
        if 'preferred_parking_types' in data:
            current_user.preferred_parking_types = data['preferred_parking_types']
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'user': current_user.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    
# ============= GET ALL PARKING SPOTS =============
@app.route('/api/parking-spots', methods=['GET'])
def get_parking_spots():
    """API route to get all parking spots"""
    try:
        spots = ParkingSpot.query.all()
        spots_data = [spot.to_dict() for spot in spots]

        return jsonify({
            'status': 'success',
            'count': len(spots_data),
            'data': spots_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    
# ============= FILTER PARKING SPOTS =============
@app.route('/api/parking-spots/filter', methods=['GET'])
def filter_parking_spots():
    """API route to filter parking spots based on query parameters"""
    try:
        query = ParkingSpot.query

        # Get query parameters
        campus_location = request.args.get('campus')
        parking_type = request.args.get('type')
        max_cost = request.args.get('max_cost', type=float)

        # Apply filters
        if campus_location:
            query = query.filter(ParkingSpot.campus_location == campus_location)
        if parking_type:
            query = query.filter(ParkingSpot.parking_type == parking_type)
        if max_cost is not None:
            query = query.filter(ParkingSpot.cost <= max_cost)

        filtered_spots = query.all()
        spots_data = [spot.to_dict() for spot in filtered_spots]

        return jsonify({
            'status': 'success',
            'count': len(spots_data),
            'data': spots_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
# ============= USER LOCATION ACCESS =============
@app.route ('/api/user-location', methods=['POST'])
@login_required
def save_user_location():
    """
    Save user's location sent from the frontend -- latitude and longitude -- saves on the browser side
    """
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({
                'status': 'error',
                'message': 'Latitude and Longitude are required'
            }), 400
        
        # Here you can save the location to the database or session if needed
        # For demonstration, we just return it back
        
        return jsonify({
            'status': 'success',
            'message': 'Location received',
            'data': {
                'latitude': latitude,
                'longitude': longitude
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
# ============= RECOMMENDATION LOGIC =============
#calculate distance function
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    from math import radians, sin, cos, sqrt, atan2
    
    EARTHS_RADIUS = 3959 # earths radius in miles
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    distance = EARTHS_RADIUS * c
    return distance

# Calculate spot score function
def calculate_spot_score(spot, user, user_lat, user_lon, selected_spot_id):
    """
    Calculate a score for a parking spot based on multiple factors
    Higher score = better recommendation
    """
    score = 0

    #Factor 1: cost - weight is 30%
    if spot.cost is not None:
        max_cost = 5
        cost_score = (max_cost - spot.cost) / max_cost * 30 # The closer this is to 30 the better
        score += cost_score
    #Factor 2: Distance - weight 40%
    if user_lat is not None and user_lon is not None and spot.latitude and spot.longitude:
        distance = calculate_distance(user_lat, user_lon, spot.latitude, spot.longitude)
        # To normlize data the most a user might want to walk and drive if on campus is 2 miles
        max_distance = 2
        distance_mi = min(distance, max_distance)
        distance_score = (max_distance - distance_mi) / max_distance * 40
        score += distance_score
    # Factor 3: User preferences - Weight: 20%
    if user.is_profile_complete():
        # Match parking type preference
        if user.preferred_parking_types and spot.parking_type:
            if spot.parking_type in user.preferred_parking_types:
                score += 20
    # Factor 4:  verfified parking spot bounus - weight 10%
    if spot.is_verified:
        score += 10
    # Penalty - algorithm shouldn't recommend spots the user just searched for
    if spot.spot_id == selected_spot_id:
        score -= 40
    return score

@app.route('/api/recommendations', methods=['GET', 'POST'])
@login_required
def get_recommendations():
    """
    Get personalized parking spot recommendations
    Accepts: {
        "selected_spot_id": int,
        "user_lat": float,
        "user_lon": float
    }
    Returns top 3 spots based on:
    - Cost (lower is better)
    - Distance from user location
    - User preferences (if profile complete)
    """
    try:
        data = request.get_json(silent=True)
        if data is None:
            data = request.args

        if isinstance(data, dict):
            selected_spot_id = data.get('selected_spot_id')
            user_lat = data.get('user_lat')
            user_lon = data.get('user_lon')
            selected_spot_id = int(selected_spot_id) if selected_spot_id is not None else None
            user_lat = float(user_lat) if user_lat is not None else None
            user_lon = float(user_lon) if user_lon is not None else None
        else:
            selected_spot_id = data.get('selected_spot_id', type=int)
            user_lat = data.get('user_lat', type=float)
            user_lon = data.get('user_lon', type=float)

        #get parking spots
        spots = ParkingSpot.query.filter(
            ParkingSpot.latitude.isnot(None),
            ParkingSpot.longitude.isnot(None)
        ).all()
        
        #score each spot
        scored_spots = []
        for spot in spots:
            score = calculate_spot_score(
                spot,
                current_user,
                user_lat,
                user_lon,
                selected_spot_id
            )
            scored_spots.append({
                'spot': spot,
                'score': score
            })

        # Sort each spot by the corresponding score (from high to low)
        scored_spots.sort(key=lambda x: x['score'], reverse=True)
        
        #get top 3 spots:
        top_spots = [item['spot'].to_dict() for item in scored_spots[:3]]
        return jsonify({
            'status': 'success',
            'personalized': current_user.is_profile_complete(),
            'message': 'Recommendations generated',
            'count': len(top_spots),
            'data': top_spots
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
# ============= SEARCH LOGIC ============= 
@app.route('/api/search', methods=['GET'])
def search_parking_spots():
    """
    Search parking spots based on a query string
    ONLY returns spots with valid coordinates
    """
    try:
        search_string = request.args.get('q', '')
        query = ParkingSpot.query
        
        # FILTER: Only spots with coordinates
        query = query.filter(
            ParkingSpot.latitude.isnot(None),
            ParkingSpot.longitude.isnot(None)
        )
        
        if search_string:
            search_pattern = f'%{search_string}%'
            query = query.filter(
                db.or_(
                    ParkingSpot.spot_name.ilike(search_pattern),
                    ParkingSpot.address.ilike(search_pattern),
                    ParkingSpot.campus_location.ilike(search_pattern),
                    ParkingSpot.parking_type.ilike(search_pattern),
                    ParkingSpot.near_buildings.ilike(search_pattern)
                )
            )
        
        spots = query.limit(5).all()
        spots_data = []
        
        for spot in spots:
            spot_dict = spot.to_dict()
            spot_dict['latitude'] = spot.latitude
            spot_dict['longitude'] = spot.longitude
            spots_data.append(spot_dict)
        
        return jsonify({
            'status': 'success',
            'count': len(spots_data),
            'query': search_string,
            'data': spots_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ============= ADD PARKING SPOT =============
@app.route('/api/add-parking-spot', methods=['POST'])
def add_parking_spot():
    """
    Add a new parking spot to the database
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('address'):
            return jsonify({
                'status': 'error',
                'message': 'Address is required'
            }), 400
        
        new_spot = ParkingSpot(
            spot_name=data.get('street_name', 'User Submitted Spot'),  
            campus_location=data.get('campus_location'),
            parking_type=data.get('parking_type'),
            cost=data.get('cost', 0.0),
            address=data.get('address'),
            is_verified=False  
        )
        
        db.session.add(new_spot)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Parking spot added successfully',
            'data': new_spot.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
# Run app
if __name__ == '__main__':
    app.run(debug=True, port=5000)