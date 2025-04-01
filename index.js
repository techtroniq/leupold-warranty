// Function to load repair requests from localStorage and display them
function loadRepairs() {
    const repairs = JSON.parse(localStorage.getItem('leupoldRepairs')) || [];
    const repairsList = document.getElementById('repairs-list');
    const noRepairsMsg = document.getElementById('no-repairs');
    const repairsTable = document.getElementById('repairs-table');

    // Clear the current list
    repairsList.innerHTML = '';

    // Show/hide elements based on whether there are repairs
    if (repairs.length === 0) {
        noRepairsMsg.style.display = 'block';
        repairsTable.style.display = 'none';
    } else {
        noRepairsMsg.style.display = 'none';
        repairsTable.style.display = 'table';

        // Add each repair to the table and make each row clickable
        repairs.forEach((repair, index) => {
            const row = document.createElement('tr');
            // Create status class based on repair status
            let statusClass = '';
            // Use lowercase for comparison for robustness
            switch (repair.status?.toLowerCase()) {
                case 'waiting for product':
                    statusClass = 'status-pending';
                    break;
                case 'approved':
                    statusClass = 'status-approved';
                    break;
                case 'completed':
                    statusClass = 'status-completed';
                    break;
                case 'denied':
                    statusClass = 'status-denied';
                    break;
                default: // Handle potentially unknown or 'Pending' status
                     statusClass = 'status-pending'; // Default to pending if unknown
            }

            // Ensure values exist or provide fallback
            const repairData = repair; // Use the full repair object for printing
            const displaySerial = repair.serialNumber || 'N/A';
            const displayIssue = repair.selectedIssues || repair.issue || 'N/A'; // Prefer selected issues
            const displayId = repair.repairId || 'N/A';
            const displayDateObj = repair.createdTimestamp ? new Date(repair.createdTimestamp) : null;
            const displayDate = displayDateObj ? displayDateObj.toLocaleDateString() : 'N/A'; // Format date nicely
            const displayStatus = repair.status || 'Submitted'; // Default status

            row.innerHTML = `
                <td data-label="Request ID">${displayId}</td>
                <td data-label="Product">${repair.product || 'N/A'}</td>
                <td data-label="Serial Number">${displaySerial}</td>
                <td data-label="Issue">${displayIssue}</td>
                <td data-label="Date Submitted">${displayDate}</td>
                <td data-label="Status" class="${statusClass}">${displayStatus}</td>
                <td data-label="Print" class="actions no-print"> 
                    <button class="btn-print-combined" data-repair-id="${displayId}" title="Print Shipping Label">Shipping Label</button>
                </td>
            `;

            // Add title attribute for full issue text on hover
            if (repair.issue && repair.issue.length > 50) {
                 const issueCell = row.cells[3]; // Assuming 'Issue' is the 4th column (index 3)
                 issueCell.title = repair.issue;
            }

            // Add click listener for row navigation (excluding the action buttons cell)
            // When a row is clicked, navigate to the details page with the repair ID in the URL
            row.addEventListener('click', function(e) {
                // Only navigate if the click wasn't on a button or link inside the actions cell
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && !e.target.closest('.actions')) {
                 window.location.href = 'repair-details.html?repairId=' + encodeURIComponent(displayId);
                }
            });

            repairsList.appendChild(row);
        });

        // Add event listeners for the print buttons (using event delegation)
        repairsList.addEventListener('click', function(e) {
            const target = e.target;
            const repairId = target.getAttribute('data-repair-id');
            if (!repairId) return; // Click wasn't on a button with the ID

            const repairToPrint = repairs.find(r => r.repairId === repairId); // Use repairId

            if (!repairToPrint) {
                console.error("Repair data not found for ID:", repairId);
                alert("Could not find repair data to print.");
                return;
            }

            if (target.classList.contains('btn-print-combined')) {
                const combinedHTML = generateCombinedPrintHTML(repairToPrint);
                triggerPrint(combinedHTML, 'Repair Documents - ' + repairId);
            }
        });
    }
}

// Add event listener for clear data button
document.getElementById('clear-data')?.addEventListener('click', function() {
    if (confirm('Are you sure you want to delete all repair requests? This cannot be undone.')) {
        try {
            localStorage.removeItem('leupoldRepairs');
            console.log("Repair data cleared.");
             // Reload the list to show it's empty
             loadRepairs();
        } catch (e) {
             console.error("Error clearing localStorage:", e);
             alert("Could not clear repair data. Please check browser settings or console for errors.");
        }
    }
});

// Load repairs when the page loads (ensure DOM is ready)
if (document.readyState === 'loading') { // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', loadRepairs);
} else { // `DOMContentLoaded` has already fired
    loadRepairs();
}