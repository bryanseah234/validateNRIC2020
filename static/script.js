document.addEventListener('DOMContentLoaded', () => {
    const wheels = document.querySelectorAll('.wheel-column');
    const validateBtn = document.getElementById('validateBtn');
    const statusMessage = document.getElementById('statusMessage');
    const barcodeDisplay = document.getElementById('barcodeDisplay');

    // Intersection Observer to detect which item is selected (centered)
    // Actually we use scrollTop.

    // TAB LOGIC
    const tabs = document.querySelectorAll('.tab-button');
    const views = document.querySelectorAll('.input-view');
    let currentMode = 'wheel'; // 'wheel' or 'manual'

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Switch Tab UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch View
            const target = tab.getAttribute('data-tab');
            currentMode = target;
            views.forEach(v => v.style.display = 'none');

            if (target === 'wheel') {
                document.getElementById('wheel-view').style.display = 'block';
                // Sync Manual -> Wheel (in case user typed in manual)
                syncAllToWheels();
            } else {
                document.getElementById('manual-view').style.display = 'block';
                // Wheel inputs are already synced to wheel data, need to sync Wheel -> Manual
                syncAllToManual();
            }
        });
    });

    const hybridInputs = document.querySelectorAll('.hybrid-input'); // Inputs inside wheels
    const manualInputs = document.querySelectorAll('.manual-input'); // Inputs in manual view

    // DATA SYNC LOGIC
    // We have a 'master' state effectively.
    // When Wheel moves -> Updates Hybrid Input -> Should Update Manual Input?
    // When Manual Input types -> Should Update Hybrid Input + Wheel?
    // Yes, keep them in sync.

    function syncAllToManual() {
        // Copy values from Hybrid Inputs (which reflect wheels) to Manual Inputs
        hybridInputs.forEach((hInput, i) => {
            manualInputs[i].value = hInput.value;
        });
    }

    function syncAllToWheels() {
        // Copy values from Manual Inputs to Wheels (and Hybrid Inputs)
        manualInputs.forEach((mInput, i) => {
            const val = mInput.value.toUpperCase();
            if (val) {
                const wheel = document.getElementById(`wheel-${i}`);
                // Find item
                const items = Array.from(wheel.querySelectorAll('.wheel-item'));
                const targetItem = items.find(item => item.getAttribute('data-value') === val);
                if (targetItem) {
                    const itemIndex = items.indexOf(targetItem);
                    wheel.scrollTop = itemIndex * 40;
                    hybridInputs[i].value = val;
                }
            }
        });
    }

    // SYNC: Wheel -> Input
    // When wheel scrolls, update the input value to match the snapped item.
    let isManualScrolling = false;
    let scrollTimeout;

    // LISTENER UPDATES
    // 1. Wheel Scroll -> Updates Hybrid Input (Existing) -> Add Sync to Manual
    const updateInputValue = (wheelIndex) => {
        const wheel = document.getElementById(`wheel-${wheelIndex}`);
        const input = document.querySelector(`.hybrid-input[data-index="${wheelIndex}"]`);
        const manualInput = document.querySelector(`.manual-input[data-index="${wheelIndex}"]`);

        const val = getSelectedValue(wheel);
        input.value = val;
        if (manualInput) manualInput.value = val;
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
            const manualInput = document.querySelector(`.manual-input[data-index="${index}"]`);

            if (manualInput) manualInput.value = val; // Sync to manual

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

        // When focusing, we might want to ensure the input shows the current wheel value if it was empty?
        // Or if it's transparent, it effectively shows it. 
        // But if we have opaque background on focus, we MUST populate value.
        // The updateInputValue function does this on scroll.
        // So value should be always correct.

        input.addEventListener('focus', (e) => {
            e.target.select(); // Auto-select text so typing replaces it
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

    // 3. Manual Input Type -> Update Wheel + Hybrid
    manualInputs.forEach(mInput => {
        mInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase(); // Force upper
            const val = e.target.value;
            const index = mInput.getAttribute('data-index');

            // Sync to Wheel System
            const wheel = document.getElementById(`wheel-${index}`);
            const hInput = document.querySelector(`.hybrid-input[data-index="${index}"]`);

            if (hInput) hInput.value = val;

            // Find item
            const items = Array.from(wheel.querySelectorAll('.wheel-item'));
            const targetItem = items.find(item => item.getAttribute('data-value') === val);
            if (targetItem) {
                const itemIndex = items.indexOf(targetItem);
                wheel.scrollTop = itemIndex * 40;
            }

            // Auto-focus next
            if (val && index < 8) {
                const next = document.querySelector(`.manual-input[data-index="${parseInt(index) + 1}"]`);
                if (next) next.focus();
            }
        });

        // Backspace
        mInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                const index = mInput.getAttribute('data-index');
                if (index > 0) {
                    const prev = document.querySelector(`.manual-input[data-index="${parseInt(index) - 1}"]`);
                    if (prev) prev.focus();
                }
            }
        });
    });

    // Validating NRIC update to use inputs directly? 
    // Or keep using wheels? Input and Wheel should be in sync, so either is fine.
    // However, when a view is hidden (display: none), scrollTop might be 0 or unreliable on some browsers/versions.
    // So we should read from the inputs which are reliable in DOM.
    // Since we sync wheel<->hybrid<->manual, reading from hybridInputs is safe if in wheel mode,
    // and reading from manualInputs is safe if in manual mode.

    // Helper to collect NRIC
    function collectNRIC() {
        let nric = '';
        if (currentMode === 'wheel') {
            // Read directly from wheels
            wheels.forEach(wheel => {
                nric += getSelectedValue(wheel);
            });
        } else {
            manualInputs.forEach(input => nric += input.value);
        }
        return nric;
    }

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
        let nric = collectNRIC();

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
                let msg = data.message;
                if (data.expected) {
                    msg += ` Did you mean ends with ${data.expected}?`;
                }
                setInvalidState(msg);
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
            // UI Swap: Hide Wheels/Inputs, Show Barcode
            // Hide Wheel Wrapper content? 
            document.querySelectorAll('.wheel-wrapper').forEach(el => el.style.visibility = 'hidden'); // Using visibility to keep layout size? No display none is better.
            document.querySelectorAll('.wheel-wrapper').forEach(el => el.style.display = 'none');

            // Hide Manual Inputs?
            document.querySelectorAll('.manual-input').forEach(el => el.style.display = 'none');

            const overlay = document.getElementById('wheelOverlay');
            if (overlay) overlay.style.display = 'none';

            // Show Barcode in Active View
            const activeBarcodeId = currentMode === 'wheel' ? 'barcodeActiveDisplay' : 'barcodeActiveDisplayManual';
            // Actually, simply show both or the correct one.
            const barcodeHTML = `<img src="${barcodeUrl}" alt="Barcode">`;

            if (currentMode === 'wheel') {
                const display = document.getElementById('barcodeActiveDisplay');
                if (display) {
                    display.style.display = 'flex';
                    display.innerHTML = barcodeHTML;
                }
            } else {
                const display = document.getElementById('barcodeActiveDisplayManual');
                if (display) {
                    display.style.display = 'flex';
                    display.innerHTML = barcodeHTML;
                }
            }

            // Lock tabs? User said "Ending screen shld be same". 
            // If user switches tab while result is showing, what happens?
            // Reset state? Or show result in other tab?
            // Let's show result in other tab if they switch.
            // This is handled by 'click' listener on tab which currently resets views/syncs. 
            // We might need to handle 'valid state' persistence across tabs.
            // For now, simplicity: switching tabs resets to input mode.

            // Update button
            validateBtn.textContent = 'Repeat';
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
        // Reset UI
        const wheelDisplay = document.getElementById('barcodeActiveDisplay');
        if (wheelDisplay) {
            wheelDisplay.style.display = 'none';
            wheelDisplay.innerHTML = '';
        }

        const manualDisplay = document.getElementById('barcodeActiveDisplayManual');
        if (manualDisplay) {
            manualDisplay.style.display = 'none';
            manualDisplay.innerHTML = '';
        }

        // UNHIDE WRAPPERS CORRECTLY
        document.querySelectorAll('.wheel-wrapper').forEach(el => {
            el.style.display = 'block';
            el.style.visibility = 'visible'; // Reset visibility too
        });

        wheels.forEach(w => w.style.display = 'block');

        document.querySelectorAll('.manual-input').forEach(el => el.style.display = 'block');

        const overlay = document.getElementById('wheelOverlay');
        if (overlay) overlay.style.display = 'block';

        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        validateBtn.textContent = 'Validate';

        // Ensure only active view is shown
        if (currentMode === 'wheel') {
            document.getElementById('wheel-view').style.display = 'block';
            document.getElementById('manual-view').style.display = 'none';
            syncAllToWheels();
        } else {
            document.getElementById('wheel-view').style.display = 'none';
            document.getElementById('manual-view').style.display = 'block';
            syncAllToManual();
        }
    }

    // Initial scroll setup
    wheels.forEach(wheel => {
        wheel.scrollTop = 0;
    });
});
