const map = new maplibregl.Map({
    style: `https://tiles.openfreemap.org/styles/bright`,
    center: [-93.23299752640466, 44.970787925016175],
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6,
    container: 'map',
    canvasContextAttributes: { antialias: true }
});

// The 'building' layer in the streets vector source contains building-height data from OpenStreetMap.
map.on('load', () => {
    const layers = map.getStyle().layers;

    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addSource('openfreemap', {
        url: `https://tiles.openfreemap.org/planet`,
        type: 'vector',
    });

    map.addLayer(
        {
            'id': '3d-buildings',
            'source': 'openfreemap',
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 15.5,
            'filter': ['!=', ['get', 'hide_3d'], true],
            'paint': {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                ],
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    16,
                    ['get', 'render_height']
                ],
                'fill-extrusion-base': ['case',
                    ['>=', ['get', 'zoom'], 16],
                    ['get', 'render_min_height'], 0
                ]
            }
        },
        labelLayerId
    );
});

//================= LOCATE ME FUNCTION =================
/* Sends the user back to the UMN-TC campus */
const locateMeBtn = document.getElementById('locate_me_button');
const campusCenter = [-93.23299752640466, 44.970787925016175];
if (locateMeBtn) {
    locateMeBtn.addEventListener('click', () => {
        map.flyTo({
            center: campusCenter,
            zoom: 15.5,
            speed: 5,
            curve: 1.2,
            essential: true
        });
    });
}

// ============= SIDEBAR AND MODALS =============
const menuButton = document.getElementById('menu-button');
const sidebar = document.getElementById('sidebar');
const logoClose = document.getElementById('logo-close');
const parkingSuggestionBtn = document.getElementById('parking-suggestion-btn');
const newParkingSuggestionModal = document.getElementById('new_parking_suggestion_modal');
const suggestionSubmitBtn = document.querySelector('.modal-submit-btn');
const modalClose = document.querySelector(".modal-close-btn");

// Open sidebar
if (menuButton && sidebar && parkingSuggestionBtn) {
    menuButton.addEventListener('click', () => {
        sidebar.classList.add('open');
        menuButton.classList.add('hidden');
        parkingSuggestionBtn.classList.add('visible');
        menuButton.classList.add('active');
        if (newParkingSuggestionModal) {
            newParkingSuggestionModal.classList.remove('open');
        }
    });
}

// Close sidebar
if (logoClose && sidebar && menuButton && parkingSuggestionBtn) {
    logoClose.addEventListener('click', () => {
        sidebar.classList.remove('open');
        menuButton.classList.remove('hidden');
        parkingSuggestionBtn.classList.remove('visible');
        menuButton.classList.remove('active');
    });
}

// FIXED: Escape key handler
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar && menuButton && parkingSuggestionBtn) {
        sidebar.classList.remove('open');
        menuButton.classList.remove('hidden');
        parkingSuggestionBtn.classList.remove('visible');
        menuButton.classList.remove('active');
    }
});

// Open parking suggestion modal
if (parkingSuggestionBtn) {
    parkingSuggestionBtn.addEventListener('click', () => {
        newParkingSuggestionModal.classList.add('open');
        parkingSuggestionBtn.classList.add('active-glow');
    });
}

// Close parking suggestion modal
if (modalClose) {
    modalClose.addEventListener('click', () => {
        newParkingSuggestionModal.classList.remove('open');
    });
}

// ============= AUTHENTICATION =============

// Modal elements
const loginModal = document.getElementById('login-modal');
const profileModal = document.getElementById('profile-modal');
const loginBtn = document.getElementById('login-btn');
const loginModalClose = document.getElementById('login-modal-close');
const googleSigninBtn = document.getElementById('google-signin-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileForm = document.getElementById('profile-form');

// User section elements
const notLoggedIn = document.getElementById('not-logged-in');
const loggedIn = document.getElementById('logged-in');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');

// Check authentication status on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/current-user');
        const data = await response.json();

        if (data.authenticated) {
            showLoggedIn(data.user);

            // Check if profile is complete
            if (!data.user.major || !data.user.grade_level || !data.user.housing_type) {
                profileModal.classList.add('open');
            }
        } else {
            showNotLoggedIn();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showNotLoggedIn();
    }
}

function showLoggedIn(user) {
    notLoggedIn.style.display = 'none';
    loggedIn.style.display = 'flex';

    userAvatar.src = user.profile_pic || 'https://via.placeholder.com/48';
    userName.textContent = `${user.first_name} ${user.last_name}`;
    userEmail.textContent = user.email;
}

function showNotLoggedIn() {
    notLoggedIn.style.display = 'block';
    loggedIn.style.display = 'none';
}

// Open login modal
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('open');
    });
}

// Close login modal
if (loginModalClose) {
    loginModalClose.addEventListener('click', () => {
        loginModal.classList.remove('open');
    });
}

// Google Sign In
if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        window.location.href = '/logout';
    });
}

// Submit profile form
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const profileData = {
            major: document.getElementById('major-input').value,
            grade_level: document.getElementById('grade-level-input').value,
            graduation_year: parseInt(document.getElementById('graduation-year-input').value),
            housing_type: document.getElementById('housing-type-input').value
        };

        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                profileModal.classList.remove('open');
                console.log('Profile updated successfully!');
                checkAuth();
            } else {
                console.log('Failed to update profile: ' + data.message);
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            console.log('Failed to update profile');
        }
    });
}

// Check auth on page load
checkAuth();

// ============= FILTER FUNCTIONALITY =============

const parkingTypeFilter = document.getElementById('parking-type-select');
const campusLocationFilter = document.getElementById('campus-location-select');
const maxCostRange = document.getElementById('max-cost-range');
const costDisplay = document.getElementById('cost-display');
const onlyWithDirectionsCheckbox = document.getElementById('only-with-directions');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

// Update cost display when slider moves
if (maxCostRange && costDisplay) {
    maxCostRange.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        costDisplay.textContent = `$${value.toFixed(2)}/hr`;
    });
}

// Apply filters - FIXED VERSION WITH DIRECTIONS FILTER
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', async () => {
        const parkingType = parkingTypeFilter.value;
        const campus = campusLocationFilter.value;
        const maxCost = maxCostRange.value;
        const onlyWithDirections = onlyWithDirectionsCheckbox ? onlyWithDirectionsCheckbox.checked : false;

        // Build query string
        const params = new URLSearchParams();
        if (campus) params.append('campus', campus);
        if (parkingType) params.append('type', parkingType);
        if (maxCost < 5) params.append('max_cost', maxCost);

        try {
            const response = await fetch(`/api/parking-spots/filter?${params.toString()}`);
            const data = await response.json();

            if (data.status === 'success' && data.data && data.data.length > 0) {
                console.log(`Found ${data.count} parking spots matching filters`);
                
                // Filter out spots without directions if checkbox is checked
                let filteredSpots = data.data;
                if (onlyWithDirections) {
                    filteredSpots = data.data.filter(spot => 
                        spot.latitude && spot.longitude && 
                        Number.isFinite(Number(spot.latitude)) && 
                        Number.isFinite(Number(spot.longitude)) &&
                        !(Number(spot.latitude) === 0 && Number(spot.longitude) === 0)
                    );
                }
                
                if (filteredSpots.length > 0) {
                    // Display filtered results in suggestions container
                    displayFilteredResults(filteredSpots);
                    
                    // If there's at least one result with valid coordinates, drop a pin at the first one
                    const firstValidSpot = filteredSpots.find(spot => 
                        spot.latitude && spot.longitude && 
                        Number.isFinite(Number(spot.latitude)) && 
                        Number.isFinite(Number(spot.longitude))
                    );
                    
                    if (firstValidSpot) {
                        const lat = Number(firstValidSpot.latitude);
                        const lon = Number(firstValidSpot.longitude);
                        dropPinAtLocation(lat, lon, firstValidSpot.spot_name);
                    }
                } else {
                    // No results after filtering for directions
                    const container = document.getElementById('suggestions-container');
                    if (container) {
                        container.innerHTML = `
                            <div class="spot-card" style="display: block;">
                                <div class="spot-header">
                                    <div class="spot-title">No parking spots with directions match your filters</div>
                                </div>
                                <div class="spot-details" style="padding: 10px;">
                                    Try unchecking "Only show spots with directions" or adjusting your criteria
                                </div>
                            </div>
                        `;
                    }
                }
            } else {
                // No results found
                const container = document.getElementById('suggestions-container');
                if (container) {
                    container.innerHTML = `
                        <div class="spot-card" style="display: block;">
                            <div class="spot-header">
                                <div class="spot-title">No parking spots match your filters</div>
                            </div>
                            <div class="spot-details" style="padding: 10px;">
                                Try adjusting your filter criteria
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Filter error:', error);
        }
    });
}

// Display filtered results in suggestions container
function displayFilteredResults(spots) {
    const container = document.getElementById('suggestions-container');
    const title = document.getElementById('suggestions-title');
    
    if (!container || !title) {
        console.error('Suggestions container or title not found');
        return;
    }

    // Clear previous suggestions
    container.innerHTML = '';
    title.style.display = 'block';

    spots.forEach((spot, index) => {
        const card = createSpotCard(spot, index + 1, true); // true = from filter
        container.appendChild(card);
    });
}

// Clear filters
if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        parkingTypeFilter.value = '';
        campusLocationFilter.value = '';
        maxCostRange.value = 5;
        costDisplay.textContent = '$5.00/hr';
        if (onlyWithDirectionsCheckbox) {
            onlyWithDirectionsCheckbox.checked = false;
        }
        
        // Clear suggestions container
        const container = document.getElementById('suggestions-container');
        if (container) {
            container.innerHTML = '';
        }
    });
}

// ============= SUBMIT PARKING SPOT =============

// Submit parking suggestion button
if (suggestionSubmitBtn) {
    suggestionSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Get form values
        const cost = document.getElementById('cost-input').value;
        const streetName = document.getElementById('street-input').value;
        const parkingType = document.getElementById('parking-type-input').value;
        const campusLocation = document.getElementById('campus-location-input').value;

        // Validate all fields are filled
        if (!cost || !streetName || !parkingType || !campusLocation) {
            alert('Please fill in all fields before submitting.');
            return;
        }

        const parkingSuggestionData = {
            cost: parseFloat(cost),
            street_name: streetName,
            parking_type: parkingType,
            campus_location: campusLocation,
            address: streetName, 
            is_verified: false
        };

        try {
            const response = await fetch('/api/add-parking-spot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parkingSuggestionData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                console.log('Parking suggestion submitted successfully!');
                alert('Thank you! Your parking suggestion has been submitted.');

                // Clear form
                document.getElementById('cost-input').value = '';
                document.getElementById('street-input').value = '';
                document.getElementById('parking-type-input').value = '';
                document.getElementById('campus-location-input').value = '';

                // Close modal
                newParkingSuggestionModal.classList.remove('open');
            } else {
                alert('Failed to submit: ' + data.message);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit parking suggestion');
        }
    });
}

// ============= MAP MARKERS STATE =============
let currentMarker = null;
let selectedSpot = null;

// ============= DROP PIN ON MAP WITH COORDINATE VALIDATION =============
function dropPinAtLocation(lat, lon, spotName) {
    // Validate coordinates to prevent [0,0] or invalid pins
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        console.warn(`Invalid coordinates for ${spotName}: lat=${lat}, lon=${lon}`);
        return null;
    }
    
    // Prevent pins at [0,0] (center of Earth)
    if (lat === 0 && lon === 0) {
        console.warn(`Prevented pin drop at [0,0] for ${spotName}`);
        return null;
    }
    
    //  Validate coordinates are in reasonable range for UMN campus
    // UMN is around lat: 44.97, lon: -93.23
    const validLatRange = lat >= 44.9 && lat <= 45.1;
    const validLonRange = lon >= -93.3 && lon <= -93.1;
    
    if (!validLatRange || !validLonRange) {
        console.warn(`Coordinates outside UMN campus area for ${spotName}: lat=${lat}, lon=${lon}`);
        // Don't return - still allow it, but warn
    }

    // Remove existing marker if any
    if (currentMarker) {
        currentMarker.remove();
    }

    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-map-marker';
    markerEl.style.backgroundImage = "url('/static/destination_pin.png')";
    markerEl.style.width = '36px';
    markerEl.style.height = '36px';
    markerEl.style.backgroundSize = 'contain';
    markerEl.style.backgroundRepeat = 'no-repeat';
    markerEl.style.backgroundPosition = 'center';
    markerEl.style.cursor = 'pointer';

    // Create marker
    currentMarker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'bottom'
    })
        .setLngLat([lon, lat])
        .addTo(map);

    // Fly to location
    map.flyTo({
        center: [lon, lat],
        zoom: 17,
        speed: 1.5,
        curve: 1.2,
        essential: true
    });

    // Add click event to marker
    markerEl.addEventListener('click', () => {
        console.log(`Clicked marker for spot: ${spotName}`);
        
    });

    return currentMarker;
}

// ============= SEARCH BAR DISPLAY ITEMS =============
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results-container');
let searchTimeout = null;

if (searchInput && searchResultsContainer) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        if (query.length === 0) {
            searchResultsContainer.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    searchResultsContainer.innerHTML = '';

                    data.data.forEach(spot => {
                        const spotDiv = document.createElement('div');
                        spotDiv.className = 'search-result-item';
                        
                        const spotName = spot.spot_name || spot.street_name || 'Parking Spot';
                        const costText = spot.cost != null ? `$${spot.cost}/hr` : 'Cost N/A';
                        const typeText = spot.parking_type ? `(${spot.parking_type})` : '';
                        
                        spotDiv.textContent = `${spotName} - ${costText} ${typeText}`.trim();
                        spotDiv.style.cursor = 'pointer';

                        spotDiv.addEventListener('click', async () => {
                            // Store selected spot
                            selectedSpot = spot;
                            
                            const lat = Number(spot.latitude);
                            const lon = Number(spot.longitude);

                            if (Number.isFinite(lat) && Number.isFinite(lon)) {
                                const marker = dropPinAtLocation(lat, lon, spotName);
                                
                                if (marker) {
                                    // Clear search
                                    searchInput.value = '';
                                    searchResultsContainer.innerHTML = '';

                                    // Close sidebar
                                    if (sidebar && menuButton && parkingSuggestionBtn) {
                                        sidebar.classList.remove('open');
                                        menuButton.classList.remove('hidden');
                                        parkingSuggestionBtn.classList.remove('visible');
                                        menuButton.classList.remove('active');
                                    }

                                    // Open directions modal instead of just showing suggestions
                                    showDirectionsModal(spot);
                                }
                            } else {
                                console.log('Location coordinates not available for this spot');
                            }
                        });
                        
                        searchResultsContainer.appendChild(spotDiv);
                    });
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
    });

    // Enter key handler for search
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const query = searchInput.value.trim();
            if (query.length === 0) {
                return;
            }
            // Click first result if available
            if (searchResultsContainer.firstElementChild) {
                searchResultsContainer.firstElementChild.click();
            }
        }
    });
}

// ============= DISPLAY SUGGESTIONS =============
async function displaySuggestions(selectedSpot, userLat, userLon) {
    const container = document.getElementById('suggestions-container');
    const title = document.getElementById('suggestions-title');
    
    if (!container || !title) {
        console.error('Suggestions container or title not found');
        return;
    }

    // Clear previous suggestions
    container.innerHTML = '';
    title.style.display = 'block';

    try {
        const response = await fetch('/api/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selected_spot_id: selectedSpot.spot_id,
                user_lat: userLat,
                user_lon: userLon
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // User not logged in
                const card = document.createElement('div');
                card.className = 'spot-card';
                card.style.display = 'block';
                card.innerHTML = '<div class="spot-header"><div class="spot-title">Sign in to see personalized suggestions</div></div>';
                container.appendChild(card);
                return;
            }
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
            data.data.forEach((spot, index) => {
                const card = createSpotCard(spot, index + 1, false);
                container.appendChild(card);
            });
        } else {
            const card = document.createElement('div');
            card.className = 'spot-card';
            card.style.display = 'block';
            card.innerHTML = '<div class="spot-header"><div class="spot-title">No suggestions available</div></div>';
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        const card = document.createElement('div');
        card.className = 'spot-card';
        card.style.display = 'block';
        card.innerHTML = '<div class="spot-header"><div class="spot-title">Error loading suggestions</div></div>';
        container.appendChild(card);
    }
}

// ============= CREATE SPOT CARD WITH DIRECTIONS CHECK =============
function createSpotCard(spot, rank, fromFilter = false) {
    const card = document.createElement('div');
    card.className = 'spot-card';
    card.style.display = 'block';

    const costText = spot.cost != null ? `$${Number(spot.cost).toFixed(2)}/hr` : 'N/A';
    const walkTime = spot.walk_time || 'Unknown';
    
    // Check if spot has valid coordinates for directions
    const hasValidCoords = spot.latitude && spot.longitude && 
                          Number.isFinite(Number(spot.latitude)) && 
                          Number.isFinite(Number(spot.longitude)) &&
                          !(Number(spot.latitude) === 0 && Number(spot.longitude) === 0);

    const buttonText = hasValidCoords ? 'Get Directions →' : 'No Directions Available';
    const buttonDisabled = hasValidCoords ? '' : 'disabled';
    const buttonStyle = hasValidCoords ? '' : 'opacity: 0.5; cursor: not-allowed;';

    card.innerHTML = `
        <div class="spot-header">
            <div class="spot-title">${rank}. ${spot.spot_name || 'Parking Spot'}</div>
            <span class="spot-type-badge">${spot.parking_type || 'Parking'}</span>
        </div>
        <div class="spot-details">
            <div class="spot-detail-item">
                <span class="detail-label">Location</span>
                <span class="detail-value">${spot.campus_location || 'N/A'}</span>
            </div>
            <div class="spot-detail-item">
                <span class="detail-label">Walk Time</span>
                <span class="detail-value">${walkTime}</span>
            </div>
            <div class="spot-detail-item">
                <span class="detail-label">Cost</span>
                <span class="detail-value">${costText}</span>
            </div>
        </div>
        <div class="spot-actions">
            <button class="go-to-spot-btn" data-spot-id="${spot.spot_id}" ${buttonDisabled} style="${buttonStyle}">
                ${buttonText}
            </button>
        </div>
    `;

    const btn = card.querySelector('.go-to-spot-btn');
    if (hasValidCoords) {
        btn.addEventListener('click', () => {
            handleSpotSelection(spot);
        });
    }
    
    return card;
}

// ============= HANDLE SPOT SELECTION =============
function handleSpotSelection(spot) {
    // Store the destination
    window.destinationSpot = spot;

    // Close sidebar
    if (sidebar && menuButton && parkingSuggestionBtn) {
        sidebar.classList.remove('open');
        menuButton.classList.remove('hidden');
        parkingSuggestionBtn.classList.remove('visible');
        menuButton.classList.remove('active');
    }

    // Drop new pin for destination
    const lat = Number(spot.latitude);
    const lon = Number(spot.longitude);
    
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
        dropPinAtLocation(lat, lon, spot.spot_name);
    }

    // Show directions modal
    showDirectionsModal(spot);
}

// ============= NAVIGATION STATE =============
let navigationActive = false;
let userLocationMarker = null;
let watchPositionId = null;
let currentTravelMode = 'driving';
let destinationCoords = null;
let currentRouteSummary = null;

// ============= SHOW DIRECTIONS MODAL =============
function showDirectionsModal(spot) {
    const modal = document.getElementById('directions-modal');
    const destinationName = document.getElementById('destination-name');

    if (!modal || !destinationName) {
        console.error('Directions modal elements not found');
        return;
    }

    destinationName.textContent = spot.spot_name || 'Destination';
    destinationCoords = [Number(spot.longitude), Number(spot.latitude)];

    modal.classList.add('open');
    calculateRoute(currentTravelMode);
}

// ============= CALCULATE ROUTE =============
async function calculateRoute(mode) {
    try {
        if (!destinationCoords || !Number.isFinite(destinationCoords[0]) || !Number.isFinite(destinationCoords[1])) {
            console.warn('Invalid destination coordinates for routing');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const userCoords = [position.coords.longitude, position.coords.latitude];
            const profile = mode === 'walking' ? 'foot' : 'car';
            const url = `https://router.project-osrm.org/route/v1/${profile}/${userCoords.join(',')};${destinationCoords.join(',')}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceMiles = route.distance / 1609.34; // meters to miles
                let duration = route.duration / 60; // seconds to minutes
                
                // Adjust walking time by 1.3-1.5x (1.4x as middle ground)
                if (mode === 'walking') {
                    duration = duration * 1.4;
                }
                
                currentRouteSummary = {
                    distanceMiles,
                    durationMinutes: duration,
                    mode
                };

                const roundedDuration = Math.max(1, Math.round(duration));

                const distanceEl = document.getElementById('route-distance');
                const durationEl = document.getElementById('route-duration');
                
                if (distanceEl) distanceEl.textContent = `${distanceMiles.toFixed(1)} mi`;
                if (durationEl) durationEl.textContent = `${roundedDuration} min`;

                drawRouteOnMap(route.geometry);
            }
        }, (error) => {
            console.error('Geolocation error:', error);
        });
    } catch (error) {
        console.error('Route calculation error:', error);
    }
}

// ============= DRAW ROUTE ON MAP =============
function drawRouteOnMap(geometry) {
    // Remove existing route if any
    if (map.getLayer('route')) {
        map.removeLayer('route');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }

    // Add new route
    map.addSource('route', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': geometry
        }
    });

    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#7A0019',
            'line-width': 4,
            'line-opacity': 0.75
        }
    });
}

// ============= TRAVEL MODE TOGGLE =============
const modeDrivingBtn = document.getElementById('mode-driving');
const modeWalkingBtn = document.getElementById('mode-walking');

if (modeDrivingBtn && modeWalkingBtn) {
    modeDrivingBtn.addEventListener('click', () => {
        currentTravelMode = 'driving';
        modeDrivingBtn.classList.add('active');
        modeWalkingBtn.classList.remove('active');
        calculateRoute('driving');
    });

    modeWalkingBtn.addEventListener('click', () => {
        currentTravelMode = 'walking';
        modeWalkingBtn.classList.add('active');
        modeDrivingBtn.classList.remove('active');
        calculateRoute('walking');
    });
}

// ============= START NAVIGATION =============
const startNavBtn = document.getElementById('start-navigation-btn');
const directionsModal = document.getElementById('directions-modal');
const navigationOverlay = document.getElementById('navigation-overlay');

if (startNavBtn && directionsModal && navigationOverlay) {
    startNavBtn.addEventListener('click', () => {
        if (!destinationCoords) {
            console.warn('No destination set');
            return;
        }
        
        directionsModal.classList.remove('open');
        navigationOverlay.classList.add('active');
        navigationActive = true;
        startLocationTracking();
    });
}

// ============= LOCATION TRACKING =============
function startLocationTracking() {
    if (navigator.geolocation) {
        watchPositionId = navigator.geolocation.watchPosition(
            updateUserPosition,
            (error) => {
                console.error('Location tracking error:', error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        );
    }
}

function updateUserPosition(position) {
    const userCoords = [position.coords.longitude, position.coords.latitude];

    // Update or create user location marker
    if (!userLocationMarker) {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.backgroundImage = "url('/static/user_location_pin.png')";
        el.style.width = '28px';
        el.style.height = '28px';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';

        userLocationMarker = new maplibregl.Marker({
            element: el
        })
            .setLngLat(userCoords)
            .addTo(map);
    } else {
        userLocationMarker.setLngLat(userCoords);
    }

    if (!destinationCoords) {
        return;
    }

    // Calculate distance to destination
    const distanceToDestination = calculateDistanceInMiles(
        position.coords.latitude,
        position.coords.longitude,
        destinationCoords[1],
        destinationCoords[0]
    );

    // Update navigation stats
    const distanceEl = document.getElementById('nav-distance-left');
    if (distanceEl) {
        distanceEl.textContent = `${distanceToDestination.toFixed(2)} mi`;
    }
    const etaEl = document.getElementById('nav-eta');
    if (etaEl) {
        etaEl.textContent = formatEta(getEtaMinutes(distanceToDestination));
    }

    // Check if arrived (within ~0.03 miles)
    if (distanceToDestination < 0.03) {
        endNavigation(true);
    }

    // Recenter map on user
    map.flyTo({
        center: userCoords,
        zoom: 16,
        duration: 1000
    });
}

function getEtaMinutes(distanceMiles) {
    if (!Number.isFinite(distanceMiles) || distanceMiles <= 0) {
        return 0;
    }

    let milesPerMinute = null;
    if (currentRouteSummary &&
        Number.isFinite(currentRouteSummary.distanceMiles) &&
        Number.isFinite(currentRouteSummary.durationMinutes) &&
        currentRouteSummary.distanceMiles > 0 &&
        currentRouteSummary.durationMinutes > 0) {
        milesPerMinute = currentRouteSummary.distanceMiles / currentRouteSummary.durationMinutes;
    }

    if (!milesPerMinute || milesPerMinute <= 0) {
        milesPerMinute = currentTravelMode === 'walking' ? 0.05 : 0.4;
    }

    const eta = distanceMiles / milesPerMinute;
    return Math.max(1, Math.round(eta));
}

function formatEta(minutes) {
    if (!Number.isFinite(minutes)) {
        return '...';
    }
    if (minutes <= 0) {
        return 'Arrived';
    }
    if (minutes < 1) {
        return '<1 min';
    }
    return `${minutes} min`;
}

function calculateDistanceInMiles(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============= END NAVIGATION =============
const endNavBtn = document.getElementById('end-nav-btn');

if (endNavBtn) {
    endNavBtn.addEventListener('click', () => {
        endNavigation(false);
    });
}

function endNavigation(arrived) {
    // Stop tracking
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
    }

    // Hide overlay
    if (navigationOverlay) {
        navigationOverlay.classList.remove('active');
    }
    navigationActive = false;

    // Remove user marker
    if (userLocationMarker) {
        userLocationMarker.remove();
        userLocationMarker = null;
    }
    
    // Remove the destination pin
    if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
    }
    
    // Remove route from map
    if (map.getLayer('route')) {
        map.removeLayer('route');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }
    
    // Clear destination coords
    destinationCoords = null;

    if (arrived) {
        console.log('You have arrived at your destination!');
    }
}

// ============= CLOSE DIRECTIONS MODAL =============
const closeDirectionsBtn = document.getElementById('close-directions-btn');

if (closeDirectionsBtn) {
    closeDirectionsBtn.addEventListener('click', () => {
        if (directionsModal) {
            directionsModal.classList.remove('open');
        }
        
        // Remove the pin when closing directions
        if (currentMarker) {
            currentMarker.remove();
            currentMarker = null;
        }
        
        // Remove route from map
        if (map.getLayer('route')) {
            map.removeLayer('route');
        }
        if (map.getSource('route')) {
            map.removeSource('route');
        }
        
        // Clear destination coords
        destinationCoords = null;
    });
}

// ============= GET LOCATION ON LOAD =============
getUserLocation();

function getUserLocation() {
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    } catch (error) {
        console.error('Error getting user location:', error);
    }
}

function showPosition(position) {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    console.log(`User location: Latitude ${userLat}, Longitude ${userLon}`);
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}
