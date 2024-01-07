let selectedIds = [];
let coordinatesObject = {};
let groupedSchools = []; 

const USA_BOUNDS = {
    north: 49.3457868,
    south: 24.7433195,
    west: -124.7844079,
    east: -66.9513812,
};

function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}    

function makeSelectedIds() {
    $("#selected-tags .tag").each(function() {
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
        let group = [{ name: school1, id: coordinatesObject[school1].id, site: coordinatesObject[school1].site, city: coordinatesObject[school1].city, state: coordinatesObject[school1].state, city: coordinatesObject[school1].city}];

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
    selectedIds.length = 0
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
    const city = row['CITY']
    const state = row['STABBR']
    coordinatesObject[row['INSTNM']] = { latitude: lat, longitude: lon, id: id, site: website, city: city, state: state};
}

main();
async function main() {
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
        
            if (input !== '') {
                $.each(autofillResults, function (i, item) {
                    if (item.label.toLowerCase().indexOf(input) !== -1) {
                        var paragraph = $("<p>").text(item.label).click(function () {
                            selectTag(item.label, item.value);
                        });
                        $("#autofillResults").append(paragraph);
                    }
                });
                $("#autofillResults").show();
            } else {
                $("#autofillResults").hide();
            }
        }
        
        
        function highlightItem(index) {
            $("#autofillResults p").removeClass('highlighted');
            if (index >= 0) {
                $($("#autofillResults p")[index]).addClass('highlighted');
        
                // Scroll to the highlighted item for better visibility if needed
                $($("#autofillResults p")[index])[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'start'
                });
            }
        }
        
    
        function selectTag(label, value) {
            // Check if the tag already exists based on the data-value attribute
            var tagExists = $("#selected-tags").find("[data-value='" + value + "']").length > 0;
        
            if (!tagExists) {
                var tag = $("<span class='selected-tag tag'>").text(label + " ✕").data('value', value).click(function() {
                    $(this).remove(); // Remove tag from UI
                });
                $("#selected-tags").append(tag);
            }
        }
        
    
        function removeMostRecentTag() {
            var lastTag = $("#selected-tag").last();
            if (lastTag.length) {
                lastTag.remove(); // Remove the tag from UI
            }
        }
    
        $("#searchInput").on("input", filterResults);
    
        $("#searchInput").on("keydown", function(e) {
            var itemCount = $("#autofillResults p").length;
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
                    $($("#autofillResults p")[selectedIndex]).click();
                } else {
                    mapFromSearch(); // Call mapFromSearch when Enter is pressed and no item is selected
                }
            
            } else if (e.keyCode === 8) { // Backspace key
                if ($(this).val() === '' && lastKeyCode === 8 && (currentTime - lastKeyPressTime) < 500) {
                    removeMostRecentTag();
                }
                lastKeyPressTime = currentTime;
            } else if (e.keyCode === 27) { // Escape key
                moveToSearch();
            }
    
            lastKeyCode = e.keyCode;
        });
        $(".to-map-button").click(mapFromSearch);
    });   

}

async function mapFromSearch() {
    let selectedIds = await makeSelectedIds();
    console.log(selectedIds)

    if (selectedIds.length >= 2) {
        const uniqueIds = new Set(selectedIds);
    
        // Check if there are duplicates by comparing the size of the Set to the length of the array
        if (uniqueIds.size === selectedIds.length) {
            coordinatesObject = await groupSchoolsBySearch();
    
            console.log(groupedSchools);
            console.log("Groups: " + (groupedSchools.length));
    
            displayTripInformation();
            async function displayTripInformation() {
                const tripInfoMenuContainer = document.getElementById('trip-information-menu');
    
                var back = document.createElement('button')
                back.className = "to-search-button"
                back.onclick = moveToSearch;
                back.textContent = "Back"
                tripInfoMenuContainer.appendChild(back)

                var header = document.createElement('h2')
                
                if (groupedSchools.length > 1) {
                    tripText = "trips. 🤩";
                    header.textContent = "Your schools should be visited in " + groupedSchools.length + " " + tripText;
                } else {
                    header.textContent = "Woohoo! You only need one trip. 🎉"
                }
                
                await tripInfoMenuContainer.appendChild(header)
    
                groupedSchools.forEach((group, index) => {
                    const tripContainer = document.createElement('div') //trip container
                    tripContainer.id = ("trip-" + (index + 1)) //id
    
                    tripTitle = document.createElement('h3')
                    
                    if (groupedSchools.length <= 1) {
                        tripTitle.textContent = ("Your trip:")
                    } else {
                        tripTitle.textContent = ("Trip " + (index + 1))
                    }
                    
                    tripContainer.appendChild(tripTitle)
    
                    group.forEach((school) => {
                        schoolContainer = document.createElement('div')
                        schoolContainer.id = school.name
    
                        nombre = document.createElement('p')
                        nombre.textContent = school.name + " (" + school.city + ", " + school.state + ")"
                        
                        var website = document.createElement('a');
                        website.setAttribute('href', '#');
                        website.setAttribute('onclick', "window.location.href='" + "https://" + school.site + "'; return false;");
                        website.textContent = school.site;
    
                        schoolContainer.appendChild(nombre)
                        schoolContainer.appendChild(website)
                        
                        tripContainer.appendChild(schoolContainer)
                    })
                    tripInfoMenuContainer.appendChild(tripContainer)
                })
                
                selected = document.getElementById("selected-tags");
                selected.remove();

                bar = document.getElementById("searchInput");
                bar.remove();

                calculate = document.getElementById("to-map-button")
                calculate.remove();

                initializeMap();
                findCenterOfSchools(coordinatesObject);
            }
    
        } else {
            selectedIds.length = 0
            errorDiv = document.getElementById("errors");
            errorDiv.textContent = "Oops. Make sure you only select each school once!";
        }
    } else {
        selectedIds.length = 0
        errorDiv = document.getElementById("errors");
        errorDiv.textContent = "Please select at least two schools."; // Consider displaying this message in the UI for better user experience
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

async function moveToSearch() {
    $("#selected-tags").html("");
    selectedIds.length = 0
    window.open("index.html","_self")
}


