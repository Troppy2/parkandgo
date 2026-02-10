"""
Authentication utilities for Google OAuth
"""
import json
import os
import requests
from flask import redirect, request, url_for
from flask_login import login_user, logout_user, current_user
from oauthlib.oauth2 import WebApplicationClient
from models import db, User

# Allow OAuth over HTTP for local development (REMOVE IN PRODUCTION!)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
class GoogleAuth:
    """
    Handles Google OAuth 2.0 authentication flow
    """
    
    def __init__(self, app):
        self.client_id = app.config['GOOGLE_CLIENT_ID']
        self.client_secret = app.config['GOOGLE_CLIENT_SECRET']
        self.discovery_url = app.config['GOOGLE_DISCOVERY_URL']
        
        # OAuth 2.0 client
        self.client = WebApplicationClient(self.client_id)
    
    def get_google_provider_cfg(self):
        """
        Get Google's OAuth 2.0 configuration
        This tells us where to send users to login, where to get tokens, etc.
        """
        return requests.get(self.discovery_url).json()
    
    def get_login_url(self):
        """
        Generate the URL to redirect users to Google's login page
        """
        # Get Google's configuration
        google_provider_cfg = self.get_google_provider_cfg()
        authorization_endpoint = google_provider_cfg["authorization_endpoint"]
        
        # Construct the login URL with proper redirect URI
        request_uri = self.client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=url_for('callback', _external=True),
            scope=["openid", "email", "profile"],
        )
        
        return request_uri
    
    def handle_callback(self):
        """
        Handle the callback from Google after user logs in
        Returns the user object or None if authentication fails
        """
        # Get authorization code from Google
        code = request.args.get("code")
        
        if not code:
            return None
        
        # Get Google's configuration
        google_provider_cfg = self.get_google_provider_cfg()
        token_endpoint = google_provider_cfg["token_endpoint"]
        
        # Exchange authorization code for access token
        token_url, headers, body = self.client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=url_for('callback', _external=True),
            code=code
        )
        
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(self.client_id, self.client_secret),
        )
        
        # Parse the tokens
        self.client.parse_request_body_response(json.dumps(token_response.json()))
        
        # Get user info from Google
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = self.client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)
        
        # Extract user information
        userinfo = userinfo_response.json()
        
        # Verify email is verified by Google
        if not userinfo.get("email_verified"):
            return None
        
        # Get user details
        google_id = userinfo["sub"]
        email = userinfo["email"]
        first_name = userinfo.get("given_name", "")
        last_name = userinfo.get("family_name", "")
        profile_pic = userinfo.get("picture", "")
        
        # Check if user exists in database
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                profile_pic=profile_pic
            )
            db.session.add(user)
            db.session.commit()
        else:
            # Update existing user's info (in case they changed their Google profile)
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.profile_pic = profile_pic
            db.session.commit()
        
        return user

def init_auth(app):
    """
    Initialize authentication for the Flask app
    """
    return GoogleAuth(app)