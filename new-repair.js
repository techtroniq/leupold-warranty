// Configuration for product-specific fields and issues
const productSpecificsConfig = {
    'Rifle Scope': {
        fields: ['magnification-group', 'objectiveLens-group', 'reticleType-group'],
        issues: 'rifle-scope-issues',
        placeholder: 'e.g., Mark 5HD 5-25x56',
        serialRequired: true
    },
    'Spotting Scope': {
        fields: [], // Add specific field group IDs if any are created later
        issues: 'spotting-scope-issues',
        placeholder: 'e.g., SX-4 Pro Guide HD 20-60x85',
        serialRequired: false
    },
    'Binocular': {
        fields: [],
        issues: 'binocular-issues',
        placeholder: 'e.g., BX-4 Pro Guide HD 10x42',
        serialRequired: false
    },
    'Rangefinder': {
        fields: ['maxRange-group', 'batteryType-group'],
        issues: 'rangefinder-issues',
        placeholder: 'e.g., RX-FullDraw 5',
        serialRequired: false
    },
    'Red Dot/Reflex Sight': {
        fields: [],
        issues: 'red-dot-issues',
        placeholder: 'e.g., DeltaPoint Pro',
        serialRequired: false
    },
    // Add other product types here if needed
    'Mounts & Accessories': { fields: [], issues: null, placeholder: 'e.g., Mark 4 Rings', serialRequired: false },
    'Other': { fields: [], issues: null, placeholder: 'Specify product', serialRequired: false },
    'Eyewear': { fields: [], issues: null, placeholder: 'e.g., Sentinel Performance Eyewear', serialRequired: false }
};

// --- DOM Element References ---
const productTypeSelect = document.getElementById('productType');
const productNameInput = document.getElementById('product');
const productSpecificFieldsContainer = document.getElementById('product-specific-fields');
const allIssueSections = document.querySelectorAll('.product-issues');
const allSpecificFieldGroups = document.querySelectorAll('.specific-field-group'); // Add this class to groups like magnification-group
const repairForm = document.getElementById('repair-form');
const successMessageDiv = document.getElementById('success-message');
const serialNumberGroup = document.getElementById('serialNumber-group'); // Assuming the serial number field is in a div with this ID
const serialNumberInput = document.getElementById('serialNumber');
const serialNumberError = document.getElementById('serialNumber-error');
const replacementApprovalSection = document.getElementById('replacement-approval'); // Get the replacement approval section
const cancelBtn = document.getElementById('cancel-btn'); // Get reference to cancel button

// --- New Elements for Multi-Step ---
const progressIndicator = document.getElementById('progress-indicator');
const formSteps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4') // Add step 4
];
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
let currentStep = 1;
const totalSteps = formSteps.length; // totalSteps will now be 4
// --- End New Elements ---

// Add references for new validation targets
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phone-error');
const stateInput = document.getElementById('state');
const stateError = document.getElementById('state-error');
const zipCodeInput = document.getElementById('zipCode');
const zipCodeError = document.getElementById('zipCode-error');

// --- Helper Functions ---

// Updates the placeholder text for the product name input
function updateProductNamePlaceholder(productType) {
    const config = productSpecificsConfig[productType];
    productNameInput.placeholder = config?.placeholder || 'Product Name/Model';
}

// Shows/hides fields and issue sections based on selected product type
function toggleProductFields() {
    const selectedType = productTypeSelect.value;
    const config = productSpecificsConfig[selectedType];

    // Ensure replacementApprovalSection is defined before using it
    const replacementApprovalSection = document.getElementById('replacement-approval');

    if (!config) {
        productSpecificFieldsContainer.style.display = 'none';
        // Hide replacement section if no product type is selected or config is missing
        if (replacementApprovalSection) replacementApprovalSection.style.display = 'none';
        return;
    }

    productSpecificFieldsContainer.style.display = 'block';

    // Toggle visibility of common specific field groups
    allSpecificFieldGroups.forEach(group => {
        group.style.display = config.fields.includes(group.id) ? 'block' : 'none';
    });

    // Toggle visibility of issue sections
    allIssueSections.forEach(section => {
        section.style.display = section.id === config.issues ? 'block' : 'none';
    });

    // Toggle Serial Number requirement visibility and error
    if (serialNumberGroup) {
        const isRequired = selectedType === 'Rifle Scope'; // Check if type is Rifle Scope
        serialNumberGroup.style.display = isRequired ? 'block' : 'none'; // Show/hide based on type
        serialNumberInput.required = isRequired; // Set required attribute based on type

        // Add/remove asterisk or visual cue if desired (optional)
        // Example: document.querySelector('label[for="serialNumber"] span.required').style.display = isRequired ? 'inline' : 'none';
        if (!isRequired) {
            // If not required, hide any existing error message when type changes
            hideValidationError(serialNumberInput, serialNumberError);
        }
    }

    // Toggle Replacement Approval section based on product type (example: show only for scopes)
    // This logic remains the same, but it now affects the section within Step 4
    if (replacementApprovalSection) {
        const showReplacement = ['Rifle Scope', 'Spotting Scope', 'Red Dot/Reflex Sight'].includes(selectedType);
        replacementApprovalSection.style.display = showReplacement ? 'block' : 'none';
    }

    updateProductNamePlaceholder(selectedType);
}

// Generates a unique-ish ID for the repair request
function generateRepairId() {
    // R- + timestamp last 6 digits + random hex string
    return 'R-' + Date.now().toString().slice(-6) + Math.random().toString(16).substring(2, 8);
}

// Shows a validation error for a specific field
function showValidationError(inputElement, errorElement, message = null) {
    if (inputElement) inputElement.classList.add('is-invalid');
    if (errorElement) {
        if (message) errorElement.textContent = message; // Update message if provided
        errorElement.style.display = 'block'; // Use style directly as we removed .visible class
        errorElement.setAttribute('aria-hidden', 'false');
    }
}

// Hides a validation error for a specific field
function hideValidationError(inputElement, errorElement) {
    if (inputElement) inputElement.classList.remove('is-invalid');
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.setAttribute('aria-hidden', 'true');
    }
}

// --- New Step Validation Function ---
// Validates only the fields within the specified step number
function validateStep(stepNumber) {
    let isStepValid = true;
    const stepDiv = document.getElementById(`step-${stepNumber}`);
    if (!stepDiv) return false; // Step element not found

    // Define required fields per step (example - adapt as needed)
    // Note: issue checkboxes and description are handled specially below
    const requiredFieldsByStep = {
        1: ['returnName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'],
        2: ['productType', 'product'], // Serial number handled conditionally
        3: [], // Issue checkboxes/description handled below
        4: [] // Step 4 (Replacement Approval)
    };

    // --- Get all visible and required input/select/textarea elements WITHIN the current step ---
    // Select potentially required elements, even if `required` attribute isn't set (like our description)
    const inputs = stepDiv.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Only validate if the input is potentially required for this step and visible
        const isGenerallyRequired = input.hasAttribute('required') || (requiredFieldsByStep[stepNumber] && requiredFieldsByStep[stepNumber].includes(input.id));

        // Only validate visible elements (or hidden inputs)
        if (input.offsetParent !== null || input.type === 'hidden') {
            const errorElement = document.getElementById(`${input.id}-error`);
            let fieldValid = true;
            let specificErrorMessage = null; // For custom error messages

            // Basic emptiness check for generally required fields
            if (isGenerallyRequired && (input.type !== 'checkbox' && input.type !== 'radio')) {
                if (input.value.trim() === '') {
                    fieldValid = false;
                }
            }

            // Specific format validations (only if field is not empty or required)
            if ((fieldValid && input.value.trim() !== '') || (isGenerallyRequired && !fieldValid)) {
                if (input.id === 'email') {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                    if (!emailPattern.test(input.value.trim())) {
                        fieldValid = false;
                        specificErrorMessage = 'Please enter a valid email address.';
                    }
                } else if (input.id === 'phone') {
                    // Use the validation function which also checks length after formatting
                    if (!validatePhoneNumber(input, errorElement, false)) { // Pass false to prevent immediate showing
                        fieldValid = false;
                        specificErrorMessage = 'Please enter a valid 10-digit phone number.';
                    }
                } else if (input.id === 'state') {
                    if (!validateState(input, errorElement, false)) {
                        fieldValid = false;
                        specificErrorMessage = 'Please enter a valid 2-letter state code.';
                    }
                } else if (input.id === 'zipCode') {
                    if (!validateZipCode(input, errorElement, false)) {
                        fieldValid = false;
                        specificErrorMessage = 'Please enter a valid 5-digit zip code.';
                    }
                }
                // Add other format validations here...
            }

            // Show/Hide errors based on field validity for standard inputs
            if (isGenerallyRequired || !fieldValid) { // Show error if required and invalid, or just invalid
                if (!fieldValid) {
                    showValidationError(input, errorElement, specificErrorMessage); // Pass custom message
                    isStepValid = false;
                } else {
                    hideValidationError(input, errorElement);
                }
            }
        }
    });

    // --- Step-Specific Validations ---

    // Step 2: Conditional Serial Number Validation
    if (stepNumber === 2) {
        const productType = productTypeSelect.value;
        const isSerialRequired = productSpecificsConfig[productType]?.serialRequired;
        if (isSerialRequired && serialNumberInput.offsetParent !== null) { // Check if visible
            if (serialNumberInput.value.trim() === '') {
                showValidationError(serialNumberInput, serialNumberError);
                isStepValid = false;
            } else {
                hideValidationError(serialNumberInput, serialNumberError);
            }
        }
    }

    // Step 3: Issue Selection and Description Validation
    if (stepNumber === 3) {
        // a) Check if at least one issue checkbox is selected
        const issueCheckboxes = stepDiv.querySelectorAll('.product-issues input[type="checkbox"]:checked');
        const issueErrorElement = document.getElementById('issue-selection-error'); // Dedicated error div for checkbox group
        if (issueCheckboxes.length === 0) {
            if (issueErrorElement) {
                issueErrorElement.textContent = 'Please select at least one issue.';
                issueErrorElement.style.display = 'block';
                issueErrorElement.setAttribute('aria-hidden', 'false');
            }
            isStepValid = false;
        } else {
            if (issueErrorElement) {
                issueErrorElement.style.display = 'none';
                issueErrorElement.setAttribute('aria-hidden', 'true');
            }
        }

        // b) Check if the issue description textarea has content *if* visible
        const issueDescriptionTextarea = document.getElementById('issue'); // Corrected ID
        const issueDescriptionErrorElement = document.getElementById('issue-error'); // Corrected ID
        // Only validate description if the textarea itself is visible (it might be hidden for some issue types)
        if (issueDescriptionTextarea && issueDescriptionTextarea.offsetParent !== null) {
             if (issueDescriptionTextarea.value.trim() === '') {
                showValidationError(issueDescriptionTextarea, issueDescriptionErrorElement, 'Please describe the issue.');
                isStepValid = false;
            } else {
                hideValidationError(issueDescriptionTextarea, issueDescriptionErrorElement);
            }
        }
    }

    // Step 4: Replacement Approval (if visible and contains required elements)
    if (stepNumber === 4) {
        const replacementRadios = stepDiv.querySelectorAll('input[name="replacementApproval"]');
        const replacementErrorElement = document.getElementById('replacement-approval-error');
        let replacementSelected = false;
        if (replacementApprovalSection.offsetParent !== null) { // Only validate if section is visible
            for (const radio of replacementRadios) {
                if (radio.checked) {
                    replacementSelected = true;
                    break;
                }
            }
            if (!replacementSelected) {
                 if (replacementErrorElement) {
                    replacementErrorElement.textContent = 'Please indicate your preference for potential replacement.';
                    replacementErrorElement.style.display = 'block';
                    replacementErrorElement.setAttribute('aria-hidden', 'false');
                }
                isStepValid = false;
            } else {
                if (replacementErrorElement) {
                    replacementErrorElement.style.display = 'none';
                    replacementErrorElement.setAttribute('aria-hidden', 'true');
                }
            }
        }
    }

    return isStepValid;
}
// --- End New Step Validation Function ---

// Validates the entire form (kept for final submission)
function validateForm() {
    let isValid = true;
    const formData = new FormData(repairForm);
    const selectedType = productTypeSelect.value;
    const config = productSpecificsConfig[selectedType];

    // --- Validation Checks ---

    // Required Text Fields
    const requiredTextFields = ['returnName', 'email', 'address', 'city', 'state', 'zipCode', 'product', 'issue'];
    requiredTextFields.forEach(id => {
        const input = document.getElementById(id);
        const error = document.getElementById(`${id}-error`);
        if (input && error) {
            if (input.value.trim() === '') {
                isValid = false;
                showValidationError(input, error);
            } else {
                hideValidationError(input, error);
            }
        }
    });

    // Email Format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // Improved email pattern
    if (emailInput && emailError && emailInput.value.trim() !== '' && !emailPattern.test(emailInput.value.trim())) {
        isValid = false;
        showValidationError(emailInput, emailError, 'Please enter a valid email address');
    } else if (emailInput.value.trim() !== '') {
        // Only hide if not empty and format is now valid (or was initially valid)
        // If it was empty, the required field check handles hiding/showing
        hideValidationError(emailInput, emailError);
    }

    // Phone Number Format
    const phoneDigits = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
    if (phoneInput && phoneError) { // Ensure elements exist
        if (phoneInput.value.trim() === '') {
            // Handled by required field check below, but ensure no format error shows if empty
            hideValidationError(phoneInput, phoneError);
        } else if (phoneDigits.length !== 10) { // Check for 10 digits if not empty
            isValid = false;
            showValidationError(phoneInput, phoneError, 'Please enter a 10-digit phone number');
        } else {
            // Exactly 10 digits are present
            hideValidationError(phoneInput, phoneError);
        }
    }

    // State Format
    const statePattern = /^[A-Z]{2}$/;
    if (stateInput && stateError && !statePattern.test(stateInput.value.trim())) {
        isValid = false;
        showValidationError(stateInput, stateError, 'Please enter a 2-letter state abbreviation');
    } else if (stateInput.value.trim() !== '') {
        hideValidationError(stateInput, stateError);
    }

    // Zip Code Format
    const zipPattern = /^\d{5}(-\d{4})?$/; // Allows 5 digits or 5+4 digits
    if (zipCodeInput && zipCodeError && !zipPattern.test(zipCodeInput.value.trim())) {
        isValid = false;
        showValidationError(zipCodeInput, zipCodeError, 'Please enter a valid 5-digit zip code');
    } else if (zipCodeInput.value.trim() !== '') {
        hideValidationError(zipCodeInput, zipCodeError);
    }

    // Serial Number (if required for product type)
    if (config?.serialRequired) {
        if (serialNumberInput.value.trim() === '') {
            isValid = false;
            showValidationError(serialNumberInput, serialNumberError);
        } else {
            hideValidationError(serialNumberInput, serialNumberError);
        }
    } else {
        // If not required, ensure error is hidden
        hideValidationError(serialNumberInput, serialNumberError);
    }

    // Replacement Approval (if visible)
    if (replacementApprovalSection && replacementApprovalSection.style.display !== 'none') {
        const approveYes = document.getElementById('approve-yes');
        const approveNo = document.getElementById('approve-no');
        const approvalError = document.getElementById('replacement-approval-error'); // Assuming an error div exists

        if (!approveYes.checked && !approveNo.checked) {
            isValid = false;
            if (approvalError) approvalError.style.display = 'block';
            // Optionally add visual indication to radio buttons/labels
        } else {
            if (approvalError) approvalError.style.display = 'none';
        }
    }

    // --- Scroll to first error (Optional UX improvement) ---
    if (!isValid) {
        const firstError = repairForm.querySelector('.is-invalid, .error-message[style*="block"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

// --- New Step Navigation Functions ---
function showStep(stepNumber) {
    // Hide all steps
    formSteps.forEach(step => step.style.display = 'none');
    // Show the current step
    if (formSteps[stepNumber - 1]) {
        formSteps[stepNumber - 1].style.display = 'block';
    }

    // Update Progress Indicator
    const stepTitles = ['Contact Information', 'Product Information', 'Issue Details', 'Replacement Approval']; // Add title for step 4
    if (progressIndicator && stepTitles[stepNumber - 1]) {
        progressIndicator.textContent = `Step ${stepNumber} of ${totalSteps}: ${stepTitles[stepNumber - 1]}`;
    }

    // Update Button Visibility and Text
    prevBtn.style.display = stepNumber > 1 ? 'inline-block' : 'none';
    cancelBtn.style.display = 'inline-block'; // Always show Cancel button

    if (stepNumber === totalSteps) {
        nextBtn.textContent = 'Submit Request';
    } else {
        nextBtn.textContent = 'Next';
    }

    // Ensure next button is always visible unless it's the success state (handled elsewhere)
    nextBtn.style.display = 'inline-block';
}

function nextStep() {
    // Validation is now handled in handleNextOrSubmit
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function cancelRepair() {
    // Optional: Ask for confirmation
    if (confirm("Are you sure you want to cancel this repair request? Any information entered will be lost.")) {
        window.location.href = 'index.html'; // Redirect to the main repair list page
    }
}

// --- New Handler for Next/Submit Button ---
function handleNextOrSubmit() {
    if (currentStep < totalSteps) {
        // Validate current step before proceeding
        const isStepValid = validateStep(currentStep);
        if (isStepValid) {
            nextStep(); // Go to next step if valid
        } else {
        }
    } else {
        // Last step: Programmatically trigger the form's submit event.
        // The 'submit' event listener on the form will handle validation and submission.
        repairForm.requestSubmit();
    }
}

// Handles form submission (triggered by form's 'submit' event)
function submitForm(event) {
    if (event) { // Prevent default form submission only if triggered by event
        event.preventDefault();
    }

    // Re-validate the *entire* form on final submission attempt
    if (!validateForm()) {
        // Optionally, find the first invalid field across all steps and focus it
        // Or display a general error message near the submit button
        const firstInvalid = repairForm.querySelector('.is-invalid');
        if (firstInvalid) {
            // Find which step the invalid field is in and show that step
            const invalidStepElement = firstInvalid.closest('.form-step');
            if (invalidStepElement) {
                const stepId = invalidStepElement.id; // e.g., "step-1"
                const stepNum = parseInt(stepId.split('-')[1]);
                if (stepNum && stepNum !== currentStep) {
                    showStep(stepNum); // Navigate to the step with the error
                }
                // Scroll to and focus the invalid field
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();

                // Display a general message if needed
                const generalErrorArea = document.getElementById('form-navigation'); // Or another suitable place
                if (generalErrorArea && !document.getElementById('general-submit-error')) {
                    const errorMsg = document.createElement('div');
                    errorMsg.id = 'general-submit-error';
                    errorMsg.className = 'error-message';
                    errorMsg.style.textAlign = 'right'; // Adjust alignment
                    errorMsg.style.marginTop = '10px';
                    errorMsg.textContent = 'Please correct the errors before submitting.';
                    generalErrorArea.appendChild(errorMsg);
                }

            }
        } else {
             // If validateForm returned false but no .is-invalid found (shouldn't happen ideally)
             alert("Please fill out all required fields correctly.");
        }
        return; // Stop submission if validation fails
    }

    // Clear any general submission error message if validation passes
    const generalErrorMsg = document.getElementById('general-submit-error');
    if (generalErrorMsg) {
        generalErrorMsg.remove();
    }


    // Gather Form Data ---
    const formData = new FormData(repairForm);
    const selectedType = productTypeSelect.value;
    const config = productSpecificsConfig[selectedType];

    const selectedIssues = [];
    formData.getAll('issues[]').forEach(issue => selectedIssues.push(issue));

    const additionalFields = {};
    if (config && config.fields) {
        config.fields.forEach(groupId => {
            const groupElement = document.getElementById(groupId);
            if (groupElement) {
                const inputs = groupElement.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.name) { // Ensure the input has a name
                        additionalFields[input.name] = formData.get(input.name) || '';
                    }
                });
            }
        });
    }

    const finalSerialNumber = (config?.serialRequired) ? formData.get('serialNumber').trim() : 'N/A';

    const newRepair = {
        id: generateRepairId(),
        returnName: formData.get('returnName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        city: formData.get('city').trim(),
        state: formData.get('state').trim(),
        zipCode: formData.get('zipCode').trim(),
        product: formData.get('product').trim(),
        serialNumber: finalSerialNumber,
        productType: selectedType,
        purchaseDate: formData.get('purchaseDate'), // Keep as is
        selectedIssues: selectedIssues, // Array of selected issue values
        issue: formData.get('issue').trim(), // Detailed description
        dateSubmitted: new Date().toLocaleDateString(),
        status: 'Waiting for Product', // Default status
        ...additionalFields // Spread operator adds fields like magnification, maxRange etc.
    };

    // Add replacement approval if it was visible and selected
    if (replacementApprovalSection && replacementApprovalSection.style.display !== 'none') {
        newRepair.replacementApproval = formData.get('replacementApproval') || 'Not Selected';
    }

    // --- Save to localStorage ---
    try {
        const existingRepairs = JSON.parse(localStorage.getItem('leupoldRepairs')) || [];
        existingRepairs.push(newRepair);
        localStorage.setItem('leupoldRepairs', JSON.stringify(existingRepairs));

        // Show success message
        successMessageDiv.style.display = 'block';
        successMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Optionally reset form (consider if user might want to submit another quickly)
        // repairForm.reset();
        // toggleProductFields(); // Reset fields visibility after form reset

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000); // Increased delay to allow reading success message

    } catch (e) {
        console.error("Error saving to localStorage:", e);
        alert("Failed to save repair request. LocalStorage might be full or disabled. Please check console.");
        // Re-enable button if saving fails
        // submitButton.disabled = false;
        // submitButton.textContent = 'Submit Request';
    }
}

// --- Event Listeners ---

// Add listener to product type dropdown
productTypeSelect?.addEventListener('change', toggleProductFields);

// Add listener for form submission (now attached to the form itself)
repairForm?.addEventListener('submit', submitForm); // Added: Listen for submit event on the form

// Add listeners for multi-step navigation
nextBtn?.addEventListener('click', handleNextOrSubmit); // Changed: Use the new handler
prevBtn?.addEventListener('click', prevStep);
cancelBtn?.addEventListener('click', cancelRepair); // Add listener for cancel button

// --- Initial Page Load Logic ---

// Run toggleProductFields on initial load to set up the form correctly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        showStep(currentStep); // Show the first step initially
        toggleProductFields(); // Still needed to set up product fields initially if step 2 loads first somehow or for direct access later
    });
} else {
    showStep(currentStep); // Show the first step initially
    toggleProductFields(); // Still needed
}

// --- Formatting Functions ---
function formatPhoneNumber(value) {
    // 1. Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // 2. Apply formatting based on the number of digits
    // Limit digits to 10
    const limitedDigits = digits.substring(0, 10);

    // Use capturing groups to extract parts of the number
    const match = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
        let formatted = '';
        // Add opening parenthesis when first digit is entered
        if (match[1]) {
            formatted += `(${match[1]}`;
        }
        // Add closing parenthesis and space when 4th digit is entered
        if (match[2]) {
            formatted += `) ${match[2]}`;
        }
        // Add hyphen when 7th digit is entered
        if (match[3]) {
            formatted += `-${match[3]}`;
        }
        // Return the formatted string
        return formatted;
    }

    // Return original value if regex fails (should not happen) or empty string if no digits
    return value; // Return original value if digits is empty or regex fails
}

function formatState(value) {
    return value.toUpperCase();
}

// (Optional) Formats Zip code - basic example allowing only digits
function formatZipCode(value) {
    return value.replace(/[^\d]/g, ''); // Keep only digits
}

// --- Validation Functions ---
function validateEmail(input = emailInput, error = emailError) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // Improved email pattern
    const value = input.value.trim();
    if (value === '') {
        showValidationError(input, error, 'Please enter your email address');
        return false;
    } else if (!emailPattern.test(value)) {
        showValidationError(input, error, 'Please enter a valid email address');
        return false;
    } else {
        hideValidationError(input, error);
        return true;
    }
}

function validatePhoneNumber(input = phoneInput, error = phoneError) {
    if (!input || !error) return false; // Element check

    const value = input.value.trim();
    const phoneDigits = value.replace(/\D/g, ''); // Remove non-digits

    if (value === '') {
        // If the field is required, the main validateForm will handle showing the error.
        // If it's not strictly required, but has validation, we hide format errors when empty.
        hideValidationError(input, error);
        return true; // Or false depending on whether empty is valid in context, true assumes empty is okay for format
    } else if (phoneDigits.length !== 10) {
        showValidationError(input, error, 'Please enter a 10-digit phone number');
        return false;
    } else {
        hideValidationError(input, error);
        return true;
    }
}

function validateState(input = stateInput, error = stateError) {
    const statePattern = /^[A-Z]{2}$/;
    const value = input.value.trim(); // Already formatted to uppercase by input listener
    if (value === '') {
        showValidationError(input, error, 'Please enter your state/province');
        return false;
    } else if (!statePattern.test(value)) {
        showValidationError(input, error, 'Please enter a 2-letter state abbreviation (e.g., OR)');
        return false;
    } else {
        hideValidationError(input, error);
        return true;
    }
}

function validateZipCode(input = zipCodeInput, error = zipCodeError) {
    const pattern = /^\d{5}(-\d{4})?$/;
    const isValid = pattern.test(input.value.trim());
    if (!isValid && input.value.trim() !== '') {
        showValidationError(input, error, 'Please enter a valid 5 or 5+4 digit zip code.');
        return false;
    } else {
        hideValidationError(input, error);
        return true;
    }
}

// --- Event Listeners ---
// Add Input Listeners for Formatting
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        e.target.value = formattedValue;
        // Re-validate on input for immediate feedback (optional, but good UX)
        validatePhoneNumber(phoneInput, phoneError);
    });
}

if (stateInput) {
    stateInput.addEventListener('input', (e) => {
        const formattedValue = formatState(e.target.value);
        e.target.value = formattedValue;
    });
}

if (zipCodeInput) {
    zipCodeInput.addEventListener('input', (e) => {
        const formattedValue = formatZipCode(e.target.value);
        // Optional: Limit length e.g., e.target.value = formattedValue.slice(0, 5);
        e.target.value = formattedValue;
        // Re-validate on input for immediate feedback (optional, but good UX)
        validateZipCode(zipCodeInput, zipCodeError);
    });
}

// Add a general input listener to hide errors on correction
repairForm?.addEventListener('input', (event) => {
    const target = event.target;
    // Check if the input is currently marked as invalid
    if (target.classList.contains('is-invalid')) {
        // Basic check: If the field is no longer empty, hide the general required error
        // More specific validation can be triggered here or on blur/step change
        const errorElement = document.getElementById(`${target.id}-error`);
        // Perform quick validation or just hide if value exists
        if (target.value.trim() !== '') {
            // Optionally re-run the specific validation for this field for better UX
            // Example: if (target.id === 'email') validateEmail();
            // For now, just hide the error assuming correction is happening
            hideValidationError(target, errorElement);
        }
    }
});
