// Function to display the repair details
function displayRepairDetails() {
    // Get repair id from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const repairId = params.get('id');
    const container = document.getElementById('repair-details-container');

    if (!container) {
        console.error("Repair details container not found.");
        return;
    }

    if (!repairId) {
        container.innerHTML = '<p>No repair ID specified in the URL.</p>';
        return;
    }

    let repairs = [];
    try {
        repairs = JSON.parse(localStorage.getItem('leupoldRepairs')) || [];
    } catch (e) {
        console.error("Error parsing repairs from localStorage:", e);
        container.innerHTML = '<p>Error loading repair data. Storage might be corrupted.</p>';
        return;
    }

    const repair = repairs.find(r => r.id === repairId);

    if (!repair) {
        container.innerHTML = `<p>Repair request with ID "${repairId}" not found.</p>`;
        return;
    }

    // --- Create a more readable display ---

    // Define the order and labels for keys
    const displayOrder = [
        { key: 'id', label: 'Request ID' },
        { key: 'status', label: 'Status' },
        { key: 'dateSubmitted', label: 'Date Submitted' },
        { key: 'productType', label: 'Product Type' },
        { key: 'product', label: 'Product Name/Model' },
        { key: 'serialNumber', label: 'Serial Number' },
        { key: 'purchaseDate', label: 'Purchase Date' },
        // Contact Info Section Break (visual separation in table or use subheadings)
        { key: 'returnName', label: 'Return Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Return Address' }, // Address, City, State, Zip combined in new-repair.js
        // Issue Details Section Break
        { key: 'selectedIssues', label: 'Reported Issues' },
        { key: 'issue', label: 'Detailed Description' },
        // Additional/Specific Fields (handle dynamically)
        { key: 'magnification', label: 'Magnification (Scope)'},
        { key: 'objectiveLens', label: 'Objective Lens (Scope)'},
        { key: 'reticleType', label: 'Reticle Type (Scope)'},
        { key: 'maxRange', label: 'Max Range (Rangefinder)'},
        { key: 'batteryType', label: 'Battery Type (Rangefinder)'},
        { key: 'replacementApproval', label: 'Replacement Approved Without Contact'}

    ];

    let detailsHtml = '<table>';

    displayOrder.forEach(item => {
        if (repair.hasOwnProperty(item.key) && repair[item.key] !== undefined && repair[item.key] !== '') {
             let value = repair[item.key];

             // Format specific fields if needed
             if (item.key === 'selectedIssues' && Array.isArray(value)) {
                 value = value.length > 0 ? `<ul>${value.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}</ul>` : 'None specified';
             } else {
                  // Escape HTML for other values to prevent XSS
                  value = escapeHtml(String(value));
             }


            detailsHtml += `
              <tr>
                <th>${escapeHtml(item.label)}</th>
                <td>${value}</td>
              </tr>`;
        }
    });

     // Optionally add any keys present in the repair data but not in displayOrder (for completeness)
     // This can be useful if new fields are added later without updating displayOrder
     detailsHtml += '<tr><th colspan="2" style="background-color: #eee; text-align: center;">Other Details</th></tr>'; // Separator
     for (const key in repair) {
         if (!displayOrder.some(item => item.key === key) && repair.hasOwnProperty(key)) {
              detailsHtml += `
              <tr>
                <th>${escapeHtml(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}</th>
                <td>${escapeHtml(String(repair[key]))}</td>
              </tr>`;
         }
     }


    detailsHtml += '</table>';
    container.innerHTML = detailsHtml;

    // Find the table row containing the "Status" header
    const statusRow = Array.from(container.querySelectorAll('tr')).find(row => row.cells[0]?.textContent.trim() === 'Status');

    // If the status row and the status value exist, apply the appropriate class to the status value cell
    if (statusRow && repair.status) {
        const statusCell = statusRow.cells[1]; // Get the second cell (the value cell)
        if (statusCell) {
            let statusClass = '';
            switch (repair.status?.toLowerCase()) {
                case 'waiting for product': statusClass = 'status-pending'; break;
                case 'approved': statusClass = 'status-approved'; break;
                case 'completed': statusClass = 'status-completed'; break;
                case 'denied': statusClass = 'status-denied'; break;
                default: statusClass = 'status-unknown'; // Use a default class for unknown statuses
            }
            statusCell.classList.add(statusClass);
        }
    }
}

// Helper function to escape HTML special characters
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe) // Ensure it's a string
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}


// Load the repair details when the DOM is ready
if (document.readyState === 'loading') { // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', displayRepairDetails);
} else { // `DOMContentLoaded` has already fired
    displayRepairDetails();
}