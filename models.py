from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# Create the database object
db = SQLAlchemy()

class User(UserMixin, db.Model):
    """
    Users table with Google OAuth authentication support
    UserMixin provides: is_authenticated, is_active, is_anonymous, get_id()
    """
    __tablename__ = 'users'
    
    # Primary Key
    user_id = db.Column(db.Integer, primary_key=True)
    
    # Google OAuth Fields
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    profile_pic = db.Column(db.String(500), nullable=True)
    
    # User Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    
    # Parking Preferences
    preferred_parking_types = db.Column(db.String(250))
    
    # Academic Information
    major = db.Column(db.String(100), nullable=True)
    major_category = db.Column(db.String(100))
    grade_level = db.Column(db.String(100))
    graduation_year = db.Column(db.Integer)
    
    # Housing
    housing_type = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_id(self):
        """
        Required by Flask-Login
        Returns the user's unique identifier as a string
        """
        return str(self.user_id)
    
    def to_dict(self):
        """
        Convert user object to dictionary for JSON responses
        """
        return {
            'user_id': self.user_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_pic': self.profile_pic,
            'major': self.major,
            'major_category': self.major_category,
            'grade_level': self.grade_level,
            'graduation_year': self.graduation_year,
            'housing_type': self.housing_type,
            'preferred_parking_types': self.preferred_parking_types
        }
    
    def is_profile_complete(self):
        """
        Check if user has completed their profile
        Returns True if major, grade_level, and housing_type are filled
        """
        return bool(self.major and self.grade_level and self.housing_type)
    
    def __repr__(self):
        return f'<User {self.email}>'


class ParkingSpot(db.Model):
    """
    Parking spots table
    """
    __tablename__ = 'parking_spots'
    
    # Columns (must match your SQL table)
    spot_id = db.Column(db.Integer, primary_key=True)
    spot_name = db.Column(db.String(100), nullable=False)
    campus_location = db.Column(db.String(100))
    parking_type = db.Column(db.String(100))
    cost = db.Column(db.Float)
    walk_time = db.Column(db.String(100))
    near_buildings = db.Column(db.Text)
    address = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """
        Convert parking spot object to dictionary
        """
        return {
            'spot_id': self.spot_id,
            'spot_name': self.spot_name,
            'campus_location': self.campus_location,
            'parking_type': self.parking_type,
            'cost': self.cost,
            'walk_time': self.walk_time,
            'near_buildings': self.near_buildings,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_verified': self.is_verified
        }
    
    def __repr__(self):
        return f'<ParkingSpot {self.spot_name}>'


class MajorCampusMapping(db.Model):
    """
    Major to campus mapping table
    """
    __tablename__ = 'major_campus_mapping'
    
    mapping_id = db.Column(db.Integer, primary_key=True)
    major_name = db.Column(db.String(100), nullable=False)
    major_category = db.Column(db.String(50))
    primary_campus = db.Column(db.String(20))
    common_buildings = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'mapping_id': self.mapping_id,
            'major_name': self.major_name,
            'major_category': self.major_category,
            'primary_campus': self.primary_campus,
            'common_buildings': self.common_buildings
        }
    
    def __repr__(self):
        return f'<MajorCampusMapping {self.major_name}>'