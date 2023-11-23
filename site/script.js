var CSV
let selectedIds = [];
let coordinatesObject = {};
let groupedSchools = []; 

let typingInstance = null;
let typingTimeout = null;


function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}    

function makeSelectedIds() {
    $("#selectedTags .tag").each(function() {
        selectedIds.push(($(this).data('value')) -1 );
    });
    return selectedIds;
}
    
async function groupSchoolsBySelection() {
    const CSV = await loadCSV();
    selectedIds = await findSelectedIds();
    console.log("selected ids:" + selectedIds);
    const coordinatesObject = {};

    selectedIds.forEach(rowNumber => {
        processCSVData(CSV[rowNumber], coordinatesObject);
    });

    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    var groupedSchools = []; 

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
        if (existingGroupIndex !== - 1) {
            // If the group already exists, merge it with the existing group
            groupedSchools[existingGroupIndex] = [...new Set(groupedSchools[existingGroupIndex].concat(group))];
        } else {
            // If the group doesn't exist, add it as a new group
            groupedSchools.push(group);
        }
    }
    console.log(groupedSchools);
}

async function groupSchoolsBySearch() {
    console.log("selected ids:" + selectedIds);

    // Process each selected ID
    selectedIds.forEach(rowNumber => {
        processCSVData(CSV[rowNumber], coordinatesObject);
    });

    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    for (let i = 0; i < numSchools; i++) {
        const school1 = schools[i];
        const loc1 = coordinatesObject[school1];
        let group = [{ name: school1, id: coordinatesObject[school1].id, site: coordinatesObject[school1].site }];

        for (let j = 0; j < numSchools; j++) {
            if (i !== j) {
                const school2 = schools[j];
                const loc2 = coordinatesObject[school2];

                const distanceMiles = haversine(loc1, loc2);
        
                if (distanceMiles <= 75 && !group.some(s => s.id === loc2.id)) {
                    group.push({ name: school2, id: loc2.id, site: loc2.site });
                }
            }
        }

        if (!groupedSchools.some(g => g.some(s => s.id === group[0].id))) {
            groupedSchools.push(group);
        }
    }
}

async function findCenterOfSchools(coordinatesObject) {
    const schools = Object.keys(coordinatesObject);
    const numSchools = schools.length;

    let sumLat = 0;
    let sumLon = 0;

    for (let i = 0; i < numSchools; i++) {
        const school = schools[i];
        const coordinates = coordinatesObject[school];
    
        sumLat += coordinates.latitude;
        sumLon += coordinates.longitude;
    }
    const averageLat = sumLat/numSchools
    const averageLon = sumLon/numSchools
    mapsCenter = { lat: averageLat, lng: averageLon};
    console.log(mapsCenter)
}

async function initializeMap() {
    let map;
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

function findSelectedIds() {
    // Use the class selector instead of name
    const selectors = document.getElementsByClassName("collegeSelectors");
    return Array.from(selectors).filter(selector => selector.checked).map(selector => selector.id);
}

async function processCSVData(row, coordinatesObject) {
    const lat = parseFloat(row['LATITUDE']);
    const lon = parseFloat(row['LONGITUD']);
    const id = parseFloat(row['ID'])
    const website = row['WEBADDR']
    coordinatesObject[row['INSTNM']] = { latitude: lat, longitude: lon, id: id, site: website};
}

async function loadCSV() {
    try {
        const response = await fetch('https://storage.googleapis.com/campuscompass/gravity-set.csv');
        const csvContent = await response.text();
        return Papa.parse(csvContent, { header: true }).data;
    } catch (error) {
        console.error('Error loading CSV:', error);
        return [];
    }
}

main();
async function main() {
    const USA_BOUNDS = {
        north: 49.3457868,
        south: 24.7433195,
        west: -124.7844079,
        east: -66.9513812,
    };
    
    CSV = await loadCSV();

    let autofillResults = [];
    async function gatherAutofillData() {
        try {
            CSV.forEach(row => {
                autofillResults.push({value: row['ID'],label: row['INSTNM']});
            });

            console.log(autofillResults);
        } catch (error) {
            console.error("Error gathering autofill data:", error);
        }
    }

    $(document).ready(async function() { //typing MECHANICS!
        await gatherAutofillData();
        var selectedIndex = -1; // To track the currently selected item index
        var lastKeyPressTime = 0;
        var lastKeyCode = null;
        
        function filterResults() {
            var input = $("#searchInput").val().toLowerCase();
            $("#autofillResults").empty();
            selectedIndex = -1; // Reset the selectedIndex on new input
        
            if(input !== '') {
                $.each(autofillResults, function(i, item) {
                    if(item.label.toLowerCase().indexOf(input) !== -1) {
                        var div = $("<div>").text(item.label).click(function() {
                            selectTag(item.label, item.value);
                        });
                        $("#autofillResults").append(div);
                    }
                });
                $("#autofillResults").show();
            } else {
                $("#autofillResults").hide();
            }
        }
        
        function highlightItem(index) {
            $("#autofillResults div").removeClass('highlighted');
            if (index >= 0) {
                $($("#autofillResults div")[index]).addClass('highlighted');
            }
        }
    
        function selectTag(label, value) {
            if(!$("#selectedTags .tag[data-value='" + value + "']").length) {
                var tag = $("<span>").addClass("tag").text(label).data('value', value).click(function() {
                    $(this).remove(); // Remove tag from UI
                });
                $("#selectedTags").append(tag);
            }
        }
    
        function removeMostRecentTag() {
            var lastTag = $("#selectedTags .tag").last();
            if (lastTag.length) {
                lastTag.remove(); // Remove the tag from UI
            }
        }
    
        $("#searchInput").on("input", filterResults);
    
        $("#searchInput").on("keydown", function(e) {
            var itemCount = $("#autofillResults div").length;
            var currentTime = new Date().getTime();
    
            if (e.keyCode === 40) { // Down arrow
                selectedIndex = (selectedIndex + 1) % itemCount;
                highlightItem(selectedIndex);
                e.preventDefault();
            } else if (e.keyCode === 38) { // Up arrow
                selectedIndex = (selectedIndex - 1 + itemCount) % itemCount;
                highlightItem(selectedIndex);
                e.preventDefault();
            } else if (e.keyCode === 13) { // Enter key
                if (selectedIndex >= 0) {
                    $($("#autofillResults div")[selectedIndex]).click();
                } else {
                    mapFromSearch(); // Call mapFromSearch when Enter is pressed and no item is selected
                }
            } else if (e.keyCode === 8) { // Backspace key
                if ($(this).val() === '' && lastKeyCode === 8 && (currentTime - lastKeyPressTime) < 500) {
                    removeMostRecentTag();
                }
                lastKeyPressTime = currentTime;
            }
    
            lastKeyCode = e.keyCode;
        });
        $(".to-map-button").click(mapFromSearch);
    });   

    function getRandomInstitutionName(csvData) {
        if (csvData.length === 0) {
            throw new Error("The CSV data is empty");
        }
        const randomIndex = Math.floor(Math.random() * csvData.length);
        return csvData[randomIndex].INSTNM;
    }
    
    async function typeAndDelete() {
        if (document.getElementById("searchInput").value !== '') {
            return; // Exit condition to stop the loop
        }
    
        if (typingInstance) {
            typingInstance.destroy(); // Clear existing instance if any
        }
    
        typingInstance = new TypeIt("#simpleUsage", {
            lifeLike: true,
            waitUntilVisible: true,
        });
    
        await typingInstance.type(getRandomInstitutionName(CSV)).go();
        await typingInstance.pause(Math.floor(Math.random() * (1200 - 800 + 1)) + 800);
        await typingInstance.delete();
    
        // Call the function again to create a continuous loop
        typeAndDelete();
    }
    
    document.getElementById("searchInput").addEventListener("input", () => {
        if (typingInstance) {
            typingInstance.destroy(); // Stop ongoing typing
            typingInstance = null;
        }
        clearTimeout(typingTimeout); // Clear the timeout to prevent re-triggering the typing
    
        const inputVal = document.getElementById("searchInput").value;
        document.getElementById("simpleUsage").innerHTML = ''; // Clear the content of the typing area
    
        if (inputVal === '') {
            // Only start typing again if the input box is empty and there's no ongoing typing
            typeAndDelete();
        }

    });
    typeAndDelete();

}

async function mapFromSearch() {
    const stepOne = document.getElementById("stepOne");
    const stepTwo = document.getElementById("stepTwo");

    let selectedIds = await makeSelectedIds();
    console.log(selectedIds)


    if (selectedIds.length >= 2) {
        const uniqueIds = new Set(selectedIds);
    
        // Check if there are duplicates by comparing the size of the Set to the length of the array
        if (uniqueIds.size === selectedIds.length) {
            coordinatesObject = await groupSchoolsBySearch();
            findCenterOfSchools(coordinatesObject);
            initializeMap();
    
            stepOne.style.display = "none";
            stepTwo.style.display = "block";
    
            console.log(groupedSchools);
            console.log("Groups: " + (groupedSchools.length));
    
            displayTripInformation();
            async function displayTripInformation() {
                const tripInfoMenuContainer = document.getElementById('trip-information-menu');
    
                var header = document.createElement('h1')
                
                let tripText = "trip is required to visit all schools.";
                if (groupedSchools.length > 1) {
                    tripText = "trips are required to visit all schools.";
                }
                header.textContent = groupedSchools.length + " " + tripText;
                await tripInfoMenuContainer.appendChild(header)
    
                groupedSchools.forEach((group, index) => {
                    const tripContainer = document.createElement('div') //trip container
                    tripContainer.id = ("trip-" + (index + 1)) //id
    
                    tripTitle = document.createElement('h2')
                    tripTitle.textContent = ("Trip " + (index + 1))
                    tripContainer.appendChild(tripTitle)
    
    
    
                    group.forEach((school) => {
                        schoolContainer = document.createElement('div')
                        schoolContainer.id = school.name
    
                        nombre = document.createElement('p')
                        nombre.textContent = school.name
    
                        website = document.createElement('p')
                        website.textContent = school.site
    
                        schoolContainer.appendChild(nombre)
                        schoolContainer.appendChild(website)
                        
                        tripContainer.appendChild(schoolContainer)
                    })
                    
    
    
    
                    tripInfoMenuContainer.appendChild(tripContainer)
                })
            }
    
        } else {
            selectedIds.length = 0
            console.log("Duplicate IDs");
        }
    } else {
        selectedIds.length = 0
        console.log("<2 schools"); // Consider displaying this message in the UI for better user experience
    }
    
}

async function moveToSearch() {
    const stepOne = document.getElementById("stepOne");
    const stepTwo = document.getElementById("stepTwo");

    $("#selectedTags").html("");
    selectedIds.length = 0

    stepOne.style.display = "block";
    stepTwo.style.display = "none";
}