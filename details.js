console.log("--- details.js script started ---"); // TOP-LEVEL LOG

// Helper function to escape HTML special characters
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe) // Ensure it's a string
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\\/g, "&#x2F;"); // Correctly escape backslash
}

// --- Add missing displayError function --- 
function displayError(message) {
    // Attempt to find the main content area to display the error
    const container = document.querySelector('.content') || document.body; // Fallback to body
    if (container) {
        // Clear existing content within the main content div if found, or prepare body
        const targetElement = document.querySelector('.content') ? container : document.body;
        if (targetElement === container) {
            targetElement.innerHTML = ''; // Clear only if it's the .content div
        }
        // Create and append the error message
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message'; // Add class for potential styling
        errorElement.style.color = 'red';
        errorElement.style.textAlign = 'center';
        errorElement.style.padding = '20px';
        errorElement.textContent = message;
        targetElement.appendChild(errorElement);
    } else {
        // Fallback if no suitable container is found
        alert(message); // Use alert as a last resort
    }
}

// New function to populate the structured HTML
function populateDetails(repair) {
    // Helper to set text content safely
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value !== undefined && value !== null && value !== '' ? value : 'N/A';
        } else {
            console.warn(`Element with ID ${id} not found.`); // Log: Warning
        }
    };

    // --- Populate Repair ID ---    
    setText('detail-repair-id-value', repair.repairId || 'N/A');

    // --- Populate Contact Info ---    
    setText('detail-returnName', repair.returnName);
    setText('detail-email', repair.email);
    setText('detail-phone', repair.phone);
    setText('detail-address', repair.address);
    setText('detail-city', repair.city);
    setText('detail-state', repair.state);
    setText('detail-zipCode', repair.zipCode);

    // --- Populate Product Info ---    
    setText('detail-productType', repair.productType);
    setText('detail-product', repair.product);
    setText('detail-serialNumber', repair.serialNumber);
    setText('detail-purchaseDate', repair.purchaseDate);
    setText('detail-magnification', repair.magnification); // Handle potential absence gracefully
    setText('detail-reticleType', repair.reticleType);           // Handle potential absence gracefully
    setText('detail-maxRange', repair.maxRange); // Handle potential absence gracefully
    setText('detail-batteryType', repair.batteryType); // Handle potential absence gracefully

    // --- Populate Issue Details ---    
    setText('detail-status', repair.status);
    setText('detail-issue', repair.issue); // Add missing call for detailed issue
    
    // Format Timestamp
    const timestampElement = document.getElementById('detail-createdTimestamp');
    if (timestampElement) {
        try {
            const timestamp = parseInt(repair.createdTimestamp, 10);
            if (!isNaN(timestamp)) {
                 timestampElement.textContent = new Date(timestamp).toLocaleDateString();
            } else {
                timestampElement.textContent = 'N/A'; 
            }
        } catch (e) {
            console.error("Error parsing timestamp:", e); // Log: Error
            timestampElement.textContent = 'Invalid Date';
        }
    } else {
         console.warn("Element with ID detail-createdTimestamp not found."); // Log: Warning
    }

    // Populate Selected Issues List
    const issuesListElement = document.getElementById('detail-selectedIssues');
    if (issuesListElement) {
        issuesListElement.innerHTML = ''; // Clear any previous content
        // Access using bracket notation due to '[]' in key name
        const issuesArray = repair['selectedIssues[]']; // This should be an array

        if (Array.isArray(issuesArray) && issuesArray.length > 0) {
            // Iterate over the array and create list items
            issuesArray.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue; // Assign the issue text
                issuesListElement.appendChild(li);
            });
        } else {
            // Handle cases where it's empty, not an array, or not present
            const li = document.createElement('li');
            li.textContent = 'N/A';
            issuesListElement.appendChild(li);
        }
    } else {
        console.warn("Element with ID detail-selectedIssues not found."); // Log: Warning
    }
    
    // Handle Replacement Approval visibility and content
    const replacementDisplayDiv = document.getElementById('replacement-approval-display');
    if (replacementDisplayDiv && repair.hasOwnProperty('replacementApproval')) { // Check if the property exists
        replacementDisplayDiv.style.display = 'block'; // Show the item
        // Convert to lowercase for case-insensitive comparison
        const approvalValue = repair.replacementApproval?.toLowerCase(); 
        setText('detail-replacementApproval', approvalValue === 'yes' ? 'Yes' : 'No');
    } else if (replacementDisplayDiv) {
        replacementDisplayDiv.style.display = 'none'; // Hide if not applicable/present
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Get repair ID from URL - Use 'repairId'
    const params = new URLSearchParams(window.location.search);
    const repairId = params.get('repairId'); // CORRECTED PARAMETER KEY

    if (!repairId) {
        console.error("No repair ID found in URL"); // Log: Error
        displayError('No repair ID provided in the URL.'); // Use displayError
        return;
    }

    let repairs = [];
    try {
        repairs = JSON.parse(localStorage.getItem('leupoldRepairs')) || [];
    } catch (e) {
        console.error("Error parsing repairs from localStorage:", e); // Log: Error
        displayError('Error loading repair data. Storage might be corrupted.'); // Use displayError
        return;
    }

    // Find the repair using the correct key 'repairId'
    const repair = repairs.find(r => r.repairId === repairId);

    if (!repair) {
        console.error(`Repair with ID ${repairId} not found in localStorage`); // Log: Error
        displayError(`Repair request with ID "${repairId}" not found.`); // Use displayError
        return;
    }

    // Populate the details page
    populateDetails(repair);
});