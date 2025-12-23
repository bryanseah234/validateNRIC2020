document.addEventListener('DOMContentLoaded', () => {
    const wheels = document.querySelectorAll('.wheel-column');
    const validateBtn = document.getElementById('validateBtn');
    const statusMessage = document.getElementById('statusMessage');
    const barcodeDisplay = document.getElementById('barcodeDisplay');

    // Intersection Observer to detect which item is selected (centered)
    // Actually we use scrollTop.

    const hybridInputs = document.querySelectorAll('.hybrid-input');

    // SYNC: Wheel -> Input
    // When wheel scrolls, update the input value to match the snapped item.
    let isManualScrolling = false;
    let scrollTimeout;

    const updateInputValue = (wheelIndex) => {
        const wheel = document.getElementById(`wheel-${wheelIndex}`);
        const input = document.querySelector(`.hybrid-input[data-index="${wheelIndex}"]`);
        const val = getSelectedValue(wheel);
        input.value = val;
    };

    wheels.forEach((wheel, index) => {
        // Initial sync
        updateInputValue(index);

        wheel.addEventListener('scroll', () => {
            if (isManualScrolling) return; // Ignore scroll events triggered by code

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                updateInputValue(index);
            }, 100); // Wait for snap
        });

        // MOUSE SENSITIVITY FIX
        wheel.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY;
            // Reduce sensitivity: move partial amount
            // Or move exactly one item per tick?
            // "Too sensitive" implies it flies too fast.
            // Let's dampen it div by 5.
            wheel.scrollTop += delta / 3;
        });
    });

    // SYNC: Input -> Wheel
    hybridInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            const index = input.getAttribute('data-index');
            const wheel = document.getElementById(`wheel-${index}`);

            // Find item with this value
            const items = Array.from(wheel.querySelectorAll('.wheel-item'));
            const targetItem = items.find(item => item.getAttribute('data-value') === val);

            if (targetItem) {
                isManualScrolling = true;
                // Calculate scroll position
                // item offsetTop is relative to parent if positioned? 
                // wheel-padding is first child. 
                // index matches item index.
                const itemIndex = items.indexOf(targetItem);
                const itemHeight = 40;
                wheel.scrollTop = itemIndex * itemHeight;

                setTimeout(() => { isManualScrolling = false; }, 50);

                // Auto-advance focus
                if (val && index < 8) {
                    const nextInput = document.querySelector(`.hybrid-input[data-index="${parseInt(index) + 1}"]`);
                    if (nextInput) nextInput.focus();
                }
            }
        });

        input.addEventListener('focus', (e) => {
            // Optional: Highlight wheel
        });

        // Handle Backspace to go back
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                const index = input.getAttribute('data-index');
                if (index > 0) {
                    const prevInput = document.querySelector(`.hybrid-input[data-index="${parseInt(index) - 1}"]`);
                    if (prevInput) prevInput.focus();
                }
            }
        });
    });

    // Validating NRIC update to use inputs directly? 
    // Or keep using wheels? Input and Wheel should be in sync, so either is fine.
    // Let's keep logic reading from Wheels to be safe, or read from inputs.
    // Reading from wheels allows invalid visual states to be "valid" in code if we are not careful.
    // But since input drives wheel scroll, the wheel should be correct.

    // Helper to get selected value from a wheel

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
            // Hide hybrid inputs too
            document.getElementById('hybridOverlay').style.display = 'none';

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
        document.getElementById('hybridOverlay').style.display = 'flex';

        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        validateBtn.textContent = 'Validate';
    }

    // Initial scroll setup
    wheels.forEach(wheel => {
        wheel.scrollTop = 0;
    });
});
