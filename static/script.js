document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.nric-char');
    const statusMessage = document.getElementById('statusMessage');
    const barcodeDisplay = document.getElementById('barcodeDisplay');

    // Auto-focus logic and Input handling
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;

            // Allow alpha for first and last, numeric for middle
            if (index > 0 && index < 8) {
                if (!/^\d*$/.test(value)) {
                    e.target.value = ''; // Clear if not digit
                    return;
                }
            }

            if (value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // Last character entered, trigger validation
                    input.blur(); // Remove focus
                    validateNRIC();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // Paste handler
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim().toUpperCase();
            if (!pasteData) return;

            let charIndex = 0;
            // Find current input index or start from 0 if pasting into first
            let startIdx = index;

            // If pasting full NRIC (9 chars), fill all
            if (pasteData.length === 9) {
                startIdx = 0;
            }

            for (let i = startIdx; i < inputs.length && charIndex < pasteData.length; i++) {
                inputs[i].value = pasteData[charIndex];
                charIndex++;
            }

            // If filled mostly/all, focus last or validate
            if (startIdx + charIndex >= 9) {
                validateNRIC();
                inputs[8].blur(); // Blur the last one
            } else {
                // specific focus logic could go here
                const next = Math.min(8, startIdx + charIndex);
                inputs[next].focus();
            }
        });
    });

    async function validateNRIC() {
        // Collect NRIC
        let nric = '';
        inputs.forEach(input => nric += input.value);

        if (nric.length !== 9) {
            resetState();
            return;
        }

        // Show loading state if desired, or just wait for fetch

        try {
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

        inputs.forEach(input => {
            input.classList.remove('invalid');
            input.classList.add('valid');
        });

        if (barcodeUrl) {
            barcodeDisplay.style.display = 'block';
            barcodeDisplay.innerHTML = `<div class="barcode-wrapper"><img src="${barcodeUrl}" alt="Barcode"></div>`;
        }
    }

    function setInvalidState(msg) {
        statusMessage.textContent = msg;
        statusMessage.className = 'status-message invalid-text';

        inputs.forEach(input => {
            input.classList.remove('valid');
            input.classList.add('invalid');
        });

        barcodeDisplay.style.display = 'none';
        barcodeDisplay.innerHTML = '';
    }

    function resetState() {
        statusMessage.textContent = '';
        barcodeDisplay.style.display = 'none';
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
    }
});
