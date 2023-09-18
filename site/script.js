function initializeMap() {
    let map;

    async function initMap() {
        const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
}

initMap();
}

document.addEventListener('DOMContentLoaded', initializeMap);



document.addEventListener("DOMContentLoaded", function() {
    const checkboxContainer = document.querySelector(".colleges_container");

    colleges.forEach((collegeName, index) => {
        // Create a container div for each checkbox and label
        const container = document.createElement("div");
        container.className = "college_container"; // You can style this class as needed

        // Create the checkbox element
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "checkbox"
        checkbox.id = `${index}`;
        checkbox.name = `checkboxes`;
        
        // Create the label element
        const label = document.createElement("label");
        label.htmlFor = `college${index}`;
        label.textContent = collegeName;
        
        // Append checkbox and label to the container
        container.appendChild(checkbox);
        container.appendChild(label);
        
        // Append the container to the main checkbox container
        checkboxContainer.appendChild(container);
    });
});

function filterBySearch() {
    $(document).ready(function() {
        var checkboxes = $(".college_container");
  
        $("#searchInput").on("input", function() {
          var searchText = $(this).val().toLowerCase();
          checkboxes.hide();
          checkboxes.each(function() {
            var label = $(this).find("label").text().toLowerCase();
            if (label.includes(searchText)) {
              $(this).show();
            }
          });
        });
      });
}

function calculateDistances() {
    // Get all checkboxes with the name "checkboxes"
    const checkboxes = document.getElementsByName("checkboxes");

    // Array to store selected option IDs
    const selectedIds = [];

    // Loop through checkboxes and check if they are selected
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedIds.push(checkbox.id); // Push the ID to the array
        }
    
    });

    const coordinatesObject = []; //start of algo

    async function processCSVData(rowNumber) {
        const csvContent = await fetch('https://storage.googleapis.com/campuscompass/NCES_dataset.csv')
            .then(response => response.text());
        const parsedCSV = Papa.parse(csvContent, { header: true }).data;

        const row = parsedCSV[rowNumber];
        if (row) {
            const school = row['INSTNM'];
            const lat = parseFloat(row['LATITUDE']);
            const lon = parseFloat(row['LONGITUD']);
            coordinatesObject[school] = { latitude: lat, longitude: lon };
        }
        }

    async function main() {
        for (const rowNumber of selectedIds) {
            await processCSVData(rowNumber);
        }

        const schools = Object.keys(coordinatesObject);
        const numSchools = schools.length;

        // Group schools based on proximity (e.g., 60 miles)
        const groupedSchools = []; // Initialize an array to store grouped schools

        for (let i = 0; i < numSchools; i++) {
            const school1 = schools[i];
            const loc1 = coordinatesObject[school1];
            let group = [school1]; // Initialize a group array with the current school
        
            for (let j = 0; j < numSchools; j++) {
                if (i !== j) { // Avoid comparing the same school
                    const school2 = schools[j];
                    const loc2 = coordinatesObject[school2];
                    const distanceMiles = haversine(loc1, loc2);
        
                    // Check if the distance is within the threshold (e.g., 75 miles)
                    if (distanceMiles <= 75) {
                        group.push(school2); // Add the school to the group
                    }
                }
            }
        
            // Check if the group already exists in groupedSchools
            const existingGroupIndex = groupedSchools.findIndex(existingGroup =>
                existingGroup.some(school => group.includes(school))
            );
        
            if (existingGroupIndex !== -1) {
                // If the group already exists, merge it with the existing group
                groupedSchools[existingGroupIndex] = [...new Set(groupedSchools[existingGroupIndex].concat(group))];
            } else {
                // If the group doesn't exist, add it as a new group
                groupedSchools.push(group);
            }
        }
        
        console.log(groupedSchools);

    }

    main();
}

