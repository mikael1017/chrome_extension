// popup.js

// Function to populate the grid with tabs
function populateTabs() {
	chrome.tabs.query({}, function (tabs) {
		const tabGrid = document.getElementById("tabGrid");
		tabGrid.innerHTML = ""; // Clear existing content

		tabs.forEach(function (tab) {
			const tabItem = document.createElement("div");
			tabItem.classList.add("tab-item");
			tabItem.textContent = tab.title;

			// Open the tab when clicked
			tabItem.addEventListener("click", function () {
				chrome.tabs.update(tab.id, { active: true });
			});

			tabGrid.appendChild(tabItem);
		});
	});
}

// Populate the grid when the popup is loaded
document.addEventListener("DOMContentLoaded", populateTabs);
