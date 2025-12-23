document.addEventListener('DOMContentLoaded', () => {
    const wheels = document.querySelectorAll('.wheel-column');
    const validateBtn = document.getElementById('validateBtn');
    const statusMessage = document.getElementById('statusMessage');
    const barcodeDisplay = document.getElementById('barcodeDisplay');

    // Intersection Observer to detect which item is selected (centered)
    const observerOptions = {
        root: null, // relative to viewport, but inside the scroll container it works if we target children
        rootMargin: '-50% 0px -50% 0px', // check center line
        threshold: 0
    };

    // We need to query the state of each wheel when validating.
    // Instead of complex Observers for live updates, we can just calculate based on scrollTop.
    // Item height is 40px. Padding is 55px.

    // Helper to get selected value from a wheel
    function getSelectedValue(wheel) {
        const itemHeight = 40;
        const scrollTop = wheel.scrollTop;
        // The index is roughly scrollTop / itemHeight
        // snap behavior ensures it lands on an integer multiple
        const index = Math.round(scrollTop / itemHeight);

        const items = wheel.querySelectorAll('.wheel-item');
        if (index >= 0 && index < items.length) {
            return items[index].getAttribute('data-value');
        }
        return items[0].getAttribute('data-value'); // Fallback
    }

    // Smooth snap feedback (optional - adding class to centered item)
    // For now, let's keep it simple and just read on click.

    validateBtn.addEventListener('click', validateNRIC);

    async function validateNRIC() {
        // Collect NRIC
        let nric = '';
        wheels.forEach(wheel => {
            nric += getSelectedValue(wheel);
        });

        console.log("Validating NRIC:", nric);

        if (nric.length !== 9) {
            // Should not happen with fixed wheels, but good sanity check
            return;
        }

        try {
            statusMessage.textContent = 'Verifying...';
            statusMessage.className = 'status-message';

            const response = await fetch('/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nric: nric }),
            });

            const data = await response.json();

            // Update UI
            if (data.valid) {
                setValidState(data.message, data.barcode);
            } else {
                setInvalidState(data.message);
            }

        } catch (error) {
            console.error('Error:', error);
            setInvalidState("Server error occurred.");
        }
    }

    function setValidState(msg, barcodeUrl) {
        statusMessage.textContent = msg;
        statusMessage.className = 'status-message valid-text';

        if (barcodeUrl) {
            // UI Swap: Hide Wheels, Show Barcode in their place
            wheels.forEach(w => w.style.display = 'none');
            const overlay = document.getElementById('wheelOverlay');
            if (overlay) overlay.style.display = 'none';

            const startDisplay = document.getElementById('barcodeActiveDisplay');
            if (startDisplay) {
                startDisplay.style.display = 'flex';
                startDisplay.innerHTML = `<img src="${barcodeUrl}" alt="Barcode">`;
            }

            // Update button
            validateBtn.textContent = 'Repeat';

            // Note: If we use 'removeEventListener' we need the exact function reference.
            // validateNRIC logic is inside, so we are good.
            // But we need to handle the click logic cleanly.
            // Easiest is to check textContent inside the main click handler or swap handlers.
            // Let's swap the click behavior by flags or just check text.
        }

        // Hide bottom display as requested
        barcodeDisplay.style.display = 'none';
        barcodeDisplay.innerHTML = '';
    }

    function setInvalidState(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = 'status-message invalid-text';

        barcodeDisplay.style.display = 'none';
        barcodeDisplay.innerHTML = '';
    }

    // Modify click handler to handle "Repeat" state
    validateBtn.removeEventListener('click', validateNRIC);
    validateBtn.addEventListener('click', () => {
        if (validateBtn.textContent === 'Repeat') {
            resetState();
        } else {
            validateNRIC();
        }
    });

    function resetState() {
        // Reset UI to Wheel View
        const startDisplay = document.getElementById('barcodeActiveDisplay');
        if (startDisplay) {
            startDisplay.style.display = 'none';
            startDisplay.innerHTML = '';
        }

        wheels.forEach(w => w.style.display = 'block');
        const overlay = document.getElementById('wheelOverlay');
        if (overlay) overlay.style.display = 'block';

        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        validateBtn.textContent = 'Validate';
    }

    // Initial scroll setup
    wheels.forEach(wheel => {
        wheel.scrollTop = 0;
    });
});
