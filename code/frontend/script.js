// Add your API endpoint here
var API_ENDPOINT = "your-api-url";

// Function to show status messages
function showMessage(message, type) {
    const statusDiv = document.getElementById("statusMessage");
    statusDiv.innerHTML = `<div class="status-message ${type}">${message}</div>`;
    setTimeout(() => {
        statusDiv.innerHTML = "";
    }, 5000);
}

// Function to show/hide loading indicator
function toggleLoading(show) {
    document.getElementById("loading").style.display = show ? "block" : "none";
}

// Function to clear the table
function clearTable() {
    $('#employeeTable tbody').empty();
    document.getElementById("employeeTable").style.display = "none";
}

// Function to populate the table with employee data
function populateTable(employees) {
    clearTable();
    
    if (employees.length === 0) {
        showMessage("No employees found matching your search criteria.", "info");
        return;
    }
    
    const tbody = $('#employeeTable tbody');
    
    employees.forEach(function(employee) {
        const row = `
            <tr>
                <td>${employee.empid || 'N/A'}</td>
                <td>${employee.name || 'N/A'}</td>
                <td>${employee.department || 'N/A'}</td>
                <td>${employee.position || 'N/A'}</td>
                <td>${employee.email || 'N/A'}</td>
                <td>${employee.phone || 'N/A'}</td>
                <td>${employee.hire_date || 'N/A'}</td>
            </tr>
        `;
        tbody.append(row);
    });
    
    document.getElementById("employeeTable").style.display = "table";
    showMessage(`Found ${employees.length} employee(s).`, "success");
}

// Function to get search parameters
function getSearchParams() {
    return {
        empid: $('#empid').val().trim(),
        name: $('#name').val().trim()
    };
}

// Search employees function
function searchEmployees() {
    const searchParams = getSearchParams();
    
    toggleLoading(true);
    
    $.ajax({
        url: API_ENDPOINT,
        type: 'POST',
        data: JSON.stringify(searchParams),
        contentType: 'application/json; charset=utf-8',
        success: function (response) {
            toggleLoading(false);
            let employees = response;
            
            // Handle string response (if API returns stringified JSON)
            if (typeof response === 'string') {
                try {
                    employees = JSON.parse(response);
                } catch (e) {
                    console.error('Error parsing response:', e);
                    showMessage("Error parsing server response.", "error");
                    return;
                }
            }
            
            populateTable(employees);
        },
        error: function (xhr, status, error) {
            toggleLoading(false);
            console.error('Error searching employees:', error);
            showMessage("Error searching for employees. Please try again.", "error");
        }
    });
}

// Download Excel function
function downloadExcel() {
    const searchParams = getSearchParams();
    searchParams.download = 'excel';
    
    toggleLoading(true);
    showMessage("Preparing Excel download...", "info");
    
    $.ajax({
        url: API_ENDPOINT,
        type: 'POST',
        data: JSON.stringify(searchParams),
        contentType: 'application/json; charset=utf-8',
        xhrFields: {
            responseType: 'blob'
        },
        success: function (response, status, xhr) {
            toggleLoading(false);
            
            // Check if response is base64 encoded or blob
            if (typeof response === 'string') {
                // Handle base64 encoded response
                try {
                    const jsonResponse = JSON.parse(response);
                    if (jsonResponse.body) {
                        // Decode base64 data
                        const binaryString = atob(jsonResponse.body);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        response = new Blob([bytes], {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        });
                    }
                } catch (e) {
                    console.error('Error parsing base64 response:', e);
                    showMessage("Error processing Excel file.", "error");
                    return;
                }
            }
            
            // Create download link
            const blob = response;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `employee_data_${timestamp}.xlsx`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showMessage("Excel file downloaded successfully!", "success");
        },
        error: function (xhr, status, error) {
            toggleLoading(false);
            console.error('Error downloading Excel:', error);
            
            // Try alternative method for CORS issues
            if (xhr.status === 0 || xhr.status === 404) {
                // Fallback: open in new window
                const searchParams = getSearchParams();
                const queryString = new URLSearchParams({
                    ...searchParams,
                    download: 'excel'
                }).toString();
                
                window.open(`${API_ENDPOINT}?${queryString}`, '_blank');
                showMessage("Download started in new window.", "info");
            } else {
                showMessage("Error downloading Excel file. Please try again.", "error");
            }
        }
    });
}

// Clear search function
function clearSearch() {
    $('#empid').val('');
    $('#name').val('');
    clearTable();
    showMessage("Search cleared.", "info");
}

// Event listeners
$(document).ready(function() {
    // Search button click
    $('#searchEmployees').click(searchEmployees);
    
    // Download Excel button click
    $('#downloadExcel').click(downloadExcel);
    
    // Clear search button click
    $('#clearSearch').click(clearSearch);
    
    // Enter key press in input fields
    $('#empid, #name').keypress(function(e) {
        if (e.which === 13) { // Enter key
            searchEmployees();
        }
    });
    
    // Initial message
    showMessage("Enter search criteria and click 'Search Employees' or download all data as Excel.", "info");
});
