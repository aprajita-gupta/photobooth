document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const camera = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const countdown = document.getElementById('countdown');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Set canvas dimensions
    canvas.width = 640;
    canvas.height = 480;
    
    // Variables
    let stream;
    let capturedPhotos = [];
    let isCountingDown = false;
    let isCapturingSession = false;
    let currentFilter = 'normal';
    
    // Initialize camera
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }, 
                audio: false 
            });
            camera.srcObject = stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Unable to access camera. Please ensure you have granted permission.');
        }
    }
    
    // Apply active filter to video preview
    function applyFilterToVideo(filterName) {
        // Remove all filter classes
        camera.className = '';
        
        // Add the selected filter class
        camera.classList.add(`filter-${filterName}`);
        
        // Remove any existing overlay effects
        removeOverlayEffects();
        
        // Add specific overlay effects based on filter
        if (filterName === 'grain') {
            addGrainEffect();
        } else if (filterName === 'film') {
            addFilmEffect();
        }
    }
    
    // Remove all overlay effects
    function removeOverlayEffects() {
        const existingGrain = document.getElementById('grain-overlay');
        if (existingGrain) {
            existingGrain.remove();
        }
        
        const existingVignette = document.getElementById('vignette-overlay');
        if (existingVignette) {
            existingVignette.remove();
        }
    }
    
    // Add grain effect overlay
    function addGrainEffect() {
        // Create grain overlay
        const grainOverlay = document.createElement('div');
        grainOverlay.id = 'grain-overlay';
        grainOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==');
            opacity: 0.4;
            z-index: 3;
            pointer-events: none;
            mix-blend-mode: overlay;
        `;
        
        document.querySelector('.camera-container').appendChild(grainOverlay);
    }
    
    // Add film effect overlay (vignette)
    function addFilmEffect() {
        // Add grain for film effect
        addGrainEffect();
        
        // Create vignette overlay
        const vignetteOverlay = document.createElement('div');
        vignetteOverlay.id = 'vignette-overlay';
        vignetteOverlay.classList.add('vignette-overlay');
        
        document.querySelector('.camera-container').appendChild(vignetteOverlay);
    }
    
    // Capture photo with filter applied
    function capturePhoto() {
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Flip the image horizontally to match the mirrored video feed
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(camera, 0, 0, canvas.width, canvas.height);
        // Reset transformation
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply selected filter to the canvas
        applyFilterToCanvas(context, currentFilter);
        
        // Get photo data URL
        const photoData = canvas.toDataURL('image/png');
        
        // Store the filter used with the photo
        capturedPhotos.push({
            image: photoData,
            filter: currentFilter
        });
        
        // Check if we're done
        if (capturedPhotos.length >= 3) {
            isCapturingSession = false;
            // Save to sessionStorage
            sessionStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
            
            // Redirect to collage page
            setTimeout(() => {
                window.location.href = 'collage.html';
            }, 1000);
        } else {
            // Continue with next photo
            setTimeout(() => {
                if (isCapturingSession) {
                    startCountdown();
                }
            }, 1000);
        }
    }
    
    // Apply filter to canvas
    function applyFilterToCanvas(context, filterName) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        switch (filterName) {
            case 'bw': // Black and White
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // R
                    data[i + 1] = avg; // G
                    data[i + 2] = avg; // B
                }
                break;
                
            case 'grain':
                // Increase contrast slightly
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 * ((data[i] / 255 - 0.5) * 1.2 + 0.5);        // R
                    data[i + 1] = 255 * ((data[i + 1] / 255 - 0.5) * 1.2 + 0.5); // G
                    data[i + 2] = 255 * ((data[i + 2] / 255 - 0.5) * 1.2 + 0.5); // B
                }
                
                // Add grain
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random() * 30 - 15; // Random value between -15 and 15
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
                }
                break;
                
            case 'film':
                // Classic film colors - slightly muted, slight blue in shadows, slight yellow in highlights
                for (let i = 0; i < data.length; i += 4) {
                    // Adjust saturation - slightly less saturated
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Calculate luminance
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    
                    // Boost contrast slightly
                    const contrastFactor = 1.1;
                    const contrastAdjust = (contrastFactor * (luminance - 128)) + 128;
                    
                    // Slight blue tint in shadows, yellow in highlights
                    let rNew = r * 0.95;
                    let gNew = g * 0.95;
                    let bNew = b;
                    
                    if (luminance < 80) { // Shadows
                        bNew *= 1.05; // More blue in shadows
                    } else if (luminance > 180) { // Highlights
                        rNew *= 1.05; // More red in highlights
                        gNew *= 1.05; // More green in highlights (makes yellow with red)
                    }
                    
                    // Apply changes
                    data[i] = Math.max(0, Math.min(255, rNew));
                    data[i + 1] = Math.max(0, Math.min(255, gNew));
                    data[i + 2] = Math.max(0, Math.min(255, bNew));
                }
                
                // Add grain typical of film
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random() * 20 - 10; // Less intense grain than pure grain filter
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
                }
                
                // Apply vignette effect in the canvas
                applyVignetteToCanvas(context, canvas.width, canvas.height);
                break;
                
            case 'normal':
            default:
                // No changes for normal filter
                break;
        }
        
        context.putImageData(imageData, 0, 0);
    }
    
    // Apply vignette effect to canvas
    function applyVignetteToCanvas(ctx, width, height) {
        // Create a radial gradient for vignette
        const gradient = ctx.createRadialGradient(
            width/2, height/2, 0,     // Inner circle center and radius
            width/2, height/2, width  // Outer circle center and radius
        );
        
        // Set gradient colors for vignette
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
        
        // Draw vignette effect
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over'; // Reset to default
    }
    
    // Countdown function
    function startCountdown() {
        if (isCountingDown) return;
        isCountingDown = true;
        captureBtn.disabled = true;
        
        let count = 3;
        countdown.style.display = 'block';
        countdown.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdown.style.display = 'none';
                capturePhoto();
                isCountingDown = false;
                captureBtn.disabled = false;
            }
        }, 1000);
    }
    
    // Start the entire photo capture session
    function startCaptureSession() {
        if (isCapturingSession) return;
        
        // Reset photos if starting a new session
        capturedPhotos = [];
        isCapturingSession = true;
        
        // Start the first countdown
        startCountdown();
    }
    
    // Filter button click handler
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button styling
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Set current filter
            currentFilter = button.dataset.filter;
            
            // Apply filter to video preview
            applyFilterToVideo(currentFilter);
        });
    });
    
    // Event Listeners
    captureBtn.addEventListener('click', startCaptureSession);
    
    // Initialize
    initCamera();
    
    // Apply default filter (normal)
    applyFilterToVideo('normal');
});