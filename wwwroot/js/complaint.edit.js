// Complaint Edit JavaScript (based on Create, but without auto-save)

document.addEventListener('DOMContentLoaded', function () {
    const titleInput = document.querySelector('input[name="Title"]');
    const descInput = document.querySelector('textarea[name="Description"]');
    const titleCount = document.getElementById('titleCount');
    const descCount = document.getElementById('descCount');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const btnLocate = document.getElementById('btnLocate');
    const locationInput = document.getElementById('locationInput');
    const locationSuggestions = document.getElementById('locationSuggestions');

    // Character counters
    if (titleInput && titleCount) {
        titleInput.addEventListener('input', () => {
            titleCount.textContent = titleInput.value.length;
        });
    }

    if (descInput && descCount) {
        descInput.addEventListener('input', () => {
            descCount.textContent = descInput.value.length;
        });
    }

    // Geolocation
    if (btnLocate) {
        btnLocate.addEventListener('click', function () {
            if (navigator.geolocation) {
                btnLocate.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                navigator.geolocation.getCurrentPosition(function (position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // Reverse geocoding using Nominatim
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.display_name) {
                                locationInput.value = data.display_name;
                            }
                            btnLocate.innerHTML = '<i class="bi bi-crosshair"></i>';
                        })
                        .catch(err => {
                            console.error(err);
                            btnLocate.innerHTML = '<i class="bi bi-crosshair"></i>';
                        });
                }, function (error) {
                    alert('Error getting location: ' + error.message);
                    btnLocate.innerHTML = '<i class="bi bi-crosshair"></i>';
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }

    // Address Autocomplete (Simple debounce)
    let timeoutId;
    if (locationInput) {
        locationInput.addEventListener('input', function () {
            clearTimeout(timeoutId);
            const query = this.value;
            if (query.length < 3) {
                locationSuggestions.style.display = 'none';
                return;
            }

            timeoutId = setTimeout(() => {
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                    .then(response => response.json())
                    .then(data => {
                        locationSuggestions.innerHTML = '';
                        if (data.length > 0) {
                            data.slice(0, 5).forEach(item => {
                                const a = document.createElement('a');
                                a.href = '#';
                                a.className = 'list-group-item list-group-item-action';
                                a.textContent = item.display_name;
                                a.addEventListener('click', function (e) {
                                    e.preventDefault();
                                    locationInput.value = item.display_name;
                                    locationSuggestions.style.display = 'none';
                                });
                                locationSuggestions.appendChild(a);
                            });
                            locationSuggestions.style.display = 'block';
                        } else {
                            locationSuggestions.style.display = 'none';
                        }
                    });
            }, 500);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function (e) {
            if (e.target !== locationInput && e.target !== locationSuggestions) {
                locationSuggestions.style.display = 'none';
            }
        });
    }

    // File preview & EXIF Extraction
    if (fileInput && filePreview) {
        fileInput.addEventListener('change', function (e) {
            filePreview.innerHTML = '';
            const files = e.target.files;

            if (files.length > 0) {
                const previewContainer = document.createElement('div');
                previewContainer.className = 'row g-2';

                Array.from(files).forEach((file, index) => {
                    const col = document.createElement('div');
                    col.className = 'col-6 col-md-4';

                    const card = document.createElement('div');
                    card.className = 'card border shadow-sm';
                    card.innerHTML = `
                        <div class="card-body p-2 text-center">
                            <i class="bi bi-file-earmark text-primary" style="font-size: 2rem;"></i>
                            <p class="small mb-0 mt-1 text-truncate">${file.name}</p>
                            <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
                        </div>
                    `;

                    col.appendChild(card);
                    previewContainer.appendChild(col);

                    // Try to extract EXIF if it's an image and location isn't set
                    if (file.type.startsWith('image/') && !locationInput.value) {
                        EXIF.getData(file, function () {
                            const lat = EXIF.getTag(this, "GPSLatitude");
                            const lon = EXIF.getTag(this, "GPSLongitude");

                            if (lat && lon) {
                                // Convert DMS to DD
                                const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
                                const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

                                const latDD = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "N" ? 1 : -1);
                                const lonDD = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === "E" ? 1 : -1);

                                // Reverse geocode
                                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latDD}&lon=${lonDD}`)
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.display_name) {
                                            locationInput.value = data.display_name;
                                        }
                                    });
                            }
                        });
                    }
                });

                filePreview.appendChild(previewContainer);
            }
        });
    }
});
