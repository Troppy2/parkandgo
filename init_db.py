from app import app, db
from models import ParkingSpot, MajorCampusMapping
import os

def init_database():
    """Initialize database with tables and seed data"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("Tables created successfully")
            
            # Check if data already exists
            if ParkingSpot.query.first():
                print("Database already has data, skipping seed")
                return
            
            print("Seeding database with initial data...")
            
            # Add parking spots
            parking_spots = [
                ParkingSpot(
                    spot_name='Oak Street Ramp',
                    campus_location='East Bank',
                    parking_type='Parking Garage',
                    cost=2.50,
                    walk_time='5 min',
                    near_buildings='Coffman Union, Walter Library, Carlson School, Northrop Auditorium',
                    address='1801 Oak Street SE, Minneapolis, MN 55414',
                    latitude=44.9742,
                    longitude=-93.2314,
                    is_verified=True
                ),
                ParkingSpot(
                    spot_name='19th Ave Meters',
                    campus_location='East Bank',
                    parking_type='Street Parking',
                    cost=1.50,
                    walk_time='8 min',
                    near_buildings='Keller Hall, Tate Lab, Recreation Center',
                    address='19th Avenue SE, Minneapolis, MN 55455',
                    latitude=44.9755,
                    longitude=-93.2330,
                    is_verified=True
                ),
                ParkingSpot(
                    spot_name='Church Street Garage',
                    campus_location='East Bank',
                    parking_type='Parking Garage',
                    cost=2.00,
                    walk_time='3 min',
                    near_buildings='Anderson Hall, Bruininks Hall, Nicholson Hall',
                    address='110 Church Street SE, Minneapolis, MN 55455',
                    latitude=44.9738,
                    longitude=-93.2351,
                    is_verified=True
                ),
                ParkingSpot(
                    spot_name='4th St Ramp',
                    campus_location='East Bank',
                    parking_type='Parking Garage',
                    cost=2.50,
                    walk_time='7 min',
                    near_buildings='Walter Library, Coffman Union',
                    address='411 Washington Avenue SE, Minneapolis, MN 55455',
                    latitude=44.9728,
                    longitude=-93.2339,
                    is_verified=True
                ),
                ParkingSpot(
                    spot_name='Washington Ave Bridge Lot',
                    campus_location='West Bank',
                    parking_type='Surface Lot',
                    cost=1.00,
                    walk_time='2 min',
                    near_buildings='Wilson Library, West Bank Buildings',
                    address='Washington Avenue, Minneapolis, MN 55454',
                    latitude=44.9725,
                    longitude=-93.2430,
                    is_verified=True
                ),
                ParkingSpot(
                    spot_name='21st Ave Garage',
                    campus_location='West Bank',
                    parking_type='Parking Garage',
                    cost=2.50,
                    walk_time='4 min',
                    near_buildings='Blegen Hall, Ferguson Hall',
                    address='2100 Riverside Avenue, Minneapolis, MN 55454',
                    latitude=44.9720,
                    longitude=-93.2445,
                    is_verified=True
                ),
            ]
            
            for spot in parking_spots:
                db.session.add(spot)
            
            # Add major campus mappings
            major_mappings = [
                MajorCampusMapping(
                    major_name='Computer Science',
                    major_category='STEM',
                    primary_campus='East Bank',
                    common_buildings='Keller Hall, Lind Hall'
                ),
                MajorCampusMapping(
                    major_name='Computer Engineering',
                    major_category='STEM',
                    primary_campus='East Bank',
                    common_buildings='Keller Hall, EECS Building'
                ),
                MajorCampusMapping(
                    major_name='Business',
                    major_category='Business',
                    primary_campus='East Bank',
                    common_buildings='Carlson School of Management'
                ),
                MajorCampusMapping(
                    major_name='Psychology',
                    major_category='Social Science',
                    primary_campus='East Bank',
                    common_buildings='Elliott Hall'
                ),
                MajorCampusMapping(
                    major_name='History',
                    major_category='Liberal Arts',
                    primary_campus='West Bank',
                    common_buildings='Social Sciences Building'
                ),
                MajorCampusMapping(
                    major_name='Theatre',
                    major_category='Arts',
                    primary_campus='West Bank',
                    common_buildings='Rarig Center'
                ),
            ]
            
            for mapping in major_mappings:
                db.session.add(mapping)
            
            db.session.commit()
            print("Database seeded successfully")
            
        except Exception as e:
            print(f"Error initializing database: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    # Check if DATABASE_URL is set
    if not os.getenv('DATABASE_URL'):
        print("DATABASE_URL not set. Using default configuration.")
    
    init_database()
