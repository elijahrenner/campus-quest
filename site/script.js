document.addEventListener("DOMContentLoaded", function() {
    const checkboxContainer = document.querySelector(".checkbox_container");

    colleges.forEach((collegeName, index) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "favorite"
        checkbox.id = `college${index}`;
        checkbox.name = `college${index}`;
    
        const label = document.createElement("label");
        label.htmlFor = `college${index}`;
        label.textContent = collegeName;
    
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        checkboxContainer.appendChild(document.createElement("br"));
    });
});
