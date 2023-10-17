var stepOne = document.getElementById("stepOne")
var stepTwo = document.getElementById("stepTwo")
stepTwo.style.display = "none"

document.addEventListener("DOMContentLoaded", function() {
    const checkboxContainer = document.querySelector(".colleges_container");
    const collegesPerPage = 15; // Number of colleges to show per page
    let currentPage = 0; // Current page index

    function displayColleges() {
        // Clear the container before adding colleges for the new page
        checkboxContainer.innerHTML = '';

        // Calculate the start and end indices for the current page
        const startIndex = currentPage * collegesPerPage;
        const endIndex = Math.min(startIndex + collegesPerPage, colleges.length);

        // Create a grid to display colleges
        for (let i = startIndex; i < endIndex; i++) {
            const collegeName = colleges[i];
            const container = document.createElement("div");
            container.className = "college_container";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "checkbox";
            checkbox.id = `checkbox${i}`;
            checkbox.name = "checkboxes";

            const label = document.createElement("label");
            label.htmlFor = `checkbox${i}`;
            label.textContent = collegeName;

            container.appendChild(checkbox);
            container.appendChild(label);

            checkboxContainer.appendChild(container);
        }
    }

    // Initial display
    displayColleges();

    // Previous page button
    const prevButton = document.querySelector("#prev_button");
    prevButton.addEventListener("click", function() {
        if (currentPage > 0) {
            currentPage--;
            displayColleges();
        }
    });

    // Next page button
    const nextButton = document.querySelector("#next_button");
    nextButton.addEventListener("click", function() {
        const totalPages = Math.ceil(colleges.length / collegesPerPage);
        if (currentPage < totalPages - 1) {
            currentPage++;
            displayColleges();
        }
    });
});

function filterBySearch() {
    // Get the input value and convert it to lowercase for case-insensitive searching
    var input = document.getElementById("filterBySearch");
    var filter = input.value.toLowerCase();

    // Get all the results inside the container (across all pages)
    var allCollegeContainers = document.querySelectorAll(".college_container");

    // Loop through all the results and hide/show them
    for (var i = 0; i < allCollegeContainers.length; i++) {
        var result = allCollegeContainers[i];
        var label = result.querySelector("label");
        var text = label.textContent.toLowerCase();

        if (text.includes(filter)) {
            result.style.display = "block";
        } else {
            result.style.display = "none";
        }
    }
}

var selectedIds = [];
function findSelectedIds() {
    // Loop through checkboxes and check if they are selected
    const checkboxes = document.getElementsByName("checkboxes");
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedIds.push(checkbox.id); // Push the ID to the array
        }

    });
}

var coordinatesObject = [];
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

async function groupSchools() {
    findSelectedIds();
    
    for (const rowNumber of selectedIds) {
        await processCSVData(rowNumber);
    }
    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    // Group schools based on proximity (miles)
    var groupedSchools = []; // Initialize an array to store grouped schools


    for (let i = 0; i < numSchools; i++) {
        const school1 = schools[i];
        const loc1 = coordinatesObject[school1];
        let group = [school1]; // Initialize a group array with the current school
        
        for (let j = 0; j < numSchools; j++) {
            if (i !== j) { // Avoid comparing the same school
                const school2 = schools[j];
                const loc2 = coordinatesObject[school2];
                const distanceMiles = haversine(loc1, loc2);
        
                // Check if the distance is within the threshold (75 miles)
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
    console.log(groupedSchools)
        
}

var mapsCenter = {}
function findCenterOfSchools() {
    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    let sumLat = 0;
    let sumLon = 0;

    for (let i = 0; i < numSchools; i++) {
        const school = schools[i];
        const coordinates = coordinatesObject[school];
    
        // Extract and accumulate latitude and longitude values
        sumLat += coordinates.latitude;
        sumLon += coordinates.longitude;
    }
    const averageLat = sumLat/numSchools
    const averageLon = sumLon/numSchools
    mapsCenter = { lat: averageLat, lng: averageLon};
    console.log(mapsCenter)
    }

function initializeMap() {
    let map;
    const USA_BOUNDS = {
        north: 49.3457868,
        south: 24.7433195,
        west: -124.7844079,
        east: -66.9513812,
    };
        
    async function initMap() {
        var { Map } = await google.maps.importLibrary("maps");
    
        map = new Map(document.getElementById("map"), {
        center: mapsCenter,
        restriction: {
            latLngBounds: USA_BOUNDS,
            strictBounds: false,
        },
        zoom: 8,
    });
    }

    initMap();
}

async function moveStepTwo() {
    await groupSchools();
    await findCenterOfSchools();
    initializeMap();
    
    stepOne.style.display = "none";
    stepTwo.style.display = "block";
}

async function moveStepOne() {
    stepOne.style.display = "block";
    stepTwo.style.display = "none";
}