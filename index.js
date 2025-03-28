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
        repairs.forEach(repair => {
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
            const displayId = repair.id || 'N/A';
            const displayProduct = repair.product || 'N/A';
            const displaySerial = repair.serialNumber || 'N/A';
            // Truncate long issue descriptions for the table view
            const displayIssue = repair.issue ? (repair.issue.length > 50 ? repair.issue.substring(0, 47) + '...' : repair.issue) : 'N/A';
            const displayDate = repair.dateSubmitted || 'N/A';
            const displayStatus = repair.status || 'Pending'; // Default to Pending visually

            row.innerHTML = `
                <td>${displayId}</td>
                <td>${displayProduct}</td>
                <td>${displaySerial}</td>
                <td>${displayIssue}</td>
                <td>${displayDate}</td>
                <td class="${statusClass}">${displayStatus}</td>
            `;

            // Add title attribute for full issue text on hover
            if (repair.issue && repair.issue.length > 50) {
                 const issueCell = row.cells[3]; // Assuming 'Issue' is the 4th column (index 3)
                 issueCell.title = repair.issue;
            }


            // When a row is clicked, navigate to the details page with the repair ID in the URL
            row.addEventListener('click', function() {
                window.location.href = 'repair-details.html?id=' + encodeURIComponent(displayId);
            });

            repairsList.appendChild(row);
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