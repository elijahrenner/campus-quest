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
        checkbox.id = `college${index}`;
        checkbox.name = `college${index}`;
        
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
