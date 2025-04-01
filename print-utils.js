// --- Leupold Address ---
// IMPORTANT: Confirm this is the correct address
const leupoldAddress = {
    name: "Leupold & Stevens, Inc.",
    dept: "Warranty Department",
    street: "14400 NW Greenbrier Pkwy",
    city: "Beaverton",
    state: "OR",
    zip: "97006",
    country: "USA"
};

// --- Print Helper Functions ---

// Triggers the browser's print dialog for the given HTML content
function triggerPrint(htmlContent, title) {
    const printWindow = window.open('', title, 'height=600,width=800');
    if (!printWindow) {
        alert('Please allow pop-ups for this site to print.');
        return;
    }
    printWindow.document.write('<html><head><title>' + title + '</title>');
    // Basic print styles embedded directly
    printWindow.document.write('<style>');
    printWindow.document.write(`
        @media print {
            body { font-family: sans-serif; margin: 20px; }
            .label-section { border: 2px dashed #999; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
            .address-block { margin-bottom: 10px; line-height: 1.4; }
            .address-block strong { display: block; margin-bottom: 3px; }
            .barcode { text-align: center; margin-top: 20px; page-break-inside: avoid; }
            .barcode svg { height: 40px; width: auto; max-width: 80%; }
            h2, h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 15px; page-break-after: avoid; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #eee; font-weight: bold; }
            td:first-child { width: 30%; } /* Packing list label width */
            table td:nth-child(2) {
                white-space: normal; 
                word-break: break-word;
            }
            .page-break { page-break-after: always; } /* Added for combined printing */
            .no-print { display: none; } 
        }
        /* Basic styles for the print window itself (non-print media) */
        body { font-family: sans-serif; margin: 20px; }
        .label-section { border: 2px dashed #ccc; padding: 15px; margin-bottom: 20px; max-width: 500px; }
        .address-block { margin-bottom: 15px; }
        .address-block strong { display: block; margin-bottom: 5px; }
        .barcode { text-align: center; margin-top: 10px; }
        .barcode svg { height: 50px; width: auto; }
        h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(htmlContent);
    // We need JsBarcode in the print window for the packing list
    printWindow.document.write('<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"><\/script>');
    printWindow.document.write('<script> try { JsBarcode(".barcode svg").init(); } catch(e) { console.error("Barcode init failed in print window:", e); } <\/script>'); // Initialize any barcodes in the content
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus(); 
    setTimeout(() => {
        try {
            printWindow.print();
            // Optional: close automatically after print dialog opens
            // printWindow.close(); 
        } catch (e) {
            console.error("Print failed:", e);
            printWindow.close(); // Close if print fails
        }
    }, 300); // Slightly longer delay for content/script loading
}

// Generates HTML for the Shipping Label
function generateShippingLabelHTML(data) {
    // Ensure required data fields exist from the repair object
    const returnName = data.returnName || '[Customer Name Not Provided]';
    const address = data.address || '[Address Not Provided]';
    const city = data.city || '';
    const state = data.state || '';
    const zipCode = data.zipCode || '';
    
    return `
        <h2>Shipping Label</h2>
        <p>Please affix this label securely to your package.</p>
        <div class="label-section">
            <div class="address-block">
                <strong>FROM:</strong>
                ${returnName}<br>
                ${address}<br>
                ${city}, ${state} ${zipCode}
            </div>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">
            <div class="address-block" style="margin-left: 50px;">
                <strong>TO:</strong>
                ${leupoldAddress.name}<br>
                ${leupoldAddress.dept}<br>
                ${leupoldAddress.street}<br>
                ${leupoldAddress.city}, ${leupoldAddress.state} ${leupoldAddress.zip}<br>
                ${leupoldAddress.country}
            </div>
        </div>
        <p class="no-print"><small>Ensure your product is packaged securely. Leupold is not responsible for damage during transit.</small></p>
    `;
}

// Generates HTML for the Packing List
function generatePackingListHTML(data) {
    // Use 'id' if 'repairId' isn't present (consistency with localStorage structure)
    const repairId = data.repairId || data.id || '[ID Not Found]'; 
    const createdDate = data.createdTimestamp ? new Date(data.createdTimestamp).toLocaleDateString() : (data.dateSubmitted || new Date().toLocaleDateString());

    let detailsHTML = '';
    // Define order or filter keys if necessary
    const displayOrder = [
        'returnName', 'email', 'phone', 'address', 'city', 'state', 'zipCode',
        'productType', 'product', 'serialNumber', 'purchaseDate', 
        'magnification', 'objectiveLens', 'reticleType', 'maxRange', 'batteryType', // Add product specific fields if they exist
        'selectedIssues', 'issue', 'replacementApproval', 'status', 'dateSubmitted', 'createdTimestamp' 
    ];

    // Function to create readable labels from camelCase keys
    const formatLabel = (key) => {
         if (key === 'id' || key === 'repairId') return 'Repair ID';
         if (key === 'selectedIssues') return 'Reported Issue(s)';
         if (key === 'issue') return 'Issue Description';
         return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    // Iterate in defined order, then add any remaining keys
    const processedKeys = new Set();
    displayOrder.forEach(key => {
        if (data.hasOwnProperty(key) && data[key] !== null && data[key] !== '') {
            let value = data[key];
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
             if (key === 'createdTimestamp' || key === 'dateSubmitted') {
                 value = new Date(value).toLocaleString(); // Format dates nicely
             }
            detailsHTML += `<tr><td><strong>${formatLabel(key)}:</strong></td><td>${value || '-'}</td></tr>`;
            processedKeys.add(key);
        }
    });

    // Add any remaining data fields not in the specific order
     for (const key in data) {
         if (data.hasOwnProperty(key) && !processedKeys.has(key) && key !== 'id' && key !== 'repairId') {
             let value = data[key];
             if (Array.isArray(value)) value = value.join(', ');
             detailsHTML += `<tr><td><strong>${formatLabel(key)}:</strong></td><td>${value || '-'}</td></tr>`;
         }
     }


    return `
        <h2>Packing List - Repair Request ${repairId}</h2>
        <p>Date Created: ${createdDate}</p>
        <div class="barcode">
            <h3>Request ID Barcode</h3>
            <!-- Use attributes for JsBarcode auto-initialization -->
            <svg class="barcode"
                 jsbarcode-format="CODE128"
                 jsbarcode-value="${repairId}"
                 jsbarcode-textmargin="0"
                 jsbarcode-fontoptions="bold"
                 jsbarcode-lineColor="#000"
                 jsbarcode-width="2"
                 jsbarcode-height="50"
                 jsbarcode-displayValue="true"
                 jsbarcode-fontSize="14">
            </svg>
        </div>
        <p>Please include this packing list inside the box with your product.</p>
        
        <h3>Repair Request Details</h3>
        <table>
            ${detailsHTML}
        </table>
        
        <p class="no-print"><small>Thank you for choosing Leupold.</small></p>
    `;
}

// Generates combined HTML for Label and Packing List with page break
function generateCombinedPrintHTML(data) {
    const labelHTML = generateShippingLabelHTML(data);
    const packingListHTML = generatePackingListHTML(data);

    // Wrap label in a div with page-break style
    return `
        <div class="page-break">
            ${labelHTML}
        </div>
        <div>
            ${packingListHTML}
        </div>
    `;
}
