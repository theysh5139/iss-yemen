<script>
    // --- Custom Dropdown Logic (Replicating the screenshot's behavior) ---
    document.querySelectorAll('.custom-select-container').forEach(container => {
        const display = container.querySelector('.select-display');
        const options = container.querySelector('.select-options');
        const hiddenInput = container.querySelector('input[type="hidden"]');

        // Toggle options visibility
        display.addEventListener('click', () => {
            // Close other open dropdowns
            document.querySelectorAll('.select-options.show').forEach(openOptions => {
                if (openOptions !== options) {
                    openOptions.classList.remove('show');
                }
            });
            options.classList.toggle('show');
        });

        // Handle option selection
        options.querySelectorAll('.select-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                const text = option.textContent;

                // Update display and hidden input
                display.textContent = text;
                display.setAttribute('data-value', value);
                hiddenInput.value = value;

                // Close dropdown
                options.classList.remove('show');

                // Optional: visually mark selected item
                options.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.select-options.show').forEach(options => {
                options.classList.remove('show');
            });
        }
    });

    // --- Form Submission and Client-Side Validation ---
    const eventForm = document.getElementById('eventForm');

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Collect Form Data
        const formData = {
            title: document.getElementById('eventName').value,
            description: document.getElementById('description').value,
            date: document.getElementById('eventDate').value,
            capacity: parseInt(document.getElementById('capacity').value),
            link: document.getElementById('eventLink').value,
            category: document.getElementById('eventCategory').value,
            department: document.getElementById('organizingDepartment').value,
        };

        // 2. Client-Side Validation (Date Logic)
        const eventDate = new Date(formData.date);
        const now = new Date();

        if (eventDate <= now) {
            alert('❌ Validation Error: Event Date must be in the future.');
            return;
        }

        // 3. API Call (POST /events)
        console.log('Form data to be submitted:', formData);

        // --- START: PHP/API Integration Placeholder ---
        /*
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any necessary authorization headers (e.g., 'Authorization': 'Bearer token')
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('✅ Event created successfully! Event ID: ' + result.id);
                // Redirect or clear form after successful creation
                // window.location.href = 'manage_events.php';
            } else {
                // Handle server-side validation errors (e.g., title missing, capacity is zero)
                alert('❌ Failed to create event: ' + (result.message || 'Server error.'));
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('A network error occurred. Please try again.');
        }
        */
        // --- END: PHP/API Integration Placeholder ---
        alert('Form data validated and ready for POST request.\nCheck console for data object.');
    });

</script>